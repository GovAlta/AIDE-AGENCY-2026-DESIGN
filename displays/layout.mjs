#!/usr/bin/env node
// Dimensioned layout drawings for a display spec: every face's elevation (trim, bleed, safe margin, header lockup, monitor window,
// desk ledge, QR and title zones), a plan view for a kiosk, and the type-size table for viewing distances.
//   node displays/layout.mjs displays/specs/kiosk-30x30x72.json [--out out/displays/layouts]   -> <name>-layout.svg + .png
// These are documents for people (live text is fine); the production art comes from displays/build.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { resolve as resolveSpec, ROOT, T } from './lib/model.mjs';
import { browser, close } from '../scripts/lib/browser.mjs';

const C = T.color, a = process.argv.slice(2), val = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const r2 = (n) => Math.round(n * 100) / 100, fmt = (n) => `${r2(n)}″`;
const S = 10;   // drawing scale: px per inch

function dimH(x1, x2, y, label, up = false) {
  const t = up ? -8 : 16;
  return `<g class="dim"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}"/><line x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}"/><text x="${(x1 + x2) / 2}" y="${y + t}" text-anchor="middle">${label}</text></g>`;
}
function dimV(x, y1, y2, label, left = true) {
  const tx = left ? x - 8 : x + 8;
  return `<g class="dim"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x - 5}" y1="${y1}" x2="${x + 5}" y2="${y1}"/><line x1="${x - 5}" y1="${y2}" x2="${x + 5}" y2="${y2}"/><text x="${tx}" y="${(y1 + y2) / 2}" text-anchor="${left ? 'end' : 'start'}" dominant-baseline="middle">${label}</text></g>`;
}

function elevation(r, f, ox, oy) {
  const W = f.W * S, H = f.H * S, b = r.bleed * S, m = r.m * S, p = [];
  p.push(`<rect x="${ox - b}" y="${oy - b}" width="${W + 2 * b}" height="${H + 2 * b}" class="bleed"/>`, `<rect x="${ox}" y="${oy}" width="${W}" height="${H}" class="trim"/>`,
    `<rect x="${ox + m}" y="${oy + m}" width="${W - 2 * m}" height="${H - 2 * m}" class="safe"/>`);
  for (const z of f.zones) {
    const [x0, y0, x1, y1] = z.rect.map((v, i) => (i % 2 ? Math.max(0, Math.min(f.H, v)) : Math.max(0, Math.min(f.W, v))));
    p.push(`<rect x="${ox + x0 * S}" y="${oy + y0 * S}" width="${(x1 - x0) * S}" height="${(y1 - y0) * S}" class="zone z-${z.id}"/><text class="zl" x="${ox + x0 * S + 6}" y="${oy + y0 * S + 16}">${z.id} (clear)</text>`);
  }
  if (f.lockup) {
    const L = f.lockup;
    p.push(`<rect x="${ox + L.x * S}" y="${oy + (L.baseline - L.S * 0.73) * S}" width="${L.wordW * S}" height="${L.S * 0.73 * S}" class="lock"/><text class="ll" x="${ox + L.x * S + 4}" y="${oy + (L.baseline - L.S * 0.73) * S + 15}">"${L.words.join(' ')}" cap ${fmt(L.S * 0.7275)}</text>`,
      `<rect x="${ox + L.logo.x * S}" y="${oy + L.logo.y * S}" width="${L.logo.w * S}" height="${L.logo.h * S}" class="lock"/><text class="ll" x="${ox + L.logo.x * S + 4}" y="${oy + L.logo.y * S + 15}">Alberta logo ${fmt(L.logo.w)} wide</text>`,
      `<rect x="${ox + L.sub.x * S}" y="${oy + (L.sub.baselines[0] - L.sub.cap) * S}" width="${L.sub.width * S}" height="${(L.sub.baselines[L.sub.baselines.length - 1] - L.sub.baselines[0] + L.sub.cap) * S}" class="lock"/><text class="ll" x="${ox + L.sub.x * S + 4}" y="${oy + (L.sub.baselines[L.sub.baselines.length - 1] + 0.9) * S}">Technology and Innovation · cap ${fmt(L.sub.cap)}</text>`);
  }
  if (f.monitor) {
    const M = f.monitor;
    p.push(`<rect x="${ox + M.x * S}" y="${oy + M.y * S}" width="${M.w * S}" height="${M.h * S}" class="mon"/><text class="ml" x="${ox + (M.x + M.w / 2) * S}" y="${oy + (M.y + M.h / 2) * S}" text-anchor="middle">monitor window ${fmt(M.w)} × ${fmt(M.h)} (about ${Math.round(M.diagonal)}″ 16:9)</text>`,
      `<text class="ml" x="${ox + (M.x + M.w / 2) * S}" y="${oy + (M.y + M.h / 2) * S + 18}" text-anchor="middle">CutContour path · no art · mount zone</text>`,
      dimV(ox + W + 34, oy + (M.y + M.h) * S, oy + H, `monitor bottom ${fmt(M.bottom)}`, false));
  }
  if (f.ledge) {
    const Lg = f.ledge;
    p.push(`<rect x="${ox}" y="${oy + Lg.y * S}" width="${W}" height="${Lg.thickness * S}" class="ledge"/><text class="zl" x="${ox + 6}" y="${oy + Lg.y * S - 6}">desk ledge ${fmt(Lg.depth)} deep (art runs behind it)</text>`,
      dimV(ox + W + 150, oy + Lg.y * S, oy + H, `ledge ${fmt(Lg.height)}`, false));
  }
  p.push(dimH(ox, ox + W, oy + H + 30, `${f.name} · ${fmt(f.W)} trim · bleed ${fmt(r.bleed)} each side`), dimV(ox - 26, oy, oy + H, fmt(f.H)));
  p.push(`<text class="fl" x="${ox}" y="${oy - b - 14}">${f.name.toUpperCase()}</text>`);
  return p.join('');
}

