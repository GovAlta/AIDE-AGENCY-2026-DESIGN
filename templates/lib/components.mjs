// HTML component helpers for Agency 2026 templates. Each returns an HTML string that uses styles/agency.css.
// Templates import these; content JSON never contains HTML except the inline marks below.
//
// Inline marks in any text field: **bold**, ==highlight== (accent colour), \n = line break. Everything else is escaped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { traces as tracesSvg, corner as cornerSvg, chip as chipSvg, svgDoc, T } from '../../scripts/lib/vectors.mjs';
import { qrSvg } from '../../scripts/lib/qr.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export { T };

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/==(.+?)==/g, '<span class="hi">$1</span>').replace(/\n/g, '<br>');
export const acc = (name, fallback = 'blue') => `a-${T.color[name] ? name : fallback}`;
const SPEC = T.spectrumNames;
export const nth = (i) => SPEC[(i * 3) % SPEC.length];        // spread accents across the spectrum when none is given

// asset path relative to the generated HTML file (make.mjs sets ctx.base, the path from the output folder back to the repo root)
export const asset = (ctx, rel) => (ctx.base ? ctx.base.replace(/\/$/, '') + '/' : '') + rel;

// ---------- chrome ----------
export const top = (ctx, o = {}) => `<div class="top"><div class="row"><div class="mark">${esc(o.event ?? 'Agency')}<b>${esc(o.year ?? '2026')}</b></div>${o.label ? `<span class="mark-label">${esc(o.label)}</span>` : ''}</div>` +
  `<img class="sig" src="${asset(ctx, o.dark ? 'brand/logos/goa-signature-white.png' : 'brand/logos/goa-signature.png')}" alt="Government of Alberta"></div>`;
export const band = (o = {}) => `<div class="band${o.spectrum ? ' spectrum-top' : ''}"><span>${md(o.left ?? '')}</span>${o.right ? `<span>${md(o.right)}</span>` : ''}<span class="cls">${esc(o.cls ?? T.classification.default)}</span></div>`;
export const kicker = (s, accent) => s ? `<div class="kicker ${accent ? acc(accent, 'purple') : ''}">${md(s)}</div>` : '';
export const busRule = (colors = ['purple', 'yellow', 'cyan'], width) => `<div class="bus"${width ? ` style="width:${width}"` : ''}>${colors.map((c) => `<i style="--c:var(--${c})"></i>`).join('')}</div>`;

// ---------- art ----------
// full-bleed traces behind content. w/h are the canvas size in CSS px; depth limits how far art reaches (fractions).
export const tracesLayer = (o) => `<div class="traces-layer">${svgDoc(o.w, o.h, tracesSvg(o)).replace('<svg ', '<svg preserveAspectRatio="none" ')}</div>`;
export const cornerArt = (o) => `<div class="art" style="${o.style ?? ''}">${svgDoc(o.w ?? 300, o.h ?? 270, cornerSvg(o))}</div>`;
export const chipArt = (o = {}) => `<div class="chip-art" style="${o.style ?? ''}">${svgDoc(o.size ?? 80, Math.round((o.size ?? 80) * 2.05), chipSvg({ size: o.size ?? 80, lead: o.lead }))}</div>`;
export const qr = (url, o = {}) => `<div class="qr">${qrSvg(url, { style: o.style ?? 'rounded', accent: o.accent ?? 'blue', badge: o.badge })}${o.title || o.show !== false ? `<div class="qr-t">${o.title ? `<b>${md(o.title)}</b>` : ''}${o.show !== false ? `<span>${esc(o.display ?? url.replace(/^https?:\/\//, ''))}</span>` : ''}</div>` : ''}</div>`;

