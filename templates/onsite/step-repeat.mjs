// onsite/step-repeat: media wall (step-and-repeat), 8 x 8 ft by default: the Agency 2026 wordmark and the Alberta logo in an offset
// grid, so every photo crop holds both. Vector PDF at trim size + PNG preview.
// Content: { "template": "onsite/step-repeat", "name": "...", "size": "8x8ft" | "10x8ft" | "8x10ft", "ground": "board" | "night",
//   "spacing": 1 (1 = about 20 in between marks; smaller packs them tighter) }
// Rule: marks 18 to 24 in wide and 14 to 20 in apart, so a head-and-shoulders photo always catches one of each.
import { page, meta as M, logo, wordmark, isDark } from './lib/onsite.mjs';

const SIZES = { '8x8ft': [96, 96], '10x8ft': [120, 96], '8x10ft': [96, 120] };
const dims = (d) => { const s = SIZES[d.size ?? '8x8ft']; if (!s) throw new Error(`size must be one of ${Object.keys(SIZES).join(', ')}`); return s; };
export const meta = (d) => M({ in: dims(d), size: `${d.size ?? '8x8ft'} step-and-repeat`, about: 'Step-and-repeat media wall: wordmark and Alberta logo in an offset grid', scale: 0.2 });

export function render(d) {
  const [wi, hi] = dims(d), U = 10, W = wi * U, H = hi * U, g = d.ground ?? 'board', dark = isDark(g);   // 10 design units per inch
  const k = d.spacing ?? 1, colW = 22 * U * k, rowH = 15 * U * k, out = [];
  for (let r = -1, y = -rowH * 0.3; y < H + rowH; r++, y += rowH) {
    const off = (r & 1) ? colW / 2 : 0;
    for (let c = -1, x = -colW + off; x < W + colW; c++, x += colW) {
      const useWord = ((r + c) & 1) === 0, w = useWord ? 19 * U : 15 * U;
      out.push(useWord ? wordmark(dark, `left:${x + (colW - w) / 2}px;top:${y + (useWord ? 3.4 : 2.2) * U}px;width:${w}px`)
        : logo(dark, `left:${x + (colW - w) / 2}px;top:${y + 2.2 * U}px;width:${w}px`));
    }
  }
  return page({ in: [wi, hi], design: [W, H], ground: g }, `<span class="sr-only">Agency 2026 and Government of Alberta step-and-repeat</span>` + out.join(''));
}
