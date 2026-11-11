// Display design variants. Each returns { lines: [...], extras: svg string, zones: [extra clear rects] } for one face (face coords,
// inches, y down, floor at y = H), except wrap, which draws once on the unrolled strip (front, right, back, left side by side) so the
// traces run unbroken round the kiosk's corners.
//   rise      bus traces rise from the floor, heavier near the floor, lines fading as they climb
//   rails     traces run down both long edges and branch inward; the centre stays clean
//   wrap      bands of traces flow round all four faces of a kiosk (one continuous system), with drops to the floor
//   spectrum  thin diagonal buses in spectrum order (purple to cyan), like the invite's ribbons drawn as traces
//   night     night-navy ground, rails and rising traces with a soft glow, white type
//   converge  buses climb from the floor and converge on the monitor (a kiosk) or the title / QR / centre (a panel)
// All traces are thin (draw() caps strokes at 0.2 in). There is no chip and there are no ribbons (owner direction 2026-11-11).
import { rng, edgeBus, fromEdge, spec, C } from './traces.mjs';
import { T } from './model.mjs';

const PAL = {
  l: [C.purple, C.blue, C.lilac, C.cyan, C.rose], r: [C.yellow, C.orange, C.lime, C.green, C.coral],
  b: [C.pink, C.maroon, C.orange, C.yellow, C.green, C.cyan],
};
const kscale = (face) => Math.max(0.8, Math.min(1.25, face.W / 30));
const thin = (rand, k) => (0.085 + rand() * 0.045) * k;
const headerBottom = (face) => (face.zones.find((z) => z.id === 'header') || { rect: [0, 0, 0, 1.5] }).rect[3];

// shoulders: short buses that enter from both long edges in the band between the header and the first zone below it (the monitor on a
// kiosk front), so the face reads as one composition. They stop at the first zone they meet and never run behind the lockup.
export function shoulders(face, seed, o = {}) {
  const rand = rng(seed + ':shoulders'), k = kscale(face), lines = [], W = face.W, H = face.H, hb = headerBottom(face);
  const below = face.zones.filter((z) => z.id !== 'header' && z.rect[1] > hb).map((z) => z.rect[1]);
  const y1 = Math.min(hb + Math.max(4, H * 0.12), ...(below.length ? below : [H]));
  for (const side of ['l', 'r']) {
    const pal = (o.palette || PAL)[side], map = fromEdge(side, W, H);
    let u = hb + 0.5 + rand() * 0.6;
    for (let g = 0; g < 2 && u < y1 - 0.6; g++) {
      const n = 2 + Math.floor(rand() * 3), sp = 0.42 * k;
      if (u + (n - 1) * sp > y1 - 0.4) break;
      edgeBus(rand, { n, s: sp, u, reach: W * (0.22 + rand() * 0.2), dir: 1, diag: 0.8 + rand() * 1.2 }).forEach((pp, i) =>
        lines.push({ pts: pp.map(map), stop: true, w: thin(rand, k) * 1.1, color: pal[(i + g) % pal.length], pad: true, glow: o.glow }));
      u += (n - 1) * sp + 0.9 + rand() * 1.2;
    }
  }
  return lines;
}

export function rise(face, r, seed) {
  const rand = rng(seed + ':rise'), k = kscale(face), lines = [], W = face.W, H = face.H, map = fromEdge('b', W, H);
  let u = 0.3 + rand() * 0.6;
  while (u < W - 0.6) {
    const n = 1 + Math.floor(rand() * 6), s = (0.42 + rand() * 0.2) * k;
    if (u + (n - 1) * s > W - 0.3) break;
    const ribbon = rand() < 0.35 ? Math.floor(rand() * n) : -1;   // one heavier trace (0.17 in), never a ribbon
    const reachThin = H * (0.28 + rand() * 0.52), reachRib = H * (0.08 + rand() * 0.2);
    const col = spec(u / W), col2 = spec(Math.min(1, u / W + 0.12));
    const pts = edgeBus(rand, { n, s, u, reach: reachThin, diag: 1.5 + rand() * 4 });
    pts.forEach((p, i) => {
      const isRib = i === ribbon;
      const P = isRib ? edgeBus(rand, { n: 1, s, u: u + i * s, reach: reachRib, diag: 1 + rand() * 2 })[0] : p;
      const top = Math.max(...P.map((q) => q[0]));
      const Q = P.map(map);
      lines.push(isRib
        ? { pts: Q, stop: true, w: 0.17, pad: true, color: col, grad: { vertical: true, y1: H, y2: H - top, c1: col, c2: col2, o1: 1, o2: 0.4 } }
        : { pts: Q, stop: true, w: thin(rand, k), color: rand() < 0.7 ? col : col2, pad: rand() < 0.85, alpha: 1 - 0.45 * (top / H) });
    });
    u += (n - 1) * s + (0.6 + rand() * 2.2) * k;
  }
  lines.push(...shoulders(face, seed));
  return { lines };
}

