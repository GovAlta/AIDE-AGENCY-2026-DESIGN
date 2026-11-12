// Evaluates stateAt for every frame without drawing: catches script errors, bad numbers and missing captions before any render.
//   node tools/dryrun.mjs --project <film dir>
import { openFilm } from './lib/film-page.mjs';
const { page, close, info } = await openFilm();
const r = await page.evaluate(() => { const { TL, DUR, FPS } = window.film, errs = [], bad = []; const t0 = performance.now(); const n = Math.round(DUR * FPS);
  const finite = (o, p = '') => { if (o === null || o === undefined) return; if (typeof o === 'number') { if (!Number.isFinite(o)) bad.push(p); return; } if (typeof o === 'object') for (const [k, v] of Object.entries(o)) if (typeof v !== 'function') finite(v, p + '.' + k); };
  const ph = new Set();
  for (let f = 0; f < n; f++) { try { const s = TL.stateAt(f / FPS); if (f % 30 === 0) { finite(s, `t=${(f / FPS).toFixed(2)}`);
      // starter placeholders must never reach a render: [[ … ]], EXAMPLE:, "replace before review"
      const m = JSON.stringify(s).match(/\[\[[^\]]*\]\]|EXAMPLE[: ]|replace before review/i); if (m && !ph.has(m[0])) { ph.add(m[0]); errs.push(`${(f / FPS).toFixed(2)} s: placeholder text on screen: ${m[0]}`); } } } catch (e) { if (errs.length < 8) errs.push(`${(f / FPS).toFixed(2)} s: ${e.message}`); } }
  return { frames: n, errors: errs, nonFinite: [...new Set(bad)].slice(0, 12), msPerState: +((performance.now() - t0) / n).toFixed(3) }; });
console.log(JSON.stringify({ ...info, ...r }, null, 1));
await close(); process.exit(r.errors.length || r.nonFinite.length ? 1 : 0);
