// digital/qr-poster: 1080x1350 portrait social post (Instagram/LinkedIn 4:5) or screen slide with a QR code.
// Content: { "template": "digital/qr-poster", "name": "...", "preset": "event" | "day1" | "day2" | "day3" | "cfd", "ground",
//   "qr": { "url": "https://...", "label": "Scan for details", "display": "optional short URL shown under the code" }, "sample": true }
// Always check the code: node scripts/qr-verify.mjs out/digital/<name>.png --expect <url>
import { CSS, page, traces, chip, logo, stack, preset, qrBlock, sampleTag, isDark, md, esc } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 1080, height: 1350, about: 'Portrait 4:5 post with a QR code', css: CSS };
export function render(d) {
  const W = 1080, H = 1350, g = d.ground ?? 'board', p = preset(d), q = d.qr ?? { url: 'https://www.alberta.ca' };
  p.maxLines = 3;
  const art = traces(W, H, g, d.seed ?? `qrp-${g}`, { depth: { l: 0.13, r: 0.13, t: 0.13, b: 0.1 }, span: { b: [0.3, 0.7] } });
  return page(W, H, g, 18, `${art}
    ${chip(56, 'left:600px;top:52px')}
    <div class="safe dg-center" style="left:180px;width:720px;top:190px;height:560px">${stack(p, 118)}</div>
    <div class="safe dg-center" style="left:0;width:${W}px;top:790px;gap:14px">${qrBlock(q.url, 300)}
      <div class="dg-line" style="margin:0;font-size:1.5em">${md(q.label ?? 'Scan for details')}</div>
      <div style="font-family:var(--font-mono);font-size:0.95em;color:var(--g-soft)">${esc(q.display ?? q.url.replace(/^https?:\/\//, ''))}</div></div>
    ${logo(isDark(g), 'right:48px;bottom:44px;width:170px')}
    ${p.anchor ? `<div class="dg-anchor" style="left:48px;bottom:44px">${md(p.anchor.replace(/^Anchored by the /, 'Anchored by the\n'))}</div>` : ''}
    ${sampleTag(d, 'left:48px;top:44px')}`);
}
