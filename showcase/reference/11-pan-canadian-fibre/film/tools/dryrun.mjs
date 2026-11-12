// Evaluates the timeline for every frame without drawing: catches script errors and reports the heaviest frames.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(`http://127.0.0.1:${process.env.FILM_PORT || 3222}/`, { waitUntil: 'load' });
await p.waitForFunction('window.filmReady === true', null, { timeout: 900000 });
console.log(JSON.stringify(await p.evaluate(() => { const { TL, DUR, FPS } = window.film; const errs = []; let maxP = 0, maxPt = 0, nan = 0; const t0 = performance.now();
  for (let f = 0; f < Math.round(DUR * FPS); f++) { try { const s = TL.stateAt(f / FPS); if (s.pulses.length > maxP) { maxP = s.pulses.length; maxPt = f / FPS; }
      for (const k of ['lng', 'lat', 'zoom', 'pitch', 'bearing']) if (!Number.isFinite(s.cam[k])) nan++; if (s.cam.pitch > 78 || s.cam.pitch < 0) nan++; } catch (e) { if (errs.length < 5) errs.push(`${(f / FPS).toFixed(2)}: ${e.message}`); } }
  return { errs, maxPulses: maxP, at: maxPt, badCam: nan, msPerState: (performance.now() - t0) / (DUR * FPS), caps: TL.CAPS.length }; }), null, 1));
await b.close();
