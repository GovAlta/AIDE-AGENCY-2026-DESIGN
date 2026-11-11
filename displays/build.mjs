#!/usr/bin/env node
// Build Agency display graphics (stand panels and kiosk wraps) from a parametric spec.
//   node displays/build.mjs displays/specs/kiosk-30x30x72.json                 # the spec's variant
//   node displays/build.mjs displays/specs/kiosk-30x30x72.json --variant all   # rise rails wrap spectrum night converge
//   node displays/build.mjs <spec> --variant converge --out out/displays --ppi 40 [--no-pdf] [--no-cmyk] [--set width=24,height=60]
// Per face (front, right, back, left on a kiosk; front on a panel), in out/displays/<spec>/<variant>/:
//   <face>.svg              production vector at real size (inches), text outlined, layers Ground / Art / Brand / Content / CutContour
//   <face>.pdf, <face>.ai   vector PDF at trim + bleed, RGB (the .ai is the same PDF: Illustrator opens it as editable vectors)
//   <face>-cmyk.pdf         the PDF converted to CMYK (Ghostscript, generic profile unless --icc)
//   <face>-production.pdf   CMYK art + crop marks + a CutContour spot-colour path on the trim and the monitor window
//   <face>.png              preview at --ppi (default 40) with a mock monitor and ledge
// A kiosk also gets wrap.svg / wrap.pdf / wrap-production.pdf / wrap.png: the four faces as one artboard, with fold lines.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolve as resolveSpec, VARIANTS, ROOT } from './lib/model.mjs';
import { artFor, faceSvg, wrapSvg } from './lib/compose.mjs';
import { browser, close } from '../scripts/lib/browser.mjs';

const a = process.argv.slice(2), has = (k) => a.includes('--' + k), val = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const PPI = +val('ppi', 40);

async function pdf(svg, out, wIn, hIn) {
  const b = await browser(), p = await b.newPage();
  await p.setContent(`<!doctype html><meta charset="utf-8"><style>@page{size:${wIn}in ${hIn}in;margin:0}html,body{margin:0;padding:0}svg{display:block;width:${wIn}in;height:${hIn}in}</style>${svg}`, { waitUntil: 'load' });
  await p.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  await p.close();
}
async function png(svg, out, wIn, hIn, ppi = PPI) {
  const b = await browser(), w = Math.round(wIn * ppi), h = Math.round(hIn * ppi);
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(`<!doctype html><style>html,body{margin:0}svg{display:block;width:${w}px;height:${h}px}</style>${svg}`, { waitUntil: 'load' });
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
  await p.close();
}
function production(artPdf, base, job) {
  const jf = base + '.job.json'; fs.writeFileSync(jf, JSON.stringify(job));
  try { execFileSync('python3', [path.join(ROOT, 'displays/lib/production.py'), artPdf, base + '-cmyk.pdf', base + '-production.pdf', jf, ...(val('icc') ? ['--icc', val('icc')] : [])], { stdio: ['ignore', 'ignore', 'pipe'] }); }
  catch (e) { console.error(`  production file failed for ${path.basename(base)}: ${String(e.stderr || e.message).trim().split('\n').pop()}`); process.exitCode = 1; }
  finally { fs.unlinkSync(jf); }
}

export async function build(specFile, variant, outRoot, o = {}) {
  const raw = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  if (o.set) for (const kv of o.set.split(',')) { const [k, v] = kv.split('='); raw[k] = isNaN(+v) ? v : +v; }
  const r = resolveSpec({ ...raw, variant: variant || raw.variant });
  const name = raw.name || path.basename(specFile, '.json');
  const dir = path.join(outRoot, name, r.variant); fs.mkdirSync(dir, { recursive: true });
  const arts = artFor(r), made = [];
  for (const f of r.faces) {
    const base = path.join(dir, f.name), wIn = f.W + 2 * r.bleed, hIn = f.H + 2 * r.bleed;
    fs.writeFileSync(base + '.svg', faceSvg(r, f, arts[f.name], 'production'));
    await png(faceSvg(r, f, arts[f.name], 'preview'), base + '.png', wIn, hIn);
    if (!o.noPdf) {
      await pdf(faceSvg(r, f, arts[f.name], 'print'), base + '.pdf', wIn, hIn);
      fs.copyFileSync(base + '.pdf', base + '.ai');
      if (!o.noCmyk) production(base + '.pdf', base, { trim: [f.W, f.H], bleed: r.bleed, cuts: f.monitor ? [[f.monitor.x, f.monitor.y, f.monitor.w, f.monitor.h]] : [], folds: [], title: `${name} · ${r.variant} · ${f.name} · trim ${f.W} x ${f.H} in` });
    }
    made.push(f.name);
  }
  if (r.kind === 'kiosk') {
    const base = path.join(dir, 'wrap'), wIn = r.stripW + 2 * r.bleed, hIn = r.H + 2 * r.bleed;
    fs.writeFileSync(base + '.svg', wrapSvg(r, arts, 'production'));
    await png(wrapSvg(r, arts, 'preview'), base + '.png', wIn, hIn, Math.min(PPI, 24));
    if (!o.noPdf) {
      await pdf(wrapSvg(r, arts, 'print'), base + '.pdf', wIn, hIn);
      fs.copyFileSync(base + '.pdf', base + '.ai');
      const fr = r.faces[0];
      if (!o.noCmyk) production(base + '.pdf', base, { trim: [r.stripW, r.H], bleed: r.bleed, cuts: fr.monitor ? [[fr.monitor.x, fr.monitor.y, fr.monitor.w, fr.monitor.h]] : [], folds: r.faces.slice(1).map((f) => f.x0), title: `${name} · ${r.variant} · wrap (front, right, back, left) · trim ${r.stripW} x ${r.H} in` });
    }
    made.push('wrap');
  }
  fs.writeFileSync(path.join(dir, 'spec.resolved.json'), JSON.stringify({ ...r, faces: r.faces.map(({ zones, ...f }) => ({ ...f, zones })) }, null, 1));
  console.log(`${path.relative(process.cwd(), dir)}: ${made.join(', ')}`);
  return { r, dir };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const files = a.filter((x, i) => !x.startsWith('--') && !(i && a[i - 1].startsWith('--') && !['--no-pdf', '--no-cmyk'].includes(a[i - 1])));
    if (!files.length) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n')); return; }
    const v = val('variant'), out = path.resolve(val('out', path.join(ROOT, 'out/displays')));
    for (const f of files) for (const variant of v === 'all' ? VARIANTS : [v]) await build(f, variant, out, { noPdf: has('no-pdf'), noCmyk: has('no-cmyk'), set: val('set') });
    await close();
  })().catch((e) => { console.error(e); process.exit(1); });
}
