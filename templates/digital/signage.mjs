// digital/signage: lobby and hallway screens. "orientation": "landscape" (1920x1080, default) | "portrait" (1080x1920).
// A "Today" card for one day of the event, with a QR code to the agenda.
// Content: { "template": "digital/signage", "name": "...", "orientation", "preset": "day1" | "day2" | "day3", "ground": "night" (default) | "navy" | "board",
//   "kicker": "Today" (default), "qr": { "url": "https://...", "label": "Scan for the agenda" }, "sample": true (tags placeholder content) }
// Screens are seen from 3-10 m: keep it to the day, the title, the place and one QR. Test the QR from 1.5 m on the real screen.
import { CSS, page, traces, chip, logo, mark, stack, preset, qrBlock, sampleTag, isDark, md, E_ } from './lib/digital.mjs';
const dims = (d) => (d.orientation === 'portrait' ? [1080, 1920] : [1920, 1080]);
export const meta = (d) => ({ kind: 'png', width: dims(d)[0], height: dims(d)[1], about: 'Lobby screen "Today" card with QR (landscape or portrait)', css: CSS });
export function render(d) {
  const [W, H] = dims(d), g = d.ground ?? 'night', p = preset({ preset: 'day1', ...d }), portrait = H > W;
  p.kicker = `${d.kicker ?? 'Today'}${p.date ? ' · ' + p.date : ''}`; p.event = undefined; p.date = undefined; p.maxLines = 3;   // the mark says Agency 2026
  const q = d.qr ? `<div class="safe dg-center" style="${portrait ? `left:0;width:${W}px;top:1330px` : 'left:1340px;top:330px;width:440px'};gap:18px">${qrBlock(d.qr.url, portrait ? 330 : 360)}<div class="dg-line" style="margin:0;font-size:1.3em">${md(d.qr.label ?? 'Scan for the agenda')}</div></div>` : '';
  const art = portrait ? traces(W, H, g, d.seed ?? 'sign-p', { edges: 'tlr', depth: { t: 0.11, l: 0.08, r: 0.08 }, span: { t: [0.36, 0.64], l: [0.16, 0.6], r: [0.16, 0.6] } })
    : traces(W, H, g, d.seed ?? 'sign-l', { edges: 'ltb', depth: { l: 0.06, t: 0.14, b: 0.1 }, span: { t: [0.32, 0.66], b: [0.3, 0.62], l: [0.3, 0.75] } });
  const text = portrait ? `left:110px;top:340px;width:${W - 220}px;height:880px` : 'left:180px;top:220px;width:1060px;height:640px';
  return page(W, H, g, portrait ? 30 : 28, `${art}
    ${mark(`left:${portrait ? 80 : 90}px;top:${portrait ? 80 : 60}px;font-size:${portrait ? 46 : 40}px`)}
    ${logo(isDark(g), `right:${portrait ? 80 : 90}px;top:${portrait ? 78 : 58}px;width:${portrait ? 210 : 200}px`)}
    <div class="safe ${portrait ? 'dg-center' : 'dg-left'}" style="${text}">${stack(p, portrait ? 150 : 140, portrait ? 'center' : 'left')}</div>
    ${q}
    ${chip(portrait ? 70 : 64, portrait ? 'left:620px;top:205px' : 'left:1080px;top:40px')}
    <div class="dg-band" style="height:${portrait ? 110 : 90}px"><div class="safe" style="left:${portrait ? 80 : 90}px;top:0;height:100%;display:flex;align-items:center;color:#c9d6e2;font-size:0.95em">${md(`${E_.name} · ${E_.dates} · ${E_.cities}`)}</div></div>
    ${sampleTag(d, portrait ? 'left:80px;top:170px' : 'right:90px;bottom:110px')}`);
}
