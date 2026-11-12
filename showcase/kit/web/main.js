// Showcase film engine. Every frame is a pure function of its number: frame(n) -> stateAt(n / FPS) -> drawn.
//
// The project supplies /timeline.js:
//   export const DUR = <seconds>, FPS = 60;
//   export async function createTimeline(ctx) { ...; return { stateAt(t), CAPS? }; }
//   ctx = { config, timing (narration/timing.json or {}), stage (the optional world stage, or null), helpers }
// and optionally /stage.js (a world layer under the plates, e.g. the map module):
//   export async function createStage(el, ctx) { return { apply(state.world) -> Promise, project(lonLat) -> {x,y}|null, takeErrors() -> n } }
//
// Contract used by every renderer (still-at, dryrun, cloud job):
//   window.filmReady      true once everything for frame 0 can load
//   window.filmInitErrors number of load errors during start-up; a renderer must refuse a page where this is > 0
//   window.film.frame(n)  draws frame n; rejects if any image, video frame, tile or data file failed while drawing it
import * as helpers from '/kit/helpers.js';
import { createUI } from '/kit/ui.js';
import { createPlates } from '/kit/plates.js';
import { drawBackground, loadGrounds } from '/kit/background.js';

const config = await fetch('/film.config.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}));
const timing = await fetch('/narration/timing.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}));
const TLmod = await import('/timeline.js');
await loadGrounds();
// theme: 'light' (Agency default: board ground, navy ink) or 'dark' (night ground); a state can override it for one scene
const THEME = config.theme === 'dark' ? 'dark' : 'light';
const stageEl = document.getElementById('stage');
const setTheme = th => { const v = th === 'dark' ? 'dark' : 'light'; if (stageEl.dataset.theme !== v) { stageEl.dataset.theme = v; stageEl.classList.toggle('theme-dark', v === 'dark'); stageEl.classList.toggle('theme-light', v === 'light'); } return v; };
setTheme(THEME);
let stage = null;
if (config.stage) { const mod = await import(config.stage); stage = await mod.createStage(document.getElementById('world'), { config, helpers }); }

const UI = createUI(document.getElementById('ui'), document.getElementById('labels'));
const plates = createPlates(document.getElementById('plates'));
for (const w of [400, 500, 600, 700, 800]) await document.fonts.load(`${w} 20px Inter`);
for (const w of [500, 600]) await document.fonts.load(`${w} 20px "Geist Mono"`);
await document.fonts.ready;

const TL = await TLmod.createTimeline({ config, timing, stage, helpers });
const DUR = TLmod.DUR ?? config.dur, FPS = TLmod.FPS ?? config.fps ?? 60;

async function apply(s) {
  const theme = setTheme(s.theme ?? THEME);
  drawBackground(document.getElementById('bg'), s.bg || {}, theme);
  if (stage) await stage.apply(s.world || {}, s);
  await plates.apply(s.plates || []);
  UI.render(s.ui || {}, { project: stage ? ll => stage.project(ll) : () => null, plates, theme });
  await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; })));
}
const takeErrors = () => (stage?.takeErrors ? stage.takeErrors() : 0) + plates.takeErrors() + UI.takeErrors();
// a load error while the page started must not be forgotten: renderers refuse this page and open a new one
await apply(TL.stateAt(0));
window.filmInitErrors = takeErrors();
window.film = { TL, DUR, FPS, config, theme: THEME, stage, plates, UI, apply, seek: t => apply(TL.stateAt(t)),
  // after the state is applied, let the compositor produce two frames before the capture: a screenshot taken at once can catch a
  // backdrop-filter (the spatial stage's glass) that has not been re-drawn yet, which showed as one-frame flashes of a window's fill on
  // the render farm (film #1; never on a single local browser). The timeout covers a page whose animation frames are throttled.
  frame: async n => { await apply(TL.stateAt(n / FPS)); await new Promise(r => { let done = false; const fin = () => { if (!done) { done = true; r(); } }; requestAnimationFrame(() => requestAnimationFrame(fin)); setTimeout(fin, 120); }); const e = takeErrors(); if (e) throw new Error(`${e} load error(s) on frame ${n}`); return true; } };
window.filmReady = true;
