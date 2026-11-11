// Accessibility audit for rendered Agency pages (WCAG 2.1 AA): text contrast and image text alternatives.
// Used by scripts/lib/browser.mjs on every make.mjs run (faults show with --check), and on its own:
//   node scripts/a11y/contrast.mjs out/print/poster-event.html [more.html ...]     # report only, exit 1 on any failure
// Content files can waive a known false positive, with a reason, in "a11y": {"ignore": ["text that starts the element", ...]}.
//
// Contrast: every element with its own visible text is checked against the background behind it, found by compositing the
// background colours of its ancestors (and their opacity). Thresholds: 4.5:1, or 3:1 for large text (24 px and up, or 18.66 px and
// up at weight 700+). Text over an image, a gradient or an SVG cannot be measured this way; it is listed as "unmeasured" (never a fault)
// so a person checks it by eye. Text in SVG art is not checked.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// runs inside the page (Playwright evaluate); returns { faults: [...], unmeasured: n }
export function pageAudit(ignore = []) {
  const parse = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat(1); };
  const desc = (el) => { let s = el.tagName.toLowerCase(); if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s; };
  const faults = []; let unmeasured = 0;
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') || ['SCRIPT', 'STYLE', 'TITLE'].includes(el.tagName)) continue;
    const text = ownText(el); if (!text) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (ignore.some((s) => text.startsWith(s))) continue;
    // walk ancestors: collect background layers until an opaque one
    let fg = parse(cs.color); if (!fg) continue;
    let alpha = 1, layers = [], uncertain = false;
    for (let a = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      alpha *= +s.opacity;
      if (s.backgroundImage && s.backgroundImage !== 'none') { uncertain = true; break; }
      const bg = parse(s.backgroundColor);
      if (bg && bg[3] > 0) { layers.push(bg); if (bg[3] >= 0.999) break; }
    }
    if (uncertain) { unmeasured++; continue; }
    let bg = [255, 255, 255, 1];
    for (const l of layers.reverse()) bg = over(l, bg);
    fg = over([fg[0], fg[1], fg[2], fg[3] * alpha], bg);
    if (alpha < 0.05) continue;                                // invisible (an animation's start state)
    const px = parseFloat(cs.fontSize), w = +cs.fontWeight || 400, large = px >= 24 || (px >= 18.66 && w >= 700);
    const need = large ? 3 : 4.5, got = ratio(fg, bg);
    if (got + 1e-6 < need) faults.push(`contrast ${got.toFixed(2)}:1 < ${need}:1 (${Math.round(px)}px ${w}) ${desc(el)}: "${text.slice(0, 48)}"`);
  }
  for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) faults.push(`image without alt text: ${img.getAttribute('src')?.split('/').pop()}`);
  for (const s of document.querySelectorAll('svg[role="img"]')) if (!s.getAttribute('aria-label') && !s.querySelector('title')) faults.push('svg role="img" without aria-label or <title>');
  if (!document.documentElement.lang) faults.push('document has no lang attribute');
  if (!document.title.trim()) faults.push('document has no title');
  return { faults, unmeasured };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { chromium } = await import('playwright');
  const files = process.argv.slice(2);
  if (!files.length) { console.log('usage: node scripts/a11y/contrast.mjs page.html [...]'); process.exit(0); }
  const b = await chromium.launch({ args: ['--no-sandbox'] }); let bad = 0;
  for (const f of files) {
    const p = await b.newPage(); await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(pageAudit, []); bad += r.faults.length;
    console.log(`${r.faults.length ? 'FAIL' : 'ok  '} ${f}  (${r.unmeasured} text over images/gradients to check by eye)`); for (const x of r.faults) console.log('     - ' + x);
    await p.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
}