function plan(r, ox, oy) {
  const W = r.W * S, D = r.D * S, f = r.faces[0], p = [];
  p.push(`<rect x="${ox}" y="${oy}" width="${W}" height="${D}" class="trim"/><text class="fl" x="${ox}" y="${oy - 14}">PLAN (top view)</text>`);
  if (f.ledge) p.push(`<rect x="${ox}" y="${oy + D}" width="${W}" height="${f.ledge.depth * S}" class="ledge"/><text class="zl" x="${ox + 6}" y="${oy + D + 18}">desk ledge</text>`);
  const ld = f.ledge ? f.ledge.depth * S : 0;
  p.push(dimH(ox, ox + W, oy + D + ld + 30, `front ${fmt(r.W)} (monitor and ledge side)`), dimV(ox - 60, oy, oy + D, `side ${fmt(r.D)}`));
  p.push(`<text class="zl" x="${ox + W / 2}" y="${oy + 20}" text-anchor="middle">back</text><text class="zl" x="${ox + W - 8}" y="${oy + D / 2}" text-anchor="end">right</text><text class="zl" x="${ox + 8}" y="${oy + D / 2}">left</text><text class="zl" x="${ox + W / 2}" y="${oy + D - 10}" text-anchor="middle">front</text>`);
  return p.join('');
}

function typeTable(ox, oy) {
  const rows = [[3, 0.3, 0.6], [6, 0.6, 1.2], [8, 0.8, 1.6], [10, 1, 2], [15, 1.5, 3], [20, 2, 4]];
  const p = [`<text class="fl" x="${ox}" y="${oy}">MINIMUM CAP HEIGHT BY VIEWING DISTANCE</text>`, `<text class="zl" x="${ox}" y="${oy + 22}">readable: 1 in of cap height per 10 ft · comfortable: 1 in per 5 ft</text>`];
  rows.forEach(([d, rd, cf], i) => p.push(`<text class="tt" x="${ox}" y="${oy + 52 + i * 22}">${d} ft</text><text class="tt" x="${ox + 70}" y="${oy + 52 + i * 22}">${r2(rd)}″ readable</text><text class="tt" x="${ox + 200}" y="${oy + 52 + i * 22}">${r2(cf)}″ comfortable</text>`));
  return p.join('');
}

