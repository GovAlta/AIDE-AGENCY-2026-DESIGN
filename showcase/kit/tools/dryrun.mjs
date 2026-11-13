// Evaluates stateAt for every frame without drawing: catches script errors, bad numbers and missing captions before any render.
// Then draws each moment a new text block is fully shown and fails on any text outside the 48 px safe area or clipped (UI.textCheck),
// and checks the title and end cards against their trace art (UI.cardCheck). A world stage that draws its own text takes part when it
// offers textKeys(world) (one key per text block fully shown) and textCheck(m) (the same glyph measure as UI.textCheck).
//   node tools/dryrun.mjs --project <film dir>
import { openFilm } from './lib/film-page.mjs';
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
console.log(JSON.stringify({ ...info, ...r }, null, 1));
await close(); process.exit(r.errors.length || r.nonFinite.length ? 1 : 0);
