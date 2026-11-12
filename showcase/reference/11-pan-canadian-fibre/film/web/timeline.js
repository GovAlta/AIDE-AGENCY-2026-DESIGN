// The film as a pure function of time: stateAt(t) returns everything on screen at second t (camera, layers, routes, interface).
// Cut times follow the song's measured downbeats (assets/song-analysis.json) and the narration's measured lengths (narration/timing.json).
export const DUR = 197.6, FPS = 60;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const ramp = (t, a, b) => ss((t - a) / (b - a));                       // 0 -> 1 between a and b, eased
const win = (t, a, b, fi = 0.6, fo = 0.6) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b)); // on between a and b
const env = (t, pts) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], ss((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]))); return pts[pts.length - 1][1]; };
const bump = (t, t0, d = 1.3) => (t < t0 || t > t0 + d ? 0 : 1 - ss((t - t0) / d));   // a highlight that decays after t0
const outBack = x => { x = clamp(x); const c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

// monotone cubic interpolation (no overshoot) through [t, v] keys: smooth, continuous camera moves
function mono(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]), d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return x => { if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1]; let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1]; };
}
const track = keys => { const f = [1, 2, 3, 4, 5].map(c => mono(keys.map(k => [k[0], k[c] ?? 0]))); return t => ({ lng: f[0](t), lat: f[1](t), zoom: f[2](t), pitch: f[3](t), bearing: f[4](t) }); };

// ---- cut points (seconds)
export const T = { cables: 10.6, canada: 20.0, alberta: 32.0, question: 43.2, title: 53.0, layers: 64.0, comm: 74.9, north: 85.5, conn: 95.0,
  chase: 106.44, all: 119.5, plan: 128.4, compare: 140.3, draw: 150.5, wide: 159.0, climax: 168.76, end: 184.6 };
// narration starts (seconds); lengths come from narration/timing.json
export const VO = { n01: 3.46, n02: 11.4, n03: 19.36, n04: 32.6, n05: 43.19, n06: 53.0, n07: 64.8, n08: 74.91, n09: 85.9, n10: 95.0, n11: 106.44, n12: 119.8, n13: 130.3, n14: 140.3, n15: 150.67, n16: 159.2, n17: 169.3, n18: 174.0 };

const CREDIT = 'Imagery: NASA Blue Marble and Black Marble · Data: OGL – Canada, Alberta · © TeleGeography, CC BY-NC-SA 3.0 (unconfirmed) · © OpenStreetMap contributors';
const LAYER_TICKS = [ // [layer id, tick time, untick time]
  ['roads', 67.01, 95.2], ['rail', 69.64, 86.6], ['waterways', 72.28, 95.2], ['ports', 73.6, 86.6],
  ['indigenous_lands', 77.56, 86.6], ['indigenous_communities', 80.2, 86.6], ['military', 82.83, 86.6],
  ['permafrost', 88.07, 95.2], ['remote_communities', 90.7, 95.2],
  ['broadband_fibre', 96.5, 999], ['fixed_link_sites', 98.57, 999], ['broadband_communities', 101.22, 999]];
const NS = ['ns-ab', 'ns-bc', 'ns-mb', 'ns-nb', 'ns-nl', 'ns-nt', 'ns-ns', 'ns-nu', 'ns-on', 'ns-pe', 'ns-qc', 'ns-sk', 'ns-yt'];
const NS_T0 = 122.6, NS_STEP = 0.3;
const PLAN = { y: 'ab-pacific-yellowhead', s: 'ab-pacific-south', n: 'ab-pacific-north' };

