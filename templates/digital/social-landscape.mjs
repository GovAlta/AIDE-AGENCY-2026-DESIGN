// digital/social-landscape: landscape social card in the invite layout. "size": "linkedin" (1200x627, default) | "x" (1600x900).
// Content: same fields as digital/social-square (preset, ground, title, date, subtitle, lines, cta, anchor, seed, sample).
import { CSS, inviteCover } from './lib/digital.mjs';
const SIZES = { linkedin: [1200, 627], x: [1600, 900] };
const dims = (d) => SIZES[d.size ?? 'linkedin'] ?? SIZES.linkedin;
export const meta = (d) => ({ kind: 'png', width: dims(d)[0], height: dims(d)[1], about: 'Landscape social card: LinkedIn 1200x627 or X 1600x900 ("size")', css: CSS });
export const render = (d, ctx) => { const [W, H] = dims(d);
  return inviteCover(d, ctx, W, H, { safe: [0.22, 0.13, 0.78, 0.84], depth: { l: 0.19, r: 0.19, t: 0.1, b: 0.12 }, chipAt: [0.63, 0.025], fsScale: 1.05, logoW: 0.1, maxLines: 3, span: { b: [0.26, 0.74], t: [0.24, 0.76] } }); };
