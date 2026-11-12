// WCAG contrast of every text style in the stage CSS against the ground it sits on, for both themes.
//   node tools/contrast.mjs            prints a table; exits 1 if any text style is under 4.5:1 (3:1 for large display text)
// Reads web/film.css (the theme blocks) so the numbers follow the tokens. Translucent colours are composited over their ground.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(KIT, 'web/film.css'), 'utf8');
const block = sel => { const i = css.indexOf(sel + ' {'); const j = css.indexOf('}', i); return Object.fromEntries([...css.slice(i, j).matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()])); };
const root = block(':root'), THEMES = { light: { ...root, ...block('#stage.theme-light') }, dark: { ...root, ...block('#stage.theme-dark') } };
const parse = c => { c = c.trim(); let m;
  if ((m = c.match(/^#([0-9a-f]{6})$/i))) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1];
  if ((m = c.match(/^rgba?\(([^)]+)\)$/))) { const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
  throw new Error('colour ' + c); };
const over = (fg, bg) => [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
let fails = 0; const rows = [];
for (const [th, V] of Object.entries(THEMES)) {
  const v = k => { let s = V[k]; for (let i = 0; i < 4 && s && s.startsWith('var('); i++) s = V[s.slice(6, -1)]; return s; };
  const ground = parse(v('ground')), panel = over(parse(v('panel-bg')), ground), field = over(parse(v('field')), ground), navyBand = parse('#022C4C');
  const pairs = [['ink on ground (callouts, labels, titles)', 'ink', ground, 4.5], ['soft on ground (notes, sub-lines)', 'soft', ground, 4.5], ['ink on panel', 'ink', panel, 4.5], ['soft on panel', 'soft', panel, 4.5],
    ['soft on field (panel rows)', 'soft', field, 4.5], ['caption on caption bar', 'caption-ink', over(parse(v('caption-bg')), ground), 4.5], ['band text on navy band', 'band-ink', navyBand, 4.5], ['band soft (credits) on navy band', 'band-soft', navyBand, 4.5]];
  for (const a of ['blue', 'cyan', 'green', 'orange', 'yellow', 'pink', 'coral', 'purple', 'lilac', 'maroon']) pairs.push([`accent text ${a} on ground`, 't-' + a, ground, 4.5]);
  pairs.push(['accent text cyan on panel', 't-cyan', panel, 4.5]);
  for (const [label, key, bg, min] of pairs) { const r = ratio(over(parse(v(key)), bg), bg); if (r < min) fails++; rows.push({ theme: th, text: label, ratio: +r.toFixed(2), min, ok: r >= min ? 'yes' : 'NO' }); }
}
console.table(rows); console.log(fails ? `${fails} text style(s) under the minimum` : 'every text style meets its minimum'); process.exit(fails ? 1 : 0);
