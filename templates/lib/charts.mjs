// Agency 2026 charts as inline SVG blocks: line, column, stacked, donut, waffle, gauge, timeline.
// One SVG user unit = one template unit (--u: pt in print, px on slides), so chart text matches the page's type. Give "width" and
// "height" in those units (defaults suit a full-width Letter column); "font" sets the base label size (default 8.4).
// Colour: series follow the MVAI kit's order, evenly spaced along the spectrum (R.series in goa-agency.js), unless an item names an
// "accent". Words are never set in a light accent: labels use the ground's ink, with a colour key beside them.
// Accessibility: every chart is role="img" with a <title> and a <desc> that states the data; "table": true adds the data as a table
// under the chart, "table": "hidden" adds it for screen readers only.
import { T } from '../../scripts/lib/vectors.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = (n) => Math.round(n * 100) / 100;
const C = T.color;

// colours
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, u) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * u).toString(16).padStart(2, '0')).join(''); };
export const spec = (u) => { const S = T.spectrum, n = S.length - 1, k = Math.max(0, Math.min(1, u)) * n, i = Math.min(n - 1, Math.floor(k)); return mix(S[i], S[i + 1], k - i); };
export const seriesColor = (i, n, item) => (item?.accent && C[item.accent]) || (item?.accent === 'neutral' ? C.neutralBar : null) || spec(n <= 1 ? 0.15 : i / (n - 1));
const INK = 'var(--g-ink, var(--navy))', SOFT = 'var(--g-soft, var(--mute))', GRID = 'var(--g-line, var(--line))', TRACK = 'var(--g-field, var(--track))';

// number formatting and nice ticks
const fmt = (v, o = {}) => { const d = o.decimals ?? (Math.abs(v) < 10 && v % 1 ? 1 : 0); const s = Number(v).toLocaleString('en-CA', { minimumFractionDigits: d, maximumFractionDigits: d }); return (o.prefix ?? '') + s + (o.unit ?? ''); };
function ticks(min, max, n = 4) {
  const span = max - min || 1, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw);
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
  for (let v = lo; v <= hi + step / 1e6; v += step) out.push(+v.toFixed(10));
  return out;
}

function frame(o, w, h, inner, summary) {
  const id = 'c' + Math.abs([...String(o.title ?? '') + summary].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7)).toString(36);
  const svg = `<svg class="chart" role="img" aria-labelledby="${id}-t ${id}-d" viewBox="0 0 ${r2(w)} ${r2(h)}" style="width:calc(${r2(w)} * var(--u));max-width:100%;height:auto;display:block;overflow:visible" font-family="Inter, Arial, sans-serif">` +
    `<title id="${id}-t">${esc(o.title ?? o.alt ?? 'Chart')}</title><desc id="${id}-d">${esc(o.desc ?? summary)}</desc>${inner}</svg>`;
  const head = o.title && o.showTitle !== false ? `<div class="chart-title">${esc(o.title)}</div>` : '';
  const src = o.source ? `<div class="note chart-src">${esc(o.source)}</div>` : '';
  return `<figure class="chart-fig">${head}${svg}${src}${o.table ? dataTable(o) : ''}</figure>`;
}

