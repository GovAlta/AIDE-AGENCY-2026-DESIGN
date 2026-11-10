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
    list.push({ pts: raw.map(map).map(q => q[0].toFixed(2) + ',' + q[1].toFixed(2)).join(' '), end: map(raw[3]), color: o.colors[i % o.colors.length], w: wide ? o.wide : o.thin, r: wide ? 0 : o.node });
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

const CATS = {
  mg: { label: 'Stage motion graphics', short: 'Motion graphics', color: '#0077CD' },
  an: { label: 'Social animation', short: 'Animation', color: '#EF4B8B' },
};
const CLIPS = [
  { code: 'MG-01', cat: 'mg', fn: pOpening, dur: 8, aspect: '16:9', title: 'Opening title sequence', desc: 'Circuit traces fire in from both edges and turn into the key art, then the lockup snaps into place.', res: '3840 × 2160', format: 'ProRes 422 HQ', use: 'Main stage open', keys: [0.35, 1.3, 2.4, 5] },
  { code: 'MG-02', cat: 'mg', fn: pBumper, dur: 9, aspect: '16:9', title: 'Day bumpers', desc: 'Three 3-second bumpers, one per day. Each day has its own colour wipe.', res: '1920 × 1080', format: 'H.264 MP4', use: 'Stage transitions, Days 1–3', keys: [0.25, 1.8, 4.8, 7.8] },
  { code: 'MG-03', cat: 'mg', fn: pLower, dur: 6, aspect: '16:9', title: 'Speaker lower third', desc: 'An accent line draws on, then the name plate opens. Built with alpha for live switching.', res: '1920 × 1080', format: 'ProRes 4444 + alpha', use: 'Live broadcast and recordings', keys: [0.3, 0.6, 2.5, 5.0] },
  { code: 'MG-04', cat: 'mg', fn: pCount, dur: 300, aspect: '16:9', title: 'Session countdown loop', desc: 'A five-minute countdown with data pulses running along the circuit traces.', res: '3840 × 2160', format: 'H.264 MP4', use: 'Lobby and stage screens', keys: [0.5, 60.5, 180.5, 290.5] },
  { code: 'MG-05', cat: 'mg', fn: pStat, dur: 7, aspect: '16:9', title: 'Stat reveal: 40 working demos', desc: 'The counter runs to 40 as 40 chip nodes pop into a grid, one per demo.', res: '1920 × 1080', format: 'ProRes 422', use: 'Day 1 keynote insert', keys: [0.6, 1.1, 3, 6.1] },
  { code: 'AN-01', cat: 'an', fn: pSquare, dur: 8, aspect: '1:1', title: 'Square social loop', desc: 'Three quick stats, then a circular reveal of the key art.', res: '1080 × 1080', format: 'H.264 MP4', use: 'LinkedIn and Instagram feed', keys: [0.5, 2.0, 3.5, 5.5] },
  { code: 'AN-02', cat: 'an', fn: pVertical, dur: 8, aspect: '9:16', title: 'Vertical social cutdown', desc: '"Alberta is moving. Come and see how fast." Then the event lockup.', res: '1080 × 1920', format: 'H.264 MP4', use: 'Stories and Reels', keys: [0.7, 2.4, 4.6, 6.5] },
];
const INNER = { '16:9': '100%', '1:1': '56.25%', '9:16': '31.64%' };
const p2 = n => String(n).padStart(2, '0');
const tc = s => { const f = Math.floor((s % 1) * 30); s = Math.floor(s); return `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}:${p2(f)}`; };
const durLabel = s => s >= 60 ? `${Math.floor(s / 60)}:${p2(s % 60)} min` : `${s} seconds`;
const toStyle = s => Object.fromEntries(s.split(';').filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).replace(/-([a-z])/g, (_, x) => x.toUpperCase()), d.slice(i + 1)]; }));

CLIPS.forEach(c => { c.file = 'Video ' + c.code + ' ' + c.title.replace(/:/g, '') + '.dc.html'; });
const toData = u => fetch(u).then(r => { if (!r.ok) throw 0; return r.blob(); }).then(b => new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.onerror = () => res(u); f.readAsDataURL(b); })).catch(() => u);
Promise.all([toData(IMG.title), ...IMG.day.map(toData), toData(IMG.key), toData(IMG.logo)]).then(([t, d1, d2, d3, k, l]) => { IMG.title = t; IMG.day = [d1, d2, d3]; IMG.key = k; IMG.logo = l; });
window.AgencyPieces = { init(R) { React = R; }, setUnit(n, unit) { U = n; UN = unit; }, CLIPS, CATS, INNER, IMG, tc, durLabel, toStyle };
})();
