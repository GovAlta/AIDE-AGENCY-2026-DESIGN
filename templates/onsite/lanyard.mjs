// onsite/lanyard: a 36 x 0.75 in lanyard strip (the full printed length, both sides of the neck), vector PDF + PNG preview.
// Content: { "template": "onsite/lanyard", "name": "...", "ground": "navy" | "board" | "night", "width": 0.75 (in; 0.625 or 1 also common),
//   "length": 36 (in), "text": "optional repeat text; default the event name, dates and cities" }
// The repeat runs head to tail so it reads upright on both sides when worn; a spectrum hairline runs along each edge.
import { page, meta as M, isDark, esc, T, E } from './lib/onsite.mjs';

export const meta = (d) => M({ in: [d.length ?? 36, d.width ?? 0.75], size: `${d.length ?? 36} x ${d.width ?? 0.75} in lanyard`, about: 'Lanyard strip repeat with spectrum edges', scale: 0.6 });

export function render(d) {
  const L = d.length ?? 36, Wd = d.width ?? 0.75, W = Math.round(L * 96), H = Math.round(Wd * 96), g = d.ground ?? 'navy', dark = isDark(g);
  const txt = d.text ?? `${E.name}  ·  ${E.dates}  ·  ${E.cities}`;
  const n = Math.max(1, Math.round(W / 2 / (H * 13.5))), unit = W / 2 / n, ink = dark ? '#FFFFFF' : T.color.navy, yr = dark ? T.textOnDark.maroon : T.color.maroon;
  const item = (flip) => `<div style="position:relative;width:${unit}px;height:${H}px;display:flex;align-items:center;justify-content:center;gap:${H * 0.3}px;flex:none;${flip ? 'transform:rotate(180deg);' : ''}">` +
    `<span style="font-weight:800;font-size:${H * 0.38}px;color:${ink};white-space:nowrap">Agency <span style="color:${yr}">2026</span></span>` +
    `<span style="font-family:var(--font-mono);font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:${H * 0.2}px;color:${ink};opacity:.85;white-space:nowrap">${esc(txt.replace(/^Agency 2026\s*·\s*/, ''))}</span></div>`;
  const half = (flip) => `<div style="display:flex;width:${W / 2}px;height:${H}px;overflow:hidden;${flip ? 'justify-content:flex-end' : ''}">${Array.from({ length: n }, () => item(flip)).join('')}</div>`;
  return page({ in: [L, Wd], design: [W, H], ground: g }, `
    <div style="left:0;top:0;width:${W}px;height:${H}px;display:flex">${half(false)}${half(true)}</div>
    <div style="left:0;top:0;width:${W}px;height:${Math.max(2, H * 0.05)}px;background:var(--spectrum)"></div>
    <div style="left:0;top:${H - Math.max(2, H * 0.05)}px;width:${W}px;height:${Math.max(2, H * 0.05)}px;background:var(--spectrum)"></div>`);
}