// the same data as a plain table (visible, or for screen readers only)
function dataTable(o) {
  let head = [], rows = [];
  if (o.series && o.x) { head = ['', ...o.series.map((s) => s.name ?? '')]; rows = o.x.map((x, i) => [x, ...o.series.map((s) => fmt(s.values[i], o.y ?? o))]); }
  else if (o.values && o.x) { head = ['', o.name ?? 'Value']; rows = o.x.map((x, i) => [x, fmt(o.values[i], o.y ?? o)]); }
  else if (o.rows && o.parts) { head = ['', ...o.parts.map((p) => p.label ?? p)]; rows = o.rows.map((r) => [r.label, ...r.values.map((v) => fmt(v, o))]); }
  else if (o.parts) { head = ['', 'Value']; rows = o.parts.map((p) => [p.label, fmt(p.value, o)]); }
  else if (o.items) { head = ['When', 'What']; rows = o.items.map((it) => [it.when, it.title]); }
  else if (o.value != null) { head = ['', 'Value']; rows = [[o.label ?? '', o.display ?? fmt(o.value, o)]]; }
  const hidden = o.table === 'hidden' ? ' sr-only' : '';
  return `<table class="agency chart-table${hidden}"><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c, j) => `<td${j ? ' class="n"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
}

const text = (x, y, s, o = {}) => `<text x="${r2(x)}" y="${r2(y)}" font-size="${r2(o.size)}" font-weight="${o.weight ?? 500}" fill="${o.fill ?? INK}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.base ? ` dominant-baseline="${o.base}"` : ''}${o.mono ? ' font-family="Geist Mono, Consolas, monospace" letter-spacing="0.06em"' : ''}>${esc(s)}</text>`;
const key = (x, y, c, f) => `<rect x="${r2(x)}" y="${r2(y - f * 0.62)}" width="${r2(f * 0.7)}" height="${r2(f * 0.7)}" rx="${r2(f * 0.16)}" fill="${c}"/>`;

// ---------- line: x labels, one or more series, end labels ----------
export function line(o) {
  const f = o.font ?? 8.4, w = o.width ?? 500, h = o.height ?? 190, n = o.series.length;
  const all = o.series.flatMap((s) => s.values), y = o.y ?? {};
  const tk = ticks(y.min ?? Math.min(0, ...all), y.max ?? Math.max(...all), y.ticks ?? 4), lo = tk[0], hi = tk[tk.length - 1];
  const L = f * 4.2, R = n > 1 || o.endLabels !== false ? f * 9.5 : f * 2, Tp = f * 1.2, B = f * 2.6, pw = w - L - R, ph = h - Tp - B;
  const X = (i) => L + (o.x.length === 1 ? pw / 2 : (i * pw) / (o.x.length - 1)), Y = (v) => Tp + ph - ((v - lo) / (hi - lo)) * ph;
  let g = tk.map((t) => `<line x1="${L}" x2="${r2(L + pw)}" y1="${r2(Y(t))}" y2="${r2(Y(t))}" stroke="${GRID}" stroke-width="${t === lo ? 1.2 : 0.6}"/>` + text(L - f * 0.6, Y(t) + f * 0.34, fmt(t, y), { size: f * 0.9, anchor: 'end', fill: SOFT })).join('');
  const every = Math.max(1, Math.ceil(o.x.length / (o.maxXLabels ?? 8)));
  g += o.x.map((x, i) => (i % every === 0 || i === o.x.length - 1 ? text(X(i), Tp + ph + f * 1.6, x, { size: f * 0.9, anchor: 'middle', fill: SOFT }) : '')).join('');
  // end labels, nudged apart so they never overlap
  const ends = o.series.map((s, i) => ({ i, y: Y(s.values[s.values.length - 1]), s })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < f * 1.25) ends[k].y = ends[k - 1].y + f * 1.25;
  o.series.forEach((s, i) => {
    const c = seriesColor(i, n, s), pts = s.values.map((v, j) => `${r2(X(j))},${r2(Y(v))}`).join(' ');
    g += `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${r2(f * 0.3)}" stroke-linejoin="round" stroke-linecap="round"${s.dashed ? ` stroke-dasharray="${f * 0.6} ${f * 0.45}"` : ''}/>`;
    const lx = X(s.values.length - 1), ly = Y(s.values[s.values.length - 1]);
    g += `<circle cx="${r2(lx)}" cy="${r2(ly)}" r="${r2(f * 0.42)}" fill="var(--g-bg, #fff)" stroke="${c}" stroke-width="${r2(f * 0.26)}"/>`;
    if (R > f * 3) { const e = ends.find((q) => q.i === i); g += key(lx + f * 1.1, e.y + f * 0.3, c, f) + text(lx + f * 2.1, e.y + f * 0.32, `${s.name ? s.name + ' ' : ''}${fmt(s.values[s.values.length - 1], y)}`, { size: f, weight: 700 }); }
  });
  return frame(o, w, h, g, `Line chart${o.title ? ' of ' + o.title : ''}. ` + o.series.map((s) => `${s.name ?? 'Series'}: ${o.x.map((x, j) => `${x} ${fmt(s.values[j], y)}`).join(', ')}`).join('. ') + '.');
}

// ---------- column: one series (values) or grouped (series), value labels on top ----------
export function column(o) {
  const f = o.font ?? 8.4, w = o.width ?? 500, h = o.height ?? 190;
  const series = o.series ?? [{ name: o.name, values: o.values, accent: o.accent }], n = series.length, y = o.y ?? {};
  const all = series.flatMap((s) => s.values), tk = ticks(Math.min(0, y.min ?? 0), y.max ?? Math.max(...all), y.ticks ?? 4), lo = tk[0], hi = tk[tk.length - 1];
  const L = o.axis === false ? f : f * 4.2, Tp = f * 2.2, B = f * 2.6 + (n > 1 ? f * 1.8 : 0), pw = w - L - f, ph = h - Tp - B;
  const Y = (v) => Tp + ph - ((v - lo) / (hi - lo)) * ph, gw = pw / o.x.length, bw = Math.min(f * 5, (gw * 0.72) / n);
  let g = o.axis === false ? `<line x1="${L}" x2="${r2(L + pw)}" y1="${r2(Y(lo))}" y2="${r2(Y(lo))}" stroke="${GRID}" stroke-width="1.2"/>` :
    tk.map((t) => `<line x1="${L}" x2="${r2(L + pw)}" y1="${r2(Y(t))}" y2="${r2(Y(t))}" stroke="${GRID}" stroke-width="${t === lo ? 1.2 : 0.6}"/>` + text(L - f * 0.6, Y(t) + f * 0.34, fmt(t, y), { size: f * 0.9, anchor: 'end', fill: SOFT })).join('');
  o.x.forEach((x, i) => {
    const cx = L + gw * (i + 0.5);
    series.forEach((s, k) => {
      const v = s.values[i], bx = cx - (n * bw) / 2 + k * bw, c = seriesColor(n > 1 ? k : i, n > 1 ? n : (o.colorBy === 'bar' ? o.x.length : 1), n > 1 ? s : (o.colors?.[i] ? { accent: o.colors[i] } : s));
      const top = Y(Math.max(v, lo)), base = Y(lo);
      g += `<rect x="${r2(bx + bw * 0.06)}" y="${r2(top)}" width="${r2(bw * 0.88)}" height="${r2(Math.max(0, base - top))}" rx="${r2(Math.min(f * 0.35, bw * 0.2))}" fill="${c}"/>`;
      if (o.valueLabels !== false) g += text(bx + bw / 2, top - f * 0.5, fmt(v, y), { size: f * (n > 2 ? 0.8 : 0.95), anchor: 'middle', weight: 700 });
    });
    g += text(cx, Tp + ph + f * 1.6, x, { size: f * 0.9, anchor: 'middle', fill: SOFT });
  });
  if (n > 1) { let kx = L; series.forEach((s, k) => { const c = seriesColor(k, n, s); g += key(kx, h - f * 0.4, c, f) + text(kx + f, h - f * 0.4, s.name ?? '', { size: f * 0.9 }); kx += f * 1.6 + String(s.name ?? '').length * f * 0.55; }); }
  return frame(o, w, h, g, `Column chart${o.title ? ' of ' + o.title : ''}. ` + series.map((s) => `${s.name ? s.name + ': ' : ''}${o.x.map((x, j) => `${x} ${fmt(s.values[j], y)}`).join(', ')}`).join('. ') + '.');
}

// ---------- stacked: horizontal 100% (or absolute) bars with parts ----------
export function stacked(o) {
  const f = o.font ?? 8.4, w = o.width ?? 500, rowH = f * 2.4, gap = f * 0.9, labW = o.labelWidth ?? f * 9;
  const parts = o.parts.map((p) => (typeof p === 'string' ? { label: p } : p)), np = parts.length;
  const top = f * 2.4, h = o.height ?? top + o.rows.length * (rowH + gap), pw = w - labW;
  let g = '', kx = labW;
  parts.forEach((p, k) => { const c = seriesColor(k, np, p); g += key(kx, f * 1, c, f) + text(kx + f, f * 1, p.label, { size: f * 0.9 }); kx += f * 1.8 + String(p.label).length * f * 0.55; });
  o.rows.forEach((r, i) => {
    const y = top + i * (rowH + gap), sum = o.max ?? (o.percent === false ? Math.max(...o.rows.map((q) => q.values.reduce((a, b) => a + b, 0))) : r.values.reduce((a, b) => a + b, 0));
    g += text(0, y + rowH * 0.62, r.label, { size: f, weight: 600 });
    let x = labW;
    r.values.forEach((v, k) => {
      const ww = (v / sum) * pw, c = seriesColor(k, np, parts[k]);
      g += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(Math.max(0, ww - 1))}" height="${r2(rowH)}" fill="${c}"${k === 0 ? ` rx="${r2(f * 0.3)}"` : ''}/>`;
      const lab = o.percent === false ? fmt(v, o) : fmt((v / sum) * 100, { decimals: 0, unit: '%' });
      const light = ['#F2C230', '#C4D17F', '#F38CBA', '#9C90C5', '#EE9A2E', '#8DC63F', '#00AAD2', '#E86BA5', '#EE7A63'].includes(c.toUpperCase()) || hex(c).reduce((a, b) => a + b) > 420;
      if (ww > f * 3.2) g += text(x + f * 0.5, y + rowH * 0.64, lab, { size: f * 0.9, weight: 700, fill: light ? C.navy : '#FFFFFF' });
      x += ww;
    });
  });
  return frame(o, w, h, g, `Stacked bar chart${o.title ? ' of ' + o.title : ''}. ` + o.rows.map((r) => `${r.label}: ` + r.values.map((v, k) => `${parts[k].label} ${fmt(v, o)}`).join(', ')).join('. ') + '.');
}

