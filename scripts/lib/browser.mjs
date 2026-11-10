// Headless Chromium helpers (Playwright): HTML -> PDF / PNG, SVG -> PNG. Fonts come from styles/tokens.css (bundled in brand/fonts),
// so output is the same on every machine. If Playwright's browser is missing: npx playwright install chromium
// (or set CHROMIUM_PATH to an installed Chromium/Chrome).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let BROWSER = null;
export async function browser() {
  if (!BROWSER) BROWSER = await chromium.launch({ args: ['--no-sandbox', '--font-render-hinting=none'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  return BROWSER;
}
export async function close() { if (BROWSER) await BROWSER.close(); BROWSER = null; }

async function open(file, viewport, scale = 1) {
  const b = await browser();
  const p = await b.newPage({ viewport, deviceScaleFactor: scale });
  await p.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  return p;
}

// Checks every element with class "page" (or the body) for overflow, and lists fonts that did not load (a fallback font is a fault).
async function audit(p) {
  return p.evaluate(() => {
    const pages = [...document.querySelectorAll('.page')];
    const boxes = pages.length ? pages : [document.body];
    const faults = [];
    boxes.forEach((pg, i) => {
      if (pg.scrollHeight > pg.clientHeight + 1 || pg.scrollWidth > pg.clientWidth + 1) faults.push(`page ${i + 1}: content overflows its box`);
      const r = pg.getBoundingClientRect();
      const bandEl = pg.querySelector('.band'), bodyEl = pg.querySelector('.body');
      if (bandEl && bodyEl && bodyEl.lastElementChild) {
        const gap = bandEl.getBoundingClientRect().top - bodyEl.lastElementChild.getBoundingClientRect().bottom;
        if (gap < 0) faults.push(`page ${i + 1}: content runs ${Math.round(-gap)} px into the footer band`);
      }
      for (const el of pg.querySelectorAll('[data-fit]')) {
        if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) faults.push(`page ${i + 1}: text too long for its box: "${el.textContent.trim().slice(0, 50)}"`);
      }
      for (const el of pg.querySelectorAll('.safe *')) {
        const e = el.getBoundingClientRect(); if (!e.width) continue;
        if (e.right > r.right + 1 || e.bottom > r.bottom + 1) { faults.push(`page ${i + 1}: element outside the page: "${(el.textContent || el.tagName).trim().slice(0, 40)}"`); break; }
      }
    });
    const used = new Set([...document.querySelectorAll('body *')].map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '').trim()));
    const loaded = new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
    for (const f of used) if (['Inter', 'Geist Mono'].includes(f) && !loaded.has(f)) faults.push(`font not loaded: ${f}`);
    return { pages: boxes.length, faults };
  });
}

// htmlToPdf(file, out, {width, height}) - page size comes from the template's CSS @page (preferCSSPageSize). PNG of each .page beside it.
export async function htmlToPdf(file, out, o = {}) {
  const p = await open(file, { width: o.vw ?? 816, height: o.vh ?? 1056 }, o.scale ?? 2);
  const rep = await audit(p);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await p.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  const pngs = [];
  if (o.png !== false) {
    const pages = await p.$$('.page');
    for (let i = 0; i < pages.length; i++) { const f = out.replace(/\.pdf$/, pages.length > 1 ? `-p${i + 1}.png` : '.png'); await pages[i].screenshot({ path: f }); pngs.push(f); }
  }
  await p.close();
  return { ...rep, pdf: out, pngs };
}

// htmlToPng(file, out, {width, height, scale}) - one image of the viewport (banners, social, slides). Each .page becomes its own PNG if several.
export async function htmlToPng(file, out, o = {}) {
  const p = await open(file, { width: o.width, height: o.height }, o.scale ?? 1);
  const rep = await audit(p);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const pages = await p.$$('.page');
  const pngs = [];
  if (pages.length > 1) for (let i = 0; i < pages.length; i++) { const f = out.replace(/\.png$/, `-${String(i + 1).padStart(2, '0')}.png`); await pages[i].screenshot({ path: f }); pngs.push(f); }
  else { await p.screenshot({ path: out, omitBackground: !!o.transparent, clip: { x: 0, y: 0, width: o.width, height: o.height } }); pngs.push(out); }
  if (o.pdf) await p.pdf({ path: out.replace(/\.png$/, '.pdf'), preferCSSPageSize: true, printBackground: true });
  await p.close();
  return { ...rep, pngs };
}

export async function svgToPng(svg, out, o = {}) {
  const tmp = out.replace(/\.png$/, '.tmp.html');
  const m = svg.match(/width="([\d.]+)"\s+height="([\d.]+)"/);
  const w = o.width ?? Math.round(+m[1]), h = o.height ?? Math.round(+m[2]);
  const css = path.relative(path.dirname(tmp), path.join(ROOT, 'styles/tokens.css'));
  fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${css}"><style>html,body{margin:0;background:${o.bg ?? 'transparent'}}svg{display:block}</style>${svg}`);
  const p = await open(tmp, { width: w, height: h }, o.scale ?? 1);
  await p.screenshot({ path: out, omitBackground: !o.bg, clip: { x: 0, y: 0, width: w, height: h } });
  await p.close(); fs.unlinkSync(tmp);
  return out;
}
