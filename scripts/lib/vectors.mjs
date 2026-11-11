// Agency 2026 vector library: circuit traces, ring pads, the microchip, the bus rule, the wordmark, the spectrum bar.
// Every function returns an SVG string (or a <g> fragment) and is a pure function of its options: the same seed gives the same art.
//
//   import { traces, chip, bus, wordmark, sweep, svgDoc } from './lib/vectors.mjs';
//   svgDoc(1920, 1080, traces({ w: 1920, h: 1080, edges: 'ltrb', seed: 'my-banner' }))
//
// Look (from the invite vectors, brand/art/invites): buses of thin parallel traces run in from the edges, bend at 45 degrees, and end in
// white ring pads; every trace is a thin line (owner 2026-11-11: no thick ribbons, no chip); left edge purple/blue/cyan, top lilac/pink/orange, right yellow/lime/green,
// bottom pink/orange/yellow/green. Traces stop outside the safe box so text never sits on art.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand/tokens/tokens.json'), 'utf8'));
const C = T.color;

export const rng = (seed) => {
  let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let s = (h >>> 0) % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
const r2 = (n) => Math.round(n * 100) / 100;

export const EDGE_PALETTE = {
  l: [C.purple, C.blue, C.lilac, C.cyan, C.rose, C.purple, C.blue],
  t: [C.lilac, C.rose, C.coral, C.orange, C.yellow, C.maroon, C.pink],
  r: [C.yellow, C.orange, C.lime, C.green, C.coral, C.yellow],
  b: [C.pink, C.maroon, C.orange, C.yellow, C.green, C.cyan, C.coral],
};

// one edge, in local coordinates: u runs along the edge (0..len), v runs inward from the edge (0..depth)
function edgeBuses(len, depth, scale, rand, palette, o) {
  const out = [];  // {pts:[[v,u]...], color, width, pad, grad:[c1,c2]}
  const from = (o.span?.[0] ?? 0.04) * len, to = (o.span?.[1] ?? 0.96) * len;
  let u = from + rand() * 20 * scale;
  let k = 0;
  while (u < to) {
    const n = 1 + Math.floor(rand() * (o.density >= 1.2 ? 6 : 5));                 // lines in this bus
    const s = (9 + rand() * 6) * scale;                                           // spacing
    const busW = (n - 1) * s;
    if (u + busW > to) break;
    const dir = rand() < 0.5 ? 1 : -1;                                            // bend toward +u or -u
    const reach = depth * (0.45 + rand() * 0.55);                                 // how far inward the bus goes
    const b0 = reach * (0.25 + rand() * 0.35);                                    // where it bends
    const D = Math.min(reach * 0.35, (20 + rand() * 40) * scale);                // diagonal run (in u)
    const thickAt = rand() < (o.ribbons ?? 0) ? Math.floor(rand() * n) : -1;   // one ribbon in some buses
    const color = palette[k % palette.length], color2 = palette[(k + 1) % palette.length];
    for (let i = 0; i < n; i++) {
      const ui = u + i * s;
      const idx = dir > 0 ? n - 1 - i : i;                                       // nesting: the outer line bends later
      const bi = b0 + idx * s * (Math.SQRT2 - 1);
      const end = Math.min(reach, bi + D + (reach - bi - D) * (0.35 + rand() * 0.65));
      const pts = [[0, ui], [bi, ui]];
      if (end > bi + D) pts.push([bi + D, ui + dir * D], [end, ui + dir * D]); else pts.push([end, ui + dir * (end - bi)]);
      const thick = i === thickAt;
      const alpha = o.fade ? 0.55 + rand() * 0.45 : 1;
      out.push({ pts, color: thick ? null : (rand() < 0.75 ? color : color2), width: thick ? (6 + rand() * 6) * scale : (1.6 + rand() * 1.2) * scale,
        pad: !thick && rand() < (o.pads ?? 0.85), grad: thick ? [color, color2] : null, alpha });
    }
    u += busW + (16 + rand() * 46) * scale / Math.max(0.3, o.density ?? 1);
    k++;
  }
  return out;
}

// traces({ w, h, edges: 'ltrb', seed, depth: {l,t,r,b} (fraction of the dimension), density, scale, ground, span, fade, padFill })
// returns an SVG <g>. depth sets how far into the frame the art may reach on each edge; the rest is the safe box.
export function traces(o = {}) {
  const w = o.w ?? 1920, h = o.h ?? 1080, seed = o.seed ?? 'agency', edges = o.edges ?? 'ltrb';
  const scale = o.scale ?? Math.max(0.5, Math.min(w, h) / 1080) * 1.6;
  const depth = { l: 0.16, t: 0.2, r: 0.16, b: 0.2, ...(o.depth || {}) };
  const padFill = o.padFill ?? (o.ground && T.grounds[o.ground]?.dark ? T.grounds[o.ground].bg : '#FFFFFF');
  const defs = [], parts = [];
  let gid = 0;
  for (const e of edges) {
    const rand = rng(seed + ':' + e);
    const len = e === 'l' || e === 'r' ? h : w, dim = e === 'l' || e === 'r' ? w : h;
    // keep corners clear (the invites do): an edge stops short of each neighbouring edge's art
    const nb = e === 'l' || e === 'r' ? ['t', 'b'] : ['l', 'r'];
    const auto = [edges.includes(nb[0]) ? depth[nb[0]] + 0.03 : 0.04, edges.includes(nb[1]) ? 1 - depth[nb[1]] - 0.03 : 0.96];
    const span = o.span?.[e] ?? o.spanAll ?? auto;
    const lines = edgeBuses(len, depth[e] * dim, scale, rand, o.palette?.[e] ?? EDGE_PALETTE[e], { ...o, span });
    const map = ([v, u]) => e === 'l' ? [v, u] : e === 'r' ? [w - v, u] : e === 't' ? [u, v] : [u, h - v];
    for (const ln of lines) {
      const P = ln.pts.map(map);
      const d = 'M' + P.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(' L');
      let stroke = ln.color;
      if (ln.grad) {
        const id = `tg-${seed.replace(/[^a-z0-9]/gi, '')}-${e}-${gid++}`;
        const [a, b] = [P[0], P[P.length - 1]];
        defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r2(a[0])}" y1="${r2(a[1])}" x2="${r2(b[0])}" y2="${r2(b[1])}"><stop offset="0" stop-color="${ln.grad[0]}"/><stop offset="1" stop-color="${ln.grad[1]}"/></linearGradient>`);
        stroke = `url(#${id})`;
      }
      parts.push(`<path d="${d}" stroke="${stroke}" stroke-width="${r2(ln.width)}" stroke-linecap="${ln.grad ? 'butt' : 'round'}" stroke-linejoin="round" fill="none"${ln.alpha < 1 ? ` opacity="${r2(ln.alpha)}"` : ''}/>`);
      if (ln.pad) {
        const [x, y] = P[P.length - 1], rr = r2(ln.width * 1.9 + 1.2 * scale);
        parts.push(`<circle cx="${r2(x)}" cy="${r2(y)}" r="${rr}" fill="${padFill}" stroke="${ln.color}" stroke-width="${r2(ln.width * 0.9)}"${ln.alpha < 1 ? ` opacity="${r2(ln.alpha)}"` : ''}/>`);
      }
    }
  }
  return `<g class="agency-traces">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${parts.join('')}</g>`;
}

