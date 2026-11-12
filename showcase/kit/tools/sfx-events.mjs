// Collects a film's sound-effect events for the mix. A film's web/timeline.js may `export const SFX = [...]`, or return `sfx` from
// createTimeline: an array of { at: seconds, id: '<palette id>', gain: dB (optional, added to the palette's default), dur: seconds
// (loops: type-loop, count), pan: -1..1 (optional) }. The id 'key' takes the three key variants in turn.
//   node tools/sfx-events.mjs --project <film dir>      -> <film>/out/sfx-events.json (read by tools/mix-audio.mjs)
// Sound effects must stay sparse: the tool warns when two events are closer than 60 ms or when more than 6 fall in any second, and
// stops on an id that is not in the palette (brand/audio/sfx/palette.json; list: node tools/sfx.mjs list).
import fs from 'node:fs';
import path from 'node:path';
import { openFilm, arg } from './lib/film-page.mjs';
import { BRAND } from './lib/paths.mjs';
const ROOT = path.resolve(arg('project', '.'));
const P = JSON.parse(fs.readFileSync(path.join(BRAND, 'audio/sfx/palette.json'), 'utf8'));
const byId = new Map(P.sounds.map(s => [s.id, s])), groups = {};
for (const s of P.sounds) if (s.group) (groups[s.group] ||= []).push(s.id);
const { page, close, info } = await openFilm();
const raw = await page.evaluate(async () => { const m = await import('/timeline.js'); let s = m.SFX ?? window.film.TL.sfx ?? null; if (typeof s === 'function') s = s(); return s; });
await close();
if (!Array.isArray(raw)) { console.log('this film has no SFX (export const SFX = [...] in web/timeline.js, or return sfx from createTimeline)'); process.exit(0); }
const errs = [], warn = [], turn = {}, events = [];
for (const [i, e] of [...raw].sort((a, b) => a.at - b.at).entries()) {
  if (!Number.isFinite(e.at) || e.at < 0 || e.at > info.DUR) { errs.push(`event ${i}: at ${e.at} is outside the film (0 to ${info.DUR} s)`); continue; }
  let id = e.id; if (groups[id]) { turn[id] = (turn[id] ?? -1) + 1; id = groups[id][turn[id] % groups[id].length]; }
  const s = byId.get(id); if (!s) { errs.push(`${e.at} s: "${e.id}" is not in the palette`); continue; }
  if (!s.file) { errs.push(`${e.at} s: "${id}" has no file yet (node tools/sfx.mjs generate ${id})`); continue; }
  if (s.kind === 'loop' && !(e.dur > 0)) { errs.push(`${e.at} s: "${id}" is a loop and needs dur`); continue; }
  if (e.pan !== undefined && !(e.pan >= -1 && e.pan <= 1)) { errs.push(`${e.at} s: pan ${e.pan} must be -1 to 1`); continue; }
  events.push({ at: +(+e.at).toFixed(4), id, gain_db: +(s.gain_db + (e.gain ?? 0)).toFixed(2), ...(s.kind === 'loop' ? { dur: +e.dur, loop: true } : e.dur > 0 ? { dur: +e.dur } : {}), ...(e.pan ? { pan: e.pan } : {}) });
}
for (let i = 1; i < events.length; i++) if (events[i].at - events[i - 1].at < 0.06) warn.push(`${events[i - 1].at} s and ${events[i].at} s (${events[i - 1].id}, ${events[i].id}) are closer than 60 ms`);
for (let i = 0, j = 0; i < events.length; i++) { while (events[i].at - events[j].at >= 1) j++; if (i - j + 1 > 6) { warn.push(`more than 6 events in the second ending at ${events[i].at} s: thin them out`); i += 6; } }
const count = {}; for (const e of events) count[e.id] = (count[e.id] || 0) + 1;
console.log(`${events.length} events: ${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(', ')}`);
for (const w of warn) console.log('WARN', w); for (const e of errs) console.log('ERROR', e);
if (errs.length) process.exit(1);
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'out/sfx-events.json'), JSON.stringify({ palette: P.version, dur: info.DUR, events }, null, 1));
console.log('-> out/sfx-events.json');
