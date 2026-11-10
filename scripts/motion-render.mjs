#!/usr/bin/env node
// Render the Agency 2026 motion pieces (motion/library) to video and stills, frame-exact and headless.
//   node scripts/motion-render.mjs --list                       # the pieces, with size, length and intended delivery
//   node scripts/motion-render.mjs MG-01 [MG-02 ...]            # -> out/motion/<code>.mp4 (H.264, 30 fps) + <code>-stills.png
//   node scripts/motion-render.mjs --all                        # every piece (MG-04 is cut to --max 20 s unless --max 0)
//   options: --fps 30  --max 20 (seconds, for long loops)  --scale 1 (2 = 4K for 16:9)  --alpha (also ProRes 4444 .mov with transparency)
//            --stills-only (key frames only, no video)
// How: each piece's page is served over a local HTTP server (the runtime fetches its modules), and every frame is seeked with the
// runtime's own transport event (data-om-seek-to-time-frame) before it is captured, so output does not depend on playback speed.
// To change a piece, edit motion/library/agency-pieces.js (look, timing) and keep the CLIPS table in step; see motion/README.md.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { ROOT } from './lib/browser.mjs';

const LIB = path.join(ROOT, 'motion/library');
const a = process.argv.slice(2), has = (k) => a.includes('--' + k), val = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const FPS = +val('fps', 30), MAX = +val('max', 20), SCALE = +val('scale', 1), OUT = path.resolve(val('out', path.join(ROOT, 'out/motion')));
const SIZE = { '16:9': [1920, 1080], '1:1': [1080, 1080], '9:16': [1080, 1920] };

// the piece table lives in agency-pieces.js (const CLIPS = [...]); read it without executing the runtime
function clips() {
  const src = fs.readFileSync(path.join(LIB, 'agency-pieces.js'), 'utf8');
  return [...src.matchAll(/\{ code: '([A-Z]{2}-\d\d)'.*?dur: ([\d.]+), aspect: '([\d:]+)', title: '([^']+)'.*?format: '([^']+)', use: '([^']+)', keys: \[([^\]]+)\]/g)]
    .map((m) => ({ code: m[1], dur: +m[2], aspect: m[3], title: m[4], format: m[5], use: m[6], keys: m[7].split(',').map(Number) }));
}
const pageFor = (code) => fs.readdirSync(LIB).find((f) => f.startsWith('video-' + code.toLowerCase()) && f.endsWith('.dc.html'));

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
  const srv = http.createServer((req, res) => {
    const f = path.join(LIB, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(LIB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function open(b, port, c, alpha = false) {
  const [w, h] = SIZE[c.aspect];
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: SCALE * 2 });   // capture at 2x: the stage is fitted a little inside the window, so frames are scaled down to size
  if (alpha) await p.addInitScript(() => { window.AGENCY_ALPHA = true; });
  p.on('pageerror', (e) => console.log(`  ${c.code} page error: ${e.message.slice(0, 160)}`));
  await p.goto(`http://127.0.0.1:${port}/${encodeURIComponent(pageFor(c.code))}`, { waitUntil: 'networkidle' });
  await p.waitForSelector('[data-om-exportable-video-with-duration-secs]', { state: 'attached', timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  // hide the runtime's playback bar and anything outside the stage
  await p.addStyleTag({ content: '[data-om-playback-bar],.om-playback-bar{display:none!important}' + (alpha ? 'html,body,#dc-root{background:transparent!important}' : '') });
  if (alpha) await p.evaluate(() => { let e = document.querySelector('[data-om-exportable-video-with-duration-secs]'); for (; e; e = e.parentElement) e.style.setProperty('background', 'transparent', 'important'); });
  return p;
}
const seek = (p, t) => p.evaluate((t) => { const e = document.querySelector('[data-om-exportable-video-with-duration-secs]');
  e.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: t, sync: true, playing: false } })); }, t);
async function shot(p, file, alpha) {
  const el = await p.$('[data-om-exportable-video-with-duration-secs]');
  return el.screenshot({ path: file, omitBackground: !!alpha, animations: 'disabled' });
}

async function render(b, port, c) {
  fs.mkdirSync(OUT, { recursive: true });
  const p = await open(b, port, c);
  const tmp = fs.mkdtempSync(path.join(OUT, `.${c.code}-`));
  // stills at the piece's key times -> one strip
  const ks = [];
  for (const [i, t] of c.keys.entries()) { await seek(p, t); await p.waitForTimeout(60); const f = path.join(tmp, `key-${i}.png`); await shot(p, f); ks.push(f); }
  execFileSync('montage', [...ks, '-tile', `${ks.length}x1`, '-geometry', c.aspect === '9:16' ? '360x640+6+6' : c.aspect === '1:1' ? '480x480+6+6' : '640x360+6+6', '-background', '#0E2238', path.join(OUT, `${c.code}-stills.png`)]);
  console.log(`  ${c.code} stills -> ${path.relative(process.cwd(), path.join(OUT, c.code + '-stills.png'))}`);
  if (has('stills-only')) { await p.close(); fs.rmSync(tmp, { recursive: true }); return; }
  const dur = MAX > 0 ? Math.min(c.dur, MAX) : c.dur, n = Math.round(dur * FPS);
  const alpha = has('alpha') || /alpha/i.test(c.format);
  for (let i = 0; i < n; i++) {
    await seek(p, i / FPS);
    await shot(p, path.join(tmp, `f${String(i).padStart(5, '0')}.png`), false);
    if (i % 60 === 0) process.stdout.write(`\r  ${c.code} frame ${i}/${n}`);
  }
  process.stdout.write(`\r  ${c.code} frame ${n}/${n}\n`);
  await p.close();
  const mp4 = path.join(OUT, `${c.code}.mp4`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.png'), '-vf', `scale=${SIZE[c.aspect][0] * SCALE}:${SIZE[c.aspect][1] * SCALE}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', mp4]);
  console.log(`  ${c.code} -> ${path.relative(process.cwd(), mp4)} (${dur}s${dur < c.dur ? ` of ${c.dur}s, --max 0 for all` : ''})`);
  if (alpha) {
    // second pass with the piece's alpha mode on: transparent ground, no preview checker
    const pa = await open(b, port, c, true), ta = fs.mkdtempSync(path.join(OUT, `.${c.code}-a-`));
    for (let i = 0; i < n; i++) { await seek(pa, i / FPS); await shot(pa, path.join(ta, `f${String(i).padStart(5, '0')}.png`), true); }
    await pa.close();
    const mov = path.join(OUT, `${c.code}-alpha.mov`);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(ta, 'f%05d.png'), '-vf', `scale=${SIZE[c.aspect][0] * SCALE}:${SIZE[c.aspect][1] * SCALE}`, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', mov]);
    console.log(`  ${c.code} -> ${path.relative(process.cwd(), mov)} (ProRes 4444 with alpha)`);
    fs.rmSync(ta, { recursive: true });
  }
  fs.rmSync(tmp, { recursive: true });
}

(async () => {
  const list = clips();
  if (has('list') || !a.length) { for (const c of list) console.log(`${c.code}  ${c.aspect.padEnd(5)} ${String(c.dur).padStart(4)} s  ${c.title.padEnd(34)} ${c.format.padEnd(20)} ${c.use}`); return; }
  const want = has('all') ? list : list.filter((c) => a.includes(c.code));
  if (!want.length) throw new Error('no such piece; run --list');
  const srv = await serve(), port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  for (const c of want) await render(b, port, c);
  await b.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
