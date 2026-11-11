#!/usr/bin/env node
// Headless rehearsal of the show: starts the server, opens the control and a program stage, steps through every scene type,
// checks there are no console errors, that a video plays with its sound going through the mixer, and that a reloaded stage
// returns to the step on air. Writes stage and control screenshots to show/screens/ (JPG).
//   node show/test/run.mjs [--agenda show/samples/agency-2026.json] [--keep-png]
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'show/screens'); fs.mkdirSync(OUT, { recursive: true });
const a = process.argv.slice(2), AGENDA = a.includes('--agenda') ? a[a.indexOf('--agenda') + 1] : 'show/samples/agency-2026.json';
const PORT = 18765 + Math.floor(Math.random() * 1000);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

const srv = spawn(process.execPath, [path.join(ROOT, 'show/server.mjs'), '--port', String(PORT), '--agenda', AGENDA, '--memory'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => srv.stdout.on('data', (d) => { if (String(d).includes('start page')) r(); }));
const base = `http://127.0.0.1:${PORT}/show`;
const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const ctx = await browser.newContext();
const errors = [];
const watch = (p, name) => { p.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); }); p.on('pageerror', (e) => errors.push(`${name}: ${e.message}`)); };

const control = await ctx.newPage(); watch(control, 'control');
await control.setViewportSize({ width: 1600, height: 960 });
// start from a clean saved state
await control.goto(`${base}/control.html?agenda=${encodeURIComponent(AGENDA)}`); await control.evaluate(() => localStorage.clear());
await control.goto(`${base}/control.html?agenda=${encodeURIComponent(AGENDA)}`, { waitUntil: 'networkidle' });
await control.waitForFunction(() => window.SHOW_CONTROL);
const stage = await ctx.newPage(); watch(stage, 'stage');
await stage.setViewportSize({ width: 1920, height: 1080 });
await stage.goto(`${base}/stage.html?mode=program`, { waitUntil: 'networkidle' });
await stage.waitForFunction(() => window.SHOW_STAGE && window.SHOW_STAGE.scene);
await stage.mouse.click(5, 5);   // a user gesture, as the operator's one click on the stage window
await wait(800);

// rehearsal clock: the morning of day 1
await control.fill('#rhDate', '2026-12-07'); await control.fill('#rhTime', '08:51'); await control.click('#rhSet');
const shots = [];
async function shot(name, step, settle = 2600, extra) {
  if (step) await control.evaluate((s) => window.SHOW_CONTROL.take(s), step);
  if (extra) await extra();
  await wait(settle);
  const f = path.join(OUT, `${name}.png`); await stage.screenshot({ path: f }); shots.push(f);
  const sc = await stage.evaluate(() => window.SHOW_STAGE.scene);
  console.log(`     ${name}: scene ${sc}`);
  return sc;
}
const find = async (id, scene = 0) => control.evaluate(([id, scene]) => { const ag = window.SHOW_CONTROL.agenda; for (const [d, day] of ag.days.entries()) { const i = day.segments.findIndex((s) => s.id === id); if (i >= 0) return { day: d, seg: i, scene, slide: 0 }; } return null; }, [id, scene]);

check(await shot('01-holding', await find('d1-doors')) === 'holding', 'holding scene');
check(await shot('02-countdown', await find('d1-count')) === 'countdown', 'countdown scene');
check(await shot('03-opening', await find('d1-open', 0), 3800) === 'opening', 'opening scene');
check(await shot('04-bumper', await find('d1-open', 1)) === 'bumper', 'day bumper scene');
check(await shot('05-intro', await find('d1-open', 2), 2800) === 'intro', 'speaker welcome scene');
check(await shot('06-title', await find('d1-key', 1)) === 'title', 'session title card');
// slides with the auto lower third
check(await shot('07-slides-lower-third', await find('d1-key', 2), 2600) === 'slides', 'slides scene + lower third');
await control.evaluate(() => window.SHOW_CONTROL.goNext()); await wait(900);
const slideNow = await control.evaluate(() => window.SHOW_CONTROL.state.slide);
check(slideNow === 1, `GO steps to the next slide (slide index ${slideNow})`);
await control.evaluate(() => window.SHOW_CONTROL.goBack()); await wait(600);
check((await control.evaluate(() => window.SHOW_CONTROL.state.slide)) === 0, 'BACK returns to the previous slide');
check(await shot('08-stat', await find('d1-stat'), 2600) === 'stat', 'stat reveal');
check(await shot('09-demo-title', await find('d1-demo1')) === 'title', 'demo title card');
check(await shot('10-break', await find('d1-break1')) === 'break', 'break scene');
check(await shot('11-panel', await find('d1-panel')) === 'panel', 'panel scene');
// manual lower third over the panel
await control.evaluate(() => { const C = window.SHOW_CONTROL; C.lowerOn(C.agenda.days[0].segments.find((s) => s.id === 'd1-panel').speakers[1], 0); });
await shot('12-panel-lower-third', null, 1600);
await control.evaluate(() => window.SHOW_CONTROL.lowerOff());
check(await shot('13-thanks', await find('d1-thanks')) === 'thanks', 'thanks scene');
check(await shot('14-closing', await find('d1-close'), 3000) === 'closing', 'closing scene');

