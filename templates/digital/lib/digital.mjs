// Shared parts for templates/digital/*: event presets from tokens, the cover composition, the Alberta logo as inline vector, text fitting.
import fs from 'node:fs';
import path from 'node:path';
import { T, ROOT, esc, md, tracesLayer } from '../../lib/components.mjs';
import { chip as chipSvg, svgDoc } from '../../../scripts/lib/vectors.mjs';
import { qrSvg } from '../../../scripts/lib/qr.mjs';

export { T, esc, md };
export const CSS = fs.readFileSync(path.join(ROOT, 'styles/digital.css'), 'utf8');
const E = T.event;

// presets: the only event facts we print come from tokens.json "event" (the invite vectors). "custom" uses only what the content gives.
// preset: event | day1 | day2 | day3 | cfd | custom
export function preset(d) {
  const p = d.preset ?? 'event';
  let base = {};
  if (p === 'event') base = { title: E.name.replace(' ', '\n'), date: E.dates, lines: [E.cities], anchor: E.anchor, accent: 'blue' };
  else if (/^day[123]$/.test(p)) {
    const x = E.days[+p.slice(3) - 1]; const [t, s] = x.title.split(/:\s*/);
    base = { event: E.name, date: x.day, title: t + (s ? ':' : ''), subtitle: s ?? x.sub, lines: [s ? x.sub : '', x.place].filter(Boolean), anchor: E.anchor, accent: x.accent };
  } else if (p === 'cfd') base = { kicker2: E.callForDemos.kicker, title: E.callForDemos.title, cta: E.callForDemos.cta, anchor: E.anchor, accent: 'orange' };
  const o = { ...base };
  for (const k of ['event', 'date', 'title', 'subtitle', 'lines', 'anchor', 'cta', 'kicker', 'kicker2', 'accent', 'body']) if (d[k] !== undefined) o[k] = d[k];
  return o;
}

export const isDark = (g) => !!T.grounds[g]?.dark;

// Alberta logo, vector: grey word + sky square on light; white word + sky square on dark
const LOGO = fs.readFileSync(path.join(ROOT, 'brand/logos/alberta-logo.svg'), 'utf8').replace(/ width="[^"]*" height="[^"]*"/, '');
export const logo = (dark, style) => `<div class="dg-logo" style="${style}">${dark ? LOGO.replace(/#5f6a72/gi, '#FFFFFF') : LOGO}</div>`;

// the chip sits in a small clearing of ground colour so traces never run under it (the invite keeps a gap around it)
export const chip = () => '';   // retired 2026-11-11 (owner: no chip icon)
export const chipRetired = (size, style, lead = true) => `<div class="chip-art" style="z-index:1;${style}"><div class="chip-halo" style="width:${Math.round(size * 1.3)}px;height:${Math.round(size * 1.3)}px;left:${-Math.round(size * 0.15)}px;top:${-Math.round(size * 0.15)}px"></div><div style="position:relative">${svgDoc(size, Math.round(size * 2.05), chipSvg({ size, lead: lead ? undefined : false }))}</div></div>`;

// FIT: shrinks every [data-fit] element (2 px steps) until it fits its box width and its data-lines limit, measured with the real font.
// It runs on document.fonts.ready, before make.mjs measures and screenshots, so the audit sees the final size.
export const FIT = `<script>document.fonts.ready.then(() => { for (const el of document.querySelectorAll('[data-fit]')) {
  const max = +(el.dataset.lines || 3), box = el.parentElement, maxH = +(el.dataset.maxh || 1e9);
  let px = parseFloat(getComputedStyle(el).fontSize);
  const lines = () => Math.round(el.getBoundingClientRect().height / (px * parseFloat(getComputedStyle(el).lineHeight) / px || px));
  while (px > 12 && (el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().width > box.clientWidth + 1 || lines() > max || el.getBoundingClientRect().height > maxH)) { px -= 2; el.style.fontSize = px + 'px'; }
} });</script>`;
export const traces = (w, h, ground, seed, o = {}) => tracesLayer({ w, h, ground, seed, ...o });

// estimate the largest font size (px) at which `text` wraps into maxLines within maxW. Inter ExtraBold averages ~0.6 em per character.
export function fit(text, maxW, maxPx, maxLines = 3, minPx = 10, k = 0.6) {
  const paras = String(text).split('\n');
  for (let px = maxPx; px >= minPx; px -= 2) {
    const cw = px * k; let lines = 0, ok = true;
    for (const para of paras) {
      let cur = 0; lines++;
      for (const w of para.split(/\s+/)) {
        const ww = w.length * cw; if (ww > maxW) { ok = false; break; }
        const add = (cur ? cw * 0.55 : 0) + ww;
        if (cur + add > maxW) { lines++; cur = ww; } else cur += add;
      }
    }
    if (ok && lines <= maxLines) return px;
  }
  return minPx;
}

