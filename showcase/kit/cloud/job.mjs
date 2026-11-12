// One Cloud Run job task: renders its share of the frame list and sends each JPEG to the receiver on the VM (private network).
// Env: FRAMES ("a-b,c-d,…"), SINK (http://<vm private ip>:<port>), FARM_TOKEN, QUALITY (95); Cloud Run sets CLOUD_RUN_TASK_INDEX and CLOUD_RUN_TASK_COUNT.
// The container holds the kit at /app/kit and the film project at /app/project (cloud/build-context.sh).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const { FRAMES, SINK, FARM_TOKEN, QUALITY = '95' } = process.env;
const idx = +(process.env.CLOUD_RUN_TASK_INDEX || 0), count = +(process.env.CLOUD_RUN_TASK_COUNT || 1);
const ping = await fetch(SINK + '/ping', { signal: AbortSignal.timeout(20000) }).then(r => r.text()).catch(e => `FAIL ${e.message} ${e.cause?.code || ''}`);
console.log('PROBE', ping); if (ping !== 'pong') process.exit(1);
if (!FRAMES) process.exit(0);
const all = []; for (const part of FRAMES.split(',')) { const [a, b] = part.split('-').map(Number); for (let f = a; f <= (b ?? a); f++) all.push(f); }
// contiguous shares keep each browser on one scene (warm tiles and images)
const per = Math.ceil(all.length / count), mine = all.slice(idx * per, (idx + 1) * per);
console.log(`task ${idx}/${count}: ${mine.length} frames ${mine[0]}..${mine[mine.length - 1]}`);
if (!mine.length) process.exit(0);
const server = spawn('node', ['/app/kit/server.mjs', '--project', '/app/project', '--port', '3222'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise(r => server.stdout.on('data', d => { if (String(d).includes('film server')) r(); }));
let browser, page, cdp;
const open = async () => { if (browser) await browser.close().catch(() => {});
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage', '--no-sandbox'] });
  page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0, 300)));
  await page.goto('http://127.0.0.1:3222/', { waitUntil: 'load' }); await page.waitForFunction('window.filmReady === true', null, { timeout: 900000 });
  // a page that hit a load error while starting draws frames with things missing: refuse it and open a new one
  const initErrors = await page.evaluate(() => window.filmInitErrors); if (initErrors) throw new Error(`page started with ${initErrors} load error(s)`);
  cdp = await page.context().newCDPSession(page); };
for (let tries = 1; !cdp; tries++) { try { await open(); } catch (e) { console.log(`open attempt ${tries}: ${e.message}`); cdp = null; if (tries >= 5) process.exit(1); } }
let failed = 0, unstable = 0; const t0 = Date.now();
for (const [i, f] of mine.entries()) {
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    try { if (!cdp) await open(); await page.evaluate(n => window.film.frame(n), f);
      // A STABLE capture: the page is still, so two screenshots of it must be the same picture. If they are not, the compositor had not
      // finished (a layer or a backdrop filter drawn one frame late: film #1 had one-frame flashes of a window's fill on the farm, never
      // on one local browser); capture again until two in a row agree (at most 5), and send the last.
      let shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: +QUALITY });
      for (let k = 0; k < 4; k++) { const again = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: +QUALITY }); const same = again.data === shot.data; shot = again; if (same) break; if (k === 0) unstable++; }
      const body = Buffer.from(shot.data, 'base64');
      for (let s = 0; s < 5 && !ok; s++) { const r = await fetch(`${SINK}/frame/${f}?token=${FARM_TOKEN}`, { method: 'PUT', body, signal: AbortSignal.timeout(60000) }).catch(() => null); ok = !!r && r.ok; if (!ok) await new Promise(r2 => setTimeout(r2, 2000 * (s + 1))); }
      if (!ok) throw new Error('receiver refused the frame');
    } catch (e) { console.log(`frame ${f} attempt ${attempt + 1}: ${String(e.message).slice(0, 200)}`); cdp = null; }
  }
  if (!ok) failed++;
  if ((i + 1) % 20 === 0) console.log(`task ${idx}: ${i + 1}/${mine.length}, ${((Date.now() - t0) / (i + 1) / 1000).toFixed(1)} s/frame`);
}
await browser?.close().catch(() => {}); server.kill('SIGTERM');
console.log(`task ${idx} done, failed ${failed}, frames that needed a second look ${unstable}`); process.exit(failed ? 1 : 0);
