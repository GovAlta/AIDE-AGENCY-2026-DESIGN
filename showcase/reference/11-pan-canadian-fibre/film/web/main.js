import { createMap, GROUPS } from '/map.js';
import { createUI } from '/ui.js';
import { createTimeline, DUR, FPS } from '/timeline.js';

// deterministic star field behind the globe
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const STARS = (() => { const r = mulberry(2026), s = []; for (let i = 0; i < 1400; i++) s.push({ x: r() * 2400 - 240, y: r() * 1400 - 160, m: Math.pow(r(), 3.2), d: 0.3 + r() * 0.7, c: r() }); return s; })();
function drawStars(dx = 0, dy = 0, alpha = 1) {
  const cv = document.getElementById('stars'), g = cv.getContext('2d'); g.clearRect(0, 0, 1920, 1080);
  const grd = g.createRadialGradient(960, 620, 100, 960, 540, 1300); grd.addColorStop(0, '#04162a'); grd.addColorStop(1, '#01050b'); g.fillStyle = grd; g.fillRect(0, 0, 1920, 1080);
  for (const s of STARS) { const x = ((s.x + dx * s.d) % 2400 + 2400) % 2400 - 240, y = ((s.y + dy * s.d) % 1400 + 1400) % 1400 - 160; const r = 0.5 + s.m * 1.6;
    g.globalAlpha = alpha * (0.25 + 0.75 * s.m); g.fillStyle = s.c < 0.15 ? '#bcd7ff' : s.c > 0.9 ? '#ffe9c9' : '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
  g.globalAlpha = 1;
}

const M = await createMap('map');
const manifest = await (await fetch('/data/layers/manifest.json')).json();
const timing = await (await fetch('/narration/timing.json')).json();
const UI = createUI(document.getElementById('ui'), document.getElementById('labels'), { manifest, routes: M.routesData });
for (const w of [400, 500, 600, 700, 800]) await document.fonts.load(`${w} 20px Inter`);
for (const w of [500, 600]) await document.fonts.load(`${w} 20px "Geist Mono"`);
await document.fonts.ready;
const TL = createTimeline(M, timing);

async function apply(s) {
  M.cam(s.cam, s.pad || 0); M.grade(s.grade || {}); M.terrain(s.terrain || 0);
  for (const id of Object.keys(GROUPS)) M.group(id, (s.groups || {})[id] || 0);
  for (const [g, p] of Object.entries(s.reveal || {})) M.reveal(g, p);
  for (const id of Object.keys(M.routeParts)) { const r = (s.routes || {})[id]; M.route(id, r ? (r.p ?? 1) : 0, r ? (r.a ?? 1) : 0, r ? r.head : 0); }
  for (const id of Object.keys(M.plans)) if (M.plans[id].scenario) { const q = (s.search || {})[id]; M.search(id, q ? q.p : 0, q ? (q.a ?? 1) : 0); }
  M.waypoints(s.waypoints || []); M.pulses(s.pulses || []);
  drawStars(-s.cam.lng * 6 - (s.cam.bearing || 0) * 4, s.cam.lat * 3 + (s.cam.pitch || 0) * 2);
  await M.settle();
  UI.render(s.ui || {}, M);
  await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; })));
}
// a data file or tile that failed while the page started must not be forgotten: the renderer refuses this page and opens a new one
window.filmInitErrors = M.takeErrors();
window.film = { M, GROUPS, UI, manifest, TL, DUR, FPS, apply, seek: t => apply(TL.stateAt(t)),
  // one frame by number; rejects if any tile or data file failed to load while drawing it
  frame: async n => { await apply(TL.stateAt(n / FPS)); const e = M.takeErrors(); if (e) throw new Error(`${e} load error(s) on frame ${n}`); return true; } };
window.filmReady = true;