// ---------- blocks ----------
const style = (o) => (o.accent ? ` style="--c:var(--${o.accent})"` : '');
export const tile = (t, i = 0) => `<div class="tile ${t.dark ? 'dark' : ''}" style="--c:var(--${t.accent ?? nth(i)})">${t.value != null ? `<div class="v"${t.size ? ` style="font-size:calc(${t.size} * var(--u))"` : ''}>${md(t.value)}${t.unit ? `<small>${esc(t.unit)}</small>` : ''}</div>` : ''}${t.title ? `<div class="l"><b style="font-size:1.16em">${md(t.title)}</b><br>${md(t.label ?? '')}</div>` : `<div class="l">${md(t.label ?? '')}</div>`}</div>`;
export const tiles = (items, n) => `<div class="tiles" style="--n:${n ?? items.length}">${items.map(tile).join('')}</div>`;
export const split = (parts) => `<div class="split">${parts.map((p, i) => `<div class="${['yellow', 'lime', 'rose', 'lilac'].includes(p.accent) ? 'lightc' : ''}" style="flex:${p.value};--c:var(--${p.accent ?? nth(i)})">${md(p.label ?? '')}</div>`).join('')}</div>`;
export const bars = (rows) => rows.map((r, i) => `<div class="bar" style="--c:${r.neutral ? 'var(--neutral-bar)' : `var(--${r.accent ?? 'green'})`}"><span>${md(r.label)}</span><div class="t"><i style="width:${Math.max(0, Math.min(100, r.pct ?? r.value))}%"></i></div><b>${md(r.display ?? (r.value + '%'))}</b></div>`).join('');
export const card = (c) => `<div class="card">${c.title ? `<h3>${md(c.title)}</h3>` : ''}${c.text ? `<p>${md(c.text)}</p>` : ''}${c.bars ? bars(c.bars) : ''}${c.blocks ? blocks(c.blocks) : ''}</div>`;
export const flow = (steps) => `<div class="flow" style="--n:${steps.length}">${steps.map((s, i) => `<div class="step" style="--c:var(--${s.accent ?? nth(i)})"><div class="n">${String(i + 1).padStart(2, '0')}</div><div class="h">${md(s.title)}</div><div class="d">${md(s.text ?? '')}</div></div>`).join('')}</div>`;
export const dots = (items, accent) => `<ul class="dots"${accent ? ` style="--c:var(--${accent})"` : ''}>${items.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`;
export const table = (t) => `<table class="agency"><tr>${t.head.map((h) => `<th>${md(h)}</th>`).join('')}</tr>${t.rows.map((r) => `<tr>${r.map((c, j) => `<td${j > 0 && t.numeric !== false ? ' class="n"' : ''}>${md(c)}</td>`).join('')}</tr>`).join('')}</table>`;
export const quote = (q) => `<div class="quote">${md(q.text)}${q.small ? `<small>${md(q.small)}</small>` : ''}</div>`;

// the block renderer: an array of {type, ...} -> HTML. Used by doc templates (handout, fact sheet, report) and slide bodies.
export function blocks(list = [], ctx = {}) {
  return list.map((b) => {
    switch (b.type) {
      case 'section': return `<div class="stack">${b.title ? `<h2${style(b)}>${md(b.title)}</h2>` : ''}${b.intro ? `<p>${md(b.intro)}</p>` : ''}${blocks(b.blocks, ctx)}</div>`;
      case 'tiles': return tiles(b.items, b.columns);
      case 'split': return split(b.parts) + (b.note ? `<div class="note">${md(b.note)}</div>` : '') + (b.legend ? '' : '');
      case 'cards': return `<div class="cols" style="--n:${b.columns ?? b.items.length}">${b.items.map(card).join('')}</div>`;
      case 'card': return card(b);
      case 'bars': return bars(b.rows);
      case 'flow': return flow(b.steps);
      case 'cols': return `<div class="cols" style="--n:${b.cols.length}">${b.cols.map((c) => `<div class="stack">${blocks(Array.isArray(c) ? c : [c], ctx)}</div>`).join('')}</div>`;
      case 'dots': return dots(b.items, b.accent);
      case 'table': return table(b);
      case 'quote': return quote(b);
      case 'callout': return `<div class="callout"${style(b)}>${b.title ? `<h3>${md(b.title)}</h3>` : ''}${md(b.text)}</div>`;
      case 'text': return `<p${b.size ? ` style="font-size:calc(${b.size} * var(--u))"` : ''}>${md(b.text)}</p>`;
      case 'lead': return `<p class="lead">${md(b.text)}</p>`;
      case 'note': return `<p class="note">${md(b.text)}</p>`;
      case 'terms': return `<p class="note">${md(b.text)}</p>`;
      case 'qr': return qr(b.url, b);
      case 'image': return `<img src="${b.src.startsWith('http') || b.src.startsWith('data:') ? b.src : asset(ctx, b.src)}" alt="${esc(b.alt ?? '')}" style="width:100%;${b.height ? `height:${b.height};object-fit:cover;` : ''}border-radius:calc(7 * var(--u))">`;
      case 'spacer': return `<div style="height:calc(${b.size ?? 8} * var(--u))"></div>`;
      case 'html': throw new Error('html blocks are not allowed: add a component instead');
      default: throw new Error(`unknown block type: ${b.type}`);
    }
  }).join('\n');
}

// read a JSON content file, resolving "@event" style references to tokens.event
export const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
