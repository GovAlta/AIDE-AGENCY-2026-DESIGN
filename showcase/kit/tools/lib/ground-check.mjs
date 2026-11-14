// White screen on a white ground (owner, film #15, 2026-11-13: a white screen never sits on a white ground; give it a dark frame, a soft
// shadow and a deeper gradient or navy behind it). Every `step` seconds: draw the frame, take each fully shown screen (a plate, or a
// stage's screenBoxes), and compare a band inside its edge (4-60 px) with the ground around it (60-160 px out, past a soft shadow). Both
// near-white (luminance over `white`) and a contrast ratio under `ratio` is a white screen on a white ground: a warning, not a fault (a
// tilted plate's box includes some ground, and the bands miss a screen that fills the frame).
import sharp from 'sharp';
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export async function groundCheck(page, { step = 2, white = 0.75, ratio = 1.3, inner = [4, 60], outer = [60, 160] } = {}) {
  const { DUR } = await page.evaluate(() => ({ DUR: window.film.DUR }));
  const flags = new Map(); let screens = 0;
  for (let t = step / 2; t < DUR; t += step) {
    await page.evaluate(t => window.film.seek(t), t);
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
  return { screens, flags: [...flags.values()] };
}
