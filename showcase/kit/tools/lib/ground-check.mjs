// White screen on a white ground (owner, film #15, 2026-11-13: a white screen never sits on a white ground; give it a dark frame, a soft
// shadow and a deeper gradient or navy behind it). Every `step` seconds: draw the frame, take each fully shown screen (a plate, or a
// stage's screenBoxes), and compare a band inside its edge (4-60 px) with the ground around it (60-160 px out, past a soft shadow). Both
// near-white (luminance over `white`) and a contrast ratio under `ratio` is a white screen on a white ground: a warning, not a fault (a
// tilted plate's box includes some ground, and the bands miss a screen that fills the frame).
import sharp from 'sharp';
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
// Text against the card behind it (owner, film #32: "white text on a white background for the login"). In the page: every text node
// inside a card (a stage window .sp-win, a glass panel, a plate callout) that is fully shown; its computed colour against the nearest
// background behind it inside that card (a colour, or the first stop of a gradient); WCAG contrast under `min` is a fault.
const TEXT_CONTRAST = (min) => { const out = [], lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const rgb = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,\/]+/).map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; };
  const lum = c => 0.2126 * lin(c[0] / 255) + 0.7152 * lin(c[1] / 255) + 0.0722 * lin(c[2] / 255);
  for (const card of document.querySelectorAll('#world .sp-win, #panels .gpanel, #callouts .callout.panel')) {
    let ra = 1; for (let e = card; e && e !== document.body; e = e.parentElement) ra *= +getComputedStyle(e).opacity;
    const ccs = getComputedStyle(card); if (ra < 0.98 || ccs.display === 'none' || ccs.visibility === 'hidden') continue;
    const w = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { const txt = n.textContent.trim(); if (txt.length < 2) continue; const el = n.parentElement, cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      let a = 1, bg = null; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); a *= +s.opacity;
        if (!bg) { const c = rgb(s.backgroundColor); if (c && c[3] > 0.5) bg = c; else if (s.backgroundImage && s.backgroundImage !== 'none') { const g = rgb(s.backgroundImage); if (g && g[3] > 0.5) bg = g; } }
        if (e === card) break; }
      const fg = rgb(cs.color), r = el.getBoundingClientRect(); if (a < 0.98 || !bg || !fg || fg[3] < 0.5 || r.width < 2 || r.height < 2) continue;
      const l1 = lum(fg), l2 = lum(bg), c = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (c < min) out.push({ card: card.id || String(card.className).split(' ')[0], text: txt.slice(0, 48), contrast: +c.toFixed(2), fg: cs.color, bg: `rgb(${bg.slice(0, 3).join(', ')})` }); } }
  return out; };
