// print/handout: Letter handout of 1-4 pages (the Contact Alberta Agency 2026 handout, generalised).
// Content:
// { "template": "print/handout", "name": "...", "title": "...",
//   "footer": "Left text of the navy band", "classification": "UNCLASSIFIED",
//   "art": "handout" | "generated" | "none"   (corner traces: the handout's hand-drawn pair, or seeded generated ones),
//   "pages": [ { "kicker": "Agency 2026 · Showcase", "title": "Contact Alberta AI", "titleSize": 34, "bus": ["purple","yellow","cyan"],
//               "lead": "One or two sentences, **bold** allowed.", "label": "optional mono label after the mark",
//               "blocks": [ ...block list, see templates/lib/components.mjs blocks() ] } ] }
// Block types: section, tiles, split, cards, card, bars, flow, cols, dots, table, quote, callout, text, lead, note, terms, qr, image, spacer.
import fs from 'node:fs';
import path from 'node:path';
import { top, band, kicker, busRule, blocks, md, esc, cornerArt, ROOT } from '../lib/components.mjs';

export const meta = { kind: 'pdf', size: 'Letter 8.5x11 in', about: 'Two-page event handout: tiles, score bars, flow, tables, quote, QR',
  css: '@page { size: 8.5in 11in; margin: 0; } .print.letter .body { margin-top: 0.2in; } .art.tr { top: 0.95in; right: 0; width: 2.6in; } .art.bl { bottom: 0.42in; left: 0; width: 2.2in; }' };

const inline = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

export function render(d, ctx) {
  const art = d.art ?? 'handout';
  return (d.pages ?? []).map((p, i) => {
    const tr = art === 'none' || p.art === false ? '' : art === 'handout' ? `<div class="art tr"${i ? ' style="width:2in;top:0.9in"' : ''}>${inline('brand/art/corner-tr-handout.svg')}</div>` : cornerArt({ at: 'tr', seed: `${d.name ?? 'handout'}-tr-${i}`, style: `top:0.95in;right:0;width:${i ? 2 : 2.6}in` });
    const bl = art === 'none' || p.art === false || i ? '' : art === 'handout' ? `<div class="art bl">${inline('brand/art/corner-bl-handout.svg')}</div>` : cornerArt({ at: 'bl', w: 200, h: 150, seed: `${d.name ?? 'handout'}-bl`, style: 'bottom:0.42in;left:0;width:2.2in' });
    return `<section class="page print letter g-board">${tr}
  ${top(ctx, { label: p.label })}
  <div class="safe" style="margin-top:0.24in">${kicker(p.kicker, p.kickerAccent)}
  <h1 style="margin:0.05in 0 0.06in;${p.titleSize ? `font-size:${p.titleSize}pt` : ''}">${md(p.title)}</h1>
  ${busRule(p.bus ?? ['purple', 'yellow', 'cyan'])}
  ${p.lead ? `<p class="lead" style="max-width:6.2in">${md(p.lead)}</p>` : ''}</div>
  <div class="body"${p.gap ? ` style="gap:${p.gap}in"` : ''}>${blocks(p.blocks, ctx)}</div>
  ${bl}
  ${band({ left: d.footer ?? '', cls: d.classification })}
</section>`;
  }).join('\n');
}
