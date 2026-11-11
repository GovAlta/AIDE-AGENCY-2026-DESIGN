// Lucide icons (brand/icons/lucide, the same set and version MVAI uses: lucide-static 1.58.0, ISC licence) as inline SVG.
//   icon('calendar-check')                       -> <svg class="ico">…</svg>, 1em square, stroke = currentColor
//   icon('route', { size: 18, accent: 'blue' })  -> size in template units (--u), colour from the accent's text-safe token
// Rules (guides/ICONS.md): one stroke style (2 px at 24), never the only carrier of meaning, one icon per item.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../brand/icons/lucide');
const cache = new Map();

export function iconInner(name) {
  if (!cache.has(name)) {
    const f = path.join(DIR, `${name}.svg`);
    if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(f)) throw new Error(`unknown icon "${name}" (see brand/icons/lucide; names are Lucide's, e.g. calendar-check)`);
    const svg = fs.readFileSync(f, 'utf8');
    cache.set(name, svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>')).replace(/\s+/g, ' ').trim());
  }
  return cache.get(name);
}

export const iconExists = (name) => { try { iconInner(name); return true; } catch { return false; } };

export function icon(name, o = {}) {
  if (!name) return '';
  const size = o.size ? `width:calc(${o.size} * var(--u));height:calc(${o.size} * var(--u));` : '';
  const color = o.accent ? `color:var(--ct, var(--text-${o.accent}));` : '';
  return `<svg class="ico${o.cls ? ' ' + o.cls : ''}"${o.accent ? ` data-accent="${o.accent}"` : ''} style="${size}${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${o.stroke ?? 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconInner(name)}</svg>`;
}