// Text laid out wrongly inside a card (film #32, French edition: a title that wrapped pushed the next line under the button row).
// In the page, for every fully shown card (a stage window .sp-win, a glass panel): every element that holds text of its own, placed
// in the card's own layout (offsets, so a card turned in 3D is measured flat). Three faults: two such elements overlap (neither
// inside the other); an element runs outside its card; an element does not fit its own box (an ellipsis, or a one-line field).
const CARD_LAYOUT = () => { const out = [];
  for (const card of document.querySelectorAll('#world .sp-win, #panels .gpanel')) {
    let ra = 1; for (let e = card; e && e !== document.body; e = e.parentElement) ra *= +getComputedStyle(e).opacity;
    const ccs = getComputedStyle(card); if (ra < 0.98 || ccs.display === 'none' || ccs.visibility === 'hidden') continue;
    const id = card.id || String(card.className).split(' ')[0], W = card.offsetWidth, H = card.offsetHeight, items = [];
    const box = el => { let x = 0, y = 0, n = el; while (n && n !== card) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return n === card ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : null; };
    for (const el of card.querySelectorAll('*')) { if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      let a = 1; for (let e = el; e && e !== card; e = e.parentElement) a *= +getComputedStyle(e).opacity; if (a < 0.98) continue;
      const b = box(el), text = el.textContent.trim().slice(0, 40); if (!b || b.w < 2 || b.h < 2) continue; items.push({ el, b, text });
      const host = el.closest('.typed') || el;   // typed text is measured on its one wrapping element
      if (host.clientWidth > 0 && host.scrollWidth > host.clientWidth + 1 && (cs.whiteSpace === 'nowrap' || cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis' || host !== el)) out.push({ card: id, what: `"${text}" does not fit its box (${host.scrollWidth} px of text in ${host.clientWidth} px)` });
      if (b.x < -1 || b.y < -1 || b.x + b.w > W + 1 || b.y + b.h > H + 1) out.push({ card: id, what: `"${text}" runs outside its card` }); }
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const p = items[i], q = items[j]; if (p.el.contains(q.el) || q.el.contains(p.el)) continue;
      const ox = Math.min(p.b.x + p.b.w, q.b.x + q.b.w) - Math.max(p.b.x, q.b.x), oy = Math.min(p.b.y + p.b.h, q.b.y + q.b.h) - Math.max(p.b.y, q.b.y);
      if (ox > 3 && oy > 3) out.push({ card: id, what: `"${p.text}" overlaps "${q.text}" (${Math.round(ox)} x ${Math.round(oy)} px)` }); } }
  return out; };
// Anything over or under the caption bar (owner, film #32): what the interface reports (UI.captionCheck) plus any stage window whose box crosses the bar
const CAPTION_OVERLAP = (t) => { const UI = window.film.UI, R = UI.captionRect ? UI.captionRect() : null; if (!R) return []; const out = UI.captionCheck().map(o => ({ what: o.what }));
  const st = window.film.stage, w = window.film.TL.stateAt(t).world || {};
  if (st?.screenBoxes) for (const b of st.screenBoxes(w.space ?? w.media ?? w)) if ((b.a ?? 1) > 0.5 && b.x0 < R.x + R.w && b.x1 > R.x && b.y0 < R.y + R.h && b.y1 > R.y) out.push({ what: 'window ' + b.id });
  return out; };
export async function groundCheck(page, { step = 2, white = 0.75, ratio = 1.3, inner = [4, 60], outer = [60, 160], minText = 3 } = {}) {
  const { DUR } = await page.evaluate(() => ({ DUR: window.film.DUR }));
  const flags = new Map(), text = new Map(), caps = new Map(), layout = new Map(); let screens = 0;
  for (let t = step / 2; t < DUR; t += step) {
    await page.evaluate(t => window.film.seek(t), t);
    for (const o of await page.evaluate(TEXT_CONTRAST, minText)) { const k = o.card + '|' + o.text + '|' + o.fg + '|' + o.bg; if (!text.has(k)) text.set(k, { t: +t.toFixed(2), ...o }); }
    for (const o of await page.evaluate(CAPTION_OVERLAP, t)) { if (!caps.has(o.what)) caps.set(o.what, { t: +t.toFixed(2), ...o }); }
    for (const o of await page.evaluate(CARD_LAYOUT)) { const k = o.card + '|' + o.what; if (!layout.has(k)) layout.set(k, { t: +t.toFixed(2), ...o }); }
    const boxes = await page.evaluate(t => { const out = [], st = window.film.stage, S = window.film.TL.stateAt(t), w = S.world || {};
      for (const el of document.querySelectorAll('.plate')) { let a = 1; for (let e = el; e && e !== document.body; e = e.parentElement) a *= +getComputedStyle(e).opacity;
        const r = el.getBoundingClientRect(); if (a > 0.99 && r.width > 200 && r.height > 120 && getComputedStyle(el).display !== 'none') out.push({ id: 'plate:' + el.dataset.id, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }); }
      if (st?.screenBoxes) for (const b of st.screenBoxes(w.space ?? w.media ?? w)) if ((b.a ?? 1) > 0.99 && b.x1 - b.x0 > 200 && b.y1 - b.y0 > 120) out.push({ id: 'w:' + b.id, ...b });
      return out; }, t);
    if (!boxes.length) continue;
    const { data, info } = await sharp(await page.screenshot({ type: 'png' })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height, L = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) L[i] = 0.2126 * lin(data[3 * i] / 255) + 0.7152 * lin(data[3 * i + 1] / 255) + 0.0722 * lin(data[3 * i + 2] / 255);
    // median luminance of the pixels whose distance d from the box edge (negative inside) lies in [d0, d1), sampled every 2 px; the
    // median, so the navy band, the chrome or a callout beside the screen do not count as ground
    const band = (b, d0, d1) => { const v = [];
      for (let y = Math.max(0, Math.floor(b.y0 - d1)); y < Math.min(H, Math.ceil(b.y1 + d1)); y += 2)
        for (let x = Math.max(0, Math.floor(b.x0 - d1)); x < Math.min(W, Math.ceil(b.x1 + d1)); x += 2) {
          const dx = Math.max(b.x0 - x, x - b.x1), dy = Math.max(b.y0 - y, y - b.y1);
          const d = dx > 0 || dy > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) : Math.max(dx, dy);
          if (d >= d0 && d < d1) v.push(L[y * W + x]); }
      return v.length > 50 ? v.sort((p, q) => p - q)[v.length >> 1] : null; };
    for (const b of boxes) { screens++;
      const li = band(b, -inner[1], -inner[0]), lo = band(b, outer[0], outer[1]); if (li === null || lo === null) continue;
      const c = (Math.max(li, lo) + 0.05) / (Math.min(li, lo) + 0.05);
      if (li > white && lo > white && c < ratio && !flags.has(b.id)) flags.set(b.id, { t: +t.toFixed(2), id: b.id, inside: +li.toFixed(2), ground: +lo.toFixed(2), contrast: +c.toFixed(2) }); } }
  return { screens, flags: [...flags.values()], text: [...text.values()], captions: [...caps.values()], layout: [...layout.values()] };
}
