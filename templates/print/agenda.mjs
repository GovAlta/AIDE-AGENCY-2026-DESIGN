// print/agenda: Letter program for the three event days, one column per day in its accent colour.
// Content:
// { "template": "print/agenda", "name": "...", "title": "document title",
//   "kicker": "Agency 2026 · Program", "headline": "Three days", "lead": "...",
//   "days": [ { "day": "mon" (fills date, title and place from tokens.event) | or "date","title","place", "accent": "pink",
//               "sessions": [ { "time": "9:00", "title": "Session title", "text": "Speaker or room, TBC" } ] } ],
//   "note": "small print under the columns", "footer": "band text", "classification": "UNCLASSIFIED" }
import { T, md, esc, top, band, kicker, busRule, cornerArt } from '../lib/components.mjs';
import { printCss, day } from './lib/print.mjs';
export const meta = { kind: 'pdf', size: 'Letter 8.5x11 in', about: 'Three-day program, one column per day', css: printCss() + '@page { size: 8.5in 11in; margin: 0; }' };
export function render(d, ctx) {
  const cols = (d.days ?? []).map((x, i) => {
    const e = x.day ? day(x.day) : {}; const ac = x.accent ?? e.accent ?? ['pink', 'purple', 'green'][i % 3];
    return `<div class="agenda-day a-${ac}"><div class="dd">${md(x.date ?? e.day ?? '')}</div><h3>${md(x.title ?? e.title ?? '')}</h3><div class="pl">${md(x.place ?? e.place ?? '')}</div>` +
      (x.sessions ?? []).map((s) => `<div class="sess"><div class="tm">${esc(s.time ?? '')}</div><div><b>${md(s.title)}</b>${s.text ? `<span>${md(s.text)}</span>` : ''}</div></div>`).join('') + '</div>';
  }).join('');
  return `<section class="page print letter g-board">${cornerArt({ at: 'tr', seed: (d.name ?? 'agenda') + '-tr', style: 'top:0.95in;right:0;width:2.4in' })}
  ${top(ctx, { label: d.label })}
  <div class="safe" style="margin-top:0.24in">${kicker(d.kicker ?? 'Agency 2026 · Program')}<h1 style="margin:0.05in 0 0.06in">${md(d.headline ?? 'Program')}</h1>${busRule(['pink', 'purple', 'green'])}
  ${d.lead ? `<p class="lead" style="max-width:5.6in">${md(d.lead)}</p>` : ''}</div>
  <div class="body" style="margin-top:0.25in"><div class="cols" style="--n:${(d.days ?? []).length || 3};align-items:start">${cols}</div>${d.note ? `<p class="note">${md(d.note)}</p>` : ''}</div>
  ${band({ left: d.footer ?? `${T.event.name} · ${T.event.dates} · ${T.event.cities}`, cls: d.classification })}
</section>`;
}
