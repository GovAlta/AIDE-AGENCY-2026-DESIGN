#!/usr/bin/env node
// Decode QR PNGs and check each one says what it should. Run it on every code before it ships.
//   node scripts/qr-verify.mjs out/qr/*.png [--expect "https://..."]   -> exit 1 if any image does not decode (or decodes to something else)
// Each image is also tested shrunk to 50% and 25%, a rough stand-in for a small print seen by a phone camera.
import fs from 'node:fs';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
const a = process.argv.slice(2), ei = a.indexOf('--expect'), expect = ei >= 0 ? a[ei + 1] : null;
const files = a.filter((x, i) => !x.startsWith('--') && !(ei >= 0 && i === ei + 1));
const shrink = (img, k) => { const w = Math.floor(img.width * k), h = Math.floor(img.height * k), d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (Math.floor(y / k) * img.width + Math.floor(x / k)) * 4, t = (y * w + x) * 4; for (let c = 0; c < 4; c++) d[t + c] = img.data[s + c]; }
  return { data: d, width: w, height: h }; };
let bad = 0;
for (const f of files) {
  const png = PNG.sync.read(fs.readFileSync(f));
  // flatten transparency onto white
  for (let i = 0; i < png.data.length; i += 4) { const al = png.data[i + 3] / 255; for (let c = 0; c < 3; c++) png.data[i + c] = Math.round(png.data[i + c] * al + 255 * (1 - al)); png.data[i + 3] = 255; }
  const res = [1, 0.5, 0.25].map((k) => { const im = k === 1 ? png : shrink(png, k); const r = jsQR(new Uint8ClampedArray(im.data), im.width, im.height); return r ? r.data : null; });
  const ok = res.every((r) => r && (!expect || r === expect));
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${f}  ${res.map((r) => (r ? '✓' : '✗')).join('')}  ${res.find(Boolean) ?? ''}`);
}
process.exit(bad ? 1 : 0);
