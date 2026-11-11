/* Agency 2026 show: shared core for stage.html and control.html (plain ES module, no dependencies).
 * Loads the agenda and tokens, resolves the day into steps (segment -> scenes -> slides), keeps the show clock, and carries messages
 * between the control window and every stage window on one BroadcastChannel ("agency-show").
 *
 * State (owned by the control window, mirrored to every stage):
 *   { rev, agendaUrl, theme, day, seg, scene, slide,              // the step on air
 *     preview: {day, seg, scene, slide},                          // the step shown in the control's Preview monitor
 *     lower: {on, speaker, at} | null,                            // lower third
 *     blackout, freeze, mute, bed: {id, vol} | null, master,      // master volume 0..1
 *     countdown: {target: epoch ms} | null,                       // manual countdown override
 *     clockOffset,                                                // ms added to Date.now() (rehearsal clock)
 *     takenAt: epoch ms (show clock) when the step went on air, segStartedAt }
 */
export const CHANNEL = 'agency-show';
export const ROOT = new URL('../../', import.meta.url).href;           // repo root (the server serves it)
export const url = (p) => (/^(https?:|data:|blob:)/.test(p) ? p : new URL(String(p).replace(/^\//, ''), ROOT).href);

export async function getJSON(p) {
  const r = await fetch(url(p), { cache: 'no-store' });
  if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
  return r.json();
}

// ---------- time (America/Edmonton unless the agenda says otherwise) ----------
export function tzOffsetMs(epoch, tz) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(epoch)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(epoch / 1000) * 1000;
}
// "2026-12-07" + "09:30" in tz -> epoch ms
export function at(date, hhmm, tz) {
  const [y, m, d] = date.split('-').map(Number), [hh, mm] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  return guess - tzOffsetMs(guess - tzOffsetMs(guess, tz), tz);
}
export const fmtTime = (epoch, tz, o = {}) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour: 'numeric', minute: '2-digit', ...(o.seconds ? { second: '2-digit' } : {}) })
  .format(new Date(epoch)).replace('a.m.', 'a.m.').replace(/\s/g, ' ');
