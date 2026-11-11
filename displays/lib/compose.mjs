import { traceUnderline } from '../../scripts/lib/vectors.mjs';
// Compose display faces as real-size SVG (inches). Production SVGs carry no live text: every word is outlined (fontTools).
// Layers (top-level groups, which Illustrator opens as layers): Ground, Art, Brand, Content, and CutContour (the monitor window and
// the trim as a magenta hairline; hidden in previews). Previews add a mock monitor and ledge so a PNG reads like the built stand.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, T, outlineBatch } from './model.mjs';
import { draw, r3, C } from './traces.mjs';
import { DESIGNS, wrapStrip } from './designs.mjs';
import { qrSvg } from '../../scripts/lib/qr.mjs';

const LOGO = fs.readFileSync(path.join(ROOT, 'brand/logos/alberta-logo.svg'), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const FONT = { inter: { word: 'inter-extrabold', sub: 'inter-semibold', title: 'inter-bold', kicker: 'inter-semibold' }, liberation: { word: 'liberation-bold', sub: 'liberation-bold', title: 'liberation-bold', kicker: 'liberation-bold' } };
const G = T.grounds;

// the art (lines + extras) for every face of a resolved display, for one variant
export function artFor(r) {
  const out = {};
  if (r.variant === 'wrap') {
    const strip = wrapStrip(r, r.seed);
    for (const f of r.faces) out[f.name] = { lines: strip.lines.map((l) => ({ ...l, pts: l.pts.map(([x, y]) => [x - f.x0, y]), grad: l.grad && !l.grad.vertical && l.grad.stops ? { ...l.grad, span: [-1 - f.x0, r.stripW + 1 - f.x0] } : l.grad })), strip: true };
    return out;
  }
  for (const f of r.faces) {
    const fn = r.variant === 'converge' && f.name !== 'front' && r.kind === 'kiosk' ? DESIGNS.rise : DESIGNS[r.variant];
    out[f.name] = fn(f, r, `${r.seed}:${f.name}`);
  }
  return out;
}

function lockupSvg(r, f, dark) {
  const L = f.lockup; if (!L) return '';
  const F = FONT[r.font];
  const reqs = L.words.map((w) => ({ text: w, font: F.word, size: L.S, tracking: -0.01 })).concat([{ text: 'Technology and Innovation', font: F.sub, size: L.sub.size }]);
  const o = outlineBatch(reqs);
  const ink = dark ? '#FFFFFF' : C.navy, yr = dark ? T.textOnDark.maroon : C.maroon;
  let x = L.x; const words = o.slice(0, L.words.length).map((g, i) => { const s = `<path fill="${i ? yr : ink}" transform="translate(${r3(x)} ${r3(L.baseline)})" d="${g.d}"/>`; x += g.width + 0.12 * L.S; return s; }).join('');
  const sub = o[L.words.length];
  const logo = dark ? LOGO.replace(/#5f6a72/gi, '#FFFFFF') : LOGO;
  return `<g id="Brand">` +
    `<title>Agency${L.words.length > 1 ? ' 2026' : ''} · Alberta · Technology and Innovation</title>${words}` +
    `<g transform="translate(${r3(L.rule.x)} ${r3(L.rule.y - 0.06 * L.S)})">${traceUnderline({ size: L.S, w: r3(L.rule.w), dark })}</g>` +   // owner 2026-11-11: trace underline, no rainbow
    `<g transform="translate(${r3(L.logo.x)} ${r3(L.logo.y)}) scale(${r3(L.logo.w / 216)})">${logo}</g>` +
    `<path fill="${dark ? '#E6EEF5' : C.navy}" transform="translate(${r3(L.sub.right - sub.width)} ${r3(L.sub.baseline)})" d="${sub.d}"/></g>`;
}

function contentSvg(r, f, dark) {
  const parts = [], F = FONT[r.font];
  if (f.title) {
    const t = f.title, reqs = [];
    if (t.kicker) reqs.push({ text: t.kicker.toUpperCase(), font: F.kicker, size: t.size * 0.42, tracking: 0.14 });
    // wrap the title to the face width (greedy, measured with the real font)
    const words = String(t.text).split(/\s+/), unit = outlineBatch(words.map((w) => ({ text: w, font: F.title, size: 1, tracking: -0.01 }))), space = 0.28;
    const lines = []; let cur = [], w = 0;
    words.forEach((wd, i) => { const ww = unit[i].width * t.size; if (cur.length && w + space * t.size + ww > t.w) { lines.push(cur.join(' ')); cur = [wd]; w = ww; } else { w += (cur.length ? space * t.size : 0) + ww; cur.push(wd); } });
    if (cur.length) lines.push(cur.join(' '));
    lines.slice(0, 3).forEach((ln) => reqs.push({ text: ln, font: F.title, size: t.size, tracking: -0.01 }));
    const o = outlineBatch(reqs); let y = t.y, i = 0;
    if (t.kicker) { y += o[0].cap; parts.push(`<path fill="${dark ? T.textOnDark.purple : T.textOnLight.purple}" transform="translate(${r3(t.x)} ${r3(y)})" d="${o[0].d}"/>`); y += t.size * 0.5; i = 1; }
    for (; i < o.length; i++) { y += o[i].cap + (i > (t.kicker ? 1 : 0) ? t.size * 0.32 : 0); parts.push(`<path fill="${dark ? '#FFFFFF' : C.navy}" transform="translate(${r3(t.x)} ${r3(y)})" d="${o[i].d}"/>`); }
  }
  if (f.qr) {
    const q = f.qr, s = qrSvg(q.url, { style: 'rounded', accent: 'blue' });
    const inner = s.replace(/^<svg[^>]*viewBox="([^"]+)"[^>]*>/, (m, vb) => `<svg x="${r3(q.x)}" y="${r3(q.y)}" width="${r3(q.size)}" height="${r3(q.size)}" viewBox="${vb}">`);
    parts.push(inner);
    if (q.label) { const o = outlineBatch([{ text: q.label, font: FONT[r.font].sub, size: Math.min(1.1, q.size * 0.11) }])[0]; parts.push(`<path fill="${dark ? '#FFFFFF' : C.navy}" transform="translate(${r3(q.x + (q.size - o.width) / 2)} ${r3(q.y + q.size + 0.6 + o.cap)})" d="${o.d}"/>`); }
  }
  return parts.length ? `<g id="Content">${parts.join('')}</g>` : '';
}

// one face as SVG. mode: 'production' (art + CutContour layer), 'print' (art only, for the PDF), 'preview' (with mock monitor and ledge)
export function faceSvg(r, f, art, mode = 'production') {
  const b = r.bleed, W = f.W, H = f.H, g = G[r.ground] || G.board, dark = !!g.dark;
  const vb = `${r3(-b)} ${r3(-b)} ${r3(W + 2 * b)} ${r3(H + 2 * b)}`;
  const zones = art.strip ? stripZonesFor(r, f) : [...f.zones.map((z) => z.rect), ...(art.zones || [])];
  const safe = [r.m * 0.5, r.m * 0.5, W - r.m * 0.5, H - r.m * 0.5];
  const lines = art.lines;
  const body = draw(lines, { zones, safe, padFill: g.bg, id: `${f.name}-`, minLen: 0.8 });
  const groundRect = r.ground === 'night' ? `<defs><radialGradient id="ng-${f.name}" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#0A2A47"/><stop offset="1" stop-color="${G.night.bg}"/></radialGradient></defs><rect x="${r3(-b)}" y="${r3(-b)}" width="${r3(W + 2 * b)}" height="${r3(H + 2 * b)}" fill="url(#ng-${f.name})"/>`
    : `<rect x="${r3(-b)}" y="${r3(-b)}" width="${r3(W + 2 * b)}" height="${r3(H + 2 * b)}" fill="${g.bg}"/>`;
  const L = [`<g id="Ground">${groundRect}</g>`, `<g id="Art">${body}${art.extras || ''}</g>`, lockupSvg(r, f, dark), contentSvg(r, f, dark)];
  if (mode === 'preview') L.push(mockSvg(r, f, dark));
  if (mode === 'production') {
    const cut = [`<rect x="0" y="0" width="${r3(W)}" height="${r3(H)}"/>`];
    if (f.monitor) cut.push(`<rect x="${r3(f.monitor.x)}" y="${r3(f.monitor.y)}" width="${r3(f.monitor.w)}" height="${r3(f.monitor.h)}"/>`);
    L.push(`<g id="CutContour" fill="none" stroke="#EC008C" stroke-width="0.01">${cut.join('')}</g>`);
  }
  const title = `Agency display · ${r.kind} ${r.W}x${r.kind === 'kiosk' ? r.D + 'x' : ''}${r.H} in · ${f.name} · ${r.variant}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r3(W + 2 * b)}in" height="${r3(H + 2 * b)}in" viewBox="${vb}"><title>${title}</title>${L.join('')}</svg>\n`;
}

// a strip-drawn design keeps clear of every face's zones (shifted into this face's coordinates)
function stripZonesFor(r, f) {
  return r.faces.flatMap((o) => o.zones.map((z) => [z.rect[0] + o.x0 - f.x0, z.rect[1], z.rect[2] + o.x0 - f.x0, z.rect[3]]));
}

// preview only: the monitor as a real screen showing Agency content (the production file marks the window as a CutContour path)
const SCREEN = (() => { const f = path.join(ROOT, 'samples/video/screen-bench/frames/agency-light-02-title.jpg'); return fs.existsSync(f) ? 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64') : null; })();
function mockSvg(r, f, dark) {
  const p = [];
  if (f.monitor) {
    const m = f.monitor, bz = 0.45;
    p.push(`<rect x="${r3(m.x - bz)}" y="${r3(m.y - bz)}" width="${r3(m.w + 2 * bz)}" height="${r3(m.h + 2 * bz)}" rx="0.3" fill="#0d1218"/>`,
      SCREEN ? `<image href="${SCREEN}" x="${r3(m.x)}" y="${r3(m.y)}" width="${r3(m.w)}" height="${r3(m.h)}" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="${r3(m.x)}" y="${r3(m.y)}" width="${r3(m.w)}" height="${r3(m.h)}" fill="#22303d"/>`);
  }
  return p.length ? `<g id="Mock">${p.join('')}</g>` : '';
}

// the kiosk wrap sheet: all four faces side by side on one artboard, fold lines in the preview
export function wrapSvg(r, arts, mode = 'production') {
  const b = r.bleed, SW = r.stripW, H = r.H;
  const faces = r.faces.map((f) => {
    const s = faceSvg({ ...r, bleed: 0 }, f, arts[f.name], mode === 'production' ? 'print' : mode);
    const inner = s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/, '').replace(/id="(Ground|Art|Brand|Content|Mock)"/g, `id="$1-${f.name}"`);
    return `<svg x="${r3(f.x0)}" y="0" width="${r3(f.W)}" height="${r3(H)}" viewBox="0 0 ${r3(f.W)} ${r3(H)}" overflow="hidden">${inner}</svg>`;
  });
  const g = G[r.ground] || G.board;
  const extra = [];
  if (mode === 'preview') r.faces.slice(1).forEach((f) => extra.push(`<line x1="${r3(f.x0)}" y1="0" x2="${r3(f.x0)}" y2="${r3(H)}" stroke="#EC008C" stroke-width="0.06" stroke-dasharray="0.6 0.4"/>`));
  if (mode === 'production') {
    const front = r.faces[0];
    extra.push(`<g id="CutContour" fill="none" stroke="#EC008C" stroke-width="0.01"><rect x="0" y="0" width="${r3(SW)}" height="${r3(H)}"/>${front.monitor ? `<rect x="${r3(front.monitor.x)}" y="${r3(front.monitor.y)}" width="${r3(front.monitor.w)}" height="${r3(front.monitor.h)}"/>` : ''}</g>`,
      `<g id="Folds" fill="none" stroke="#00A0E0" stroke-width="0.01">${r.faces.slice(1).map((f) => `<line x1="${r3(f.x0)}" y1="0" x2="${r3(f.x0)}" y2="${r3(H)}"/>`).join('')}</g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r3(SW + 2 * b)}in" height="${r3(H + 2 * b)}in" viewBox="${r3(-b)} ${r3(-b)} ${r3(SW + 2 * b)} ${r3(H + 2 * b)}"><title>Agency display · kiosk wrap ${r.W}x${r.D}x${r.H} in · ${r.variant}</title>` +
    `<rect x="${r3(-b)}" y="${r3(-b)}" width="${r3(SW + 2 * b)}" height="${r3(H + 2 * b)}" fill="${g.bg}"/>${faces.join('')}${extra.join('')}</svg>\n`;
}
