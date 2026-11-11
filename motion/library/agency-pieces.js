(function(){
let React = window.React, h = (...a) => React.createElement(...a);
let U = 1, UN = 'cqw';
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const seg = (t, a, b) => cl((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3);
const eo5 = x => 1 - Math.pow(1 - x, 5);
const ei = x => x * x * x;
const back = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const NAVY = '#002C4E', RED = '#9E2B33';
const FONT = '"Liberation Sans",Arial,Helvetica,sans-serif';
const MONO = '"Liberation Mono",Menlo,Consolas,monospace';
const ACC = ['#0077CD', '#EF4B8B', '#ED8C00', '#FFC836', '#78BF26', '#730067', '#00B6ED'];
const LEFTC = ['#730067', '#0077CD', '#EF4B8B', '#00B6ED', '#9E7BB5'];
const RIGHTC = ['#ED8C00', '#FFC836', '#78BF26', '#EF4B8B', '#F2B45A'];
const IMG = {
  title: 'assets/pptx/TITLE-image-2.png',
  day: ['assets/pptx/SECTION_DAY1-image-2.png', 'assets/pptx/SECTION_DAY2-image-2.png', 'assets/pptx/SECTION_DAY3-image-2.png'],
  key: 'assets/agency-key-art.png',
  logo: 'assets/pptx/image-1005-1.png',
};
const DAYS = [
  { d: 'Monday, December 7', t: 'The Art of the Possible', s: 'A Showcase for Government', v: 'Edmonton Convention Centre', c: '#0077CD' },
  { d: 'Tuesday, December 8', t: 'Research & the Future AI Economy', s: 'A Closed Policy Roundtable', v: 'Edmonton · By invitation', c: '#730067' },
  { d: 'Wednesday, December 9', t: 'Alberta Velocity: Full Speed Ahead', s: 'An Open Industry Day', v: 'Platform Calgary', c: '#ED8C00' },
];

const A = (style, ...kids) => h('div', { style: { position: 'absolute', ...style } }, ...kids);
const frame = (bg, ...kids) => h('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', background: bg, containerType: 'size', fontFamily: FONT, color: NAVY } }, ...kids);
const cover = (src, style) => h('img', { src, alt: '', draggable: false, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style } });

function mkTraces(W, H, side, n, o) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0.5 : i / (n - 1);
    const v0 = o.v0 + (o.v1 - o.v0) * f;
    const r = ((i * 7919 + o.seed) % 97) / 97;
    const reach = o.reach * (0.6 + 0.4 * r);
    const b = (i % 3 === 0 ? -1 : i % 3 === 1 ? 1 : 0) * o.bend * (0.5 + r * 0.5);
    const k = reach * (0.35 + 0.2 * r);
    const raw = [[-3, v0], [k, v0], [k + Math.abs(b), v0 + b], [reach, v0 + b]];
    const map = ([u, v]) => side === 'l' ? [u, v] : side === 'r' ? [W - u, v] : side === 't' ? [v, u] : [v, H - u];
    const wide = i % 4 === 2;
    list.push({ pts: raw.map(map).map(q => q[0].toFixed(2) + ',' + q[1].toFixed(2)).join(' '), end: map(raw[3]), color: o.colors[i % o.colors.length], w: o.thin, r: o.node });
  }
  return list;
}
function drawTraces(W, H, list, prog, o = {}) {
  return h('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: o.opacity ?? 1 } },
    list.map((tr, i) => {
      const p = prog(i); if (p <= 0) return null;
      const nr = tr.r * back(cl((p - 1) / 0.35));
      return h('g', { key: i },
        h('polyline', { points: tr.pts, fill: 'none', stroke: tr.color, strokeWidth: tr.w, pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - eo(cl(p)) }),
        o.flow != null ? h('polyline', { points: tr.pts, fill: 'none', stroke: '#FFFFFF', strokeWidth: tr.w * 1.4, pathLength: 1, strokeDasharray: '0.06 0.94', strokeDashoffset: -((o.flow * 0.3 + i * 0.137) % 1) }) : null,
        nr > 0 ? h('circle', { cx: tr.end[0], cy: tr.end[1], r: nr, fill: o.nodeFill || '#FFFFFF', stroke: tr.color, strokeWidth: tr.w * 0.9 }) : null);
    }));
}
const TR = {
  openL: mkTraces(160, 90, 'l', 9, { v0: 12, v1: 78, reach: 50, bend: 7, colors: LEFTC, wide: 2.6, thin: 0.6, node: 1.1, seed: 3 }),
  openR: mkTraces(160, 90, 'r', 9, { v0: 12, v1: 78, reach: 50, bend: 7, colors: RIGHTC, wide: 2.6, thin: 0.6, node: 1.1, seed: 11 }),
  cdL: mkTraces(160, 90, 'l', 8, { v0: 8, v1: 82, reach: 36, bend: 6, colors: LEFTC, wide: 2, thin: 0.5, node: 0.9, seed: 5 }),
  cdR: mkTraces(160, 90, 'r', 8, { v0: 8, v1: 82, reach: 36, bend: 6, colors: RIGHTC, wide: 2, thin: 0.5, node: 0.9, seed: 17 }),
  vT: mkTraces(90, 160, 't', 10, { v0: 6, v1: 84, reach: 36, bend: 6, colors: [...LEFTC, ...RIGHTC], wide: 3, thin: 0.7, node: 1.3, seed: 7 }),
  vB: mkTraces(90, 160, 'b', 10, { v0: 6, v1: 84, reach: 30, bend: 6, colors: [...RIGHTC, ...LEFTC], wide: 3, thin: 0.7, node: 1.3, seed: 23 }),
};

