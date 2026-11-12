// Render service for a temporary Cloud Run "render farm". One instance = one headless browser = one request at a time.
//   GET  /health                  -> { ok, ready }
//   POST /render { frames: [n, ...], quality, query }   -> newline-delimited JSON, one line per frame: { f, ms, jpg (base64) } or { f, error }
// The film page and its tile cache are served inside the instance by server.mjs.
import http from 'node:http';
import os from 'node:os';
import { chromium } from 'playwright';
import './server.mjs';

const PORT = Number(process.env.PORT || 8080);
let browser, page, cdp, query = null, opening = null;
async function open(q) {
  if (browser) await browser.close().catch(() => {});
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage', '--no-sandbox'] });
  page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0, 300)));
  await page.goto(`http://127.0.0.1:${process.env.FILM_PORT || 3222}/${q ? '?' + q : ''}`, { waitUntil: 'load' });
  await page.waitForFunction('window.filmReady === true', null, { timeout: 600000 });
  cdp = await page.context().newCDPSession(page); query = q;
}
const ensure = q => (opening = (opening || Promise.resolve()).catch(() => {}).then(() => (browser && query === q ? null : open(q))));
ensure('').then(() => console.log('browser ready,', os.cpus().length, 'cpus')).catch(e => console.log('open failed', e.message));

let chain = Promise.resolve();
http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url.startsWith('/health')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ ok: true, ready: !!cdp, cpus: os.cpus().length })); }
  if (req.method !== 'POST' || !req.url.startsWith('/render')) { res.writeHead(404); return res.end(); }
  let body = ''; for await (const c of req) body += c;
  let job; try { job = JSON.parse(body); } catch { res.writeHead(400); return res.end('bad json'); }
  res.writeHead(200, { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' });
  const run = async () => {
    for (const f of job.frames) {
      let line;
      for (let attempt = 0; attempt < 3 && !line; attempt++) {
        try { await ensure(job.query || ''); const t0 = Date.now();
          await page.evaluate(n => window.film.frame(n), f);
          const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: job.quality || 95 });
          line = { f, ms: Date.now() - t0, jpg: shot.data };
        } catch (e) { console.log(`frame ${f} attempt ${attempt + 1}: ${String(e.message).slice(0, 200)}`); browser = null; cdp = null; if (attempt === 2) line = { f, error: String(e.message).slice(0, 300) }; }
      }
      res.write(JSON.stringify(line) + '\n');
    }
    res.end();
  };
  chain = chain.then(run, run);
}).listen(PORT, '0.0.0.0', () => console.log('render service on', PORT));