// ---------- donut: parts, centre value, labels beside ----------
export function donut(o) {
  const f = o.font ?? 8.4, d = o.size ?? f * 15, w = o.width ?? d + f * 18, h = o.height ?? Math.max(d, o.parts.length * f * 2.1), cx = d / 2, cy = h / 2, R = d / 2, th = o.thickness ?? d * 0.17;
  const tot = o.parts.reduce((a, p) => a + p.value, 0), n = o.parts.length;
  let a0 = -Math.PI / 2, g = `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(R - th / 2)}" fill="none" stroke="${TRACK}" stroke-width="${r2(th)}"/>`;
  o.parts.forEach((p, i) => {
    const a1 = a0 + (p.value / tot) * Math.PI * 2, rr = R - th / 2, large = a1 - a0 > Math.PI ? 1 : 0, gap = n > 1 ? 0.012 : 0;
    const P = (a) => `${r2(cx + rr * Math.cos(a))} ${r2(cy + rr * Math.sin(a))}`;
    g += `<path d="M${P(a0 + gap)} A${r2(rr)} ${r2(rr)} 0 ${large} 1 ${P(a1 - gap)}" fill="none" stroke="${seriesColor(i, n, p)}" stroke-width="${r2(th)}"/>`;
    a0 = a1;
  });
  if (o.center) g += text(cx, cy + f * 0.5, o.center.value, { size: f * 2.6, weight: 800, anchor: 'middle' }) + (o.center.label ? text(cx, cy + f * 2, o.center.label, { size: f * 0.85, anchor: 'middle', fill: SOFT }) : '');
  const lx = d + f * 1.6, step = Math.min(f * 2.2, h / n), y0 = cy - (step * (n - 1)) / 2;
  o.parts.forEach((p, i) => { const y = y0 + i * step; g += key(lx, y + f * 0.32, seriesColor(i, n, p), f) + text(lx + f * 1.1, y + f * 0.35, `${p.label}`, { size: f }) + text(w, y + f * 0.35, p.display ?? fmt(o.percent === false ? p.value : (p.value / tot) * 100, { decimals: 0, unit: o.percent === false ? (o.unit ?? '') : '%' }), { size: f, weight: 700, anchor: 'end' }); });
  return frame(o, w, h, g, `Donut chart${o.title ? ' of ' + o.title : ''}. ` + o.parts.map((p) => `${p.label} ${fmt(p.value, o)}`).join(', ') + '.');
}

