// digital/rollup-banner: 33x80 in pull-up (roll-up) banner, print-ready PDF (vector art and text; the Alberta logo is vector).
// Content: { "template": "digital/rollup-banner", "name": "...", "preset": "event" | "day1" | "day2" | "day3" | "cfd", "ground",
//   "qr": { "url", "label" } (optional), "sample": true }
// Layout: logo and mark in the top 12 in (eye level when the banner stands), message in the middle, nothing but art below 64 in
// (the base cassette and people's legs hide it). Ask the printer for bleed: add it in their template; this PDF is trim size.
import { CSS, page, traces, chip, logo, mark, stack, preset, qrBlock, sampleTag, isDark, md, E_ } from './lib/digital.mjs';
const W = 3168, H = 7680;   // 33 x 80 in at 96 CSS px per inch
export const meta = { kind: 'pdf', size: '33x80 in roll-up', vw: W, vh: H, scale: 0.25, about: 'Roll-up banner 33x80 in (PDF, trim size)',
  css: CSS + '@page { size: 33in 80in; margin: 0; }' };
export function render(d) {
  const g = d.ground ?? 'board', p = preset(d); p.maxLines = 4;
  const art = traces(W, H, g, d.seed ?? `rollup-${g}`, { depth: { l: 0.16, r: 0.16, t: 0.06, b: 0.2 }, span: { t: [0.25, 0.75] }, scale: 4.2, density: 1 });
  return page(W, H, g, 64, `${art}
    ${mark('left:0;right:0;top:620px;font-size:150px;width:max-content;margin:0 auto')}
    ${chip(170, 'left:2150px;top:120px')}
    <div class="safe dg-center" style="left:560px;width:2048px;top:1500px;height:2700px">${stack(p, 420)}</div>
    ${d.qr ? `<div class="safe dg-center" style="left:0;width:${W}px;top:4500px;gap:40px">${qrBlock(d.qr.url, 760)}<div class="dg-line" style="margin:0;font-size:1.8em">${md(d.qr.label ?? 'Scan for details')}</div></div>` : ''}
    ${logo(isDark(g), `left:${(W - 900) / 2}px;top:5800px;width:900px`)}
    ${sampleTag(d, 'left:600px;top:4320px;font-size:56px')}`);
}
