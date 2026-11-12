// Media stage: existing 3D and 2D simulation footage (construction films, flood replays, rooftop or splat renders, interface
// recordings) merged with the Agency light look. Product-neutral: the film supplies the footage, the crop and every word.
// Enable in film.config.json: "stage": "/kit/modules/media-stage.js" (the film also links /kit/modules/media.css).
//
// stateAt(t).world.media = {
//   theme: 'light' | 'dark',
//   blooms: [{ x, y, r, color, a }],                      // soft light on the ground behind windowed plates
//   plates: [{
//     id, src: '/sel/S20-mid.jpg'                         // one image, or
//       | seq: { pattern: '/clips/s20/%05d.jpg', fps: 30, start: 1, t },   // an image sequence; frame = start + round(t * fps)
//     size: [1920, 1080],                                 // source pixel size
//     crop: [x, y, w, h],                                 // the part of the source to show (source px); hides a burned-in HUD
//     mode: 'full' | 'window', rect: [x, y, w, h],        // window: its box in frame px. grow 0..1 eases it to full bleed
//     grow, radius, bezel: { pad, cap: 'Title', meta: 'Right text' },      // window: a glass bezel with an optional title bar
//     zoom: 1, pan: [0, 0],                               // a slow push: zoom about the crop centre, pan in source px
//     grade: 'agency' | 'none' | { sat, con, bri, lift, cool },            // 'agency' = lifted shadows, cool light, less saturation
//     wash: { side, a, reach } or a list   // AVOID over footage (owner review of film #5): use scrims behind the text instead
//     a, z }],
//   tags: [{ plate, at: [sx, sy], label, sub, dx, dy, accent, a }],      // at = a source pixel; the stage maps it through crop and grow
//   cards: [{ html, x, y, w, h, a, cls }],               // glass cards: the film writes their HTML with the .md-* helpers
//   scrims: [{ x, y, w, h, a }],                          // a soft light patch the size of a text block plus a small margin, behind type on footage (a ~0.4)
//   band: { chap, place, stat: { num, label }, solid, a, bottom }, credit: 'Imagery: ...', letterbox: 0..1 }
//
// Tags track the footage when the timeline gives `at` per frame (from the source film's camera log, or keyed by hand and joined
// with helpers.track). Read `stage.toFrame(plateId, [sx, sy])` for the cursor or kit labels. Every image is awaited before a
// frame resolves; a failed load counts as an error (the frame is rejected).
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
// 'agency' keeps the footage clean and in full colour (owner, film #5 review 2026-11-12: "the frosted white covers too much"): no white
// lift, no cool cast. Legibility comes from glass cards and from scrims sized to a text block, never from a wash over the footage.
const GRADES = { agency: { sat: 1, con: 1.02, bri: 1.0, lift: 0, cool: 0 }, soft: { sat: .92, con: .96, bri: 1.03, lift: .04, cool: 0 }, none: { sat: 1, con: 1, bri: 1, lift: 0, cool: 0 } };

