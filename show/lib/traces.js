/* Animated circuit traces for the stage (plain SVG, driven by time). The geometry is the motion library's mkTraces
 * (motion/library/agency-pieces.js) scaled to the stage: traces run in from an edge, bend once, and end in a ring pad.
 *   const tr = traces({ w: 1920, h: 1080, sets: [{ side: 'l', n: 9, ... }, { side: 'r', ... }], flow: true, nodeFill: '#fff' })
 *   stageEl.append(tr.el); tr.draw(t)   // t in seconds since the scene started; draw-in takes ~1 s, then pulses flow if flow is on
 */
const SVGNS = 'http://www.w3.org/2000/svg';
const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const eo = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

export const PALETTE = {
  left: ['--plum', '--blue', '--pink', '--cyan', '--lilac'],
  right: ['--orange', '--yellow', '--green', '--pink', '--orange'],
};

function make(W, H, side, n, o) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0.5 : i / (n - 1), v0 = o.v0 + (o.v1 - o.v0) * f, r = ((i * 7919 + o.seed) % 97) / 97;
    const reach = o.reach * (0.6 + 0.4 * r), b = (i % 3 === 0 ? -1 : i % 3 === 1 ? 1 : 0) * o.bend * (0.5 + r * 0.5), k = reach * (0.35 + 0.2 * r);
    const raw = [[-40, v0], [k, v0], [k + Math.abs(b), v0 + b], [reach, v0 + b]];
    const map = ([u, v]) => (side === 'l' ? [u, v] : side === 'r' ? [W - u, v] : side === 't' ? [v, u] : [v, H - u]);
    const wide = i % 4 === 2;
    list.push({ pts: raw.map(map), end: map(raw[3]), color: o.colors[i % o.colors.length], w: o.thin, r: o.node });
  }
  return list;
}

// default sets for a 1920x1080 stage (the library's openL/openR at 12x)
export const SETS = {
  // reach stays under ~20% of the width so text columns (left edge 400 px and more) never sit on art
  frame: [{ side: 'l', n: 9, v0: 110, v1: 860, reach: 370, bend: 70, seed: 3, colors: PALETTE.left }, { side: 'r', n: 9, v0: 110, v1: 860, reach: 370, bend: 70, seed: 11, colors: PALETTE.right }],
  edge: [{ side: 'l', n: 8, v0: 96, v1: 870, reach: 300, bend: 60, seed: 5, colors: PALETTE.left }, { side: 'r', n: 8, v0: 96, v1: 870, reach: 300, bend: 60, seed: 17, colors: PALETTE.right }],
  low: [{ side: 'b', n: 14, v0: 140, v1: 1780, reach: 190, bend: 60, seed: 23, colors: [...PALETTE.left, ...PALETTE.right] }],
  top: [{ side: 't', n: 14, v0: 140, v1: 1780, reach: 170, bend: 60, seed: 7, colors: [...PALETTE.right, ...PALETTE.left] }],
  right: [{ side: 'r', n: 10, v0: 90, v1: 990, reach: 520, bend: 84, seed: 29, colors: PALETTE.right }],
};

export function traces(o = {}) {
  const W = o.w ?? 1920, H = o.h ?? 1080, sets = o.sets ?? SETS.frame;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  Object.assign(svg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', overflow: 'visible', opacity: o.opacity ?? 1 });
  const items = [];
  let idx = 0;
  for (const s of sets) {
    for (const tr of make(W, H, s.side, s.n, { wide: s.wide ?? 28, thin: s.thin ?? 6.5, node: s.node ?? 12, ...s })) {
      const g = document.createElementNS(SVGNS, 'g'), pts = tr.pts.map((p) => p.map((x) => x.toFixed(1)).join(',')).join(' ');
      const line = document.createElementNS(SVGNS, 'polyline');
      line.setAttribute('points', pts); line.setAttribute('fill', 'none'); line.setAttribute('stroke', `var(${tr.color})`);
      line.setAttribute('stroke-width', tr.w); line.setAttribute('pathLength', '1'); line.setAttribute('stroke-dasharray', '1 1'); line.setAttribute('stroke-dashoffset', '1');
      line.setAttribute('stroke-linejoin', 'round');
      g.append(line);
      let pulse = null;
      if (o.flow) {
        pulse = document.createElementNS(SVGNS, 'polyline');
        pulse.setAttribute('points', pts); pulse.setAttribute('fill', 'none'); pulse.setAttribute('stroke', o.pulse ?? '#FFFFFF');
        pulse.setAttribute('stroke-width', tr.w > 12 ? tr.w * 0.28 : tr.w * 1.2); pulse.setAttribute('pathLength', '1'); pulse.setAttribute('stroke-dasharray', '0.04 0.96'); pulse.setAttribute('opacity', '0');
        pulse.setAttribute('stroke-linecap', 'round');
        g.append(pulse);
      }
      let node = null;
      if (tr.r) {
        node = document.createElementNS(SVGNS, 'circle');
        node.setAttribute('cx', tr.end[0].toFixed(1)); node.setAttribute('cy', tr.end[1].toFixed(1)); node.setAttribute('r', '0');
        node.setAttribute('fill', o.nodeFill ?? '#FFFFFF'); node.setAttribute('stroke', `var(${tr.color})`); node.setAttribute('stroke-width', tr.w * 0.9);
        g.append(node);
      }
      svg.append(g);
      items.push({ line, pulse, node, r: tr.r, i: idx++ });
    }
  }
  const delay = o.delay ?? 0, stagger = o.stagger ?? 0.05, dur = o.dur ?? 0.55;
  return {
    el: svg,
    // t: seconds since the scene started. out: 0..1 retract (used on exit)
    draw(t, out = 0) {
      for (const it of items) {
        const p = cl((t - delay - (it.i % 9) * stagger) / dur), q = eo(p) * (1 - eo(out));
        it.line.setAttribute('stroke-dashoffset', (1 - q).toFixed(4));
        if (it.node) it.node.setAttribute('r', (it.r * Math.max(0, back(cl((p - 0.8) / 0.4))) * (1 - out)).toFixed(2));
        if (it.pulse) {
          const on = p >= 1 ? cl((t - delay - 1.2) / 0.6) * (1 - out) : 0;
          it.pulse.setAttribute('opacity', (on * 0.75).toFixed(3));
          it.pulse.setAttribute('stroke-dashoffset', (-((t * 0.22 + it.i * 0.137) % 1)).toFixed(4));
        }
      }
    },
  };
}