// corner cluster (like the handout's top-right and bottom-left art): traces from one or two edges confined to a corner box
export function corner(o = {}) {
  const w = o.w ?? 300, h = o.h ?? 270, at = o.at ?? 'tr', seed = o.seed ?? 'corner-' + at;
  const edges = { tr: 'r', tl: 'l', br: 'rb', bl: 'lb' }[at] ?? 'r';
  // two-edge corners keep the edges apart: side traces in the upper part, bottom traces in the right part and shallow
  const span = at === 'bl' ? { l: [0.08, 0.5], b: [0.58, 0.96] } : at === 'br' ? { r: [0.08, 0.5], b: [0.04, 0.42] } : undefined;
  return traces({ w, h, edges: o.edges ?? edges, seed, depth: { l: 0.75, r: 0.75, t: 0.7, b: 0.4 }, scale: o.scale ?? 1.2, span,
    spanAll: at[0] === 't' ? [0.05, 0.75] : [0.25, 0.95], density: o.density ?? 1.1, pads: 0.9, ribbons: 0, ground: o.ground });
}

// bus rule: the stacked coloured rules under a headline (handout .bus). colors = token names
export function bus(o = {}) {
  const w = o.w ?? 320, colors = o.colors ?? ['purple', 'yellow', 'cyan'], hgt = o.height ?? 3, gap = o.gap ?? 3;
  const widths = o.widths ?? [1, 0.85, 0.7, 0.55];
  const rows = colors.map((c, i) => `<rect x="0" y="${i * (hgt + gap)}" width="${r2(w * (widths[i] ?? 0.5))}" height="${hgt}" rx="${hgt / 2}" fill="${C[c] ?? c}"/>`);
  return `<g class="agency-bus">${rows.join('')}</g>`;
}

