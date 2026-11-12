// Plates: real material from the app (screenshots, image sequences, screen recordings) placed on the stage like footage on a
// virtual camera. All geometry is in the plate's own pixels, so highlights and overlays stay locked to the UI as the camera moves.
//
// state.plates = [{
//   id: 'plan',                          stable id (elements are reused between frames)
//   src: 'capture/plan.png',             a screenshot ... or
//   seq: { pattern: 'capture/rec/f%05d.jpg', fps: 30, count: 900, at: 12.4 },   an image sequence at sequence-second `at` ... or
//   video: { src: 'capture/rec.webm', at: 12.4 },                              a recording seeked to `at` (prefer seq: exact and cheaper)
//   w: 1920, h: 1080,                    the material's size in px (required)
//   x: 960, y: 540,                      where the focus point lands on screen
//   cam: { cx, cy, s },                  focus point in plate px and scale: push-ins, Ken Burns and zoom-to-region are just cam keys
//   rotX, rotY, rotZ,                    degrees; a tilt reads as a screen on a table or a wall (#plates has perspective)
//   a: 1, z: 0,                          opacity and stacking order
//   frame: 'browser' | 'none',           browser chrome around the plate, with url: 'planner.alberta.ca'
//   radius: 14, shadow: 1,               corner radius px, shadow strength 0..1
//   grade: { brightness: 1, saturate: 1, contrast: 1 },
//   dim: 0.6,                            shade everything outside the spots (dark theme: darken; light theme: wash out to white)
//   spots: [{ x, y, w, h, r: 10, k: 'plate:solve', glow: 1, color: 'cyan' }],   spotlight boxes in plate px; k makes it a cursor target; color = accent name or hex
//   overlays: [{ x, y, w, h, html, a: 1, k }],                  re-drawn UI (a panel in the Agency look) laid over the real one
// }]
// an accent name ('cyan') gives the theme's raw fill colour; a hex value is used as given
const accentFill = c => (!c ? 'var(--f-cyan)' : /^[a-z]+$/.test(c) ? `var(--f-${c})` : c);
const fmtSeq = (pattern, i) => pattern.replace(/%0(\d)d/, (_, n) => String(i).padStart(+n, '0'));
export function createPlates(root) {
  const els = new Map(); let errors = 0;
  const make = p => {
    const el = document.createElement('div'); el.className = 'plate'; el.dataset.id = p.id;
    el.innerHTML = `<div class="pchrome"><i></i><i></i><i></i><span class="url"></span></div><div class="pbody"><img class="pimg" alt=""><video class="pvid" muted playsinline preload="auto"></video><svg class="pdim"><defs><mask id="m-${p.id}"><rect width="100%" height="100%" fill="#fff"/><g class="holes"></g></mask></defs><rect class="shade" width="100%" height="100%" style="fill:var(--shade)" mask="url(#m-${p.id})"/></svg><div class="pspots"></div><div class="povl"></div></div>`;
    el.querySelector('.pimg').addEventListener('error', () => { errors++; console.warn('plate image failed', el.querySelector('.pimg').src); });
    el.querySelector('.pvid').addEventListener('error', () => { errors++; console.warn('plate video failed'); });
    root.appendChild(el); return el;
  };
  const setImg = async (img, src) => { if (img.getAttribute('src') === src) return; img.setAttribute('src', src); try { await img.decode(); } catch { errors++; } };
  const seekVideo = async (v, src, at) => {
    if (v.getAttribute('src') !== src) { v.setAttribute('src', src); await new Promise(r => { v.onloadeddata = r; v.onerror = r; }); }
    if (Math.abs(v.currentTime - at) < 1e-4 && v.readyState >= 2) return;
    await new Promise(r => { const done = () => r(); v.addEventListener('seeked', done, { once: true }); v.currentTime = at; setTimeout(done, 4000); });
    if (v.requestVideoFrameCallback) await new Promise(r => { v.requestVideoFrameCallback(() => r()); setTimeout(r, 300); });
  };
  return {
    takeErrors() { const n = errors; errors = 0; return n; },
    el: id => els.get(id),
    async apply(list) {
      const seen = new Set(); const waits = [];
      for (const p of list) {
        if ((p.a ?? 1) <= 0.001) continue;
        seen.add(p.id); let el = els.get(p.id); if (!el) { el = make(p); els.set(p.id, el); }
        const w = p.w, h = p.h, cam = p.cam || {}, cx = cam.cx ?? w / 2, cy = cam.cy ?? h / 2, s = cam.s ?? p.scale ?? 1;
        const x = p.x ?? 960, y = p.y ?? 540;
        Object.assign(el.style, { width: `${w}px`, height: `${h}px`, opacity: p.a ?? 1, zIndex: p.z ?? 0, transformOrigin: `${cx}px ${cy}px`,
          transform: `translate(${(x - cx).toFixed(2)}px, ${(y - cy).toFixed(2)}px) rotateX(${p.rotX || 0}deg) rotateY(${p.rotY || 0}deg) rotateZ(${p.rotZ || 0}deg) scale(${s})`,
          '--r': `${(p.radius ?? 14) / s}px`, '--sh': p.shadow ?? 1 });
        el.classList.toggle('browser', p.frame === 'browser');
        el.querySelector('.url').textContent = p.url || '';
        const g = p.grade || {}; el.querySelector('.pbody').style.filter = (g.brightness ?? 1) === 1 && (g.saturate ?? 1) === 1 && (g.contrast ?? 1) === 1 ? 'none' : `brightness(${g.brightness ?? 1}) saturate(${g.saturate ?? 1}) contrast(${g.contrast ?? 1})`;
        const img = el.querySelector('.pimg'), vid = el.querySelector('.pvid');
        if (p.video) { img.style.display = 'none'; vid.style.display = 'block'; waits.push(seekVideo(vid, p.video.src, p.video.at || 0)); }
        else { vid.style.display = 'none'; img.style.display = 'block';
          const src = p.seq ? fmtSeq(p.seq.pattern, Math.max(0, Math.min(p.seq.count - 1, Math.floor((p.seq.at || 0) * p.seq.fps + 1e-6)) + (p.seq.start ?? 1))) : p.src;
          waits.push(setImg(img, src)); }
        // spotlight: a dark shade with holes, plus a glowing ring per spot
        const spots = p.spots || [], dim = p.dim ?? 0;
        el.querySelector('.shade').setAttribute('opacity', spots.length ? dim : 0);
        el.querySelector('.holes').innerHTML = spots.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.r ?? 10}" fill="#000" opacity="${b.a ?? 1}"/>`).join('');
        el.querySelector('.pspots').innerHTML = spots.map(b => `<div class="spot" ${b.k ? `data-k="${b.k}"` : ''} style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;border-radius:${b.r ?? 10}px;opacity:${(b.a ?? 1) * (b.glow ?? 1)};--acc:${accentFill(b.color)}"></div>`).join('');
        el.querySelector('.povl').innerHTML = (p.overlays || []).filter(o => (o.a ?? 1) > 0.001).map(o => `<div class="ovl" ${o.k ? `data-k="${o.k}"` : ''} style="left:${o.x}px;top:${o.y}px;width:${o.w}px;${o.h ? `height:${o.h}px;` : ''}opacity:${o.a ?? 1}">${o.html}</div>`).join('');
      }
      for (const [id, el] of els) if (!seen.has(id)) el.style.opacity = 0;
      await Promise.all(waits);
    },
  };
}
