// Network stage (architecture explainers): a circuit-board world of zones, nodes and thin traces seen through a perspective camera,
// with packets (requests, agents, people, results) that ride the traces, permission gates, an audit ledger and container spawn.
// It is the diagram equivalent of the map stage: product-neutral and fully data-driven. Nothing here names a product.
// Plugs into the frame contract (web/main.js). Canvas 2D with its own projection: a few milliseconds a frame, no WebGL.
//
//   film.config.json: "stage": "/kit/modules/network-stage.js",
//     "network": {
//       "zones": [ { "id": "people", "title": "People", "kind": "people|core|systems|cloud|external", "box": [x, y, w, h], "accent": "blue", "cols": 1,
//                    "spawnBox": [x, y, w, h] (where spawned containers go, when the zone also holds nodes) } ],
//       "nodes": [ { "id": "ana", "zone": "people", "label": "Analyst", "sub": "asks by voice", "icon": "user" (a Lucide name),
//                    "kind": "person|agent|service|system|container|store|gate|ledger", "pos": [x, y] (else a grid inside the zone), "accent": "cyan", "w": 190 } ],
//       "edges": [ { "id": "ask", "from": "ana", "to": "core", "accent": "blue", "via": [[x, y], ...] (optional waypoints),
//                    "gate": { "scope": "repo:write", "at": 0.5 } } ] }
//   World units are pixels at zoom 1 and tilt 0, so a 1920 x 1080 layout fills the frame. Traces are routed like a circuit board:
//   horizontal and vertical runs joined by 45-degree bends, ring pads at both ends.
//
// stateAt(t).world.net = {
//   cam: { x, y, zoom, tilt (degrees: 0 = flat diagram, 50-60 = cinematic), rot (degrees), ox, oy (screen shift in px) },
//   time: t,                                           drives small idle motion (activity bars, flicker); pass the film time
//   zonesA: { id: 0..1 },                              zone plates (default 1)
//   nodes:  { id: { a, pulse 0..1, state: 'idle|active|done|blocked', badge } },   default a = 1, idle
//   edges:  { id: { p (0..1 draw-on), a } },           default p = 1, a = 1
//   packets: [{ edge | path: ['e1', 'e2:rev'], u (0..1 along), label, kind: 'request|agent|result|human', accent, trail (0..1 of the path) }],
//   gates:  { edgeId: { open (0..1 reveal of the decision), result: 'allow|deny|ask', label, ask: { to: nodeId, p } } },
//   ledger: { node: id, title, lines: [{ text, result }], shown: n (may be fractional: the newest line types on) },
//   spawn:  { zone, of (capacity of the grid), count (how many are running; may be fractional), accent },
//   focus:  nodeId | [ids],                            "you are here": everything else dims; a ring marks the focus
//   steps:  [{ n: 1, node | edge, u, a }],             numbered flow steps (1, 2, 3) pinned to a node or a point on a trace
//   notes:  [{ node | edge, u, text, sub, side: 'l|r|t|b', a }],   plain-language captions with a leader line
//   legend: 0..1                                       a chip row that says what a trace, a packet, a gate and a ledger line mean
// }
// Labels and the kit cursor can also attach to the world: ui.labels[].lonLat = stage.world('nodeId') or [x, y] world units.
//
// Helpers for timelines:
//   stage.frame(ids, pad, tilt, rot) -> { x, y, zoom, tilt, rot, ox, oy } that fits nodes and/or zones in the safe area at that tilt          stage.nodeXY(id) -> screen { x, y } (last frame's camera)
//   stage.pathOf(edge | [edges])   -> { len, at(u) -> [x, y] world }                         stage.along(edge | [edges], u) -> screen { x, y }
//   stage.gateU(edgeId)            -> where the gate sits on its edge (0..1)                  stage.world(id) -> [x, y] world centre of a node
//   stage.spawnFrame(zone, of, n, pad, tilt, rot) -> the camera that frames the first n containers  stage.swarm(t, { edges, per, speed, seed, kinds }) -> packets[]
const TAU = Math.PI * 2, F = 1900;   // F: focal length in px (perspective strength)