export const fmtHM = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); const ap = h < 12 ? 'a.m.' : 'p.m.'; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`; };
export const fmtDur = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };

// ---------- agenda -> steps ----------
// default scene list for each segment type (a segment may give its own "scenes")
const DEFAULT_SCENES = {
  holding: ['holding'], welcome: ['opening'], countdown: ['countdown'], session: ['title'], 'speaker-intro': ['intro'], panel: ['panel'],
  break: ['break'], lunch: ['break'], demo: ['title'], video: ['video'], slides: ['slides'], thanks: ['thanks'], sponsor: ['thanks'],
  closing: ['closing'], bumper: ['bumper'], stat: ['stat'],
};
export function scenesOf(seg) {
  if (Array.isArray(seg.scenes) && seg.scenes.length) return seg.scenes.map((s) => (typeof s === 'string' ? { type: s } : s));
  const base = (DEFAULT_SCENES[seg.type] || ['title']).map((type) => ({ type }));
  if (['session', 'demo', 'speaker-intro', 'panel'].includes(seg.type)) { if (seg.slides) base.push({ type: 'slides' }); if (seg.video) base.push({ type: 'video' }); }
  return base;
}
export function slideList(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src.map(url);
  if (src.images) return src.images.map(url);
  if (src.dir && src.pattern && src.count) return Array.from({ length: src.count }, (_, i) => url(src.dir.replace(/\/$/, '') + '/' + src.pattern.replace(/\{(n+)\}/, (_, n) => String(i + (src.start ?? 1)).padStart(n.length, '0'))));
  return [];
}
// the scene object as rendered: the scene's own fields over the segment's
export function resolve(agenda, step) {
  const day = agenda.days[step.day], seg = day?.segments[step.seg];
  if (!seg) return null;
  const scenes = scenesOf(seg), sc = scenes[Math.min(step.scene, scenes.length - 1)] || { type: 'title' };
  const merged = { ...seg, ...sc, type: sc.type, segType: seg.type, music: { ...(seg.music || {}), ...(sc.music || {}) } };
  merged.slideUrls = slideList(sc.slides ?? seg.slides);
  return { day, seg, scene: merged, scenes, dayIndex: step.day, segIndex: step.seg, sceneIndex: step.scene, slide: step.slide ?? 0 };
}
export function nextStep(agenda, s) {
  const r = resolve(agenda, s); if (!r) return s;
  if (r.scene.type === 'slides' && s.slide < r.scene.slideUrls.length - 1) return { ...s, slide: s.slide + 1 };
  if (s.scene < r.scenes.length - 1) return { ...s, scene: s.scene + 1, slide: 0 };
  if (s.seg < r.day.segments.length - 1) return { ...s, seg: s.seg + 1, scene: 0, slide: 0 };
  return s;
}
export function prevStep(agenda, s) {
  const r = resolve(agenda, s); if (!r) return s;
  if (r.scene.type === 'slides' && s.slide > 0) return { ...s, slide: s.slide - 1 };
  const last = (st) => { const q = resolve(agenda, st); return q && q.scene.type === 'slides' ? { ...st, slide: Math.max(0, q.scene.slideUrls.length - 1) } : st; };
  if (s.scene > 0) return last({ ...s, scene: s.scene - 1, slide: 0 });
  if (s.seg > 0) { const ps = scenesOf(r.day.segments[s.seg - 1]); return last({ ...s, seg: s.seg - 1, scene: ps.length - 1, slide: 0 }); }
  return s;
}
export const sameStep = (a, b) => a && b && a.day === b.day && a.seg === b.seg && a.scene === b.scene && (a.slide ?? 0) === (b.slide ?? 0);
export const tz = (agenda) => agenda.event?.timezone || 'America/Edmonton';
export const segStart = (agenda, d, i) => at(agenda.days[d].date, agenda.days[d].segments[i].start, tz(agenda));
export const segEnd = (agenda, d, i) => { const s = agenda.days[d].segments[i]; return at(agenda.days[d].date, s.end || s.start, tz(agenda)); };
// the next segment (after index i) that is a real programme item, for countdowns and "up next"
export function upNext(agenda, d, i) {
  const segs = agenda.days[d].segments;
  for (let k = i + 1; k < segs.length; k++) if (!['holding', 'countdown', 'bumper'].includes(segs[k].type)) return { seg: segs[k], index: k };
  return null;
}

// ---------- audio cues: merge cue files, later files win ----------
// Two cue formats are read: the show's own (in/out within a raw file, fade_in/fade_out, lufs = the raw file's measured loudness, which
// the mixer corrects to -16 LUFS) and brand/audio/cues.json (pre-cut, pre-mastered files: loudness_lufs is the level they were mastered
// to on purpose, so no correction; fade_in_s/fade_out_s). A cue with no file yet ("status": "to generate") is skipped, so an earlier
// file's cue with the same id stays in use until the real one exists.
export function normCue(c, from) {
  return { ...c, _from: from, fade_in: c.fade_in ?? c.fade_in_s, fade_out: c.fade_out ?? c.fade_out_s, label: c.label || c.id,
    kind: c.kind === 'bed' ? 'bed' : c.kind, loop: c.loop ?? c.kind === 'bed' };
}
export async function loadCues(agenda) {
  const files = [].concat(agenda.audio?.cueFiles || []), cues = {};
  for (const f of files) { try { const j = await getJSON(f); for (const c of j.cues || []) if (c.file) cues[c.id] = normCue(c, f); } catch (e) { console.warn('cue file skipped:', f, e.message); } }
  for (const c of agenda.audio?.cues || []) if (c.file) cues[c.id] = normCue(c, 'agenda');
  // voiced announcements: each clip (id <segment>-<formula>[-n]) becomes a one-shot cue that ducks the bed
  try {
    const v = await getJSON(`api/voice?path=${encodeURIComponent(agenda.audio?.voiceManifest || 'out/voice/manifest.json')}`);
    for (const c of v.clips || []) if (c.file) cues[c.id] = { id: c.id, file: c.file, kind: 'voice', label: c.intro, text: c.text, segment: c.segment, gain_db: c.gain_db ?? 0, fade_out: 0.2, duck_bed: true, _from: 'voice' };
  } catch {}
  return cues;
}

// ---------- tokens -> CSS variables for a theme ----------
// 'compliant' = the event team's template (Arial / Liberation Sans, tokens.compliant); 'mvai' = the MVAI kit (Inter, tokens.color)
export function themeVars(T, theme) {
  if (theme === 'mvai') {
    const c = T.color;
    return { '--navy': c.navy, '--red': c.maroon, '--blue': c.blue, '--pink': c.pink, '--orange': c.orange, '--yellow': c.yellow, '--green': c.green, '--plum': c.purple,
      '--cyan': c.cyan, '--lilac': c.lilac, '--rule': '#D0D1DB', '--ground': c.paper, '--ink2': c.mute, '--night': c.night,
      '--font': `"Inter", Arial, sans-serif`, '--mono': `"Geist Mono", Consolas, monospace`, '--wt': 800 };
  }
  const c = T.compliant.color;
  return { '--navy': c.navy, '--red': c.red, '--blue': c.blue, '--pink': c.pink, '--orange': c.orange, '--yellow': c.yellow, '--green': c.green, '--plum': c.plum,
    '--cyan': c.cyan, '--lilac': '#9E7BB5', '--rule': c.rule, '--ground': c.ground, '--ink2': '#3D4F63', '--night': '#0E2238',
    '--font': `"Liberation Sans", Arial, Helvetica, sans-serif`, '--mono': `"Liberation Mono", Consolas, monospace`, '--wt': 700 };
}
// accent name (tokens vocabulary or compliant vocabulary) -> CSS var
export const accentVar = (name) => `var(--${({ purple: 'plum', maroon: 'red', rose: 'pink', lime: 'green', navy2: 'navy' })[name] || name || 'blue'})`;

// ---------- channel ----------
export function channel(onMsg) {
  const ch = new BroadcastChannel(CHANNEL);
  ch.onmessage = (e) => onMsg(e.data);
  return { send: (m) => ch.postMessage(m), close: () => ch.close() };
}
export const STORE = 'agency-show-state';
export const save = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch {} };
export const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { return null; } };
export const qs = (k, d) => new URLSearchParams(location.search).get(k) ?? d;
