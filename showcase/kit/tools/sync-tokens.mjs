// Checks that the film stylesheet (web/film.css) uses the design repo's colour tokens (brand/tokens/tokens.json), and fixes drift.
//   node tools/sync-tokens.mjs          report every variable whose value differs from the token
//   node tools/sync-tokens.mjs --fix    rewrite those values in web/film.css
// Covered: --f-<accent> (fills) and the fixed brand colours from tokens.color; --t-<accent> from textOnLight (light theme) and
// textOnDark (dark theme). Other values in film.css (shadows, translucent fields) are the kit's own.
import fs from 'node:fs';
import path from 'node:path';
import { KIT, BRAND } from './lib/paths.mjs';
const T = JSON.parse(fs.readFileSync(path.join(BRAND, 'tokens/tokens.json'), 'utf8'));
const file = path.join(KIT, 'web/film.css'); let css = fs.readFileSync(file, 'utf8');
const want = [];
for (const n of T.spectrumNames) want.push(['root', `--f-${n}`, T.color[n]]);
for (const n of ['navy', 'navy2', 'night', 'night2', 'maroon']) want.push(['root', `--${n}`, T.color[n]]);
for (const [n, v] of Object.entries(T.textOnLight)) if (!n.startsWith('$')) want.push(['#stage.theme-light', `--t-${n}`, v]);
for (const [n, v] of Object.entries(T.textOnDark)) if (!n.startsWith('$')) want.push(['#stage.theme-dark', `--t-${n}`, v]);
const block = (sel) => { const i = css.indexOf(sel === 'root' ? ':root {' : sel + ' {'); return i < 0 ? null : [i, css.indexOf('\n}', i)]; };
let drift = 0;
for (const [sel, v, val] of want) {
  const b = block(sel); if (!b) { console.log(`missing block ${sel}`); drift++; continue; }
  const seg = css.slice(b[0], b[1]), re = new RegExp(`(${v.replace(/[-]/g, '\\-')}:\\s*)(#[0-9A-Fa-f]{6})`), m = seg.match(re);
  if (!m) continue;                                    // the stylesheet does not use this token: nothing to keep in step
  if (m[2].toUpperCase() !== val.toUpperCase()) { drift++; console.log(`${sel} ${v}: ${m[2]} -> ${val}`);
    if (process.argv.includes('--fix')) css = css.slice(0, b[0]) + seg.replace(re, `$1${val}`) + css.slice(b[1]); }
}
if (process.argv.includes('--fix') && drift) fs.writeFileSync(file, css);
console.log(drift ? `${drift} value(s) ${process.argv.includes('--fix') ? 'fixed' : 'differ from tokens.json (run with --fix)'}` : `film.css matches tokens.json (${want.length} tokens checked)`);
process.exit(drift && !process.argv.includes('--fix') ? 1 : 0);
