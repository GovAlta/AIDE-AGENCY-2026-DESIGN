// Compares camera smoothness of two timeline versions over the chase (no rendering: evaluates stateAt only).
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`http://127.0.0.1:${process.env.FILM_PORT || 3222}/`, { waitUntil: 'load' }); await p.waitForFunction('window.filmReady === true', null, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(async () => {
  const timing = await (await fetch('/narration/timing.json')).json(); const out = {};
  for (const [name, url] of [['before', '/timeline-v1.js'], ['after', '/timeline.js?v=2']]) {
    const { createTimeline } = await import(url); const TL = createTimeline(window.film.M, timing);
    const bs = [], xs = [], ys = []; for (let f = Math.round(106.44 * 60) + 1; f <= Math.round(116 * 60); f++) { const c = TL.stateAt(f / 60).cam; bs.push(c.bearing); xs.push(c.lng); ys.push(c.lat); }
    const d1 = a => a.slice(1).map((v, i) => v - a[i]); const rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
    const bv = d1(bs).map(v => (((v + 540) % 360) - 180) * 60), ba = d1(bv).map(v => v * 60);
    out[name] = { maxBearingSpeed_degPerS: +Math.max(...bv.map(Math.abs)).toFixed(1), rmsBearingAccel: +rms(ba).toFixed(1), rmsCentreAccel: +rms(d1(d1(xs))).toFixed(6) };
  } return out; }), null, 1));
await b.close();
