// Opens a film project in one headless browser: starts the kit server on a free port (unless --port is given), waits for
// window.filmReady, and refuses a page that started with load errors. One browser, niced by the caller: safe on the shared VM.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
export const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
export async function openFilm({ project = arg('project', '.'), port = arg('port'), query = '' } = {}) {
  let server = null;
  if (!port) { port = await freePort();
    server = spawn('node', [path.join(KIT, 'server.mjs'), '--project', path.resolve(project), '--port', String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
    await new Promise((res, rej) => { server.stdout.on('data', d => { if (String(d).includes('film server')) res(); }); server.on('exit', c => rej(new Error('server exited ' + c))); }); }
  const browser = await chromium.launch({ args: GL_ARGS });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  // an error before the page is ready (a syntax error in timeline.js) fails at once instead of waiting out the 15-minute timeout
  let failStart; const startFailed = new Promise((_, rej) => { failStart = rej; });
  page.on('pageerror', e => { console.log('PAGEERROR', e.message.slice(0, 300)); failStart(new Error('the film page threw before it was ready: ' + e.message.slice(0, 200))); });
  await page.goto(`http://127.0.0.1:${port}/${query ? '?' + query : ''}`, { waitUntil: 'load' });
  try { await Promise.race([page.waitForFunction('window.filmReady === true', null, { timeout: 900000 }), startFailed]); }
  catch (e) { await browser.close().catch(() => {}); if (server) server.kill('SIGTERM'); throw e; }
  const initErrors = await page.evaluate(() => window.filmInitErrors);
  if (initErrors) throw new Error(`page started with ${initErrors} load error(s): fix the asset paths before rendering`);
  const close = async () => { await browser.close().catch(() => {}); if (server) server.kill('SIGTERM'); };
  for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, async () => { await close(); process.exit(1); });
  return { page, browser, port, close, info: await page.evaluate(() => ({ DUR: window.film.DUR, FPS: window.film.FPS })) };
}
