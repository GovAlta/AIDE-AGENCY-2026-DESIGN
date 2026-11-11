// Shared helpers for on-site large-format pieces (templates/onsite/*).
// Each piece is designed on a fixed canvas in design units (for example 1920 x 1080 for a 16:9 stage backdrop) and scaled to its real
// size in inches with CSS zoom, so the PDF is vector at trim size and layouts can be reasoned about in round numbers.
// Only vector marks are used (the Alberta logo SVG, the outlined Agency wordmark), so nothing pixelates at 16 ft.
import fs from 'node:fs';
import path from 'node:path';
import { T, esc, md, ROOT, tracesLayer, icon } from '../../lib/components.mjs';
import { chip as chipSvg, svgDoc } from '../../../scripts/lib/vectors.mjs';
import { qrSvg } from '../../../scripts/lib/qr.mjs';

export { T, esc, md, icon };
export const E = T.event;
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const LOGO = read('brand/logos/alberta-logo.svg').replace(/ width="[^"]*" height="[^"]*"/, '');
const WORD = read('brand/logos/agency-2026-wordmark-outlined.svg').replace(/ width="[^"]*" height="[^"]*"/, '');
const WORD_W = read('brand/logos/agency-2026-wordmark-white-outlined.svg').replace(/ width="[^"]*" height="[^"]*"/, '');
let uid = 0;
const uniq = (svg) => { const k = 'w' + (++uid); return svg.replace(/id="s"/g, `id="${k}"`).replace(/url\(#s\)/g, `url(#${k})`); };

export const CSS = read('styles/onsite.css');
export const isDark = (g) => !!T.grounds[g]?.dark;

// page(o): o.in = [w, h] inches, o.design = [W, H] design units, o.ground, inner HTML in design units
export function page(o, inner) {
  const [wi, hi] = o.in, [W, H] = o.design, k = (wi * 96) / W, g = o.ground ?? 'board';
  return `<section class="page os g-${g}${isDark(g) ? ' dark' : ''}" style="width:${wi}in;height:${hi}in">` +
    `<div class="os-canvas" style="width:${W}px;height:${H}px;zoom:${+k.toFixed(6)}">${inner}</div></section>`;
}
export const meta = (o) => ({ kind: 'pdf', size: o.size, about: o.about, vw: Math.round(o.in[0] * 96), vh: Math.round(o.in[1] * 96), scale: o.scale ?? Math.min(2, 2200 / (o.in[0] * 96)),
  css: CSS + `@page { size: ${o.in[0]}in ${o.in[1]}in; margin: 0; }` });

export const logo = (dark, style) => `<div class="os-logo" style="${style}">${dark ? LOGO.replace(/#5f6a72/gi, '#FFFFFF') : LOGO}</div>`;
export const wordmark = (dark, style) => `<div class="os-word" style="${style}">${uniq(dark ? WORD_W : WORD)}</div>`;
export const chip = () => '';   // retired 2026-11-11 (owner: no chip icon)
export const chipRetired = (size, style) => `<div class="os-chip" style="${style}"><div class="os-halo"></div>${svgDoc(size, Math.round(size * 2.05), chipSvg({ size }))}</div>`;
export const traces = (W, H, g, seed, o = {}) => tracesLayer({ w: W, h: H, ground: g, seed, ...o });
export const qrBox = (url, size, label, accent = 'blue') => `<div class="os-qr"><div class="os-qr-c" style="width:${size}px;height:${size}px">${qrSvg(url, { style: 'rounded', accent, size })}</div>${label ? `<div class="os-qr-l">${md(label)}</div>` : ''}</div>`;
export const sampleTag = (d, style) => (d.sample ? `<div class="os-sample" style="${style}">${esc(d.sample === true ? 'Sample' : d.sample)}</div>` : '');
export const cls = (d, style) => (d.classification === false ? '' : `<div class="os-cls" style="${style}">${esc(d.classification ?? T.classification.default)}</div>`);
export const bus = (colors, style = '') => `<div class="os-bus" style="${style}">${colors.map((c) => `<i style="--c:var(--${c})"></i>`).join('')}</div>`;

// event facts for a "preset": event | day1 | day2 | day3
export function facts(p = 'event') {
  if (p === 'event') return { kicker: E.hostLine, title: E.name, date: E.dates, place: E.cities, accent: 'blue' };
  const x = E.days[+String(p).replace('day', '') - 1];
  if (!x) throw new Error(`unknown preset ${p} (event, day1, day2, day3)`);
  return { kicker: `${E.name} · ${x.day}`, title: x.title, date: x.day, sub: x.sub, place: x.place, accent: x.accent };
}

// arrows: left right up down up-left up-right down-left down-right (Lucide arrow-* icons, heavier stroke for signage)
const ARROW = { left: 'arrow-left', right: 'arrow-right', up: 'arrow-up', down: 'arrow-down', 'up-left': 'arrow-up-left', 'up-right': 'arrow-up-right', 'down-left': 'arrow-down-left', 'down-right': 'arrow-down-right' };
export const arrow = (dir, size, color) => {
  if (!ARROW[dir]) throw new Error(`unknown arrow "${dir}" (${Object.keys(ARROW).join(', ')})`);
  return `<span class="os-arrow" style="width:${size}px;height:${size}px;color:${color}">${icon(ARROW[dir], { stroke: 2.6 })}</span>`;
};
