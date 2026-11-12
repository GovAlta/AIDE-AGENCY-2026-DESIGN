// The film's sound: narration lines placed at their `at` times (narration/script.json), the music ducked under the voice
// (sidechain), sound effects when the film has them, mastered with two-pass loudnorm to -16 LUFS and the peak target
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
import { execFileSync } from 'node:child_process';
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
graph.push(`${lines.map((_, i) => `[v${i}]`).join('')}amix=inputs=${lines.length}:normalize=0:dropout_transition=0,apad=whole_dur=${DUR},volume=1.5,asplit=2[vo][key]`);
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
graph.push(`[0:a]aresample=48000,${head}${fit}atrim=0:${DUR},apad=whole_dur=${DUR},volume=${cfg.musicGain ?? 0.62}[mus]`, `[mus][key]sidechaincompress=threshold=0.02:ratio=7:attack=120:release=650:makeup=1[duck]`,
  // the effects are NOT ducked under the voice (they are short, and ducked they were not heard at all: owner, film #2). The music
  // gives way to each effect instead: about 3 dB, fast, for the length of the effect
  ...(sfx ? [`[${lines.length + 1}:a]asplit=2[fx][fxkey]`, `[duck][fxkey]sidechaincompress=threshold=0.02:ratio=2.5:attack=4:release=180:makeup=1[bed]`] : []),
  `${sfx ? '[bed]' : '[duck]'}[vo]${sfx ? '[fx]' : ''}amix=inputs=${sfx ? 3 : 2}:normalize=0:dropout_transition=0,afade=t=out:st=${DUR - 2.2}:d=2.2[mix]`);
const pre = path.join(ROOT, 'out/mix-pre.wav');
execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph.join(';'), '-map', '[mix]', '-t', String(DUR), pre]);
const j = JSON.parse(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${pre}" -af loudnorm=I=-16:TP=${TP}:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' }));
execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', '-i', pre, '-af', `loudnorm=I=-16:TP=${TP}:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`, '-ar', '48000', path.join(ROOT, 'out/mix.wav')]);
console.log('mix: in', j.input_i, `LUFS -> out/mix.wav (-16 LUFS, ${TP} dBTP)`);
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
fs.writeFileSync(path.join(ROOT, 'out/captions.srt'), caps.map((c, i) => `${i + 1}\n${ts(c.s, ',')} --> ${ts(c.e, ',')}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(ROOT, 'out/captions.vtt'), 'WEBVTT\n\n' + caps.map(c => `${ts(c.s, '.')} --> ${ts(c.e, '.')}\n${c.text}\n`).join('\n'));
console.log(caps.length, 'caption cues -> out/captions.srt, out/captions.vtt');