// the spectrum bar (4 px under the mark, the bottom edge of quote boxes)
export function spectrumBar(o = {}) {
  const w = o.w ?? 400, hgt = o.height ?? 4, id = o.id ?? 'spec' + Math.round(w);
  return `<defs><linearGradient id="${id}" x1="0" x2="1">${T.spectrum.map((c, i) => `<stop offset="${r2(i / (T.spectrum.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${w}" height="${hgt}" fill="url(#${id})"/>`;
}

// the pink microchip from the invite, with pins on four sides and an optional lead trace down to a pad
export function chip(o = {}) {
  const s = o.size ?? 80, x = o.x ?? 0, y = o.y ?? 0, pins = o.pins ?? 7, body = o.color ?? C.pink, edge = o.edge ?? '#B0306E';
  const p = [], step = s * 0.72 / (pins - 1), pl = s * 0.13, pw = Math.max(1, s * 0.025);
  for (let i = 0; i < pins; i++) {
    const q = s * 0.14 + i * step;
    p.push(`<line x1="${r2(q)}" y1="0" x2="${r2(q)}" y2="${r2(pl)}"/><line x1="${r2(q)}" y1="${r2(s - pl)}" x2="${r2(q)}" y2="${s}"/>`,
      `<line x1="0" y1="${r2(q)}" x2="${r2(pl)}" y2="${r2(q)}"/><line x1="${r2(s - pl)}" y1="${r2(q)}" x2="${s}" y2="${r2(q)}"/>`);
  }
  const lead = o.lead === false ? '' : `<path d="M${s * 0.5} ${s} V${s * 1.25} L${s * 0.22} ${s * 1.6} V${s * 1.9}" stroke="${C.purple}" stroke-width="${r2(pw * 1.3)}" fill="none" stroke-linejoin="round"/><circle cx="${s * 0.22}" cy="${s * 1.9 + s * 0.06}" r="${r2(s * 0.06)}" fill="#fff" stroke="${C.purple}" stroke-width="${r2(pw * 1.2)}"/>`;
  return `<g class="agency-chip" transform="translate(${x} ${y})"><g stroke="${edge}" stroke-width="${r2(pw)}">${p.join('')}</g>` +
    `<rect x="${r2(pl)}" y="${r2(pl)}" width="${r2(s - 2 * pl)}" height="${r2(s - 2 * pl)}" rx="${r2(s * 0.05)}" fill="${body}" stroke="${edge}" stroke-width="${r2(pw * 1.2)}"/>` +
    `<rect x="${r2(s * 0.33)}" y="${r2(s * 0.33)}" width="${r2(s * 0.34)}" height="${r2(s * 0.34)}" fill="none" stroke="${edge}" stroke-width="${r2(pw * 1.6)}"/>${lead}</g>`;
}

// The trace underline (owner 2026-11-11: replaces the rainbow rule under "Agency"). One thin circuit trace in a single colour: it runs
// under the word, steps down at 45 degrees near the end and stops in a hollow ring pad. Geometry is in units of the word's font size s,
// so every medium draws the same shape: the CSS mark (styles/agency.css), the outlined logos (scripts/outline-wordmark.py), displays,
// Office and the show all follow these numbers.
export const UNDERLINE = { y: 0.06, stroke: 0.045, jog: 0.16, tail: 0.16, pad: 0.07, padStroke: 0.04 };   // all x font size
export const underlineColor = (dark) => (dark ? T.textOnDark.blue : C.blue);
export function traceUnderline(o = {}) {
  const s = o.size ?? 64, w = o.w ?? s * 4, U = UNDERLINE, c = o.color ?? underlineColor(o.dark);
  const sw = r2(U.stroke * s), y0 = r2(U.y * s), jx = r2(w - (U.jog + U.tail + U.pad * 2) * s), y1 = r2(y0 + U.jog * s), x2 = r2(w - U.pad * 2 * s);
  return `<g class="agency-underline" fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M0 ${y0} H${jx} L${r2(jx + U.jog * s)} ${y1} H${x2}" stroke-width="${sw}"/>` +
    `<circle cx="${r2(w - U.pad * s)}" cy="${y1}" r="${r2(U.pad * s - U.padStroke * s / 2)}" stroke-width="${r2(U.padStroke * s)}" fill="${o.padFill ?? 'none'}"/></g>`;
}

