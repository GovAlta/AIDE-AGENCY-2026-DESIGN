// Parallel frame renderer. Each worker is its own headless browser; a frame is a pure function of its number, so workers can take any frames in any order.
//   node render.mjs --frames 0-11855 --workers 20 --out out/frames            full render
//   node render.mjs --every 120 --out out/preview --workers 12                one frame every 2 s (preview)
//   node render.mjs --times 12.5,66,110 --out out/check                       named seconds
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const FPS = 60, DUR = 197.6, TOTAL = Math.round(DUR * FPS);
const out = arg('out', 'out/frames'), workers = +arg('workers', 16), quality = +arg('quality', 95);
let frames = [];
if (arg('times')) frames = arg('times').split(',').map(s => Math.round(+s * FPS));
else if (arg('every')) for (let f = 0; f < TOTAL; f += +arg('every')) frames.push(f);
else { const [a, b] = (arg('frames', `0-${TOTAL - 1}`)).split('-').map(Number); for (let f = a; f <= b; f++) frames.push(f); }
fs.mkdirSync(out, { recursive: true });
const name = f => path.join(out, `f${String(f).padStart(6, '0')}.jpg`);
if (!process.argv.includes('--force')) frames = frames.filter(f => !fs.existsSync(name(f)));
console.log(`${frames.length} frames to render with ${workers} workers -> ${out}`);
const t0 = Date.now(); let done = 0, next = 0, failed = 0;
// contiguous chunks per worker keep each browser's tile cache warm
const chunk = Math.max(1, Math.ceil(frames.length / (workers * 6)));
const take = () => { if (next >= frames.length) return null; const c = frames.slice(next, next + chunk); next += chunk; return c; };
const browsers = new Set();
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(sig, async () => { console.log('stopping:', sig); await Promise.all([...browsers].map(b => b.close().catch(() => {}))); process.exit(1); });
async function worker(id) {
  let browser, page, cdp;
  const open = async () => { browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'] }); browsers.add(browser);
    page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.log(`[w${id}] PAGEERROR`, e.message.slice(0, 200)));
    await page.goto(`http://127.0.0.1:${process.env.FILM_PORT || 3222}/`, { waitUntil: 'load' }); await page.waitForFunction('window.filmReady === true', null, { timeout: 300000 }); cdp = await page.context().newCDPSession(page); };
  await open();
  for (let c = take(); c; c = take()) for (const f of c) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { await Promise.race([page.evaluate(n => window.film.frame(n), f), new Promise((_, rej) => setTimeout(() => rej(new Error('seek timeout')), 240000))]);
        const shot = await Promise.race([cdp.send('Page.captureScreenshot', { format: 'jpeg', quality }), new Promise((_, rej) => setTimeout(() => rej(new Error('capture timeout')), 240000))]);
        fs.writeFileSync(name(f) + '.tmp', Buffer.from(shot.data, 'base64')); fs.renameSync(name(f) + '.tmp', name(f)); done++; break;
      } catch (e) { console.log(`[w${id}] frame ${f} attempt ${attempt + 1}: ${e.message.slice(0, 120)}`); browsers.delete(browser); try { await browser.close(); } catch {} await open(); if (attempt === 2) failed++; }
    }
    if (done % 50 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${done}/${frames.length}  ${(el / done).toFixed(2)} s/frame overall  eta ${((frames.length - done) * el / done / 60).toFixed(1)} min`); }
  }
  await browser.close();
}
await Promise.all(Array.from({ length: Math.min(workers, frames.length) }, (_, i) => worker(i)));
console.log(`done ${done}, failed ${failed}, ${((Date.now() - t0) / 60000).toFixed(1)} min`);
