// Camera smoothness report over a time range: the fastest change and the shake (RMS of the second difference) of every numeric
// camera channel: the world camera (state.cam) and each plate's cam. Use it after any camera change; a fast chase should stay
// under about 30 deg/s of turn. Angles are unwrapped.
//   node tools/camcheck.mjs --project <film dir> --from 106.5 --to 116
import { openFilm, arg } from './lib/film-page.mjs';
const { page, close } = await openFilm();
const r = await page.evaluate(([a, b]) => { const { TL, FPS } = window.film, rows = {};
  const put = (k, v) => (rows[k] ||= []).push(v);
  for (let f = Math.ceil(a * FPS); f <= Math.floor(b * FPS); f++) { const s = TL.stateAt(f / FPS);
    for (const [k, v] of Object.entries(s.cam || {})) if (typeof v === 'number') put('cam.' + k, v);
    for (const p of s.plates || []) for (const [k, v] of Object.entries({ ...(p.cam || {}), rotX: p.rotX || 0, rotY: p.rotY || 0 })) if (typeof v === 'number') put(`plate:${p.id}.${k}`, v); }
  const out = {};
  for (const [k, v] of Object.entries(rows)) { const ang = /bearing|rot/.test(k); const d = v.slice(1).map((x, i) => { let dd = x - v[i]; if (ang) dd = ((dd + 540) % 360) - 180; return dd * FPS; });
    const acc = d.slice(1).map((x, i) => (x - d[i]) * FPS); out[k] = { maxSpeedPerS: +Math.max(...d.map(Math.abs)).toFixed(3), rmsAccel: +Math.sqrt(acc.reduce((s, x) => s + x * x, 0) / Math.max(1, acc.length)).toFixed(3) }; }
  return out; }, [+arg('from', 0), +arg('to', 10)]);
console.table(r); await close();