export async function createStage(el) {
  // the stage brings its own stylesheet, so a film only names the stage in film.config.json
  if (!document.querySelector('link[data-md-css]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/kit/modules/media.css'; l.dataset.mdCss = '1';
    await new Promise(r => { l.onload = l.onerror = r; document.head.appendChild(l); }); }
  const root = document.createElement('div'); root.className = 'md-space'; el.appendChild(root);
  const imgs = new Map(); let errors = 0; let geo = new Map();
  const load = src => {
    if (imgs.has(src)) { const r = imgs.get(src); imgs.delete(src); imgs.set(src, r); return r; }   // most recent last
    while (imgs.size > 40) imgs.delete(imgs.keys().next().value);                                     // a sequence frame is used once: keep memory flat

    const im = new Image(); im.decoding = 'sync';
    const p = new Promise(res => { im.onload = () => res(im); im.onerror = () => { errors++; res(im); }; });
    im.src = src; const rec = { im, p }; imgs.set(src, rec); return rec;
  };
  const box = (pl) => {
    const full = [0, 0, 1920, 1080], r = pl.mode === 'window' ? (pl.rect || [240, 135, 1440, 810]) : full, g = ease(pl.grow || 0);
    return r.map((v, i) => lerp(v, full[i], g));
  };
  function placeImage(pl, b) {
    const [sw, sh] = pl.size || [1920, 1080]; let [cx, cy, cw, ch] = pl.crop || [0, 0, sw, sh];
    const z = pl.zoom || 1, [px, py] = pl.pan || [0, 0];
    const mx = cx + cw / 2 + px, my = cy + ch / 2 + py; cw /= z; ch /= z; cx = mx - cw / 2; cy = my - ch / 2;
    const s = Math.max(b[2] / cw, b[3] / ch);                                    // cover the box with the crop
    const ox = (b[2] - cw * s) / 2 - cx * s, oy = (b[3] - ch * s) / 2 - cy * s;
    return { s, ox, oy };
  }
  function filterOf(gr) {
    const g = typeof gr === 'object' ? { ...GRADES.agency, ...gr } : GRADES[gr || 'agency'] || GRADES.agency;
    return { css: `saturate(${g.sat}) contrast(${g.con}) brightness(${g.bri})`, lift: g.lift, cool: g.cool };
  }
  return {
    async apply(world) {
      const m = (world && world.media) || {}; root.className = 'md-space' + (m.theme === 'dark' ? ' md-dark' : '');
      geo = new Map(); const html = [], waits = [];
      for (const b of m.blooms || []) html.push(`<div class="md-bloom" style="left:${b.x - b.r}px;top:${b.y - b.r}px;width:${2 * b.r}px;height:${2 * b.r}px;background:${b.color};opacity:${b.a ?? .5}"></div>`);
      for (const pl of m.plates || []) {
        const src = pl.seq ? pl.seq.pattern.replace(/%0(\d)d/, (_, n) => String((pl.seq.start ?? 1) + Math.round((pl.seq.t || 0) * (pl.seq.fps || 30))).padStart(+n, '0')) : pl.src;
        const rec = load(src); waits.push(rec.p);
        const b = box(pl), win = pl.mode === 'window' && (pl.grow || 0) < 1, g = ease(pl.grow || 0);
        const r = win ? lerp(pl.radius ?? 34, 0, g) : 0, pos = placeImage(pl, b), f = filterOf(pl.grade);
        geo.set(pl.id, { b, pos });
        const a = pl.a ?? 1;
        if (win && pl.bezel) {
          const p = (pl.bezel.pad ?? 14) * (1 - g), cap = pl.bezel.cap ? (pl.bezel.capH ?? 62) * (1 - g) : 0;
          html.push(`<div class="md-bezel" style="left:${b[0] - p}px;top:${b[1] - p - cap}px;width:${b[2] + 2 * p}px;height:${b[3] + 2 * p + cap}px;--md-r:${r}px;--md-cap:${cap}px;opacity:${a * (1 - g)};z-index:${(pl.z || 0) * 2}">${pl.bezel.cap ? `<div class="md-cap"><span class="md-dots"><i></i><i></i><i></i></span>${pl.bezel.cap}${pl.bezel.meta ? `<span class="md-meta">${pl.bezel.meta}</span>` : ''}</div>` : ''}</div>`);
        }
        const tint = [];
        if (f.lift) tint.push(`linear-gradient(rgba(236,242,249,${f.lift}),rgba(236,242,249,${f.lift}))`);
        if (f.cool) tint.push(`linear-gradient(180deg, rgba(1,119,205,${f.cool}), rgba(1,119,205,0) 60%)`);
        for (const w of [].concat(pl.wash || [])) { const dir = { l: 'to right', r: 'to left', b: 'to top', t: 'to bottom' }[w.side || 'l'], c = m.theme === 'dark' ? '4,27,48' : '246,249,252';
          tint.push(`linear-gradient(${dir}, rgba(${c},${w.a ?? .92}) 0%, rgba(${c},${(w.a ?? .92) * .72}) ${(w.reach ?? .42) * 45}%, rgba(${c},0) ${(w.reach ?? .42) * 100}%)`); }
        html.push(`<div class="md-plate${win ? ' md-win' : ''}" style="left:${b[0]}px;top:${b[1]}px;width:${b[2]}px;height:${b[3]}px;border-radius:${r}px;--md-r:${r}px;opacity:${a};z-index:${(pl.z || 0) * 2 + 1}">`
          + `<img src="${src}" style="transform:translate(${pos.ox}px,${pos.oy}px) scale(${pos.s});filter:${f.css}">`
          + (tint.length ? `<div class="md-tint" style="background:${tint.join(',')}"></div>` : '') + (win ? '<div class="md-sheen"></div>' : '') + `</div>`);
      }
      const toF = (id, [sx, sy]) => { const q = geo.get(id); return q ? [q.b[0] + q.pos.ox + sx * q.pos.s, q.b[1] + q.pos.oy + sy * q.pos.s] : null; };
      this.toFrame = toF;
      for (const t of m.tags || []) {
        const p = toF(t.plate, t.at); if (!p) continue; const dx = t.dx ?? 60, dy = t.dy ?? -90, lx = p[0] + dx, ly = p[1] + dy, left = dx < 0;
        html.push(`<div class="md-tag" style="opacity:${t.a ?? 1};z-index:60;--md-c:${t.accent || 'var(--md-accent)'}">`
          + `<svg width="1" height="1"><path d="M${p[0]} ${p[1]} L${lx} ${ly}" stroke="white" stroke-width="3" stroke-linecap="round" opacity=".95"/></svg>`
          + `<div class="md-pin" style="left:${p[0]}px;top:${p[1]}px"></div>`
          + `<div class="md-glass" style="left:${lx}px;top:${ly}px;transform:translate(${left ? '-100%' : '0'},-50%)"><b>${t.label}</b>${t.sub ? `<span>${t.sub}</span>` : ''}</div></div>`);
      }
      for (const r of m.scrims || []) html.push(`<div class="md-scrim" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;opacity:${r.a ?? 1};--md-scrim-a:${r.k ?? 0.42}"></div>`);
      for (const c of m.cards || []) html.push(`<div class="md-glass md-card ${c.cls || ''}" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;${c.h ? `height:${c.h}px;` : ''}opacity:${c.a ?? 1};z-index:${c.z ?? 70}">${c.html}</div>`);
      if (m.letterbox) { const h = 110 * ease(m.letterbox); html.push(`<div class="md-letter" style="top:0;height:${h}px;z-index:80"></div><div class="md-letter" style="bottom:0;height:${h}px;z-index:80"></div>`); }
      if (m.band) { const b = m.band; html.push(`<div class="md-glass md-band${b.solid ? ' md-solid' : ''}" style="opacity:${b.a ?? 1};z-index:90;${b.bottom != null ? `bottom:${b.bottom}px;` : ''}">`
          + `<div class="md-chap">${b.chap || ''}</div>${b.place ? `<div class="md-sep"></div><div class="md-place">${b.place}</div>` : ''}`
          + (b.stat ? `<div class="md-stat"><span>${b.stat.label}</span><div class="md-num">${b.stat.num}</div></div>` : '') + `</div>`); }
      if (m.credit) html.push(`<div class="md-credit${m.creditDark ? ' md-on-dark' : ''}" style="z-index:95">${m.credit}</div>`);
      root.innerHTML = html.join('');
      await Promise.all(waits);
      await Promise.all([...root.querySelectorAll('img')].map(i => i.decode ? i.decode().catch(() => {}) : 0));
    },
    project() { return null; },
    toFrame() { return null; },
    takeErrors() { const e = errors; errors = 0; return e; },
  };
}

// Small HTML builders for the cards (product-neutral; the film passes its own sourced values)
export const md = {
  checks: ({ kick, title, items }) => `${kick ? `<div class="md-kick">${kick}</div>` : ''}${title ? `<div class="md-h" style="font-size:34px">${title}</div>` : ''}`
    + `<div class="md-checks">${items.map(i => `<div class="md-check" style="--md-c:${i.color}"><div class="md-num">${i.n}</div><div>${i.label}</div></div>`).join('')}</div>`,
  ledger: ({ kick, title, num, sub, rows }) => `${kick ? `<div class="md-kick">${kick}</div>` : ''}${title ? `<div class="md-h" style="font-size:30px">${title}</div>` : ''}`
    + (num ? `<div class="md-num" style="font-size:72px">${num}</div>` : '') + (sub ? `<div class="md-t">${sub}</div>` : '')
    + (rows ? `<div class="md-rows">${rows.map(r => `<span>${r.label}</span><div class="md-bar" style="--md-c:${r.color || 'var(--md-accent)'}"><i style="width:${Math.round(r.share * 100)}%"></i></div><b style="color:var(--md-ink)">${r.value}</b>`).join('')}</div>` : ''),
  range: ({ lo, mid, hi, min, max, labels }) => { const x = v => ((v - min) / (max - min) * 100).toFixed(2) + '%';
    return `<div class="md-range"><div class="md-track"></div><div class="md-span" style="left:${x(lo)};width:calc(${x(hi)} - ${x(lo)})"></div><div class="md-mark" style="left:${x(mid)}"></div>`
      + `<div class="md-lab" style="left:${x(lo)}">${labels[0]}</div><div class="md-lab" style="left:${x(mid)};color:var(--md-ink)">${labels[1]}</div><div class="md-lab" style="left:${x(hi)}">${labels[2]}</div></div>`; },
  chips: (items) => `<div class="md-chips">${items.map(i => `<span class="md-chip${i.on ? ' on' : ''}" style="--md-c:${i.color || 'var(--md-accent)'}"><i></i>${i.label}</span>`).join('')}</div>`,
};