// ---------- waffle: 10 x 10 squares; value (percent) or parts ----------
export function waffle(o) {
  const f = o.font ?? 8.4, s = o.cell ?? f * 1.25, gp = s * 0.22, grid = 10 * s + 9 * gp;
  const parts = o.parts ?? [{ label: o.label ?? '', value: o.value, accent: o.accent ?? 'blue' }];
  const counts = parts.map((p) => Math.round(p.value)), n = parts.length;
  const w = o.width ?? grid + f * 16, h = o.height ?? grid;
  let g = '', k = 0;
  for (let i = 0; i < 100; i++) {
    let c = null; let acc = 0; for (let j = 0; j < n; j++) { acc += counts[j]; if (i < acc) { c = seriesColor(j, n, parts[j]); break; } }
    const col = i % 10, row = Math.floor(i / 10);
    g += `<rect x="${r2(col * (s + gp))}" y="${r2(row * (s + gp))}" width="${r2(s)}" height="${r2(s)}" rx="${r2(s * 0.18)}" fill="${c ?? TRACK}"/>`;
    k++;
  }
  const lx = grid + f * 1.6;
  if (n === 1) g += text(lx, h / 2, o.display ?? fmt(parts[0].value, { decimals: 0, unit: o.unit ?? '%' }), { size: f * 3.2, weight: 800 }) + text(lx, h / 2 + f * 1.8, parts[0].label, { size: f });
  else parts.forEach((p, j) => { const y = f * 1.2 + j * f * 2.2; g += key(lx, y, seriesColor(j, n, p), f) + text(lx + f * 1.1, y, `${p.label}  ${fmt(p.value, { decimals: 0, unit: '%' })}`, { size: f }); });
  return frame(o, w, h, g, `Waffle chart of 100 squares${o.title ? ', ' + o.title : ''}. ` + parts.map((p) => `${p.label} ${fmt(p.value, { unit: '%' })}`).join(', ') + '.');
}

