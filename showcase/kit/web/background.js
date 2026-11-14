// Deterministic backgrounds on the #bg canvas: the Agency 2026 grounds (brand/tokens/tokens.json "grounds").
//   state.bg = { kind: 'board' | 'paper' | 'night' | 'navy' | 'spectrum' | 'stars' | 'none', glow: [x, y], lift: 0..1, dx, dy, alpha }
// - board (white) is the Agency default for title, chapter and end cards and for dark screens. Never put a white app screen on it
//   (owner, film #15: "white on a white background"): use navy, a dark frame and a soft shadow; the dry run warns.
// - paper is the quiet alternate; night and navy are the dark grounds (dark films, chapter cards, a dark map scene).
// - spectrum (blue) is for the one line people should remember: use it once per film.
// - stars is night plus a star field. Use it only for a globe or space shot, never behind an app screenshot.
// - none leaves the canvas empty (a world stage or a full-frame plate covers everything).
// A missing kind takes the theme's ground (light -> board, dark -> night). Circuit traces are not drawn here: they belong on
// title, chapter and end cards only (BRAND.md), which ui.js draws.
import { mulberry } from '/kit/helpers.js';
const STARS = (() => { const r = mulberry(2026), s = []; for (let i = 0; i < 1400; i++) s.push({ x: r() * 2400 - 240, y: r() * 1400 - 160, m: Math.pow(r(), 3.2), d: 0.3 + r() * 0.7, c: r() }); return s; })();
const FALLBACK = { board: { bg: '#FFFFFF', field: '#F2F5F9' }, paper: { bg: '#F6F7FA', field: '#FFFFFF' }, night: { bg: '#041B30' }, navy: { bg: '#022C4C' }, spectrum: { bg: '#0177CD' } };
let GROUNDS = FALLBACK;
export async function loadGrounds() {
  try { const t = await fetch('/brand/tokens/tokens.json').then(r => r.json()); if (t.grounds?.board) GROUNDS = t.grounds; } catch { /* keep the copies above */ }
  return GROUNDS;
}
let last = '';
export function drawBackground(cv, bg, theme = 'light') {
  const kind = bg.kind || (theme === 'dark' ? 'night' : 'board');
  const key = JSON.stringify([bg, kind]); if (key === last) return; last = key;
  const g = cv.getContext('2d'); g.clearRect(0, 0, 1920, 1080);
  if (kind === 'none') return;
  const [gx, gy] = bg.glow || [960, 600], lift = bg.lift ?? 1;
  if (kind === 'board' || kind === 'paper') {
    const G = GROUNDS[kind]; g.fillStyle = G.bg; g.fillRect(0, 0, 1920, 1080);
    // a barely visible field-colour pool where the action is, so a white board does not read as an empty page
    const grd = g.createRadialGradient(gx, gy, 60, gx, gy, 1250); grd.addColorStop(0, G.bg); grd.addColorStop(1, kind === 'board' ? (GROUNDS.board.field || '#F2F5F9') : '#ECEFF4');
    g.globalAlpha = 0.9 * lift; g.fillStyle = grd; g.fillRect(0, 0, 1920, 1080); g.globalAlpha = 1; return;
  }
  if (kind === 'spectrum') {
    const grd = g.createLinearGradient(0, 0, 1920, 1080); grd.addColorStop(0, GROUNDS.spectrum.bg); grd.addColorStop(1, '#015FA8');
    g.fillStyle = grd; g.fillRect(0, 0, 1920, 1080); return;
  }
  // night, navy, stars: the dark ground with a soft lift where the action is
  const base = kind === 'navy' ? GROUNDS.navy.bg : GROUNDS.night.bg;
  const grd = g.createRadialGradient(gx, gy, 80, 960, 540, 1300); grd.addColorStop(0, kind === 'navy' ? '#0E3B63' : kind === 'stars' ? '#04162a' : '#0A2A47'); grd.addColorStop(1, kind === 'stars' ? '#01050b' : base);
  g.fillStyle = base; g.fillRect(0, 0, 1920, 1080); g.globalAlpha = lift; g.fillStyle = grd; g.fillRect(0, 0, 1920, 1080); g.globalAlpha = 1;
  if (kind !== 'stars') return;
  const dx = bg.dx || 0, dy = bg.dy || 0, alpha = bg.alpha ?? 1;
  for (const s of STARS) { const x = ((s.x + dx * s.d) % 2400 + 2400) % 2400 - 240, y = ((s.y + dy * s.d) % 1400 + 1400) % 1400 - 160;
    g.globalAlpha = alpha * (0.25 + 0.75 * s.m); g.fillStyle = s.c < 0.15 ? '#bcd7ff' : s.c > 0.9 ? '#ffe9c9' : '#ffffff'; g.beginPath(); g.arc(x, y, 0.5 + s.m * 1.6, 0, 6.283); g.fill(); }
  g.globalAlpha = 1;
}
