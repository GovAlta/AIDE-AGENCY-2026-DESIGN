#!/usr/bin/env node
// Render the circuit art of a deck to PNGs for the PowerPoint builder (same seeds as the HTML deck).
//   node scripts/pptx/render_art.mjs <deck.json> <out dir>   -> <out dir>/art.json + slide-<n>-<kind>.png (2x)
import fs from 'node:fs';
import path from 'node:path';
import { slideArt } from '../../templates/slides/deck.mjs';
import { svgToPng, close } from '../lib/browser.mjs';
const [deck, dir] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(deck, 'utf8'));
fs.mkdirSync(dir, { recursive: true });
const list = [];
for (const a of slideArt(d)) {
  const f = path.join(dir, `slide-${String(a.index + 1).padStart(2, '0')}-${a.kind}.png`);
  await svgToPng(a.svg, f, { width: a.w, height: a.h, scale: 2 });
  list.push({ index: a.index, kind: a.kind, x: a.x, y: a.y, w: a.w, h: a.h, png: path.resolve(f) });
}
fs.writeFileSync(path.join(dir, 'art.json'), JSON.stringify(list, null, 1));
await close();
console.log(`${list.length} art images -> ${dir}`);
