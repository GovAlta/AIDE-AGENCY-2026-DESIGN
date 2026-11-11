/* Agency 2026 show: the command engine. One pure function turns (state, command) into a new state plus one-off events (sounds,
 * reloads). The control window runs it itself in laptop mode; the show server runs it in event-code mode, so both behave the same.
 * Works in the browser and in Node (no DOM).
 *
 * Commands (args):
 *   next | back                          step forward (cues fire) / back (no cues)
 *   take {step}                          put a step on air (cues fire)
 *   select {step} | select {}            the Preview step (empty: the next step)
 *   lower {speaker, secs?} | lowerOff    lower third on (now, for secs or until off) / off
 *   blackout|freeze|mute {on}            toggles when on is left out
 *   master {v} | bed {id|null, vol?} | bedVol {vol}
 *   fire {id, vol?} | stopfx             sound pads
 *   video {action: play|pause|restart|seek, pos?}
 *   countdown {target|null}              epoch ms on the show clock, or back to agenda times
 *   clock {offset}                       rehearsal clock: ms added to real time
 *   theme {name} | reload | ended {step} (the stage reports a video ended)
 * Times inside state (segStartedAt, lower.at/until, video.startedAt, countdown.target) are on the show clock: real time + clockOffset.
 */
import * as C from './core.js';

export const stepOf = (S) => ({ day: S.day, seg: S.seg, scene: S.scene, slide: S.slide ?? 0 });
export const stepKey = (s) => (s ? `${s.day}.${s.seg}.${s.scene}` : '');

export function initial(agenda, o = {}) {
  const S = { rev: 0, theme: agenda.theme || 'compliant', day: o.day || 0, seg: 0, scene: 0, slide: 0, select: null, preview: null,
    lower: null, blackout: false, freeze: false, mute: false, master: 1, bed: null, countdown: null, clockOffset: 0,
    segStartedAt: null, video: null, lastTaken: null };
  S.preview = previewOf(S, agenda);
  return S;
}
export function previewOf(S, agenda) {
  if (S.select && !C.sameStep(S.select, S)) return { ...S.select };
  const n = C.nextStep(agenda, stepOf(S));
  return C.sameStep(n, S) ? stepOf(S) : n;
}
const videoPos = (v, t) => (!v ? 0 : v.state === 'playing' ? v.pos + Math.max(0, t - v.startedAt) / 1000 : v.pos);

