#!/usr/bin/env node
// Motion and cost checks for a film on the spatial stage (world.space.cam; tools/camcheck.mjs reads the map camera, state.cam).
//   nice node tools/motion-check.mjs --project <film dir> [--moves 109.9,151,211.6] [--racks 37,119] [--shots 58,112,131,218,226]
// Prints: the camera's fastest yaw, pitch and travel over the whole film and where; TL.warnings (cue words that were not found);
// consecutive-frame differences (ImageMagick `compare -metric MAE`) over 7 frames at each --moves / --racks time: a pop shows as one
// large step among small ones; whole-frame draw + capture time at each --shots time (run on a quiet machine: load inflates it); and
// with --flicker <rendered frames dir> [--from s --to s], a per-window flicker check over the rendered frames (see below). Zero flags passes.
import { openFilm } from './lib/film-page.mjs';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const project = path.resolve(arg('project', '.')), list = n => String(arg(n, '')).split(',').filter(Boolean).map(Number);
const { page, close } = await openFilm({ project });
const cam = await page.evaluate(() => { const { TL, FPS, DUR } = window.film; let py = null, pp = null, pos = null, maxYaw = [0, 0], maxPitch = [0, 0], maxV = [0, 0];
  for (let f = 0; f < Math.round(DUR * FPS); f++) { const c = TL.stateAt(f / FPS).world?.space?.cam; if (!c) continue;
    if (py !== null) { const dy = Math.abs(c.yaw - py) * FPS, dp = Math.abs(c.pitch - pp) * FPS, v = Math.hypot(c.x - pos[0], c.y - pos[1], c.z - pos[2]) * FPS;
      if (dy > maxYaw[0]) maxYaw = [+dy.toFixed(1), +(f / FPS).toFixed(2)]; if (dp > maxPitch[0]) maxPitch = [+dp.toFixed(1), +(f / FPS).toFixed(2)]; if (v > maxV[0]) maxV = [Math.round(v), +(f / FPS).toFixed(2)]; }
    py = c.yaw; pp = c.pitch; pos = [c.x, c.y, c.z]; }
  return { maxYawDegPerS: maxYaw, maxPitchDegPerS: maxPitch, maxTravelPxPerS: maxV, warnings: TL.warnings || [] }; });
console.log(JSON.stringify(cam));
const cdp = await page.context().newCDPSession(page), out = path.join(project, 'out', 'mc'); fs.mkdirSync(out, { recursive: true });
const shot = async (f, name) => { const t0 = Date.now(); await page.evaluate(n => window.film.frame(n), f); const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }); const ms = Date.now() - t0; fs.writeFileSync(path.join(out, name), Buffer.from(s.data, 'base64')); return ms; };
for (const [kind, ts] of [['move', list('moves')], ['focus rack', list('racks')]]) for (const t of ts) { const f0 = Math.round(t * 60), d = [];
  for (let i = 0; i < 7; i++) await shot(f0 + i, `f${i}.jpg`);
  for (let i = 0; i < 6; i++) { const r = spawnSync('compare', ['-metric', 'MAE', path.join(out, `f${i}.jpg`), path.join(out, `f${i + 1}.jpg`), 'null:']); d.push(+((r.stderr + '' + r.stdout).match(/\(([\d.e-]+)\)/)?.[1] ?? NaN)); }
  const mx = Math.max(...d), md = [...d].sort((a, b) => a - b)[3]; console.log(`${kind} at ${t} s: frame-to-frame MAE ${d.map(x => x.toFixed(4)).join(' ')}${mx > md * 3 + 0.002 ? '   <-- POP?' : ''}`); }
