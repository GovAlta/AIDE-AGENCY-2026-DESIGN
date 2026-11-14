// Timeline helpers. Everything here is a pure function: the same input always gives the same output.
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
/** smoothstep 0..1 */
export const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
/** 0 -> 1 between seconds a and b, eased */
export const ramp = (t, a, b) => ss((t - a) / (b - a));
/** on between a and b with fade-in fi and fade-out fo (seconds) */
export const win = (t, a, b, fi = 0.6, fo = 0.6) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));
/** eased envelope through [t, value] keys */
export const env = (t, pts) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], ss((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]))); return pts[pts.length - 1][1]; };
/** a highlight that decays over d seconds after t0 (row pulse, button flash) */
export const bump = (t, t0, d = 1.3) => (t < t0 || t > t0 + d ? 0 : 1 - ss((t - t0) / d));
export const outBack = x => { x = clamp(x); const c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
/** count up a number between a and a+d seconds, formatted for en-CA */
export const count = (t, n, a, d = 1.6) => Math.round(n * ss(clamp((t - a) / d))).toLocaleString('en-CA');

/** monotone cubic interpolation through [t, v] keys: smooth, continuous, never overshoots (use for every camera key) */
export function mono(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]), d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return x => { if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1]; let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1]; };
}
/** hold each camera key until a quick move into the next (no slow push or zoom creep): keys [[t, ...], ...] -> keys with holds */
export function holdKeys(keys, move = 0.4) {
  const out = [];
  keys.forEach((k, i) => { out.push(k); const nx = keys[i + 1]; if (nx && nx[0] - k[0] > move + 0.05) out.push([nx[0] - move, ...k.slice(1)]); });
  return out;
}
/** a multi-channel camera track: keys [[t, a, b, c, ...], ...] -> t => [a, b, c, ...] (missing channels are 0) */
export function track(keys, channels = keys.reduce((m, k) => Math.max(m, k.length - 1), 0)) {
  const f = Array.from({ length: channels }, (_, c) => mono(keys.map(k => [k[0], k[c + 1] ?? 0])));
  return t => f.map(g => g(t));
}
/**
 * Time-smoothed path. Never point a camera straight at something that moves irregularly (a route head through switchbacks,
 * a cursor): sample it every frame with fn(t) -> [channels], then Gaussian-smooth each channel in time (centred, so no lag).
 * angleChannels: indices to unwrap before smoothing (headings in degrees).
 */
export function smoothPath(fn, t0, t1, { hz = 60, sigma = 0.9, sigmas = null, angleChannels = [] } = {}) {
  const n = Math.round((t1 - t0) * hz) + 1, raw = [];
  for (let k = 0; k < n; k++) raw.push(fn(t0 + k / hz).slice());
  const C = raw[0].length;
  for (const c of angleChannels) for (let k = 1; k < n; k++) { let v = raw[k][c]; const p = raw[k - 1][c]; while (v - p > 180) v -= 360; while (v - p < -180) v += 360; raw[k][c] = v; }
  const out = Array.from({ length: C }, (_, c) => { const sg = (sigmas && sigmas[c]) || sigma, r = Math.ceil(3 * sg * hz), w = [];
    for (let d = -r; d <= r; d++) w.push(Math.exp(-0.5 * (d / (sg * hz)) ** 2));
    const o = new Float64Array(n); for (let k = 0; k < n; k++) { let a = 0, ws = 0; for (let d = -r; d <= r; d++) { const m = k + d; if (m < 0 || m >= n) continue; a += raw[m][c] * w[d + r]; ws += w[d + r]; } o[k] = a / ws; } return o; });
  return t => { const x = clamp((t - t0) * hz, 0, n - 1), k = Math.floor(x), f = x - k; return out.map(o => (k >= n - 1 ? o[n - 1] : o[k] + (o[k + 1] - o[k]) * f)); };
}
/** captions from narration word timings: { id: startSeconds } + timing.json -> [{ s, e, text }] in short phrases */
export function captionsFrom(VO, timing, { skip = [], maxLen = 62, breakAt = 46 } = {}) {
  const CAPS = [];
  for (const [id, t0] of Object.entries(VO)) { if (skip.includes(id) || !timing[id]) continue; let cur = [];
    const flush = () => { if (cur.length) { CAPS.push({ s: t0 + cur[0].s - 0.12, e: t0 + cur[cur.length - 1].e + 0.25, text: cur.map(w => w.w).join(' ') }); cur = []; } };
    for (const w of timing[id].words) { cur.push(w); const len = cur.map(x => x.w).join(' ').length; if (/[.?!]$/.test(w.w) || (len > breakAt && /,$/.test(w.w)) || len > maxLen) flush(); }
    flush(); }
  CAPS.sort((a, b) => a.s - b.s);
  for (let i = 0; i < CAPS.length - 1; i++) if (CAPS[i + 1].s - CAPS[i].e < 0.5) CAPS[i].e = CAPS[i + 1].s;
  return CAPS;
}
export const captionAt = (CAPS, t) => { const c = CAPS.find(c => t >= c.s && t < c.e); return c ? { text: c.text, a: Math.max(0.001, Math.min(ramp(t, c.s, c.s + 0.18), 1 - ramp(t, c.e - 0.15, c.e))) } : null; };
/** the cursor travels between named targets; stops = [[time, target, press?], ...]; press defaults to true */
export function cursorAt(t, stops) {
  let i = 0; while (i < stops.length - 1 && t > stops[i + 1][0]) i++;
  const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
  const move = Math.min(0.75, (b[0] - a[0]) * 0.8), k = t <= a[0] ? 1 : ss(clamp((t - (b[0] - move)) / move));
  const press = stops.some(sp => t >= sp[0] - 0.02 && t < sp[0] + 0.14 && sp[2] !== false);
  return { from: a[1], to: t <= a[0] ? a[1] : b[1], k, press, a: 1 };
}
/** deterministic random numbers */
export const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
