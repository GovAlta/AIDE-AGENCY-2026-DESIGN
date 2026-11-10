// print/factsheet: one-page Letter fact sheet (handout page 1, generalised): header, kicker, title, lead, blocks, optional QR, navy band.
// Content:
// { "template": "print/factsheet", "name": "...", "title": "document title",
//   "kicker": "Agency 2026 · Showcase", "headline": "Program name", "bus": ["purple","yellow","cyan"], "lead": "One or two sentences.",
//   "label": "optional mono label after the mark", "sample": "Example values" (optional tag shown beside the kicker),
//   "blocks": [ ...block list (templates/lib/components.mjs blocks()) ], "qr": { "url": "...", "title": "..." } (optional, bottom right), "qrNote": "text beside it",
//   "footer": "band text", "classification": "UNCLASSIFIED", "art": "generated" | "handout" | "none", "seed": "..." }
import { render as handout } from './handout.mjs';
import { meta as hm } from './handout.mjs';
export const meta = { ...hm, about: 'One-page fact sheet: tiles, bars, flow, quote, QR' };
export function render(d, ctx) {
  const blocks = [...(d.blocks ?? [])];
  if (d.qr) blocks.push({ type: 'cols', cols: [[{ type: 'note', text: d.qrNote ?? '' }], [{ type: 'qr', ...d.qr }]] });   // QR on the right: the corner art owns the bottom left
  const kicker = d.sample ? `${d.kicker ?? ''}  ·  ==${d.sample}==` : d.kicker;
  return handout({ ...d, art: d.art ?? 'generated', name: d.seed ?? d.name, pages: [{ kicker, title: d.headline, bus: d.bus, lead: d.lead, label: d.label, blocks }] }, ctx);
}
