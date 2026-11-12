#!/usr/bin/env node
// Is anything inside a window cut off? Draws the film at a regular step (default every 0.5 s) and, in every spatial window (.sp-win),
// looks at each element that clips (overflow hidden or clip, on either axis): its content must fit its box (scrollWidth and scrollHeight
// no more than 1 px over the client size) and no image inside it may be wider or taller than it. A fault that overflow hides is still a
// fault: a page capture wider than its card showed "Alberta Child and Fan" in a delivered preview (film #2, owner review).
//   nice node tools/overflow-check.mjs --project <film dir> [--step 0.5] [--from s --to s]
// A view that is MEANT to clip (a browser view that scrolls a long page) carries the attribute data-viewport; it and what is inside it
// are skipped. The window's own body (.sp-body) is checked too. Exit code 1 if anything is cut.
import { openFilm } from './lib/film-page.mjs';
import path from 'node:path';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const project = path.resolve(arg('project', '.')), step = +arg('step', 0.5);
const { page, close } = await openFilm({ project });
const { FPS, DUR } = await page.evaluate(() => ({ FPS: window.film.FPS, DUR: window.film.DUR }));
const t0 = +arg('from', 0), t1 = Math.min(DUR, +arg('to', DUR)), found = new Map(); let frames = 0;
for (let t = t0; t < t1; t += step) { frames++;
  const hits = await page.evaluate(async n => { await window.film.frame(n); const out = [];
    for (const win of document.querySelectorAll('.sp-win')) { if (win.style.display === 'none' || +win.style.opacity < 0.02) continue;
      for (const el of win.querySelectorAll('*')) { if (el.closest('[data-viewport]') || el.closest('svg')) continue; const cs = getComputedStyle(el);
        if (!/hidden|clip/.test(cs.overflowX + cs.overflowY) || el.clientWidth < 4 || el.clientHeight < 4) continue;
        const dx = el.scrollWidth - el.clientWidth, dy = el.scrollHeight - el.clientHeight;
        // the window's body is the window less its border: a screen sized to the window is over by the border, which is not a cut
        const wb = getComputedStyle(win), tol = el.classList.contains('sp-body') ? 1 + Math.ceil(parseFloat(wb.borderLeftWidth) + parseFloat(wb.borderRightWidth)) : 1;
        if (dx > tol || dy > tol) out.push([win.id || win.dataset.id || '', (el.className && el.className.baseVal === undefined ? String(el.className) : el.tagName).trim().split(/\s+/).slice(0, 3).join('.') || el.tagName, Math.max(0, dx), Math.max(0, dy)]); } }
    return out; }, Math.round(t * FPS));
  for (const [win, cls, dx, dy] of hits) { const k = cls; const f = found.get(k) || { first: t, last: t, dx: 0, dy: 0, n: 0 }; f.last = t; f.dx = Math.max(f.dx, dx); f.dy = Math.max(f.dy, dy); f.n++; found.set(k, f); } }
await close();
console.log(`overflow check: ${frames} frames (every ${step} s), ${found.size} clipped element(s)`);
for (const [k, f] of found) console.log(`  .${k}: content ${f.dx ? f.dx + ' px too wide' : ''}${f.dx && f.dy ? ', ' : ''}${f.dy ? f.dy + ' px too tall' : ''}, ${f.first.toFixed(1)} to ${f.last.toFixed(1)} s`);
process.exit(found.size ? 1 : 0);
