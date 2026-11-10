// print/certificate: Letter landscape certificate of participation (or recognition) in the invite frame.
// Content:
// { "template": "print/certificate", "name": "...", "title": "document title",
//   "kind": "Certificate of Participation", "intro": "This certifies that", "recipient": "Sample Name",
//   "body": "took part in **Agency 2026**, ...", "date": "Dec. 7–9, 2026", "place": "Edmonton · Calgary",
//   "signatures": [ { "name": "Name", "title": "Title" } ] (placeholders until the signer is confirmed), "seed": "..." }
import { md, esc } from '../lib/components.mjs';
import { printCss, logo, inviteFrame, T } from './lib/print.mjs';
export const meta = { kind: 'pdf', size: 'Letter landscape 11x8.5 in', about: 'Certificate of participation in the invite frame', vw: 1056, vh: 816, css: printCss() + `@page { size: 11in 8.5in; margin: 0; }
  .cert { width: 11in; height: 8.5in; }
  .cert .in { position: absolute; left: 20%; right: 20%; top: 18%; bottom: 17%; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .cert .kd { font-family: var(--font-mono); font-weight: 600; font-size: 11.5pt; letter-spacing: .2em; text-transform: uppercase; color: var(--maroon); }
  .cert .ir { font-size: 14pt; color: var(--body); margin-top: 16pt; }
  .cert .rc { font-weight: 800; font-size: 52pt; color: var(--navy); letter-spacing: -0.02em; line-height: 1.05; margin: 6pt 0 4pt; white-space: nowrap; max-width: 100%; overflow: hidden; padding-bottom: .1em; }
  .cert .bd { font-size: 14pt; color: var(--ink); max-width: 5.4in; line-height: 1.4; }
  .cert .dt { font-weight: 700; color: var(--maroon); font-size: 12pt; margin-top: 10pt; }
  .cert .sg { display: flex; gap: 0.6in; margin-top: 26pt; }
  .cert .sg div { width: 2in; border-top: 1.2px solid var(--navy); padding-top: 4pt; font-size: 8.6pt; color: var(--mute); }
  .cert .sg b { display: block; color: var(--navy); font-size: 9.6pt; }
  .cert .lg { position: absolute; right: 0.5in; bottom: 0.4in; z-index: 1; }` };
export function render(d, ctx) {
  return `<section class="page cert g-board">${inviteFrame({ w: 1056, h: 816, seed: d.seed ?? 'certificate', scale: 1.4, chipSize: 42, chipTop: '4%', depth: { l: 0.17, t: 0.16, r: 0.17, b: 0.14 }, span: { b: [0.25, 0.75] } })}
  <div class="in"><div class="mark" style="font-size:20pt">Agency<b>2026</b></div><div class="kd" style="margin-top:14pt">${esc(d.kind ?? 'Certificate of Participation')}</div>
  <div class="ir">${md(d.intro ?? 'This certifies that')}</div><div class="rc" data-fit>${md(d.recipient ?? 'Sample Name')}</div>
  <div class="bd">${md(d.body ?? `took part in **${T.event.name}**.`)}</div><div class="dt">${md(d.date ?? T.event.dates)} · ${md(d.place ?? T.event.cities)}</div>
  <div class="sg">${(d.signatures ?? []).map((s) => `<div><b>${md(s.name)}</b>${md(s.title ?? '')}</div>`).join('')}</div></div>
  <div class="lg">${logo(ctx)}</div>
</section>`;
}