// ---------- gauge: a half ring toward a maximum ----------
export function gauge(o) {
  const f = o.font ?? 8.4, d = o.size ?? f * 18, w = o.width ?? d, R = d / 2, th = d * 0.12, h = o.height ?? R + d * 0.06 + f * (o.label ? 3.4 : 1.8), cx = w / 2, cy = R;
  const lo = o.min ?? 0, hi = o.max ?? 100, u = Math.max(0, Math.min(1, (o.value - lo) / (hi - lo))), rr = R - th / 2, inner = rr - th / 2;
  const P = (a) => `${r2(cx + rr * Math.cos(a))} ${r2(cy + rr * Math.sin(a))}`, a = Math.PI + u * Math.PI, c = (o.accent && C[o.accent]) || spec(0.15);
  let g = `<path d="M${P(Math.PI)} A${r2(rr)} ${r2(rr)} 0 0 1 ${P(2 * Math.PI)}" fill="none" stroke="${TRACK}" stroke-width="${r2(th)}" stroke-linecap="round"/>`;
  if (u > 0) g += `<path d="M${P(Math.PI)} A${r2(rr)} ${r2(rr)} 0 0 1 ${P(a)}" fill="none" stroke="${c}" stroke-width="${r2(th)}" stroke-linecap="round"/>`;
  if (o.target != null && o.target < hi && o.target > lo) { const ta = Math.PI + ((o.target - lo) / (hi - lo)) * Math.PI; g += `<line x1="${r2(cx + (rr - th * 0.8) * Math.cos(ta))}" y1="${r2(cy + (rr - th * 0.8) * Math.sin(ta))}" x2="${r2(cx + (rr + th * 0.8) * Math.cos(ta))}" y2="${r2(cy + (rr + th * 0.8) * Math.sin(ta))}" stroke="${INK}" stroke-width="${r2(f * 0.22)}"/>`; }
  const val = o.display ?? fmt(o.value, o), vs = Math.min(f * 3.2, (1.5 * inner) / (Math.max(3, val.length) * 0.6));
  g += text(cx, cy - f * 0.15, val, { size: vs, weight: 800, anchor: 'middle' });
  const ends = { decimals: 0, unit: o.unit, prefix: o.prefix };
  g += text(cx - rr, cy + th / 2 + f * 1.2, fmt(lo, ends), { size: f * 0.85, anchor: 'middle', fill: SOFT }) + text(cx + rr, cy + th / 2 + f * 1.2, fmt(hi, ends), { size: f * 0.85, anchor: 'middle', fill: SOFT });
  if (o.label) g += text(cx, cy + th / 2 + f * 2.7, o.label, { size: f, anchor: 'middle', fill: SOFT });
  return frame(o, w, h, g, `Gauge${o.title ? ' of ' + o.title : ''}: ${val} of ${fmt(hi, o)}${o.target != null ? `, target ${fmt(o.target, o)}` : ''}.`);
}