export function createTimeline(M, timing) {
  const P = M.routesData.places, R = M.routesData.routes;
  const ll = id => P[id].lonLat;
  const lab = (id, a, o = {}) => ({ lonLat: ll(id), text: P[id].name.replace(/,.*$/, ''), a, ...o });

  // ---- camera: A (0 -> chase), the chase itself, C (after the chase)
  const camA = track([
    [0, -112, 16, 2.2], [10, -72, 30, 2.45], [19.4, -40, 45, 2.8], [22.6, -62, 53, 2.78], [26, -97, 60, 2.85], [32, -101, 59, 2.95],
    [37.5, -113.4, 54.6, 5.0, 40, -8], [44, -113.8, 53.5, 5.75, 54, -16], [48, -114.6, 53.3, 5.3, 48, -10], [53, -110, 56, 3.7, 18, -2], [59, -100, 60, 2.75], [64, -103, 59.6, 2.92],
    [74.9, -103, 57.5, 3.2], [85.5, -108, 56, 3.55, 14, 0], [91, -116, 66, 3.6, 38, 8], [95.5, -114, 66.5, 3.65, 38, 10], [100.5, -97, 50.8, 4.0, 30, 0], [106.44, -84, 47, 4.35, 36, -10]]);
  const camC = track([
    [119.5, -98, 58, 2.9], [122, -100, 60, 2.85], [128, -102, 59.5, 2.9], [131.5, -121.8, 52.7, 5.0, 42, -8], [140.3, -122.2, 52.8, 5.0, 42, -8], [150.5, -122.8, 53.0, 4.95, 40, -8],
    [154, -129, 65.3, 4.6, 40, 10], [159, -128.5, 65.5, 4.55, 40, 12], [164.5, -100, 58.5, 2.95], [168.76, -100, 58, 2.9], [176, -97, 53, 2.5], [185, -88, 45, 2.12], [DUR, -82, 41, 2.02]]);

  // the chase follows the head of the southern route (the solver's own line), then rises to the whole country
  const southParts = M.routeParts['ew-south'].map(p => ({ L: M.lineIndex[p.srcId], km: p.km }));
  const southKm = southParts.reduce((s, p) => s + p.km, 0);
  const southAt = p => { let km = clamp(p) * southKm; for (const part of southParts) { if (km <= part.km) return M.at(part.L, km / part.km * part.L.km); km -= part.km; } const l = southParts[southParts.length - 1].L; return l.coords[l.coords.length - 1]; };
  const chaseP = mono([[106.44, 0.004], [107.4, 0.022], [111.6, 0.158], [115.2, 0.56], [118.7, 1]]);
  const chaseZoom = mono([[106.44, 6.7], [110.6, 6.3], [113.6, 4.2], [116.6, 3.1], [119.5, 2.9]]);
  const chasePitch = mono([[106.44, 66], [110.6, 62], [113.6, 45], [116.6, 15], [118.6, 0]]);
  const heading = (a, b) => { const t = Math.PI / 180, y = Math.sin((b[0] - a[0]) * t) * Math.cos(b[1] * t), x = Math.cos(a[1] * t) * Math.sin(b[1] * t) - Math.sin(a[1] * t) * Math.cos(b[1] * t) * Math.cos((b[0] - a[0]) * t); return Math.atan2(y, x) / t; };
  // The chase camera is a smoothed path, worked out once: the route head's position and heading sampled every frame, then
  // Gaussian-smoothed in time (centred, so no lag). Position: sigma 0.9 s. Heading: sigma 1.6 s, so switchbacks do not swing the view.
  const CH0 = T.chase, CH1 = T.all, HZ = 60, NCH = Math.round((CH1 - CH0) * HZ) + 1;
  const rawLng = new Float64Array(NCH), rawLat = new Float64Array(NCH), rawHd = new Float64Array(NCH);
  for (let k = 0, prev = null; k < NCH; k++) { const p = chaseP(CH0 + k / HZ), q = southAt(p); rawLng[k] = q[0]; rawLat[k] = q[1];
    let h = heading(southAt(Math.max(0, p - 0.01)), southAt(Math.min(1, p + 0.03))); if (prev !== null) { while (h - prev > 180) h -= 360; while (h - prev < -180) h += 360; } rawHd[k] = prev = h; }
  const gauss = (src, sigmaS) => { const r = Math.ceil(3 * sigmaS * HZ), w = []; for (let d = -r; d <= r; d++) w.push(Math.exp(-0.5 * (d / (sigmaS * HZ)) ** 2));
    const out = new Float64Array(src.length); for (let k = 0; k < src.length; k++) { let a = 0, ws = 0; for (let d = -r; d <= r; d++) { const m = k + d; if (m < 0 || m >= src.length) continue; a += src[m] * w[d + r]; ws += w[d + r]; } out[k] = a / ws; } return out; };
  const smLng = gauss(rawLng, 0.9), smLat = gauss(rawLat, 0.9), smHd = gauss(rawHd, 1.6);
  const sample = (arr, t) => { const x = clamp((t - CH0) * HZ, 0, NCH - 1), k = Math.floor(x), f = x - k; return k >= NCH - 1 ? arr[NCH - 1] : arr[k] + (arr[k + 1] - arr[k]) * f; };
  const camChase = t => { const w = ramp(t, 113, 118.6), lng = sample(smLng, t), lat = sample(smLat, t), hd = sample(smHd, t);
    return { lng: lerp(lng, -98, w), lat: lerp(lat, 58, w), zoom: chaseZoom(t), pitch: chasePitch(t), bearing: lerp(hd, 0, ramp(t, 111.5, 117.5)) * 0.82 }; };
  // when the head of the southern route passes each place (for labels)
  const passTime = id => { let best = 0, bd = 1e9; for (let i = 0; i <= 400; i++) { const q = southAt(i / 400), d = Math.hypot((q[0] - ll(id)[0]) * 0.6, q[1] - ll(id)[1]); if (d < bd) { bd = d; best = i / 400; } }
    let lo = 106.44, hi = 118.7; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (chaseP(m) < best) lo = m; else hi = m; } return lo; };
  const CHASE_LABELS = ['vancouver', 'kamloops', 'calgary', 'regina', 'winnipeg', 'thunder-bay', 'ottawa', 'montreal', 'st-johns'].filter(id => P[id]).map(id => ({ id, t: passTime(id) }));

  const sketchL = M.lineIndex['r-sketch'], sketchF1 = sketchL.cum[1] / sketchL.km;
  const traceN = { [PLAN.y]: 11625, [PLAN.s]: 7794, [PLAN.n]: 17370 };
  const pm = id => M.plans[id].result.metrics;
  const estLine = M.est.lines.buried.lines[0];

  // captions: each narration line split into short phrases, timed from the voice's own word times
  const CAPS = [];
  for (const [id, t0] of Object.entries(VO)) { if (id === 'n17') continue; const words = timing[id].words; let cur = [];
    const flush = () => { if (cur.length) { CAPS.push({ s: t0 + cur[0].s - 0.12, e: t0 + cur[cur.length - 1].e + 0.25, text: cur.map(w => w.w).join(' ') }); cur = []; } };
    for (const w of words) { cur.push(w); const len = cur.map(x => x.w).join(' ').length; if (/[.?!]$/.test(w.w) || (len > 46 && /[,]$/.test(w.w)) || len > 62) flush(); }
    flush(); }
  for (let i = 0; i < CAPS.length - 1; i++) if (CAPS[i + 1].s - CAPS[i].e < 0.5) CAPS[i].e = CAPS[i + 1].s; // no flicker between phrases of one line

  function stateAt(t) {
    const cam = t < T.chase ? camA(t) : t < T.all ? camChase(t) : camC(t);
    const terr = 1.6 * ramp(cam.zoom, 3.5, 4.5);
    const s = { t, cam, terrain: Math.round(terr * 20) / 20, groups: {}, routes: {}, search: {}, waypoints: [], pulses: [], reveal: {} };

    // ---- grade
    s.grade = { brightness: env(t, [[0, 0.1], [10, 0.14], [20, 0.2], [26, 0.34], [34, 0.36], [38, 0.5], [52, 0.5], [57, 0.2], [63, 0.22], [66, 0.42], [86, 0.42], [89, 0.46], [95, 0.46], [98, 0.36], [106.4, 0.36], [106.44, 0.6], [113, 0.58], [118, 0.36], [128, 0.36], [131.5, 0.5], [159, 0.5], [164.5, 0.34], [168.7, 0.3], [176, 0.2], [185, 0.1]]),
      lights: env(t, [[0, 1], [26, 0.9], [38, 0.9], [57, 0.5], [66, 0.4], [86, 0.4], [89, 0.3], [98, 0.25], [106.4, 0.25], [106.44, 0.7], [128, 0.6], [150, 0.6], [153, 0.3], [159, 0.3], [164, 0.7], [170, 1]]),
      hill: 0.32 * ramp(cam.zoom, 3.6, 4.6) };

    // ---- data layers (opacity 0..1 of each planner layer)
    const G = s.groups;
    const cab = env(t, [[10.4, 0], [10.6, 1], [34, 1], [37.5, 0.3], [46, 0.3], [50, 0.85], [55, 0.85], [58, 0.3], [63.5, 0.3], [65.5, 0], [141.5, 0], [144, 0.8], [150.5, 0.8], [152.5, 0], [165.5, 0], [169, 1], [184, 1], [187, 0.35]]);
    G.subsea_cables = cab; G.landing_points = cab * ramp(t, 12.5, 13);
    s.reveal.subsea_cables = env(t, [[10.6, 0], [19.6, 1]]); s.reveal.landing_points = env(t, [[13, 0], [20.5, 1]]);
    G.boundaries = env(t, [[21.5, 0], [24.5, 1], [56, 1], [58, 0.8], [185, 1], [187, 0.4]]);
    G.critical_infra = env(t, [[34, 0], [37.5, 1], [52, 1], [56, 0]]);
    G.waterways = env(t, [[34, 0], [37, 0.5], [53, 0.5], [56, 0], [72.28, 0], [73.1, 1], [86, 1], [88, 0.5], [95, 0.5], [97, 0], [106.4, 0], [106.44, 0.6], [113, 0.6], [116, 0], [129, 0], [131.5, 0.4], [150, 0.4], [152, 0.6], [159, 0.6], [161.5, 0]]);
    G.roads = env(t, [[67.01, 0], [67.8, 1], [75, 1], [77, 0.3], [86, 0.3], [88, 0.5], [95, 0.5], [97, 0], [106.4, 0], [106.44, 0.7], [112, 0.7], [116, 0.25], [128.4, 0.25], [131.5, 0.55], [150, 0.55], [159, 0.6], [163, 0.3], [176, 0.2]]);
    G.rail = env(t, [[69.64, 0], [70.4, 1], [75, 1], [77, 0.3], [86, 0.3], [88, 0], [106.4, 0], [106.44, 0.5], [112, 0.5], [115, 0], [129, 0], [131.5, 0.5], [150, 0.5], [152.5, 0]]);
    G.ports = env(t, [[73.6, 0], [74.3, 1], [86, 1], [88, 0], [119.8, 0], [121, 1], [128.4, 1], [130, 0], [141.5, 0], [144, 1], [150.5, 1], [152.5, 0]]);
    G.indigenous_lands = env(t, [[77.56, 0], [78.4, 1], [86, 1], [88, 0]]);
    G.indigenous_communities = env(t, [[80.2, 0], [81, 1], [86, 1], [88, 0], [160, 0], [162.5, 0.9], [169, 0.9], [173, 0]]);
    G.military = env(t, [[82.83, 0], [83.6, 1], [86, 1], [88, 0]]);
    G.permafrost = env(t, [[88.07, 0], [89, 1], [95, 1], [96.5, 0], [151.5, 0], [153.2, 1], [159, 1], [161, 0]]);
    G.remote_communities = env(t, [[90.7, 0], [91.5, 1], [95, 1], [96.5, 0], [152.2, 0], [153.5, 1], [169, 1], [173, 0]]);
    G.broadband_fibre = env(t, [[96.5, 0], [97.3, 1], [104.6, 1], [106.2, 0]]);
    G.fixed_link_sites = env(t, [[98.57, 0], [99.3, 1], [104.6, 1], [106.2, 0]]);
    G.broadband_communities = env(t, [[101.22, 0], [102, 1], [104.6, 1], [106.2, 0]]);
    G.named_places = env(t, [[160.5, 0], [163, 1], [169, 1], [173, 0]]);

    // ---- modeled routes
    const dim = env(t, [[128.4, 1], [131, 0.3], [159.5, 0.3], [164, 1]]);
    const RT = s.routes;
    RT['ew-south'] = { p: t < T.chase ? 0 : chaseP(t), a: dim, head: t < 118.7 ? 1 : 0 };
    RT['ew-north'] = { p: ramp(t, 119.8, 123.2), a: dim };
    RT['ew-north-atl'] = { p: 1, a: ramp(t, 122.4, 124.6) * dim }; RT['ew-north-pac'] = { p: 1, a: ramp(t, 122.4, 124.6) * dim };
    NS.forEach((id, i) => { RT[id] = { p: ramp(t, NS_T0 + i * NS_STEP, NS_T0 + i * NS_STEP + 1.6), a: id === 'ns-nt' ? Math.max(dim, ramp(t, 151.5, 153)) : dim }; });
    // ---- the film's three plans: recorded search, then the solved line
    const planA = env(t, [[150.5, 1], [152.5, 0], [166, 0], [169, 0.9]]);
    const runs = [[PLAN.y, 135.2, 138.2, 139.6], [PLAN.s, 141.7, 142.9, 143.7], [PLAN.n, 143.1, 144.6, 145.5]];
    for (const [id, a, b, c] of runs) { s.search[id] = { p: clamp((t - a) / (b - a)), a: (t < a ? 0 : 1 - ramp(t, c, c + 1.6)) }; RT[id] = { p: ramp(t, b, c), a: planA, head: t < c ? 1 : 0 }; }
    // ---- the drawn line: grows point by point (clicks at 153.6, 154.7, 155.8)
    RT.sketch = { p: t < 153.7 ? 0 : t < 154.8 ? sketchF1 * ramp(t, 153.7, 154.7) : lerp(sketchF1, 1, ramp(t, 154.8, 155.8)), a: 1 - ramp(t, 159.4, 161) };

    // ---- travelling lights
    const PU = s.pulses;
    if (t > 10.6 && t < 21) { const a = 0.85 * win(t, 10.8, 21, 1, 1), rev = s.reveal.subsea_cables; // light running through the cables as they appear
      M.cableLines.forEach((c, i) => { if (c.L.km < 900 || c.ph > rev * 0.9 || i % 2) return; const km = ((t * 520 + c.ph * 9000) % (c.L.km + 600)) - 300; if (km > 0 && km < c.L.km) PU.push({ p: M.at(c.L, km), c: c.color, r: 1.7, a }); }); }
    if (t >= T.chase && t < 119) { const q = southAt(chaseP(t)); PU.push({ p: q, c: '#8fd0ff', r: lerp(5, 3, ramp(t, 111, 116)), a: 1 - ramp(t, 118.5, 119) }); }
    for (const [id, a, b, c] of runs) if (t > b && t < c) { const L = M.lineIndex['r-' + id]; PU.push({ p: M.at(L, ramp(t, b, c) * L.km), c: '#ffffff', r: 4, a: 1 }); }
    if (t > T.climax - 0.2) { const a0 = ramp(t, T.climax - 0.2, T.climax + 0.6) * (1 - ramp(t, 184.5, 187.5)), dt = t - T.climax;
      // the burst: rings of light from Edmonton and Calgary on the downbeat
      for (const [id, d] of [['edmonton', 0], ['calgary', 0.35]]) { const x = (dt - d) / 2.4; if (x > 0 && x < 1) PU.push({ p: ll(id), c: '#ffffff', r: 4 + 26 * outBack(x), a: (1 - x) * 0.9 }); PU.push({ p: ll(id), c: '#bfe6ff', r: 4.5, a: a0 }); }
      // streams that leave Alberta along every modeled route and plan, then run out through the indicative subsea legs
      const stream = (srcId, originKm, color, delay, v = 520, gap = 420, both = true) => { const L = M.lineIndex[srcId]; if (!L) return; const d = (dt - delay) * v; if (d <= 0) return;
        for (let j = 0; j * gap < d; j++) { const off = d - j * gap; for (const sgn of both ? [1, -1] : [1]) { const km = originKm + sgn * off; if (km > 0 && km < L.km) PU.push({ p: M.at(L, km), c: color, r: 2.6, a: a0 }); } } };
      const nearestKm = (srcId, pt) => { const L = M.lineIndex[srcId]; let b = 0, bd = 1e9; L.coords.forEach((q, i) => { const dd = Math.hypot((q[0] - pt[0]) * 0.6, q[1] - pt[1]); if (dd < bd) { bd = dd; b = i; } }); return L.cum[b]; };
      stream('r-ew-south-main', (stateAt.kS ??= nearestKm('r-ew-south-main', ll('calgary'))), '#8fd0ff', 0);
      stream('r-ew-north-spine', (stateAt.kN ??= nearestKm('r-ew-north-spine', ll('lac-la-biche'))), '#ffd89a', 0.2);
      stream('r-ns-ab-main', (stateAt.kA ??= nearestKm('r-ns-ab-main', ll('edmonton'))), '#d8f5a8', 0);
      stream('r-ew-south-nl', 0, '#8fd0ff', 9.5, 520, 420, false); stream('r-ew-north-atl', 0, '#ffd89a', 4.2, 900, 700, false); stream('r-ew-north-pac', 0, '#ffd89a', 3.2, 900, 700, false);
      for (const id of Object.values(PLAN)) stream('r-' + id, 0, '#ffffff', 0.3, 520, 420, false);
      for (const id of NS) if (id !== 'ns-ab') for (const part of M.routeParts[id]) if (part.kind === 'land') stream(part.srcId, 0, '#d8f5a8', 1.6, 420, 380, false);
      // and through the world's cables
      const ca = a0 * ramp(t, 170.5, 173) * 0.9;
      if (ca > 0.01) M.cableLines.forEach(c => { for (let km = ((dt * 640 + c.ph * 2600) % 2600); km < c.L.km; km += 2600) PU.push({ p: M.at(c.L, km), c: c.color, r: 1.9, a: ca }); }); }

    // ---- interface
    const ui = s.ui = { chrome: ramp(t, 0.8, 2.2), credits: CREDIT, fade: Math.max(1 - ramp(t, 0, 1.4), ramp(t, 195.6, 197.4)), callouts: [], labels: [] };
    const CO = ui.callouts, LB = ui.labels;
    const co = (a, b, o) => { const k = win(t, a, b, 0.7, 0.6); if (k > 0.001) CO.push({ ...o, a: k, dy: (1 - ramp(t, a, a + 0.8)) * 26 }); };
    const count = (n, a, d = 1.6) => Math.round(n * ss(clamp((t - a) / d))).toLocaleString('en-CA');
    co(11.4, 19.6, { x: 96, y: 610, kicker: 'Subsea fibre cables · TeleGeography', big: count(713, 11.4, 6), sub: 'cable systems carry data between continents', accent: '#6FD6EC' });
    { // international subsea cables by country (film/tools/cable-countries.py, 15 km rule): Canada first, as the narration says it, then the rest in rank order
      const ROWS = [['United States', 85], ['United Kingdom', 55], ['Singapore', 45], ['France', 29], ['Japan', 28], ['India', 21], ['Ireland', 15], ['Canada', 7]];
      const bars = ROWS.map(([label, v], i) => ({ label, v, hl: label === 'Canada', g: label === 'Canada' ? ramp(t, 20.0, 21.2) : ramp(t, 23.6 + i * 0.32, 24.8 + i * 0.32) }));
      co(19.6, 31.4, { panel: true, x: 72, y: 112, kicker: 'International subsea cables · TeleGeography', big: '', sub: 'Cables that land in two or more countries', bars, max: 85, note: 'From the planner\'s TeleGeography layers. Existing and planned cables.', accent: '#6FD6EC' }); }
    co(35.4, 42.6, { x: 1824, y: 150, align: 'right', kicker: 'Critical infrastructure · NRCan CanVec', big: `${count(601, 35.8, 2)} of 718`, size: 96, sub: 'gas processing plants in the layer are in Alberta', note: 'With power lines, pipelines, power plants and transformer stations', accent: '#F7D774' });
    co(44, 52, { x: 1824, y: 150, align: 'right', kicker: 'Cable landing points in Alberta', big: '0', sub: 'Alberta has no coast', accent: '#6FD6EC' });
    co(67.0, 74.6, { x: 1824, y: 150, align: 'right', kicker: 'Corridors', big: count(27903, 67, 1.6), size: 104, sub: 'highway segments, and 1,669 rail lines', accent: '#F6A693' });
    co(77.5, 85.2, { x: 1824, y: 150, align: 'right', kicker: 'Communities and constraints', big: count(3387, 77.5, 1.6), size: 104, sub: 'reserves, land-claim areas and Métis Settlements', note: '689 First Nations and Inuit community points · 978 military sites', accent: '#F6A693' });
    co(88.0, 94.8, { x: 1824, y: 150, align: 'right', kicker: 'Terrain · AAFC', big: count(1020, 88, 1.6), size: 104, sub: 'ecodistricts mapped for permafrost', note: '276 remote communities are off the main power grid', accent: '#C3BBE6' });
    co(96.5, 104.4, { x: 1824, y: 150, align: 'right', kicker: 'Telecommunications · ISED', big: count(14915, 96.5, 1.6), size: 104, sub: 'hexagons where a provider reports fibre', note: '20,939 fixed radio link sites · 661 communities with no fibre backbone nearby', accent: '#B5DE7C' });
    co(107.2, 119.2, { x: 96, y: 150, kicker: 'Southern east-west route', big: `${Math.round(clamp(chaseP(t)) * 7264).toLocaleString('en-CA')} km`, size: 104, sub: 'Victoria to St. John\'s, along the Trans-Canada main line', accent: '#6FB8F0' });
    co(121.2, 128.2, { x: 1824, y: 150, align: 'right', kicker: 'Modeled routes', big: String(2 + Math.round(13 * clamp((t - NS_T0) / (NS_STEP * 12 + 0.8)))), sub: 'two east-west routes and thirteen north-south', note: 'Dashed: subsea, indicative. Dotted: not routed, no road or rail corridor.', accent: '#B5DE7C' });
    co(160.4, 168.2, { x: 1824, y: 150, align: 'right', kicker: 'Coast to coast', big: count(2757, 160.6, 2), size: 104, sub: 'cities, towns and villages', note: '689 First Nations and Inuit community points · 276 remote communities', accent: '#6FD6EC' });

    // labels
    const L = (a, b, id, o) => { const k = win(t, a, b, 0.5, 0.5); if (k > 0.001) LB.push(lab(id, k, o)); };
    L(25, 32, 'vancouver', { side: 'l' }); L(25.3, 32, 'prince-rupert', { side: 'l' }); L(25.6, 32, 'halifax'); L(25.9, 32, 'st-johns'); L(26.2, 32, 'churchill', { kind: 'small' });
    L(36.5, 54, 'edmonton', { kind: 'big' }); L(36.8, 54, 'calgary', { kind: 'big' }); L(37.4, 51, 'cold-lake', { kind: 'small' }); L(37.6, 51, 'lethbridge', { kind: 'small' }); L(37.8, 51, 'peace-river', { kind: 'small' });
    for (const c of CHASE_LABELS) L(c.t - 0.15, Math.max(c.t + 2.6, c.t < 112.5 ? 113.6 : 0), c.id, { kind: c.t < 112 ? 'big' : 'small' });
    L(120.5, 128.6, 'victoria', { side: 'l', kind: 'small' }); L(119.6, 128.6, 'st-johns', { kind: 'small' }); L(120.2, 128.6, 'prince-rupert', { side: 'l', kind: 'small' }); L(122.6, 128.6, 'churchill', { kind: 'small' });
    { const k1 = win(t, 131.2, 151.6, 0.3, 0.6), k2 = win(t, 132.4, 151.6, 0.3, 0.6); if (k1 > 0) LB.push({ ...lab('edmonton', k1), n: t < 140.3 ? 1 : 0 }); if (k2 > 0) LB.push({ ...lab('vancouver', k2, { side: 'l' }), n: t < 140.3 ? 2 : 0 }); }
    L(141.8, 151.6, 'calgary'); L(143.2, 151.6, 'prince-rupert', { side: 'l' });
    [[153.6, 'Fort Simpson', sketchL.coords[0]], [154.7, 'Norman Wells', sketchL.coords[1]], [155.8, 'Inuvik', sketchL.coords[2]]].forEach(([a, text, lonLat], i) => { const k = win(t, a, 160.6, 0.25, 0.6); if (k > 0) LB.push({ lonLat, text, n: i + 1, a: k }); });
    { const k = win(t, 168.9, 184.5, 0.8, 1.2); if (k > 0) LB.push({ lonLat: [-114.6, 55.2], text: 'Alberta', kind: 'big none', a: k }); }

    // waypoint pads on the map (plan scene)
    if (t >= 131.2 && t < 151.5) { s.waypoints.push(ll('edmonton')); if (t >= 132.4) s.waypoints.push(ll('vancouver')); if (t >= 141.8) s.waypoints.push(ll('calgary')); if (t >= 143.2) s.waypoints.push(ll('prince-rupert')); }

    // ---- title and end cards
    { const k = win(t, 56.6, 63.5, 1.6, 0.9); if (k > 0.001) ui.card = { kind: 'title', a: k, traces: ramp(t, 56.8, 59.2), dy: (1 - ramp(t, 57.4, 59.2)) * 30, kicker: 'Agency 2026 · Demo 11', lines: ['Pan-Canadian', 'Fibre Optics Planner'], sub: 'A map and route solver for planning a fibre network across Canada.' }; }
    { const k = ramp(t, T.end, T.end + 2); if (k > 0.001) ui.card = { kind: 'end', a: k, traces: ramp(t, T.end + 0.3, T.end + 2.6), dates: 'Dec. 7–9, 2026 · Edmonton · Calgary', kicker: 'Demo 11', title: 'Pan-Canadian Fibre Optics Planner',
      sources: ['Data: Natural Resources Canada, ISED, AAFC, Indigenous Services Canada, Transport Canada, Government of Alberta (Open Government Licence – Canada, Alberta)', 'Submarine cable data © TeleGeography (submarinecablemap.com), CC BY-NC-SA 3.0 (unconfirmed). Simplified for display. · © OpenStreetMap contributors (ODbL)', 'Imagery: NASA Blue Marble and Black Marble · Terrain: Mapzen terrain tiles · Routes run on the planner\'s interim sample network. Cost figures are indicative.'] };
      if (k > 0.5) ui.credits = ''; }

    // ---- the planner panel
    const pa = Math.max(win(t, 63.6, 106.2, 1.0, 1.4), win(t, 120.3, 160.2, 1.0, 1.0));
    s.pad = 520 * pa;
    if (pa > 0.001) {
      const inK = t < 110 ? ramp(t, 63.6, 64.6) : ramp(t, 120.3, 121.3);
      const p = ui.panel = { a: pa, dx: (1 - inK) * -46 };
      const cur = (stops) => { // stops: [[time, target], ...] the cursor reaches each target at its time and presses there
        let i = 0; while (i < stops.length - 1 && t > stops[i + 1][0]) i++; const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
        const move = Math.min(0.75, (b[0] - a[0]) * 0.8), k = t <= a[0] ? 1 : ss(clamp((t - (b[0] - move)) / move));
        const press = stops.some(sp => t >= sp[0] - 0.02 && t < sp[0] + 0.14 && sp[2] !== false);
        ui.cursor = { from: t <= a[0] ? a[1] : a[1], to: t <= a[0] ? a[1] : b[1], k, press, a: 1 }; };
      if (t < 110) { p.tab = 'Layers'; p.on = { boundaries: 1 }; p.pulse = {};
        for (const [id, a, b] of LAYER_TICKS) { if (t >= a && t < b) p.on[id] = 1; p.pulse[id] = bump(t, a); }
        const stops = [[64.6, 'layer:boundaries', false], ...LAYER_TICKS.map(([id, a]) => [a, 'layer:' + id])]; cur(stops);
        // keep the row being ticked in view
        const seq = [[65.2, 'layer:roads'], [76.3, 'layer:indigenous_lands'], [86.8, 'layer:permafrost'], [95.4, 'layer:broadband_fibre']];
        let si = -1; seq.forEach(([ts], n) => { if (t >= ts) si = n; });
        p.scroll = si < 0 ? 0 : { from: si > 0 ? seq[si - 1][1] : null, to: seq[si][1], k: ramp(t, seq[si][0], seq[si][0] + 1.1) };
      } else if (t < 129.4) { p.tab = 'Routes'; p.on = { 'ew-south': 1 }; p.pulse = {}; if (t > 119.8) p.on['ew-north'] = 1;
        NS.forEach((id, i) => { const a = NS_T0 + i * NS_STEP; if (t >= a) p.on[id] = 1; p.pulse[id] = bump(t, a, 0.9); });
        cur([[121.4, 'route:ew-north', false], ...NS.map((id, i) => [NS_T0 + i * NS_STEP, 'route:' + id]), [129.4, 'tab:Plan']]);
        p.scroll = { from: null, to: 'route:ns-yt', k: ramp(t, 123.6, 126.4) };
      } else if (t < 140.3) { p.tab = 'Plan'; p.name = 'Edmonton to Vancouver'; p.from = 'Blank: my own waypoints'; p.adding = t > 130.5 && t < 132.6;
        p.waypoints = t < 131.2 ? [] : t < 132.4 ? ['Edmonton'] : ['Edmonton', 'Vancouver'];
        p.stage = t < 135.1 ? 'idle' : t < 138.4 ? 'solving' : 'result'; p.progress = clamp((t - 135.2) / 3); p.settled = Math.round(p.progress * traceN[PLAN.y]); p.press = t >= 135.09 && t < 135.3; p.result = { metrics: pm(PLAN.y) };
        cur([[129.4, 'tab:Plan'], [130.5, 'btn:AddPoints'], [131.2, `map:${ll('edmonton')}`], [132.4, `map:${ll('vancouver')}`], [135.09, 'btn:Solve'], [140.3, 'tab:Compare']]);
      } else if (t < 150.9) { p.tab = 'Compare'; p.checked = t < 140.75 ? 0 : t < 141.0 ? 1 : t < 141.25 ? 2 : 3; p.press = t >= 141.55 && t < 141.75;
        p.rows = [{ name: 'Calgary to Vancouver', short: 'Calgary to Vancouver', color: '#E86BA5', m: pm(PLAN.s) }, { name: 'Edmonton to Vancouver', short: 'Edmonton to Vancouver', color: '#00AAD2', m: pm(PLAN.y) }, { name: 'Edmonton to Prince Rupert', short: 'Edmonton to Prince Rupert', color: '#F2C230', m: pm(PLAN.n) }];
        p.show = t < 141.9 ? null : [ramp(t, 143.7, 144.2), ramp(t, 142.0, 142.5), ramp(t, 145.5, 146.0)];
        cur([[140.3, 'tab:Compare'], [140.75, 'cmp:0'], [141.0, 'cmp:1'], [141.25, 'cmp:2'], [141.55, 'btn:Compare'], [150.9, 'tab:Draw lines']]);
      } else { p.tab = 'Draw lines'; p.press = t >= 152.6 && t < 152.8;
        if (t >= 153.6) p.line = { name: 'Mackenzie Valley line', method: 'Buried' }; if (t >= 156.3) p.est = estLine; p.showCost = t >= 157.3 ? 1 : 0;
        cur([[150.9, 'tab:Draw lines'], [152.6, 'btn:NewLine'], [153.6, `map:${sketchL.coords[0]}`], [154.7, `map:${sketchL.coords[1]}`], [155.8, `map:${sketchL.coords[2]}`], [157.6, 'pt:330,760', false]]);
      }
      if (ui.cursor) ui.cursor.a = pa * (t < 110 ? ramp(t, 64.6, 65.2) : 1);
    }

    // ---- words: captions, and the owner's first closing sentence as a statement
    const cap = CAPS.find(c => t >= c.s && t < c.e); if (cap) ui.caption = { text: cap.text, a: Math.min(ramp(t, cap.s, cap.s + 0.18), 1 - ramp(t, cap.e - 0.15, cap.e)) || 0.001 };
    { const t0 = VO.n17, k = win(t, t0 - 0.1, 173.7, 0.3, 0.7); if (k > 0.001) ui.statement = { a: k, dy: 0, words: timing.n17.words.map(w => ({ w: w.w, a: 0.12 + 0.88 * ramp(t, t0 + w.s - 0.1, t0 + w.s + 0.25) })) }; }
    return s;
  }
  return { stateAt, CAPS };
}
