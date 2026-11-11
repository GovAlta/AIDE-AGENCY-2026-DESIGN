#!/usr/bin/env node
// Photo-style mock-ups of Agency displays (three.js in headless Chromium; WebGL through SwiftShader, no GPU needed).
//   node displays/render.mjs                     # every scene below -> examples/displays/renders/*.jpg
//   node displays/render.mjs kiosk-hero --out out/displays/renders
// Each face is textured from the same SVG the printer gets (displays/lib/compose.mjs, print mode), so a render shows the real art.
// Scenes are listed in SCENES: change a spec, a variant or the camera there.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { resolve as resolveSpec, ROOT } from './lib/model.mjs';
import { artFor, faceSvg } from './lib/compose.mjs';

const a = process.argv.slice(2), val = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const OUT = path.resolve(val('out', path.join(ROOT, 'examples/displays/renders')));
const spec = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, 'displays/specs', n + '.json'), 'utf8'));
const FR = (n) => `/samples/video/screen-bench/frames/${n}.jpg`;

function object(specName, variant, place = {}, extra = {}) {
  const r = resolveSpec({ ...spec(specName), variant });
  const arts = artFor(r), faces = {};
  for (const f of r.faces) faces[f.name] = faceSvg(r, f, arts[f.name], 'print');
  const fr = r.faces[0];
  return { kind: r.kind, W: r.W, D: r.D || 0, H: r.H, bleed: r.bleed, faces, monitor: fr.monitor, ledge: fr.ledge, screen: FR('agency-light-02-title'), ...place, ...extra };
}

const SCENES = {
  'kiosk-hero': () => ({ width: 2000, height: 2400, objects: [object('kiosk-30x30x72', 'rise', { rotY: 0.55 }, { laptopScreen: FR('agency-light-04-bullets') })], camera: { pos: [-20, 64, 150], target: [0, 38, 0], fov: 34 } }),
  'kiosk-hero-spectrum': () => ({ width: 2000, height: 2400, objects: [object('kiosk-30x30x72', 'spectrum', { rotY: -0.5 }, { screen: FR('agency-light-02-title'), laptopScreen: FR('agency-light-23-stats') })], camera: { pos: [24, 62, 152], target: [0, 38, 0], fov: 34 } }),
  'kiosk-night': () => ({ width: 2000, height: 2400, background: 0xd9dde2, objects: [object('kiosk-30x30x72', 'night', { rotY: 0.5 }, { screen: FR('agency-dark-23-stats'), laptopScreen: FR('agency-dark-24-bars') })], camera: { pos: [-18, 62, 150], target: [0, 38, 0], fov: 34 } }),
  'kiosk-row': () => ({ width: 3200, height: 1700, objects: [
    object('kiosk-30x30x72', 'rise', { x: -135, rotY: 0.18 }, { screen: FR('agency-light-02-title') }),
    object('kiosk-30x30x72', 'spectrum', { x: -45, rotY: 0.06 }, { screen: FR('agency-light-23-stats') }),
    object('kiosk-30x30x72', 'night', { x: 45, rotY: -0.06 }, { screen: FR('agency-dark-23-stats') }),
    object('kiosk-30x30x72', 'converge', { x: 135, rotY: -0.18 }, { screen: FR('agency-light-37-process') }),
  ], camera: { pos: [0, 66, 268], target: [0, 37, 0], fov: 38 } }),
  'kiosk-wrap-back': () => ({ width: 2000, height: 2400, objects: [object('kiosk-30x30x84', 'wrap', { rotY: Math.PI + 0.75 }, { screen: FR('agency-light-02-title') })], camera: { pos: [8, 58, 160], target: [0, 43, 0], fov: 38 } }),
  'panel-stands': () => ({ width: 2800, height: 2000, objects: [
    object('panel-30x72', 'rails', { x: -60, rotY: 0.25 }), object('panel-24x60', 'spectrum', { x: 0, rotY: 0 }), object('panel-30x72', 'night', { x: 60, rotY: -0.25 }),
  ], camera: { pos: [0, 54, 200], target: [0, 37, 0], fov: 34 } }),
};

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png' };
  const srv = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

(async () => {
  const want = a.filter((x, i) => !x.startsWith('--') && !(i && a[i - 1] === '--out'));
  const names = want.length ? want : Object.keys(SCENES);
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(), port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const n of names) {
    const cfg = SCENES[n]();
    const p = await b.newPage({ viewport: { width: cfg.width, height: cfg.height } });
    p.on('pageerror', (e) => console.log(`  ${n}: ${e.message}`)); p.on('console', (m) => m.type() === 'error' && console.log(`  ${n}: ${m.text()}`));
    await p.goto(`http://127.0.0.1:${port}/displays/render/scene.html`);
    await p.waitForFunction(() => window.ready);
    await p.evaluate((c) => window.renderScene(c), cfg);
    const png = path.join(OUT, n + '.png');
    await p.screenshot({ path: png });
    execFileSync('convert', [png, '-resize', `${Math.min(cfg.width, 2000)}x`, '-quality', '86', png.replace(/\.png$/, '.jpg')]); fs.unlinkSync(png);
    console.log(path.relative(process.cwd(), png.replace(/\.png$/, '.jpg')));
    await p.close();
  }
  await b.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
