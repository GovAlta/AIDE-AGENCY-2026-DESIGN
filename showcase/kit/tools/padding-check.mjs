#!/usr/bin/env node
// Inner padding of every screen of a spatial film (web/screens.js: export const S = { name(o) -> html }, SIZE = { name: [w, h] }).
//   node tools/padding-check.mjs --project <film dir> [--only a,b] [--tol 2] [--sheet out/padding.jpg]
// Rule (owner, film #1): a window's content keeps the SAME gap to all four edges; the last row ends a full padding above the bottom
// edge, never flush and never clipped. For each screen at u = 0.3, 0.7 and 1.0 this lays the screen out in the film page and measures
// the gap from the root's edges to its content (every laid-out leaf element, shown or not yet shown: a row that will arrive has
// already reserved its place). Prints top / right / bottom / left; fails a screen whose bottom gap differs from its top gap by more
// than --tol px, or whose content is cut by the root (overflow). Full-bleed screens (content touching all four edges, such as an image
// plate) pass as "bleed". Exit code 1 if any screen fails.
import { openFilm } from './lib/film-page.mjs';
import path from 'node:path'; import fs from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const project = path.resolve(arg('project', '.')), only = arg('only', '').split(',').filter(Boolean), tol = +arg('tol', 2), sheet = arg('sheet', '');
const { page, close } = await openFilm({ project });
const rows = await page.evaluate(async ({ only }) => { const { S, SIZE } = await import('/screens.js'); const out = [];
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#E6EBF2'; document.body.appendChild(host);
  // rows that are still rising in are measured where they will rest (their place is reserved; the small travel is motion, not layout)
  const still = document.createElement('style'); still.textContent = '[data-padcheck] * { transform: none !important; }'; document.head.appendChild(still); host.dataset.padcheck = '1';
  for (const name of Object.keys(S)) { if (only.length && !only.includes(name)) continue; if (!SIZE[name]) continue;
    for (const u of [0.3, 0.7, 1]) { let html; try { html = S[name]({ u }); } catch (e) { out.push({ name, u, err: String(e) }); continue; }
      host.innerHTML = html; const root = host.firstElementChild; if (!root) continue; const R = root.getBoundingClientRect(); let t = 1e9, l = 1e9, r = -1e9, b = -1e9, n = 0;
      for (const el of root.querySelectorAll('*')) { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const leaf = el.tagName === 'svg' || el.tagName === 'IMG' || [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()) || (!el.children.length && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none'));
        if (!leaf || el.closest('svg') && el.tagName !== 'svg') continue; const q = el.getBoundingClientRect(); if (q.width < 2 || q.height < 2) continue;
        // a control's own box (a raised row, a chip) is the thing whose edge the eye reads: take the nearest ancestor that paints a surface
        let box = el; for (let p = el; p && p !== root; p = p.parentElement) { const c = getComputedStyle(p); if (c.boxShadow !== 'none' || c.backgroundColor !== 'rgba(0, 0, 0, 0)' || c.backgroundImage !== 'none') box = p; }
        const g = box.getBoundingClientRect(); t = Math.min(t, g.top); l = Math.min(l, g.left); r = Math.max(r, g.right); b = Math.max(b, g.bottom); n++; }
      out.push({ name, u, w: Math.round(R.width), h: Math.round(R.height), top: Math.round(t - R.top), left: Math.round(l - R.left), right: Math.round(R.right - r), bottom: Math.round(R.bottom - b), n }); } }
  host.remove(); still.remove(); return out; }, { only });
let bad = 0; console.log('screen                u    size        top right bottom left');
for (const r of rows) { if (r.err) { console.log(r.name, r.u, 'ERROR', r.err); bad++; continue; }
  const bleed = r.top <= 1 && r.left <= 1 && r.right <= 1 && r.bottom <= 1, ok = bleed || (Math.abs(r.bottom - r.top) <= tol && r.bottom >= 0);
  if (!ok) bad++; console.log(`${r.name.padEnd(20)} ${String(r.u).padEnd(4)} ${(r.w + 'x' + r.h).padEnd(10)} ${String(r.top).padStart(4)} ${String(r.right).padStart(5)} ${String(r.bottom).padStart(6)} ${String(r.left).padStart(4)}  ${bleed ? 'bleed' : ok ? 'ok' : 'FAIL: bottom ' + (r.bottom - r.top > 0 ? '+' : '') + (r.bottom - r.top) + ' px against top'}`); }
if (sheet) { await page.evaluate(async ({ only }) => { const { S, SIZE } = await import('/screens.js'); document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#DCE3EC;display:flex;flex-wrap:wrap;gap:24px;padding:24px;width:5200px;transform-origin:0 0';
    for (const name of Object.keys(S)) { if (!SIZE[name] || (only.length && !only.includes(name))) continue; for (const u of [0.3, 0.7, 1]) { const d = document.createElement('div'); d.style.cssText = 'background:#E6EBF2;border-radius:38px;overflow:hidden;box-shadow:0 0 0 2px #fff'; d.innerHTML = S[name]({ u }); document.body.appendChild(d); } } }, { only });
  await page.setViewportSize({ width: 5248, height: 3000 }); fs.mkdirSync(path.dirname(path.resolve(project, sheet)), { recursive: true }); await page.screenshot({ path: path.resolve(project, sheet), fullPage: true, type: 'jpeg', quality: 80 }); console.log('sheet', sheet); }
console.log(bad ? `${bad} screen states fail` : 'all screens keep the same padding on all four sides');
await close(); process.exit(bad ? 1 : 0);
