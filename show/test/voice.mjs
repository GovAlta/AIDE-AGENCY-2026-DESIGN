#!/usr/bin/env node
// Voiced announcements reach the control's Announce box and play on the stage (fixture manifest, no text to speech needed).
//   node show/test/voice.mjs
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), PORT = 19900 + Math.floor(Math.random() * 90);
const srv = spawn(process.execPath, [path.join(ROOT, 'show/server.mjs'), '--port', String(PORT), '--memory'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => srv.stdout.on('data', (d) => String(d).includes('start page') && r()));
const b = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] }), ctx = await b.newContext();
const base = `http://127.0.0.1:${PORT}/show`, ag = 'show/test/fixtures/agenda-voice.json';
const ctl = await ctx.newPage(); await ctl.goto(`${base}/control.html`); await ctl.evaluate(() => localStorage.clear());
await ctl.goto(`${base}/control.html?agenda=${ag}`); await ctl.waitForFunction(() => window.SHOW_CONTROL?.state);
const st = await ctx.newPage(); await st.setViewportSize({ width: 1280, height: 720 }); await st.goto(`${base}/stage.html?mode=program`); await st.waitForFunction(() => window.SHOW_STAGE?.scene); await st.mouse.click(5, 5);
await ctl.evaluate(() => { const C = window.SHOW_CONTROL; const i = C.agenda.days[0].segments.findIndex((s) => s.id === 'd1-key'); return C.take({ day: 0, seg: i, scene: 0, slide: 0 }); });
await ctl.waitForTimeout(1500);
const btn = await ctl.$$eval('#announce button', (bs) => bs.map((x) => x.textContent));
await ctl.keyboard.press('a'); await ctl.waitForTimeout(600);
const peak = await st.evaluate(() => window.SHOW_STAGE.mixer.level());
const played = await ctl.$$eval('#announce button', (bs) => bs.map((x) => x.textContent).join(' '));
const ok = btn.some((t) => t.includes('Please welcome Speaker Name')) && peak > 0.001 && played.includes('played');
console.log(`${ok ? 'ok  ' : 'FAIL'} the Announce box lists the segment's clip (${btn.length}), A plays it on the stage (peak ${peak.toFixed(3)}) and marks it played`);
await b.close(); srv.kill(); process.exit(ok ? 0 : 1);
