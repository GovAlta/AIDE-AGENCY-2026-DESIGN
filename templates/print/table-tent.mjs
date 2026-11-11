// print/table-tent: Letter sheet folded in half across the middle into a tent card; the top panel is printed upside down so both
// faces read upright on the table. Demo name, team, one line, QR.
// Content:
// { "template": "print/table-tent", "name": "...", "title": "document title",
//   "kicker": "Agency 2026 · Demo", "headline": "Demo name", "team": "Team or ministry", "text": "One line on what visitors will see.",
//   "number": "Demo 12" (optional), "accent": "blue", "qr": { "url": "...", "title": "Try it" } (optional), "seed": "..." }
import { md, esc, kicker, qr, tracesLayer } from '../lib/components.mjs';
import { printCss, logo, qrAccent } from './lib/print.mjs';
export const meta = { kind: 'pdf', size: 'Letter, folded to 8.5x5.5 in', about: 'Folded table tent for a demo station, QR', css: printCss() + `@page { size: 8.5in 11in; margin: 0; }
  .tent { --u: 1pt; width: 8.5in; height: 11in; }
  .panel { position: absolute; left: 0; width: 8.5in; height: 5.5in; overflow: hidden; }
  .panel.up { top: 0; transform: rotate(180deg); } .panel.dn { top: 5.5in; }
  .panel .in { position: absolute; left: 0.55in; right: 0.55in; top: 0.45in; bottom: 0.45in; display: flex; flex-direction: column; z-index: 1; }
  .panel h1 { font-size: 40pt; margin: 4pt 0 6pt; }
  .panel .tm { font-size: 14pt; font-weight: 700; color: var(--navy); }
  .panel .tx { font-size: 12pt; color: var(--body); margin-top: 6pt; max-width: 4.6in; }
  .panel .bt { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; }
  .panel .qr svg { width: 1.1in; height: 1.1in; }
  .fold { position: absolute; top: 5.5in; left: 0; right: 0; border-top: 1px dashed #b9c2cc; z-index: 3; }
  .fold span { position: absolute; right: 0.2in; top: -12pt; font-family: var(--font-mono); font-size: 6pt; color: var(--mute); letter-spacing: .12em; }` };
export function render(d, ctx) {
  const face = (cls) => `<div class="panel ${cls}">${tracesLayer({ w: 816, h: 528, edges: 'r', seed: d.seed ?? `tent-${d.name}`, depth: { r: 0.2 }, scale: 1.2, span: { r: [0.3, 0.8] } })}
    <div class="in"><div class="row"><div class="mark">Agency<b>2026</b></div>${d.number ? `<span class="pill a-${d.accent ?? 'blue'}" style="margin-left:10pt;font-size:8pt">${esc(d.number)}</span>` : ''}</div>
    <div style="margin-top:0.3in">${kicker(d.kicker ?? 'Agency 2026 · Demo', d.accent ?? 'blue')}<h1 data-fit style="max-width:5.4in;overflow:hidden">${md(d.headline)}</h1><div class="tm">${md(d.team ?? '')}</div>${d.text ? `<div class="tx">${md(d.text)}</div>` : ''}</div>
    <div class="bt">${d.qr ? qr(d.qr.url, { title: d.qr.title, display: d.qr.display, accent: qrAccent(d.accent ?? 'blue') }) : '<span></span>'}${logo(ctx)}</div></div></div>`;
  return `<section class="page tent g-board">${face('up')}${face('dn')}<div class="fold"><span>FOLD</span></div></section>`;
}
