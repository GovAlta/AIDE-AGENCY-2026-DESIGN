// The film's sound: narration lines placed at their `at` times (narration/script.json), the music ducked under the voice
// ("duck" in film.config.json: by a plan from the voice's word times and measured loudness, see below; without it the old sidechain
// compressor, kept so that finished films mix the same). Every mix also writes its stems, out/stem-voice.wav and out/stem-music.wav,
// which tools/duck-check.py measures (the music at least 18 dB under the voice while a line is spoken). --out <dir> writes elsewhere.
// Sound effects when the film has them, mastered with two-pass loudnorm to -16 LUFS and the peak target
// (film.config.json "peakTP", default -2.3 dBTP: AAC encoding lifts the true peak by 0.2 to 0.3 dB and the master must stay under -2).
// Also writes captions (SRT, VTT) from the voice's own word times.
//   node tools/mix-audio.mjs --project <film dir>        music: film.config.json "music" (path relative to the project);
//                                                        "musicFit": "stretch" fits the track to the film's length (see below);
//                                                        "musicStart": seconds into the track at which the film starts
//   node tools/mix-audio.mjs --project <film dir> --no-sfx   the same mix without the sound effects
//   node tools/mix-audio.mjs --project <film dir> --sfx-check 30   also 30 s from that second, effects and music only -> out/sfx-check.wav
// Sound effects: when out/sfx-events.json exists (tools/sfx-events.mjs), each event is placed at its time to the sample, at its gain
// and pan; loops are repeated to their dur with 20 ms fades. The effects track is set by "sfxGain" (dB, default -2: single effects peak about -10 dBFS in the stem, 6 to 8 dB under the voice's peaks),
// not ducked under the voice (the music gives way about 3 dB under each effect), and written alone as out/sfx.wav. Effects must be
// heard: after a mix run tools/sfx-audible.py <film dir> (each onset at least 6 dB over the bed, 1 to 8 kHz). Sounds: brand/audio/sfx/palette.json (guides/SOUND.md).
import fs from 'node:fs';
import path from 'node:path';
import { BRAND } from './lib/paths.mjs';
import { execFileSync, spawnSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const ROOT = path.resolve(arg('project', '.'));
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'film.config.json')));
// "music": "cue:<id>" takes a cue from the design repo's sound library (brand/audio/cues.json), so films share the event's sound
function musicPath(m) {
  if (!m) return null;
  if (!m.startsWith('cue:')) return path.resolve(ROOT, m);
  const cues = JSON.parse(fs.readFileSync(path.join(BRAND, 'audio/cues.json'), 'utf8')).cues, c = cues.find(x => x.id === m.slice(4));
  if (!c || !c.file) { console.error(`music ${m}: no such cue with a file in brand/audio/cues.json`); process.exit(2); }
  return path.resolve(BRAND, '..', c.file);
}
const DUR = cfg.dur, music = musicPath(cfg.music);
const script = JSON.parse(fs.readFileSync(path.join(ROOT, 'narration/script.json')));
const timing = JSON.parse(fs.readFileSync(path.join(ROOT, 'narration/timing.json')));
const lines = script.lines.filter(l => l.at !== undefined && timing[l.id]);
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
const OUT = path.resolve(ROOT, arg('out', 'out')); fs.mkdirSync(OUT, { recursive: true });
const TP = cfg.peakTP ?? -2.3;
// the effects stem: every event written at its own sample position (48 kHz stereo), so placement does not depend on a filter graph
function sfxStem() {
  const evFile = path.join(ROOT, 'out/sfx-events.json'); if (process.argv.includes('--no-sfx') || !fs.existsSync(evFile)) return null;
  const { events } = JSON.parse(fs.readFileSync(evFile, 'utf8')); if (!events.length) return null;
  const SR = 48000, N = Math.round(DUR * SR), L = new Float32Array(N), R = new Float32Array(N), cache = {}, master = 10 ** ((cfg.sfxGain ?? -2) / 20);
  const load = (id) => cache[id] ||= (() => { const b = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', path.join(BRAND, `audio/sfx/${id}.wav`), '-ac', '2', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 }); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); })();
  for (const e of events) { const a = load(e.id), len = a.length / 2, n = e.dur ? Math.round(e.dur * SR) : len, at = Math.round(e.at * SR), g = master * 10 ** (e.gain_db / 20), f = Math.min(Math.round(0.02 * SR), n >> 1);
    const gl = g * (e.pan > 0 ? 1 - e.pan : 1), gr = g * (e.pan < 0 ? 1 + e.pan : 1);
    for (let i = 0; i < n && at + i < N; i++) { if (!e.loop && i >= len) break; const k = i % len, w = e.dur ? Math.min(1, e.loop ? i / f : 1, (n - i) / f) : 1; L[at + i] += a[2 * k] * gl * w; R[at + i] += a[2 * k + 1] * gr * w; } }
  const out = Buffer.alloc(44 + N * 4); out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
  const q = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
  for (let i = 0; i < N; i++) { out.writeInt16LE(q(L[i]), 44 + i * 4); out.writeInt16LE(q(R[i]), 46 + i * 4); }
  const f = path.join(ROOT, 'out/sfx.wav'); fs.writeFileSync(f, out); console.log(`sfx: ${events.length} events at ${cfg.sfxGain ?? -2} dB -> out/sfx.wav`); return f;
}
const sfx = sfxStem();
const inputs = [], graph = [];
if (music) inputs.push('-i', music); else inputs.push('-f', 'lavfi', '-t', String(DUR), '-i', 'anullsrc=r=48000:cl=stereo');
lines.forEach(l => inputs.push('-i', path.join(ROOT, `narration/${l.id}.mp3`)));
if (sfx) inputs.push('-i', sfx);
graph.push(lines.map((l, i) => `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(l.at * 1000)}:all=1[v${i}]`).join(';'));
graph.push(`${lines.map((_, i) => `[v${i}]`).join('')}amix=inputs=${lines.length}:normalize=0:dropout_transition=0,apad=whole_dur=${DUR},volume=1.5${cfg.duck ? '' : ',asplit=3[vo][key]'}[vos]`);
// "musicFit": "stretch" in film.config.json: when the film is a little longer or shorter than the track (within 6 %), the track is
// time-stretched to the film's length at the same pitch, so its own ending lands on the film's last frame (no silence under an end card,
// no cut). Without it the track plays at its own speed and is trimmed or left to end.
let fit = '';
if (music && cfg.musicFit === 'stretch') { const len = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', music], { encoding: 'utf8' }), k = len / DUR;
  if (Math.abs(k - 1) > 0.06) console.error(`musicFit: the track is ${len.toFixed(2)} s and the film ${DUR} s (more than 6 % apart): not stretched`);
  else if (Math.abs(k - 1) > 0.0005) { fit = `rubberband=tempo=${k.toFixed(6)}:pitchq=quality,`; console.log(`musicFit: track ${len.toFixed(2)} s stretched to ${DUR} s (tempo x${k.toFixed(4)}, same pitch)`); } }
// "musicStart": seconds into the track at which the film starts (default 0), with a short fade-in ("musicFadeIn", default 0.6 s when
// musicStart is set). Use it to land the track's OWN ending on the film's end when the track is longer than the film: an ending the
// composer wrote sounds finished; a fade in the middle of a phrase does not (film #2, solo piano: no stretch, start 7.8 s in).
const mStart = +cfg.musicStart || 0, mIn = cfg.musicFadeIn ?? (mStart ? 0.6 : 0), head = `${mStart ? `atrim=start=${mStart},asetpts=PTS-STARTPTS,` : ''}${mIn ? `afade=t=in:d=${mIn},` : ''}`;
if (mStart) console.log(`musicStart: the track starts ${mStart} s in (fade-in ${mIn} s)`);
if (!cfg.duck) graph.push(`[0:a]aresample=48000,${head}${fit}atrim=0:${DUR},apad=whole_dur=${DUR},volume=${cfg.musicGain ?? 0.62}[mus]`, `[mus][key]sidechaincompress=threshold=0.02:ratio=7:attack=120:release=650:makeup=1,asplit=2[duck][ducks]`,
  // the effects are NOT ducked under the voice (they are short, and ducked they were not heard at all: owner, film #2). The music
  // gives way to each effect instead: about 3 dB, fast, for the length of the effect
  ...(sfx ? [`[${lines.length + 1}:a]asplit=2[fx][fxkey]`, `[duck][fxkey]sidechaincompress=threshold=0.02:ratio=2.5:attack=4:release=180:makeup=1[bed]`] : []),
  `${sfx ? '[bed]' : '[duck]'}[vo]${sfx ? '[fx]' : ''}amix=inputs=${sfx ? 3 : 2}:normalize=0:dropout_transition=0,afade=t=out:st=${DUR - 2.2}:d=2.2[mix]`);
const pre = path.join(OUT, 'mix-pre.wav'), stemV = path.join(OUT, 'stem-voice.wav'), stemM = path.join(OUT, 'stem-music.wav'), F32 = ['-c:a', 'pcm_f32le', '-t', String(DUR)];
let j;
if (!cfg.duck) {
  execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph.join(';'), '-map', '[mix]', '-t', String(DUR), pre, '-map', '[vos]', ...F32, stemV, '-map', '[ducks]', ...F32, stemM]);
  j = JSON.parse(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${pre}" -af loudnorm=I=-16:TP=${TP}:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' }));
  execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', '-i', pre, '-af', `loudnorm=I=-16:TP=${TP}:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`, '-ar', '48000', path.join(OUT, 'mix.wav')]);
  fs.writeFileSync(path.join(OUT, 'mix-stems.json'), JSON.stringify({ duck: 'sidechain', master: 'loudnorm', in_i: +j.input_i, in_tp: +j.input_tp }, null, 1));
  console.log('mix: in', j.input_i, `LUFS -> mix.wav (-16 LUFS, ${TP} dBTP); stems: stem-voice.wav, stem-music.wav (before the master)`);
} else {
  // "duck" in film.config.json: the music gives way to the voice by a plan, not by a compressor. The plan comes from the voice's own
  // word times (narration/timing.json) and from the measured loudness (BS.1770 K-weighting) of the voice and the music:
  //   margin   the music sits this many dB under the voice while a line is spoken, in its loudest 3 s against the voice's quietest (20)
  //   lift     how far the music comes up between lines and in the intro and the close, in dB over the level under the lines (5)
  //   attack   seconds the music takes to go down; it is down `lead` seconds before the first word (0.2, 0.05)
  //   release  seconds the music takes to come back, starting 0.1 s after the last word (0.65)
  //   hold     the music stays down through any pause shorter than this many seconds, so it does not pump between words (1.5)
  // "musicGain" stays the ceiling: the music is never louder than it was. The master is one fixed gain to -16 LUFS and a 4x-oversampled
  // limiter at "peakTP": loudnorm is not used, because in its dynamic mode it lifts quiet passages (a music-only intro came up).
  const D = { margin: 20, lift: 5, attack: 0.2, lead: 0.05, release: 0.65, hold: 1.5, ...(typeof cfg.duck === 'object' ? cfg.duck : {}) };
  const SR = 48000, N = Math.round(DUR * SR);
  execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph.join(';'), '-map', '[vos]', ...F32, stemV]);
  const dec = (args) => { const b = execFileSync('ffmpeg', ['-loglevel', 'error', ...args, '-ac', '2', '-ar', String(SR), '-t', String(DUR), '-f', 'f32le', '-'], { maxBuffer: 2 ** 31 - 1 });
    const a = new Float32Array(N * 2); a.set(new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + Math.min(b.byteLength, N * 8) - Math.min(b.byteLength, N * 8) % 4))); return a; };
  const mus = music ? dec(['-i', music, '-af', `aresample=48000,${head}${fit}atrim=0:${DUR},apad=whole_dur=${DUR}`]) : new Float32Array(N * 2), vox = dec(['-i', stemV]);
  // K-weighted energy in 100 ms blocks (both channels summed), then loudness over any stretch of blocks
  const kBlocks = (x) => { const B = SR / 10, E = new Float64Array(Math.floor(N / B));
    for (let c = 0; c < 2; c++) { let x1 = 0, x2 = 0, y1 = 0, y2 = 0, z1 = 0, z2 = 0;
      for (let i = 0; i < E.length * B; i++) { const v = x[2 * i + c], y = 1.53512485958697 * v - 2.69169618940638 * x1 + 1.19839281085285 * x2 + 1.69065929318241 * y1 - 0.73248077421585 * y2; x2 = x1; x1 = v;
        const z = y - 2 * y1 + y2 + 1.99004745483398 * z1 - 0.99007225036621 * z2; y2 = y1; y1 = y; z2 = z1; z1 = z; E[(i / B) | 0] += z * z / B; } }
    return E; };
  const EV = kBlocks(vox), EM = kBlocks(mus);
  const lufs = (E, s, e) => { const a = Math.max(0, Math.round(s * 10)), b = Math.min(E.length, Math.max(a + 1, Math.round(e * 10))); let m = 0; for (let i = a; i < b; i++) m += E[i]; return -0.691 + 10 * Math.log10(m / (b - a) + 1e-12); };
  const words = lines.flatMap(l => timing[l.id].words.map(w => [l.at + w.s, l.at + w.e])).sort((a, b) => a[0] - b[0]), spans = [];
  for (const [s, e] of words) { const p = spans[spans.length - 1]; if (p && s - p.e < D.hold) p.e = Math.max(p.e, e); else spans.push({ s, e }); }
  const cap = 20 * Math.log10(cfg.musicGain ?? 0.62);
  for (const p of spans) { let lv = Infinity, lm = -Infinity; const w = Math.min(3, p.e - p.s);
    for (let t = p.s; t + w <= p.e + 1e-6; t += 0.5) { lv = Math.min(lv, lufs(EV, t, t + w)); lm = Math.max(lm, lufs(EM, t, t + w)); }
    p.voice = +lv.toFixed(1); p.music = +lm.toFixed(1); p.gain = +Math.min(cap, lv - D.margin - lm).toFixed(2); }
  const gap = (i) => Math.min(cap, (i < 0 ? spans[0].gain : i >= spans.length - 1 ? spans[spans.length - 1].gain : (spans[i].gain + spans[i + 1].gain) / 2) + D.lift);
  // the gain plan: [time, dB] breakpoints joined by half-cosine ramps
  const bp = [[0, spans.length ? gap(-1) : cap]];
  spans.forEach((p, i) => { bp.push([Math.max(0, p.s - D.lead - D.attack), gap(i - 1)], [Math.max(0.001, p.s - D.lead), p.gain], [p.e + 0.1, p.gain], [p.e + 0.1 + D.release, gap(i)]); });
  bp.push([DUR + 1, bp[bp.length - 1][1]]);
  for (let i = 0, k = 0; i < N; i++) { const t = i / SR; while (k < bp.length - 2 && t >= bp[k + 1][0]) k++;
    const [t0, a] = bp[k], [t1, b] = bp[k + 1], g = a === b ? a : a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, (t - t0) / (t1 - t0))))), m = 10 ** (g / 20); mus[2 * i] *= m; mus[2 * i + 1] *= m; }
  { const h = Buffer.alloc(44), n = N * 8; h.write('RIFF', 0); h.writeUInt32LE(36 + n, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
    h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write('data', 36); h.writeUInt32LE(n, 40);
    const fd = fs.openSync(stemM, 'w'); fs.writeSync(fd, h); fs.writeSync(fd, Buffer.from(mus.buffer, mus.byteOffset, n)); fs.closeSync(fd); }
  const fade = `afade=t=out:st=${DUR - 2.2}:d=2.2[mix]`;
  const g2 = sfx ? `[2:a]asplit=2[fx][fxkey];[0:a][fxkey]sidechaincompress=threshold=0.02:ratio=2.5:attack=4:release=180:makeup=1[bed];[bed][1:a][fx]amix=inputs=3:normalize=0:dropout_transition=0,${fade}`
    : `[0:a][1:a]amix=inputs=2:normalize=0:dropout_transition=0,${fade}`;
  execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', '-i', stemM, '-i', stemV, ...(sfx ? ['-i', sfx] : []), '-filter_complex', g2, '-map', '[mix]', ...F32, pre]);
  const meas = (af) => { const o = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', pre, '-af', `${af ? af + ',' : ''}ebur128=peak=true`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr, s = o.slice(o.lastIndexOf('Integrated loudness'));
    return { I: +s.match(/I:\s+(-?[\d.]+) LUFS/)[1], TP: +s.match(/Peak:\s+(-?[\d.]+) dBFS/)[1] }; };
  const lim = (g) => `volume=${g.toFixed(2)}dB,aresample=192000,alimiter=limit=${(10 ** (TP / 20)).toFixed(4)}:attack=0.5:release=40:level=disabled:asc=1,aresample=48000`;
  const m0 = meas(''); let g = -16 - m0.I, m1;
  for (let k = 0; k < 3; k++) { m1 = meas(lim(g)); if (Math.abs(-16 - m1.I) < 0.05) break; g += -16 - m1.I; }
  execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', '-i', pre, '-af', lim(g), '-ar', '48000', path.join(OUT, 'mix.wav')]);
  j = { input_i: m0.I };
  fs.writeFileSync(path.join(OUT, 'mix-stems.json'), JSON.stringify({ duck: D, master: 'gain+limiter', gain_db: +g.toFixed(2), in_i: m0.I, in_tp: m0.TP, out_i: m1.I, out_tp: m1.TP, limited_db: +Math.max(0, m0.TP + g - TP).toFixed(1), gaps_db: spans.map((_, i) => +gap(i).toFixed(2)), intro_db: +gap(-1).toFixed(2), spans }, null, 1));
  console.log(`duck: ${spans.length} spoken spans from the word times; music under the voice ${Math.min(...spans.map(p => p.gain))} to ${Math.max(...spans.map(p => p.gain))} dB, between lines +${D.lift} dB`);
  console.log(`mix: in ${m0.I} LUFS, gain ${g.toFixed(2)} dB, limiter takes up to ${Math.max(0, m0.TP + g - TP).toFixed(1)} dB off the highest peaks -> mix.wav (${m1.I} LUFS, ${m1.TP} dBTP); stems: stem-voice.wav, stem-music.wav (before the master gain)`);
}
// --sfx-check <start seconds>: 30 s of the effects and the music only (no voice), at the level they have in the mix -> out/sfx-check.wav
if (sfx && process.argv.includes('--sfx-check')) { const from = +arg('sfx-check', 0) || 0, gdb = -16 - (+j.input_i);
  const g2 = [`[0:a]aresample=48000,${head}${fit}atrim=0:${DUR},apad=whole_dur=${DUR},volume=${cfg.musicGain ?? 0.62}[mus]`, `[1:a]asplit=2[fx][fxkey]`,
    `[mus][fxkey]sidechaincompress=threshold=0.02:ratio=2.5:attack=4:release=180:makeup=1[bed]`, `[bed][fx]amix=inputs=2:normalize=0:dropout_transition=0,volume=${gdb.toFixed(2)}dB[o]`];
  execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', ...(music ? ['-i', music] : ['-f', 'lavfi', '-t', String(DUR), '-i', 'anullsrc=r=48000:cl=stereo']), '-i', sfx, '-filter_complex', g2.join(';'), '-map', '[o]', '-ss', String(from), '-t', '30', path.join(ROOT, 'out/sfx-check.wav')]);
  console.log(`sfx check: ${from} to ${from + 30} s, effects and music only -> out/sfx-check.wav`); }
const ts = (s, sep) => { const h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60; return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${se.toFixed(3).padStart(6, '0').replace('.', sep)}`; };
const caps = [];
for (const l of lines) { let cur = []; const flush = () => { if (cur.length) { caps.push({ s: l.at + cur[0].s, e: l.at + cur[cur.length - 1].e + 0.25, text: cur.map(w => w.w).join(' ') }); cur = []; } };
  for (const w of timing[l.id].words) { cur.push(w); const len = cur.map(x => x.w).join(' ').length; if (/[.?!]$/.test(w.w) || (len > 46 && /,$/.test(w.w)) || len > 62) flush(); } flush(); }
caps.sort((a, b) => a.s - b.s);
fs.writeFileSync(path.join(OUT, 'captions.srt'), caps.map((c, i) => `${i + 1}\n${ts(c.s, ',')} --> ${ts(c.e, ',')}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT, 'captions.vtt'), 'WEBVTT\n\n' + caps.map(c => `${ts(c.s, '.')} --> ${ts(c.e, '.')}\n${c.text}\n`).join('\n'));
console.log(caps.length, 'caption cues -> out/captions.srt, out/captions.vtt');
