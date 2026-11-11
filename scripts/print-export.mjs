#!/usr/bin/env node
// Printer-ready PDF from any print template: bleed, crop marks, TrimBox/BleedBox, and CMYK PDF/X through Ghostscript.
//   node scripts/print-export.mjs samples/print/poster-event.json                 # -> out/print-ready/poster-event-print.pdf (+ -marks.pdf)
//   node scripts/print-export.mjs content.json --bleed 0.125 --slug 0.375 --mode auto|scale|extend --icc vendor.icc --rgb
// Steps: make.mjs renders the content to HTML; each .page is placed on a sheet of trim + bleed (+ slug for marks); the ground is carried
// into the bleed; the sheet prints to PDF; Ghostscript converts it to PDF/X-3 with a CMYK output intent; the boxes are written.
//   --mode extend  the page's ground colour (or gradient) fills the bleed; art that touches the edge stops at the trim line.
//   --mode scale   the whole page is enlarged a little so its art runs into the bleed (text grows by the same amount, 1-3 %).
//   --mode auto    scale when that enlarges the page by 3 % or less (posters, banners), else extend (badges, postcards). Default.
//   --icc          the printer's CMYK profile (ask for it: GRACoL2013 / SWOP for North American offset, FOGRA39 for European);
//                  without it Ghostscript's generic default_cmyk.icc is used, which is fine for proofs but not for a final press run.
//   --pdfx 4|3     4 (default): PDF 1.6, vector, live transparency, marked PDF/X-4 (Ghostscript cannot certify X-4: preflight in Acrobat).
//                  3: certified PDF/X-3, but transparency is flattened and the page becomes one 300 ppi image. Only if a vendor insists.
//   --rgb          skip the CMYK conversion (digital printers that take RGB PDFs).
// Output: <name>-print.pdf (trim + bleed, boxes set; most digital and large-format vendors want this) and <name>-print-marks.pdf
// (with crop marks and a slug line in the margin; offset printers). See guides/PRINT-PRODUCTION.md.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { make } from './make.mjs';
import { browser, close, ROOT } from './lib/browser.mjs';

const a = process.argv.slice(2), val = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; }, has = (k) => a.includes('--' + k);
const file = a.find((x, i) => !x.startsWith('--') && !(i && a[i - 1].startsWith('--') && !['--rgb'].includes(a[i - 1])));
if (!file) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n')); process.exit(0); }
const B = +val('bleed', 0.125), SLUG = +val('slug', 0.375), MODE = val('mode', 'auto'), PDFX = val('pdfx', '4');
const OUT = path.resolve(val('out', path.join(ROOT, 'out/print-ready')));
const GSLIB = (() => { try { const v = execFileSync('gs', ['--version']).toString().trim(); return `/usr/share/ghostscript/${v}`; } catch { return null; } })();
const ICC = path.resolve(val('icc', GSLIB ? `${GSLIB}/iccprofiles/default_cmyk.icc` : ''));

