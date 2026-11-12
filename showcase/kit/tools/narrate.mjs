// Voices every narration line with the approved Agency narrator (ElevenLabs eleven_v4 through Ent Tools, with character
// timestamps) and writes narration/<id>.mp3 and narration/timing.json (duration, speechEnd, word times per line).
// Lines whose text did not change are kept, so revisions are cheap. Then checks every line ends before the next one starts.
//   node tools/narrate.mjs --project <film dir> [--force] [--check-only]
// narration/script.json: { "voice": {...}, "lines": [{ "id": "n01", "at": 3.46, "text": "..." }, ...] }   (at = start second in the film)
// Voice: from the design repo's registry (brand/voice/voices.json), role "narrator" unless script.voice.role names another approved
// role. A voice id that is not in the registry is refused (pass --allow-unregistered only with the owner's written approval).
// Writing: the repo's lint (scripts/lint/lint.py: banned words, spoken-English rules, sentence length) runs on every line first;
// --strict stops on any lint error.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { REPO, BRAND } from './lib/paths.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const DIR = path.join(path.resolve(arg('project', '.')), 'narration');
const script = JSON.parse(fs.readFileSync(path.join(DIR, 'script.json')));
// the approved voice, from the registry (one source for MVAI, the show announcements and these films)
const REG = JSON.parse(fs.readFileSync(path.join(BRAND, 'voice/voices.json'), 'utf8'));
const role = script.voice?.role || 'narrator', R = REG.roles[role];
if (!R) { console.error(`voice role "${role}" is not in ${path.join(BRAND, 'voice/voices.json')} (roles: ${Object.keys(REG.roles).join(', ')})`); process.exit(2); }
if (R.status !== 'approved') console.log(`NOTE voice role "${role}" (${R.name}) is ${R.status}: the owner must approve it before release`);
const known = new Set(Object.values(REG.roles).map(r => r.voice_id));
if (script.voice?.voice_id && !known.has(script.voice.voice_id) && !process.argv.includes('--allow-unregistered')) {
  console.error(`voice ${script.voice.voice_id} is not in the registry; use a registry role, or --allow-unregistered with the owner's written approval`); process.exit(2); }
const { speed, ...settings } = R.settings;
const voice = { voice_id: script.voice?.voice_id || R.voice_id, model_id: REG.engine.model, settings: { ...settings, ...(script.voice?.settings || {}) } };
console.log(`voice: ${role} ${R.name} (${voice.voice_id}), ${voice.model_id}`);
// the repo's writing lint on the spoken lines (each line is checked as narration)
{ const tmp = path.join(os.tmpdir(), `narrate-lint-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ lines: script.lines.map(l => ({ id: l.id, narration: l.text })) }));
  const owner = path.join(path.resolve(arg('project', '.')), 'owner_lines.txt');
  const r = spawnSync('python3', [path.join(REPO, 'scripts/lint/lint.py'), ...(fs.existsSync(owner) ? ['--owner-lines', owner] : []), tmp], { encoding: 'utf8' });
  fs.unlinkSync(tmp);
  const out = (r.stdout || '') + (r.stderr || ''); if (out.trim()) console.log(out.trim().split('\n').map(x => 'LINT ' + x).join('\n'));
  if (r.status && process.argv.includes('--strict')) process.exit(1); }
const timingFile = path.join(DIR, 'timing.json');
const timing = fs.existsSync(timingFile) ? JSON.parse(fs.readFileSync(timingFile)) : {};
const { ENT_TOOLS_URL, ENT_TOOLS_API_KEY } = process.env;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // the sandbox gateway is signed by the GoA certificate authority
// narration rules that are mechanical (guides/NARRATION.md): no digits, no symbols, 25 words or fewer per sentence
for (const l of script.lines) {
  const probs = [];
  if (/\d/.test(l.text)) probs.push('digits (write numbers as they are said)');
  if (/[()\[\];–—%$&@]/.test(l.text)) probs.push('symbols or brackets');
  for (const s of l.text.split(/(?<=[.?!])\s+/)) if (s.split(/\s+/).length > 25) probs.push(`sentence over 25 words: "${s.slice(0, 40)}…"`);
  if (probs.length) console.log(`LINT ${l.id}: ${probs.join('; ')}`);
}
if (!process.argv.includes('--check-only')) for (const line of script.lines) {
  const mp3 = path.join(DIR, `${line.id}.mp3`);
  if (timing[line.id]?.text === line.text && fs.existsSync(mp3) && !process.argv.includes('--force')) { console.log(line.id, 'kept', timing[line.id].duration.toFixed(2)); continue; }
  const r = await fetch(`${ENT_TOOLS_URL}/v1/proxy/elevenlabs/v1/text-to-speech/${voice.voice_id}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST',
    headers: { 'X-API-Key': ENT_TOOLS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: line.text, model_id: voice.model_id, voice_settings: voice.settings }) });
  if (!r.ok) { console.log(line.id, 'FAILED', r.status, (await r.text()).slice(0, 300)); continue; }
  const j = await r.json();
  fs.writeFileSync(mp3, Buffer.from(j.audio_base64, 'base64'));
  const duration = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString().trim();
  const a = j.alignment, words = []; let w = '', ws = 0;
  for (let i = 0; i < a.characters.length; i++) { const c = a.characters[i];
    if (c === ' ') { if (w) words.push({ w, s: +ws.toFixed(3), e: +a.character_end_times_seconds[i - 1].toFixed(3) }); w = ''; } else { if (!w) ws = a.character_start_times_seconds[i]; w += c; } }
  if (w) words.push({ w, s: +ws.toFixed(3), e: +a.character_end_times_seconds[a.characters.length - 1].toFixed(3) });
  timing[line.id] = { text: line.text, duration, speechEnd: words[words.length - 1].e, words };
  fs.writeFileSync(timingFile, JSON.stringify(timing, null, 1));
  console.log(line.id, 'voiced', duration.toFixed(2), 's', words.length, 'words');
}
// overlap check: each line must end 0.25 s before the next starts
const lines = [...script.lines].filter(l => l.at !== undefined).sort((a, b) => a.at - b.at); let bad = 0;
for (let i = 0; i < lines.length; i++) { const t = timing[lines[i].id]; if (!t) continue; const end = lines[i].at + t.speechEnd, next = lines[i + 1]?.at;
  if (next !== undefined && end > next - 0.25) { bad++; console.log(`OVERLAP ${lines[i].id} ends ${end.toFixed(2)} s, ${lines[i + 1].id} starts ${next} s`); } }
console.log(`total speech ${Object.values(timing).reduce((s, t) => s + t.duration, 0).toFixed(1)} s; overlaps ${bad}`);
