// Voices each narration line with the approved Agency narrator (ElevenLabs through Ent Tools, with character timestamps),
// then writes narration/<id>.mp3 and narration/timing.json (duration and word times per line). Lines already voiced with the same text are kept.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const DIR = path.resolve(import.meta.dirname, '../narration');
const script = JSON.parse(fs.readFileSync(path.join(DIR, 'script.json')));
const timingFile = path.join(DIR, 'timing.json');
const timing = fs.existsSync(timingFile) ? JSON.parse(fs.readFileSync(timingFile)) : {};
const { ENT_TOOLS_URL, ENT_TOOLS_API_KEY } = process.env;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // the sandbox gateway uses the GoA certificate authority (CLAUDE.md uses curl -k)
for (const line of script.lines) {
  const mp3 = path.join(DIR, `${line.id}.mp3`);
  if (timing[line.id]?.text === line.text && fs.existsSync(mp3) && !process.argv.includes('--force')) { console.log(line.id, 'kept', timing[line.id].duration.toFixed(2)); continue; }
  const r = await fetch(`${ENT_TOOLS_URL}/v1/proxy/elevenlabs/v1/text-to-speech/${script.voice.voice_id}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST',
    headers: { 'X-API-Key': ENT_TOOLS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: line.text, model_id: script.voice.model_id, voice_settings: script.voice.settings }) });
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
console.log('total speech', Object.values(timing).reduce((s, t) => s + t.duration, 0).toFixed(1), 's');
