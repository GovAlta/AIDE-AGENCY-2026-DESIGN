// print/report: Letter report: a cover in the invite look, then interior pages built from blocks, numbered.
// Content:
// { "template": "print/report", "name": "...", "title": "document title",
//   "cover": { "kicker": "Agency 2026 · Report", "headline": "Report title", "subtitle": "...", "date": "Month 2026", "by": "Prepared by: Team name" },
//   "pages": [ { "kicker": "Section", "title": "Page heading", "lead": "...", "blocks": [ ... ] } ],
//   "footer": "band text", "classification": "UNCLASSIFIED", "seed": "..." }
import { md, esc, top, band, kicker, busRule, blocks, tracesLayer, chipArt } from '../lib/components.mjs';
import { printCss, logo } from './lib/print.mjs';
export const meta = { kind: 'pdf', size: 'Letter 8.5x11 in', about: 'Report: invite-look cover plus numbered interior pages of blocks', css: printCss() + `@page { size: 8.5in 11in; margin: 0; }
  .cover .in { position: absolute; left: 0.75in; right: 1.9in; top: 3.1in; z-index: 1; }
  .cover h1 { font-size: 44pt; line-height: 1.0; margin: 6pt 0 8pt; }
  .cover .st { font-size: 15pt; color: var(--ink); line-height: 1.35; margin-top: 4pt; }
  .cover .dt { margin-top: 18pt; font-weight: 700; color: var(--maroon); font-size: 13pt; }
  .cover .by { font-size: 10pt; color: var(--mute); margin-top: 3pt; }
  .cover .lg { position: absolute; left: 0.75in; bottom: 0.85in; z-index: 1; }
  .cover .lg .ab-logo { height: 38pt; }
  .pg { font-family: var(--font-mono); letter-spacing: .1em; }` };
export function render(d, ctx) {
  const c = d.cover ?? {}, total = (d.pages ?? []).length + 1;
  const cover = `<section class="page print letter cover g-board" style="padding:0">${tracesLayer({ w: 816, h: 1056, edges: 'trb', seed: d.seed ?? `report-${d.name}`, depth: { t: 0.22, r: 0.24, b: 0.12 }, scale: 1.3, span: { t: [0.42, 0.97], b: [0.45, 0.95] } })}
  ${chipArt({ size: 48, style: 'left:63%;top:3.2%;z-index:1' })}
  <div style="position:absolute;left:0.75in;top:0.6in;z-index:1"><div class="mark" style="font-size:18pt">Agency<b>2026</b></div></div>
  <div class="in">${kicker(c.kicker ?? 'Agency 2026 · Report')}<h1 data-fit style="overflow:hidden">${md(c.headline ?? d.title ?? '')}</h1>${busRule(['purple', 'yellow', 'cyan'], '3.2in')}
    ${c.subtitle ? `<div class="st">${md(c.subtitle)}</div>` : ''}${c.date ? `<div class="dt">${md(c.date)}</div>` : ''}${c.by ? `<div class="by">${md(c.by)}</div>` : ''}</div>
  <div class="lg">${logo(ctx)}</div>
  <div style="position:absolute;left:0;right:0;bottom:0">${band({ left: d.footer ?? '', cls: d.classification }).replace('class="band', 'style="padding:0 0.75in;margin:0" class="band')}</div>
</section>`;
  const pages = (d.pages ?? []).map((p, i) => `<section class="page print letter g-board">
  ${top(ctx, { label: p.label })}
  <div class="safe" style="margin-top:0.24in">${kicker(p.kicker)}<h1 style="margin:0.05in 0 0.06in;font-size:${p.titleSize ?? 26}pt">${md(p.title)}</h1>${busRule(p.bus ?? ['blue', 'green'])}
  ${p.lead ? `<p class="lead" style="max-width:6.2in">${md(p.lead)}</p>` : ''}</div>
  <div class="body" style="margin-top:0.18in">${blocks(p.blocks, ctx)}</div>
  ${band({ left: d.footer ?? '', right: `${i + 2} / ${total}`, cls: d.classification })}
</section>`);
  return [cover, ...pages].join('\n');
}
