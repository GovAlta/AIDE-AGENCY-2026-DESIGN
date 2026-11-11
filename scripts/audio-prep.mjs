#!/usr/bin/env node
// Turn a music file into an Agency 2026 sound cue: trim, fade, seamless loop, loudness to the cue's target. Reads brand/audio/cues.json.
//   node scripts/audio-prep.mjs --list                          # every cue, its status and its target
//   node scripts/audio-prep.mjs --all                           # build every cue that has a "source" in cues.json -> brand/audio/cues/<id>.m4a
//   node scripts/audio-prep.mjs bed-break ~/Downloads/agency26_bed-break_v2.wav [--start 3.2] [--length 60]
//                                                               # a delivered Suno file: cut, fade, loop and master it to the cue spec,
//                                                               # record it as the cue's source and mark the cue ready
//   options: --dry (print the ffmpeg plan only)  --wav (also write a 48 kHz WAV beside the m4a)
// Loops: the tail after the loop point is crossfaded into the head (--xfade, default 1.5 s for beds), so the file plays end to start with no
// gap or click. Loudness: two-pass ffmpeg loudnorm to the cue's loudness_lufs, true peak -1.5 dBTP; clips under 3 s are peak-normalised
// instead (loudnorm needs 3 s). Output is AAC 192 kb/s in .m4a (small enough for git); keep the Suno WAV masters outside the repo.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CUES = path.join(ROOT, 'brand/audio/cues.json');
const a = process.argv.slice(2), has = (k) => a.includes('--' + k), val = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const doc = JSON.parse(fs.readFileSync(CUES, 'utf8'));
const run = (args) => { const r = spawnSync('ffmpeg', ['-hide_banner', ...args], { encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr.slice(-800)); return r.stderr; };
const probe = (f) => +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout.trim();

function build(cue, file, start, length) {
  const out = path.join(ROOT, cue.file || `brand/audio/cues/${cue.id}.m4a`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const src = path.resolve(ROOT, file), total = probe(src);
  const L = Math.min(length ?? cue.length_s, total - start);
  const X = cue.loop ? Math.min(+val('xfade', 1.5), L / 4, Math.max(0, total - start - L)) : 0;
  const fin = cue.fade_in_s || 0, fout = cue.fade_out_s || 0;
  // 1. cut (+ loop crossfade) to a temp WAV
  const tmp = out.replace(/\.m4a$/, '.tmp.wav');
  let fc;
  if (cue.loop && X > 0.05) {
    fc = `[0:a]atrim=${start}:${start + L + X},asetpts=PTS-STARTPTS,aresample=48000,asplit=3[s1][s2][s3];` +
      `[s1]atrim=${L}:${L + X},asetpts=PTS-STARTPTS,afade=t=out:d=${X}:curve=qsin[tail];[s2]atrim=0:${X},asetpts=PTS-STARTPTS,afade=t=in:d=${X}:curve=qsin[head];` +
      `[tail][head]amix=inputs=2:normalize=0[x];[s3]atrim=${X}:${L},asetpts=PTS-STARTPTS[body];[x][body]concat=n=2:v=0:a=1[out]`;
  } else {
    const fades = [fin > 0 ? `afade=t=in:d=${fin}` : '', fout > 0 ? `afade=t=out:st=${Math.max(0, L - fout).toFixed(3)}:d=${fout}` : ''].filter(Boolean).join(',');
    fc = `[0:a]atrim=${start}:${start + L},asetpts=PTS-STARTPTS,aresample=48000${fades ? ',' + fades : ''}[out]`;
  }
  if (has('dry')) { console.log(cue.id, fc); return; }
  run(['-y', '-loglevel', 'error', '-i', src, '-filter_complex', fc, '-map', '[out]', '-ac', '2', tmp]);
  // 2. loudness
  const I = cue.loudness_lufs ?? -16, TP = cue.true_peak_dbtp ?? -1.5;
  let af;
  if (L >= 3) {
    const m = run(['-i', tmp, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=11:print_format=json`, '-f', 'null', '-']);
    const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
    af = `loudnorm=I=${I}:TP=${TP}:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`;
  } else {
    const m = run(['-i', tmp, '-af', 'volumedetect', '-f', 'null', '-']); const pk = +(m.match(/max_volume: ([-\d.]+) dB/) || [0, 0])[1];
    af = `volume=${(TP - 0.5 - pk).toFixed(2)}dB`;
  }
  run(['-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]);
  if (has('wav')) run(['-y', '-loglevel', 'error', '-i', tmp, '-af', af, '-c:a', 'pcm_s24le', out.replace(/\.m4a$/, '.wav')]);
  fs.unlinkSync(tmp);
  const chk = run(['-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const li = (chk.match(/I:\s+([-\d.]+) LUFS/g) || []).pop(), tp = (chk.match(/Peak:\s+([-\d.]+) dBFS/g) || []).pop();
  console.log(`${cue.id.padEnd(18)} ${probe(out).toFixed(2)} s ${cue.loop ? 'loop ' : '     '} ${li ?? ''} ${tp ?? ''} -> ${path.relative(ROOT, out)}`);
  return out;
}

if (!a.length || has('help')) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n')); process.exit(0); }
if (has('list')) {
  for (const c of doc.cues) console.log(`${c.id.padEnd(18)} ${c.kind.padEnd(7)} ${(c.status || '').padEnd(12)} ${String(c.length_s ?? '').padStart(6)} s ${c.loop ? 'loop' : '    '} ${c.loudness_lufs ?? ''} LUFS  ${c.use}`);
  process.exit(0);
}
if (has('all')) {
  for (const c of doc.cues.filter((c) => c.source)) build(c, c.source.file, c.source.start ?? 0, c.source.length);
} else {
  const VALUED = ['--start', '--length', '--xfade'];
  const [id, file] = a.filter((x, i) => !x.startsWith('--') && !VALUED.includes(a[i - 1]));
  const cue = doc.cues.find((c) => c.id === id);
  if (!cue) { console.error(`no cue "${id}"; run --list`); process.exit(1); }
  if (cue.kind === 'silence') { console.error(`${id} is a silence rule, not a sound`); process.exit(1); }
  if (!file) { console.error('give the delivered file: audio-prep.mjs <cue-id> <file>'); process.exit(1); }
  const start = +val('start', 0), length = val('length') ? +val('length') : undefined;
  const out = build(cue, file, start, length);
  if (out && !has('dry')) {
    cue.source = { file: path.relative(ROOT, path.resolve(file)), start, length: length ?? cue.length_s, note: `delivered ${new Date().toISOString().slice(0, 10)}` };
    cue.file = path.relative(ROOT, out); cue.status = 'ready';
    fs.writeFileSync(CUES, JSON.stringify(doc, null, 1) + '\n');
    console.log(`cues.json: ${id} marked ready`);
  }
}
