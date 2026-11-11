// Circuit traces in real units (inches) for large-format displays. Same seed -> same art.
// A line is { pts: [[x,y],...], w, color, grad?: {c1, c2, o1, o2, vertical?, stops?, span?}, pad: bool, alpha, glow, stop }.
// Every stroke is thin like a real PCB trace: draw() caps widths at 0.2 in (owner direction 2026-11-11: no thick ribbons, no chip).
// clipOut() cuts every line where it would enter a clear zone (header, monitor, ledge, title, QR) and puts a pad on the cut end,
// so traces look as if they were routed around the zones rather than hidden behind them.
import { T } from './model.mjs';

export const C = T.color;
export const rng = (seed) => {
  let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let s = (h >>> 0) % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
export const r3 = (n) => Math.round(n * 1000) / 1000;
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], t)).toString(16).padStart(2, '0')).join('');
export const spec = (u) => { const S = T.spectrum, n = S.length - 1, k = Math.max(0, Math.min(1, u)) * n, i = Math.min(n - 1, Math.floor(k)); return mix(S[i], S[i + 1], k - i); };

// Liang-Barsky: the [t0, t1] part of segment p->q inside rect, or null
function inside(p, q, [x0, y0, x1, y1]) {
  let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
  for (const [pp, qq] of [[-dx, p[0] - x0], [dx, x1 - p[0]], [-dy, p[1] - y0], [dy, y1 - p[1]]]) {
    if (pp === 0) { if (qq < 0) return null; continue; }
    const t = qq / pp; if (pp < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return t1 > t0 ? [t0, t1] : null;
}
// split a polyline into the pieces outside every rect; each piece knows whether its start / end was cut by a zone
export function clipOut(pts, rects) {
  const pieces = []; let cur = null, cutStart = false;
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1], at = (t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
    const iv = rects.map((r) => inside(p, q, r)).filter(Boolean).sort((x, y) => x[0] - y[0]);
    const merged = []; for (const v of iv) { const l = merged[merged.length - 1]; if (l && v[0] <= l[1]) l[1] = Math.max(l[1], v[1]); else merged.push([...v]); }
    let t = 0;
    for (const [a, b] of merged) {
      if (a > t) { if (!cur) cur = [at(t)]; cur.push(at(a)); pieces.push({ pts: cur, cutStart, cutEnd: true }); cur = null; }
      else if (cur) { pieces.push({ pts: cur, cutStart, cutEnd: true }); cur = null; }
      cutStart = true; t = Math.max(t, b);
    }
    if (t < 1) { if (!cur) cur = [at(t)]; cur.push(q); }
  }
  if (cur) pieces.push({ pts: cur, cutStart, cutEnd: false });
  return pieces.map((pc) => ({ ...pc, pts: pc.pts.filter((pt, i, arr) => !i || Math.hypot(pt[0] - arr[i - 1][0], pt[1] - arr[i - 1][1]) > 1e-6) })).filter((pc) => pc.pts.length > 1);
}
const plen = (pts) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

// one bus of parallel traces from an edge, in edge-local coords (v inward from the edge, u along it), as in scripts/lib/vectors.mjs,
// scaled for print: spacing, widths and reach in inches
export function edgeBus(rand, o) {
  const { n, s, u, reach, dir = rand() < 0.5 ? 1 : -1 } = o;
  const b0 = reach * (o.bendAt ?? (0.2 + rand() * 0.35)), Dg = Math.min(reach * 0.35, o.diag ?? (2 + rand() * 5));
  const lines = [];
  for (let i = 0; i < n; i++) {
    const ui = u + i * s, idx = dir > 0 ? n - 1 - i : i, bi = b0 + idx * s * (Math.SQRT2 - 1);
    const end = Math.min(reach, bi + Dg + (reach - bi - Dg) * (o.endVar ? 1 - rand() * o.endVar : 0.35 + rand() * 0.65));
    const pts = [[-(o.bleedIn ?? 1), ui], [bi, ui]];
    if (end > bi + Dg) pts.push([bi + Dg, ui + dir * Dg], [end, ui + dir * Dg]); else pts.push([end, ui + dir * (end - bi)]);
    lines.push(pts);
  }
  return lines;
}
// map edge-local [v, u] to face coords for edge l | r | t | b of a W x H face
export const fromEdge = (e, W, H) => ([v, u]) => (e === 'l' ? [v, u] : e === 'r' ? [W - v, u] : e === 't' ? [u, v] : [u, H - v]);

// render lines -> SVG fragment. zones = rects to keep clear; safe = [x0,y0,x1,y1] where pads may sit; padFill = ground colour
export function draw(lines, o) {
  const defs = [], out = [], glow = [];
  let gid = 0;
  const maxW = o.maxW ?? 0.2;   // thin like real traces (owner direction 2026-11-11): no stroke over 0.2 in at full size
  for (const ln0 of lines) {
    const ln = { ...ln0, w: Math.min(ln0.w, maxW) };
    let pieces = clipOut(ln.pts, o.zones || []);
    if (ln.stop) pieces = pieces.slice(0, 1);                       // a trace that grows from an edge ends at the first zone it meets
    pieces = pieces.filter((pc) => plen(pc.pts) >= (o.minLen ?? 0.8) && !(pc.cutStart && pc.cutEnd && plen(pc.pts) < (o.minIsland ?? 5)));
    for (const pc of pieces) {
      const P = pc.pts, d = 'M' + P.map(([x, y]) => `${r3(x)} ${r3(y)}`).join(' L');
      let stroke = ln.color;
      if (ln.grad) {
        const id = `g${o.id || ''}${gid++}`, [a, b] = ln.grad.vertical ? [[0, ln.grad.y1], [0, ln.grad.y2]] : ln.grad.span ? [[ln.grad.span[0], 0], [ln.grad.span[1], 0]] : [P[0], P[P.length - 1]];
        defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r3(a[0])}" y1="${r3(a[1])}" x2="${r3(b[0])}" y2="${r3(b[1])}">` +
          (ln.grad.stops || [[0, ln.grad.c1, ln.grad.o1 ?? 1], [1, ln.grad.c2 ?? ln.grad.c1, ln.grad.o2 ?? 1]]).map(([t, c, op]) => `<stop offset="${t}" stop-color="${c}"${op != null && op < 1 ? ` stop-opacity="${op}"` : ''}/>`).join('') + '</linearGradient>');
        stroke = `url(#${id})`;
      }
      const op = ln.alpha != null && ln.alpha < 1 ? ` opacity="${r3(ln.alpha)}"` : '';
      if (ln.glow) glow.push(`<path d="${d}" stroke="${ln.glowColor || ln.color}" stroke-width="${r3(ln.w * 3.2)}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.14"/>`,
        `<path d="${d}" stroke="${ln.glowColor || ln.color}" stroke-width="${r3(ln.w * 1.8)}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.26"/>`);
      out.push(`<path d="${d}" stroke="${stroke}" stroke-width="${r3(ln.w)}" stroke-linecap="${ln.butt ? 'butt' : 'round'}" stroke-linejoin="round" fill="none"${op}/>`);
      const ends = [];
      if (pc.cutEnd || (!pc.cutEnd && ln.pad)) ends.push(P[P.length - 1]);
      if (pc.cutStart && ln.padStart !== false) ends.push(P[0]);
      if (!ln.butt) for (const [x, y] of ends) {
        const sf = o.safe; if (sf && (x < sf[0] || y < sf[1] || x > sf[2] || y > sf[3])) continue;
        const pr = r3(Math.max(ln.w * 1.8, 0.13));
        out.push(`<circle cx="${r3(x)}" cy="${r3(y)}" r="${pr}" fill="${o.padFill}" stroke="${ln.color || (ln.grad && ln.grad.c2) || C.navy}" stroke-width="${r3(ln.w * 0.85)}"${op}/>`);
      }
    }
  }
  return (defs.length ? `<defs>${defs.join('')}</defs>` : '') + (glow.length ? `<g class="glow">${glow.join('')}</g>` : '') + out.join('');
}
