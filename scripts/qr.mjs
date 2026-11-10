#!/usr/bin/env node
// Agency 2026 QR code.
//   node scripts/qr.mjs "https://www.alberta.ca" --out out/qr/alberta.svg [--png] [--style rounded|dots|square] [--accent blue] [--badge chip|a|TXT] [--size 600]
// Always scan the result with a phone before you print it. --png also writes a PNG at --size px (default 1200).
import fs from 'node:fs';
import path from 'node:path';
import { qrSvg } from './lib/qr.mjs';
import { svgToPng, close } from './lib/browser.mjs';
const a = process.argv.slice(2), text = a[0], o = {};
for (let i = 1; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
if (!text || text.startsWith('--')) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n')); process.exit(0); }
const out = path.resolve(o.out ?? 'qr.svg'), size = +(o.size ?? 1200);
const svg = qrSvg(text, { style: o.style, accent: o.accent, badge: o.badge === true ? 'chip' : o.badge, size });
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, svg); console.log(out);
if (o.png) { await svgToPng(svg, out.replace(/\.svg$/, '.png'), { bg: '#FFFFFF' }); console.log(out.replace(/\.svg$/, '.png')); }
await close();
