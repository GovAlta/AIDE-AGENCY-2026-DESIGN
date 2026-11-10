// Agency 2026 QR codes as clean SVG. Square or dot modules in navy, finder eyes with an accent centre, optional centre badge.
//   import { qrSvg } from './lib/qr.mjs';  qrSvg('https://example.ca', { style: 'dots', accent: 'blue', badge: 'chip' })
// Rules (guides/QR.md): dark modules on a light ground only; quiet zone of 4 modules; at least 2 cm (0.8 in) printed; test every code
// with a phone before it ships; a centre badge forces error correction H.
import QRCode from 'qrcode';
import { T } from './vectors.mjs';

const C = T.color;
const r2 = (n) => Math.round(n * 100) / 100;

export function qrSvg(text, o = {}) {
  const badge = o.badge ?? null;                                          // null | 'chip' | 'a' (Agency "A") | text up to 4 chars
  const ecl = badge ? 'H' : (o.ecl ?? 'M');
  const q = QRCode.create(String(text), { errorCorrectionLevel: ecl });
  const n = q.modules.size, data = q.modules.data, quiet = o.quiet ?? 4, cell = o.cell ?? 10;
  const W = (n + quiet * 2) * cell, ink = o.ink ?? C.navy, bg = o.bg ?? '#FFFFFF', accent = T.textOnLight[o.accent ?? 'blue'] ?? C[o.accent] ?? o.accent;   // eye centres need contrast: light accents (yellow, green) break decoding, so use the text-safe shade
  const style = o.style ?? 'rounded';                                     // square | rounded | dots
  const isEye = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const bw = badge ? Math.round(n * 0.22) | 1 : 0, b0 = (n - bw) / 2;     // centre badge area (modules), cleared
  const inBadge = (x, y) => badge && x >= b0 - 0.5 && x < b0 + bw + 0.5 && y >= b0 - 0.5 && y < b0 + bw + 0.5;
  const parts = [`<rect width="${W}" height="${W}" fill="${bg}" rx="${o.rounded === false ? 0 : cell * 1.2}"/>`];
  const mods = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!data[y * n + x] || isEye(x, y) || inBadge(x, y)) continue;
    const px = (x + quiet) * cell, py = (y + quiet) * cell;
    if (style === 'dots') mods.push(`<circle cx="${r2(px + cell / 2)}" cy="${r2(py + cell / 2)}" r="${r2(cell * 0.5)}"/>`);
    else if (style === 'rounded') mods.push(`<rect x="${px - 0.2}" y="${py - 0.2}" width="${cell + 0.4}" height="${cell + 0.4}" rx="${r2(cell * 0.18)}"/>`);
    else mods.push(`<rect x="${px}" y="${py}" width="${cell + 0.3}" height="${cell + 0.3}"/>`);
  }
  parts.push(`<g fill="${ink}">${mods.join('')}</g>`);
  for (const [ex, ey] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    const px = (ex + quiet) * cell, py = (ey + quiet) * cell, rr = style === 'square' ? 0 : cell * 0.9;
    parts.push(`<rect x="${px + cell / 2}" y="${py + cell / 2}" width="${cell * 6}" height="${cell * 6}" rx="${rr}" fill="none" stroke="${ink}" stroke-width="${cell}"/>`,
      `<rect x="${px + cell * 2}" y="${py + cell * 2}" width="${cell * 3}" height="${cell * 3}" rx="${style === 'square' ? 0 : cell * 0.5}" fill="${accent}"/>`);
  }
  if (badge) {
    const s = bw * cell, bx = (b0 + quiet) * cell, by = bx, cx = bx + s / 2;
    parts.push(`<rect x="${bx}" y="${by}" width="${s}" height="${s}" rx="${s * 0.18}" fill="${badge === 'chip' ? C.pink : C.navy}"/>`);
    if (badge === 'chip') parts.push(`<rect x="${r2(bx + s * 0.3)}" y="${r2(by + s * 0.3)}" width="${r2(s * 0.4)}" height="${r2(s * 0.4)}" fill="none" stroke="#B0306E" stroke-width="${r2(s * 0.07)}"/>`);
    else parts.push(`<text x="${cx}" y="${r2(by + s * 0.68)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="${r2(s * (String(badge).length > 2 ? 0.36 : 0.56))}" fill="#fff">${badge === 'a' ? 'A' : String(badge).slice(0, 4)}</text>`);
  }
  const size = o.size ?? W;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${W} ${W}" role="img" aria-label="QR code: ${String(text).replace(/[<&"]/g, '')}">${parts.join('')}</svg>`;
}
