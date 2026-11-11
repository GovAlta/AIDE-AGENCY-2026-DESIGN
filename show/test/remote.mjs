#!/usr/bin/env node
// Event-code test: the stage and the control in two separate browser contexts (two machines, so BroadcastChannel cannot help),
// joined by an event code over SSE. Checks the stage follows GO, BACK, video play/pause/seek, the lower third and blackout within
// 500 ms; that a stage cut off from the network recovers the exact state from the snapshot when it reconnects; the long-poll fallback;
// the PIN; and that video position reports reach the control.
//   node show/test/remote.mjs                      # spawns a server in memory mode
//   node show/test/remote.mjs --pg                 # two server instances on one Postgres (DATABASE_URL): stage on one, control on the other
//   node show/test/remote.mjs --base http://127.0.0.1:8080   # an already running server (a local container)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'show/screens'); fs.mkdirSync(OUT, { recursive: true });
const a = process.argv.slice(2), PG = a.includes('--pg'), BASE = a.includes('--base') ? a[a.indexOf('--base') + 1] : null;
const label = BASE ? 'container' : PG ? 'postgres, two instances' : 'memory';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = []; const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} [${label}] ${msg}`); if (!ok) fails.push(msg); };
const procs = [];
const prefix = `agency_show_test_${Date.now().toString(36)}_`;
async function server(port, env) {
  const p = spawn(process.execPath, [path.join(ROOT, 'show/server.mjs'), '--port', String(port), ...(PG ? [] : ['--memory'])], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
  procs.push(p); await new Promise((r, j) => { p.stdout.on('data', (d) => String(d).includes('start page') && r()); p.on('exit', (c) => j(new Error('server exited ' + c))); });
  return `http://127.0.0.1:${port}`;
}
const P = 19000 + Math.floor(Math.random() * 800);
let stageBase, ctlBase;
if (BASE) stageBase = ctlBase = BASE;
else if (PG) { if (!process.env.DATABASE_URL) { console.log('no DATABASE_URL: skipping the Postgres test'); process.exit(0); }
  stageBase = await server(P, { SHOW_TABLE_PREFIX: prefix }); ctlBase = await server(P + 1, { SHOW_TABLE_PREFIX: prefix }); }
else stageBase = ctlBase = await server(P, {});

const b = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const stageCtx = await b.newContext({ viewport: { width: 1920, height: 1080 } }), ctlCtx = await b.newContext({ viewport: { width: 1600, height: 960 } });
const errors = [];
const watch = (p, n) => { p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`${n}: ${m.text()}`); }); p.on('pageerror', (e) => errors.push(`${n}: ${e.message}`));
  p.on('response', (r) => { if (r.status() >= 404 && r.status() !== 401) errors.push(`${n}: HTTP ${r.status()} ${new URL(r.url()).pathname}`); }); };
