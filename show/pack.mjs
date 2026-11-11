#!/usr/bin/env node
// Gather what the published show app needs from the rest of the repo into show/.bundle/, because publish-app builds the image from
// show/ alone (docker build .). Run it before every publish:
//   node show/pack.mjs [--agenda my-event.json ...]     then: cd show && publish-app agency-show --database --min-instances 1 --memory 1Gi
// Copies: styles/tokens.css, brand/tokens, brand/fonts, brand/logos, brand/audio (cues.json, cues/, source/), out/voice (if voiced),
// examples/motion, plus every file named in the agendas (show/samples/*.json and --agenda files) and their cue lists that lies outside show/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOW = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(SHOW, '..'), OUT = path.join(SHOW, '.bundle');
const a = process.argv.slice(2), extra = a.flatMap((x, i) => (a[i - 1] === '--agenda' ? [x] : []));
fs.rmSync(OUT, { recursive: true, force: true });
let files = 0, bytes = 0;
function copy(rel) {
  const src = path.join(ROOT, rel); if (!fs.existsSync(src)) return;
  const st = fs.statSync(src);
  if (st.isDirectory()) { for (const f of fs.readdirSync(src)) copy(path.join(rel, f)); return; }
  if (/\.(mov|tmp\.html)$/.test(src) || rel.startsWith('show' + path.sep)) return;   // ProRes masters are too big for the image; show/ is copied by the Dockerfile
  const dst = path.join(OUT, rel); if (fs.existsSync(dst)) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); fs.chmodSync(dst, 0o644); files++; bytes += st.size;   // readable by the image's node user
}
for (const d of ['styles/tokens.css', 'brand/tokens', 'brand/fonts', 'brand/logos', 'brand/audio/cues.json', 'brand/audio/cues', 'brand/audio/source', 'out/voice', 'examples/motion']) copy(d);
// every string in an agenda or cue list that names a file in the repo
const strings = (o, out = []) => { if (typeof o === 'string') out.push(o); else if (o && typeof o === 'object') for (const v of Object.values(o)) strings(v, out); return out; };
const agendas = [...fs.readdirSync(path.join(SHOW, 'samples')).filter((f) => f.endsWith('.json')).map((f) => path.join(SHOW, 'samples', f)), ...extra.map((f) => path.resolve(f))];
for (const f of agendas) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const s of strings(j)) { const p = s.replace(/^\//, ''); if (/^[\w./-]+\.\w{2,4}$/.test(p) && fs.existsSync(path.join(ROOT, p))) copy(p);
    if (/^[\w./-]+$/.test(p) && fs.existsSync(path.join(ROOT, p)) && fs.statSync(path.join(ROOT, p)).isDirectory()) copy(p); }
  for (const cf of j.audio?.cueFiles || []) { const cp = path.join(ROOT, cf); if (fs.existsSync(cp)) for (const s of strings(JSON.parse(fs.readFileSync(cp, 'utf8')))) if (/^[\w./-]+\.\w{2,4}$/.test(s) && fs.existsSync(path.join(ROOT, s))) copy(s); }
  if (!f.startsWith(SHOW)) { const dst = path.join(SHOW, 'samples', path.basename(f)); console.log(`note: ${path.relative(ROOT, f)} is outside show/; copy it to show/samples/ to offer it on the start page`); void dst; }
}
console.log(`show/.bundle: ${files} files, ${(bytes / 1e6).toFixed(1)} MB. Next: cd show && publish-app agency-show --database --min-instances 1 --memory 1Gi`);
