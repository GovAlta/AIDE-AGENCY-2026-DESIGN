#!/usr/bin/env node
// CI check: every rendered sample that has a QR code decodes, and decodes to a URL named in its content file.
//   node scripts/make.mjs --all && node scripts/ci/qr-samples.mjs      # exit 1 if any sample with a QR does not decode
// It reads samples/**/*.json, keeps those with a "qr" field (or a block of type "qr"), finds their PNGs in out/<family>/, and decodes
// each at full size with jsQR. A sample passes when one of its pages decodes to a URL listed in it. For the shrink test of a single code
// (50 % and 25 %), use scripts/qr-verify.mjs on a crop.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'out'));
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);

function urlsOf(o, acc = new Set(), qrCtx = false) {
  if (Array.isArray(o)) o.forEach((v) => urlsOf(v, acc, qrCtx));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
    const inQr = qrCtx || k === 'qr' || o.type === 'qr';
    if (typeof v === 'string' && /^https?:\/\//.test(v) && inQr) acc.add(v);
    else if (k === 'qr' && typeof v === 'string' && /^https?:\/\//.test(v)) acc.add(v);
    else urlsOf(v, acc, inQr);
  }
  return acc;
}
function decode(file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  for (let i = 0; i < png.data.length; i += 4) { const a = png.data[i + 3] / 255; for (let c = 0; c < 3; c++) png.data[i + c] = Math.round(png.data[i + c] * a + 255 * (1 - a)); png.data[i + 3] = 255; }
  const crop = (x0, y0, w, h) => { const d = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) d.set(png.data.subarray(((y0 + y) * png.width + x0) * 4, ((y0 + y) * png.width + x0 + w) * 4), y * w * 4);
    return jsQR(d, w, h, { inversionAttempts: 'attemptBoth' }); };
  // the whole page, then halves and quarters: a page with two codes (a table tent) confuses a single pass
  const W = png.width, H = png.height, hw = W >> 1, hh = H >> 1;
  for (const [x, y, w, h] of [[0, 0, W, H], [0, 0, W, hh], [0, hh, W, H - hh], [0, 0, hw, H], [hw, 0, W - hw, H], [0, 0, hw, hh], [hw, 0, W - hw, hh], [0, hh, hw, H - hh], [hw, hh, W - hw, H - hh]]) {
    const r = crop(x, y, w, h); if (r) return r.data;
  }
  return null;
}

let bad = 0, n = 0;
for (const f of walk(path.join(ROOT, 'samples')).filter((x) => x.endsWith('.json')).sort()) {
  let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
  if (!d.template) continue;
  const urls = urlsOf(d); if (!urls.size) continue;
  const name = d.name ?? path.basename(f, '.json'), dir = path.join(OUT, d.template.split('/')[0]);
  const pngs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith('.png') && (x === `${name}.png` || new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(p\\d+|\\d\\d)\\.png$`).test(x))).map((x) => path.join(dir, x)) : [];
  n++;
  if (!pngs.length) { console.log(`MISS ${path.relative(ROOT, f)}: no rendered PNG in ${path.relative(ROOT, dir)} (run make.mjs first)`); bad++; continue; }
  const got = pngs.map(decode).filter(Boolean);
  const ok = got.some((g) => urls.has(g));
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${path.relative(ROOT, f)}  ${got.length}/${pngs.length} page(s) decoded ${ok ? '-> ' + got.find((g) => urls.has(g)) : got.length ? '(to ' + got[0] + ', not a URL in the file)' : ''}`);
}
console.log(`${n} sample(s) with a QR code, ${bad} failing`);
process.exit(bad ? 1 : 0);
