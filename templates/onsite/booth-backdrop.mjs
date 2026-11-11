// onsite/booth-backdrop: demo booth backdrop, 8 x 8 ft (96 x 96 in) by default, vector PDF at trim size + PNG preview.
// Content: { "template": "onsite/booth-backdrop", "name": "...", "kicker": "Agency 2026 · Showcase demo", "title": "Demo name",
//   "sub": "One line on what the demo does", "team": "Team or ministry", "qr": { "url": "https://...", "label": "Try the demo" },
//   "size": "8x8ft" | "10x8ft", "ground": "board" | "night", "accent": "blue", "seed": "...", "sample": "Sample" }
// Layout (design canvas 1080 wide): the name sits at standing eye level (about 5.5 to 7 ft from the floor), the QR code beside it at
// about 4.5 to 5.5 ft so a phone can reach it, and only art in the bottom 30 % where the demo table hides the backdrop.
import { page, meta as M, traces, chip, logo, wordmark, qrBox, sampleTag, bus, isDark, esc, md, E } from './lib/onsite.mjs';

const SIZES = { '8x8ft': [96, 96], '10x8ft': [120, 96] };
const dims = (d) => { const s = SIZES[d.size ?? '8x8ft']; if (!s) throw new Error(`size must be one of ${Object.keys(SIZES).join(', ')}`); return s; };
export const meta = (d) => M({ in: dims(d), size: `${d.size ?? '8x8ft'} booth`, about: 'Demo booth backdrop 8x8 ft: name at eye level, QR at phone height', scale: 0.2 });

export function render(d) {
  const [wi, hi] = dims(d), W = Math.round(1080 * wi / hi), H = 1080, g = d.ground ?? 'board', dark = isDark(g), cx = (W - 860) / 2, CW = 860;
  const art = traces(W, H, g, d.seed ?? `booth-${g}-${d.title ?? ''}`, { edges: 'lrb', depth: { l: 0.13, r: 0.13, b: 0.3 }, span: { l: [0.64, 0.97], r: [0.64, 0.97], b: [0.04, 0.96] }, scale: 1.5, density: 1.1 });
  const ft = (x) => H - (x / hi) * H * 12;   // design y of a height above the floor, in feet
  return page({ in: [wi, hi], design: [W, H], ground: g }, `${art}
    ${wordmark(dark, `left:${cx}px;top:70px;width:250px`)}
    ${logo(dark, `left:${cx + CW - 190}px;top:66px;width:190px`)}
    ${chip(44, `left:${W / 2 - 22}px;top:6px`)}
    <div class="safe" style="left:${cx}px;width:${d.qr ? 600 : CW}px;top:${ft(6.6)}px;display:flex;flex-direction:column;gap:14px">
      <div class="os-kicker" style="font-size:20px">${esc(d.kicker ?? `${E.name} · Showcase demo`)}</div>
      <div class="os-title" data-fit style="font-size:${(d.title ?? '').length > 18 ? 76 : 100}px;max-height:240px">${md(d.title ?? 'Demo name')}</div>
      ${bus([d.accent ?? 'blue', 'yellow', 'cyan'], 'width:260px;font-size:16px;margin:6px 0')}
      <div class="os-sub" data-fit style="font-size:34px;line-height:1.25;max-height:90px">${md(d.sub ?? '')}</div>
      ${d.team ? `<div class="os-place" style="font-size:26px">${esc(d.team)}</div>` : ''}
      <div class="os-date" style="font-size:24px;margin-top:4px">${esc(E.dates)} · <span class="os-place">${esc(E.cities)}</span></div>
    </div>
    ${d.qr ? `<div class="safe os-center" style="left:${cx + CW - 210}px;width:210px;top:${ft(5.4)}px;gap:12px;font-size:24px">${qrBox(d.qr.url, 190, '', d.accent ?? 'blue')}<div class="os-qr-l">${md(d.qr.label ?? 'Scan to save this demo')}</div></div>` : ''}
    ${sampleTag(d, `left:${cx + CW - 130}px;top:${ft(6.6) - 2}px;font-size:14px`)}`);
}
