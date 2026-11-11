#!/usr/bin/env node
// Gallery thumbnails for Agency Studio: render every sample once and keep a small JPEG of its first page.
//   node app/build-thumbs.mjs            # -> app/thumbs/<family>--<sample>.jpg  (run in the Docker build; about 2 minutes)
// The server falls back to out/<family>/*.png when a thumbnail is missing, so this is optional when running from a built repo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app/thumbs'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'thumbs-'));
process.argv = [process.argv[0], path.join(ROOT, 'scripts/make.mjs')];
const { make } = await import(pathToFileURL(path.join(ROOT, 'scripts/make.mjs')).href);
const { browser, close } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/browser.mjs')).href);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const f of walk(path.join(ROOT, 'samples')).filter((f) => f.endsWith('.json')).sort()) {
  let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
  if (!d.template) continue;
  const fam = path.basename(path.dirname(f)), base = path.basename(f, '.json'), dst = path.join(OUT, `${fam}--${base}.jpg`);
  try {
    const rep = await make(f, { out: TMP });
    const png = rep.pngs?.[0]; if (!png) continue;
    const html = png.replace(/\.png$/, '.thumb.html');
    fs.writeFileSync(html, `<body style="margin:0;background:#fff"><img id="i" src="${path.basename(png)}" style="max-width:480px;max-height:480px;display:block"></body>`);
    const b = await browser(), p = await b.newPage({ viewport: { width: 480, height: 480 } });
    await p.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    const el = await p.$('#i');
    await el.screenshot({ path: dst, type: 'jpeg', quality: 78 }); await p.close(); n++;
  } catch (e) { console.log('skip', path.relative(ROOT, f), e.message.split('\n')[0]); }
}
await close(); fs.rmSync(TMP, { recursive: true, force: true });
console.log(`${n} thumbnails in app/thumbs`);