try {
  // landing page and a new show
  const land = await ctlCtx.newPage(); watch(land, 'landing'); await land.goto(ctlBase + '/', { waitUntil: 'networkidle' });
  await land.waitForSelector('#agenda option', { state: 'attached' }); await land.click('#create'); await land.waitForSelector('#made', { state: 'visible' });
  const code = (await land.textContent('#mcode')).trim(), pin = (await land.textContent('#mpin')).trim();
  check(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(code) && /^\d{6}$/.test(pin), `new show from the start page: code ${code}`);
  if (!BASE && !PG) await land.screenshot({ path: path.join(OUT, 'remote-01-start-page.png'), fullPage: true });

  const stage = await stageCtx.newPage(); watch(stage, 'stage');
  await stage.goto(`${stageBase}/stage?code=${code}`, { waitUntil: 'load' }); await stage.waitForFunction(() => window.SHOW_STAGE?.state);
  await stage.mouse.click(5, 5); await wait(600);
  check(await stage.isVisible('#wait'), 'the stage waits for the control and shows the code');
  if (!BASE && !PG) await stage.screenshot({ path: path.join(OUT, 'remote-02-stage-waiting.png') });

  const ctl = await ctlCtx.newPage(); watch(ctl, 'control');
  await ctl.goto(`${ctlBase}/control?code=${code}&pin=${pin}`, { waitUntil: 'load' }); await ctl.waitForFunction(() => window.SHOW_CONTROL?.state);
  check(!(await ctl.url()).includes('pin='), 'the PIN leaves the control address bar');

  // helpers: send from the control, wait until the stage is at the control's rev, measure the delay
  const rev = (p) => p.evaluate(() => (window.SHOW_STAGE || window.SHOW_CONTROL).state.rev);
  async function follow(what, fn, extra = async () => true) {
    const t0 = Date.now(); await fn(); const want = await rev(ctl);
    try { await stage.waitForFunction((w) => window.SHOW_STAGE.state.rev >= w, want, { timeout: 3000 }); } catch {}
    const ms = Date.now() - t0, ok = (await rev(stage)) >= want && (await extra());
    check(ok && ms <= 500, `${what}: the stage follows in ${ms} ms`); return ms;
  }
  const step = (p) => p.evaluate(() => { const s = (window.SHOW_STAGE || window.SHOW_CONTROL).state; return `${s.day}.${s.seg}.${s.scene}.${s.slide}`; });
  await follow('GO (button)', () => ctl.click('#go'), () => stage.waitForFunction(() => document.querySelector('#wait').hidden, null, { timeout: 400 }).then(() => true, () => false));
  await follow('GO again', () => ctl.click('#go'));
  await follow('BACK (key)', () => ctl.keyboard.press('ArrowLeft'), async () => (await step(stage)) === (await step(ctl)));
  // video: take the sizzle, then pause and seek
  const vid = await ctl.evaluate(() => { const ag = window.SHOW_CONTROL.agenda; const i = ag.days[0].segments.findIndex((s) => s.type === 'video'); return { day: 0, seg: i, scene: 0, slide: 0 }; });
  await follow('take a video', () => ctl.evaluate((s) => window.SHOW_CONTROL.take(s), vid), () => stage.waitForFunction(() => window.SHOW_STAGE.state.video && window.SHOW_STAGE.state.video.state === 'playing', null, { timeout: 300 }).then(() => true, () => false));
  try { await stage.waitForFunction(() => window.SHOW_STAGE.scene === 'video', null, { timeout: 4000 }); }   // the scene swaps at the transition's cover point
  catch { console.log('     stage:', await stage.evaluate(() => JSON.stringify({ rev: window.SHOW_STAGE.state.rev, step: [window.SHOW_STAGE.state.day, window.SHOW_STAGE.state.seg, window.SHOW_STAGE.state.scene], video: window.SHOW_STAGE.state.video, scene: window.SHOW_STAGE.scene })),
    'control:', await ctl.evaluate(() => JSON.stringify({ rev: window.SHOW_CONTROL.state.rev, step: [window.SHOW_CONTROL.state.day, window.SHOW_CONTROL.state.seg, window.SHOW_CONTROL.state.scene], video: window.SHOW_CONTROL.state.video }))); throw new Error('the stage did not reach the video scene'); }
  await wait(2500);
  const vt = await stage.evaluate(() => { const v = document.querySelector('video'); return { t: v?.currentTime || 0, muted: v?.muted, audio: v?.webkitAudioDecodedByteCount || 0 }; });
  check(vt.t > 1 && !vt.muted && vt.audio > 0, `the stage plays the video with its sound (t=${vt.t.toFixed(2)} s)`);
  await wait(1200);
  const rep = await ctl.evaluate(() => window.SHOW_CONTROL.status?.video);
  check(rep && Math.abs(rep.t - vt.t) < 3 && rep.t > 1, `the control sees the stage's video position (${rep?.t?.toFixed(2)} s)`);
  await follow('pause the video', () => ctl.evaluate(() => window.SHOW_CONTROL.send('video', { action: 'pause' })), () => stage.waitForFunction(() => document.querySelector('video')?.paused, null, { timeout: 500 }).then(() => true, () => false));
  await follow('seek the video to 1.5 s', () => ctl.evaluate(() => window.SHOW_CONTROL.send('video', { action: 'seek', pos: 1.5 })),
    () => stage.waitForFunction(() => Math.abs(document.querySelector('video').currentTime - 1.5) < 0.3, null, { timeout: 800 }).then(() => true, () => false));
  // lower third and blackout
  await ctl.evaluate(() => window.SHOW_CONTROL.take({ day: 0, seg: window.SHOW_CONTROL.agenda.days[0].segments.findIndex((s) => s.type === 'panel'), scene: 0, slide: 0 }));
  await follow('lower third on', () => ctl.evaluate(() => { const C = window.SHOW_CONTROL; return C.lowerOn(C.agenda.days[0].segments.find((s) => s.type === 'panel').speakers[0], 0); }),
    () => stage.waitForFunction(() => !document.querySelector('#lower').hidden, null, { timeout: 400 }).then(() => true, () => false));
  await follow('lower third off', () => ctl.keyboard.press('Escape'));
  await follow('blackout on', () => ctl.keyboard.press('b'), () => stage.waitForFunction(() => document.querySelector('#black').classList.contains('on'), null, { timeout: 300 }).then(() => true, () => false));
  await follow('blackout off', () => ctl.keyboard.press('b'));
  if (!BASE && !PG) { await wait(1200); await ctl.screenshot({ path: path.join(OUT, 'remote-03-control.png') }); }

  // the stage loses the network: the control moves on; when the link returns the snapshot brings the stage to the same step
  // block the stage's event stream and drop the open connection: EventSource retries on its own until the link is back
  const blocked = /\/api\/shows\/[^/]+\/(events|state)/;
  await stageCtx.route(blocked, (r) => r.abort()); await stage.evaluate(() => window.SHOW_STAGE.transport.reconnect()); await wait(800);
  await ctl.click('#go'); await ctl.click('#go'); await ctl.evaluate(() => window.SHOW_CONTROL.send('blackout', { on: true })); await ctl.evaluate(() => window.SHOW_CONTROL.send('blackout', { on: false }));
  const behind = (await rev(stage)) < (await rev(ctl));
  await stageCtx.unroute(blocked);
  const t0 = Date.now();
  try { await stage.waitForFunction((w) => window.SHOW_STAGE.state.rev >= w, await rev(ctl), { timeout: 15000 }); } catch {}
  check(behind && (await step(stage)) === (await step(ctl)) && (await rev(stage)) === (await rev(ctl)), `a stage that lost its link recovers the exact state on reconnect (${Date.now() - t0} ms after the link returned)`);
  // reload the stage: it comes back on the step on air (snapshot first)
  await stage.reload({ waitUntil: 'load' }); await stage.waitForFunction(() => window.SHOW_STAGE?.state);
  check((await step(stage)) === (await step(ctl)) && !(await stage.isVisible('#wait')), 'a reloaded stage returns to the step on air');
  // long-poll fallback (what a client does when a proxy buffers SSE)
  await stage.evaluate(() => { window.SHOW_STAGE.transport.poll(); }); await wait(800);
  await follow('GO with the stage on long-poll', () => ctl.click('#go'));
  check((await stage.evaluate(() => window.SHOW_STAGE.transport.conn)) === 'poll', 'the stage reports long-poll mode');
  // the PIN is required; the stage may only report "ended"
  const noPin = await ctl.evaluate(async (c) => (await fetch(`/api/shows/${c}/cmd`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cmd: 'next' }) })).status, code);
  const badPin = await ctl.evaluate(async (c) => (await fetch(`/api/shows/${c}/cmd`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Show-Pin': '000000' }, body: JSON.stringify({ cmd: 'next' }) })).status, code);
  check(noPin === 401 && badPin === 401, `commands need the PIN (no PIN ${noPin}, wrong PIN ${badPin})`);
  const off = await Promise.all([stage, ctl].map((p) => p.evaluate(() => (window.SHOW_STAGE || window.SHOW_CONTROL).transport.offset)));
  check(off.every((x) => Math.abs(x) < 1000), `both clocks agree with the server (offsets ${off.map((x) => Math.round(x)).join(' ms, ')} ms)`);
  check(errors.length === 0, `no console errors${errors.length ? ': ' + errors.slice(0, 4).join(' | ') : ''}`);
} catch (e) { check(false, 'test crashed: ' + e.message); }
await b.close();
for (const p of procs) p.kill();
if (PG) { const { default: pg } = await import(path.join(ROOT, 'show/node_modules/pg/lib/index.js')); const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect(); await c.query(`drop table if exists ${prefix}shows`); await c.end(); console.log(`dropped test table ${prefix}shows`); }
for (const f of fs.readdirSync(OUT).filter((f) => /^remote-.*\.png$/.test(f))) { const { execFileSync } = await import('node:child_process'); execFileSync('convert', [path.join(OUT, f), '-resize', '1600x>', '-quality', '82', path.join(OUT, f.replace(/\.png$/, '.jpg'))]); fs.unlinkSync(path.join(OUT, f)); }
console.log(`${fails.length ? fails.length + ' check(s) failed' : 'all checks passed'} [${label}]`);
process.exit(fails.length ? 1 : 0);