for (const t of list('shots')) { const ms = []; for (let i = 0; i < 4; i++) ms.push(await shot(Math.round(t * 60) + i * 7, 'x.jpg')); console.log(`shot at ${t} s: ms/frame ${ms.slice(1).join(' ')}`); }
// ---- --flicker <frames dir>: every window's own picture over time, read from RENDERED frames -------------------------------
// For each frame the stage gives each visible window's screen box (stage.screenBoxes, no drawing). Inside that box (inset, clipped to the
// frame, the caption strip left out) two numbers are taken from the rendered frame: mean luminance and mean edge strength (sharpness).
// A flicker is a jump in either that the frames around it do not explain: far larger than the local frame-to-frame change AND undone or
// not continued by the next frames (a step that stays, such as a button pressed or a row arriving, moves once and is far smaller).
// Zero flags is the pass. --from / --to limit the seconds; --json writes the flags.
const fdir = arg('flicker', '');
if (fdir) { const W = 640, H = 360, k = W / 1920, t0 = +arg('from', 0), t1 = +arg('to', 1e9);
  const { boxes, FPS, N } = await page.evaluate(() => { const { TL, FPS, DUR, stage } = window.film, N = Math.round(DUR * FPS), boxes = [];
    for (let f = 0; f < N; f++) boxes.push(stage.screenBoxes(TL.stateAt(f / FPS).world.space).map(b => [b.id, +b.a.toFixed(3), Math.round(b.x0), Math.round(b.y0), Math.round(b.x1), Math.round(b.y1), Math.round(b.depth)])); return { boxes, FPS, N }; });
  const a = Math.max(0, Math.round(t0 * FPS)), b = Math.min(N, Math.round(t1 * FPS)), series = new Map();   // id -> [{ f, L, E }]
  const { spawn } = await import('node:child_process');
  const ff = spawn('nice', ['ffmpeg', '-loglevel', 'error', '-threads', '4', '-start_number', String(a), '-framerate', String(FPS), '-i', path.join(path.resolve(fdir), 'f%06d.jpg'), '-frames:v', String(b - a), '-vf', `scale=${W}:${H}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
  let buf = Buffer.alloc(0), f = a; const sz = W * H;
  const measure = (px, fr) => { const bs = boxes[fr];
    for (const [id, al, X0, Y0, X1, Y1, depth] of bs) { if (al < 0.98) continue; const w = X1 - X0, h = Y1 - Y0;
      // the part of the window nothing nearer covers is not known here; windows in front are skipped by taking only boxes no nearer box overlaps
      if (bs.some(o => o[0] !== id && o[6] < depth && o[2] < X1 && o[4] > X0 && o[3] < Y1 && o[5] > Y0)) continue;
      const x0 = Math.max(0, Math.ceil((X0 + w * 0.06) * k)), x1 = Math.min(W, Math.floor((X1 - w * 0.06) * k)), y0 = Math.max(Math.ceil(150 * k), Math.ceil((Y0 + h * 0.06) * k)), y1 = Math.min(Math.floor(930 * k), Math.floor((Y1 - h * 0.06) * k));
      if (x1 - x0 < 40 || y1 - y0 < 24 || (x1 - x0) * (y1 - y0) < 0.45 * w * h * k * k * 0.77) continue;   // mostly on screen
      let L = 0, E = 0, n = 0; for (let y = y0; y < y1; y++) { const r = y * W; for (let x = x0; x < x1 - 1; x++) { const v = px[r + x]; L += v; E += Math.abs(px[r + x + 1] - v); n++; } }
      if (!series.has(id)) series.set(id, []); series.get(id).push({ f: fr, L: L / n, E: E / n }); } };
  await new Promise(res => { ff.stdout.on('data', d => { buf = buf.length ? Buffer.concat([buf, d]) : d; while (buf.length >= sz) { measure(buf.subarray(0, sz), f++); buf = buf.subarray(sz); } }); ff.on('close', res); });
  const flags = [], med = v => { const s = [...v].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  for (const [id, S] of series) for (const key of ['L', 'E']) { const floor = key === 'L' ? 0.6 : 0.2, big = key === 'L' ? 4 : 1.5;
    for (let i = 8; i < S.length - 8; i++) { if (S[i].f - S[i - 8].f !== 8 || S[i + 8].f - S[i].f !== 8) continue;   // a continuous run only
      const d = S[i][key] - S[i - 1][key], around = []; for (let j = i - 7; j <= i + 7; j++) if (j !== i && j !== i + 1) around.push(Math.abs(S[j][key] - S[j - 1][key]));
      const m = med(around), drift = S[i + 6][key] - S[i - 6][key];
      // a jump: far above the local change; and not the start of a move that continues (the value 6 frames on is nearer the old value than the new, or the jump is reversed at once)
      // flagged: a jump far above the local change that is undone within three frames (a flash), or that leaves the value where it was six
      // frames on (a blip), or a lasting step so large that no row, press or typed word explains it (a change of material or a dropped layer)
      const undone = [1, 2, 3].some(q => Math.sign(S[i + q][key] - S[i][key]) === -Math.sign(d) && Math.abs(S[i + q][key] - S[i][key]) > Math.abs(d) * 0.6);
      if (Math.abs(d) > Math.max(floor, m * 6) && (undone || Math.abs(drift) < Math.abs(d) * 0.4 || Math.abs(d) > big))
        flags.push({ id, metric: key === 'L' ? 'luminance' : 'sharpness', frame: S[i].f, t: +(S[i].f / FPS).toFixed(2), jump: +d.toFixed(2), local: +m.toFixed(3) }); } }
  flags.sort((x, y) => x.frame - y.frame);
  const groups = []; for (const fl of flags) { const g = groups[groups.length - 1]; if (g && g.id === fl.id && fl.frame - g.last <= 30) { g.last = fl.frame; g.n++; g.max = Math.max(g.max, Math.abs(fl.jump)); } else groups.push({ id: fl.id, from: fl.t, first: fl.frame, last: fl.frame, n: 1, max: Math.abs(fl.jump), metric: fl.metric }); }
  console.log(`flicker check: ${b - a} frames, ${series.size} windows measured, ${flags.length} flags in ${groups.length} stretches`);
  for (const g of groups) console.log(`  ${g.id}: ${g.n} jump(s) from ${g.from} s (frames ${g.first}-${g.last}), largest ${g.max.toFixed(2)} (${g.metric})`);
  if (arg('json', '')) fs.writeFileSync(arg('json'), JSON.stringify(flags)); }
await close(); process.exit(0);