// "Agency 2026" wordmark: navy Agency, maroon 2026, the trace underline beneath. Live text (Inter ExtraBold): render through a browser
// that has the fonts or use brand/logos/agency-2026-wordmark*.svg|png (exported from this) or the outlined versions.
// o.year === '' gives "Agency" alone (displays, where the date and year are left off).
export function wordmark(o = {}) {
  const size = o.size ?? 64, dark = !!o.dark, ink = dark ? '#FFFFFF' : C.navy, yr = dark ? T.textOnDark.maroon : C.maroon;
  const year = o.year ?? '2026', w = year ? size * 6.47 : size * 3.6;   // measured: Inter 800 'Agency 2026' is 6.47 x size wide, 'Agency' 3.6
  return `<g class="agency-wordmark"><text x="0" y="${r2(size * 0.86)}" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="${size}" letter-spacing="${r2(-0.01 * size)}" fill="${ink}">Agency${year ? `<tspan dx="${r2(size * 0.12)}" fill="${yr}">${year}</tspan>` : ''}</text>` +
    `<g transform="translate(0 ${r2(size * 1.1)})">${traceUnderline({ size, w: r2(w), dark })}</g></g>`;
}

// bus sweep band: a band of horizontal coloured traces across the full width (dividers, banner footers, the MVAI transition as a still)
export function sweep(o = {}) {
  const w = o.w ?? 1920, hgt = o.h ?? 60, n = o.lines ?? 9, rand = rng(o.seed ?? 'sweep');
  const parts = [];
  for (let i = 0; i < n; i++) {
    const y = r2((i + 0.5) * hgt / n), x0 = r2(rand() * w * 0.12), x1 = r2(w - rand() * w * 0.12), c = T.spectrum[i % T.spectrum.length];
    const sw = r2(i % 4 === 1 ? hgt / n * 0.7 : Math.max(1.5, hgt / n * 0.22));
    parts.push(`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`);
    if (i % 4 !== 1) parts.push(`<circle cx="${x1}" cy="${y}" r="${r2(sw * 1.8)}" fill="#fff" stroke="${c}" stroke-width="${r2(sw * 0.9)}"/>`);
  }
  return `<g class="agency-sweep">${parts.join('')}</g>`;
}

export const svgDoc = (w, h, inner, o = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${o.bg ? `<rect width="${w}" height="${h}" fill="${o.bg}"/>` : ''}${inner}</svg>`;
