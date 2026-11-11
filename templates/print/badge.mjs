// print/badge: 4x3 in name badges, one per page (print on badge stock or cut from Letter).
// Content:
// { "template": "print/badge", "name": "...", "title": "document title",
//   "people": [ { "name": "Sample Name", "role": "Role or title", "org": "Ministry or organisation", "day": "all" | "mon" | "tue" | "wed",
//                 "tag": "optional pill e.g. Speaker", "qr": "https://... (optional)" } ] }
// The colour stripe follows the day (all days: the full spectrum).
import { T, md, esc, qr, tracesLayer, inkOn } from '../lib/components.mjs';
import { printCss, day, logo } from './lib/print.mjs';
export const meta = { kind: 'pdf', size: 'Badge 4x3 in', about: 'Name badges, one per page, day colour stripe, optional QR', vw: 384, vh: 288,
  css: printCss() + `@page { size: 4in 3in; margin: 0; }
  .badge { --u: 1pt; width: 4in; height: 3in; padding: 0.2in 0.24in 0.18in; }
  .badge .stripe { position: absolute; left: 0; right: 0; bottom: 0; height: 0.3in; display: flex; align-items: center; padding: 0 0.24in; color: #fff; font-family: var(--font-mono); font-size: 7.4pt; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; z-index: 2; }
  .badge .nm { font-weight: 800; color: var(--navy); font-size: 25pt; line-height: 1.02; letter-spacing: -0.015em; }
  .badge .rl { font-size: 10pt; color: var(--navy); font-weight: 600; margin-top: 4pt; }
  .badge .og { font-size: 8.6pt; color: var(--mute); margin-top: 1pt; }
  .badge .mid { margin-right: 0.42in; display: flex; justify-content: space-between; align-items: flex-end; gap: 8pt; margin-top: 0.2in; position: relative; z-index: 1; }
  .badge .qr svg { width: 0.85in; height: 0.85in; }
  .badge .ab-logo { height: 17pt; }` };
export function render(d, ctx) {
  return (d.people ?? []).map((p, i) => {
    const e = p.day && p.day !== 'all' ? day(p.day) : null;
    const bg = e ? `var(--${e.accent})` : 'var(--spectrum)';
    return `<section class="page badge g-board">${tracesLayer({ w: 384, h: 288, edges: 'r', seed: `badge-${i}`, depth: { r: 0.13 }, scale: 0.8, span: { r: [0.36, 0.86] } })}
  <div class="top" style="position:relative;z-index:1"><div class="mark" style="font-size:12pt">Agency<b>2026</b></div>${logo(ctx)}</div>
  <div class="mid"><div style="max-width:${p.qr ? '2.4in' : '3.2in'}">${p.tag ? `<span class="pill a-${e?.accent ?? 'blue'}" style="margin-bottom:5pt">${esc(p.tag)}</span>` : ''}<div class="nm" data-fit style="overflow:hidden">${md(p.name)}</div><div class="rl">${md(p.role ?? '')}</div><div class="og">${md(p.org ?? '')}</div></div>
  ${p.qr ? qr(p.qr, { show: false, style: 'rounded' }) : ''}</div>
  <div class="stripe" style="background:${bg};color:${e ? inkOn(e.accent) : '#FFFFFF'}${e ? '' : ';text-shadow:0 0 2px rgba(2,44,76,.9)'}">${esc(e ? e.day : T.event.dates + ' · ' + T.event.cities)}</div>
</section>`;
  }).join('\n');
}