export function rails(face, r, seed, o = {}) {
  const rand = rng(seed + ':rails'), k = kscale(face), lines = [], W = face.W, H = face.H, map = fromEdge('t', W, H);
  for (const side of ['l', 'r']) {
    const n = 6 + Math.floor(rand() * 3), s = (0.44 + rand() * 0.1) * k, pal = (o.palette || PAL)[side];
    const u0 = side === 'l' ? 0.5 * k : W - 0.5 * k - (n - 1) * s;
    const bus = edgeBus(rand, { n, s, u: u0, reach: H + 2, dir: side === 'l' ? 1 : -1, bendAt: 0.45 + rand() * 0.2, diag: (1.2 + rand() * 1.4) * k, endVar: 0.0001 });
    const ribbon = Math.floor(rand() * n), ribbon2 = (ribbon + 3) % n;
    bus.forEach((p, i) => {
      const Q = p.map(map), c = pal[i % pal.length];
      lines.push({ pts: Q, w: thin(rand, k) * 1.25, color: c, pad: true, glow: o.glow });
    });
    // stubs: short branches from the innermost rail line toward the centre, ending in pads
    const inner = side === 'l' ? bus[n - 1].map(map) : bus[0].map(map);
    const xAt = (y) => { for (let i = 0; i < inner.length - 1; i++) { const [a, b] = [inner[i], inner[i + 1]]; if ((y - a[1]) * (y - b[1]) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return inner[inner.length - 1][0]; };
    const stubs = 4 + Math.floor(rand() * 4);
    for (let j = 0; j < stubs; j++) {
      const y = headerBottom(face) + 2 + rand() * (H - headerBottom(face) - 6), x = xAt(y), L = (2 + rand() * 5) * k, dir = side === 'l' ? 1 : -1;
      const dy = (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 1.2);
      lines.push({ stop: true, pts: [[x, y], [x + dir * L * 0.4, y], [x + dir * (L * 0.4 + Math.abs(dy)), y + dy], [x + dir * (L + Math.abs(dy)), y + dy]], w: thin(rand, k) * 1.1, color: pal[(j + 2) % pal.length], pad: true, padStart: false, glow: o.glow });
      if (rand() < 0.5) lines.push({ pts: [[x, y + 0.45 * k], [x + dir * L * 0.4 - 0.19 * k * dir, y + 0.45 * k], [x + dir * (L * 0.4 - 0.19 * k + Math.abs(dy)), y + dy + 0.45 * k], [x + dir * (L * 0.7 + Math.abs(dy)), y + dy + 0.45 * k]], w: thin(rand, k), color: pal[(j + 3) % pal.length], pad: true, padStart: false, glow: o.glow });
    }
  }
  if (!o.noShoulders) lines.push(...shoulders(face, seed, { glow: o.glow, palette: o.palette }));
  return { lines };
}

// wrap: drawn once on the unrolled strip; the caller shifts it into each face
export function wrapStrip(r, seed) {
  const rand = rng(seed + ':wrap'), k = Math.max(0.8, Math.min(1.25, r.W / 30)), H = r.H, SW = r.stripW, lines = [];
  const hb = Math.max(...r.faces.map(headerBottom));
  const bands = [
    { y: hb + 1.6, n: 5, pal: [C.purple, C.blue, C.lilac, C.cyan], range: [hb + 0.8, hb + 5] },
    { y: H - H * 0.47, n: 6, pal: [C.pink, C.coral, C.orange, C.yellow, C.green], range: [H - H * 0.52, H - H * 0.4] },
    { y: H - H * 0.17, n: 5, pal: [C.green, C.cyan, C.blue, C.purple], range: [H - H * 0.22, H - H * 0.1] },
  ];
  const ledge = r.faces.find((f) => f.ledge);
  if (ledge) { const lb = ledge.ledge.y + ledge.ledge.thickness + 1.4; if (bands[1].y < lb) { bands[1].y = lb; bands[1].range = [lb, lb + 4]; } }
  bands.forEach((b, bi) => {
    const s = 0.48 * k, base = [];
    let u = -1, y = b.y; base.push([u, y]);
    while (u < SW + 1) {
      u += 7 + rand() * 13;
      let dy = (rand() < 0.5 ? -1 : 1) * (1.2 + rand() * 2.6);
      if (y + dy < b.range[0] || y + dy + (b.n - 1) * s > b.range[1] + (b.n - 1) * s) dy = -dy;
      if (u + Math.abs(dy) > SW + 1) { base.push([SW + 1.5, y]); break; }
      base.push([u, y], [u + Math.abs(dy), y + dy]); u += Math.abs(dy); y += dy;
    }
    if (base[base.length - 1][0] < SW + 1) base.push([SW + 1.5, y]);
    const ribbon = bi === 1 ? 2 : -1;
    for (let i = 0; i < b.n; i++) {
      // nest the 45-degree jogs: a lower line turns earlier on the way down and later on the way up
      const pts = base.map(([x, yy], j) => {
        if (j === 0 || j === base.length - 1) return [x, yy + i * s];
        const prev = base[j - 1], next = base[j + 1] || base[j], sg = j % 2 ? Math.sign(next[1] - yy) : Math.sign(yy - prev[1]);
        return [x - i * s * 0.414 * sg, yy + i * s];
      });
      if (i === ribbon) lines.push({ pts, w: 0.16, color: C.pink, grad: { stops: T.spectrum.map((c, j) => [+(j / (T.spectrum.length - 1)).toFixed(3), c, 1]) } });
      else lines.push({ pts, w: (0.13 + rand() * 0.04) * k, color: b.pal[i % b.pal.length], pad: false });
    }
    // drops and rises from the band, with pads
    const drops = Math.floor(SW / 9);
    for (let d = 0; d < drops; d++) {
      const x = 2 + rand() * (SW - 4), down = bi === 2 || rand() < 0.5, i = down ? b.n - 1 : 0;
      const yb = b.y + i * s + (down ? 0.4 : -0.4), L = (down ? H + 1 - yb : 1.5 + rand() * 4), jog = (rand() < 0.5 ? -1 : 1) * (0.8 + rand() * 1.2);
      const yy = down ? yb + Math.min(L * 0.4, 6) : yb - L * 0.5;
      const pts = down ? [[x, yb], [x, yy], [x + jog, yy + Math.abs(jog)], [x + jog, H + 1]] : [[x, yb], [x, yy], [x + jog, yy - Math.abs(jog)], [x + jog, yb - L]];
      lines.push({ pts, w: 0.11 * k, color: b.pal[(d + 1) % b.pal.length], pad: !down, padStart: true });
    }
  });
  return { lines };
}

export function spectrumBuses(face, r, seed) {
  const rand = rng(seed + ':spectrum'), k = kscale(face), lines = [], W = face.W, H = face.H, hb = headerBottom(face);
  // a main bus of thin traces in spectrum order, rising at 45 degrees from the floor; each trace ends at its own length in a pad
  const bus = (x0, y0, n, sp, reach, up = true) => {
    for (let i = 0; i < n; i++) {
      const c = spec(i / (n - 1)), off = i * sp * Math.SQRT2;
      const L = reach * (0.55 + rand() * 0.45), xs = x0 + off, ys = y0;
      const xe = xs + L, ye = up ? ys - L : ys + L, tail = (0.8 + rand() * 2.2) * k;
      lines.push({ pts: [[xs, ys], [xe, ye], [xe, ye - tail]], w: 0.12, color: c, pad: true, stop: true });
    }
  };
  bus(-3 - rand() * 2, H + 1, 13, 0.36 * k, Math.min(W * 1.15, H * 0.62));
  bus(-1.5, H * 0.72 + rand() * H * 0.06, 9, 0.34 * k, W * 0.55);
  // thin companions from the right edge, and a bus from the left under the header
  const mr = fromEdge('r', W, H);
  edgeBus(rand, { n: 5, s: 0.4 * k, u: H * (0.55 + rand() * 0.1), reach: W * 0.3, dir: -1 }).forEach((p, i) => lines.push({ pts: p.map(mr), stop: true, w: 0.11, color: spec(0.55 + i * 0.1), pad: true }));
  const ml = fromEdge('l', W, H);
  edgeBus(rand, { n: 4, s: 0.42 * k, u: hb + 1.4, reach: W * 0.35, dir: 1 }).forEach((p, i) => lines.push({ pts: p.map(ml), stop: true, w: 0.11, color: [C.lilac, C.rose, C.pink, C.purple][i], pad: true }));
  lines.push(...shoulders(face, seed).filter((l) => l.pts[0][0] > W / 2));
  return { lines };
}

export function night(face, r, seed) {
  const a = rails(face, r, seed + 'n', { glow: true, noRibbon: true, palette: { l: [C.cyan, C.blue, C.lilac, C.rose, C.purple], r: [C.yellow, C.lime, C.green, C.orange, C.coral] } });
  const b = rise({ ...face }, r, seed + 'n');
  const lowRise = b.lines.filter((l) => !l.grad).map((l) => ({ ...l, glow: true, alpha: Math.min(1, (l.alpha || 1) + 0.1) }));
  return { lines: [...a.lines, ...lowRise.filter((_, i) => i % 2 === 0)] };
}

// converge: thin buses climb from the floor and turn at 45 degrees toward a focus (the monitor on a kiosk front; the QR code, the title or
// a quiet centre on a panel), ending in pads at the edge of its clear zone
export function converge(face, r, seed) {
  const rand = rng(seed + ':converge'), k = kscale(face), lines = [], W = face.W, H = face.H, hb = headerBottom(face);
  const z = face.zones.find((q) => q.id === 'monitor') || face.zones.find((q) => q.id === 'qr') || face.zones.find((q) => q.id === 'title');
  let F = z ? [...z.rect] : null;
  const extra = [];
  if (!F) { const y0 = hb + (H - hb) * 0.3; F = [W * 0.32, y0, W * 0.68, y0 + (H - hb) * 0.14]; extra.push(F); }   // a quiet focal area
  const fc = (F[0] + F[2]) / 2, fw = Math.min(F[2], W - 1) - Math.max(F[0], 1), fx0 = fc - fw * 0.3, fx1 = fc + fw * 0.3;   // converge on the middle of the focus
  const n = Math.max(10, Math.round(W / 1.5)), xs = [];
  let x = 0.6 + rand() * 0.5;
  while (xs.length < n && x < W - 0.4) { const g = 1 + Math.floor(rand() * 4); for (let j = 0; j < g && xs.length < n; j++) { xs.push(x); x += 0.42 * k; } x += (0.6 + rand() * 1.4) * k; }
  const yb = H - (H - F[3]) * (0.35 + rand() * 0.2);
  xs.forEach((x0, i) => {
    const xt = fx0 + (fx1 - fx0) * (xs.length > 1 ? i / (xs.length - 1) : 0.5), dx = xt - x0;
    const yBend = yb + (Math.abs(dx) > 0 ? Math.min(3, Math.abs(dx) * 0.05) : 0);
    const c = spec(i / Math.max(1, xs.length - 1));
    lines.push({ pts: [[x0, H + 1], [x0, yBend], [xt, yBend - Math.abs(dx)], [xt, F[1] - 1]], w: 0.12, color: c, pad: true, stop: true });
  });
  lines.push(...shoulders(face, seed));
  return { lines, zones: extra };
}

export const DESIGNS = { rise, rails, spectrum: spectrumBuses, night, converge };
