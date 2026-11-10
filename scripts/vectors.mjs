#!/usr/bin/env node
// Generate Agency 2026 vectors (SVG, optional PNG).
//   node scripts/vectors.mjs traces  --w 1920 --h 1080 --edges ltrb --seed my-banner [--ground night] [--depth l=0.2,t=0.25] --out art.svg [--png]
//   node scripts/vectors.mjs corner  --w 300 --h 270 --at tr --seed handout --out corner.svg
//   node scripts/vectors.mjs chip    --size 120 --out chip.svg
//   node scripts/vectors.mjs bus     --w 320 --colors purple,yellow,cyan --out bus.svg
//   node scripts/vectors.mjs sweep   --w 1920 --h 60 --out sweep.svg
//   node scripts/vectors.mjs wordmark --size 96 [--dark] --out wordmark.svg [--png]
//   node scripts/vectors.mjs all     # the standard set -> brand/art/generated and brand/logos
// Same seed = same art. Change the seed for a fresh arrangement in the same style.
import fs from 'node:fs';
import path from 'node:path';
import { traces, corner, chip, bus, sweep, wordmark, svgDoc, T } from './lib/vectors.mjs';
import { svgToPng, close, ROOT } from './lib/browser.mjs';

const argv = process.argv.slice(2), cmd = argv[0];
const opt = {}; for (let i = 1; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2); opt[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; }
const num = (k, d) => (opt[k] !== undefined ? +opt[k] : d);
const kv = (s) => Object.fromEntries(String(s).split(',').map((p) => p.split('=')).map(([k, v]) => [k, +v]));

async function write(file, svg, png, pngOpt = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, svg); console.log(path.relative(ROOT, file));
  if (png) { const p = file.replace(/\.svg$/, '.png'); await svgToPng(svg, p, pngOpt); console.log(path.relative(ROOT, p)); }
}

function build(c, o) {
  const g = o.ground && T.grounds[o.ground];
  if (c === 'traces') { const w = num('w', 1920), h = num('h', 1080);
    return svgDoc(w, h, traces({ w, h, edges: o.edges ?? 'ltrb', seed: o.seed ?? 'agency', ground: o.ground, density: num('density', 1), scale: o.scale ? +o.scale : undefined, depth: o.depth ? kv(o.depth) : undefined }), { bg: g?.bg ?? (o.bg === true ? '#FFFFFF' : o.bg) }); }
  if (c === 'corner') { const w = num('w', 300), h = num('h', 270); return svgDoc(w, h, corner({ w, h, at: o.at ?? 'tr', seed: o.seed, ground: o.ground })); }
  if (c === 'chip') { const s = num('size', 120); return svgDoc(s, Math.round(s * 2.05), chip({ size: s, lead: o['no-lead'] ? false : undefined })); }
  if (c === 'bus') { const w = num('w', 320), colors = (o.colors ?? 'purple,yellow,cyan').split(','); return svgDoc(w, colors.length * 6, bus({ w, colors })); }
  if (c === 'sweep') { const w = num('w', 1920), h = num('h', 60); return svgDoc(w, h, sweep({ w, h, seed: o.seed })); }
  if (c === 'wordmark') { const s = num('size', 96); return svgDoc(Math.round(s * 6.5), Math.round(s * 1.25), wordmark({ size: s, dark: !!o.dark })); }
  throw new Error('unknown: ' + c);
}

async function all() {
  const G = path.join(ROOT, 'brand/art/generated'), L = path.join(ROOT, 'brand/logos');
  const sets = [
    ['traces-frame-16x9-board.svg', 'traces', { w: 1920, h: 1080, edges: 'ltrb', seed: 'frame-16x9' }],
    ['traces-frame-16x9-night.svg', 'traces', { w: 1920, h: 1080, edges: 'ltrb', seed: 'frame-16x9', ground: 'night' }],
    ['traces-square-board.svg', 'traces', { w: 1600, h: 1600, edges: 'ltrb', seed: 'square' }],
    ['traces-portrait-9x16-board.svg', 'traces', { w: 1080, h: 1920, edges: 'ltrb', seed: 'portrait' }],
    ['traces-letter-board.svg', 'traces', { w: 816, h: 1056, edges: 'ltrb', seed: 'letter', depth: 'l=0.13,t=0.14,r=0.13,b=0.14' }],
    ['traces-banner-left-right.svg', 'traces', { w: 1920, h: 600, edges: 'lr', seed: 'banner', depth: 'l=0.22,r=0.22' }],
    ['corner-tr.svg', 'corner', { w: 300, h: 270, at: 'tr', seed: 'corner-tr' }],
    ['corner-bl.svg', 'corner', { w: 300, h: 270, at: 'bl', seed: 'corner-bl' }],
    ['chip.svg', 'chip', { size: 120 }],
    ['bus-3.svg', 'bus', { w: 320, colors: 'purple,yellow,cyan' }],
    ['sweep.svg', 'sweep', { w: 1920, h: 60 }],
  ];
  for (const [f, c, o] of sets) { Object.assign(opt, Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v]))); await write(path.join(G, f), build(c, o), true); for (const k of Object.keys(o)) delete opt[k]; }
  for (const [f, dark] of [['agency-2026-wordmark.svg', false], ['agency-2026-wordmark-white.svg', true]]) { opt.size = 96; opt.dark = dark; await write(path.join(L, f), build('wordmark', { dark }), true, { scale: 3 }); }
}

(async () => {
  if (!cmd || cmd === '-h' || cmd === '--help') { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n')); return; }
  if (cmd === 'all') await all();
  else await write(path.resolve(opt.out ?? `${cmd}.svg`), build(cmd, opt), !!opt.png);
  await close();
})().catch((e) => { console.error(e); process.exit(1); });
