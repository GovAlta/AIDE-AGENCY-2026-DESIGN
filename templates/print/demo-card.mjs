// print/demo-card: half-letter (5.5x8.5 in) card for one showcase demo: what it is, what visitors will see, who built it, QR.
// Content:
// { "template": "print/demo-card", "name": "...", "title": "document title",
//   "kicker": "Agency 2026 · Demo", "headline": "Demo name", "lead": "One or two sentences.", "accent": "green",
//   "points": ["What visitors will see", "..."], "team": "Team or ministry", "day": "mon" | "tue" | "wed" (optional, adds the day and place),
//   "qr": { "url": "...", "title": "Learn more" }, "footer": "band text", "classification": "UNCLASSIFIED", "seed": "..." }
import { md, esc, kicker, busRule, dots, qr, band, tracesLayer } from '../lib/components.mjs';
import { printCss, day, logo, qrAccent } from './lib/print.mjs';
export const meta = { kind: 'pdf', size: 'Half-letter 5.5x8.5 in', about: 'Showcase demo card: description, points, team, QR', vw: 528, vh: 816, css: printCss() + `@page { size: 5.5in 8.5in; margin: 0; }
  .dc { width: 5.5in; height: 8.5in; padding: 0.36in 0.42in 0; }
  .dc .art-top { position: absolute; left: 0; right: 0; top: 0; height: 1.5in; }
  .dc h1 { font-size: 26pt; margin: 4pt 0 4pt; }
  .dc .band { margin-left: -0.42in; margin-right: -0.42in; padding: 0 0.42in; }
  .dc .meta { display: grid; grid-template-columns: auto 1fr; gap: 3pt 10pt; font-size: 8.8pt; }
  .dc .meta .label { padding-top: 1.5pt; }` };
export function render(d, ctx) {
  const e = d.day ? day(d.day) : null, ac = d.accent ?? e?.accent ?? 'blue';
  return `<section class="page print dc g-board"><div class="art-top">${tracesLayer({ w: 528, h: 144, edges: 't', seed: d.seed ?? `demo-${d.name}`, depth: { t: 0.85 }, scale: 1, spanAll: [0.45, 0.98] })}</div>
  <div class="top" style="position:relative;z-index:1"><div class="mark">Agency<b>2026</b></div></div>
  <div class="safe" style="margin-top:0.85in">${kicker(d.kicker ?? 'Agency 2026 · Demo', ac)}<h1 data-fit style="overflow:hidden">${md(d.headline)}</h1>${busRule([ac, 'yellow'])}
    ${d.lead ? `<p class="lead" style="font-size:11pt">${md(d.lead)}</p>` : ''}</div>
  <div class="body" style="margin-top:0.18in;gap:12pt">
    ${d.points?.length ? `<div class="stack"><h2 style="--c:var(--${ac})">What you will see</h2>${dots(d.points, ac)}</div>` : ''}
    <div class="meta">${d.team ? `<span class="label">Team</span><span>${md(d.team)}</span>` : ''}${e ? `<span class="label">When</span><span>${esc(e.day)}</span><span class="label">Where</span><span>${esc(e.place)}</span>` : ''}</div>
    <div class="row" style="justify-content:space-between;align-items:flex-end;margin-top:auto;margin-bottom:12pt">${d.qr ? qr(d.qr.url, { title: d.qr.title, display: d.qr.display, accent: qrAccent(ac) }) : '<span></span>'}${logo(ctx)}</div>
  </div>
  ${band({ left: d.footer ?? 'Agency 2026 Showcase', cls: d.classification })}
</section>`;
}
