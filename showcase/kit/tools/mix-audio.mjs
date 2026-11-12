// The film's sound: narration lines placed at their `at` times (narration/script.json), the music ducked under the voice
// (sidechain), mastered with two-pass loudnorm to -16 LUFS and -2.0 dBTP (headroom for AAC, which adds about 0.7 dB of peak).
// Also writes captions (SRT, VTT) from the voice's own word times.
//   node tools/mix-audio.mjs --project <film dir>        music: film.config.json "music" (path relative to the project)
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
const inputs = [], graph = [];
if (music) inputs.push('-i', music); else inputs.push('-f', 'lavfi', '-t', String(DUR), '-i', 'anullsrc=r=48000:cl=stereo');
lines.forEach(l => inputs.push('-i', path.join(ROOT, `narration/${l.id}.mp3`)));
graph.push(lines.map((l, i) => `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(l.at * 1000)}:all=1[v${i}]`).join(';'));
graph.push(`${lines.map((_, i) => `[v${i}]`).join('')}amix=inputs=${lines.length}:normalize=0:dropout_transition=0,apad=whole_dur=${DUR},volume=1.5,asplit=2[vo][key]`);
graph.push(`[0:a]aresample=48000,atrim=0:${DUR},volume=${cfg.musicGain ?? 0.62}[mus]`, `[mus][key]sidechaincompress=threshold=0.02:ratio=7:attack=120:release=650:makeup=1[duck]`,
  `[duck][vo]amix=inputs=2:normalize=0:dropout_transition=0,afade=t=out:st=${DUR - 2.2}:d=2.2[mix]`);
const pre = path.join(ROOT, 'out/mix-pre.wav');
execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph.join(';'), '-map', '[mix]', '-t', String(DUR), pre]);
const j = JSON.parse(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${pre}" -af loudnorm=I=-16:TP=-2.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' }));
execFileSync('nice', ['ffmpeg', '-y', '-loglevel', 'error', '-i', pre, '-af', `loudnorm=I=-16:TP=-2.0:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`, '-ar', '48000', path.join(ROOT, 'out/mix.wav')]);
console.log('mix: in', j.input_i, 'LUFS -> out/mix.wav (-16 LUFS, -2.0 dBTP)');
const ts = (s, sep) => { const h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60; return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${se.toFixed(3).padStart(6, '0').replace('.', sep)}`; };
const caps = [];
for (const l of lines) { let cur = []; const flush = () => { if (cur.length) { caps.push({ s: l.at + cur[0].s, e: l.at + cur[cur.length - 1].e + 0.25, text: cur.map(w => w.w).join(' ') }); cur = []; } };
  for (const w of timing[l.id].words) { cur.push(w); const len = cur.map(x => x.w).join(' ').length; if (/[.?!]$/.test(w.w) || (len > 46 && /,$/.test(w.w)) || len > 62) flush(); } flush(); }
caps.sort((a, b) => a.s - b.s);
fs.writeFileSync(path.join(ROOT, 'out/captions.srt'), caps.map((c, i) => `${i + 1}\n${ts(c.s, ',')} --> ${ts(c.e, ',')}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(ROOT, 'out/captions.vtt'), 'WEBVTT\n\n' + caps.map(c => `${ts(c.s, '.')} --> ${ts(c.e, '.')}\n${c.text}\n`).join('\n'));
console.log(caps.length, 'caption cues -> out/captions.srt, out/captions.vtt');
