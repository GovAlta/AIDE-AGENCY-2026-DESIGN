// Shared helpers for the print family (templates/print/*.mjs). Not a template: make.mjs --list skips lib/ folders.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, T, asset, esc, md, tracesLayer, chipArt, qr, band } from '../../lib/components.mjs';

// styles/print.css, inlined into each template's meta.css (make.mjs writes meta.css into a <style> in the page head)
export const printCss = () => fs.readFileSync(path.join(ROOT, 'styles/print.css'), 'utf8');

// page sizes in inches; CSS px = in * 96
export const SIZES = {
  letter: [8.5, 11], tabloid: [11, 17], 'letter-landscape': [11, 8.5], 'half-letter': [5.5, 8.5], badge: [4, 3], postcard: [6, 4],
};
export const px = (inch) => Math.round(inch * 96);
export const pageCss = (w, h) => `@page { size: ${w}in ${h}in; margin: 0; }`;

// the event facts (tokens.event) for a day key: "mon" | "tue" | "wed" | 0..2
export const day = (k) => {
  const i = typeof k === 'number' ? k : { mon: 0, tue: 1, wed: 2 }[String(k).slice(0, 3).toLowerCase()];
  return i === undefined ? null : T.event.days[i];
};

export const logo = (ctx, cls = 'ab-logo', dark = false) =>
  `<img class="${cls}" src="${asset(ctx, dark ? 'brand/logos/goa-signature-white.png' : 'brand/logos/alberta-logo.svg')}" alt="Government of Alberta">`;

// the invite frame: traces on all four edges, chip near the top centre-right (as on the invite vectors)
export const inviteFrame = (o) => `${tracesLayer({ w: o.w, h: o.h, edges: o.edges ?? 'ltrb', seed: o.seed ?? 'poster', ground: o.ground, depth: o.depth ?? { l: 0.2, t: 0.17, r: 0.2, b: 0.16 }, density: o.density ?? 1.1, scale: o.scale, span: o.span })}` +
  (o.chip === false ? '' : chipArt({ size: o.chipSize ?? 54, style: o.chipStyle ?? `left:58%;top:${o.chipTop ?? '5%'};z-index:1` }));

// QR finder-eye centres must be dark: a light accent (green, yellow...) breaks the finder pattern. Use the text-safe variant.
export const qrAccent = (name) => T.textOnLight[name] ?? T.color.navy;

export { T, asset, esc, md, qr, band };
