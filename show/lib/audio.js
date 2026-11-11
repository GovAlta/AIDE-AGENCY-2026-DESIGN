/* Show audio: a small WebAudio mixer that runs in the stage window (the window whose audio goes to the house system).
 *   buses: bed (one music bed at a time, looped, crossfaded), fx (stings, walk-ups, sizzles: one-shots over everything),
 *          video (the <video> element's own sound). Master gain on top; an analyser on master for the control's level meter.
 *   Ducking: while a video with sound plays, the bed drops by duckDb (default -18 dB) and comes back when it stops.
 *   Loudness: each cue plays at gain_db, plus (target_lufs - lufs) when the cue file gives its measured lufs, so cues from
 *   different sources sit at one level. target_lufs defaults to -16 (the MVAI mastering target).
 * Cue format (brand/audio/cues.json or agenda.audio.cues): { id, file, kind: bed|sting|walkup|sizzle|loop, gain_db, lufs, in, out,
 *   loop, fade_in, fade_out, duration }. in/out are seconds within the file; a bed loops between in and out.
 */
const dbToGain = (db) => Math.pow(10, db / 20);

export class Mixer {
  constructor(cues = {}, o = {}) {
    this.cues = cues; this.o = { targetLufs: -16, duckDb: -18, ...o };
    this.buffers = new Map(); this.bed = null; this.fx = new Set(); this.videoEls = new WeakSet();
    this.ctx = null; this.ducked = false; this.urlOf = o.urlOf || ((f) => f);
  }
  get ready() { return !!this.ctx && this.ctx.state === 'running'; }
  async unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext; this.ctx = new C({ latencyHint: 'playback' });
      const c = this.ctx;
      this.master = c.createGain(); this.analyser = c.createAnalyser(); this.analyser.fftSize = 1024;
      this.master.connect(this.analyser); this.analyser.connect(c.destination);
      this.bedBus = c.createGain(); this.fxBus = c.createGain(); this.videoBus = c.createGain();
      for (const b of [this.bedBus, this.fxBus, this.videoBus]) b.connect(this.master);
    }
    if (this.ctx.state !== 'running') { try { await this.ctx.resume(); } catch {} }
    return this.ready;
  }
  level() {   // 0..1 peak on master (for the meter)
    if (!this.analyser) return 0;
    const a = new Float32Array(this.analyser.fftSize); this.analyser.getFloatTimeDomainData(a);
    let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); return m;
  }
  setMaster(v, mute) { if (this.master) this.master.gain.setTargetAtTime(mute ? 0 : v, this.ctx.currentTime, 0.05); }
  // lufs (a raw file's measured loudness) is corrected to the target; loudness_lufs (a mastered cue) is kept as mastered
  cueGain(c) { return dbToGain((c.gain_db ?? 0) + (Number.isFinite(c.lufs) ? this.o.targetLufs - c.lufs : 0)); }
  async buffer(c) {
    if (this.buffers.has(c.file)) return this.buffers.get(c.file);
    if (!c._url) c._url = this.urlOf(c.file);   // a cue can play before preload() has reached it
    const p = fetch(c._url).then((r) => { if (!r.ok) throw new Error(`${c.file}: HTTP ${r.status}`); return r.arrayBuffer(); }).then((ab) => this.ctx.decodeAudioData(ab));
    this.buffers.set(c.file, p); return p;
  }
  async preload(urlOf) { for (const c of Object.values(this.cues)) { if (!c.file) continue; c._url = urlOf(c.file); try { await this.buffer(c); } catch (e) { this.buffers.delete(c.file); console.warn('cue', c.id, e.message); } } }

  // music bed: crossfade to cue id (null fades the bed out). vol 0..1 scales the cue's own gain.
  async playBed(id, vol = 1, fade) {
    if (!this.ready) return;
    if (this.bed && this.bed.id === id) { this.bedVol(vol); return; }
    const t = this.ctx.currentTime, old = this.bed;
    if (old) { const f = fade ?? old.cue.fade_out ?? 2; old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0, t + f); old.src.stop(t + f + 0.05); }
    this.bed = null;
    if (!id) return;
    const c = this.cues[id]; if (!c) { console.warn('no cue', id); return; }
    let buf; try { buf = await this.buffer(c); } catch (e) { this.buffers.delete(c.file); console.warn('bed', id, e.message); return; }   // a missing file never stops the show
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    src.buffer = buf; src.loop = c.loop !== false; src.loopStart = c.in ?? 0; src.loopEnd = c.out ?? buf.duration;
    src.connect(g); g.connect(this.bedBus);
    const target = this.cueGain(c) * vol, f = fade ?? c.fade_in ?? 2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(target, t + f);
    src.start(t, c.in ?? 0);
    this.bed = { id, cue: c, src, g, vol };
  }
  bedVol(v) { if (this.bed) { this.bed.vol = v; this.bed.g.gain.setTargetAtTime(this.cueGain(this.bed.cue) * v, this.ctx.currentTime, 0.15); } }

  // one-shot: sting, walk-up, sizzle. Plays from in to out (or duration), with a fade out at the end.
  async fire(id, vol = 1) {
    if (!this.ready) return;
    const c = this.cues[id]; if (!c) { console.warn('no cue', id); return; }
    let buf; try { buf = await this.buffer(c); } catch (e) { this.buffers.delete(c.file); console.warn('cue', id, e.message); return; }
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain(), t = this.ctx.currentTime;
    const start = c.in ?? 0, len = Math.max(0.1, (c.out ?? (c.duration ? start + c.duration : buf.duration)) - start), fo = Math.min(c.fade_out ?? 0.8, len / 2), fi = c.fade_in ?? 0.01;
    src.buffer = buf; src.connect(g); g.connect(this.fxBus);
    const gain = this.cueGain(c) * vol;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + fi); g.gain.setValueAtTime(gain, t + len - fo); g.gain.linearRampToValueAtTime(0, t + len);
    src.start(t, start, len); const h = { id, src, g }; this.fx.add(h); src.onended = () => this.fx.delete(h);
    if (c.duck_bed !== false && this.bed) this.duckFor(len);
    return h;
  }
  stopFx(fade = 0.4) { const t = this.ctx?.currentTime ?? 0; for (const h of this.fx) { h.g.gain.setTargetAtTime(0, t, fade / 3); h.src.stop(t + fade + 0.05); } this.fx.clear(); }
  duckFor(sec) { const t = this.ctx.currentTime, g = this.bedBus.gain; g.cancelScheduledValues(t); g.setTargetAtTime(dbToGain(-10), t, 0.08); g.setTargetAtTime(this.ducked ? dbToGain(this.o.duckDb) : 1, t + sec, 0.4); }
  // video sound goes through the video bus; the bed ducks while a video with sound plays
  attachVideo(el) {
    if (!this.ctx || this.videoEls.has(el)) return;
    this.videoEls.add(el); const s = this.ctx.createMediaElementSource(el); s.connect(this.videoBus);
  }
  duck(on) {
    if (!this.ctx || this.ducked === on) return; this.ducked = on;
    this.bedBus.gain.setTargetAtTime(on ? dbToGain(this.o.duckDb) : 1, this.ctx.currentTime, on ? 0.15 : 0.6);
  }
  stopAll(fade = 1.5) { this.playBed(null, 1, fade); this.stopFx(fade); }
}
