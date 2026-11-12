// The interface sound palette (brand/audio/sfx): generate, choose and prepare each sound with ElevenLabs sound generation through Ent Tools.
//   node tools/sfx.mjs list                          the palette: id, kind, length, default gain, use
//   node tools/sfx.mjs generate [id ...] [--takes 3] generate takes for the ids (default: every sound with no file yet), pick the best by
//                                                    measurement, trim, normalise, write <id>.wav (48 kHz, peak -3 dBFS) and <id>.m4a
//   node tools/sfx.mjs generate <id> --force         replace an existing sound (after changing its prompt in palette.json)
//   node tools/sfx.mjs check                         every file exists, is 48 kHz, peaks at or under -3 dBFS and has a clean start
// Needs ENT_TOOLS_URL and ENT_TOOLS_API_KEY (source ~/.sandbox-env). Raw takes are kept in a scratch folder (--raw <dir>), not in git.
// To add a sound: add an entry to palette.json ({ id, kind: "one"|"loop", dur, gain_db, use, prompt, max_s? }) and run generate <id>.
// max_s cuts a one-shot to that length (with the 30 ms fade), for generators that hold a note longer than asked.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { BRAND } from './lib/paths.mjs';
const DIR = path.join(BRAND, 'audio/sfx'), PFILE = path.join(DIR, 'palette.json');
const P = JSON.parse(fs.readFileSync(PFILE, 'utf8'));
const argv = process.argv.slice(2), cmd = argv[0] || 'list';
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const flag = (k) => argv.includes('--' + k);
const ids = argv.slice(1).filter((a, i, arr) => !a.startsWith('--') && !(arr[i - 1] || '').match(/^--(takes|raw)$/));
const RAW = path.resolve(opt('raw', path.join(os.tmpdir(), 'agency-sfx-raw')));
const ff = (args, o = {}) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], o);
// decode to mono 48 kHz float samples
const pcm = (f) => { const b = ff(['-i', f, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 }); return new Float32Array(b.buffer, b.byteOffset, b.byteLength >> 2); };
const db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
const rms = (a, s, e) => { let q = 0; for (let i = s; i < e; i++) q += a[i] * a[i]; return Math.sqrt(q / Math.max(1, e - s)); };

// measure one take: peak, where the sound starts, how quiet the tail is, clipping, and (loops) how even the level is
function measure(f, kind) {
  const a = pcm(f), n = a.length; let peak = 0, clip = 0; for (let i = 0; i < n; i++) { const v = Math.abs(a[i]); if (v > peak) peak = v; if (v > 0.985) clip++; }
  let onset = 0; while (onset < n && Math.abs(a[onset]) < peak * 0.08) onset++;
  const tail = rms(a, Math.floor(n * 0.88), n), body = rms(a, onset, Math.min(n, onset + Math.floor(48000 * 0.25)));
  const wins = 8, lv = []; for (let w = 0; w < wins; w++) lv.push(db(rms(a, Math.floor(n * w / wins), Math.floor(n * (w + 1) / wins))));
  const mean = lv.reduce((x, y) => x + y, 0) / wins, spread = Math.sqrt(lv.reduce((x, y) => x + (y - mean) ** 2, 0) / wins);
  const m = { peakDb: +db(peak).toFixed(1), onsetMs: Math.round(onset / 48), tailDb: +db(tail).toFixed(1), bodyDb: +db(body).toFixed(1), clip, spreadDb: +spread.toFixed(1), len: +(n / 48000).toFixed(3) };
  // one-shots: a clear body over a quiet tail, an early start, no clipping. loops: an even level with no silent stretch, no clipping.
  m.score = kind === 'loop' ? -m.spreadDb * 3 - (clip ? 12 : 0) + Math.min(0, Math.min(...lv) + 50)
    : (m.bodyDb - m.tailDb) - (clip ? 12 : 0) - Math.max(0, m.onsetMs - 120) / 20 - (m.peakDb < -30 ? 20 : 0);
  m.score = +m.score.toFixed(1); return m;
}