export async function layout(specFile, outDir) {
  const raw = JSON.parse(fs.readFileSync(specFile, 'utf8')), r = resolveSpec(raw), name = raw.name || path.basename(specFile, '.json');
  const gap = 300, top = 110, left = 110;
  let x = left; const parts = [];
  for (const f of r.faces) { parts.push(elevation(r, f, x, top)); x += f.W * S + gap; }
  let w = x - gap + 260, h = top + r.H * S + 90;
  if (r.kind === 'kiosk') { parts.push(plan(r, left, h + 80)); parts.push(typeTable(left + r.W * S + 260, h + 90)); h += 80 + (r.D + (r.faces[0].ledge ? r.faces[0].ledge.depth : 0)) * S + 90; }
  else { parts.push(typeTable(x + 20, top + 20)); w = x + 520; }
  w = Math.max(w, 1300);
  const title = `${name}: ${r.kind === 'kiosk' ? `kiosk ${r.W} × ${r.D} × ${r.H} in` : `panel ${r.W} × ${r.H} in`} · margin ${r.m} in · bleed ${r.bleed} in`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>
    text{font-family:Inter,Arial,sans-serif;fill:${C.navy}} .fl{font-weight:800;font-size:15px;letter-spacing:.08em} .zl{font-size:12px;fill:${C.mute}} .ll{font-size:11px;fill:${T.textOnLight.purple};font-weight:600} .ml{font-size:12px;fill:#fff;font-weight:600} .tt{font-size:13px}
    .dim line{stroke:${C.mute};stroke-width:1} .dim text{font-size:12px;fill:${C.mute}} .trim{fill:#fff;stroke:${C.navy};stroke-width:1.5} .bleed{fill:none;stroke:#EC008C;stroke-width:1;stroke-dasharray:6 4}
    .safe{fill:none;stroke:${C.cyan};stroke-width:1;stroke-dasharray:3 3} .zone{fill:rgba(2,44,76,.05);stroke:rgba(2,44,76,.25);stroke-dasharray:4 3} .lock{fill:rgba(111,44,131,.08);stroke:${C.purple};stroke-width:1}
    .mon{fill:#1b2733;stroke:#EC008C;stroke-width:1.5} .ledge{fill:rgba(238,154,46,.25);stroke:${C.orange}}
  </style><rect width="${w}" height="${h}" fill="#F6F7FA"/><text x="${left}" y="44" style="font-weight:800;font-size:24px">${title}</text>
  <text x="${left}" y="70" class="zl">magenta dashed = bleed · cyan dotted = safe margin (type, logo, QR stay inside) · grey = clear zones (no traces) · purple = lockup · magenta = CutContour</text>
  ${parts.join('')}</svg>`;
  fs.mkdirSync(outDir, { recursive: true });
  const f = path.join(outDir, `${name}-layout.svg`); fs.writeFileSync(f, svg);
  const b = await browser(), p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1.5 });
  const css = path.join(ROOT, 'styles/tokens.css');
  await p.setContent(`<!doctype html><link rel="stylesheet" href="file://${css}"><style>html,body{margin:0}</style>${svg}`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: f.replace(/\.svg$/, '.png'), clip: { x: 0, y: 0, width: w, height: h } }); await p.close();
  console.log(path.relative(process.cwd(), f.replace(/\.svg$/, '.png')));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const files = a.filter((x, i) => !x.startsWith('--') && !(i && a[i - 1] === '--out'));
    for (const f of files) await layout(f, path.resolve(val('out', path.join(ROOT, 'out/displays/layouts'))));
    await close();
  })().catch((e) => { console.error(e); process.exit(1); });
}
