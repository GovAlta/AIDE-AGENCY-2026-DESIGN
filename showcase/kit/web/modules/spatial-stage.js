// Spatial stage (architecture explainers in the light neumorphic-glass look): the product's screens as frosted-glass WINDOWS floating
// in real 3D space on one soft, luminous ground, seen through a moving perspective camera with depth of field; thin light LINES carry
// work from one window to another; a WALL of thousands of small cards recedes to a horizon for scale shots.
// Product-neutral and data-driven: the film supplies every window's HTML (its screens and controls); this module owns the space, the
// camera, the glass, the focus, the lines, the wall and the ground. Plugs into the frame contract (web/main.js). Pure function of state.
//
//   film.config.json: "stage": "/kit/modules/spatial-stage.js", "space": { "fov": 44, "maxGlass": 3, "maxBlur": 12 }   (all optional)
//
// World: pixels. x right, y down, z toward the viewer. With the default camera ({ x: 960, y: 540, z: stage.F(), yaw: 0, pitch: 0 }) the
// plane z = 0 maps one to one onto the 1920 x 1080 frame, so a window at z 0 is drawn at its own size; z > 0 is nearer, z < 0 farther.
//
// stateAt(t).world.space = {
//   cam: { x, y, z, yaw, pitch (degrees; yaw > 0 turns right, pitch > 0 looks down), fov (vertical, default 44),
//          focus (what is sharp: a world z, a window id, or [x, y, z]), aperture (0 = everything sharp; 1 = default depth of field) },
//   windows: [{ id, x, y, z (the window's CENTRE), ry, rx (degrees, as CSS rotateY / rotateX: ry > 0 turns the right edge away),
//               w, h (its own pixels), scale, html, a (opacity), glow (accent name: a soft light behind it), hero (true: the film's main
//               window: strongest glass and shadow), radius, cls (extra class), glass (true | false: force real or frosted),
//               glowA, glowR (strength and reach of its light; defaults 0.34 and 0.62), snap (true: whole-pixel placement when facing),
//               soft (px of blur on screen, in place of the camera's depth of field for this window) }],
//   lines: [{ id, from, to ('win', 'win#data-k', each with an optional side '@l' '@r' '@t' '@b', or a world point [x, y, z]),
//             p (0..1 draw-on), pulses: [u, ...] (travelling dots, 0..1 along), ring (0..1: a soft ring opening where the line lands),
//             accent, a, label, front (true: over every window) }],
//   wall: { x, y, z (centre), ry, rx, card: [w, h], gap, cols, rows  — or —  blocks: { cols, rows, size: [cardCols, cardRows], gap, lit, labels, reverse (true: block 1 is the last cell, for a floor seen from its near edge) },
//           count (cards running; fractional), accents: [names], labels: [short names for the nearest cards], time, a, haze: [near, far], front },
//   ground: { tint (accent), glows: [{ x, y, z, accent, r, a }] }
// }
// The kit's ui still draws headlines, big numbers, captions, chrome and the cursor. A [data-k] element inside a window is a cursor target.
//
// Helpers for timelines (all pure unless noted):
//   stage.F(fov)                       -> the camera distance at which z = 0 is one to one
//   stage.frame([windows | [x,y,z]], pad, { yaw, pitch, fov, aperture, shift: [dx, dy] }) -> a camera that fits those windows (objects, as given
//                                         to `windows`); pad < 1 is tighter than the safe area; shift moves the fitted content on screen (px)
//   stage.mix(camA, camB, u)           -> camA to camB (u already eased); stage.orbit(cam, yaw, pitch) -> the same view point from another angle
//   stage.enter(win, u, { dy, dz, rx }) / stage.leave(win, u, …) -> the window rising in / sinking out (opacity, travel, a slight turn)
//   stage.project([x, y, z])           -> screen { x, y } with the camera of the frame last drawn (for ui.labels)
//   stage.anchor('win#data-k@r')       -> screen { x, y } of that element in the frame last drawn (for the cursor and labels)
//   stage.wallFrame(wall, share, pad, { yaw, pitch }) -> a camera that fits the first `share` (0..1) of the wall
//   stage.inFrame(cam, win, sx, sy, depth, turn) -> the window placed in that camera's own frame: its centre at screen (sx, sy), `depth` px
//                                         behind the one-to-one plane (negative: nearer), turned `turn` degrees to the viewer; win.scale is the scale
//                                         as seen on screen. For compositions designed in screen pixels (camera pitch 0).
const RAD = Math.PI / 180, EPS = 1e-3;
// ---- 4 x 4 matrices, column-major (the order CSS matrix3d takes) ----
const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
const tr = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const sc = s => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1];
const rotY = d => { const c = Math.cos(d * RAD), s = Math.sin(d * RAD); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; };   // as CSS rotateY
const rotX = d => { const c = Math.cos(d * RAD), s = Math.sin(d * RAD); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; };   // as CSS rotateX
const xf = (m, x, y, z = 0) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14], m[3] * x + m[7] * y + m[11] * z + m[15]];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, u) => a + (b - a) * u, ss = u => u * u * (3 - 2 * u);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export async function createStage(el, { config, helpers: H }) {
  let errors = 0;
  await new Promise(res => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/kit/modules/spatial.css'; l.onload = res; l.onerror = () => { errors++; res(); }; document.head.appendChild(l); });
  const T = await fetch('/brand/tokens/tokens.json').then(r => r.json()), C = T.color;
  const OPT = { fov: 44, maxGlass: 3, maxBlur: 12, bandH: 44, ...(config.space || {}) };   // bandH: the chrome band at the bottom; the wall stops above it
  const W = 1920, HH = 1080, CX = 960, CY = 540;
  const F = (fov = OPT.fov) => (HH / 2) / Math.tan(fov * RAD / 2);
  const root = document.createElement('div'); root.className = 'sp-space'; el.appendChild(root);
  const mkCanvas = (cls, z) => { const c = document.createElement('canvas'); c.width = W; c.height = HH; c.className = cls; c.style.zIndex = z; root.appendChild(c); return c; };
  const groundCv = mkCanvas('sp-ground', 0), gg = groundCv.getContext('2d');
  const wallCv = mkCanvas('sp-wall', 1), wg = wallCv.getContext('2d', { willReadFrequently: true });
  const hexA = (hex, a) => { if (!hex || hex[0] !== '#') return hex; const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${+a.toFixed(3)})`; };
  const fill = a => C[a] || (a && a[0] === '#' ? a : C.blue);
  const stageEl = document.getElementById('stage') || document.body;
  // the look lives in CSS variables on .sp-space (spatial.css), so a dark variant only needs another set of values
  let vars = null, varsKey = '';
  const V = () => { const key = stageEl.className; if (key !== varsKey) { const cs = getComputedStyle(root), g = n => cs.getPropertyValue(n).trim(); varsKey = key;
    vars = { g0: g('--sp-g0'), g1: g('--sp-g1'), g2: g('--sp-g2'), hi: g('--sp-hi'), lo: g('--sp-lo'), ink: g('--sp-ink'), soft: g('--sp-soft'), halo: g('--sp-halo'), card: g('--sp-card'), cardRim: g('--sp-card-rim'),
      ghost: g('--sp-ghost'), track: g('--sp-track'), haze: g('--sp-haze'), glowK: parseFloat(g('--sp-glow-k')) || 1, text: stageEl.classList.contains('theme-dark') ? T.textOnDark : T.textOnLight }; } return vars; };

  // ---------- camera ----------
  const DEF = { x: CX, y: CY, yaw: 0, pitch: 0, focus: 0, aperture: 1 };
  let cam = { ...DEF, fov: OPT.fov, z: F() }, f = F(), VIEW = tr(0, 0, 0), PV = tr(0, 0, 0);
  const viewOf = c => mul(rotX(-c.pitch), mul(rotY(c.yaw), tr(-c.x, -c.y, -c.z)));
  const projOf = ff => [ff, 0, 0, 0, 0, ff, 0, 0, -CX, -CY, 0, -1, 0, 0, EPS, 0];   // X = f x - cx z, Y = f y - cy z, W = -z (depth)
  const setCam = c => { cam = { ...DEF, fov: OPT.fov, ...c }; f = F(cam.fov); if (c.z === undefined) cam.z = f; VIEW = viewOf(cam); PV = mul(projOf(f), VIEW); };
  const scr = (p, m = PV) => { const q = xf(m, p[0], p[1], p[2] || 0); return q[3] > 1 ? { x: q[0] / q[3], y: q[1] / q[3], d: q[3] } : null; };
  const fwd = c => { const cy = Math.cos(c.yaw * RAD), sy = Math.sin(c.yaw * RAD), cp = Math.cos(c.pitch * RAD), sp = Math.sin(c.pitch * RAD); return [sy * cp, sp, -cy * cp]; };   // where the camera looks, in the world

  // ---------- windows ----------
  // + 0.03 degrees of tilt, always (0.4 px over a wide window: invisible). A window whose matrix becomes axis-aligned in one direction (its
  // arrival tilt reaching exactly 0, a camera yaw passing a window's own turn) is rastered by another path from that frame on, and its
  // fill and sharpness step (film #1: each of the nine tiles as it settled). With the constant tilt no window is ever axis-aligned.
  const modelOf = w => mul(tr(w.x ?? CX, w.y ?? CY, w.z ?? 0), mul(rotY(w.ry || 0), mul(rotX((w.rx || 0) + 0.03), mul(sc(w.scale ?? 1), tr(-(w.w || 0) / 2, -(w.h || 0) / 2, 0)))));
  const cornersOf = w => { const m = modelOf(w); return [[0, 0], [w.w, 0], [w.w, w.h], [0, w.h]].map(([x, y]) => xf(m, x, y, 0).slice(0, 3)); };
  const pool = new Map();   // id -> { el, body, html, used }
  const winEl = id => { let p = pool.get(id); if (!p) { const e = document.createElement('div'); e.className = 'sp-win'; e.dataset.win = id;
    const body = document.createElement('div'); body.className = 'sp-body'; const sheen = document.createElement('div'); sheen.className = 'sp-sheen'; e.append(body, sheen); root.appendChild(e);
    p = { el: e, body, html: null }; pool.set(id, p); } return p; };
  let LAST = { wins: new Map(), order: [] };   // the frame last drawn: id -> { M, w, depth, rank }
  // an element's box in the window's own pixels (layout only, so transforms do not matter)
  const localBox = (p, key) => { const t = key ? p.body.querySelector(`[data-k="${CSS.escape(key)}"]`) : null; if (!t) return null; let x = 0, y = 0, n = t;
    while (n && n !== p.el) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y, w: t.offsetWidth, h: t.offsetHeight }; };
  // 'win', 'win#key', with '@l|r|t|b|c'; or [x, y, z]  ->  { x, y, d, win, side }
  const resolve = spec => { if (Array.isArray(spec)) { const q = scr(spec); return q && { ...q, win: null, side: null }; }
    const m = /^([^#@]+)(?:#([^@]+))?(?:@([lrtbc]))?$/.exec(String(spec)); if (!m) return null; const L = LAST.wins.get(m[1]), p = pool.get(m[1]); if (!L || !p) return null;
    const b = (m[2] && localBox(p, m[2])) || { x: 0, y: 0, w: L.w.w, h: L.w.h }, side = m[3] || 'c';
    const lx = side === 'l' ? b.x : side === 'r' ? b.x + b.w : b.x + b.w / 2, ly = side === 't' ? b.y : side === 'b' ? b.y + b.h : b.y + b.h / 2;
    const q = xf(L.M, lx, ly, 0); return q[3] > 1 ? { x: q[0] / q[3], y: q[1] / q[3], d: q[3], win: m[1], side: m[3] || null } : null; };

  function drawWindows(list) {
    const seen = new Set(), items = [];
    for (const w of list) { if (!w || !w.id || (w.a ?? 1) <= 0.004) continue; const M = mul(PV, modelOf(w)), c = xf(M, w.w / 2, w.h / 2, 0); if (c[3] < 60) continue;
      // how far the window is turned away from the camera (0 = facing it)
      const R = mul(VIEW, mul(rotY(w.ry || 0), rotX(w.rx || 0))), tilt = Math.acos(clamp(Math.abs(R[10]), 0, 1)) / RAD;
      items.push({ w, M, depth: c[3], tilt, k: f / c[3] * (w.scale ?? 1) }); }
    items.sort((a, b) => b.depth - a.depth);   // far first
    // depth of field: blur grows with the distance from the sharp plane (thin-lens circle of confusion), capped
    const fo = cam.focus; let df;
    if (typeof fo === 'string') df = items.find(i => i.w.id === fo)?.depth; else if (Array.isArray(fo)) df = scr(fo)?.d;
    else { const d = fwd(cam); df = Math.abs(d[2]) > 0.05 ? ((fo ?? 0) - cam.z) / d[2] : f; }
    if (!(df > 1)) df = f;
    // soft: px on screen, set by the film, replaces the depth-of-field value for that window (see the README: small blurs step)
    for (const it of items) { const b = it.w.soft !== undefined ? it.w.soft : (cam.aperture ?? 1) * 13 * f * Math.abs(it.depth - df) / (it.depth * df); it.blur = b < 0.004 ? 0 : Math.min(OPT.maxBlur, b); }   /* the cut-off is far below what shows: at 0.06 px a window passing it changed sharpness in one frame (film #2, flicker check) */   // continuous: a blur that moved in quarter-pixel steps showed as a flicker on a text-heavy window during a focus rack
    // MATERIAL NEVER CHANGES WHILE A WINDOW IS VISIBLE. It is a pure function of the window's own properties (glass: true | false; default: its
    // hero flag), never of its blur, its angle or its rank among the others: a window that switched between real backdrop blur and the
    // frosted fill as the focus moved flickered (film #1). maxGlass caps the cost; the order is stable (explicit glass first, then by id),
    // so the cap only matters when a film marks more windows as glass than it allows: keep heroes few, or raise space.maxGlass.
    const cand = items.filter(i => i.w.glass === true || (i.w.glass !== false && i.w.hero)).sort((a, b) => (b.w.glass === true ? 1 : 0) - (a.w.glass === true ? 1 : 0) || (a.w.id < b.w.id ? -1 : 1));
    const glass = new Set(cand.slice(0, OPT.maxGlass).map(i => i.w.id));
    const wins = new Map();
    items.forEach((it, rank) => { const { w, M } = it, p = winEl(w.id); seen.add(w.id);
      if (p.html !== w.html) { p.body.innerHTML = w.html || ''; p.html = w.html; }
      const m = M.slice();
      // snap: true -> a window that faces the camera squarely moves in whole pixels (for a still camera only: on a moving one the snap
      // switching on and off as the angle passes zero is itself a half-pixel jump)
      if (w.snap && Math.abs(m[1]) < 1e-7 && Math.abs(m[4]) < 1e-7 && Math.abs(m[3]) < 1e-9 && Math.abs(m[7]) < 1e-9) { m[12] = Math.round(m[12] / m[15]) * m[15]; m[13] = Math.round(m[13] / m[15]) * m[15]; }
      const s = p.el.style; s.display = ''; s.width = w.w + 'px'; s.height = w.h + 'px'; s.transform = `matrix3d(${m.map(v => +v.toFixed(7)).join(',')})`;
      s.opacity = Math.min(0.999, +(w.a ?? 1).toFixed(3));   /* never exactly 1: a window that reaches it changes compositing layer and is drawn differently from that frame on */ s.zIndex = 10 + rank * 2; s.borderRadius = (w.radius ?? 38) + 'px';
      // the blur filter is ALWAYS on (0.02 px when sharp: invisible). A window with a filter is rastered and composited by another path than one
      // without; switching the filter on or off as a window passes through focus changed its sharpness (and the brightness of its fill) in
      // one frame, on every render (film #1: the tiles of the nine systems, the run card, the team board).
      s.filter = `blur(${Math.max(0.02, it.blur / it.k).toFixed(3)}px)`;
      p.el.className = `sp-win ${glass.has(w.id) ? 'sp-glass' : 'sp-frost'}${w.hero ? ' sp-hero' : ''}${w.cls ? ' ' + w.cls : ''}`;
      wins.set(w.id, { M, w, depth: it.depth, rank, k: it.k }); });
    for (const [id, p] of pool) if (!seen.has(id)) p.el.style.display = 'none';
    LAST = { wins, order: items.map(i => i.w.id) };
    return items;
  }

  // ---------- ground: one luminous surface, soft glows that drift with the camera (parallax by depth) ----------
  function drawGround(sp, items) { const v = V(), g = gg; g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0);
    const lg = g.createLinearGradient(0, 0, 0, HH); lg.addColorStop(0, v.g0); lg.addColorStop(0.62, v.g1); lg.addColorStop(1, v.g2); g.fillStyle = lg; g.fillRect(0, 0, W, HH);
    const par = (px, py, k) => [px - (cam.x - CX) * k - cam.yaw * 14 * k, py - (cam.y - CY) * k + cam.pitch * 14 * k];   // far light moves little
    const blob = (x, y, r, col, a) => { if (r < 4 || a <= 0.003) return; const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, hexA(col, a)); rg.addColorStop(0.45, hexA(col, a * 0.5)); rg.addColorStop(1, hexA(col, 0)); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); };
    { const [x, y] = par(W * 0.16, HH * 0.04, 0.12); const rg = g.createRadialGradient(x, y, 0, x, y, 1300); rg.addColorStop(0, v.hi); rg.addColorStop(1, hexA(v.hi.length === 7 ? v.hi : '#FAFCFF', 0)); g.fillStyle = rg; g.fillRect(0, 0, W, HH); }
    { const [x, y] = par(W * 0.92, HH * 1.04, 0.2); const rg = g.createRadialGradient(x, y, 0, x, y, 1400); rg.addColorStop(0, v.lo); rg.addColorStop(1, hexA(v.lo.length === 7 ? v.lo : '#D7E0EB', 0)); g.fillStyle = rg; g.fillRect(0, 0, W, HH); }
    const G = sp.ground || {};
    if (G.tint) { g.fillStyle = hexA(fill(G.tint), 0.05); g.fillRect(0, 0, W, HH); }
    for (const gl of G.glows || []) { const q = scr([gl.x, gl.y, gl.z ?? -600]); if (q) blob(q.x, q.y, (gl.r ?? 420) * f / q.d, fill(gl.accent), (gl.a ?? 0.3) * v.glowK); }
    // each window can carry a light of its own colour behind it: this is what the glass refracts
    for (const it of items) { const w = it.w; if (!w.glow) continue; const q = scr([w.x ?? CX, w.y ?? CY, (w.z ?? 0) - 160]); if (!q) continue;
      blob(q.x, q.y, Math.max(w.w, w.h) * (w.glowR ?? 0.62) * f / q.d * (w.scale ?? 1), fill(w.glow), (w.glowA ?? 0.34) * (w.a ?? 1) * v.glowK); }
    const fl = g.createLinearGradient(0, HH - 270, 0, HH); fl.addColorStop(0, hexA('#FFFFFF', 0)); fl.addColorStop(1, hexA('#FFFFFF', 0.5)); g.fillStyle = fl; g.fillRect(0, HH - 270, W, 270);
  }

  // ---------- lines: thin light between windows, drawn behind the two windows they join and in front of everything farther ----------
  const lineLayers = new Map();   // z-index -> { cv, g, used }
  const layerFor = z => { let L = lineLayers.get(z); if (!L) { const cv = mkCanvas('sp-lines', z); L = { cv, g: cv.getContext('2d') }; lineLayers.set(z, L); } if (!L.used) { L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, HH); L.cv.style.display = ''; L.used = true; } return L.g; };
  const NORMAL = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
  function drawLines(lines) { const v = V(); for (const L of lineLayers.values()) L.used = false;
    for (const ln of lines || []) { const a = resolve(ln.from), b = resolve(ln.to), al = ln.a ?? 1, p = clamp(ln.p ?? 1); if (!a || !b || al <= 0.004 || p <= 0) continue;
      const ra = a.win ? LAST.wins.get(a.win).rank : -1, rb = b.win ? LAST.wins.get(b.win).rank : -1, lo = Math.min(ra < 0 ? rb : ra, rb < 0 ? ra : rb);
      const g = layerFor(ln.front ? 9000 : lo < 0 ? 9 : 9 + lo * 2), col = fill(ln.accent), dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), tl = Math.max(20, dist * 0.36);
      const horiz = Math.abs(dx) >= Math.abs(dy), na = NORMAL[a.side] || (horiz ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dy) || 1]), nb = NORMAL[b.side] || (horiz ? [-(Math.sign(dx) || 1), 0] : [0, -(Math.sign(dy) || 1)]);
      const c1 = [a.x + na[0] * tl, a.y + na[1] * tl], c2 = [b.x + nb[0] * tl, b.y + nb[1] * tl];
      const at = u => { const i = 1 - u; return [i * i * i * a.x + 3 * i * i * u * c1[0] + 3 * i * u * u * c2[0] + u * u * u * b.x, i * i * i * a.y + 3 * i * i * u * c1[1] + 3 * i * u * u * c2[1] + u * u * u * b.y]; };
      const N = Math.max(12, Math.min(72, Math.round(dist / 14))), path = () => { g.beginPath(); for (let i = 0; i <= N; i++) { const u = i / N * p, q = at(u); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } };
      g.globalAlpha = al; g.lineCap = 'round'; g.lineJoin = 'round';
      path(); g.strokeStyle = hexA(col, 0.14); g.lineWidth = 11; g.stroke();
      path(); g.strokeStyle = v.halo; g.lineWidth = 5; g.stroke();
      path(); g.strokeStyle = hexA(col, 0.92); g.lineWidth = 2; g.stroke();
      g.beginPath(); g.arc(a.x, a.y, 5, 0, 7); g.fillStyle = '#FFFFFF'; g.fill(); g.lineWidth = 2.2; g.strokeStyle = col; g.stroke();
      for (const u of ln.pulses || []) { if (u < 0 || u > 1 || u > p) continue; const q = at(u), k = Math.min(1, u * 9, (1 - u) * 9);
        g.globalAlpha = al * k; g.beginPath(); g.arc(q[0], q[1], 16, 0, 7); g.fillStyle = hexA(col, 0.18); g.fill(); g.beginPath(); g.arc(q[0], q[1], 6.5, 0, 7); g.fillStyle = '#FFFFFF'; g.fill(); g.lineWidth = 3; g.strokeStyle = col; g.stroke(); }
      g.globalAlpha = al;
      if (p >= 0.999) { g.beginPath(); g.arc(b.x, b.y, 5, 0, 7); g.fillStyle = col; g.fill();
        const r = ln.ring ?? 0; if (r > 0 && r < 1) { g.beginPath(); g.arc(b.x, b.y, 8 + r * 34, 0, 7); g.strokeStyle = hexA(col, 0.55 * (1 - r)); g.lineWidth = 3 * (1 - r) + 1; g.stroke(); } }
      if (ln.label && p > 0.5) { const q = at(0.5); g.font = '600 22px Inter'; const tw = g.measureText(ln.label).width, bw = tw + 28, bh = 38; g.globalAlpha = al * clamp((p - 0.5) * 5);
        g.beginPath(); g.roundRect(q[0] - bw / 2, q[1] - bh / 2, bw, bh, bh / 2); g.fillStyle = 'rgba(255,255,255,0.94)'; g.fill(); g.strokeStyle = hexA(col, 0.5); g.lineWidth = 1.5; g.stroke();
        g.fillStyle = v.text[ln.accent] || v.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ln.label, q[0], q[1] + 1); }
      g.globalAlpha = 1; }
    for (const L of lineLayers.values()) if (!L.used) L.cv.style.display = 'none';
  }

  // ---------- the wall: thousands of small cards on one plane, one canvas, level of detail by size on screen ----------
  const wallModel = w => mul(tr(w.x ?? CX, w.y ?? CY, w.z ?? 0), mul(rotY(w.ry || 0), rotX(w.rx || 0)));
  // the grid: returns { n, total size, cell(i) -> [u, v] top-left on the plane, block(i) }
  const wallGrid = w => { const [cw, ch] = w.card || [150, 86], gap = w.gap ?? 14, B = w.blocks;
    if (B) { const [bc, br] = B.size, bw = bc * (cw + gap) - gap, bh = br * (ch + gap) - gap, bg = B.gap ?? gap * 5, per = bc * br, n = B.cols * B.rows * per, TW = B.cols * (bw + bg) - bg, TH = B.rows * (bh + bg) - bg;
      return { n, per, TW, TH, cw, ch, bw, bh, blocks: B.cols * B.rows, blockAt: b => { const q = B.reverse ? B.cols * B.rows - 1 - b : b; return [(q % B.cols) * (bw + bg) - TW / 2, Math.floor(q / B.cols) * (bh + bg) - TH / 2]; },
        cell: i => { const b0 = Math.floor(i / per), b = B.reverse ? B.cols * B.rows - 1 - b0 : b0, j = i % per, o = [(b % B.cols) * (bw + bg), Math.floor(b / B.cols) * (bh + bg)]; return [o[0] + (j % bc) * (cw + gap) - TW / 2, o[1] + Math.floor(j / bc) * (ch + gap) - TH / 2]; } }; }
    const cols = w.cols || 20, rows = w.rows || 5, TW = cols * (cw + gap) - gap, TH = rows * (ch + gap) - gap;
    return { n: cols * rows, per: cols * rows, TW, TH, cw, ch, blocks: 0, cell: i => [Math.floor(i / rows) * (cw + gap) - TW / 2, (i % rows) * (ch + gap) - TH / 2] };   // column by column, so the first cards are one end of the wall
  };
  function drawWall(w) { const g = wg, v = V(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, HH); wallCv.style.display = w && (w.a ?? 1) > 0.004 ? '' : 'none'; if (!w || (w.a ?? 1) <= 0.004) return;
    wallCv.style.zIndex = w.front ? 8000 : 1; g.save(); g.beginPath(); g.rect(0, 0, W, HH - OPT.bandH); g.clip();
    const M = mul(PV, wallModel(w)), G = wallGrid(w), A = w.a ?? 1, acc = (w.accents && w.accents.length ? w.accents : ['blue', 'purple', 'green', 'cyan']).map(fill), time = w.time || 0;
    const P = (u, vv) => { const q = xf(M, u, vv, 0); return q[3] > 40 ? [q[0] / q[3], q[1] / q[3], q[3]] : null; };
    // haze: the near end is clear, the far end fades toward the ground's light (but never vanishes), from the wall's own depth range
    const dz = [[-G.TW / 2, -G.TH / 2], [G.TW / 2, -G.TH / 2], [G.TW / 2, G.TH / 2], [-G.TW / 2, G.TH / 2]].map(([u, vv]) => Math.max(40, xf(M, u, vv, 0)[3]));
    const hz = w.haze || [Math.min(...dz), Math.max(...dz) * 1.5 + 1];
    const B = w.blocks, lit = B ? (B.lit ?? G.blocks) : 0, count = B ? lit * G.per : (w.count ?? G.n), labels = w.labels || [];
    const quad = (u, vv, ww, hh) => { const a = P(u, vv), b = P(u + ww, vv), c = P(u + ww, vv + hh), d = P(u, vv + hh); if (!a || !b || !c || !d) return false; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); return true; };
    const rquad = (u, vv, ww, hh, r) => { const p = [P(u, vv), P(u + ww, vv), P(u + ww, vv + hh), P(u, vv + hh)]; if (p.some(q => !q)) return false; g.beginPath(); g.moveTo((p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2);
      for (let k = 1; k <= 4; k++) { const a = p[k % 4], b = p[(k + 1) % 4]; g.arcTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, r); } g.closePath(); return true; };
    // blocks: a faint tray under each block; the lit ones glow, the next one fills
    if (B) for (let b = 0; b < G.blocks; b++) { const [bu, bv] = G.blockAt(b), c = P(bu + G.bw / 2, bv + G.bh / 2); if (!c) continue; const fog = 1 - 0.9 * clamp((c[2] - hz[0]) / (hz[1] - hz[0])), on = clamp(lit - b);
      if (fog <= 0.01) continue; const pad = (w.gap ?? 14) * 1.6; if (!quad(bu - pad, bv - pad, G.bw + pad * 2, G.bh + pad * 2)) continue; g.globalAlpha = A * fog;
      g.fillStyle = on > 0 ? hexA(acc[b % acc.length], 0.07 + 0.07 * on) : v.ghost; g.fill(); g.strokeStyle = on > 0 ? hexA(acc[b % acc.length], 0.5) : v.cardRim; g.lineWidth = on > 0 ? 1.6 : 1; g.stroke();
      if (B.labels && (on > 0 || b === Math.floor(lit))) { const k = f / c[2], px = 30 * k * (G.bw / 600); if (px > 9) { const q = P(bu + G.bw / 2, bv - pad - 34); if (q) { g.font = `800 ${Math.round(Math.max(13, Math.min(40, px)))}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = on > 0 ? v.ink : v.soft; g.fillText(String(b + 1), q[0], q[1]); } } } }
    g.globalAlpha = 1; let dots = [];
    for (let i = 0; i < G.n; i++) { const [u, vv] = G.cell(i), c = P(u + G.cw / 2, vv + G.ch / 2); if (!c || c[0] < -200 || c[0] > W + 200 || c[1] < -200 || c[1] > HH + 200) continue;
      const fog = 1 - 0.9 * clamp((c[2] - hz[0]) / (hz[1] - hz[0])); if (fog <= 0.012) continue;
      const e = P(u + G.cw, vv + G.ch / 2), pw = e ? Math.hypot(e[0] - (2 * c[0] - e[0]), e[1] - (2 * c[1] - e[1])) : 0, ph = pw * G.ch / G.cw;
      // which cards are running: in order for a plain wall; a seeded scatter inside the block that is filling
      const on = B ? (Math.floor(i / G.per) < Math.floor(lit) ? 1 : Math.floor(i / G.per) === Math.floor(lit) ? (hash(i * 1.37) < lit % 1 ? 1 : 0) : 0) : clamp(count - i);
      if (B && on <= 0) continue;                                           // a block that has not started shows only its tray
      const col = acc[Math.floor(hash(i * 3.11 + 5) * acc.length)], al = A * fog;
      if (pw < 3.2) { if (pw < 1.3 && hash(i * 9.1) > pw / 1.3) continue;   // thinner than a pixel: keep only a share, so the far end stays light
        if (on > 0 || hash(i) < 0.5) dots.push([c[0], c[1], Math.max(1, pw * 0.5), on > 0 ? hexA(col, al * 0.36) : hexA('#9AAAC2', al * 0.3)]); continue; }
      if (pw < 15) { if (!quad(u, vv, G.cw, G.ch)) continue; g.fillStyle = hexA('#FFFFFF', al * (on > 0 ? 0.95 : 0.5)); g.fill();   // far cards: a white card with its bar, no detail
        if (on > 0 && quad(u + G.cw * 0.1, vv + G.ch * 0.64, G.cw * 0.8 * (0.2 + 0.8 * hash(i * 7.7)), G.ch * 0.2)) { g.fillStyle = hexA(col, al * 0.75); g.fill(); } continue; }
      if (!(pw >= 26 ? rquad(u, vv, G.cw, G.ch, Math.min(pw, ph) * 0.17) : quad(u, vv, G.cw, G.ch))) continue;
      g.globalAlpha = al * (on > 0 ? 1 : 0.5); g.fillStyle = v.card; if (pw >= 44) { g.shadowColor = 'rgba(18,44,80,0.20)'; g.shadowBlur = Math.min(26, pw * 0.14) * on; g.shadowOffsetY = Math.min(14, pw * 0.07) * on; }   /* a canvas shadow is the costly part: only where it shows */ g.fill(); g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.strokeStyle = v.cardRim; g.lineWidth = 1; g.stroke();
      if (on <= 0) { g.globalAlpha = 1; continue; }
      // the activity bar: a track along the bottom, the bar's length moves with time
      const pr = 0.12 + 0.86 * ((hash(i * 7.7) + time * (0.03 + 0.05 * hash(i * 2.3))) % 1), m = G.cw * 0.1, by = vv + G.ch * 0.7, bh = G.ch * 0.13;
      if (quad(u + m, by, G.cw - 2 * m, bh)) { g.fillStyle = v.track; g.fill(); } if (quad(u + m, by, (G.cw - 2 * m) * pr, bh)) { g.fillStyle = hexA(col, 0.9); g.fill(); }
      if (pw >= 34) { const o = P(u, vv), ex = P(u + G.cw, vv), ey = P(u, vv + G.ch); if (o && ex && ey) { // text rides the card's own plane (affine fit of this card)
        g.save(); g.setTransform((ex[0] - o[0]) / G.cw, (ex[1] - o[1]) / G.cw, (ey[0] - o[0]) / G.ch, (ey[1] - o[1]) / G.ch, o[0], o[1]);
        g.beginPath(); g.arc(m + G.ch * 0.07, G.ch * 0.27, G.ch * 0.07, 0, 7); g.fillStyle = col; g.fill();
        if (pw >= 70 && labels.length) { g.font = `800 ${Math.round(G.ch * 0.2)}px Inter`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = v.ink; g.fillText(labels[Math.floor(hash(i * 5.3 + 1) * labels.length)], m + G.ch * 0.22, G.ch * 0.285, G.cw - 2 * m - G.ch * 0.22); }
        else { g.fillStyle = hexA('#022C4C', 0.16); g.fillRect(m + G.ch * 0.22, G.ch * 0.21, G.cw * 0.42, G.ch * 0.12); }
        g.restore(); } }
      g.globalAlpha = 1; }
    for (const [x, y, r, c] of dots) { g.fillStyle = c; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.globalAlpha = 1; g.restore();
  }

  // ---------- one frame ----------
  async function apply(world) { const sp = (world && world.space) || {}; root.style.display = sp.hide ? 'none' : ''; if (sp.hide) return;
    setCam(sp.cam || {}); const items = drawWindows(sp.windows || []); drawGround(sp, items); drawWall(sp.wall); drawLines(sp.lines); }

  // ---------- helpers for timelines ----------
  const SAFE = { hw: 850, top: 150, bot: 950 };
  // fit points on screen: orbit the centre at (yaw, pitch), find the distance at which every point is inside the safe area
  const fitCam = (pts, pad = 1.12, o = {}) => { const fov = o.fov ?? OPT.fov, ff = F(fov), n = pts.length || 1, c = [0, 1, 2].map(k => pts.reduce((s, p) => s + p[k], 0) / n);
    const mn = [0, 1, 2].map(k => Math.min(...pts.map(p => p[k]))), mx = [0, 1, 2].map(k => Math.max(...pts.map(p => p[k]))), ctr = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
    const base = { yaw: o.yaw || 0, pitch: o.pitch || 0, fov }, d = fwd(base), cyS = (SAFE.top + SAFE.bot) / 2, hh = (SAFE.bot - SAFE.top) / 2;
    const fits = dist => { const cm = { ...base, x: ctr[0] - d[0] * dist, y: ctr[1] - d[1] * dist, z: ctr[2] - d[2] * dist }, m = mul(projOf(ff), viewOf(cm));
      return pts.every(p => { const q = xf(m, p[0], p[1], p[2]); return q[3] > 80 && Math.abs(q[0] / q[3] - CX) * pad <= SAFE.hw && Math.abs(q[1] / q[3] - cyS) * pad <= hh; }); };
    let lo = 120, hi = 60000; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; fits(mid) ? (hi = mid) : (lo = mid); }
    // the safe area's centre sits a little below the frame's centre is not true here (chrome top and bottom are equal), so no shift is needed
    // o.shift [dx, dy]: where the fitted content sits on screen, in px from the centre (move the camera sideways, not the angle)
    const sh = o.shift || [0, 0], vr = viewOf({ ...base, x: 0, y: 0, z: 0 }), right = [vr[0], vr[4], vr[8]], down = [vr[1], vr[5], vr[9]], kx = -sh[0] * hi / ff, ky = -sh[1] * hi / ff;
    return { x: ctr[0] - d[0] * hi + right[0] * kx + down[0] * ky, y: ctr[1] - d[1] * hi + right[1] * kx + down[1] * ky, z: ctr[2] - d[2] * hi + right[2] * kx + down[2] * ky,
      yaw: base.yaw, pitch: base.pitch, fov, focus: o.focus ?? [c[0], c[1], c[2]], aperture: o.aperture ?? 1 }; };
  const frame = (list, pad, o) => fitCam((list || []).flatMap(w => Array.isArray(w) ? [w] : typeof w === 'string' ? (LAST.wins.get(w) ? cornersOf(LAST.wins.get(w).w) : []) : cornersOf(w)), pad, o);
  const wallFrame = (w, share = 1, pad, o) => { const G = wallGrid(w), m = wallModel(w), n = Math.max(1, Math.round(G.n * clamp(share))), pts = [];
    for (const i of [0, n - 1, Math.min(n - 1, (w.rows || 1) - 1), Math.max(0, n - (w.rows || 1))]) { const [u, v] = G.cell(i); pts.push(xf(m, u, v, 0).slice(0, 3), xf(m, u + G.cw, v + G.ch, 0).slice(0, 3)); }
    if (w.blocks) { pts.length = 0; const nb = Math.max(1, Math.ceil(G.blocks * clamp(share))); for (let b = 0; b < nb; b++) { const [u, v] = G.blockAt(b); pts.push(xf(m, u, v, 0).slice(0, 3), xf(m, u + G.bw, v + G.bh, 0).slice(0, 3)); } }
    return fitCam(pts, pad, o); };
  const fpt = c => Array.isArray(c.focus) ? c.focus : null;
  const mix = (a, b, u) => { const o = {}; for (const k of ['x', 'y', 'z', 'yaw', 'pitch', 'fov', 'aperture']) o[k] = lerp(a[k] ?? (k === 'fov' ? OPT.fov : k === 'aperture' ? 1 : k === 'z' ? F(a.fov) : DEF[k] ?? 0), b[k] ?? (k === 'fov' ? OPT.fov : k === 'aperture' ? 1 : k === 'z' ? F(b.fov) : DEF[k] ?? 0), u);
    const fa = fpt(a), fb = fpt(b); o.focus = fa && fb ? fa.map((v, i) => lerp(v, fb[i], u)) : typeof a.focus === 'number' && typeof b.focus === 'number' ? lerp(a.focus, b.focus, u) : (u < 0.5 ? a.focus : b.focus); return o; };
  // the same point of interest seen from another angle: turn the camera about the point it is focused on
  const orbit = (c, yaw = 0, pitch = 0) => { const base = { ...DEF, fov: OPT.fov, ...c }; if (base.z === undefined) base.z = F(base.fov); const d0 = fwd(base), fo = fpt(base);
    const dist = fo ? Math.max(200, (fo[0] - base.x) * d0[0] + (fo[1] - base.y) * d0[1] + (fo[2] - base.z) * d0[2]) : F(base.fov), ctr = [base.x + d0[0] * dist, base.y + d0[1] * dist, base.z + d0[2] * dist];
    const n = { ...base, yaw: base.yaw + yaw, pitch: base.pitch + pitch }, d = fwd(n); return { ...n, x: ctr[0] - d[0] * dist, y: ctr[1] - d[1] * dist, z: ctr[2] - d[2] * dist }; };
  const enter = (w, u, o = {}) => { const e = ss(clamp(u)), k = 1 - e; return { ...w, a: (w.a ?? 1) * clamp(u * 1.6), y: (w.y ?? CY) + k * (o.dy ?? 90), z: (w.z ?? 0) - k * (o.dz ?? 160), rx: (w.rx || 0) + k * (o.rx ?? 7), ry: (w.ry || 0) + k * (o.ry ?? 0) }; };
  const leave = (w, u, o = {}) => { const e = ss(clamp(u)); return { ...w, a: (w.a ?? 1) * clamp((1 - u) * 1.6), y: (w.y ?? CY) - e * (o.dy ?? 70), z: (w.z ?? 0) - e * (o.dz ?? 220), rx: (w.rx || 0) - e * (o.rx ?? 5) }; };
  const inFrame = (c, w, sx = CX, sy = CY, depth = 0, turn = 0) => { const ff = F(c.fov), d = ff + depth, k = d / ff, yr = (c.yaw || 0) * RAD, fo = [Math.sin(yr), 0, -Math.cos(yr)], ri = [Math.cos(yr), 0, Math.sin(yr)];
    return { ...w, x: c.x + fo[0] * d + ri[0] * (sx - CX) * k, y: c.y + (sy - CY) * k, z: (c.z ?? ff) + fo[2] * d + ri[2] * (sx - CX) * k, ry: turn - (c.yaw || 0), rx: 0, scale: (w.scale ?? 1) * k }; };
  // every visible window's box on screen for a given space state, without drawing (tools/motion-check.mjs --flicker reads rendered frames with it)
  const screenBoxes = sp => { const c = { ...DEF, fov: OPT.fov, ...(sp.cam || {}) }, ff = F(c.fov); if (c.z === undefined) c.z = ff; const pv = mul(projOf(ff), viewOf(c)), out = [];
    for (const w of sp.windows || []) { if (!w || !w.id || (w.a ?? 1) <= 0.004) continue; const m = mul(pv, modelOf(w)), q = [[0, 0], [w.w, 0], [w.w, w.h], [0, w.h]].map(([x, y]) => xf(m, x, y, 0)); if (q.some(p => p[3] < 60)) continue;
      const xs = q.map(p => p[0] / p[3]), ys = q.map(p => p[1] / p[3]); out.push({ id: w.id, a: w.a ?? 1, depth: xf(m, w.w / 2, w.h / 2, 0)[3], x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }); }
    return out; };
  const xy = q => (q ? { x: q.x, y: q.y } : null);
  return { apply, takeErrors: () => { const n = errors; errors = 0; return n; },
    project: p => xy(scr(Array.isArray(p) ? p : [p.x, p.y, p.z || 0])), anchor: s => xy(resolve(s)),
    F, frame, wallFrame, inFrame, screenBoxes, mix, orbit, enter, leave, cornersOf, home: () => ({ ...DEF, fov: OPT.fov, z: F() }) };
}
