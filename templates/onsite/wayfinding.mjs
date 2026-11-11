// onsite/wayfinding: directional sign, 24 x 36 in portrait (or 36 x 24 landscape, 18 x 24), vector PDF at trim size + PNG preview.
// Content: { "template": "onsite/wayfinding", "name": "...", "size": "24x36" | "18x24" | "36x24", "ground": "board" | "night",
//   "heading": "Agency 2026" (default the event name), "day": "day1" | "day2" | "day3" (optional: the day line under the heading),
//   "rows": [ { "label": "Main stage", "sub": "Keynotes and panels", "arrow": "left|right|up|down|up-left|up-right|down-left|down-right",
//               "accent": "blue" } ] (1-5 rows, the most important first),
//   "qr": { "url": "...", "label": "Full agenda" } (optional), "sample": "Sample" }
// Type is sized for reading at 20 to 30 ft (guides/ONSITE.md): labels about 3 in tall on a 24 x 36 sign, arrows 5 in.
import { page, meta as M, traces, logo, wordmark, arrow, qrBox, sampleTag, isDark, esc, md, T, E } from './lib/onsite.mjs';

const SIZES = { '24x36': [24, 36], '18x24': [18, 24], '36x24': [36, 24] };
const dims = (d) => { const s = SIZES[d.size ?? '24x36']; if (!s) throw new Error(`size must be one of ${Object.keys(SIZES).join(', ')}`); return s; };
export const meta = (d) => M({ in: dims(d), size: `${d.size ?? '24x36'} in sign`, about: 'Directional sign with arrows, sized for reading at 20-30 ft' });

export function render(d) {
  const [wi, hi] = dims(d), W = 1080, H = Math.round(1080 * hi / wi), g = d.ground ?? 'board', dark = isDark(g), land = wi > hi;
  const rows = d.rows ?? [], n = rows.length;
  if (!n || n > 5) throw new Error('wayfinding needs 1 to 5 rows');
  const top = land ? 190 : 270, bottom = d.qr ? (land ? 190 : 330) : (land ? 120 : 210), rh = Math.min(land ? 150 : 230, (H - top - bottom) / n);
  const dayX = d.day ? E.days[+String(d.day).replace('day', '') - 1] : null;
  const art = traces(W, H, g, d.seed ?? `way-${g}`, { edges: 'b', depth: { b: land ? 0.1 : 0.085 }, span: { b: [0.04, 0.96] }, scale: 1.4 });
  const fill = (a) => T.color[a] ?? T.color.blue;
  return page({ in: [wi, hi], design: [W, H], ground: g }, `${art}
    ${wordmark(dark, `left:70px;top:58px;width:${land ? 230 : 300}px`)}
    ${logo(dark, `left:${W - 70 - (land ? 170 : 210)}px;top:58px;width:${land ? 170 : 210}px`)}
    ${dayX ? `<div class="os-date" style="left:72px;top:${land ? 128 : 160}px;font-size:${land ? 26 : 34}px">${esc(dayX.day)} · <span class="os-place">${esc(dayX.title)}</span></div>` : ''}
    <div class="safe" style="left:0;width:${W}px;top:${top}px">
      ${rows.map((r, i) => `<div style="position:absolute;left:0;width:${W}px;top:${i * rh}px;height:${rh - 18}px;display:flex;align-items:center;gap:${land ? 34 : 44}px;padding:0 70px;border-top:${i ? '3px solid var(--g-line, var(--line))' : 'none'}">
        <div style="width:16px;align-self:stretch;margin:28px 0;border-radius:8px;background:${fill(r.accent)}"></div>
        ${arrow(r.arrow ?? 'right', Math.min(rh * 0.62, land ? 110 : 150), dark ? '#FFFFFF' : T.color.navy)}
        <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
          <div class="os-title" data-fit style="font-size:${Math.min(land ? 64 : 84, rh * 0.36)}px;line-height:1.02;max-width:${W - 380}px">${md(r.label)}</div>
          ${r.sub ? `<div class="os-sub" style="font-size:${Math.min(land ? 28 : 36, rh * 0.16)}px">${md(r.sub)}</div>` : ''}
        </div></div>`).join('')}
    </div>
    ${d.qr ? `<div class="safe" style="left:70px;top:${H - bottom + (land ? 20 : 40)}px;font-size:${land ? 24 : 30}px">${qrBox(d.qr.url, land ? 120 : 160, d.qr.label ?? 'Full agenda')}</div>` : ''}
    ${sampleTag(d, `left:${W - 230}px;top:${H - (land ? 120 : 150)}px;font-size:16px`)}`);
}