// video with sound: plays, its sound reaches the mixer, and the show moves on when it ends (autoAdvance)
await control.evaluate(async (s) => window.SHOW_CONTROL.take(s), await find('d1-sizzle'));
await wait(2500);
const v = await stage.evaluate(() => { const vid = document.querySelector('video'); const m = window.SHOW_STAGE.mixer; let peak = 0;
  for (let i = 0; i < 5; i++) peak = Math.max(peak, m?.level?.() || 0); return { t: vid?.currentTime || 0, muted: vid?.muted, audio: vid?.webkitAudioDecodedByteCount || 0, ctx: m?.ctx?.state, peak }; });
const f = path.join(OUT, '15-video.png'); await stage.screenshot({ path: f }); shots.push(f);
check(v.t > 1 && !v.muted, `video plays unmuted (t=${v.t.toFixed(2)} s)`);
check(v.audio > 0, `video sound is decoded (${v.audio} bytes)`);
check(v.ctx === 'running' && v.peak > 0.001, `sound reaches the mixer output (context ${v.ctx}, peak ${v.peak.toFixed(3)})`);
await wait(6500);
const after = await control.evaluate(() => window.SHOW_CONTROL.agenda.days[0].segments[window.SHOW_CONTROL.state.seg].id);
check(after === 'd1-stat', `the show advanced when the video ended (now on ${after})`);

// a sting through the mixer
await control.evaluate(() => window.SHOW_CONTROL.fire('swell-transition')); await wait(700);
const pk = await stage.evaluate(() => window.SHOW_STAGE.mixer.level());
check(pk > 0.001, `a sound pad plays (peak ${pk.toFixed(3)})`);

// the stage reloads and lands on the step on air
await control.evaluate(async (s) => window.SHOW_CONTROL.take(s), await find('d1-panel'));
await wait(1200); await stage.reload({ waitUntil: 'networkidle' }); await stage.waitForFunction(() => window.SHOW_STAGE?.scene); await wait(1500);
check((await stage.evaluate(() => window.SHOW_STAGE.scene)) === 'panel', 'a reloaded stage returns to the step on air');

// blackout and the other look
await control.evaluate(() => window.SHOW_CONTROL.send('blackout', { on: true })); await wait(900);
const black = await stage.evaluate(() => getComputedStyle(document.querySelector('#black')).opacity);
check(+black > 0.95, `blackout (opacity ${black})`);
await control.evaluate(async () => { const C = window.SHOW_CONTROL; await C.send('blackout', { on: false }); await C.send('theme', { name: 'mvai' }); });
await shot('16-mvai-opening', await find('d1-open', 0), 3800);
await shot('17-mvai-intro', await find('d1-open', 2), 2800);
await shot('18-mvai-countdown', await find('d1-count'), 2400);
await control.evaluate(() => window.SHOW_CONTROL.send('theme', { name: 'compliant' }));
await shot('19-day3-bumper', { day: 2, seg: 2, scene: 0, slide: 0 }, 2400);

// the control booth itself
await control.evaluate(async (s) => window.SHOW_CONTROL.take(s), await find('d1-key', 2)); await wait(2500);
const cf = path.join(OUT, '00-control.png'); await control.screenshot({ path: cf }); shots.push(cf);

check(errors.length === 0, `no console errors${errors.length ? ': ' + errors.slice(0, 5).join(' | ') : ''}`);
await browser.close(); srv.kill();
for (const p of shots) { execFileSync('convert', [p, '-resize', '1600x', '-quality', '80', p.replace(/\.png$/, '.jpg')]); if (!a.includes('--keep-png')) fs.unlinkSync(p); }
execFileSync('montage', [...shots.filter((p) => !p.includes('00-control')).map((p) => p.replace(/\.png$/, '.jpg')), '-tile', '4x', '-geometry', '480x270+6+6', '-background', '#0E2238', path.join(OUT, 'contact-sheet.jpg')]);
console.log(`${fails.length ? fails.length + ' check(s) failed' : 'all checks passed'}; screenshots in show/screens/`);
process.exit(fails.length ? 1 : 0);