async function take(s, k) {
  const { ENT_TOOLS_URL, ENT_TOOLS_API_KEY } = process.env; if (!ENT_TOOLS_URL || !ENT_TOOLS_API_KEY) throw new Error('ENT_TOOLS_URL and ENT_TOOLS_API_KEY are not set (source ~/.sandbox-env)');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';   // the sandbox gateway is signed by the GoA certificate authority
  const f = path.join(RAW, `${s.id}-take${k}.mp3`);
  for (let tries = 0; tries < 4; tries++) {
    const r = await fetch(`${ENT_TOOLS_URL}/v1/proxy/elevenlabs/v1/sound-generation`, { method: 'POST', headers: { 'X-API-Key': ENT_TOOLS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${s.prompt}. ${P.style}`, duration_seconds: Math.max(0.5, s.dur), prompt_influence: s.influence ?? 0.65 }) });
    if (r.ok) { fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); return f; }
    if (r.status === 429 || r.status >= 500) { await new Promise(z => setTimeout(z, 4000 * (tries + 1))); continue; }
    throw new Error(`${s.id}: sound generation answered ${r.status} ${(await r.text()).slice(0, 200)}`);
  }
  throw new Error(`${s.id}: sound generation kept failing`);
}

// trim silence at both ends, short fades, peak to -3 dBFS, 48 kHz stereo WAV and an m4a copy
function prepare(src, s) {
  const wav = path.join(DIR, `${s.id}.wav`), tmp = path.join(RAW, `${s.id}-trim.wav`);
  // start 4 ms before the first sample that reaches 8 % of the peak, so the event time is the moment the sound is heard
  const st = Math.max(0, measure(src, s.kind).onsetMs / 1000 - 0.004).toFixed(4);
  const trim = s.kind === 'loop'
    ? `atrim=start=${st},asetpts=PTS-STARTPTS,atrim=0:${s.dur},afade=t=in:d=0.006,areverse,afade=t=in:d=0.02,areverse`
    : `atrim=start=${st},asetpts=PTS-STARTPTS,${s.max_s ? `atrim=0:${s.max_s},` : ''}areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.01,afade=t=in:d=0.03,areverse,afade=t=in:d=0.002`;
  ff(['-i', src, '-af', `aresample=48000,aformat=channel_layouts=stereo,highpass=f=40,${trim}`, tmp]);
  const pk = measure(tmp, s.kind).peakDb;
  ff(['-i', tmp, '-af', `volume=${(-3 - pk).toFixed(2)}dB`, '-ar', '48000', '-c:a', 'pcm_s16le', wav]);
  ff(['-i', wav, '-c:a', 'aac', '-b:a', '128k', path.join(DIR, `${s.id}.m4a`)]);
  return measure(wav, s.kind);
}

if (cmd === 'list') {
  for (const s of P.sounds) console.log(`${s.id.padEnd(13)} ${s.kind.padEnd(5)} ${String(s.length_s ?? '-').padStart(6)} s  ${String(s.gain_db).padStart(4)} dB  ${s.file ? '' : '(not generated) '}${s.use}`);
} else if (cmd === 'generate') {
  fs.mkdirSync(RAW, { recursive: true }); const takes = +opt('takes', 3);
  const want = P.sounds.filter(s => ids.length ? ids.includes(s.id) : !s.file || flag('force'));
  if (ids.length && !flag('force')) for (const s of want) if (s.file) { console.log(`${s.id} exists: add --force to replace it`); }
  for (const s of want.filter(s => !s.file || flag('force'))) {
    const got = []; for (let k = 1; k <= takes; k++) { const f = await take(s, k); got.push({ k, f, m: measure(f, s.kind) }); }
    got.sort((a, b) => b.m.score - a.m.score); const best = got[0], m = prepare(best.f, s);
    Object.assign(s, { file: `brand/audio/sfx/${s.id}.wav`, take: `${best.k} of ${takes}`, generated: new Date().toISOString().slice(0, 10), length_s: m.len,
      measured: { peak_db: m.peakDb, onset_ms: m.onsetMs, tail_db: m.tailDb } });
    fs.writeFileSync(PFILE, JSON.stringify(P, null, 2) + '\n');
    console.log(`${s.id}: take ${best.k} (scores ${got.map(g => `${g.k}:${g.m.score}`).join(' ')}) -> ${m.len} s, peak ${m.peakDb} dB, starts at ${m.onsetMs} ms, tail ${m.tailDb} dB`);
  }
} else if (cmd === 'check') {
  let bad = 0;
  for (const s of P.sounds) { const f = path.join(DIR, `${s.id}.wav`);
    if (!fs.existsSync(f)) { console.log(`MISSING ${s.id}`); bad++; continue; }
    const m = measure(f, s.kind), sr = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=sample_rate', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim();
    const faults = [sr !== '48000' && `sample rate ${sr}`, m.peakDb > -2.5 && `peak ${m.peakDb} dB`, s.kind !== 'loop' && m.onsetMs > 25 && `starts at ${m.onsetMs} ms`, m.clip && 'clipping'].filter(Boolean);
    console.log(`${faults.length ? 'FAULT' : 'ok   '} ${s.id.padEnd(13)} ${m.len} s  peak ${m.peakDb} dB  start ${m.onsetMs} ms  tail ${m.tailDb} dB ${faults.join(', ')}`); bad += faults.length ? 1 : 0; }
  process.exit(bad ? 1 : 0);
} else { console.error('commands: list | generate [id ...] [--takes n] [--force] [--raw dir] | check'); process.exit(2); }
