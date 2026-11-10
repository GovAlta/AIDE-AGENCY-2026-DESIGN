// digital/story: 1080x1920 vertical story (Instagram, Teams and Viva stories, phone wallpapers). Keeps the top 250 px and bottom 300 px
// free of text (platform UI covers them). Content: same fields as digital/social-square, plus "body" (one short sentence under the stack).
import { CSS, inviteCover } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 1080, height: 1920, about: 'Vertical story 1080x1920 in the invite layout', css: CSS };
export const render = (d, ctx) => inviteCover(d, ctx, 1080, 1920, { safe: [0.1, 0.2, 0.9, 0.76], depth: { l: 0.09, r: 0.09, t: 0.16, b: 0.16 }, chipAt: [0.6, 0.075], fsScale: 1.25, logoW: 0.1, maxLines: 4, titleMax: 230, span: { b: [0.3, 0.7] } });