async function sheet(htmlFile, pdfOut, marks) {
  const b = await browser();
  const p = await b.newPage({ viewport: { width: 1200, height: 1200 } });
  await p.goto(pathToFileURL(htmlFile).href, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const info = await p.evaluate(({ B, S, MODE, marks, label }) => {
    const pages = [...document.querySelectorAll('.page')];
    if (!pages.length) throw new Error('no .page elements: is this a print template?');
    const r0 = pages[0].getBoundingClientRect(), W = r0.width / 96, H = r0.height / 96;
    const s = Math.max((W + 2 * B) / W, (H + 2 * B) / H);
    const mode = MODE === 'auto' ? (s <= 1.03 ? 'scale' : 'extend') : MODE;
    const SW = W + 2 * B + 2 * S, SH = H + 2 * B + 2 * S;
    const st = document.createElement('style');
    st.textContent = `@page { size: ${SW}in ${SH}in; margin: 0; } html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .pe-sheet { position: relative; width: ${SW}in; height: ${SH}in; overflow: hidden; page-break-after: always; break-after: page; }
      .pe-sheet:last-child { page-break-after: auto; break-after: auto; }
      .pe-bleed { position: absolute; left: ${S}in; top: ${S}in; width: ${W + 2 * B}in; height: ${H + 2 * B}in; overflow: hidden; }
      .pe-bleed > .page { position: absolute !important; left: ${B}in; top: ${B}in; margin: 0 !important; page-break-after: auto !important; }
      .pe-marks { position: absolute; inset: 0; pointer-events: none; }
      .pe-slug { position: absolute; left: ${S + B}in; bottom: ${S * 0.25}in; max-width: ${W}in; overflow: hidden; text-overflow: ellipsis; font: 6pt "Geist Mono", monospace; color: #000; white-space: nowrap; }`;
    document.head.appendChild(st);
    pages.forEach((pg, i) => {
      const cs = getComputedStyle(pg);
      const sh = document.createElement('div'); sh.className = 'pe-sheet';
      const bl = document.createElement('div'); bl.className = 'pe-bleed';
      bl.style.backgroundColor = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : '#ffffff';
      if (cs.backgroundImage !== 'none') { bl.style.backgroundImage = cs.backgroundImage; bl.style.backgroundSize = 'cover'; }
      pg.parentNode.insertBefore(sh, pg); sh.appendChild(bl); bl.appendChild(pg);
      if (mode === 'scale') { pg.style.transform = `scale(${s})`; pg.style.transformOrigin = 'center center'; }
      if (marks && S > 0) {
        const L = S + B, T = S + B, R = S + B + W, Bo = S + B + H, g = B + 0.0625, len = S - 0.0625;   // marks start outside the bleed
        const ln = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
        const m = [ln(L, T - g, L, T - g - len), ln(L - g, T, L - g - len, T), ln(R, T - g, R, T - g - len), ln(R + g, T, R + g + len, T),
          ln(L, Bo + g, L, Bo + g + len), ln(L - g, Bo, L - g - len, Bo), ln(R, Bo + g, R, Bo + g + len), ln(R + g, Bo, R + g + len, Bo)].join('');
        sh.insertAdjacentHTML('beforeend', `<svg class="pe-marks" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none"><g stroke="#000" stroke-width="0.0035">${m}</g></svg>` +
          `<div class="pe-slug">${label} · p${i + 1}/${pages.length} · trim ${+W.toFixed(3)}x${+H.toFixed(3)} in · bleed ${B} · ${mode}</div>`);
      }
    });
    return { W, H, s, mode, n: pages.length };
  }, { B, S: marks ? SLUG : 0, MODE, marks, label: path.basename(pdfOut, '.pdf').replace(/\.rgb$/, '') });
  await p.pdf({ path: pdfOut, preferCSSPageSize: true, printBackground: true, tagged: true });
  await p.close();
  return info;
}

function toCmyk(src, dst, title) {
  // a copy of Ghostscript's PDFX_def.ps with our ICC profile, title and PDF/X version (it writes the output intent and the version key)
  const x4 = PDFX === '4';
  const def = fs.readFileSync(`${GSLIB}/lib/PDFX_def.ps`, 'utf8')
    .replace(/\/ICCProfile \([^)]*\) def/, `/ICCProfile (${ICC.replace(/[()\\]/g, '\\$&')}) def`)
    .replace(/\/Title \(Title\)/, `/Title (${title.replace(/[()\\]/g, '')})`)
    .replace('PDF/X-3:2002', x4 ? 'PDF/X-4' : 'PDF/X-3:2002');
  const defFile = dst.replace(/\.pdf$/, '.pdfx_def.ps'); fs.writeFileSync(defFile, def);
  // X-4 style (default): PDF 1.6, live transparency, everything stays vector. Ghostscript 10.02 cannot certify PDF/X-4, so the file is
  // marked X-4 but not validated; preflight it in Acrobat if the vendor requires certified X-4.
  // X-3: PDF 1.3, certified by Ghostscript, but transparency (the traces' opacity) is flattened, and in practice the page becomes one
  // 300 ppi CMYK image. Use it only when a vendor insists on X-3.
  const args = x4 ? ['-dCompatibilityLevel=1.6'] : ['-dPDFX=true', '-dCompatibilityLevel=1.3', '-r600'];
  execFileSync('gs', ['-q', '-dBATCH', '-dNOPAUSE', '-dNOSAFER', '-sDEVICE=pdfwrite', ...args,
    '-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK', `-sOutputICCProfile=${ICC}`, '-dEmbedAllFonts=true', '-dSubsetFonts=true',
    '-dPDFSETTINGS=/prepress', `-sOutputFile=${dst}`, defFile, src], { stdio: ['ignore', 'ignore', 'pipe'] });
  fs.unlinkSync(defFile);
}

function boxes(pdf, info, slug) {
  const pt = (v) => +(v * 72).toFixed(3), S = slug, W = info.W, H = info.H;
  execFileSync('python3', ['-P', '-c', `
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
r = PdfReader(sys.argv[1]); w = PdfWriter(clone_from=r); w.pdf_header = r.pdf_header
S, B, W, H = map(float, sys.argv[2:6])
for pg in w.pages:
    pg.trimbox = RectangleObject([S + B, S + B, S + B + W, S + B + H])
    pg.bleedbox = RectangleObject([S, S, S + 2 * B + W, S + 2 * B + H])
w.write(sys.argv[1])`, pdf, String(pt(S)), String(pt(B)), String(pt(W)), String(pt(H))]);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const tmpOut = fs.mkdtempSync(path.join(OUT, '.html-'));
  const rep = await make(path.resolve(file), { out: tmpOut });
  const data = JSON.parse(fs.readFileSync(file, 'utf8')), name = data.name ?? path.basename(file, '.json');
  const html = path.join(tmpOut, data.template.split('/')[0], name + '.html');
  for (const marks of [false, true]) {
    const final = path.join(OUT, `${name}-print${marks ? '-marks' : ''}.pdf`), rgb = final.replace(/\.pdf$/, '.rgb.pdf');
    const info = await sheet(html, rgb, marks);
    if (has('rgb') || !GSLIB) fs.renameSync(rgb, final); else { toCmyk(rgb, final, data.title ?? name); fs.unlinkSync(rgb); }
    boxes(final, info, marks ? SLUG : 0);
    console.log(`${path.relative(process.cwd(), final)}  trim ${+info.W.toFixed(3)}x${+info.H.toFixed(3)} in, bleed ${B} in, ${info.mode}${info.mode === 'scale' ? ` x${info.s.toFixed(4)}` : ''}, ${info.n} page(s), ${has('rgb') || !GSLIB ? 'RGB' : `CMYK PDF/X-${PDFX}${PDFX === '4' ? ' style, vector' : ', flattened'} (${path.basename(ICC)})`}`);
  }
  fs.rmSync(tmpOut, { recursive: true, force: true });
  await close();
  if (rep.faults.length) { console.log('make.mjs reported faults; fix them before sending to print:'); rep.faults.forEach((f) => console.log('  - ' + f)); process.exit(1); }
})().catch((e) => { console.error(e.stderr?.toString() || e); process.exit(1); });
