#!/usr/bin/env node
// Motion and cost checks for a film on the spatial stage (world.space.cam; tools/camcheck.mjs reads the map camera, state.cam).
//   nice node tools/motion-check.mjs --project <film dir> [--moves 109.9,151,211.6] [--racks 37,119] [--shots 58,112,131,218,226]
// Prints: the camera's fastest yaw, pitch and travel over the whole film and where; TL.warnings (cue words that were not found);
// consecutive-frame differences (ImageMagick `compare -metric MAE`) over 7 frames at each --moves / --racks time: a pop shows as one
// large step among small ones; and whole-frame draw + capture time at each --shots time (run on a quiet machine: load inflates it).
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
await close(); process.exit(0);
