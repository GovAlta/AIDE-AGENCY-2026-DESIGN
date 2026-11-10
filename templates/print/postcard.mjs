// print/postcard: 6x4 in invite postcard, two pages: front (the invite art and the event) and back (the three days and a QR).
// Content:
// { "template": "print/postcard", "name": "...", "title": "document title",
//   "front": { "headline": "Agency\n2026", "date": "Dec. 7–9, 2026", "place": "Edmonton · Calgary" }  (defaults from tokens.event),
//   "back": { "headline": "Three days", "days": ["mon","tue","wed"], "qr": { "url": "...", "title": "Register" }, "note": "..." }, "seed": "..." }
import { md, esc, qr } from '../lib/components.mjs';
import { printCss, logo, inviteFrame, day, T } from './lib/print.mjs';
export const meta = { kind: 'pdf', size: 'Postcard 6x4 in', about: 'Invite postcard, front and back with the three days and QR', vw: 576, vh: 384, css: printCss() + `@page { size: 6in 4in; margin: 0; }
  .pc { width: 6in; height: 4in; }
  .pc .in { position: absolute; left: 22%; right: 22%; top: 20%; bottom: 18%; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .pc .tt { font-weight: 800; font-size: 46pt; line-height: .98; color: var(--navy); letter-spacing: -0.02em; }
  .pc .dt { font-weight: 700; color: var(--maroon); font-size: 13pt; margin-top: 5pt; }
  .pc .pl { font-weight: 700; color: var(--navy); font-size: 11pt; margin-top: 1pt; }
  .pc .ab-logo { height: 15pt; }
  .back { padding: 0.32in 0.36in; display: grid; grid-template-columns: 1fr 1.55in; gap: 0.25in; }
  .back .d { border-left: 3.5pt solid var(--c); padding: 1pt 0 1pt 7pt; margin-top: 6pt; }
  .back .d .dd { font-family: var(--font-mono); font-size: 6.4pt; letter-spacing: .12em; text-transform: uppercase; color: var(--ct); font-weight: 600; }
  .back .d b { display: block; color: var(--navy); font-size: 10pt; line-height: 1.15; }
  .back .d span { font-size: 7.6pt; color: var(--mute); }
  .back .qr { flex-direction: column; align-items: flex-start; gap: 5pt; }
  .back .qr svg { width: 1.05in; height: 1.05in; }
  .back .rt { border-left: 1px solid var(--line); padding-left: 0.2in; display: flex; flex-direction: column; justify-content: space-between; }` };
export function render(d, ctx) {
  const f = d.front ?? {}, b = d.back ?? {};
  const front = `<section class="page pc g-board">${inviteFrame({ w: 576, h: 384, seed: d.seed ?? 'postcard', scale: 0.75, chipSize: 24, chipTop: '3.5%', depth: { l: 0.2, t: 0.19, r: 0.2, b: 0.16 }, span: { b: [0.3, 0.72] } })}
  <div class="in"><div class="tt">${md(f.headline ?? 'Agency\n2026')}</div><div class="dt">${md(f.date ?? T.event.dates)}</div><div class="pl">${md(f.place ?? T.event.cities)}</div></div>
  <div style="position:absolute;right:0.22in;bottom:0.18in;z-index:1">${logo(ctx)}</div></section>`;
  const days = (b.days ?? ['mon', 'tue', 'wed']).map((k) => { const e = day(k); return `<div class="d a-${e.accent}"><div class="dd">${esc(e.day)}</div><b>${esc(e.title)}</b><span>${esc(e.place)}</span></div>`; }).join('');
  const back = `<section class="page pc back g-board"><div><div class="mark" style="font-size:13pt">Agency<b>2026</b></div><div class="h3" style="margin-top:10pt;font-size:12pt">${md(b.headline ?? 'Three days')}</div>${days}
    ${b.note ? `<p class="note" style="margin-top:7pt">${md(b.note)}</p>` : ''}</div>
    <div class="rt">${b.qr ? qr(b.qr.url, { title: b.qr.title, display: b.qr.display }) : '<span></span>'}${logo(ctx)}</div></section>`;
  return front + '\n' + back;
}