export function apply(S0, cmd, a = {}, { agenda, now = Date.now() } = {}) {
  const S = JSON.parse(JSON.stringify(S0)), events = [];
  const t = now + (S.clockOffset || 0);
  const fire = (id, vol) => id && events.push({ type: 'fire', id, vol: vol ?? 1 });

  function take(step, forward) {
    const r0 = C.resolve(agenda, step); if (!r0) return false;
    const prevSeg = `${S.day}.${S.seg}`;
    Object.assign(S, { day: step.day, seg: step.seg, scene: step.scene, slide: step.slide ?? 0 });
    const r = C.resolve(agenda, stepOf(S));
    if (`${S.day}.${S.seg}` !== prevSeg) { S.segStartedAt = t; S.countdown = null; }
    const key = stepKey(S);
    if (S.lastTaken !== key) {
      const m = r.scene.music || {};
      if ('bed' in m) S.bed = m.bed ? { id: m.bed, vol: S.bed?.vol ?? 1 } : null;
      if (forward) { fire(m.sting); fire(m.walkup); }
      S.lower = null;
      if (r.scene.lowerThird && (r.scene.speakers || []).length) {
        const sp = r.scene.speakers[r.scene.lowerThird === true ? 0 : +r.scene.lowerThird || 0] || r.scene.speakers[0];
        const at = t + (r.scene.lowerDelay ?? 1.2) * 1000;
        S.lower = { on: true, speaker: sp, at, until: at + (r.scene.lowerSeconds ?? 8) * 1000 };
      }
      const v = r.scene.video;
      S.video = r.scene.type === 'video' && v ? { state: v.autoplay === false ? 'paused' : 'playing', pos: 0, startedAt: t } : null;
      S.freeze = false;
    }
    S.lastTaken = key;
    if (S.select && S.select.day === S.day && S.select.seg === S.seg) S.select = null;
    return true;
  }
  const toggle = (k) => { S[k] = a.on === undefined ? !S[k] : !!a.on; };

  switch (cmd) {
    case 'next': { const n = C.nextStep(agenda, stepOf(S)); if (!C.sameStep(n, S)) take(n, true); break; }
    case 'back': { const p = C.prevStep(agenda, stepOf(S)); if (!C.sameStep(p, S)) take(p, false); break; }
    case 'take': take({ slide: 0, ...a.step }, a.forward !== false); break;
    case 'select': S.select = a.step ? { slide: 0, ...a.step } : null; break;
    case 'lower': S.lower = a.speaker ? { on: true, speaker: a.speaker, at: t, until: a.secs ? t + a.secs * 1000 : null } : null; break;
    case 'lowerOff': if (S.lower) S.lower = { ...S.lower, on: false, until: t }; break;
    case 'blackout': toggle('blackout'); break;
    case 'mute': toggle('mute'); break;
    case 'freeze': {
      toggle('freeze');
      if (S.video) S.video = S.freeze ? { state: 'paused', pos: videoPos(S.video, t), startedAt: t, resume: S.video.state === 'playing' }
        : S.video.resume ? { state: 'playing', pos: S.video.pos, startedAt: t } : S.video;
      break;
    }
    case 'master': S.master = Math.max(0, Math.min(1, +a.v)); break;
    case 'bed': S.bed = a.id ? { id: a.id, vol: a.vol ?? S.bed?.vol ?? 1 } : null; break;
    case 'bedVol': if (S.bed) S.bed.vol = Math.max(0, Math.min(1, +a.vol)); break;
    case 'fire': fire(a.id, a.vol); break;
    case 'stopfx': events.push({ type: 'stopfx' }); break;
    case 'video': {
      const v = S.video || { state: 'paused', pos: 0, startedAt: t };
      const pos = videoPos(v, t);
      if (a.action === 'play') S.video = { state: 'playing', pos, startedAt: t };
      else if (a.action === 'pause') S.video = { state: 'paused', pos, startedAt: t };
      else if (a.action === 'restart') S.video = { state: 'playing', pos: 0, startedAt: t };
      else if (a.action === 'seek') S.video = { state: v.state, pos: Math.max(0, +a.pos || 0), startedAt: t };
      else if (a.action === 'toggle') S.video = { state: v.state === 'playing' ? 'paused' : 'playing', pos, startedAt: t };
      break;
    }
    case 'countdown': S.countdown = a.target ? { target: +a.target } : null; break;
    case 'clock': S.clockOffset = +a.offset || 0; break;
    case 'theme': S.theme = a.name === 'mvai' ? 'mvai' : 'compliant'; break;
    case 'reload': events.push({ type: 'reload' }); break;
    case 'ended': {
      const r = C.resolve(agenda, stepOf(S));
      if (r && a.step === stepKey(S) && r.scene.video?.autoAdvance !== false) { const n = C.nextStep(agenda, stepOf(S)); if (!C.sameStep(n, S)) take(n, true); }
      break;
    }
    default: throw new Error(`unknown command: ${cmd}`);
  }
  S.preview = previewOf(S, agenda);
  return { state: S, events };
}

// what the stage should show right now for the lower third and the video (both are functions of the show clock)
export const lowerVisible = (S, showNow) => !!(S?.lower && S.lower.on !== false ? showNow >= S.lower.at && (!S.lower.until || showNow < S.lower.until) : false);
export const videoTarget = (S, showNow) => (S?.video ? { playing: S.video.state === 'playing', pos: videoPos(S.video, showNow) } : null);
export const COMMANDS = ['next', 'back', 'take', 'select', 'lower', 'lowerOff', 'blackout', 'freeze', 'mute', 'master', 'bed', 'bedVol', 'fire', 'stopfx', 'video', 'countdown', 'clock', 'theme', 'reload', 'ended'];
// commands a stage (no PIN) may send
export const STAGE_COMMANDS = ['ended'];