export async function createStage(el, { config, helpers: H }) {
  const T = await fetch('/brand/tokens/tokens.json').then(r => r.json());
  const NET = config.network || { zones: [], nodes: [], edges: [] };
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; cv.style.cssText = 'position:absolute;inset:0;width:1920px;height:1080px';
  el.appendChild(cv); const g = cv.getContext('2d');
  let errors = 0;

  // ---------- colours: the theme's values, from the tokens ----------
  const C = T.color;
  const hexA = (hex, a) => { if (!hex || hex[0] !== '#') return hex; const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${+a.toFixed(3)})`; };
  const PAL = {
    light: { ground: C.white, ink: C.navy, body: C.body, soft: C.mute, tile: '#FFFFFF', tileLine: 'rgba(2,44,76,0.16)', plate: 'rgba(234,239,245,0.94)', plateHi: 'rgba(248,250,252,0.96)', plateSide: '#B9C5D3', plateLine: 'rgba(2,44,76,0.18)',
      shadow: 'rgba(2,44,76,0.10)', dot: 'rgba(2,44,76,0.13)', pad: C.white, text: T.textOnLight, good: T.textOnLight.green, goodF: C.green, bad: T.textOnLight.coral, badF: C.coral, ask: T.textOnLight.orange, askF: C.orange, glow: 0 },
    dark: { ground: C.night, ink: C.white, body: '#E6EEF5', soft: '#A9C1D6', tile: '#0A2A47', tileLine: 'rgba(255,255,255,0.20)', plate: 'rgba(255,255,255,0.035)', plateHi: 'rgba(255,255,255,0.075)', plateSide: 'rgba(255,255,255,0.10)', plateLine: 'rgba(255,255,255,0.15)',
      shadow: 'rgba(0,0,0,0.45)', dot: 'rgba(255,255,255,0.09)', pad: C.night, text: T.textOnDark, good: T.textOnDark.green, goodF: C.green, bad: T.textOnDark.coral, badF: C.coral, ask: T.textOnDark.orange, askF: C.orange, glow: 1 },
  };
  let P = PAL.light;
  const fill = a => C[a] || a || C.blue;                                   // raw accent (traces, fills)
  const txt = a => P.text[a] || (a && a[0] === '#' ? a : P.text.blue);     // text-safe accent for the theme

  // ---------- icons: Lucide SVGs parsed once into canvas paths, so they draw crisp at any size in any colour ----------
  const ICON = {};
  async function loadIcon(name) {
    if (!name || ICON[name]) return;
    try { const r = await fetch(`/brand/icons/lucide/${name}.svg`); if (!r.ok) throw 0;
      const doc = new DOMParser().parseFromString(await r.text(), 'image/svg+xml'), ops = [];
      for (const n of doc.querySelectorAll('path,circle,rect,line,polyline,polygon,ellipse')) { const a = k => +n.getAttribute(k) || 0, p = new Path2D();
        if (n.tagName === 'path') ops.push(new Path2D(n.getAttribute('d')));
        else { if (n.tagName === 'circle') p.arc(a('cx'), a('cy'), a('r'), 0, TAU);
          else if (n.tagName === 'ellipse') p.ellipse(a('cx'), a('cy'), a('rx'), a('ry'), 0, 0, TAU);
          else if (n.tagName === 'rect') p.roundRect(a('x'), a('y'), a('width'), a('height'), a('rx'));
          else if (n.tagName === 'line') { p.moveTo(a('x1'), a('y1')); p.lineTo(a('x2'), a('y2')); }
          else { const q = n.getAttribute('points').trim().split(/[\s,]+/).map(Number); p.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) p.lineTo(q[i], q[i + 1]); if (n.tagName === 'polygon') p.closePath(); }
          ops.push(p); } }
      ICON[name] = ops; }
    catch { errors++; console.log('network-stage: icon not found:', name); }
  }
  const KIND_ICON = { person: 'user', agent: 'bot', service: 'server', system: 'app-window', container: 'box', store: 'database', gate: 'shield-check', ledger: 'scroll-text' };
  for (const n of NET.nodes) n.icon = n.icon || KIND_ICON[n.kind] || 'circle';
  await Promise.all([...new Set([...NET.nodes.map(n => n.icon), 'shield', 'lock', 'check', 'x', 'user', 'bot', 'box', 'scroll-text', 'hand'])].map(loadIcon));
  function icon(name, x, y, size, color, lw = 2) { const ops = ICON[name]; if (!ops) return; g.save(); g.translate(x - size / 2, y - size / 2); g.scale(size / 24, size / 24);
    g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; for (const p of ops) g.stroke(p); g.restore(); }

  // ---------- layout: zones, nodes (given or a grid in the zone), edges routed as circuit traces ----------
  const Z = Object.fromEntries(NET.zones.map(z => [z.id, { ...z, x: z.box[0], y: z.box[1], w: z.box[2], h: z.box[3] }]));
  const NW = { person: 178, container: 150, ledger: 400, gate: 150 }, NH = 60;
  const N = {};
  for (const z of Object.values(Z)) { const auto = NET.nodes.filter(n => n.zone === z.id && !n.pos); if (!auto.length) continue;
    const ix = z.x + 26, iy = z.y + 50, iw = z.w - 52, ih = z.h - 70, cols = z.cols || Math.max(1, Math.min(auto.length, Math.floor(iw / 210))), rows = Math.ceil(auto.length / cols);
    auto.forEach((n, i) => { n._pos = [ix + iw * ((i % cols) + 0.5) / cols, iy + ih * (Math.floor(i / cols) + 0.5) / rows]; }); }
  for (const n of NET.nodes) { const [x, y] = n.pos || n._pos || [0, 0]; N[n.id] = { ...n, x, y, w: n.w || NW[n.kind] || 196, h: n.h || (n.kind === 'ledger' ? 56 + (n.rows || 6) * 25 : NH), accent: n.accent || Z[n.zone]?.accent || 'blue' }; }

  // which side an edge leaves and enters by, then port offsets so traces leaving one side run as a bus
  const E = {};
  for (const e of NET.edges) { const a = N[e.from], b = N[e.to]; if (!a || !b) { errors++; console.log('network-stage: edge with unknown node', e.id); continue; }
    const dx = b.x - a.x, dy = b.y - a.y, hgap = Math.abs(dx) - (a.w + b.w) / 2, vgap = Math.abs(dy) - (a.h + b.h) / 2;
    const mode = e.route || (hgap >= Math.abs(dy) * 0.6 && hgap > 30 ? 'h' : vgap >= Math.abs(dx) * 0.6 && vgap > 20 ? 'v' : hgap > 30 ? 'hv' : 'v');
    E[e.id] = { ...e, a, b, mode, sx: Math.sign(dx) || 1, sy: Math.sign(dy) || 1, accent: e.accent || a.accent }; }
  const ports = {};
  for (const e of Object.values(E)) { const sideA = e.mode === 'v' ? (e.sy > 0 ? 'b' : 't') : (e.sx > 0 ? 'r' : 'l'), sideB = e.mode === 'h' ? (e.sx > 0 ? 'l' : 'r') : (e.sy > 0 ? 't' : 'b');
    (ports[e.a.id + sideA] ||= []).push({ e, end: 'pa', other: e.mode === 'v' ? e.b.x : e.b.y }); (ports[e.b.id + sideB] ||= []).push({ e, end: 'pb', other: e.mode === 'h' ? e.a.y : e.a.x }); e.sideA = sideA; e.sideB = sideB; }
  for (const list of Object.values(ports)) { list.sort((p, q) => p.other - q.other); list.forEach((p, i) => { p.e[p.end] = (i - (list.length - 1) / 2) * 13; }); }
  const lanes = {};
  const mkPath = pts => { const q = [pts[0]]; for (const p of pts.slice(1)) if (Math.hypot(p[0] - q[q.length - 1][0], p[1] - q[q.length - 1][1]) > 0.5) q.push(p);
    const seg = []; let len = 0; for (let i = 1; i < q.length; i++) { const l = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); seg.push(l); len += l; }
    const at = u => { let d = H.clamp(u) * len; for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? d / seg[i] : 0; return [q[i][0] + (q[i + 1][0] - q[i][0]) * k, q[i][1] + (q[i + 1][1] - q[i][1]) * k]; } d -= seg[i]; } return q[q.length - 1]; };
    const cut = (u0, u1) => { const out = [at(u0)]; let d = 0; for (let i = 0; i < seg.length; i++) { d += seg[i]; const u = d / len; if (u > u0 && u < u1) out.push(q[i + 1]); } out.push(at(u1)); return out; };
    return { pts: q, len, at, cut }; };
  // horizontal run, 45-degree bend, horizontal run between two points (or the vertical twin)
  const elbowH = (p, q, f) => { const dy = Math.abs(q[1] - p[1]), dx = Math.abs(q[0] - p[0]), s = Math.sign(q[0] - p[0]) || 1, free = Math.max(0, dx - dy), xm = p[0] + s * free * f; return [p, [xm, p[1]], [xm + s * Math.min(dx, dy), q[1]], q]; };
  const elbowV = (p, q, f) => { const dy = Math.abs(q[1] - p[1]), dx = Math.abs(q[0] - p[0]), s = Math.sign(q[1] - p[1]) || 1, free = Math.max(0, dy - dx), ym = p[1] + s * free * f; return [p, [p[0], ym], [q[0], ym + s * Math.min(dx, dy)], q]; };
  for (const e of Object.values(E)) { const { a, b } = e, key = a.zone + '>' + b.zone + e.mode, lane = (lanes[key] = (lanes[key] ?? -1) + 1), f = e.bend ?? H.clamp(0.5 + (lane % 2 ? 1 : -1) * Math.ceil(lane / 2) * 0.085, 0.12, 0.88);
    const pa = e.sideA === 'r' ? [a.x + a.w / 2, a.y + e.pa] : e.sideA === 'l' ? [a.x - a.w / 2, a.y + e.pa] : e.sideA === 'b' ? [a.x + e.pa, a.y + a.h / 2] : [a.x + e.pa, a.y - a.h / 2];
    const pb = e.sideB === 'l' ? [b.x - b.w / 2, b.y + e.pb] : e.sideB === 'r' ? [b.x + b.w / 2, b.y + e.pb] : e.sideB === 't' ? [b.x + e.pb, b.y - b.h / 2] : [b.x + e.pb, b.y + b.h / 2];
    let pts;
    if (e.via) { const all = [pa, ...e.via, pb]; pts = [pa]; for (let i = 1; i < all.length; i++) pts.push(...(Math.abs(all[i][0] - all[i - 1][0]) >= Math.abs(all[i][1] - all[i - 1][1]) ? elbowH : elbowV)(all[i - 1], all[i], 0.5).slice(1)); }
    else if (e.mode === 'h') pts = elbowH(pa, pb, f);
    else if (e.mode === 'v') pts = elbowV(pa, pb, f);
    else { const c = 18; pts = [pa, [pb[0] - e.sx * c, pa[1]], [pb[0], pa[1] + e.sy * c], pb]; }   // across, a chamfer, then down into the node
    e.path = mkPath(pts); e.gateAt = e.gate ? (e.gate.at ?? 0.5) : null; }
  const parse = id => { const rev = /:rev$/.test(id); return { e: E[rev ? id.slice(0, -4) : id], rev }; };
  const pathOf = ids => { const list = (Array.isArray(ids) ? ids : [ids]).map(parse).filter(x => x.e); if (!list.length) return { len: 0, at: () => [0, 0], cut: () => [[0, 0]] };
    if (list.length === 1 && !list[0].rev) return list[0].e.path;
    const pts = []; for (const { e, rev } of list) pts.push(...(rev ? [...e.path.pts].reverse() : e.path.pts)); return mkPath(pts); };

  // ---------- camera ----------
  const bb = Object.values(Z).reduce((m, z) => [Math.min(m[0], z.x), Math.min(m[1], z.y), Math.max(m[2], z.x + z.w), Math.max(m[3], z.y + z.h)], [1e9, 1e9, -1e9, -1e9]);
  const HOME = NET.zones.length ? { x: (bb[0] + bb[2]) / 2, y: (bb[1] + bb[3]) / 2, zoom: Math.min(1720 / (bb[2] - bb[0]), 820 / (bb[3] - bb[1])) } : { x: 960, y: 540, zoom: 1 };
  let cam = { ...HOME, tilt: 0, rot: 0, ox: 0, oy: 0 }, st = 0, ct = 1, sr = 0, cr = 1;
  let setCam; setCam = c => { cam = { ...HOME, tilt: 0, rot: 0, ox: 0, oy: 0, ...(c || {}) }; const th = cam.tilt * Math.PI / 180, r = cam.rot * Math.PI / 180; st = Math.sin(th); ct = Math.cos(th); sr = Math.sin(r); cr = Math.cos(r); };
  // world (x, y on the board, h above it) -> screen { x, y, s (scale), d }
  const proj = (x, y, h = 0) => { const dx = x - cam.x, dy = y - cam.y, rx = dx * cr - dy * sr, ry = dx * sr + dy * cr, D = F / cam.zoom, d = Math.max(D * 0.12, D - ry * st - h * ct), s = D / d;
    return { x: 960 + cam.ox + rx * cam.zoom * s, y: 540 + cam.oy + (ry * ct - h * st) * cam.zoom * s, s: s * cam.zoom, k: s }; };
  const bs = s => (s < 1 ? Math.pow(s, 0.6) : s);                           // billboards shrink less than the board when far, so labels stay readable
  const fog = k => (cam.tilt > 8 ? H.clamp((k - 0.42) / 0.36) : 1);       // far things fade into the ground
  const boxOf = id => { const n = N[id], z = Z[id]; return n ? [n.x - n.w / 2, n.y - n.h / 2, n.x + n.w / 2, n.y + n.h / 2] : z ? [z.x, z.y, z.x + z.w, z.y + z.h] : null; };
  // frame(ids, pad, tilt, rot): the camera that fits these nodes and zones inside the safe area, as seen at that tilt and rotation
  // (a tilted board looms at the bottom of the frame, so the fit is measured on the projected corners, and ox / oy re-centre it)
  const fitBox = (b, pad, tilt, rot, maxZoom) => { const keep = cam, c = { x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2, tilt, rot, ox: 0, oy: 0 }, corners = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]];
    const ext = zoom => { setCam({ ...c, zoom }); const q = corners.map(p => proj(p[0], p[1], 20)); return [Math.min(...q.map(p => p.x)), Math.min(...q.map(p => p.y)), Math.max(...q.map(p => p.x)), Math.max(...q.map(p => p.y))]; };
    let lo = 0.02, hi = maxZoom; for (let i = 0; i < 28; i++) { const z = (lo + hi) / 2, e = ext(z); (e[2] - e[0] <= 1740 / pad && e[3] - e[1] <= 760 / pad) ? (lo = z) : (hi = z); }
    const e = ext(lo); setCam(keep); return { ...c, zoom: lo, ox: 960 - (e[0] + e[2]) / 2, oy: 536 - (e[1] + e[3]) / 2 }; };
  const frame = (ids, pad = 1.3, tilt = 0, rot = 0) => fitBox((Array.isArray(ids) ? ids : [ids]).map(boxOf).filter(Boolean).reduce((m, q) => [Math.min(m[0], q[0]), Math.min(m[1], q[1]), Math.max(m[2], q[2]), Math.max(m[3], q[3])], [1e9, 1e9, -1e9, -1e9]), pad, tilt, rot, 6);
  // ---------- container spawn: a fixed grid at full capacity, filled from the centre outwards (stable as the count grows) ----------
  const grids = {};
  function grid(zone, of) { const key = zone + ':' + of; if (grids[key]) return grids[key];
    const z = Z[zone], sb = z.spawnBox, ix = sb ? sb[0] : z.x + 24, iy = sb ? sb[1] : z.y + 48, iw = sb ? sb[2] : z.w - 48, ih = sb ? sb[3] : z.h - 66, asp = 1.5; let cols = Math.max(1, Math.ceil(Math.sqrt(of * iw / (ih * asp))));
    while (Math.ceil(of / cols) * (iw / cols / asp) > ih) cols++;
    const cw = iw / cols, ch = cw / asp, rows = Math.ceil(of / cols), y0 = iy + (ih - rows * ch) / 2, rnd = H.mulberry(of * 7919 + zone.length), cells = [];
    for (let i = 0; i < rows * cols; i++) { const cx = i % cols, cy = Math.floor(i / cols); cells.push({ x: ix + (cx + 0.5) * cw, y: y0 + (cy + 0.5) * ch, d: Math.hypot((cx + 0.5 - cols / 2) / asp, cy + 0.5 - rows / 2) + rnd() * 0.9, r: rnd() }); }
    cells.sort((p, q) => p.d - q.d); return (grids[key] = { cells: cells.slice(0, of), cw, ch }); }
  const spawnFrame = (zone, of, n, pad = 1.5, tilt = 0, rot = 0) => { const { cells, cw, ch } = grid(zone, of), c = cells.slice(0, Math.max(1, Math.min(of, Math.ceil(n))));
    return fitBox(c.reduce((m, q) => [Math.min(m[0], q.x - cw / 2), Math.min(m[1], q.y - ch / 2), Math.max(m[2], q.x + cw / 2), Math.max(m[3], q.y + ch / 2)], [1e9, 1e9, -1e9, -1e9]), pad * 1.25, tilt, rot, 30); };

  // ---------- drawing ----------
  const font = (w, px, mono) => `${w} ${px.toFixed(2)}px ${mono ? '"Geist Mono"' : 'Inter'}, sans-serif`;
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); };
  const quad = pts => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); };
  function line(world, h = 0) { g.beginPath(); world.forEach((p, i) => { const q = proj(p[0], p[1], h); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); }); }
  // text laid on the board (silkscreen): an affine fit of the projection at this point
  function onBoard(x, y, fn) { const o = proj(x, y), ax = proj(x + 10, y), ay = proj(x, y + 10); g.save(); g.transform((ax.x - o.x) / 10, (ax.y - o.y) / 10, (ay.x - o.x) / 10, (ay.y - o.y) / 10, o.x, o.y); fn(o); g.restore(); }
  const pill = (x, y, text, { px = 13, ink, bg, line: ln, mono = true, w: fw, align = 'center', pad = 9, weight = 600 } = {}) => { g.font = font(weight, px, mono); const tw = g.measureText(text).width, w = fw || tw + pad * 2, h = px * 1.75, x0 = align === 'center' ? x - w / 2 : align === 'left' ? x : x - w;
    rr(x0, y - h / 2, w, h, h / 2); g.fillStyle = bg; g.fill(); if (ln) { g.strokeStyle = ln; g.lineWidth = 1; g.stroke(); } g.fillStyle = ink; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(text, x0 + (w - tw) / 2, y + px * 0.04); return { x0, w, h }; };

  function drawGround(net) {
    if (cam.zoom * 44 < 9) return;                                           // dots would be noise this far out
    const step = cam.zoom < 0.55 ? 88 : 44, R = 1500 / cam.zoom, x0 = Math.floor((cam.x - R) / step) * step, y0 = Math.floor((cam.y - R * 1.5) / step) * step; g.fillStyle = P.dot;
    for (let y = y0; y < cam.y + R; y += step) for (let x = x0; x < cam.x + R; x += step) { const q = proj(x, y); if (q.x < -10 || q.x > 1930 || q.y < 60 || q.y > 1010) continue; const f = fog(q.k); if (f <= 0.02) continue;
      g.globalAlpha = f; const r = Math.max(0.7, 1.25 * q.s); g.fillRect(q.x - r, q.y - r, r * 2, r * 2); }
    g.globalAlpha = 1;
  }
  function drawZone(z, a) { if (a <= 0.005) return; const TH = 16, c = [[z.x, z.y], [z.x + z.w, z.y], [z.x + z.w, z.y + z.h], [z.x, z.y + z.h]];
    const top = c.map(p => proj(p[0], p[1], TH)), base = c.map(p => proj(p[0], p[1], 0)), f = fog((top[0].k + top[2].k) / 2); g.globalAlpha = a * (0.25 + 0.75 * f);
    if (cam.tilt > 4) { for (const [gx, gy, d] of [[6, 20, 0], [10, 34, 10]]) { quad([[z.x - d, z.y - d], [z.x + z.w + d, z.y - d], [z.x + z.w + d, z.y + z.h + d], [z.x - d, z.y + z.h + d]].map(p => proj(p[0] + gx, p[1] + gy, 0))); g.fillStyle = P.shadow; g.fill(); }   // a soft drop on the board
      quad([top[3], top[2], base[2], base[3]]); g.fillStyle = P.plateSide; g.fill(); }                                         // the front face of the slab
    quad(top); const lg = g.createLinearGradient(0, Math.min(top[0].y, top[1].y), 0, Math.max(top[2].y, top[3].y)); lg.addColorStop(0, P.plateHi); lg.addColorStop(1, P.plate); g.fillStyle = lg; g.fill(); g.fillStyle = hexA(fill(z.accent || 'blue'), P.glow ? 0.07 : 0.045); g.fill(); g.strokeStyle = P.plateLine; g.lineWidth = 1.2; g.stroke();   // a breath of the zone's accent
    g.beginPath(); g.moveTo(top[0].x, top[0].y); g.lineTo(top[1].x, top[1].y); g.strokeStyle = fill(z.accent || 'blue'); g.lineWidth = Math.max(1.5, 3 * top[0].s); g.stroke();   // the accent rule on the far edge
    if (z.title) { const o = proj(z.x + 24, z.y + 30, TH); if (o.s > 0.3) onBoard(z.x + 24, z.y + 30, () => { g.translate(0, -TH * st); g.font = font(600, 15, true); g.fillStyle = txt(z.accent || 'blue'); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.letterSpacing = '2.4px'; g.fillText(String(z.title).toUpperCase(), 0, 0); g.letterSpacing = '0px';
      if (z.sub) { g.font = font(500, 13, false); g.fillStyle = P.soft; g.fillText(z.sub, g.measureText('').width, 0 + 0); } }); }
    g.globalAlpha = 1;
  }
  function drawEdge(e, st0, dim) { const p = st0.p ?? 1, a = (st0.a ?? 1) * dim; if (p <= 0.002 || a <= 0.005) return; const col = fill(e.accent), pts = e.path.cut(0, p), q0 = proj(...e.path.pts[0]), f = fog(q0.k);
    g.globalAlpha = a * (0.3 + 0.7 * f); g.lineJoin = 'round'; g.lineCap = 'round';
    if (P.glow) { line(pts, 2); g.strokeStyle = hexA(col, 0.22); g.lineWidth = Math.max(3, 7 * q0.s); g.stroke(); }
    line(pts, 2); g.strokeStyle = col; g.lineWidth = Math.max(1.4, 2.6 * q0.s); g.stroke();
    const pad = (w, on) => { if (!on) return; const q = proj(w[0], w[1], 2), r = Math.max(2.6, 5.2 * q.s); g.beginPath(); g.arc(q.x, q.y, r, 0, TAU); g.fillStyle = P.pad; g.fill(); g.strokeStyle = col; g.lineWidth = Math.max(1.1, 1.9 * q.s); g.stroke(); };
    pad(e.path.pts[0], true); pad(e.path.at(p), p * e.path.len > 22);
    g.globalAlpha = 1;
  }
  function drawSpawn(sp, time) { if (!sp || !Z[sp.zone]) return; const { cells, cw, ch } = grid(sp.zone, sp.of), col = fill(sp.accent || Z[sp.zone].accent || 'green'), tcol = txt(sp.accent || Z[sp.zone].accent || 'green'), n = Math.min(cells.length, Math.ceil(sp.count));
    for (let i = 0; i < n; i++) { const c = cells[i], k = H.clamp(sp.count - i), q = proj(c.x, c.y, 10); if (q.x < -60 || q.x > 1980 || q.y < -40 || q.y > 1120) continue;
      const w = cw * 0.84 * q.s * (0.6 + 0.4 * H.outBack(k)), h = ch * 0.8 * q.s * (0.6 + 0.4 * H.outBack(k)), act = 0.5 + 0.5 * Math.sin(TAU * (c.r * 7 + time * (0.25 + c.r * 0.5)));
      g.globalAlpha = k * (0.35 + 0.65 * fog(q.k));
      if (w < 9) { g.fillStyle = hexA(col, 0.5 + 0.5 * act); g.fillRect(q.x - w / 2, q.y - h / 2, Math.max(1.6, w), Math.max(1.4, h)); continue; }
      if (w < 40) { rr(q.x - w / 2, q.y - h / 2, w, h, w * 0.16); g.fillStyle = hexA(col, 0.16 + 0.3 * act); g.fill(); g.strokeStyle = col; g.lineWidth = 1; g.stroke(); continue; }
      rr(q.x - w / 2 + 2, q.y - h / 2 + h * 0.14, w, h, w * 0.1); g.fillStyle = P.shadow; g.fill();
      rr(q.x - w / 2, q.y - h / 2, w, h, w * 0.1); g.fillStyle = P.tile; g.fill(); g.strokeStyle = hexA(col, 0.85); g.lineWidth = Math.max(1, w * 0.012); g.stroke();
      icon('box', q.x - w * 0.3, q.y - h * 0.1, h * 0.36, tcol, 2);
      if (w > 70) { g.font = font(600, Math.min(15, w * 0.085), true); g.fillStyle = P.ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('c-' + String(i + 1).padStart(4, '0'), q.x - w * 0.14, q.y - h * 0.12); }
      const bw = w * 0.76, by = q.y + h * 0.27; rr(q.x - bw / 2, by, bw, Math.max(2, h * 0.07), 2); g.fillStyle = hexA(col, 0.2); g.fill(); rr(q.x - bw / 2, by, bw * (0.25 + 0.75 * act), Math.max(2, h * 0.07), 2); g.fillStyle = col; g.fill(); }
    g.globalAlpha = 1;
  }
  const STATE = { active: 'accent', done: 'good', blocked: 'bad' };
  function drawNode(n, s0, dim, net) { const a = (s0.a ?? 1) * dim; if (a <= 0.005) return; const pulse = s0.pulse ?? (s0.state === 'active' ? 0.6 : 0), lift = 14 + pulse * 16, q = proj(n.x, n.y, lift), base = proj(n.x, n.y, 0);
    if (q.x < -300 || q.x > 2220 || q.y < -200 || q.y > 1280) return; const s = bs(q.s), f = fog(q.k), w = n.w * s, h = n.h * s, x = q.x - w / 2, y = q.y - h / 2, col = fill(n.accent), tc = txt(n.accent);
    g.globalAlpha = a * (0.2 + 0.8 * f);
    if (cam.tilt > 4) { g.beginPath(); g.ellipse(base.x, base.y + 4 * s, w * 0.46, Math.max(3, h * 0.2 * ct + 4 * s), 0, 0, TAU); g.fillStyle = P.shadow; g.fill(); }
    else { rr(x + 3 * s, y + 6 * s, w, h, 12 * s); g.fillStyle = P.shadow; g.fill(); }
    if (pulse > 0.01) { rr(x - 5 * s, y - 5 * s, w + 10 * s, h + 10 * s, 16 * s); g.strokeStyle = hexA(col, 0.25 + 0.5 * pulse); g.lineWidth = Math.max(1.5, 3 * s); g.stroke(); }
    if (n.kind === 'ledger') return drawLedger(n, net.ledger, q, a * (0.2 + 0.8 * f));
    rr(x, y, w, h, 12 * s); g.fillStyle = P.tile; g.fill(); g.strokeStyle = s0.state === 'blocked' ? P.badF : pulse > 0.01 ? col : P.tileLine; g.lineWidth = Math.max(1, 1.3 * s); g.stroke();
    const cs = 38 * s, cx = x + 11 * s + cs / 2, round = n.kind === 'person';
    g.beginPath(); round ? g.arc(cx, q.y, cs / 2, 0, TAU) : g.roundRect(cx - cs / 2, q.y - cs / 2, cs, cs, 9 * s); g.fillStyle = hexA(col, P.glow ? 0.22 : 0.14); g.fill();
    if (n.kind === 'agent') { g.strokeStyle = col; g.lineWidth = Math.max(1, 1.4 * s); g.stroke(); }
    icon(n.icon, cx, q.y, 22 * s, tc, 2);
    if (s > 0.5) { const tx = x + 58 * s; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = P.ink; g.font = font(600, 17 * s, false);
      g.fillText(n.label || '', tx, q.y + (n.sub ? -2 * s : 6 * s), w - 66 * s);
      if (n.sub) { g.font = font(500, 11.5 * s, true); g.fillStyle = P.soft; g.letterSpacing = `${0.4 * s}px`; g.fillText(n.sub, tx, q.y + 15 * s, w - 66 * s); g.letterSpacing = '0px'; } }
    const stt = STATE[s0.state];
    if (stt === 'good' || stt === 'bad') { const bx = x + w - 4 * s, by = y + 4 * s, r = 11 * s; g.beginPath(); g.arc(bx, by, r, 0, TAU); g.fillStyle = stt === 'good' ? P.goodF : P.badF; g.fill(); icon(stt === 'good' ? 'check' : 'x', bx, by, 13 * s, stt === 'good' ? C.navy : '#fff', 3); }
    else if (s0.badge != null && s > 0.5) pill(x + w - 6 * s, y + 2 * s, String(s0.badge), { px: 12 * s, ink: '#fff', bg: C.navy, pad: 7 * s });
    g.globalAlpha = 1;
  }
  function drawLedger(n, L, q, a) { L = L || {}; const s = q.s, lines = L.lines || [], shown = Math.min(lines.length, L.shown ?? lines.length), rows = n.rows || 6, lh = 25 * s, w = n.w * s, h = n.h * s, x = q.x - w / 2, y = q.y - h / 2;
    g.globalAlpha = a; rr(x, y, w, h, 12 * s); g.fillStyle = P.tile; g.fill(); g.strokeStyle = P.tileLine; g.lineWidth = Math.max(1, 1.3 * s); g.stroke();
    icon('scroll-text', x + 24 * s, y + 23 * s, 20 * s, txt(n.accent), 2); g.font = font(700, 13 * s, true); g.fillStyle = txt(n.accent); g.textAlign = 'left'; g.textBaseline = 'middle'; g.letterSpacing = `${2 * s}px`; g.fillText((L.title || n.label || 'Audit ledger').toUpperCase(), x + 44 * s, y + 24 * s); g.letterSpacing = '0px';
    g.beginPath(); g.moveTo(x + 14 * s, y + 42 * s); g.lineTo(x + w - 14 * s, y + 42 * s); g.strokeStyle = P.tileLine; g.stroke();
    const first = Math.max(0, Math.ceil(shown) - rows), slide = H.ss(H.clamp(shown - Math.floor(shown - 1e-6) || 1));
    g.save(); rr(x, y + 43 * s, w, h - 44 * s, 0); g.clip();
    for (let i = first; i < Math.ceil(shown); i++) { const l = lines[i], newest = i === Math.ceil(shown) - 1, k = newest ? slide : 1, ly = y + (58 + (i - first) * 25) * s + (newest ? (1 - k) * 10 * s : 0) - (first > 0 && Math.ceil(shown) > rows ? (1 - slide) * -lh * 0 : 0);
      const rc = l.result === 'deny' ? P.bad : l.result === 'ask' ? P.ask : P.good; g.globalAlpha = a * k;
      if (newest) { rr(x + 8 * s, ly - lh / 2 + 1, w - 16 * s, lh - 2, 6 * s); g.fillStyle = hexA(l.result === 'deny' ? P.badF : l.result === 'ask' ? P.askF : P.goodF, 0.14); g.fill(); }
      icon(l.result === 'deny' ? 'x' : l.result === 'ask' ? 'hand' : 'check', x + 22 * s, ly, 13 * s, rc, 2.6);
      g.font = font(500, 12.5 * s, true); g.fillStyle = P.body; g.textBaseline = 'middle'; g.fillText(l.text, x + 36 * s, ly + 0.5 * s, w - 48 * s); }
    g.restore(); g.globalAlpha = 1;
  }
  function drawGate(e, gs, dim0, ea = 1) { const dim = dim0 * ea; const col = fill(e.accent), w0 = e.path.at(e.gateAt), q = proj(w0[0], w0[1], 16), s = bs(q.s), f = fog(q.k), open = gs?.open ?? 0, res = open > 0.02 ? gs.result : null;
    const rc = res === 'allow' ? P.goodF : res === 'deny' ? P.badF : res === 'ask' ? P.askF : null, R = 17 * s * (1 + 0.18 * H.bump(open, 0.02, 0.6));
    g.globalAlpha = dim * (0.25 + 0.75 * f);
    if (rc && open < 1) { g.beginPath(); g.arc(q.x, q.y, R + open * 26 * s, 0, TAU); g.strokeStyle = hexA(rc, (1 - open) * 0.8); g.lineWidth = 2 * s; g.stroke(); }
    if (res === 'ask' && gs.ask && N[gs.ask.to]) { const t = N[gs.ask.to], p = H.clamp(gs.ask.p ?? open), b = proj(t.x, t.y - t.h / 2, 14); g.setLineDash([6 * s, 6 * s]); g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x + (b.x - q.x) * p, q.y + (b.y - q.y) * p); g.strokeStyle = P.askF; g.lineWidth = 2 * s; g.stroke(); g.setLineDash([]); }
    g.beginPath(); g.arc(q.x, q.y, R, 0, TAU); g.fillStyle = rc ? rc : P.tile; g.fill(); g.strokeStyle = rc || col; g.lineWidth = Math.max(1.3, 2.2 * s); g.stroke();
    icon(res === 'allow' ? 'check' : res === 'deny' ? 'x' : res === 'ask' ? 'hand' : 'lock', q.x, q.y, 17 * s, rc ? (res === 'deny' ? '#fff' : C.navy) : txt(e.accent), res ? 2.8 : 2.2);
    const label = gs?.label || e.gate.label || e.gate.scope; if (label && s > 0.5 && (open > 0.02 || gs?.show)) pill(q.x, q.y - R - 15 * s, label, { px: 12.5 * s, ink: rc ? (P.glow ? '#fff' : C.navy) : P.ink, bg: rc ? hexA(rc, P.glow ? 0.3 : 0.22) : P.tile, line: rc || P.tileLine, pad: 10 * s });
    g.globalAlpha = 1;
  }
  const PK = { request: { r: 6, icon: null }, result: { r: 6, icon: 'check' }, agent: { r: 12, icon: 'bot' }, human: { r: 12, icon: 'user' } };
  function drawPacket(pk) { const path = pathOf(pk.path || pk.edge); if (!path.len) return; const u = H.clamp(pk.u), a = pk.a ?? 1; if (a <= 0.005) return; const col = fill(pk.accent || parse((pk.path || [pk.edge])[0] || pk.edge).e?.accent || 'cyan');
    const w0 = path.at(u), q = proj(w0[0], w0[1], 12), s = bs(q.s), f = fog(q.k), k = PK[pk.kind] || PK.request, R = k.r * s; if (q.x < -40 || q.x > 1960 || q.y < -40 || q.y > 1120) return;
    const tr = pk.trail ?? 0.08; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 6 && tr > 0; i++) { const u0 = Math.max(0, u - tr * (1 - i / 6)), u1 = Math.max(0, u - tr * (1 - (i + 1) / 6)); if (u1 <= u0) continue; line(path.cut(u0, u1), 4); g.strokeStyle = hexA(col, a * f * (0.10 + 0.13 * i)); g.lineWidth = Math.max(2, (3 + i * 0.7) * s); g.stroke(); }
    g.globalAlpha = a * (0.3 + 0.7 * f);
    const halo = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, R * 3.4); halo.addColorStop(0, hexA(col, P.glow ? 0.55 : 0.46)); halo.addColorStop(1, hexA(col, 0)); g.fillStyle = halo; g.beginPath(); g.arc(q.x, q.y, R * 3.4, 0, TAU); g.fill();
    g.beginPath(); g.arc(q.x, q.y, R, 0, TAU); g.fillStyle = k.icon && k.r > 8 ? P.tile : col; g.fill(); g.strokeStyle = col; g.lineWidth = Math.max(1.4, 2.4 * s); g.stroke();
    if (k.icon && k.r > 8) icon(k.icon, q.x, q.y, R * 1.25, txt(pk.accent || 'cyan'), 2.2);
    if (pk.label && s > 0.5) pill(q.x, q.y - R - 14 * s, pk.label, { px: 12 * s, ink: P.ink, bg: P.tile, line: hexA(col, 0.7), pad: 9 * s });
    g.globalAlpha = 1;
  }
  function drawStep(sp) { const w0 = sp.node ? [N[sp.node].x - N[sp.node].w / 2 + 2, N[sp.node].y - N[sp.node].h / 2 + 2] : pathOf(sp.edge).at(sp.u ?? 0.5), q = proj(w0[0], w0[1], sp.node ? 30 : 20), s = Math.max(0.6, q.s), a = sp.a ?? 1; if (a <= 0.005) return;
    const R = 15 * s * (0.6 + 0.4 * H.outBack(a)); g.globalAlpha = Math.min(1, a * 1.4); g.beginPath(); g.arc(q.x, q.y, R, 0, TAU); g.fillStyle = C.navy; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2 * s; g.stroke();
    g.font = font(700, 16 * s, false); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(sp.n), q.x, q.y + 1 * s); g.globalAlpha = 1; }
  function drawNote(nt) { const a = nt.a ?? 1; if (a <= 0.005) return; const n = nt.node && N[nt.node], w0 = n ? [n.x, n.y] : pathOf(nt.edge).at(nt.u ?? 0.5), q = proj(w0[0], w0[1], n ? 14 : 8), s = Math.max(0.75, Math.min(1.25, q.s)), side = nt.side || 't';
    const off = n ? (side === 't' || side === 'b' ? n.h / 2 * q.s + 46 * s : n.w / 2 * q.s + 40 * s) : 54 * s, dx = side === 'l' ? -off : side === 'r' ? off : 0, dy = side === 't' ? -off : side === 'b' ? off : 0, x = q.x + dx, y = q.y + dy + (1 - H.ss(a)) * 10;
    g.font = font(600, 19 * s, false); const tw = g.measureText(nt.text).width; g.font = font(500, 14.5 * s, false); const sw = nt.sub ? g.measureText(nt.sub).width : 0, w = Math.max(tw, sw) + 30 * s, h = (nt.sub ? 62 : 42) * s;
    const bx = H.clamp(side === 'l' ? x - w : side === 'r' ? x : x - w / 2, 48, 1872 - w), by = H.clamp(side === 't' ? y - h : side === 'b' ? y : y - h / 2, 110, 960 - h); g.globalAlpha = a;
    g.beginPath(); g.moveTo(q.x + dx * 0.25, q.y + dy * 0.25); g.lineTo(H.clamp(x, bx + 8, bx + w - 8), H.clamp(y, by + 4, by + h - 4)); g.strokeStyle = P.ink; g.lineWidth = 1.4; g.stroke(); g.beginPath(); g.arc(q.x + dx * 0.25, q.y + dy * 0.25, 3, 0, TAU); g.fillStyle = P.ink; g.fill();
    rr(bx, by, w, h, 10 * s); g.fillStyle = C.navy; g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.font = font(600, 19 * s, false); g.fillText(nt.text, bx + 15 * s, by + 27 * s);
    if (nt.sub) { g.font = font(500, 14.5 * s, false); g.fillStyle = '#B4CBDF'; g.fillText(nt.sub, bx + 15 * s, by + 49 * s); } g.globalAlpha = 1; }
  function drawLegend(a) { if (a <= 0.005) return; const items = [['trace', 'A connection'], ['packet', 'A request or an agent on its way'], ['gate', 'A permission check'], ['ledger', 'A line in the audit record']];
    g.font = font(500, 16, false); const ws = items.map(i => g.measureText(i[1]).width + 58), total = ws.reduce((m, w) => m + w, 0) + (items.length - 1) * 14; let x = 960 - total / 2; const y = 938 + (1 - H.ss(a)) * 14; g.globalAlpha = a;
    items.forEach(([k, label], i) => { rr(x, y - 19, ws[i], 38, 19); g.fillStyle = P.tile; g.fill(); g.strokeStyle = P.tileLine; g.lineWidth = 1; g.stroke(); const cx = x + 24, col = C.blue;
      if (k === 'trace') { g.beginPath(); g.moveTo(cx - 11, y + 4); g.lineTo(cx - 3, y + 4); g.lineTo(cx + 4, y - 3); g.lineTo(cx + 9, y - 3); g.strokeStyle = col; g.lineWidth = 2; g.stroke(); g.beginPath(); g.arc(cx + 11, y - 3, 3, 0, TAU); g.fillStyle = P.pad; g.fill(); g.stroke(); }
      if (k === 'packet') { g.beginPath(); g.arc(cx, y, 6, 0, TAU); g.fillStyle = C.cyan; g.fill(); g.beginPath(); g.arc(cx, y, 10, 0, TAU); g.strokeStyle = hexA(C.cyan, 0.4); g.lineWidth = 2; g.stroke(); }
      if (k === 'gate') { g.beginPath(); g.arc(cx, y, 10, 0, TAU); g.fillStyle = P.tile; g.fill(); g.strokeStyle = col; g.lineWidth = 1.8; g.stroke(); icon('lock', cx, y, 11, txt('blue'), 2.4); }
      if (k === 'ledger') icon('check', cx, y, 15, P.good, 2.8);
      g.font = font(500, 16, false); g.fillStyle = P.ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(label, x + 44, y + 1); x += ws[i] + 14; });
    g.globalAlpha = 1; }

  // ---------- frame ----------
  let lastNet = {};
  function apply(world, state) { const net = world?.net || {}; lastNet = net; const themeName = net.theme || document.getElementById('stage').dataset.theme || 'light'; P = PAL[themeName === 'dark' ? 'dark' : 'light'];
    setCam(net.cam); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1920, 1080); if (net.hide) return Promise.resolve();
    const time = net.time ?? 0, focus = net.focus ? new Set([].concat(net.focus)) : null, dimN = id => (!focus || focus.has(id) ? 1 : 0.5), dimE = e => (!focus || (focus.has(e.a.id) && focus.has(e.b.id)) || focus.has(e.id) ? 1 : 0.35);
    drawGround(net);
    for (const z of Object.values(Z).sort((p, q) => proj(p.x, p.y + p.h).k - proj(q.x, q.y + q.h).k)) drawZone(z, (net.zonesA?.[z.id] ?? 1) * (focus && !focus.has(z.id) ? 0.8 : 1));
    for (const e of Object.values(E)) drawEdge(e, net.edges?.[e.id] || {}, dimE(e));
    drawSpawn(net.spawn, time);
    const items = [];
    for (const n of Object.values(N)) items.push({ k: proj(n.x, n.y).k, f: () => drawNode(n, net.nodes?.[n.id] || {}, dimN(n.id), net) });
    for (const e of Object.values(E)) if (e.gate && ((net.edges?.[e.id]?.p ?? 1) > e.gateAt) && (net.edges?.[e.id]?.a ?? 1) > 0.01) items.push({ k: proj(...e.path.at(e.gateAt)).k + 1e-4, f: () => drawGate(e, net.gates?.[e.id], dimE(e), net.edges?.[e.id]?.a ?? 1) });
    for (const pk of net.packets || []) { const pt = pathOf(pk.path || pk.edge); if (pt.len) items.push({ k: proj(...pt.at(H.clamp(pk.u))).k + 2e-4, f: () => drawPacket(pk) }); }
    items.sort((p, q) => p.k - q.k).forEach(i => i.f());
    if (focus) for (const id of focus) { const n = N[id]; if (!n) continue; const q = proj(n.x, n.y, 14), s = bs(q.s), pu = 0.5 + 0.5 * Math.sin(time * 2.2), col = fill(n.accent);   // "you are here"
      for (const [o, al, lw] of [[7, 0.55 + 0.3 * pu, 2.4], [13, 0.18 + 0.1 * pu, 5]]) { rr(q.x - n.w * s / 2 - o * s, q.y - n.h * s / 2 - o * s, n.w * s + 2 * o * s, n.h * s + 2 * o * s, (12 + o) * s); g.strokeStyle = hexA(col, al); g.lineWidth = lw * s; g.stroke(); } }
    for (const sp of net.steps || []) drawStep(sp);
    for (const nt of net.notes || []) drawNote(nt);
    drawLegend(net.legend ?? 0);
    return Promise.resolve();
  }
  const world = id => (N[id] ? [N[id].x, N[id].y] : Z[id] ? [Z[id].x + Z[id].w / 2, Z[id].y + Z[id].h / 2] : null);
  const scr = w => { if (!w) return null; const q = proj(w[0], w[1], 14); return { x: q.x, y: q.y }; };
  const swarm = (t, { edges = Object.keys(E), per = 2, speed = 230, seed = 7, kinds = ['request', 'agent', 'result', 'request', 'human'], trail = 0.1 } = {}) => { const rnd = H.mulberry(seed), out = [];
    for (const id of edges) { const e = E[id]; if (!e) continue; for (let k = 0; k < per; k++) { const ph = rnd(), rev = rnd() < 0.4, kind = kinds[Math.floor(rnd() * kinds.length)], sp = speed * (0.7 + 0.6 * rnd()), u = ((t * sp / e.path.len + ph) % 1 + 1) % 1;
      out.push({ path: [rev ? id + ':rev' : id], u, kind, accent: e.accent, trail, a: Math.min(1, u * 8, (1 - u) * 8) }); } } return out; };
  return { apply, takeErrors: () => { const n = errors; errors = 0; return n; },
    project: w => scr(typeof w === 'string' ? world(w) : w), world, nodeXY: id => scr(world(id)), pathOf, along: (ids, u) => scr(pathOf(ids).at(u)), gateU: id => E[id]?.gateAt ?? 0.5,
    frame, spawnFrame, swarm, home: HOME, nodes: N, edges: E, zones: Z };
}