function pOpening(t) {
  const img = seg(t, 1.0, 1.8), out = seg(t, 7.3, 7.9);
  const tp = i => (t - 0.05 - (i % 9) * 0.06) / 0.5;
  return frame('#FFFFFF',
    A({ inset: 0, opacity: eo(img), transform: `scale(${1.06 - 0.06 * eo(img)})` }, cover(IMG.title)),
    A({ inset: 0, opacity: 1 - seg(t, 1.2, 2.0) }, drawTraces(160, 90, TR.openL, tp), drawTraces(160, 90, TR.openR, i => tp(i + 4))),
    A({ inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
      h('div', { style: { display: 'flex', fontSize: `${12.5*U}${UN}`, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' } },
        'Agency'.split('').map((ch, i) => { const p = seg(t, 1.05 + i * 0.045, 1.4 + i * 0.045); return h('span', { key: i, style: { display: 'inline-block', opacity: cl(p * 3), transform: `translateY(${(1 - back(p)) * 0.35}em)` } }, ch); })),
      h('div', { style: { overflow: 'hidden', lineHeight: 1 } }, h('div', { style: { fontSize: `${12.5*U}${UN}`, fontWeight: 700, letterSpacing: '-0.02em', transform: `translateY(${(1 - eo5(seg(t, 1.55, 1.95))) * 105}%)` } }, '2026')),
      h('div', { style: { fontSize: `${3.6*U}${UN}`, fontWeight: 700, color: RED, marginTop: `${1.6*U}${UN}`, clipPath: `inset(0 ${100 - 100 * eo(seg(t, 2.15, 2.55))}% 0 0)` } }, 'Dec. 7–9, 2026'),
      h('div', { style: { fontSize: `${3.4*U}${UN}`, fontWeight: 700, marginTop: `${0.6*U}${UN}`, opacity: seg(t, 2.45, 2.8), transform: `translateY(${(1 - eo(seg(t, 2.45, 2.8))) * 0.6}em)` } }, 'Edmonton · Calgary')),
    A({ inset: 0, background: '#FFFFFF', opacity: ei(out) }));
}

function pBumper(t) {
  const di = Math.floor(t / 3) % 3, d = DAYS[di], lt = t % 3;
  const wIn = eo5(seg(lt, 0, 0.32)), wOut = eo5(seg(lt, 0.32, 0.66));
  const barX = lt >= 0.32 ? 100 * wOut : -100 + 100 * wIn;
  const imgI = lt < 0.32 ? (di + 2) % 3 : di;
  const ex = ei(seg(lt, 2.55, 2.95));
  const st = a => { const p = eo(seg(lt, a, a + 0.35)); return { opacity: p * (1 - ex), transform: `translateX(${((1 - p) * 4 - ex * 6)*U}${UN})` }; };
  return frame('#FFFFFF',
    A({ inset: 0 }, cover(IMG.day[imgI], { transform: `scale(${1.03 - 0.03 * eo(seg(lt, 0.3, 2.9))})` })),
    A({ left: '24%', right: '24%', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: `${1.4*U}${UN}` },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: `${1.2*U}${UN}`, fontSize: `${2.3*U}${UN}`, fontWeight: 700, color: RED, ...st(0.5) } }, h('span', { style: { width: `${1.6*U}${UN}`, height: `${1.6*U}${UN}`, background: d.c, flex: 'none' } }), `Day ${di + 1} · ${d.d}`),
      h('div', { style: { fontSize: `${5.8*U}${UN}`, fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.02em', textWrap: 'balance', ...st(0.6) } }, d.t),
      h('div', { style: { fontSize: `${2.6*U}${UN}`, ...st(0.75) } }, d.s),
      h('div', { style: { fontSize: `${2*U}${UN}`, fontWeight: 700, color: '#3D4F63', ...st(0.85) } }, d.v)),
    A({ inset: 0, background: d.c, transform: `translateX(${barX}%)` }));
}

function pLower(t) {
  const line = eo5(seg(t, 0.1, 0.5)) * (1 - ei(seg(t, 4.8, 5.2)));
  const plate = eo5(seg(t, 0.35, 0.7)) * (1 - ei(seg(t, 4.6, 5.0)));
  const fadeOut = 1 - ei(seg(t, 4.45, 4.75));
  const nm = eo(seg(t, 0.5, 0.85)) * fadeOut, rl = eo(seg(t, 0.62, 0.95)) * fadeOut, tag = eo5(seg(t, 0.55, 0.8)) * fadeOut;
  // window.AGENCY_ALPHA (set by scripts/motion-render.mjs for the ProRes 4444 pass): no preview checker or label, a transparent ground
  const alpha = typeof window !== 'undefined' && window.AGENCY_ALPHA;
  return frame(alpha ? 'transparent' : `repeating-conic-gradient(#22344A 0 25%, #1A2B3E 0 50%) 0 0 / ${3*U}${UN} ${3*U}${UN}`,
    alpha ? null : A({ top: `${3*U}${UN}`, right: `${3.5*U}${UN}`, fontFamily: MONO, fontSize: `${1.4*U}${UN}`, color: '#9FB0C3', letterSpacing: '0.1em' }, 'ALPHA · OVER LIVE FEED'),
    A({ left: `${6*U}${UN}`, bottom: `${10*U}${UN}`, width: `${50*U}${UN}`, height: `${11*U}${UN}` },
      A({ left: 0, top: `-${3.2*U}${UN}`, height: `${3.2*U}${UN}`, padding: `0 ${1.4*U}${UN}`, display: 'flex', alignItems: 'center', background: NAVY, color: '#FFFFFF', fontSize: `${1.4*U}${UN}`, fontWeight: 700, letterSpacing: '0.12em', whiteSpace: 'nowrap', clipPath: `inset(0 ${100 - 100 * tag}% 0 0)` }, 'AGENCY 2026'),
      A({ left: 0, top: 0, width: `${(44 * plate)*U}${UN}`, height: `${11*U}${UN}`, background: '#FFFFFF', overflow: 'hidden' },
        A({ left: `${2.6*U}${UN}`, top: `${2*U}${UN}`, whiteSpace: 'nowrap', fontSize: `${3.4*U}${UN}`, fontWeight: 700, color: NAVY, opacity: nm, transform: `translateX(${((1 - nm) * -3)*U}${UN})` }, 'Speaker Name'),
        A({ left: `${2.6*U}${UN}`, top: `${6.6*U}${UN}`, whiteSpace: 'nowrap', fontSize: `${1.9*U}${UN}`, color: '#3D4F63', opacity: rl, transform: `translateX(${((1 - rl) * -3)*U}${UN})` }, 'Title · Ministry or organization')),
      A({ left: 0, top: `${11*U}${UN}`, height: `${0.7*U}${UN}`, width: `${(50 * line)*U}${UN}`, background: 'linear-gradient(90deg,#730067,#0077CD 55%,#00B6ED)' }),
      line > 0.02 ? A({ left: `${(50 * line - 0.9)*U}${UN}`, top: `${10.45*U}${UN}`, width: `${1.8*U}${UN}`, height: `${1.8*U}${UN}`, borderRadius: '50%', background: '#FFFFFF', border: `${0.4*U}${UN} solid #00B6ED`, boxSizing: 'border-box' }) : null));
}

function pCount(t) {
  const rem = Math.max(0, 300 - t), s = Math.ceil(rem - 1e-6);
  const mm = Math.floor(s / 60), ss = s % 60, tick = eo(cl((t % 1) / 0.22));
  return frame(NAVY,
    drawTraces(160, 90, TR.cdL, () => 1.4, { opacity: 0.55, flow: t, nodeFill: NAVY }),
    drawTraces(160, 90, TR.cdR, () => 1.4, { opacity: 0.55, flow: t + 0.5, nodeFill: NAVY }),
    A({ inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' },
      h('div', { style: { fontSize: `${1.9*U}${UN}`, fontWeight: 700, letterSpacing: '0.2em' } }, 'NEXT SESSION BEGINS IN'),
      h('div', { style: { display: 'flex', fontSize: `${17*U}${UN}`, fontWeight: 700, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' } },
        h('span', null, `${mm}:`),
        h('span', { style: { display: 'inline-block', opacity: 0.25 + 0.75 * tick, transform: `translateY(${(1 - tick) * -0.12}em)` } }, String(ss).padStart(2, '0'))),
      h('div', { style: { fontSize: `${3*U}${UN}`, fontWeight: 700, color: '#FFC836', marginTop: `${0.8*U}${UN}` } }, 'The Art of the Possible'),
      h('div', { style: { fontSize: `${1.9*U}${UN}`, color: '#D0D1DB', marginTop: `${0.8*U}${UN}` } }, 'Edmonton Convention Centre')),
    A({ left: 0, bottom: 0, height: `${0.6*U}${UN}`, width: `${rem / 3}%`, background: 'linear-gradient(90deg,#00B6ED,#EF4B8B,#ED8C00,#FFC836)' }));
}

function pStat(t) {
  const out = ei(seg(t, 5.9, 6.5));
  const n = Math.round(40 * eo(seg(t, 0.3, 1.7)));
  const tx = p => ({ opacity: p * (1 - out), transform: `translateY(${((1 - p) * 2)*U}${UN})` });
  const sq = [];
  for (let i = 0; i < 40; i++) {
    const p = seg(t, 0.3 + i * 0.033, 0.55 + i * 0.033), q = seg(t, 5.8 + (39 - i) * 0.012, 6.05 + (39 - i) * 0.012);
    sq.push(h('div', { key: i, style: { width: `${3.2*U}${UN}`, height: `${3.2*U}${UN}`, background: ACC[(i * 3) % 7], transform: `scale(${back(p) * (1 - ei(q))})` } }));
  }
  return frame('#FFFFFF',
    A({ left: `${8*U}${UN}`, top: 0, bottom: 0, width: `${44*U}${UN}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
      h('div', { style: { fontSize: `${24*U}${UN}`, fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', opacity: 1 - out } }, String(n)),
      h('div', { style: { fontSize: `${4.4*U}${UN}`, fontWeight: 700, marginTop: `${1.6*U}${UN}`, ...tx(eo(seg(t, 1.2, 1.6))) } }, 'working demos'),
      h('div', { style: { fontSize: `${2.2*U}${UN}`, color: RED, fontWeight: 700, marginTop: `${1*U}${UN}`, ...tx(eo(seg(t, 1.45, 1.85))) } }, 'built by Technology and Innovation')),
    A({ right: `${8*U}${UN}`, top: 0, bottom: 0, display: 'flex', alignItems: 'center' },
      h('div', { style: { display: 'grid', gridTemplateColumns: `repeat(8,${3.2*U}${UN})`, gap: `${1.1*U}${UN}` } }, sq)));
}

function pSquare(t) {
  const cards = [['3', 'days of programming', '#0077CD'], ['2', 'cities: Edmonton and Calgary', '#EF4B8B'], ['40', 'working demos', '#ED8C00']];
  const kids = cards.map(([num, label, c], k) => {
    const lt = t - k * 1.4; if (lt < 0 || lt > 1.45) return null;
    const inP = eo5(seg(lt, 0, 0.3)), outP = ei(seg(lt, 1.15, 1.4)), lab = eo(seg(lt, 0.12, 0.42));
    return h('div', { key: k, style: { position: 'absolute', inset: 0 } },
      A({ left: `${8*U}${UN}`, top: `${8*U}${UN}`, width: `${12*U}${UN}`, height: `${12*U}${UN}`, background: c, transform: `scale(${back(seg(lt, 0, 0.28)) * (1 - outP)})` }),
      A({ left: `${6*U}${UN}`, top: `${24*U}${UN}`, overflow: 'hidden' }, h('div', { style: { fontSize: `${44*U}${UN}`, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em', transform: `translateY(${(1 - inP) * 100 - outP * 100}%)` } }, num)),
      A({ left: `${8*U}${UN}`, right: `${8*U}${UN}`, bottom: `${9*U}${UN}`, fontSize: `${7*U}${UN}`, fontWeight: 700, lineHeight: 1.1, textWrap: 'balance', opacity: lab * (1 - outP), transform: `translateX(${((1 - lab) * 4)*U}${UN})` }, label));
  });
  const ka = seg(t, 4.2, 4.6);
  return frame('#FFFFFF', ...kids,
    ka > 0 ? A({ inset: 0, clipPath: `circle(${eo5(ka) * 75}% at 50% 50%)` }, cover(IMG.key, { transform: `scale(${1.1 - 0.1 * eo(seg(t, 4.2, 7.6))})` })) : null,
    A({ inset: 0, background: '#FFFFFF', opacity: ei(seg(t, 7.55, 8)) }));
}

function pVertical(t) {
  const tp = i => (t - (i % 10) * 0.05) / 0.6;
  const ex = eo(seg(t, 3.3, 3.6));
  const line = (txt, a, color) => {
    const p = eo5(seg(t, a, a + 0.4));
    return h('div', { style: { overflow: 'hidden' } }, h('div', { style: { fontSize: `${11.5*U}${UN}`, whiteSpace: 'nowrap', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em', color, transform: `translateY(${(1 - p) * 110}%)` } }, txt));
  };
  const lk = a => { const p = eo5(seg(t, a, a + 0.4)); return { opacity: p, transform: `translateY(${((1 - p) * 4)*U}${UN})` }; };
  return frame('#FFFFFF',
    drawTraces(90, 160, TR.vT, tp), drawTraces(90, 160, TR.vB, i => tp(i + 3)),
    t < 3.65 ? A({ left: `${9*U}${UN}`, right: `${9*U}${UN}`, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: `${1*U}${UN}`, opacity: 1 - ex, transform: `translateY(${(-ex * 8)*U}${UN})` },
      line('Alberta', 0.35, NAVY), line('is moving.', 0.5, NAVY),
      h('div', { style: { height: `${6*U}${UN}` } }),
      line('Come and see', 1.5, RED), line('how fast.', 1.65, RED)) : null,
    t >= 3.6 ? A({ inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
      h('div', { style: { fontSize: `${21*U}${UN}`, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', ...lk(3.7) } }, 'Agency'),
      h('div', { style: { fontSize: `${21*U}${UN}`, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', ...lk(3.82) } }, '2026'),
      h('div', { style: { fontSize: `${6.5*U}${UN}`, fontWeight: 700, color: RED, marginTop: `${4*U}${UN}`, ...lk(4.0) } }, 'Dec. 7–9, 2026'),
      h('div', { style: { fontSize: `${6*U}${UN}`, fontWeight: 700, marginTop: `${1.5*U}${UN}`, ...lk(4.1) } }, 'Edmonton · Calgary'),
      h('img', { src: IMG.logo, alt: 'Alberta', style: { width: `${34*U}${UN}`, marginTop: `${7*U}${UN}`, ...lk(4.35) } })) : null,
    A({ inset: 0, background: '#FFFFFF', opacity: ei(seg(t, 7.45, 8)) }));
}

// ===================================================================================================================================
// Phase 2 pieces (2026-11-11): AN-03 logo sting, AN-04 QR toolbox loop, VD-01 sizzle, VD-02/VD-03 day recap templates, VD-04 cutdown.
// Every fact is from tokens.event or the compliant slide template. VD-01 and VD-04 are cut on the measured downbeats of the Tech Sizzle
// Cue (brand/audio/analysis/tech-sizzle-cue.beats.json); render them with the audio offsets in CLIPS (audio, audioStart).
// ===================================================================================================================================
const ALPHA = () => typeof window !== 'undefined' && !!window.AGENCY_ALPHA;
const PINK = '#EF4B8B', PLUM = '#730067', BLUE = '#0077CD', ORANGE = '#ED8C00', YELLOW = '#FFC836', GREEN = '#78BF26', CYAN = '#00B6ED';

// traces that run in from an edge and converge on a point (the chip): side l|r|t|b, n lines, in a W x H viewBox
function mkConverge(W, H, side, n, o) {
  const list = [], cx = o.cx, cy = o.cy;
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0.5 : i / (n - 1), r = ((i * 7919 + o.seed) % 97) / 97;
    const horiz = side === 'l' || side === 'r', len = horiz ? H : W, c = horiz ? cy : cx;
    const v0 = len * (o.v0 + (o.v1 - o.v0) * f), pin = c + (i - (n - 1) / 2) * o.pin;      // start along the edge, end on a chip pin
    const end = horiz ? (side === 'l' ? cx - o.gap : cx + o.gap) : (side === 't' ? cy - o.gap : cy + o.gap);
    const span = Math.abs(end - (side === 'l' || side === 't' ? 0 : horiz ? W : H));
    const d = Math.abs(pin - v0), k = Math.max(4, span - d - o.lead * (0.6 + 0.4 * r));     // run straight, 45 degrees to the pin, short lead in
    const pts = [];
    if (side === 'l') pts.push([-3, v0], [k, v0], [k + d, pin], [end, pin]);
    if (side === 'r') pts.push([W + 3, v0], [W - k, v0], [W - k - d, pin], [end, pin]);
    if (side === 't') pts.push([v0, -3], [v0, k], [pin, k + d], [pin, end]);
    if (side === 'b') pts.push([v0, H + 3], [v0, H - k], [pin, H - k - d], [pin, end]);
    const wide = i % 4 === 1;
    list.push({ pts: pts.map(q => q[0].toFixed(2) + ',' + q[1].toFixed(2)).join(' '), end: pts[0], color: o.colors[i % o.colors.length], w: o.thin, r: o.node });
  }
  return list;
}
const CV = {
  l: mkConverge(160, 90, 'l', 7, { cx: 80, cy: 45, v0: 0.18, v1: 0.82, pin: 1.25, gap: 7, lead: 6, colors: LEFTC, wide: 1.6, thin: 0.45, node: 0.9, seed: 4 }),
  r: mkConverge(160, 90, 'r', 7, { cx: 80, cy: 45, v0: 0.18, v1: 0.82, pin: 1.25, gap: 7, lead: 6, colors: RIGHTC, wide: 1.6, thin: 0.45, node: 0.9, seed: 9 }),
  t: mkConverge(160, 90, 't', 7, { cx: 80, cy: 45, v0: 0.3, v1: 0.7, pin: 1.25, gap: 7, lead: 4, colors: [PINK, YELLOW, PLUM, ORANGE], wide: 1.6, thin: 0.45, node: 0.9, seed: 13 }),
  b: mkConverge(160, 90, 'b', 7, { cx: 80, cy: 45, v0: 0.3, v1: 0.7, pin: 1.25, gap: 7, lead: 4, colors: [CYAN, GREEN, BLUE, PINK], wide: 1.6, thin: 0.45, node: 0.9, seed: 19 }),
};
// the pink chip from the invite, drawn in the same 160 x 90 viewBox: centre cx, cy, size s, scale k
function chipSvg() { return null; }   // retired 2026-11-11 (owner: no chip icon)
function chipSvgRetired(cx, cy, s, k, o = {}) {
  if (k <= 0) return null;
  const pins = [], n = 7, step = s * 0.72 / (n - 1), pl = s * 0.14;
  for (let i = 0; i < n; i++) { const q = -s / 2 + s * 0.14 + i * step;
    pins.push(h('line', { key: 'a' + i, x1: q, y1: -s / 2, x2: q, y2: -s / 2 + pl }), h('line', { key: 'b' + i, x1: q, y1: s / 2 - pl, x2: q, y2: s / 2 }),
      h('line', { key: 'c' + i, x1: -s / 2, y1: q, x2: -s / 2 + pl, y2: q }), h('line', { key: 'd' + i, x1: s / 2 - pl, y1: q, x2: s / 2, y2: q })); }
  return h('svg', { viewBox: '0 0 160 90', preserveAspectRatio: 'xMidYMid slice', style: { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' } },
    h('g', { transform: `translate(${cx} ${cy}) scale(${k})` },
      o.glow ? h('rect', { x: -s * 0.75, y: -s * 0.75, width: s * 1.5, height: s * 1.5, rx: s * 0.2, fill: PINK, opacity: o.glow * 0.25 }) : null,
      h('g', { stroke: '#B0306E', strokeWidth: s * 0.035 }, pins),
      h('rect', { x: -s / 2 + pl, y: -s / 2 + pl, width: s - 2 * pl, height: s - 2 * pl, rx: s * 0.05, fill: PINK, stroke: '#B0306E', strokeWidth: s * 0.04 }),
      h('rect', { x: -s * 0.17, y: -s * 0.17, width: s * 0.34, height: s * 0.34, fill: 'none', stroke: '#B0306E', strokeWidth: s * 0.05 })));
}

// AN-03 Circuit logo sting (4 s): traces converge from all four edges onto the chip; the chip pops, rises, and the lockup lands under it
function pSting(t) {
  const cv = i => (t - 0.05 - (i % 7) * 0.05) / 0.75;
  const rise = eo5(seg(t, 1.55, 2.1)), fadeTr = 1 - seg(t, 1.5, 2.0);
  const cy = 45 - 16 * rise, k = back(seg(t, 0.85, 1.2)) * (1 - 0.25 * rise);
  const out = ALPHA() ? 0 : ei(seg(t, 3.7, 4));
  return frame(ALPHA() ? 'transparent' : '#FFFFFF',
    A({ inset: 0, opacity: fadeTr }, drawTraces(160, 90, CV.l, cv), drawTraces(160, 90, CV.r, i => cv(i + 2)), drawTraces(160, 90, CV.t, i => cv(i + 1)), drawTraces(160, 90, CV.b, i => cv(i + 3))),
    chipSvg(80, cy, 14, k, { glow: seg(t, 1.0, 1.3) * (1 - seg(t, 1.3, 1.9)) }),
    A({ left: 0, right: 0, top: '47%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
      h('div', { style: { display: 'flex', fontSize: `${12*U}${UN}`, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', color: NAVY } },
        'Agency 2026'.split('').map((ch, i) => { const p = seg(t, 1.85 + i * 0.035, 2.2 + i * 0.035); return h('span', { key: i, style: { display: 'inline-block', whiteSpace: 'pre', opacity: cl(p * 3), transform: `translateY(${(1 - back(p)) * 0.4}em)`, color: i > 6 ? RED : NAVY } }, ch); })),
      h('div', { style: { height: `${0.5*U}${UN}`, width: `${62*U*eo5(seg(t, 2.35, 2.8))}${UN}`, marginTop: `${1.2*U}${UN}`, background: `linear-gradient(90deg,${PLUM},${BLUE},${CYAN},${GREEN},${YELLOW},${ORANGE},${PINK})` } })),
    out ? A({ inset: 0, background: '#FFFFFF', opacity: out }) : null);
}

// AN-04 QR toolbox loop (1:1, 15 s): how to save a demo. The QR is a sample to https://www.alberta.ca.
const QRN = 25, QRB = '1111111000000010101111111100000100110001100100000110111010100000000010111011011101011101111101011101101110101011100010101110110000010100100011010000011111111010101010101111111000000001000001110000000010111110000111010011111000000110101100100110100010110110111010011101111101110000000100010000101000011101001011010111011110111111101011100100011010101010110010011001010111110111001110011101011110110001101101110010111011111010000000000110000011000110001111111001011000101010111100000101011001010001100010111010110100011111101111011101010101100001011111101110101110011100000110110000010010011011101110011111111011101010000111111';
function qrGrid(size, o = {}) {
  const cells = []; const c = size / QRN;
  for (let y = 0; y < QRN; y++) for (let x = 0; x < QRN; x++) if (QRB[y * QRN + x] === '1') cells.push(h('rect', { key: y * QRN + x, x: x * c, y: y * c, width: c + 0.02, height: c + 0.02 }));
  return h('svg', { viewBox: `-${c * 2} -${c * 2} ${size + c * 4} ${size + c * 4}`, style: { width: '100%', height: '100%', display: 'block', background: '#FFFFFF' } }, h('g', { fill: NAVY }, cells),
    o.scan != null ? h('rect', { x: -c, y: o.scan * size - c * 0.4, width: size + 2 * c, height: c * 0.8, fill: PINK, opacity: 0.85 }) : null);
}
function pToolbox(t) {
  const sc = (a, b) => seg(t, a, b), fadeAll = ei(sc(14.4, 15));
  const title = eo5(sc(0.2, 0.7)) * (1 - ei(sc(2.6, 3)));
  const phoneIn = eo5(sc(3.0, 3.5)) * (1 - ei(sc(10.6, 11.0))), scan = sc(4.2, 5.6), saved = back(sc(5.7, 6.0));
  const cards = ['Sample demo A', 'Sample demo B', 'Sample demo C'];
  const cta = eo5(sc(11.1, 11.6));
  return frame('#FFFFFF',
    A({ left: `${8*U}${UN}`, right: `${8*U}${UN}`, top: `${30*U}${UN}`, opacity: title, transform: `translateY(${(1 - title) * 3*U}${UN})` },
      h('div', { style: { fontSize: `${3*U}${UN}`, fontWeight: 700, letterSpacing: '0.14em', color: RED } }, 'WHAT ATTENDEES GET'),
      h('div', { style: { fontSize: `${11*U}${UN}`, fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.02em', marginTop: `${2*U}${UN}` } }, 'Build your own toolbox')),
    phoneIn > 0 ? A({ left: `${10*U}${UN}`, top: `${12*U}${UN}`, width: `${38*U}${UN}`, height: `${76*U}${UN}`, borderRadius: `${5*U}${UN}`, background: NAVY, padding: `${2.2*U}${UN}`, opacity: phoneIn, transform: `translateY(${(1 - phoneIn) * 8*U}${UN})` },
      A({ inset: `${2.2*U}${UN}`, borderRadius: `${3.2*U}${UN}`, background: '#F4F5F8', overflow: 'hidden' },
        A({ left: '12%', right: '12%', top: '18%', aspectRatio: '1' }, qrGrid(10, { scan: scan > 0 && scan < 1 ? scan : null })),
        A({ left: '10%', right: '10%', top: '66%', textAlign: 'center', fontSize: `${2.6*U}${UN}`, fontWeight: 700, color: NAVY, opacity: saved },
          h('div', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: `${6*U}${UN}`, height: `${6*U}${UN}`, borderRadius: '50%', background: GREEN, color: '#FFFFFF', fontSize: `${4*U}${UN}`, transform: `scale(${saved})` } }, '✓'),
          h('div', { style: { marginTop: `${1.2*U}${UN}` } }, 'Demo saved')))) : null,
    phoneIn > 0 ? A({ left: `${54*U}${UN}`, right: `${7*U}${UN}`, top: `${20*U}${UN}`, display: 'flex', flexDirection: 'column', gap: `${2.4*U}${UN}`, opacity: phoneIn },
      h('div', { style: { fontSize: `${3*U}${UN}`, fontWeight: 700, letterSpacing: '0.12em', color: RED } }, 'YOUR TOOLBOX'),
      ...cards.map((c, i) => { const p = eo5(sc(6.3 + i * 1.2, 6.7 + i * 1.2)); return h('div', { key: i, style: { border: '1px solid #D0D1DB', borderLeft: `${1*U}${UN} solid ${ACC[i * 2]}`, borderRadius: `${1*U}${UN}`, padding: `${2*U}${UN}`, fontSize: `${3.4*U}${UN}`, fontWeight: 700, opacity: p, transform: `translateX(${(1 - p) * 6*U}${UN})` } }, c); }),
      h('div', { style: { fontSize: `${2.2*U}${UN}`, color: '#3D4F63', opacity: eo(sc(10, 10.4)) } }, 'Sample QR and demo names')) : null,
    cta > 0 ? A({ left: `${8*U}${UN}`, right: `${8*U}${UN}`, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: cta * (1 - fadeAll) },
      h('div', { style: { fontSize: `${7.4*U}${UN}`, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em', textWrap: 'balance', transform: `translateY(${(1 - cta) * 4*U}${UN})` } }, 'Scan a QR code on any screen to save a demo.'),
      h('div', { style: { fontSize: `${3.6*U}${UN}`, color: RED, fontWeight: 700, marginTop: `${3*U}${UN}`, opacity: eo(sc(11.6, 12)) } }, 'Then get a write-up of what each tool could do for your ministry.'),
      h('img', { src: IMG.logo, alt: 'Alberta', style: { width: `${26*U}${UN}`, marginTop: `${8*U}${UN}`, opacity: eo(sc(12.2, 12.6)) } })) : null);
}

// ---------- VD-01 sizzle (65 s, to the Tech Sizzle Cue from 34.5 s) ----------
// downbeats of the cue, relative to 34.5 s (bar = 2.31 s); 28.47 = the break, 32.33 = the peak, 55.34 = the final lockup
const SZ = [0, 2.28, 4.6, 6.92, 9.25, 11.55, 13.87, 16.17, 18.49, 20.79, 23.11, 25.41, 28.47, 32.33, 34.65, 36.95, 39.25, 41.57, 43.87, 46.17, 48.44, 50.74, 53.04, 55.34, 57.64, 59.94, 62.26];
const SZBEAT = 0.578;
const shot = (t, a, b, fn) => (t >= a && t < b ? fn(t - a, b - a) : null);
const bigNum = (lt, num, label, c, o = {}) => {
  const inP = eo5(seg(lt, 0, 0.35)), lab = eo(seg(lt, 0.18, 0.5));
  return [A({ left: `${8*U}${UN}`, top: `${o.top ?? 16}%`, width: `${7*U}${UN}`, height: `${7*U}${UN}`, background: c, transform: `scale(${back(seg(lt, 0, 0.3))})` }),
    A({ left: `${7*U}${UN}`, top: `${(o.top ?? 16) + 8}%`, overflow: 'hidden' }, h('div', { style: { fontSize: `${(o.size ?? 30)*U}${UN}`, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', transform: `translateY(${(1 - inP) * 100}%)` } }, num)),
    A({ left: `${8*U}${UN}`, right: `${8*U}${UN}`, bottom: `${o.bottom ?? 14}%`, fontSize: `${(o.label ?? 5)*U}${UN}`, fontWeight: 700, lineHeight: 1.1, textWrap: 'balance', opacity: lab, transform: `translateX(${(1 - lab) * 3*U}${UN})` }, label)];
};
const dayCard = (lt, d, i, o = {}) => {
  const wipe = eo5(seg(lt, 0, 0.32)), wOut = eo5(seg(lt, 0.32, 0.62));
  const st = a => { const p = eo(seg(lt, a, a + 0.35)); return { opacity: p, transform: `translateX(${((1 - p) * 4)*U}${UN})` }; };
  return [A({ inset: 0 }, cover(IMG.day[i], { transform: `scale(${1.04 - 0.04 * eo(seg(lt, 0.3, 4.6))})` })),
    A({ left: o.left ?? '24%', right: o.right ?? '24%', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: `${1.4*U}${UN}` },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: `${1.2*U}${UN}`, fontSize: `${(o.k ?? 1) * 2.3*U}${UN}`, fontWeight: 700, color: RED, ...st(0.45) } }, h('span', { style: { width: `${1.6*U}${UN}`, height: `${1.6*U}${UN}`, background: d.c, flex: 'none' } }), `Day ${i + 1} · ${d.d}`),
      h('div', { style: { fontSize: `${(o.k ?? 1) * 5.8*U}${UN}`, fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.02em', textWrap: 'balance', ...st(0.55) } }, d.t),
      h('div', { style: { fontSize: `${(o.k ?? 1) * 2.6*U}${UN}`, ...st(0.7) } }, d.s),
      h('div', { style: { fontSize: `${(o.k ?? 1) * 2*U}${UN}`, fontWeight: 700, color: '#3D4F63', ...st(0.8) } }, d.v)),
    A({ inset: 0, background: d.c, transform: `translateX(${lt >= 0.32 ? 100 * wOut : -100 + 100 * wipe}%)` })];
};
const lockup = (lt, o = {}) => {
  const lk = a => { const p = eo5(seg(lt, a, a + 0.45)); return { opacity: p, transform: `translateY(${((1 - p) * 3)*U}${UN})` }; };
  const k = o.k ?? 1;
  return A({ inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    h('div', { style: { fontSize: `${k * 12.5*U}${UN}`, fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.02em', ...lk(0) } }, 'Agency'),
    h('div', { style: { fontSize: `${k * 12.5*U}${UN}`, fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.02em', ...lk(0.1) } }, '2026'),
    h('div', { style: { fontSize: `${k * 3.6*U}${UN}`, fontWeight: 700, color: RED, marginTop: `${k * 1.6*U}${UN}`, ...lk(0.3) } }, 'Dec. 7–9, 2026'),
    h('div', { style: { fontSize: `${k * 3.4*U}${UN}`, fontWeight: 700, marginTop: `${k * 0.6*U}${UN}`, ...lk(0.4) } }, 'Edmonton · Calgary'),
    o.anchor ? h('div', { style: { fontSize: `${k * 2*U}${UN}`, color: '#3D4F63', marginTop: `${k * 2.2*U}${UN}`, ...lk(0.6) } }, 'Anchored by the Velocity White Papers') : null,
    h('img', { src: IMG.logo, alt: 'Alberta', style: { width: `${k * 16*U}${UN}`, marginTop: `${k * 3.4*U}${UN}`, ...lk(0.75) } }));
};
const kinetic = (lt, words, o = {}) => A({ inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${(o.pad ?? 8)*U}${UN}`, alignItems: o.center ? 'center' : 'flex-start', textAlign: o.center ? 'center' : 'left' },
  ...words.map(([txt, color], i) => { const p = eo5(seg(lt, (o.at ?? 0.1) + i * (o.step ?? 0.14), (o.at ?? 0.1) + i * (o.step ?? 0.14) + 0.4));
    return h('div', { key: i, style: { overflow: 'hidden' } }, h('div', { style: { fontSize: `${(o.size ?? 9)*U}${UN}`, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em', color: color || NAVY, transform: `translateY(${(1 - p) * 110}%)`, whiteSpace: o.nowrap === false ? 'normal' : 'nowrap' } }, txt)); }));

function pSizzle(t) {
  const B = SZ, DT = [BLUE, PLUM, ORANGE];
  const rapid = [['The Art of the Possible', BLUE], ['Research', PLUM], ['Velocity', ORANGE], ['Edmonton', PINK], ['Calgary', CYAN], ['40 working demos', GREEN], ['2 challenges', YELLOW], ['3 days', BLUE]];
  return frame('#FFFFFF',
    shot(t, 0, B[2], lt => [A({ inset: 0, opacity: 1 - seg(lt, 0.8, 1.3) }, drawTraces(160, 90, TR.openL, i => (lt - (i % 9) * 0.07) / 0.9), drawTraces(160, 90, TR.openR, i => (lt - 0.3 - (i % 9) * 0.07) / 0.9)),
      kinetic(lt - 1.0, [['Agency', NAVY], ['2026', RED]], { size: 12.5, center: true, step: 0.2 })]),
    shot(t, B[2], B[3], lt => bigNum(lt, '3', 'days of programming', BLUE)),
    shot(t, B[3], B[4], lt => bigNum(lt, '2', 'cities: Edmonton and Calgary', PINK)),
    shot(t, B[4], B[6], lt => { const n = Math.round(40 * eo(seg(lt, 0.1, 1.6))), sq = [];
      for (let i = 0; i < 40; i++) { const p = seg(lt, 0.1 + i * 0.035, 0.35 + i * 0.035); sq.push(h('div', { key: i, style: { width: `${3.2*U}${UN}`, height: `${3.2*U}${UN}`, background: ACC[(i * 3) % 7], transform: `scale(${back(p)})` } })); }
      return [A({ left: `${8*U}${UN}`, top: 0, bottom: 0, width: `${44*U}${UN}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
        h('div', { style: { fontSize: `${24*U}${UN}`, fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' } }, String(n)),
        h('div', { style: { fontSize: `${4.4*U}${UN}`, fontWeight: 700, marginTop: `${1.6*U}${UN}`, opacity: eo(seg(lt, 0.8, 1.2)) } }, 'working demos'),
        h('div', { style: { fontSize: `${2.2*U}${UN}`, color: RED, fontWeight: 700, marginTop: `${1*U}${UN}`, opacity: eo(seg(lt, 1.0, 1.4)) } }, 'built by Technology and Innovation')),
        A({ right: `${8*U}${UN}`, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }, h('div', { style: { display: 'grid', gridTemplateColumns: `repeat(8,${3.2*U}${UN})`, gap: `${1.1*U}${UN}` } }, sq))]; }),
    shot(t, B[6], B[7], lt => bigNum(lt, '2', 'challenges set by government', ORANGE)),
    shot(t, B[7], B[9], lt => dayCard(lt, DAYS[0], 0)),
    shot(t, B[9], B[11], lt => dayCard(lt, DAYS[1], 1)),
    shot(t, B[11], B[12], lt => dayCard(lt, DAYS[2], 2)),
    shot(t, B[12], B[13], lt => [A({ inset: 0, background: NAVY }), drawTraces(160, 90, TR.cdL, i => (lt - (i % 8) * 0.1) / 1.2, { opacity: 0.5, flow: lt, nodeFill: NAVY }), drawTraces(160, 90, TR.cdR, i => (lt - (i % 8) * 0.1) / 1.2, { opacity: 0.5, flow: lt + 0.5, nodeFill: NAVY }),
      kinetic(lt - 0.3, [['Alberta', '#FFFFFF'], ['is moving.', '#FFFFFF']], { size: 10, center: true, step: 0.35 })]),
    shot(t, B[13], B[15], lt => kinetic(lt, [['Come and see', RED], ['how fast.', RED]], { size: 11, center: true, step: SZBEAT })),
    ...rapid.map(([w, c], i) => shot(t, B[15] + i * SZBEAT * 2, B[15] + (i + 1) * SZBEAT * 2, lt => [A({ inset: 0, background: i % 2 ? '#FFFFFF' : c }),
      A({ inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${6*U}${UN}` }, h('div', { style: { fontSize: `${(w.length > 14 ? 8 : 13)*U}${UN}`, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, textAlign: 'center', color: i % 2 ? c : '#FFFFFF', transform: `scale(${1.06 - 0.06 * eo(seg(lt, 0, 0.5))})`, opacity: cl(lt / 0.06) } }, w))])),
    shot(t, B[19], B[23], lt => { const ka = eo5(seg(lt, 0, 0.5));
      return [A({ inset: 0, clipPath: `circle(${ka * 75}% at 50% 50%)` }, cover(IMG.key, { transform: `scale(${1.08 - 0.08 * eo(seg(lt, 0, 9))})` })),
        A({ left: 0, right: 0, bottom: `${7*U}${UN}`, textAlign: 'center', fontSize: `${2.6*U}${UN}`, fontWeight: 700, opacity: eo(seg(lt, 1.2, 1.8)) * (1 - ei(seg(lt, 8.3, 8.9))) }, h('span', { style: { background: 'rgba(255,255,255,0.9)', padding: `${0.6*U}${UN} ${1.6*U}${UN}` } }, 'Anchored by the Velocity White Papers'))]; }),
    shot(t, B[23], 66, lt => [drawTraces(160, 90, TR.cdL, i => (lt - (i % 8) * 0.04) / 0.6), drawTraces(160, 90, TR.cdR, i => (lt - (i % 8) * 0.04) / 0.6), lockup(lt - 0.2, { anchor: true })]),
    A({ inset: 0, background: '#FFFFFF', opacity: ei(seg(t, 64.3, 65)) }));
}

// ---------- VD-04 vertical social cutdown (9:16, 30 s, Tech Sizzle Cue from 62.97 s) with burned-in captions ----------
const VC = [0, 1.56, 3.86, 6.18, 8.48, 10.78, 13.1, 15.4, 17.7, 19.97, 22.27, 24.57, 26.87, 29.17];
const CAPS = [[0, 3.86, 'Alberta is moving.'], [3.86, 6.18, 'Agency 2026 runs December 7 to 9.'], [6.18, 8.48, 'Three days of programming.'], [8.48, 10.78, 'Two cities: Edmonton and Calgary.'],
  [10.78, 13.1, 'Forty working demos, built by Technology and Innovation.'], [13.1, 15.4, 'Day 1: The Art of the Possible.'], [15.4, 17.7, 'Day 2: Research and the Future AI Economy.'],
  [17.7, 19.97, 'Day 3: Alberta Velocity, Full Speed Ahead.'], [19.97, 24.57, 'Come and see how fast.'], [24.57, 30, 'Agency 2026. Edmonton and Calgary.']];
function captionBar(t) {
  const c = CAPS.find(([a, b]) => t >= a && t < b); if (!c) return null;
  const p = eo(seg(t - c[0], 0, 0.18));
  return A({ left: `${7*U}${UN}`, right: `${7*U}${UN}`, bottom: `${16*U}${UN}`, display: 'flex', justifyContent: 'center', opacity: p },
    h('div', { style: { background: 'rgba(0,44,78,0.92)', color: '#FFFFFF', fontSize: `${4.6*U}${UN}`, fontWeight: 700, lineHeight: 1.3, padding: `${1.6*U}${UN} ${3*U}${UN}`, borderRadius: `${1*U}${UN}`, textAlign: 'center', textWrap: 'balance' } }, c[2]));
}
function pCutdown(t) {
  const B = VC;
  return frame('#FFFFFF',
    shot(t, 0, B[2], lt => [A({ inset: 0, background: NAVY }), drawTraces(90, 160, TR.vT, i => (lt - (i % 10) * 0.08) / 1.2, { opacity: 0.55, flow: lt, nodeFill: NAVY }),
      kinetic(lt - 0.2, [['Alberta', '#FFFFFF'], ['is moving.', '#FFFFFF']], { size: 15, step: 0.4, pad: 9 })]),
    shot(t, B[2], B[3], lt => [drawTraces(90, 160, TR.vT, i => (lt - (i % 10) * 0.04) / 0.5), drawTraces(90, 160, TR.vB, i => (lt - (i % 10) * 0.04) / 0.5), lockup(lt, { k: 1.55 })]),
    shot(t, B[3], B[4], lt => bigNum(lt, '3', 'days of programming', BLUE, { size: 60, top: 14, label: 9, bottom: 34 })),
    shot(t, B[4], B[5], lt => bigNum(lt, '2', 'cities: Edmonton and Calgary', PINK, { size: 60, top: 14, label: 9, bottom: 34 })),
    shot(t, B[5], B[6], lt => bigNum(lt, '40', 'working demos', ORANGE, { size: 52, top: 14, label: 9, bottom: 34 })),
    shot(t, B[6], B[7], lt => dayCard(lt, DAYS[0], 0, { left: '9%', right: '9%', k: 2.1 })),
    shot(t, B[7], B[8], lt => dayCard(lt, DAYS[1], 1, { left: '9%', right: '9%', k: 2.1 })),
    shot(t, B[8], B[9], lt => dayCard(lt, DAYS[2], 2, { left: '9%', right: '9%', k: 2.1 })),
    shot(t, B[9], B[11], lt => kinetic(lt, [['Come and see', RED], ['how fast.', RED]], { size: 12, step: SZBEAT, pad: 9 })),
    shot(t, B[11], 31, lt => [drawTraces(90, 160, TR.vT, i => (lt - (i % 10) * 0.04) / 0.5), drawTraces(90, 160, TR.vB, i => (lt - (i % 10) * 0.04) / 0.5), lockup(lt, { k: 1.55, anchor: true })]),
    captionBar(t),
    A({ inset: 0, background: '#FFFFFF', opacity: ei(seg(t, 29.4, 30)) }));
}

// ---------- VD-02 / VD-03 day recap templates: footage slots for editors, labelled; no footage exists yet ----------
const RECAP = {
  'VD-02': { day: 0, slots: [['Footage: Day 1 keynote', 'Speaker name · Title (from the speaker, in writing)'], ['Footage: demo floor, wide shots', ''], ['Footage: three demos, close-ups', 'Demo name · Team'], ['Footage: attendee reactions', ''], ['Footage: hands-on session', 'AI Academy']] },
  'VD-03': { day: 2, slots: [['Footage: opening at Platform Calgary', ''], ['Footage: industry presentations', 'Speaker name · Organization'], ['Footage: challenge dialogue on stage', 'Challenge title'], ['Footage: networking and demos', '']] },
};
function footageSlot(lt, dur, label, lower, c, i) {
  const p = eo5(seg(lt, 0, 0.4)), lw = eo5(seg(lt, 1.0, 1.4)) * (1 - ei(seg(lt, dur - 1.2, dur - 0.8)));
  return [A({ inset: 0, background: `repeating-linear-gradient(135deg,#16314D 0 ${2*U}${UN},#1B3A5A 0 ${4*U}${UN})`, opacity: p }),
    A({ inset: `${3*U}${UN}`, border: `${0.25*U}${UN} dashed #6E8AA6`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#C9D6E2', fontFamily: MONO, textAlign: 'center' },
      h('div', { style: { fontSize: `${1.6*U}${UN}`, letterSpacing: '0.18em' } }, `FOOTAGE SLOT ${i + 1} · ${dur.toFixed(0)} S`),
      h('div', { style: { fontFamily: FONT, fontSize: `${4.2*U}${UN}`, fontWeight: 700, color: '#FFFFFF', marginTop: `${1.4*U}${UN}` } }, label),
      h('div', { style: { fontSize: `${1.5*U}${UN}`, marginTop: `${1.2*U}${UN}` } }, 'Replace with event footage. Placeholder only.')),
    lower ? A({ left: `${6*U}${UN}`, bottom: `${9*U}${UN}`, opacity: lw, transform: `translateX(${(1 - lw) * -3*U}${UN})` },
      h('div', { style: { background: '#FFFFFF', borderLeft: `${0.8*U}${UN} solid ${c}`, padding: `${1.4*U}${UN} ${2.4*U}${UN}`, fontSize: `${2.4*U}${UN}`, fontWeight: 700, color: NAVY } }, lower)) : null];
}
const mkRecap = code => function (t) {
  const R = RECAP[code], d = DAYS[R.day], dur = CLIPS.find(c => c.code === code).dur, slot = (dur - 6 - 8) / R.slots.length;
  return frame('#FFFFFF',
    shot(t, 0, 6, lt => dayCard(lt, d, R.day)),
    ...R.slots.map(([label, lower], i) => shot(t, 6 + i * slot, 6 + (i + 1) * slot, lt => footageSlot(lt, slot, label, lower, d.c, i))),
    shot(t, dur - 8, dur + 1, lt => [drawTraces(160, 90, TR.cdL, i => (lt - (i % 8) * 0.05) / 0.7), drawTraces(160, 90, TR.cdR, i => (lt - (i % 8) * 0.05) / 0.7), lockup(lt - 0.2, { anchor: true })]),
    A({ inset: 0, background: '#FFFFFF', opacity: ei(seg(t, dur - 0.6, dur)) }));
};
const pRecap1 = mkRecap('VD-02'), pRecap3 = mkRecap('VD-03');

const CATS = {
  mg: { label: 'Stage motion graphics', short: 'Motion graphics', color: '#0077CD' },
  an: { label: 'Social animation', short: 'Animation', color: '#EF4B8B' },
  vd: { label: 'Video', short: 'Video', color: '#ED8C00' },
};
const CLIPS = [
  { code: 'MG-01', cat: 'mg', fn: pOpening, dur: 8, aspect: '16:9', title: 'Opening title sequence', desc: 'Circuit traces fire in from both edges and turn into the key art, then the lockup snaps into place.', res: '3840 × 2160', format: 'ProRes 422 HQ', use: 'Main stage open', keys: [0.35, 1.3, 2.4, 5] },
  { code: 'MG-02', cat: 'mg', fn: pBumper, dur: 9, aspect: '16:9', title: 'Day bumpers', desc: 'Three 3-second bumpers, one per day. Each day has its own colour wipe.', res: '1920 × 1080', format: 'H.264 MP4', use: 'Stage transitions, Days 1–3', keys: [0.25, 1.8, 4.8, 7.8] },
  { code: 'MG-03', cat: 'mg', fn: pLower, dur: 6, aspect: '16:9', title: 'Speaker lower third', desc: 'An accent line draws on, then the name plate opens. Built with alpha for live switching.', res: '1920 × 1080', format: 'ProRes 4444 + alpha', use: 'Live broadcast and recordings', keys: [0.3, 0.6, 2.5, 5.0] },
  { code: 'MG-04', cat: 'mg', fn: pCount, dur: 300, aspect: '16:9', title: 'Session countdown loop', desc: 'A five-minute countdown with data pulses running along the circuit traces.', res: '3840 × 2160', format: 'H.264 MP4', use: 'Lobby and stage screens', keys: [0.5, 60.5, 180.5, 290.5] },
  { code: 'MG-05', cat: 'mg', fn: pStat, dur: 7, aspect: '16:9', title: 'Stat reveal: 40 working demos', desc: 'The counter runs to 40 as 40 chip nodes pop into a grid, one per demo.', res: '1920 × 1080', format: 'ProRes 422', use: 'Day 1 keynote insert', keys: [0.6, 1.1, 3, 6.1] },
  { code: 'AN-01', cat: 'an', fn: pSquare, dur: 8, aspect: '1:1', title: 'Square social loop', desc: 'Three quick stats, then a circular reveal of the key art.', res: '1080 × 1080', format: 'H.264 MP4', use: 'LinkedIn and Instagram feed', keys: [0.5, 2.0, 3.5, 5.5] },
  { code: 'AN-02', cat: 'an', fn: pVertical, dur: 8, aspect: '9:16', title: 'Vertical social cutdown', desc: '"Alberta is moving. Come and see how fast." Then the event lockup.', res: '1080 × 1920', format: 'H.264 MP4', use: 'Stories and Reels', keys: [0.7, 2.4, 4.6, 6.5] },
  { code: 'AN-03', cat: 'an', fn: pSting, dur: 4, aspect: '16:9', title: 'Circuit logo sting', desc: 'Thin traces converge from every edge, then the lockup lands (no chip, then the Agency 2026 lockup lands. Alpha-capable.', res: '3840 × 2160', format: 'ProRes 4444 + alpha', use: 'Video open and close', keys: [0.4, 1.1, 2.1, 3.2], alpha: true },
  { code: 'AN-04', cat: 'an', fn: pToolbox, dur: 15, aspect: '1:1', title: 'Save a demo: QR toolbox', desc: 'A looping how-to: scan a QR code on any screen and save a demo to your toolbox. Sample QR and demo names.', res: '1080 × 1080', format: 'H.264 MP4', use: 'Demo booth screens', keys: [1.0, 4.8, 8.6, 12.6] },
  { code: 'VD-01', cat: 'vd', fn: pSizzle, dur: 65, aspect: '16:9', title: 'Agency 2026 sizzle reel', desc: 'Three days, two cities and 40 demos, cut on the downbeats of the Tech Sizzle Cue.', res: '3840 × 2160', format: 'H.264 MP4 with audio', use: 'Web, social, stage', keys: [3.2, 10.6, 17.4, 30.5, 38.0, 49.5, 58.5], audio: 'brand/audio/source/tech-sizzle-cue.mp3', audioStart: 34.5 },
  { code: 'VD-02', cat: 'vd', fn: pRecap1, dur: 180, aspect: '16:9', title: 'Day 1 recap: The Art of the Possible', desc: 'Recap template: day title, five labelled footage slots with lower thirds, end lockup. Drop in event footage.', res: '1920 × 1080', format: 'H.264 MP4', use: 'Internal channels', keys: [2.0, 14.0, 60.0, 176.0], template: true },
  { code: 'VD-03', cat: 'vd', fn: pRecap3, dur: 150, aspect: '16:9', title: 'Alberta Velocity: Full Speed Ahead highlights', desc: 'Recap template for Day 3 at Platform Calgary: four labelled footage slots, end lockup.', res: '1920 × 1080', format: 'H.264 MP4', use: 'Web and social', keys: [2.0, 14.0, 70.0, 146.0], template: true },
  { code: 'VD-04', cat: 'vd', fn: pCutdown, dur: 30, aspect: '9:16', title: 'Social cutdown: Alberta is moving', desc: 'A vertical cut of the sizzle reel with burned-in captions, on the Tech Sizzle Cue peak.', res: '1080 × 1920', format: 'H.264 MP4 with audio', use: 'Instagram, LinkedIn', keys: [2.5, 5.0, 11.5, 14.0, 21.0, 27.5], audio: 'brand/audio/source/tech-sizzle-cue.mp3', audioStart: 62.97 },
];
const INNER = { '16:9': '100%', '1:1': '56.25%', '9:16': '31.64%' };
const p2 = n => String(n).padStart(2, '0');
const tc = s => { const f = Math.floor((s % 1) * 30); s = Math.floor(s); return `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}:${p2(f)}`; };
const durLabel = s => s >= 60 ? `${Math.floor(s / 60)}:${p2(s % 60)} min` : `${s} seconds`;
const toStyle = s => Object.fromEntries(s.split(';').filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).replace(/-([a-z])/g, (_, x) => x.toUpperCase()), d.slice(i + 1)]; }));

// page file for each piece: video-<code>-<slugged title>.dc.html (the names in this folder)
CLIPS.forEach(c => { c.file = 'video-' + c.code.toLowerCase() + '-' + c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.dc.html'; });
const toData = u => fetch(u).then(r => { if (!r.ok) throw 0; return r.blob(); }).then(b => new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.onerror = () => res(u); f.readAsDataURL(b); })).catch(() => u);
Promise.all([toData(IMG.title), ...IMG.day.map(toData), toData(IMG.key), toData(IMG.logo)]).then(([t, d1, d2, d3, k, l]) => { IMG.title = t; IMG.day = [d1, d2, d3]; IMG.key = k; IMG.logo = l; });
window.AgencyPieces = { init(R) { React = R; }, setUnit(n, unit) { U = n; UN = unit; }, CLIPS, CATS, INNER, IMG, tc, durLabel, toStyle };
})();
