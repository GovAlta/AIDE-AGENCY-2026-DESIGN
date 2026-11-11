// onsite/stickers: a Letter sheet of twelve 2 in round die-cut stickers (3 x 4), vector PDF + PNG preview.
// Content: { "template": "onsite/stickers", "name": "...", "designs": ["wordmark", "chip", "spectrum", "night", "day1", "day2", "day3", "cities"],
//   "cutlines": true }  designs fill the 12 places in order and repeat; leave out for the default mix.
// Each sticker carries 1/16 in bleed past its cut line. The cut line is a 0.5 pt magenta (#EC008C) circle on top, the usual "CutContour"
// convention; ask the printer which they want (guides/ONSITE.md). Only neutral marks and the event's own facts are used.
import { page, meta as M, wordmark, isDark, esc, T, E } from './lib/onsite.mjs';
import { chip as chipSvg, traces as tracesSvg } from '../../scripts/lib/vectors.mjs';

export const meta = () => M({ in: [8.5, 11], size: 'Letter sheet of 12 x 2 in round stickers', about: 'Round 2 in die-cut stickers with bleed and cut lines', scale: 2 });
const C = T.color, D = 192, BLEED = 6;   // 96 design units per inch: 2 in sticker, 1/16 in bleed

function sticker(kind, id) {
  const r = D / 2, R = r + BLEED, day = /^day[123]$/.test(kind) ? E.days[+kind[3] - 1] : null;
  const clip = `<clipPath id="k${id}"><circle cx="${R}" cy="${R}" r="${R}"/></clipPath>`;
  const ring = (c, wdt = 12) => `<circle cx="${R}" cy="${R}" r="${r - wdt / 2 - 8}" fill="none" stroke="${c}" stroke-width="${wdt}"/>`;
  const spec = `<linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">${T.spectrum.map((c, i) => `<stop offset="${(i / 8).toFixed(3)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  let body = '';
  if (kind === 'wordmark') body = `<rect width="${2 * R}" height="${2 * R}" fill="#fff"/><circle cx="${R}" cy="${R}" r="${r - 14}" fill="none" stroke="url(#g${id})" stroke-width="12"/>`;
  else if (kind === 'chip') body = `<rect width="${2 * R}" height="${2 * R}" fill="${C.navy}"/><g transform="translate(${R - 34} ${R - 34})">${chipSvg({ size: 68, lead: false })}</g>` +
    `<text x="${R}" y="${R + 66}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="20" fill="#fff">Agency <tspan fill="${T.textOnDark.maroon}">2026</tspan></text>`;
  else if (kind === 'spectrum') body = `<rect width="${2 * R}" height="${2 * R}" fill="url(#g${id})"/><circle cx="${R}" cy="${R}" r="${r - 22}" fill="#fff"/>` +
    `<text x="${R}" y="${R + 18}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="54" letter-spacing="-1.5" fill="${C.navy}">2026</text>`;
  else if (kind === 'night') body = `<rect width="${2 * R}" height="${2 * R}" fill="${C.night}"/>${tracesSvg({ w: 2 * R, h: 2 * R, edges: 'lr', seed: 'sticker-night', depth: { l: 0.3, r: 0.3 }, scale: 0.7, ground: 'night' })}` +
    `<text x="${R}" y="${R - 4}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="36" fill="#fff">Agency</text><text x="${R}" y="${R + 34}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="36" fill="#fff">2026</text>`;
  else if (day) { const c = C[day.accent], n = kind[3]; const t = day.title.split(':')[0];
    const words = t.split(' '), lines = []; let ln = ''; for (const w of words) { if ((ln + ' ' + w).trim().length > 13) { lines.push(ln.trim()); ln = w; } else ln += ' ' + w; } lines.push(ln.trim());
    body = `<rect width="${2 * R}" height="${2 * R}" fill="#fff"/>${ring(c, 14)}<text x="${R}" y="${R - 24 - (lines.length - 1) * 9}" text-anchor="middle" font-family="Geist Mono" font-weight="600" font-size="13" letter-spacing="2" fill="${T.textOnLight[day.accent]}">DAY ${n}</text>` +
      lines.map((l, j) => `<text x="${R}" y="${R + 2 + (j - (lines.length - 1) / 2) * 22 + 8}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="19" fill="${C.navy}">${esc(l)}</text>`).join(''); }
  else if (kind === 'cities') body = `<rect width="${2 * R}" height="${2 * R}" fill="${C.navy}"/>${ring('url(#g' + id + ')', 8)}<text x="${R}" y="${R - 12}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="22" fill="#fff">Edmonton</text>` +
    `<text x="${R}" y="${R + 16}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="22" fill="#fff">Calgary</text><text x="${R}" y="${R + 44}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="14" fill="${T.textOnDark.maroon}">${esc(E.dates)}</text>`;
  else throw new Error(`unknown sticker design "${kind}"`);
  return { svg: `<svg width="${2 * R}" height="${2 * R}" viewBox="0 0 ${2 * R} ${2 * R}"><defs>${clip}${spec}</defs><g clip-path="url(#k${id})">${body}</g></svg>`, word: kind === 'wordmark' };
}

export function render(d) {
  const W = 816, H = 1056, designs = (d.designs ?? ['wordmark', 'spectrum', 'night', 'day1', 'day2', 'day3', 'cities', 'wordmark', 'spectrum', 'night', 'day1', 'cities']).filter((x) => x !== 'chip');   // chip retired 2026-11-11
  const gx = (W - 3 * D) / 4, gy = (H - 4 * D) / 5, out = [];
  for (let i = 0; i < 12; i++) {
    const kind = designs[i % designs.length], col = i % 3, row = Math.floor(i / 3), x = gx + col * (D + gx), y = gy + row * (D + gy), s = sticker(kind, i);
    out.push(`<div style="left:${x - BLEED}px;top:${y - BLEED}px;width:${D + 2 * BLEED}px;height:${D + 2 * BLEED}px">${s.svg}</div>`);
    if (s.word) out.push(wordmark(false, `left:${x + 30}px;top:${y + D / 2 - 22}px;width:${D - 60}px`));
    if (d.cutlines !== false) out.push(`<div style="left:${x}px;top:${y}px;width:${D}px;height:${D}px"><svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2 - 0.35}" fill="none" stroke="#EC008C" stroke-width="0.7"/></svg></div>`);
  }
  out.push(`<div class="os-sub" style="left:${gx}px;top:${H - 26}px;font-size:10px">Agency 2026 stickers · 2 in round · magenta = cut line, 1/16 in bleed · scripts: templates/onsite/stickers.mjs</div>`);
  return page({ in: [8.5, 11], design: [W, H], ground: 'board' }, out.join(''));
}
