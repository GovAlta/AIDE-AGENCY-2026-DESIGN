// Evaluates stateAt for every frame without drawing: catches script errors, bad numbers and missing captions before any render.
// Then draws each moment a new text block is fully shown and fails on any text outside the 48 px safe area or clipped (UI.textCheck),
// and checks the title and end cards against their trace art (UI.cardCheck). A world stage that draws its own text takes part when it
// offers textKeys(world) (one key per text block fully shown) and textCheck(m) (the same glyph measure as UI.textCheck).
// It fails on any slow scale during a hold: a slow push-in, zoom creep or Ken Burns (no override).
// Last, it warns (does not fail) where a white screen sits on a near-white ground: its edge cannot be seen (tools/lib/ground-check.mjs).
//   node tools/dryrun.mjs --project <film dir> [--no-ground]
import { openFilm } from './lib/film-page.mjs';
import { groundCheck } from './lib/ground-check.mjs';
const { page, close, info } = await openFilm();
const r = await page.evaluate(() => { const { TL, DUR, FPS } = window.film, errs = [], bad = []; const t0 = performance.now(); const n = Math.round(DUR * FPS);
  const finite = (o, p = '') => { if (o === null || o === undefined) return; if (typeof o === 'number') { if (!Number.isFinite(o)) bad.push(p); return; } if (typeof o === 'object') for (const [k, v] of Object.entries(o)) if (typeof v !== 'function') finite(v, p + '.' + k); };
  const ph = new Set();
  for (let f = 0; f < n; f++) { try { const s = TL.stateAt(f / FPS); if (f % 30 === 0) { finite(s, `t=${(f / FPS).toFixed(2)}`);
      // starter placeholders must never reach a render: [[ … ]], EXAMPLE:, "replace before review"
      const m = JSON.stringify(s).match(/\[\[[^\]]*\]\]|EXAMPLE[: ]|replace before review/i); if (m && !ph.has(m[0])) { ph.add(m[0]); errs.push(`${(f / FPS).toFixed(2)} s: placeholder text on screen: ${m[0]}`); } } } catch (e) { if (errs.length < 8) errs.push(`${(f / FPS).toFixed(2)} s: ${e.message}`); } }
  return { frames: n, errors: errs, cards: (() => { const at = {}; for (let f = 0; f < n; f += 15) { const c = TL.stateAt(f / FPS).ui?.card; if (c && (c.a ?? 1) > 0.99 && !(c.kind in at)) at[c.kind] = f / FPS; } return at; })(), nonFinite: [...new Set(bad)].slice(0, 12), msPerState: +((performance.now() - t0) / n).toFixed(3) }; });
// title, end and credits cards: draw each once, fully in, and fail if any text comes within 40 px of the trace art
r.cardText = [];
for (const [kind, t] of Object.entries(r.cards)) { await page.evaluate(t => window.film.seek(t), t);
  const near = await page.evaluate(() => window.film.UI.cardCheck(40));
  for (const o of near) r.errors.push(`${t.toFixed(2)} s: ${kind} card text within 40 px of the traces: "${o.text}"`);
  r.cardText.push(`${kind} at ${t.toFixed(2)} s: ${near.length ? near.length + ' too close' : 'clear'}`); }
delete r.cards;
// no slow scale during a hold (owner, 2026-11-13: "a very minor scaling effect ... 100% to like 103% ... causes everything to jitter ...
// very disorienting"). Every visible element's scale over time: the stage's scales(world) if it offers one, else the width of its
// screenBoxes; plates (cam.s x scale); scaled callouts and panels. A run of frames in which an element keeps changing size for more than
// 0.5 s by less than 15 % in all (a creep), or for more than 1.5 s at all (a slow push or Ken Burns), fails. Fast entrances and exits,
// cuts and quick moves pass; a fading element (opacity under 0.99) is not measured. There is no override (owner, 2026-11-13: "The slow
// push always looks bad, so let's disable that fully").
r.slowScale = await page.evaluate(() => { const { TL, DUR, FPS, stage: st } = window.film, n = Math.round(DUR * FPS), series = new Map();
  const add = (id, s, a, f) => { if ((a ?? 1) < 0.99 || !(s > 0)) return; if (!series.has(id)) series.set(id, []); series.get(id).push([f, s]); };
  for (let f = 0; f < n; f++) { const S = TL.stateAt(f / FPS), w = S.world || {};
    if (st?.scales) for (const o of st.scales(w)) add('w:' + o.id, o.s, o.a, f);
    else if (st?.screenBoxes) for (const b of st.screenBoxes(w.space ?? w.media ?? w)) add('w:' + b.id, b.x1 - b.x0, b.a, f);
    (S.plates || []).forEach((p, i) => add('plate:' + (p.id ?? i), (p.cam?.s ?? 1) * (p.scale ?? 1), p.a, f));
    for (const c of S.ui?.callouts || []) if (c.scale !== undefined) add('callout:' + (c.kicker || c.big || ''), c.scale, c.a, f);
    for (const p of S.ui?.panels || []) if (p.scale !== undefined) add('panel:' + (p.id || p.title || ''), p.scale, p.a, f); }
  const creeps = [];
  for (const [id, v] of series) { let run = null;
    // a run spans its motion plus the 15-frame comparison window at each end: 0.5 s of motion measures 1.0 s
    const close = () => { const d = run ? (run.f1 - run.f0) / FPS : 0; if (run && ((d > 1.0 && run.hi / run.lo - 1 < 0.15) || d > 2.0)) creeps.push({ id, from: +(run.f0 / FPS).toFixed(2), to: +(run.f1 / FPS).toFixed(2), change: +((run.hi / run.lo - 1) * 100).toFixed(1) }); run = null; };
    // moving at frame i: its size differs from 15 frames (0.25 s) earlier by more than 0.01 % (catches a 3 % push over many seconds)
    for (let i = 15; i < v.length; i++) { const [f, s] = v[i], [pf, ps] = v[i - 15];
      if (f - pf !== 15) { close(); continue; }
      if (Math.abs(s - ps) / ps > 1e-4) { if (!run || f - run.last > 3) { close(); run = { f0: pf, f1: f, last: f, lo: Math.min(s, ps), hi: Math.max(s, ps) }; } else { run.f1 = f; run.last = f; run.lo = Math.min(run.lo, s); run.hi = Math.max(run.hi, s); } }
      else if (run && f - run.last > 3) close(); }
    close(); }
  return { creeps }; });
