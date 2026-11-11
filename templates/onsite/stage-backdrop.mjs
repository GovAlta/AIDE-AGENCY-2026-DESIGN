// onsite/stage-backdrop: 16:9 stage backdrop, real size (default 16 x 9 ft = 192 x 108 in), vector PDF at trim size + PNG preview.
// Content: { "template": "onsite/stage-backdrop", "name": "...", "preset": "event" | "day1" | "day2" | "day3",
//   "size": "16x9ft" | "12x6.75ft" | "20x11.25ft" | "24x13.5ft", "ground": "board" | "night" | "navy", "seed": "art arrangement",
//   "anchor": true (the "Anchored by the Velocity White Papers" line, default true), "sample": "tag text" (optional) }
// Layout (design canvas 1920 x 1080): every word sits in the top 60 % because the lectern, speakers and the front rows hide the lower
// part from much of the room; the logo is upper right, clear of a centre lectern; traces run in from all four edges like the invite.
// Ask the printer for bleed: this PDF is trim size (guides/ONSITE.md).
import { page, meta as M, traces, chip, logo, facts, sampleTag, bus, isDark, esc, md, E } from './lib/onsite.mjs';

const SIZES = { '16x9ft': [192, 108], '12x6.75ft': [144, 81], '20x11.25ft': [240, 135], '24x13.5ft': [288, 162] };
const W = 1920, H = 1080;
const inch = (d) => SIZES[d.size ?? '16x9ft'] ?? (() => { throw new Error(`size must be one of ${Object.keys(SIZES).join(', ')}`); })();
export const meta = (d) => M({ in: inch(d), size: `${d.size ?? '16x9ft'} stage (16:9)`, about: 'Stage backdrop 16:9 at real size (16x9 ft default), lectern-safe layout', scale: 0.12 });

export function render(d) {
  const g = d.ground ?? 'board', f = facts(d.preset), dark = isDark(g), day = d.preset && d.preset !== 'event';
  const titleSize = day ? (f.title.length > 26 ? 120 : 150) : 200;
  const art = traces(W, H, g, d.seed ?? `stage-${d.preset ?? 'event'}-${g}`, { depth: { l: 0.19, t: 0.1, r: 0.19, b: 0.2 }, span: { t: [0.2, 0.58], l: [0.3, 0.76], r: [0.34, 0.76], b: [0.04, 0.96] }, scale: 1.9, density: 1.05 });
  return page({ in: inch(d), design: [W, H], ground: g }, `${art}
    ${chip(64, 'left:1180px;top:28px')}
    <div class="safe os-center" style="left:420px;width:1080px;top:${day ? 205 : 150}px;gap:12px">
      <div class="os-kicker" style="font-size:24px">${esc(f.kicker)}</div>
      <div class="os-title" data-fit style="font-size:${titleSize}px;line-height:0.96;max-width:1080px">${md(day ? f.title.replace(': ', ':\n') : f.title.replace(' ', '\n'))}</div>
      ${day ? `<div class="os-sub" style="font-size:44px;margin-top:6px">${esc(f.sub)}</div>` : ''}
      ${bus(['purple', 'yellow', 'cyan'], 'width:300px;font-size:20px;margin:16px 0 6px')}
      <div class="os-date" style="font-size:${day ? 48 : 64}px">${esc(day ? f.date : E.dates)}</div>
      <div class="os-place" style="font-size:${day ? 40 : 50}px">${esc(day ? f.place : E.cities)}</div>
    </div>
    ${logo(dark, 'left:1440px;top:150px;width:250px')}
    ${d.anchor === false ? '' : `<div class="os-sub" style="left:230px;top:150px;font-size:22px;line-height:1.25;width:240px">${esc(E.anchor.replace('Anchored by the ', 'Anchored by the\n')).replace('\n', '<br>')}</div>`}
    ${sampleTag(d, 'left:860px;top:150px;font-size:16px')}`);
}