export const qrBlock = (url, px, label) => `<div class="dg-qr">${qrSvg(url, { style: 'rounded', accent: 'blue', size: px })}${label ? `<span>${esc(label)}</span>` : ''}</div>`;
export const sampleTag = (d, style) => (d.sample ? `<div class="dg-sample" style="${style}">${esc(d.sample === true ? 'Sample' : d.sample)}</div>` : '');
export const cls = (d, style, light) => (d.classification === false ? '' : `<div class="dg-cls${light ? ' light' : ''}" style="${style}">${esc(d.classification ?? T.classification.default)}</div>`);
export const mark = (style, year = '2026') => `<div class="dg-mark" style="${style}">Agency<b>${year}</b></div>`;
export const bus = (colors = ['purple', 'yellow', 'cyan'], style = '') => `<div class="dg-bus" style="${style}">${colors.map((c) => `<i style="--c:var(--${c})"></i>`).join('')}</div>`;

// the invite's centred stack: event line, maroon date, big title, subtitle, place lines, CTA
export function stack(o, titlePx, align = 'center') {
  return `${o.kicker ? `<div class="dg-kicker">${md(o.kicker)}</div>` : ''}` +
    `${o.event ? `<div class="dg-event">${md(o.event)}</div>` : ''}${o.date && o.event ? `<div class="dg-date">${md(o.date)}</div>` : ''}` +
    `${o.kicker2 ? `<div class="dg-sub" style="font-size:2.4em;margin-bottom:-0.1em">${md(o.kicker2)}</div>` : ''}` +
    `<div class="dg-title" data-fit data-lines="${o.maxLines ?? 3}" style="font-size:${titlePx}px">${md(o.title)}</div>` +
    `${o.date && !o.event ? `<div class="dg-date" style="font-size:2em">${md(o.date)}</div>` : ''}` +
    `${o.subtitle ? `<div class="dg-sub">${md(o.subtitle)}</div>` : ''}` +
    `${(o.lines ?? []).map((l, i) => `<div class="dg-line"${!o.subtitle && !o.event && i === 0 ? ' style="font-size:1.75em"' : ''}>${md(l)}</div>`).join('')}` +
    `${o.cta ? `<div class="dg-cta">${md(o.cta)}</div>` : ''}${o.body ? `<p class="dg-body" style="margin-top:0.8em;${align === 'center' ? 'margin-left:auto;margin-right:auto' : ''}">${md(o.body)}</p>` : ''}`;
}

// inviteCover: the invite vector's composition at any size. Traces on every edge, chip top centre-right, the centred stack in the safe
// box, the anchor line bottom-left, the Alberta logo bottom-right. o: { safe: [x0,y0,x1,y1] fractions, depth, chipAt: [x,y], maxLines }
export function inviteCover(d, ctx, W, H, o = {}) {
  const g = d.ground ?? 'board', dark = isDark(g), p = preset(d);
  const S = Math.min(W, H), fs = Math.round(S / 60 * (o.fsScale ?? 1));
  const [x0, y0, x1, y1] = o.safe ?? [0.2, 0.25, 0.8, 0.76];
  const boxW = (x1 - x0) * W;
  const titleMax = o.titleMax ?? (p.title.length <= 12 ? S * 0.19 : S * 0.105);
  const titlePx = d.titleSize ?? fit(p.title, boxW * 0.98, Math.round(titleMax), o.maxLines ?? 3, 20);
  p.maxLines = o.maxLines ?? 3;
  const depth = o.depth ?? { l: x0 - 0.02, r: 1 - x1 - 0.02, t: y0 - 0.03, b: 1 - y1 - 0.03 };
  const chipS = Math.round(S * 0.056), [cx, cy] = o.chipAt ?? [0.565, 0.055];
  return `<div class="page dg g-${g}${dark ? ' dark' : ''}" style="width:${W}px;height:${H}px;--fs:${fs}px">
  ${traces(W, H, g, d.seed ?? `${d.name ?? 'cover'}-${W}x${H}`, { depth, density: o.density ?? 1, span: o.span ?? { b: [0.27, 0.73] } })}
  ${d.chip === false ? '' : chip(chipS, `left:${Math.round(cx * W - chipS / 2)}px;top:${Math.round(cy * H)}px`)}
  <div class="safe dg-center" style="left:${x0 * W}px;top:${y0 * H}px;width:${boxW}px;height:${(y1 - y0) * H}px">${stack(p, titlePx)}</div>
  ${p.anchor ? `<div class="dg-anchor" style="left:${0.045 * W}px;bottom:${0.045 * H}px;white-space:nowrap">${md(p.anchor.replace(/^Anchored by the /, 'Anchored by the\n'))}</div>` : ''}
  ${logo(dark, `right:${0.04 * W}px;bottom:${0.045 * H}px;width:${Math.round(Math.max(W, H) * (o.logoW ?? 0.16))}px`)}
  ${sampleTag(d, `left:${0.045 * W}px;top:${0.04 * H}px`)}
</div>${FIT}`;
}

// page shell for the non-invite layouts
export const page = (W, H, g, fs, inner, extra = '') => `<div class="page dg g-${g}${isDark(g) ? ' dark' : ''}" style="width:${W}px;height:${H}px;--fs:${fs}px${extra}">${inner}</div>${FIT}`;
export const E_ = T.event;
