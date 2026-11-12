// Builds the film's sound: narration lines placed at their cue times, the owner's song ducked under the voice,
// mastered to -16 LUFS / -1.5 dBTP (guides/SOUND.md). Also writes captions (SRT and VTT) from the same cue times.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const ROOT = path.resolve(import.meta.dirname, '..');
const tl = fs.readFileSync(path.join(ROOT, 'web/timeline.js'), 'utf8');
const VO = Object.fromEntries([...tl.match(/export const VO = \{([^}]+)\}/)[1].matchAll(/(n\d+):\s*([\d.]+)/g)].map(m => [m[1], +m[2]]));
const DUR = +tl.match(/DUR = ([\d.]+)/)[1];
const timing = JSON.parse(fs.readFileSync(path.join(ROOT, 'narration/timing.json')));
const ids = Object.keys(VO);
for (let i = 0; i < ids.length - 1; i++) { const end = VO[ids[i]] + timing[ids[i]].speechEnd; if (end > VO[ids[i + 1]] - 0.25) console.log(`WARNING: ${ids[i]} ends ${end.toFixed(2)}, ${ids[i + 1]} starts ${VO[ids[i + 1]]}`); }
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
const inputs = ['-i', path.join(ROOT, '../assets/forward-looking.mp3')]; ids.forEach(id => inputs.push('-i', path.join(ROOT, `narration/${id}.mp3`)));
const delays = ids.map((id, i) => `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(VO[id] * 1000)}:all=1[v${i}]`).join(';');
const graph = `${delays};${ids.map((_, i) => `[v${i}]`).join('')}amix=inputs=${ids.length}:normalize=0:dropout_transition=0,apad=whole_dur=${DUR},volume=1.5,asplit=2[vo][key];` +
  `[0:a]aresample=48000,atrim=0:${DUR},volume=0.62[mus];[mus][key]sidechaincompress=threshold=0.02:ratio=7:attack=120:release=650:makeup=1[duck];` +
  `[duck][vo]amix=inputs=2:normalize=0:dropout_transition=0,afade=t=out:st=${DUR - 2.2}:d=2.2[mix]`;
const pre = path.join(ROOT, 'out/mix-pre.wav');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph, '-map', '[mix]', '-t', String(DUR), pre]);
// two-pass loudnorm
const m = execFileSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-2.0:LRA=11:print_format=json', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
const j = JSON.parse(execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${pre}" -af loudnorm=I=-16:TP=-2.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' }));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', pre, '-af', `loudnorm=I=-16:TP=-2.0:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`, '-ar', '48000', path.join(ROOT, 'out/mix.wav')]);
console.log('mix: in', j.input_i, 'LUFS, TP', j.input_tp, '-> out/mix.wav');
// captions
const ts = (s, sep) => { const h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60; return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${se.toFixed(3).padStart(6, '0').replace('.', sep)}`; };
const caps = []; for (const id of ids) { let cur = []; const flush = () => { if (cur.length) { caps.push({ s: VO[id] + cur[0].s, e: VO[id] + cur[cur.length - 1].e + 0.25, text: cur.map(w => w.w).join(' ') }); cur = []; } };
  for (const w of timing[id].words) { cur.push(w); const len = cur.map(x => x.w).join(' ').length; if (/[.?!]$/.test(w.w) || (len > 46 && /,$/.test(w.w)) || len > 62) flush(); } flush(); }
fs.writeFileSync(path.join(ROOT, 'out/captions.srt'), caps.map((c, i) => `${i + 1}\n${ts(c.s, ',')} --> ${ts(c.e, ',')}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(ROOT, 'out/captions.vtt'), 'WEBVTT\n\n' + caps.map(c => `${ts(c.s, '.')} --> ${ts(c.e, '.')}\n${c.text}\n`).join('\n'));
console.log(caps.length, 'caption cues');