for (const c of r.slowScale.creeps.slice(0, 12)) r.errors.push(`${c.from}-${c.to} s: ${c.id} scales slowly (${c.change} %): slow push-ins, zoom creep and Ken Burns are not available; hold the screen still`);
r.slowScale = `${r.slowScale.creeps.length} slow scale run(s)`;
// every on-screen text block (headlines, callouts, the statement or pitch line, captions, panels, cards) at the moment it is fully shown:
// its glyphs must sit inside the safe area and inside any box that clips them (film #12: a pitch line ran off the right edge)
const shown = await page.evaluate(() => { const { TL, DUR, FPS } = window.film, n = Math.round(DUR * FPS), times = [], seen = new Set();
  const full = o => o && (o.a ?? 1) > 0.99 && (!o.words || o.words.every(w => w.w === '\n' || (w.a ?? 1) > 0.99));
  const st = window.film.stage;   // a stage that draws its own text (cards, type) lists it with textKeys(world) and measures it with textCheck(m)
  for (let f = 0; f < n; f += 6) { const s = TL.stateAt(f / FPS), u = s.ui || {}; const keys = [];
    if (st?.textKeys) for (const k of st.textKeys(s.world || {})) keys.push('w:' + k);
    for (const c of u.callouts || []) if (full(c)) keys.push('c:' + JSON.stringify([c.kicker, c.big, c.sub, c.note, (c.words || []).map(w => w.w)]));
    if (full(u.statement)) keys.push('s:' + u.statement.words.map(w => w.w).join(' '));
    if (u.caption && (u.caption.a ?? 1) > 0.99) keys.push('t:' + u.caption.text);
    if (u.card && (u.card.a ?? 1) > 0.99) keys.push('k:' + JSON.stringify([u.card.kind, u.card.kicker, u.card.title, u.card.lines]));
    for (const p of u.panels || []) if ((p.a ?? 1) > 0.99) keys.push('p:' + String(p.html || p.id || '').slice(0, 200));
    const fresh = keys.filter(k => !seen.has(k)); if (fresh.length) { fresh.forEach(k => seen.add(k)); times.push(f / FPS); } }
  return times; });
const textIssues = new Map();
for (const t of shown) { await page.evaluate(t => window.film.seek(t), t);
  for (const o of await page.evaluate(() => [...window.film.UI.textCheck(48), ...(window.film.stage?.textCheck ? window.film.stage.textCheck(48) : [])])) { const k = o.where + '|' + o.text; if (!textIssues.has(k)) textIssues.set(k, { t, ...o }); } }
for (const o of textIssues.values()) r.errors.push(`${o.t.toFixed(2)} s: ${o.where} text ${o.why} (x ${o.rect.x}..${o.rect.x + o.rect.w}, y ${o.rect.y}..${o.rect.y + o.rect.h}): "${o.text}"`);
r.textCheck = `${shown.length} moments checked, ${textIssues.size} text block(s) outside the safe area or clipped`;
// a white screen on a white ground (owner, film #15): a warning every 2 s of film, once per screen; --no-ground skips it
r.warnings = [];
if (!process.argv.includes('--no-ground')) { const g = await groundCheck(page);
  for (const o of g.flags) r.warnings.push(`${o.t} s: ${o.id} is a white screen on a near-white ground (edge ${o.inside}, ground ${o.ground}, contrast ${o.contrast}:1): give it a dark frame, a soft shadow and a deeper gradient or navy behind it`);
  r.groundCheck = `${g.screens} screen views checked, ${g.flags.length} white on white`; }
console.log(JSON.stringify({ ...info, ...r }, null, 1));
await close(); process.exit(r.errors.length || r.nonFinite.length ? 1 : 0);