// ---------- timeline: dated milestones on a rule, alternating above and below when crowded ----------
export function timeline(o) {
  const f = o.font ?? 8.4, w = o.width ?? 500, n = o.items.length, alt = o.alternate ?? n > 5, h = o.height ?? (alt ? f * 14 : f * 8.5);
  const L = f * 1.5, R = w - f * 1.5, y = alt ? h / 2 : f * 2.2, X = (i) => L + (n === 1 ? (R - L) / 2 : (i * (R - L)) / (n - 1));
  let g = `<line x1="${L}" x2="${R}" y1="${r2(y)}" y2="${r2(y)}" stroke="${GRID}" stroke-width="${r2(f * 0.22)}"/>`;
  const nowI = o.items.findIndex((it) => it.now);
  if (nowI >= 0) g += `<line x1="${L}" x2="${r2(X(nowI))}" y1="${r2(y)}" y2="${r2(y)}" stroke="${spec(0.15)}" stroke-width="${r2(f * 0.32)}"/>`;
  o.items.forEach((it, i) => {
    const x = X(i), c = seriesColor(i, n, it), up = alt && i % 2 === 1, anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    const tx = anchor === 'start' ? x - f * 0.5 : anchor === 'end' ? x + f * 0.5 : x;
    g += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(f * (it.now ? 0.85 : 0.6))}" fill="${it.now ? c : 'var(--g-bg, #fff)'}" stroke="${c}" stroke-width="${r2(f * 0.3)}"/>`;
    const y1 = up ? y - f * 4.2 : y + f * 2;
    g += text(tx, y1, it.when, { size: f * 0.8, anchor, mono: true, fill: SOFT, weight: 600 }) + text(tx, y1 + f * 1.3, it.title, { size: f, anchor, weight: 700 });
    if (it.text) g += text(tx, y1 + f * 2.5, it.text, { size: f * 0.85, anchor, fill: SOFT });
  });
  return frame(o, w, h, g, `Timeline${o.title ? ' of ' + o.title : ''}. ` + o.items.map((it) => `${it.when}: ${it.title}`).join('; ') + '.');
}

export const CHARTS = { line, column, stacked, donut, waffle, gauge, timeline };
