// Display model: a spec (panel or kiosk, any unit) -> faces in inches with their clear zones and the header lockup geometry.
// Everything downstream (designs, SVG, PDF, layout drawings, 3D renders) reads this, so a size change flows everywhere.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand/tokens/tokens.json'), 'utf8'));

const PER_IN = { in: 1, ft: 12, mm: 1 / 25.4, cm: 1 / 2.54 };
export const toIn = (v, unit = 'in') => (v == null ? v : +v * PER_IN[unit]);

export const PRESETS = {
  'panel-24x60': { kind: 'panel', width: 24, height: 60 },
  'panel-30x72': { kind: 'panel', width: 30, height: 72 },
  'panel-30x84': { kind: 'panel', width: 30, height: 84 },
  'kiosk-30x30x72': { kind: 'kiosk', width: 30, depth: 30, height: 72 },
  'kiosk-30x30x84': { kind: 'kiosk', width: 30, depth: 30, height: 84 },
};
export const VARIANTS = ['rise', 'rails', 'wrap', 'spectrum', 'night', 'converge'];

// text metrics and outlines come from fontTools (displays/lib/outline.py); one call per face batch
export function outlineBatch(reqs) {
  const out = execFileSync('python3', [path.join(ROOT, 'displays/lib/outline.py')], { input: JSON.stringify(reqs), maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out.toString());
}
const FONT = { inter: { word: 'inter-extrabold', sub: 'inter-semibold', title: 'inter-bold' }, liberation: { word: 'liberation-bold', sub: 'liberation-bold', title: 'liberation-bold' } };

// resolve(spec) -> { ...spec in inches, faces: [{ name, W, H, x0 (offset on the unrolled strip), zones: [{id, rect:[x0,y0,x1,y1]}], lockup, monitor?, ledge? }] }
export function resolve(raw) {
  const s = { ...(PRESETS[raw.preset] || {}), ...raw };
  const u = s.unit || 'in';
  const kind = s.kind || 'panel';
  const W = toIn(s.width ?? 30, u), H = toIn(s.height ?? 72, u), D = toIn(s.depth ?? (kind === 'kiosk' ? 30 : 0), u);
  const m = toIn(s.margin ?? 1.5, u), bleed = toIn(s.bleed ?? 0.125, u);
  const font = FONT[s.font || 'inter'] ? s.font || 'inter' : 'inter';
  const variant = s.variant || 'rise';
  const ground = variant === 'night' ? (s.ground === 'navy' ? 'navy' : 'night') : s.ground || 'board';
  const wordmark = s.wordmark === 'Agency 2026' ? 'Agency 2026' : 'Agency';      // never the date
  const r = { ...s, kind, unit: 'in', W, H, D, m, bleed, font, variant, ground, wordmark, seed: String(s.seed ?? `${kind}-${W}x${H}`) };

  const names = kind === 'kiosk' ? ['front', 'right', 'back', 'left'] : ['front'];
  let x0 = 0;
  r.faces = names.map((name, index) => {
    const fw = kind === 'kiosk' && (name === 'right' || name === 'left') ? D : W;
    const fopt = (s.faces && s.faces[name]) || {};
    const face = { name, index, W: fw, H, x0, lockup: fopt.lockup !== false, zones: [] };
    x0 += fw;
    // monitor window: the front of a kiosk (or a panel, when the spec asks for one). 16:9, fitted inside the margins.
    const mon = name === 'front' && (kind === 'kiosk' ? s.monitor !== false : !!s.monitor) ? { ...(s.monitor || {}) } : null;
    if (mon) {
      const maxW = fw - 2 * m;
      let mw = toIn(mon.w ?? 37.5, u);
      if (mw > maxW) mw = maxW;                                        // a 43-inch screen (37.5 in) does not fit a 30 in face: fit the margins
      const mh = toIn(mon.h ?? mw * 9 / 16, u), bottom = toIn(mon.bottom ?? 46, u), cx = toIn(mon.centerX ?? fw / 2, u);
      face.monitor = { x: cx - mw / 2, y: H - bottom - mh, w: mw, h: mh, bottom, diagonal: +(Math.hypot(mw, mh)).toFixed(1) };
      const c = toIn(mon.clear ?? 0.75, u);
      face.zones.push({ id: 'monitor', rect: [face.monitor.x - c, face.monitor.y - c, face.monitor.x + mw + c, face.monitor.y + mh + c] });
    }
    const led = name === 'front' && kind === 'kiosk' && s.ledge !== false ? { ...(s.ledge || {}) } : null;
    if (led) {
      const lh = toIn(led.height ?? 38, u), th = toIn(led.thickness ?? 1.5, u), dp = toIn(led.depth ?? 12, u);
      face.ledge = { y: H - lh, thickness: th, depth: dp, height: lh };
    }
    return face;
  });
  r.stripW = x0;

  // ---- header lockup: "Agency" across the top left, the Alberta logo top right with "Technology and Innovation" beneath ----
  const F = FONT[font];
  const words = wordmark === 'Agency 2026' ? ['Agency', '2026'] : ['Agency'];
  // Header (owner review 2026-11-11): row 1 is "Agency" and the Alberta logo at the same height, side by side, centred as one group across
  // the panel; the trace underline sits under "Agency". Row 2 is "Technology and Innovation" on one line, centred, the full content width.
  const SUB = 'Technology and Innovation';
  const unit1 = outlineBatch([...words.map((t) => ({ text: t, font: F.word, size: 1, tracking: -0.01 })), { text: SUB, font: F.sub, size: 1 }]);
  // The Alberta logo (viewBox 216 x 61): the top of the script "A" is at y 2 and the script baseline (bottom of the blue square) at 50.6.
  const LOGO_TOP = 2 / 61, LOGO_BASE = 50.6 / 61;
  for (const face of r.faces) {
    if (!face.lockup) continue;
    const CW = face.W - 2 * m;
    const wordRatio = words.reduce((a, _, i) => a + unit1[i].width, 0) + (words.length > 1 ? 0.12 : 0);
    const capRatio = unit1[0].cap;
    const logoPerS = capRatio / (LOGO_BASE - LOGO_TOP) * 216 / 61;      // logo width per unit of S when its script spans the cap height
    const gutterPerS = 0.75 * capRatio;
    const rowW = CW * (s.headerWidth ?? 1);                               // row 1 spans this width (default: the full content width)
    const S = Math.min(rowW / (wordRatio + gutterPerS + logoPerS), (H * 0.075) / capRatio);
    const cap = capRatio * S, top = m + 0.2, baseline = top + cap;
    const lh = cap / (LOGO_BASE - LOGO_TOP), lw = lh * 216 / 61;
    const groupW = (wordRatio + gutterPerS) * S + lw, x0 = m + (CW - groupW) / 2;
    const row2 = baseline + 0.27 * S;                                     // the underline: clears the descenders of "g" and "y"
    // row 2: one line, centred, as wide as row 1 (owner: "full width of the panel"), never below the readable cap height
    const capMin = toIn(s.subCapHeight ?? 0.75, u);
    let ts = Math.min(groupW / unit1[words.length].width, (0.62 * cap) / capRatio);
    ts = Math.max(ts, capMin / capRatio);
    const tcap = capRatio * ts, subW = unit1[words.length].width * ts;
    const subBase = row2 + 0.24 * S + 0.45 * cap + tcap;
    const lock = {
      S, x: x0, baseline, words, wordW: wordRatio * S,
      rule: { x: x0, y: row2, w: wordRatio * S, h: 0.045 * S },
      logo: { x: x0 + groupW - lw, y: baseline - LOGO_BASE * lh, w: lw, h: lh },
      sub: { size: ts, cap: tcap, lines: [SUB], x: m + (CW - subW) / 2, baselines: [subBase], width: subW },
    };
    lock.bottom = subBase + 0.24 * ts;
    face.lockup = lock;
    face.zones.push({ id: 'header', rect: [-bleed - 1, -bleed - 1, face.W + bleed + 1, lock.bottom + 0.6 * cap] });
  }
  // optional title (session / demo) under the header and QR block; both are clear zones for the art
  for (const face of r.faces) {
    const t = s.title && (s.title.face || 'front') === face.name ? s.title : null;
    if (t) {
      const y0 = (face.lockup ? face.lockup.bottom : m) + 1.6, tsz = toIn(t.size ?? Math.min(2.2, face.W * 0.075), u);
      face.title = { kicker: t.kicker || '', text: t.text, size: tsz, x: m, y: y0, w: face.W - 2 * m };
      face.zones.push({ id: 'title', rect: [m - 0.6, y0 - 0.6, face.W - m + 0.6, y0 + tsz * 2.6 + 1.2] });
    }
    const q = s.qr && (s.qr.face || (kind === 'kiosk' ? 'right' : 'front')) === face.name ? s.qr : null;
    if (q) {
      const qs = toIn(q.size ?? Math.min(8, face.W * 0.3), u);
      const qy = toIn(q.bottom ?? (kind === 'kiosk' ? 30 : 18), u);
      face.qr = { url: q.url, label: q.label || '', size: qs, x: (face.W - qs) / 2, y: H - qy - qs };
      face.zones.push({ id: 'qr', rect: [face.qr.x - 1.4, face.qr.y - 1.4, face.qr.x + qs + 1.4, face.qr.y + qs + (q.label ? 2.6 : 1.4)] });
    }
  }
  return r;
}

// a face's zones moved onto the unrolled strip (for designs that run around the corners)
export const stripZones = (r) => r.faces.flatMap((f) => f.zones.map((z) => ({ ...z, face: f.name, rect: [z.rect[0] + f.x0, z.rect[1], z.rect[2] + f.x0, z.rect[3]] })));
