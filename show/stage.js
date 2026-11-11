/* Agency 2026 show: the stage runtime. Renders the step on air (or the operator's preview) with motion graphics, transitions,
 * the lower third, blackout and freeze, and plays the show's sound (program mode only). Every scene is drawn from time t, like the
 * motion library pieces, so a freeze or a reload lands on the same picture.
 *
 * Scene types: holding, opening, countdown, title, intro, panel, slides, video, break, bumper, stat, thanks, closing.
 * Add a type: write SCENES.<type> = (ctx) => ({ el, tick(t), cmd?(c), exit?() }) below, and list it in agenda.schema.json.
 */
import * as C from './lib/core.js';
import { traces, SETS } from './lib/traces.js';
import { Mixer } from './lib/audio.js';
import * as Eng from './lib/engine.js';
import * as Tr from './lib/transport.js';

const MODE = C.qs('mode', 'program');                // program | monitor | preview
const PROGRAM = MODE === 'program';
if (!PROGRAM) document.body.classList.add('preview');
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), scenesEl = $('#scenes');

// ---------- easing (the motion library's set) ----------
const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t, a, b) => cl((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - x, 3), eo5 = (x) => 1 - Math.pow(1 - x, 5), ei = (x) => x * x * x;
const back = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

// ---------- DOM helpers ----------
const el = (tag, cls, style, ...kids) => {
  const e = document.createElement(tag); if (cls) e.className = cls; if (style) Object.assign(e.style, style);
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
};
const rise = (e, t, a, dist = 34, dur = 0.5) => { const p = eo5(seg(t, a, a + dur)); e.style.opacity = p; e.style.transform = `translateY(${((1 - p) * dist).toFixed(1)}px)`; };
const slideIn = (e, t, a, dist = 60, dur = 0.45) => { const p = eo(seg(t, a, a + dur)); e.style.opacity = p; e.style.transform = `translateX(${((1 - p) * dist).toFixed(1)}px)`; };
const clipIn = (e, t, a, dur = 0.4) => { e.style.clipPath = `inset(0 ${(100 - 100 * eo(seg(t, a, a + dur))).toFixed(2)}% 0 0)`; };
// letters rise one by one (the opening sequence's "Agency")
function letters(text, cls, style) {
  const box = el('div', cls, { display: 'flex', justifyContent: 'center', ...style });
  const spans = [...text].map((ch) => el('span', null, { display: 'inline-block', whiteSpace: 'pre' }, ch)); box.append(...spans);
  box.anim = (t, a, step = 0.045) => spans.forEach((s, i) => { const p = seg(t, a + i * step, a + 0.35 + i * step); s.style.opacity = cl(p * 3); s.style.transform = `translateY(${((1 - back(p)) * 0.35).toFixed(3)}em)`; });
  return box;
}

// ---------- show data ----------
let AG = null, T = null, CUES = {}, THEME = C.qs('theme', null), STATE = null, mixer = null;
let TP = null;   // the transport (laptop BroadcastChannel, or event-code SSE)
const now = () => (TP ? TP.now() : Date.now()) + (STATE?.clockOffset || 0);   // the show clock, shared with the control
const TZ = () => C.tz(AG);
const logo = (dark) => C.url(dark ? 'brand/logos/goa-signature-white.png' : 'brand/logos/alberta-logo.svg');
const E = () => AG.event || {};
const accentOf = (r) => C.accentVar(r.scene.accent || r.day.accent || 'blue');
const sampleTag = (r) => (r.scene.sample || r.seg.sample || AG.sample ? el('div', 'sample', null, 'Sample content') : null);
function foot(dark) {
  const a = el('div', 'foot-anchor'); const parts = (E().anchor || '').replace(/^Anchored by the /, 'Anchored by the|').split('|');
  parts.forEach((p, i) => { if (i) a.append(el('br')); a.append(p); });
  const l = el('div', 'foot-logo'); const img = el('img'); img.src = logo(dark); img.alt = 'Government of Alberta'; l.append(img);
  return [a, l];
}
const speakerLine = (s) => [s.role, s.org].filter(Boolean).join(' · ');
const timeRange = (seg) => seg.start ? C.fmtHM(seg.start) + (seg.end ? '–' + C.fmtHM(seg.end) : '') : '';

// ---------- scenes ----------
const SCENES = {};

// walk-in holding loop: day card, live countdown to the first item, "up next" ticker, clock
SCENES.holding = (r) => {
  const tr = traces({ sets: SETS.frame, flow: true });
  const d = r.day, nx = C.upNext(AG, r.dayIndex, r.segIndex);
  const kick = el('div', 'kick', { '--acc': accentOf(r), justifyContent: 'center' }, el('i'), `${d.label || 'Day ' + (r.dayIndex + 1)} · ${d.name || ''}`);
  const ev = el('div', 'meta', { textAlign: 'center', color: 'var(--navy)', fontSize: '40px' }, E().name || 'Agency 2026');
  const title = el('div', 'h-l', { textAlign: 'center', maxWidth: '1180px', fontSize: '128px' }, d.title || '');
  const sub = el('div', 'sub', { textAlign: 'center' }, d.sub || '');
  const place = el('div', 'meta', { textAlign: 'center' }, d.place || '');
  const starts = el('div', 'meta', { textAlign: 'center', color: 'var(--red)', marginTop: '18px' });
  const col = el('div', 'abs', { left: '420px', right: '420px', top: '150px', bottom: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }, ev, kick, title, sub, place, starts);
  // ticker: the rest of the day
  const items = d.segments.slice(r.segIndex + 1).filter((s) => !['countdown', 'holding'].includes(s.type)).slice(0, 8);
  const tick = el('div', 'tick'), rows = items.map((s) => el('div', null, null, el('b', null, null, C.fmtHM(s.start)), s.title));
  tick.append(...rows);
  const clock = el('div', 'clock'), img = el('img'); img.src = logo(true);
  const band = el('div', 'band', null, el('div', 'lab', null, 'TODAY'), tick, clock, img);
  const root = el('div', 'layer scene', null, tr.el, col, band, sampleTag(r));
  return { el: root, tick(t) {
    tr.draw(t); rise(ev, t, 0.3); rise(kick, t, 0.45); rise(title, t, 0.6, 50); rise(sub, t, 0.8); rise(place, t, 0.9); rise(starts, t, 1.0);
    const target = STATE?.countdown?.target ?? (nx ? C.segStart(AG, r.dayIndex, nx.index) : null);
    starts.textContent = target ? (target - now() > 0 ? `The program begins at ${C.fmtTime(target, TZ())} · in ${C.fmtDur(target - now())}` : 'The program begins now') : '';
    clock.textContent = C.fmtTime(now(), TZ());
    const n = rows.length, k = n ? Math.floor(t / 5) % n : 0, lt = t % 5;
    rows.forEach((row, i) => { const inP = i === k ? eo5(seg(lt, 0, 0.5)) : 0, outP = i === k ? ei(seg(lt, 4.5, 5)) : 0;
      row.style.opacity = i === k ? inP * (1 - outP) : 0; row.style.transform = `translateY(${((1 - inP) * 40 - outP * 40).toFixed(1)}px)`; });
  } };
};

// event opening (MG-01's timeline, live): traces fire in, "Agency" letters rise, 2026 slides up, date clips in, cities, host line
SCENES.opening = (r) => {
  const tr = traces({ sets: SETS.frame, flow: true });
  const ag = letters((E().name || 'Agency 2026').split(' ')[0], 'h-xl'), yr = el('div', 'h-xl', null, (E().name || 'Agency 2026').split(' ')[1] || '');
  const yrBox = el('div', null, { overflow: 'hidden', lineHeight: 1 }, yr);
  const date = el('div', null, { fontSize: '70px', fontWeight: 700, color: 'var(--red)', marginTop: '32px' }, E().dates || '');
  const city = el('div', null, { fontSize: '64px', fontWeight: 700, marginTop: '10px' }, E().cities || '');
  const host = el('div', 'caps', { fontSize: '26px', position: 'absolute', top: '120px', left: 0, right: 0, textAlign: 'center' }, E().hostLine || '');
  const col = el('div', 'abs', { inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }, ag, yrBox, date, city);
  const [fa, fl] = foot(false);
  const root = el('div', 'layer scene', null, tr.el, host, col, fa, fl);
  return { el: root, tick(t) {
    tr.draw(t); ag.anim(t, 1.05); yr.style.transform = `translateY(${((1 - eo5(seg(t, 1.55, 1.95))) * 105).toFixed(2)}%)`;
    clipIn(date, t, 2.15); rise(city, t, 2.45, 30, 0.35); rise(host, t, 2.9); rise(fa, t, 3.2, 20); rise(fl, t, 3.3, 20);
  } };
};

// countdown to the next session (MG-04 look): navy, flowing traces, ticking seconds, gradient bar
SCENES.countdown = (r) => {
  const tr = traces({ sets: SETS.edge, flow: true, nodeFill: 'var(--navy)', opacity: 0.55 });
  const nx = r.scene.next != null ? { seg: r.day.segments[r.scene.next], index: r.scene.next } : C.upNext(AG, r.dayIndex, r.segIndex);
  const lab = el('div', 'caps', { fontSize: '36px' }, r.scene.label || 'Next session begins in');
  const mm = el('span'), ss = el('span', null, { display: 'inline-block' }), num = el('div', 'count-num', null, mm, ss);
  const ttl = el('div', null, { fontSize: '62px', fontWeight: 700, color: 'var(--yellow)', marginTop: '14px', textAlign: 'center', maxWidth: '1300px', textWrap: 'balance' }, r.scene.nextTitle || nx?.seg.title || '');
  const room = el('div', 'meta', { marginTop: '16px', fontSize: '36px' }, nx?.seg.room || r.day.place || '');
  const col = el('div', 'abs', { inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }, lab, num, ttl, room);
  const bar = el('div', 'count-bar');
  const root = el('div', 'layer scene dark', null, tr.el, col, bar, sampleTag(r));
  let span = null;
  const target = () => STATE?.countdown?.target ?? (r.scene.target ? C.at(r.day.date, r.scene.target, TZ()) : nx ? C.segStart(AG, r.dayIndex, nx.index) : now() + (r.scene.minutes ?? 5) * 60000);
  return { el: root, tick(t) {
    tr.draw(t); rise(lab, t, 0.2); rise(num, t, 0.35, 50); rise(ttl, t, 0.55); rise(room, t, 0.7);
    const rem = target() - now(); if (span == null) span = Math.max(60000, rem);
    if (rem <= 0) { mm.textContent = r.scene.atZero || 'Starting now'; ss.textContent = ''; num.style.fontSize = '170px'; }
    else { const s = Math.ceil(rem / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
      mm.textContent = h ? `${h}:${String(m).padStart(2, '0')}:` : `${m}:`; ss.textContent = String(x).padStart(2, '0'); num.style.fontSize = '';
      const tk = eo(cl(((rem / 1000) % 1 === 0 ? 0 : 1 - (rem / 1000) % 1) / 0.22)); ss.style.opacity = 0.25 + 0.75 * tk; ss.style.transform = `translateY(${((1 - tk) * -0.12).toFixed(3)}em)`; }
    bar.style.width = `${(100 * cl(rem / span)).toFixed(2)}%`;
  } };
};

// session / demo title card
SCENES.title = (r) => {
  const sc = r.scene, tr = traces({ sets: SETS.edge, flow: false, opacity: 0.9 });
  const kick = el('div', 'kick', { '--acc': accentOf(r) }, el('i'), [sc.kicker || ({ demo: 'Live demo', session: 'Session' })[sc.segType] || 'Session', timeRange(r.seg)].filter(Boolean).join(' · '));
  const title = el('div', 'h-l', { maxWidth: '1240px' }, sc.title || '');
  const subText = sc.subtitle || (sc.what ? sc.what[0].toUpperCase() + sc.what.slice(1) : '');
  const sub = subText ? el('div', 'sub', { maxWidth: '1200px' }, subText) : null;
  const team = sc.team ? el('div', 'meta', { color: 'var(--red)' }, `Built by ${sc.team}`) : null;
  const sp = (sc.speakers || []).slice(0, 4).map((s) => el('div', null, { display: 'flex', alignItems: 'baseline', gap: '18px', fontSize: '40px' }, el('b', null, { fontWeight: 700 }, s.name), el('span', null, { color: 'var(--ink2)', fontSize: '32px' }, speakerLine(s))));
  const spBox = sp.length ? el('div', null, { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '26px' }, sp) : null;
  const room = el('div', 'meta', { marginTop: '24px' }, sc.room || r.day.place || '');
  const col = el('div', 'abs', { left: '400px', right: '360px', top: 0, bottom: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '18px' }, kick, title, sub, team, spBox, room);
  const [fa, fl] = foot(false);
  const root = el('div', 'layer scene', null, tr.el, col, fa, fl, sampleTag(r));
  const parts = [kick, title, sub, team, spBox, room].filter(Boolean);
  return { el: root, tick(t) { tr.draw(t * 1.2); parts.forEach((p, i) => slideIn(p, t, 0.35 + i * 0.1, 70)); rise(fa, t, 0.8, 16); rise(fl, t, 0.9, 16); } };
};

// speaker welcome: full-screen intro card on night, name letters rise, the accent line draws to a pad
SCENES.intro = (r) => {
  const sc = r.scene, s = (sc.speakers || [])[sc.speaker ?? 0] || { name: sc.title || '' };
  const tr = traces({ sets: SETS.frame, flow: true, nodeFill: 'var(--night)', opacity: 0.7 });
  const kick = el('div', 'caps', { fontSize: '34px', color: 'var(--yellow)' }, sc.kicker || 'Please welcome');
  const nm = letters(s.name, null, { fontSize: s.name.length > 18 ? `${Math.max(84, Math.round(2100 / s.name.length))}px` : '140px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05, justifyContent: 'flex-start' });
  const line = el('div', null, { height: '13px', width: '0', background: 'linear-gradient(90deg,var(--plum),var(--blue) 55%,var(--cyan))', marginTop: '26px', position: 'relative' });
  const node = el('div', null, { position: 'absolute', right: '-17px', top: '-11px', width: '35px', height: '35px', borderRadius: '50%', background: '#fff', border: '8px solid var(--cyan)', boxSizing: 'border-box' }); line.append(node);
  const role = el('div', 'sub', { marginTop: '30px', color: '#fff' }, s.role || '');
  const org = el('div', 'meta', { marginTop: '6px', fontSize: '40px' }, s.org || '');
  const what = sc.title && s.name !== sc.title ? el('div', 'meta', { marginTop: '46px', color: 'var(--yellow)', fontSize: '34px' }, sc.title) : null;
  const col = el('div', 'abs', { left: '420px', right: '360px', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }, kick, nm, line, role, org, what);
  const root = el('div', 'layer scene night', null, tr.el, col, sampleTag(r));
  return { el: root, tick(t) {
    tr.draw(t); rise(kick, t, 0.2); nm.anim(t, 0.45, 0.035); line.style.width = `${(Math.min(1100, 60 + s.name.length * 52) * eo5(seg(t, 0.9, 1.6))).toFixed(1)}px`;
    node.style.opacity = seg(t, 1.3, 1.6); rise(role, t, 1.2); rise(org, t, 1.35); if (what) rise(what, t, 1.6);
  } };
};

// panel: title + speaker cards
SCENES.panel = (r) => {
  const sc = r.scene, sp = sc.speakers || [], n = Math.max(1, Math.min(sp.length, 5));
  const kick = el('div', 'kick', { '--acc': accentOf(r) }, el('i'), [sc.kicker || 'Panel', timeRange(r.seg)].filter(Boolean).join(' · '));
  const title = el('div', 'h-m', { maxWidth: '1500px' }, sc.title || '');
  const cards = sp.map((s, i) => el('div', 'card', { '--acc': C.accentVar(s.accent || ['blue', 'pink', 'orange', 'green', 'plum'][i % 5]) },
    s.moderator ? el('div', 'flag', null, 'Moderator') : null, el('div', 'n', null, s.name), el('div', 'r', null, speakerLine(s))));
  const grid = el('div', 'cards', { gridTemplateColumns: `repeat(${n},1fr)`, marginTop: '56px' }, cards);
  const col = el('div', 'abs', { left: '150px', right: '150px', top: 0, bottom: '90px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }, kick, title, grid);
  const [fa, fl] = foot(false);
  const tr = traces({ sets: SETS.top, flow: false, opacity: 0.7 });
  const root = el('div', 'layer scene ground', null, tr.el, col, fl, sampleTag(r));
  return { el: root, tick(t) { tr.draw(t); slideIn(kick, t, 0.3); slideIn(title, t, 0.42); cards.forEach((c, i) => rise(c, t, 0.6 + i * 0.09, 50)); rise(fl, t, 0.9, 16); } };
};

// slides: an image per step, crossfaded; the operator steps them from the control (or a clicker)
SCENES.slides = (r) => {
  const root = el('div', 'layer scene black'), urls = r.scene.slideUrls;
  const imgs = new Map(); let cur = null;
  const show = (i, fast) => {
    const u = urls[Math.max(0, Math.min(i, urls.length - 1))]; if (!u) return;
    let im = imgs.get(u); if (!im) { im = el('img', 'slide-img'); im.src = u; im.decoding = 'async'; imgs.set(u, im); }
    if (cur === im) return;
    im.style.transition = fast ? 'none' : 'opacity .35s ease'; im.style.opacity = 0; root.append(im);
    const old = cur; cur = im; requestAnimationFrame(() => { im.style.opacity = 1; });
    if (old) setTimeout(() => { if (old !== cur) old.remove(); }, 420);
    // decode the next two ahead
    for (const k of [i + 1, i + 2]) if (urls[k] && !imgs.has(urls[k])) { const p = el('img', 'slide-img'); p.src = urls[k]; imgs.set(urls[k], p); }
  };
  show(r.slide, true);
  if (!urls.length) root.append(el('div', 'abs', { inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '40px' }, 'No slides listed for this segment'));
  return { el: root, tick() {}, cmd(c) { if (c.slide != null) show(c.slide); } };
};

// video with sound; ends -> tells the control (which advances when the agenda says autoAdvance)
SCENES.video = (r) => {
  const v = el('video', 'media'); v.src = C.url(r.scene.video?.src || r.scene.video || ''); v.preload = 'auto'; v.playsInline = true;
  v.muted = !PROGRAM || r.scene.video?.muted === true; v.loop = !!r.scene.video?.loop;
  const root = el('div', 'layer scene black', null, v);
  if (PROGRAM && mixer?.ctx) { try { mixer.attachVideo(v); } catch (e) { console.warn(e); } }
  let sent = false, lastFix = 0;
  v.addEventListener('ended', () => { if (PROGRAM && !sent) { sent = true; mixer?.duck(false); TP?.send('ended', { step: Eng.stepKey(STATE) }).catch(() => {}); } });
  v.addEventListener('play', () => { if (PROGRAM && !v.muted) mixer?.duck(true); });
  v.addEventListener('pause', () => { if (PROGRAM) mixer?.duck(false); });
  // the video follows the shared state: playing or paused, and where (show clock), so every screen agrees
  const follow = () => {
    const tg = Eng.videoTarget(STATE, now()); if (!tg || !isFinite(v.duration || NaN)) return;
    const want = Math.min(tg.pos, Math.max(0, (v.duration || 0) - 0.05)), drift = Math.abs(v.currentTime - want);
    if (tg.playing) {
      if (v.paused && !v.ended && tg.pos < (v.duration || 1e9)) { if (drift > 0.25) v.currentTime = want; v.play().catch((e) => console.warn('video', e.message)); }
      else if (drift > 0.6 && performance.now() - lastFix > 2000 && !v.ended) { lastFix = performance.now(); v.currentTime = want; }
    } else { if (!v.paused) v.pause(); if (drift > 0.1) v.currentTime = want; }
  };
  v.addEventListener('loadedmetadata', follow);
  return { el: root, video: v, enter: follow, tick: follow, exit() { v.pause(); if (PROGRAM) mixer?.duck(false); } };
};

// break / lunch: return time with a live countdown, up next
SCENES.break = (r) => {
  const sc = r.scene, nx = C.upNext(AG, r.dayIndex, r.segIndex);
  const backAt = sc.resume ? C.at(r.day.date, sc.resume, TZ()) : C.segEnd(AG, r.dayIndex, r.segIndex);
  const tr = traces({ sets: SETS.low, flow: true, opacity: 0.85 });
  const kick = el('div', 'kick', { '--acc': accentOf(r) }, el('i'), sc.kicker || (r.day.label || `Day ${r.dayIndex + 1}`) + ' · ' + (r.day.name || ''));
  const big = el('div', 'h-xl', { fontSize: '230px' }, sc.title || (sc.segType === 'lunch' ? 'Lunch' : 'Break'));
  const ret = el('div', 'sub', { fontWeight: 700, marginTop: '12px' });
  const nxt = nx ? el('div', 'meta', { marginTop: '40px', fontSize: '38px', maxWidth: '1300px' }, el('span', null, { color: 'var(--red)' }, 'Up next  '), `${C.fmtHM(nx.seg.start)} · ${nx.seg.title}`) : null;
  const col = el('div', 'abs', { left: '200px', right: '200px', top: '40px', bottom: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, kick, big, ret, nxt);
  const [, fl] = foot(false);
  const root = el('div', 'layer scene ground', null, tr.el, col, fl, sampleTag(r));
  fl.style.bottom = 'auto'; fl.style.top = '70px';
  return { el: root, tick(t) {
    tr.draw(t); rise(kick, t, 0.3); rise(big, t, 0.42, 60); rise(ret, t, 0.6); if (nxt) rise(nxt, t, 0.75); rise(fl, t, 0.9, 10);
    const rem = backAt - now(); ret.textContent = rem > 0 ? `The program resumes at ${C.fmtTime(backAt, TZ())} · ${C.fmtDur(rem)}` : 'The program resumes now';
  } };
};

// day bumper (MG-02, one day): the day colour wipes off to reveal the day card
SCENES.bumper = (r) => {
  const d = r.day, acc = accentOf(r), tr = traces({ sets: SETS.frame, flow: true });
  const kick = el('div', 'kick', { '--acc': acc }, el('i'), `${d.label || 'Day ' + (r.dayIndex + 1)} · ${d.name || ''}`);
  const title = el('div', 'h-l', { fontSize: '128px', maxWidth: '1200px' }, d.title || '');
  const sub = el('div', 'sub', null, d.sub || ''), place = el('div', 'meta', null, d.place || '');
  const col = el('div', 'abs', { left: '440px', right: '400px', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '22px' }, kick, title, sub, place);
  const wipe = el('div', 'abs', { inset: 0, background: acc });
  const [fa, fl] = foot(false);
  const root = el('div', 'layer scene', null, tr.el, col, fa, fl, wipe);
  return { el: root, tick(t) {
    tr.draw(t - 0.3); wipe.style.transform = `translateX(${(100 * eo5(seg(t, 0.15, 0.6))).toFixed(2)}%)`;
    [kick, title, sub, place].forEach((p, i) => slideIn(p, t, 0.5 + i * 0.1, 80)); rise(fa, t, 0.9, 14); rise(fl, t, 1.0, 14);
  } };
};

// stat reveal (MG-05 look): a counter runs up while nodes pop into a grid
SCENES.stat = (r) => {
  const sc = r.scene, n = Math.max(1, Math.round(+sc.value || 40)), cells = Math.min(n, 60);
  const big = el('div', null, { fontSize: '460px', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em' });
  const lab = el('div', null, { fontSize: '84px', fontWeight: 700, marginTop: '30px' }, sc.label || '');
  const by = el('div', null, { fontSize: '42px', fontWeight: 700, color: 'var(--red)', marginTop: '18px' }, sc.sub || '');
  const left = el('div', 'abs', { left: '154px', top: 0, bottom: 0, width: '900px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, big, lab, by);
  const colors = ['--blue', '--pink', '--orange', '--yellow', '--green', '--plum', '--cyan'];
  const sq = Array.from({ length: cells }, (_, i) => el('div', null, { width: '62px', height: '62px', background: `var(${colors[(i * 3) % 7]})`, transform: 'scale(0)' }));
  const grid = el('div', null, { display: 'grid', gridTemplateColumns: `repeat(${cells > 40 ? 10 : 8},62px)`, gap: '21px' }, sq);
  const right = el('div', 'abs', { right: '154px', top: 0, bottom: 0, display: 'flex', alignItems: 'center' }, grid);
  const root = el('div', 'layer scene', null, left, right, sampleTag(r));
  return { el: root, tick(t) {
    big.textContent = String(Math.round(n * eo(seg(t, 0.3, 1.7)))); rise(lab, t, 1.2, 38, 0.4); rise(by, t, 1.45, 38, 0.4);
    sq.forEach((s, i) => { s.style.transform = `scale(${back(seg(t, 0.3 + i * 0.033, 0.55 + i * 0.033)).toFixed(3)})`; });
  } };
};

// thanks: names in columns (sponsors, partners, teams)
SCENES.thanks = (r) => {
  const sc = r.scene, names = sc.names || [];
  const kick = el('div', 'kick', { '--acc': accentOf(r) }, el('i'), sc.kicker || 'With thanks');
  const title = el('div', 'h-m', null, sc.title || 'Thank you');
  const list = el('div', null, { columnCount: names.length > 8 ? 3 : 2, columnGap: '80px', marginTop: '50px', fontSize: '40px', fontWeight: 700, lineHeight: 1.7 }, names.map((x) => el('div', null, { breakInside: 'avoid' }, x)));
  const col = el('div', 'abs', { left: '420px', right: '400px', top: 0, bottom: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, kick, title, list);
  const tr = traces({ sets: SETS.edge, opacity: 0.8 }), [fa, fl] = foot(false);
  const root = el('div', 'layer scene', null, tr.el, col, fa, fl, sampleTag(r));
  return { el: root, tick(t) { tr.draw(t); rise(kick, t, 0.3); rise(title, t, 0.42); [...list.children].forEach((c, i) => rise(c, t, 0.6 + i * 0.06, 24)); rise(fl, t, 0.9, 14); } };
};

// closing: thank you, the event tagline, the lockup
SCENES.closing = (r) => {
  const sc = r.scene, tr = traces({ sets: SETS.frame, flow: true });
  const ty = letters(sc.title || 'Thank you', 'h-xl', { fontSize: '210px' });
  const tag = el('div', null, { fontSize: '66px', fontWeight: 700, color: 'var(--red)', marginTop: '36px', textAlign: 'center', maxWidth: '1200px', textWrap: 'balance' }, sc.subtitle ?? E().tagline ?? '');
  const lock = el('div', 'meta', { marginTop: '40px', color: 'var(--navy)', fontSize: '40px' }, [E().name, E().dates, E().cities].filter(Boolean).join(' · '));
  const host = el('div', 'caps', { fontSize: '26px', position: 'absolute', top: '120px', left: 0, right: 0, textAlign: 'center' }, E().hostLine || '');
  const col = el('div', 'abs', { inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }, ty, tag, lock);
  const [fa, fl] = foot(false);
  const root = el('div', 'layer scene', null, tr.el, host, col, fa, fl);
  return { el: root, tick(t) { tr.draw(t); ty.anim(t, 0.5, 0.04); clipIn(tag, t, 1.1, 0.5); rise(lock, t, 1.5); rise(host, t, 1.7); rise(fa, t, 1.9, 14); rise(fl, t, 2.0, 14); } };
};

// ---------- transitions (cover the swap; the new scene's clock starts at the cover point) ----------
const transEl = $('#trans');
const TRANS = {
  // a band of coloured bars races across (the MVAI "bus sweep")
  sweep: { cover: 0.42, dur: 0.95, build() {
    const cols = ['--plum', '--blue', '--cyan', '--pink', '--orange', '--yellow', '--green', '--navy', '--lilac', '--blue', '--red', '--navy'];
    let y = 0; const bars = cols.map((c, i) => { const h = i % 3 === 1 ? 140 : 70 + (i * 37) % 60; const b = el('div', 'bar', { top: `${y}px`, height: `${h + 2}px`, background: `var(${c})`, transform: 'translateX(-101%)' }); y += h; return b; });
    const last = bars[bars.length - 1]; last.style.height = `${1080 - parseFloat(last.style.top) + 2}px`;
    transEl.append(...bars);
    return (t) => bars.forEach((b, i) => { const d = i * 0.022; const a = eo5(seg(t, d, 0.4 + d)), z = ei(seg(t, 0.5 + d, 0.9 + d)); b.style.transform = `translateX(${(-101 + 101 * a + 101 * z).toFixed(2)}%)`; });
  } },
  // one panel in the segment's accent slides in and out (the day bumpers' wipe)
  wipe: { cover: 0.36, dur: 0.8, build(acc) {
    const p = el('div', 'bar', { top: 0, height: '1080px', background: acc || 'var(--blue)', transform: 'translateX(-101%)' }); transEl.append(p);
    return (t) => { const a = eo5(seg(t, 0, 0.36)), z = eo5(seg(t, 0.36, 0.8)); p.style.transform = `translateX(${(t < 0.36 ? -101 + 101 * a : 101 * z).toFixed(2)}%)`; };
  } },
  fade: { cover: 0, dur: 0.6, crossfade: true },
  cut: { cover: 0, dur: 0 },
};

// ---------- runtime ----------
let current = null, startedAt = 0, frozenAt = null, transition = null, onAir = null, lastRev = -1;
const stepKey = (s) => s ? `${s.day}.${s.seg}.${s.scene}` : '';
const clockT = () => ((frozenAt ?? performance.now()) - startedAt) / 1000;

function mount(r) {
  const make = SCENES[r.scene.type] || SCENES.title;
  const sc = make(r); sc.key = `${r.dayIndex}.${r.segIndex}.${r.sceneIndex}`; sc.r = r;
  return sc;
}
function go(step, how) {
  const r = C.resolve(AG, step); if (!r) return;
  const key = stepKey(step);
  if (current && current.key === key) { current.cmd?.({ slide: step.slide }); return; }
  const tn = TRANS[how || r.scene.transition || 'fade'] || TRANS.fade;
  const next = mount(r);
  const swap = () => {
    const old = current; current = next; startedAt = performance.now(); if (frozenAt != null) frozenAt = startedAt;
    scenesEl.append(next.el);
    if (tn.crossfade && old) { next.el.style.opacity = 0; next.el.style.transition = `opacity ${tn.dur}s ease`; requestAnimationFrame(() => (next.el.style.opacity = 1)); setTimeout(() => { old.exit?.(); old.el.remove(); }, tn.dur * 1000 + 50); }
    else if (old) { old.exit?.(); old.el.remove(); }
    next.enter?.(); next.tick(0);
  };
  if (!tn.build || !current) { swap(); return; }
  transEl.innerHTML = ''; const draw = tn.build(accentOf(r)), t0 = performance.now(); let swapped = false;
  transition = (nowMs) => { const t = (nowMs - t0) / 1000; draw(t); if (!swapped && t >= tn.cover) { swapped = true; swap(); } if (t >= tn.dur) { transition = null; transEl.innerHTML = ''; } };
}

// lower third (MG-03): tag clips in, plate opens, name and role slide, accent line draws to a pad; reverse on hide
const lowerEl = $('#lower'); let lower = null;
function lowerShow(s) {
  lowerEl.innerHTML = ''; lowerEl.hidden = false;
  const tag = el('div', 'tag', null, (AG.event?.name || 'Agency 2026').toUpperCase());
  const plate = el('div', 'plate'), nm = el('div', 'nm', null, s.name || ''), rl = el('div', 'rl', null, speakerLine(s));
  plate.append(nm, rl); const ln = el('div', 'ln'), nd = el('div', 'nd'); lowerEl.append(tag, plate, ln, nd);
  // fit the plate to the text
  const w = Math.max(700, Math.min(1500, 100 + Math.max(s.name.length * 36, speakerLine(s).length * 18)));
  lower = { tag, plate, nm, rl, ln, nd, w, t0: performance.now(), out: null };
}
function lowerHide() { if (lower && !lower.out) lower.out = performance.now(); }
function lowerTick(nowMs) {
  if (!lower) return;
  const t = (nowMs - lower.t0) / 1000, o = lower.out ? (nowMs - lower.out) / 1000 : 0, W = lower.w;
  const line = eo5(seg(t, 0.1, 0.5)) * (1 - ei(seg(o, 0.35, 0.75))), plate = eo5(seg(t, 0.35, 0.7)) * (1 - ei(seg(o, 0.15, 0.55))), fade = 1 - ei(seg(o, 0, 0.3));
  const nm = eo(seg(t, 0.5, 0.85)) * fade, rl = eo(seg(t, 0.62, 0.95)) * fade, tg = eo5(seg(t, 0.55, 0.8)) * fade;
  lower.tag.style.clipPath = `inset(0 ${100 - 100 * tg}% 0 0)`; lower.plate.style.width = `${(W * 0.88 * plate).toFixed(1)}px`;
  lower.nm.style.opacity = nm; lower.nm.style.transform = `translateX(${(1 - nm) * -58}px)`; lower.rl.style.opacity = rl; lower.rl.style.transform = `translateX(${(1 - rl) * -58}px)`;
  lower.ln.style.width = `${(W * line).toFixed(1)}px`; lower.nd.style.left = `${(W * line - 17).toFixed(1)}px`; lower.nd.style.opacity = line > 0.02 ? 1 : 0;
  if (lower.out && o > 0.8) { lower = null; lowerEl.hidden = true; lowerEl.innerHTML = ''; }
}

function frame(nowMs) {
  if (transition) transition(nowMs);
  if (current && frozenAt == null) current.tick(clockT());
  lowerTick(nowMs);
  requestAnimationFrame(frame);
}

function fit() { const s = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${s})`; }
addEventListener('resize', fit); fit();

// ---------- state from the transport ----------
let shownLower = null;
function applyTheme(name) {
  const v = C.themeVars(T, name); for (const [k, x] of Object.entries(v)) stage.style.setProperty(k, x);
  stage.dataset.theme = name;
}
async function apply(m) {
  const s = m.state, firstApply = !STATE;
  if (TP.agenda !== AG) { AG = TP.agenda; CUES = await C.loadCues(AG); if (mixer) { mixer.cues = CUES; mixer.preload(C.url); } preloadAhead(s); }
  const theme = THEME || s.theme || 'compliant', themeChanged = theme !== stage.dataset.theme;
  if (themeChanged) applyTheme(theme);
  const prev = STATE; STATE = s;
  const step = MODE === 'preview' ? (s.preview || s) : s;
  if (themeChanged && current) { current.el.remove(); current = null; }
  const prevStep = prev ? (MODE === 'preview' ? (prev.preview || prev) : prev) : null;
  go(step, firstApply || m.snapshot && !prevStep ? 'cut' : segTransition(step, prevStep));
  if (MODE !== 'preview') {
    $('#black').classList.toggle('on', !!s.blackout);
    if (!!s.freeze !== (frozenAt != null)) { if (s.freeze) frozenAt = performance.now(); else { startedAt += performance.now() - frozenAt; frozenAt = null; } }
  }
  if (PROGRAM && mixer?.ready) {
    mixer.setMaster(s.master ?? 1, !!s.mute);
    if ((s.bed?.id ?? null) !== (mixer.bed?.id ?? null)) mixer.playBed(s.bed?.id ?? null, s.bed?.vol ?? 1);
    else if (s.bed && mixer.bed && s.bed.vol !== mixer.bed.vol) mixer.bedVol(s.bed.vol);
  }
  // one-off events run once, live only: a snapshot after a reconnect never replays a sting
  if (!m.snapshot) for (const e of m.events || []) {
    if (e.type === 'reload') location.reload();
    if (!PROGRAM) continue;
    if (e.type === 'fire') { await unlockAudio(); mixer?.fire(e.id, e.vol ?? 1); }
    if (e.type === 'stopfx') mixer?.stopFx();
  }
  $('#wait').hidden = !(TP.code && s.rev === 0 && MODE === 'program');
  if (s.preview) preloadAhead(s);
}
// fetch the next step's slides and video ahead so they start at once
const ahead = new Set();
function preloadAhead(s) {
  if (!AG || !s) return;
  for (const st of [s.preview, C.nextStep(AG, Eng.stepOf(s))]) {
    const r = st && C.resolve(AG, st); if (!r) continue;
    for (const u of [...r.scene.slideUrls.slice(st.slide || 0, (st.slide || 0) + 2), r.scene.video ? C.url(r.scene.video.src || r.scene.video) : null].filter(Boolean)) {
      if (ahead.has(u)) continue; ahead.add(u);
      if (/\.(mp4|webm|mov)$/i.test(u)) fetch(u, { headers: { Range: 'bytes=0-2000000' } }).catch(() => {}); else { const im = new Image(); im.src = u; }
    }
  }
}
// between segments use the scene's transition, else sweep; within a segment, fade
function segTransition(step, prev) {
  const r = C.resolve(AG, step); if (!r) return 'fade';
  if (r.scene.transition) return r.scene.transition;
  if (!prev || prev.day !== step.day || prev.seg !== step.seg) return 'sweep';
  return 'fade';
}
// the lower third is a function of the show clock (state.lower.at / until), so every screen shows and hides it together
function lowerFollow() {
  if (MODE === 'preview' || !STATE) return;
  const on = Eng.lowerVisible(STATE, now()), key = on ? `${STATE.lower.speaker?.name}|${STATE.lower.at}` : null;
  if (on && key !== shownLower) { shownLower = key; lowerShow(STATE.lower.speaker); }
  else if (!on && shownLower) { shownLower = null; lowerHide(); }
}
setInterval(lowerFollow, 100);

// ---------- sound ----------
async function unlockAudio() {
  if (!PROGRAM) return false;
  if (!mixer) { mixer = new Mixer(CUES, { urlOf: C.url }); }
  const ok = await mixer.unlock();
  if (ok && !mixer._loaded) { mixer._loaded = true; mixer.cues = CUES; mixer.preload(C.url); if (current?.video) mixer.attachVideo(current.video); if (STATE) { mixer.setMaster(STATE.master ?? 1, !!STATE.mute); if (STATE.bed) mixer.playBed(STATE.bed.id, STATE.bed.vol ?? 1); } }
  $('#unlock').classList.toggle('show', !ok);
  return ok;
}
$('#unlock').addEventListener('click', unlockAudio);
document.addEventListener('pointerdown', unlockAudio);
addEventListener('mousemove', () => { document.body.classList.add('cursor'); clearTimeout(window._cur); window._cur = setTimeout(() => document.body.classList.remove('cursor'), 1500); });

// status to the control (program only): sound, level, scene, video position
setInterval(() => {
  if (!PROGRAM || !TP) return;
  const v = current?.video;
  TP.status({ mode: MODE, audio: mixer?.ready ? 'on' : 'locked', level: mixer?.level?.() || 0, bed: mixer?.bed?.id || null, scene: current?.r?.scene.type,
    step: STATE ? Eng.stepKey(STATE) : null, rev: STATE?.rev ?? null, video: v ? { t: v.currentTime, d: v.duration || 0, paused: v.paused, audio: !v.muted } : null, clockOffset: Math.round(TP.offset), conn: TP.conn });
}, 500);

// ---------- start ----------
(async () => {
  T = await C.getJSON('brand/tokens/tokens.json');
  applyTheme(THEME || 'compliant');
  const code = C.qs('code', null);
  TP = Tr.create({ role: PROGRAM ? 'stage' : MODE, code, agendaUrl: C.qs('agenda', 'show/samples/agency-2026.json') });
  if (code) { $('#waitCode').textContent = code.toUpperCase(); $('#wait').hidden = !PROGRAM; }
  TP.onMessage((m) => { if (m.kind === 'state') apply(m).catch((e) => console.error(e)); if (m.kind === 'conn') $('#hud').textContent = `link: ${m.state}`; });
  window.SHOW_STAGE = { get state() { return STATE; }, get scene() { return current?.r?.scene.type; }, get mixer() { return mixer; }, get transport() { return TP; }, go, SCENES };
  requestAnimationFrame(frame);
  await TP.start();
  if (PROGRAM) setTimeout(unlockAudio, 300);
})().catch((e) => { document.body.innerHTML = `<pre style="color:#fff;padding:40px;font:24px/1.4 monospace;white-space:pre-wrap">Stage failed to start: ${e.message}</pre>`; console.error(e); });
