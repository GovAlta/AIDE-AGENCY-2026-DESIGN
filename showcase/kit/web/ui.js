// Interface layer: Agency 2026 chrome, callouts, glass panels (re-drawn UI), captions, statement, title and end cards,
// cursor and labels. Pure function of state.ui; nothing animates on its own.
//
// state.ui = {
//   chrome: 0..1, bandTitle: '#11 · Project name', credits: 'Data: …', fade: 0..1 (the theme's fade colour over everything),
//   accents are names from the Agency spectrum ('cyan', 'blue', 'green', ...): text uses the theme's text-safe value, fills the raw one;
//   a hex value still works but then reads in one theme only.
//   callouts: [{ x, y, align: 'left'|'right'|'center', kicker, big, size, sub, note, accent, a, dy, scale (a hero chart: 1.5), panel: bool,
//                bars: [{ label, v, hl, g }], max }],
//   panels:   [{ id, x, y, w, h, a, dx, dy, scale, title, tabs: [..], tab, html, scroll }],   glass panels with any HTML (data-k targets inside)
//   caption:  { text, a }, statement: { words: [{ w, a }], a, dy },
//   card:     { kind: 'title', kicker, lines: [...], sub, traces, a, dy } | { kind: 'end', dates, kicker, title (one sentence a line), titleLines, sources: [...] (two short lines), traces, a }
//             | { kind: 'credits', title, lines: [...] } (a plain card after the end card for the full credits; no traces). Card text is fitted clear of the traces.
//   cursor:   { from, to, k, press, a }   targets: 'pt:x,y' | 'map:lng,lat' | 'plate:<id>:x,y' | any data-k in a panel, plate spot or overlay,
//   labels:   [{ lonLat | xy: [x, y] | plate: ['id', x, y], text, sub, n, kind: 'big'|'small'|'none', side: 'l'|'r', a }],
// }
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export { esc };

// a ranked bar chart inside a callout: one series, one scale (max), values in text colour, one row highlighted
function barsHtml(c) {
  const W = c.barWidth || 470;
  return `<div class="bars" style="--bw:${W}px">${c.bars.map(b => { const g = b.g ?? 1, w = Math.max(0, (b.v / c.max) * W * g);
    return `<div class="br${b.hl ? ' hl' : ''}" style="opacity:${Math.min(1, g * 3)}"><span class="bl">${esc(b.label)}</span><span class="bt"><i style="width:${w.toFixed(1)}px"></i></span><b>${b.fmt ? esc(b.fmt(b.v * g)) : Math.round(b.v * g).toLocaleString('en-CA')}</b></div>`; }).join('')}</div>`;
}

// accent name -> the theme's text-safe colour and its raw fill; hex values pass through
const accVars = a => (!a ? '--acc:var(--t-cyan);--accf:var(--f-cyan)' : /^[a-z]+$/.test(a) ? `--acc:var(--t-${a});--accf:var(--f-${a})` : `--acc:${a};--accf:${a}`);
// title cards: 124 px for a short name, smaller for a long one, so it never runs into the trace art (about 22 characters a line at 124 px)
const titleSize = lines => { const n = Math.max(...lines.map(l => String(l).length)), rows = lines.length; return Math.round(Math.max(64, Math.min(124, 124 * 22 / Math.max(22, n), rows > 2 ? 100 : 124))); };
const LOGOS = { light: { wm: '/brand/logos/agency-2026-wordmark-outlined.svg', goa: '/brand/logos/goa-signature.png' }, dark: { wm: '/brand/logos/agency-2026-wordmark-white-outlined.svg', goa: '/brand/logos/goa-signature-white.png' } };

// ---- the trace art's line segments, so title and end cards keep their text clear of the traces (owner, film #6: the closing line
// ran the full width and sat on a trace). Every text block on a card is fitted into the clear band between the traces at its height,
// at least SAFE px from the nearest trace; film.UI.cardCheck(m) lists any text that still comes within m px of a trace (the dry run).
const SAFE = 120, SEGS = {};
async function loadTraces(url) {
  if (SEGS[url]) return SEGS[url];
  try { const txt = await fetch(url).then(r => (r.ok ? r.text() : ''));
    const segs = []; for (const m of txt.matchAll(/ d="([^"]+)"/g)) { const pts = [...m[1].matchAll(/(-?[\d.]+)[ ,](-?[\d.]+)/g)].map(q => [+q[1], +q[2]]);
      for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]); }
    return (SEGS[url] = segs); } catch { return (SEGS[url] = []); }
}
const nearTrace = (segs, r, m) => segs.some(([[ax, ay], [bx, by]]) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
  for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n; if (x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m) return true; } return false; });
const stageRect = el => { const s0 = document.getElementById('stage').getBoundingClientRect(), k = s0.width / 1920, r = el.getBoundingClientRect();
  return { x: (r.left - s0.left) / k, y: (r.top - s0.top) / k, w: r.width / k, h: r.height / k }; };
// each text block keeps clear of the traces: the end card's closing line by SAFE px, every other block by 40 px. A block too close is wrapped
// narrower and set smaller, step by step, until it is clear (the dry run then checks every card at 40 px).
function fitCard(ce, segs) {
  for (const el of ce.querySelectorAll('.endwrap > *:not(img), .titlewrap > *:not(.bus), .creditswrap > *')) {
    if (el.dataset.fs === undefined) el.dataset.fs = el.style.fontSize; el.style.maxWidth = ''; el.style.fontSize = el.dataset.fs;
    const m = el.tagName === 'H1' && el.closest('.endwrap') ? SAFE : 40;
    for (let i = 0; i < 30 && nearTrace(segs, stageRect(el), m); i++) { const r = stageRect(el);
      el.style.maxWidth = `${Math.max(360, r.w * 0.94)}px`; el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 0.96}px`; } }
}
const sentences = t => String(t ?? '').split(/(?<=[.!?])\s+(?=[A-Z])/);

export function createUI(root, labelsRoot) {
  root.innerHTML = `
    <div id="chrome"><img id="wm" src="/brand/logos/agency-2026-wordmark-outlined.svg" alt="Agency 2026"><img id="goa" src="/brand/logos/goa-signature.png" alt="Government of Alberta">
      <div id="band"><div id="spectrum"></div><span id="bandtitle"></span><span id="credits"></span><span id="pill">UNCLASSIFIED</span></div></div>
    <div id="panels"></div><div id="callouts"></div><div id="caption"></div><div id="statement"></div>
    <div id="card"></div><div id="fade"></div>
    <svg id="cursor" viewBox="0 0 28 28"><path d="M4 2l17 10-7.4 1.7L10 21z" fill="#fff" stroke="#041B30" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const $ = id => root.querySelector('#' + id);
  const last = {}; let errors = 0;
  for (const img of root.querySelectorAll('img')) img.addEventListener('error', () => { errors++; });
  const set = (key, el, html) => { if (last[key] !== html) { last[key] = html; el.innerHTML = html; } };
  const posOf = (k, ctx) => {
    if (!k) return null;
    if (k.startsWith('pt:')) { const [x, y] = k.slice(3).split(',').map(Number); return { x, y }; }
    if (k.startsWith('map:')) return ctx.project(k.slice(4).split(',').map(Number)) || { x: 1200, y: 600 };
    if (k.startsWith('plate:')) { const [, id, xy] = k.split(':'); const [x, y] = xy.split(',').map(Number); return platePoint(id, x, y); }
    const el = document.querySelector(`[data-k="${CSS.escape(k)}"]`); if (!el) return null;
    const r = el.getBoundingClientRect(), s0 = document.getElementById('stage').getBoundingClientRect();
    return el.dataset.kRow !== undefined ? { x: r.left - s0.left + 17, y: r.top - s0.top + r.height / 2 + 2 } : { x: r.left - s0.left + Math.min(r.width / 2, 60), y: r.top - s0.top + r.height / 2 + 2 };
  };
  // a point in plate px -> stage px, through the plate's current CSS transform (including tilt)
  const platePoint = (id, x, y) => { const el = document.querySelector(`#plates .plate[data-id="${CSS.escape(id)}"]`) || [...document.querySelectorAll('#plates .plate')].find(e => e.__id === id);
    if (!el) return null; const probe = el.__probe || (el.__probe = Object.assign(document.createElement('i'), { className: 'probe' })); if (!probe.parentNode) el.appendChild(probe);
    probe.style.left = `${x}px`; probe.style.top = `${y}px`; const r = probe.getBoundingClientRect(), s0 = document.getElementById('stage').getBoundingClientRect(); return { x: r.left - s0.left, y: r.top - s0.top }; };
  let cardUrl = null;
  const ready = Promise.all(['/art/traces-end.svg', '/art/traces-end-light.svg', '/art/traces-title.svg', '/art/traces-title-light.svg'].map(loadTraces));
  return {
    ready,
    // text on the current card that comes within m px of a trace: [{ text, rect }] (empty when clear)
    cardCheck(m = 40) { const ce = $('card'); if (!cardUrl || +ce.style.opacity < 0.01) return []; const segs = SEGS[cardUrl] || [];
      return [...ce.querySelectorAll('.endwrap > *, .titlewrap > *:not(.bus), .creditswrap > *')].filter(el => el.textContent.trim())
        .map(el => ({ text: el.textContent.trim().slice(0, 60), rect: stageRect(el) })).filter(o => nearTrace(segs, o.rect, m)); },
    takeErrors() { const n = errors; errors = 0; return n; },
    render(u, ctx) {
      $('chrome').style.opacity = u.chrome ?? 0; $('fade').style.opacity = u.fade ?? 0;
      const theme = ctx.theme === 'dark' ? 'dark' : 'light', L = LOGOS[theme];
      if ($('wm').getAttribute('src') !== L.wm) $('wm').setAttribute('src', L.wm);
      if ($('goa').getAttribute('src') !== L.goa) $('goa').setAttribute('src', L.goa);
      const sfx = theme === 'light' ? '-light' : '';
      set('bandtitle', $('bandtitle'), esc(u.bandTitle ?? ''));
      set('credits', $('credits'), esc(u.credits || ''));
      // ---- glass panels (re-drawn UI)
      set('panels', $('panels'), (u.panels || []).filter(p => (p.a ?? 1) > 0.001).map(p => `<div class="gpanel" style="left:${p.x ?? 56}px;top:${p.y ?? 124}px;width:${p.w ?? 452}px;height:${p.h ?? 868}px;opacity:${p.a ?? 1};transform:translate(${p.dx || 0}px,${p.dy || 0}px) scale(${p.scale || 1})">
          <div class="gtop"></div>${p.title ? `<div class="gtitle">${esc(p.title)}</div>` : ''}${p.tabs ? `<div class="gtabs">${p.tabs.map(t => `<span class="${t === p.tab ? 'on' : ''}" data-k="tab:${esc(t)}">${esc(t)}</span>`).join('')}</div>` : ''}
          <div class="gbody" style="top:${(p.title ? 52 : 0) + (p.tabs ? 44 : 0)}px"><div class="gscroll" style="transform:translateY(${-(p.scroll || 0)}px)">${p.html || ''}</div></div></div>`).join(''));
      // ---- callouts
      set('callouts', $('callouts'), (u.callouts || []).filter(c => (c.a ?? 1) > 0.001).map(c =>
        `<div class="callout ${c.align || 'left'}${c.panel ? ' panel' : ''}" style="${c.align === 'right' ? `right:${1920 - c.x}px` : `left:${c.x}px`};top:${c.y}px;opacity:${c.a ?? 1};transform:translateY(${c.dy || 0}px)${c.scale ? ` scale(${c.scale})` : ''};transform-origin:${c.align === 'right' ? 'top right' : c.align === 'center' ? 'top center' : 'top left'};${accVars(c.accent)}">${c.kicker ? `<span class="k">${esc(c.kicker)}</span>` : ''}${c.words ? `<b style="font-size:${c.size || 120}px">${c.words.map(w => w.w === '\n' ? '<br>' : `<span style="opacity:${w.a ?? 1}">${esc(w.w)}</span>`).join(' ')}</b>` : c.big ? `<b style="font-size:${c.size || 120}px">${esc(c.big)}</b>` : ''}${c.sub ? `<span class="s">${esc(c.sub)}</span>` : ''}${c.bars ? barsHtml(c) : ''}${c.note ? `<em>${esc(c.note)}</em>` : ''}</div>`).join(''));
      // ---- caption, statement
      const cap = u.caption; $('caption').style.opacity = cap ? (cap.a ?? 1) : 0; if (cap) set('caption', $('caption'), `<span>${esc(cap.text)}</span>`);
      const st = u.statement, ste = $('statement'); ste.style.opacity = st ? (st.a ?? 1) : 0;
      if (st) { set('statement', ste, st.words.map(w => w.w === '\n' ? '<br>' : `<span style="opacity:${w.a}">${esc(w.w)}</span>`).join(' ')); ste.style.transform = `translateY(${st.dy || 0}px)`; }
      // ---- title / end card (traces art per theme: art/traces-*.svg on night, art/traces-*-light.svg on board)
      const c = u.card, ce = $('card'); ce.style.opacity = c ? (c.a ?? 1) : 0;
      if (c) { const url = c.kind === 'credits' ? null : `/art/traces-${c.kind === 'end' ? 'end' : 'title'}${sfx}.svg`;
        const html = c.kind === 'end'
        ? `<img class="traces" src="${url}" style="opacity:${c.traces ?? 1}"><div class="endwrap"><img class="wmbig" src="${L.wm}"><div class="dates">${esc(c.dates)}</div><div class="kick">${esc(c.kicker)}</div><h1>${(c.titleLines || sentences(c.title)).map(esc).join('<br>')}</h1><div class="src">${(c.sources || []).map(esc).join('<br>')}</div></div>`
        : c.kind === 'credits'
        ? `<div class="creditswrap">${c.title ? `<div class="kick">${esc(c.title)}</div>` : ''}${(c.lines || []).map(l => `<p>${esc(l)}</p>`).join('')}</div>`
        : `<img class="traces" src="${url}" style="opacity:${c.traces ?? 1}"><div class="titlewrap" style="transform:translateY(${c.dy || 0}px)"><div class="kick">${esc(c.kicker)}</div><h1 style="font-size:${titleSize(c.lines)}px">${c.lines.map(esc).join('<br>')}</h1><div class="bus"><i></i><i></i><i></i></div>${c.sub ? `<p>${esc(c.sub)}</p>` : ''}</div>`;
        cardUrl = url; if (last.card !== html) { set('card', ce, html); if (url) fitCard(ce, SEGS[url] || []); } }
      else cardUrl = null;
      // ---- labels (on the world map, on a plate, or at a screen point)
      let lh = '';
      for (const l of u.labels || []) { if ((l.a ?? 1) <= 0.001) continue;
        const q = l.lonLat ? ctx.project(l.lonLat) : l.plate ? platePoint(l.plate[0], l.plate[1], l.plate[2]) : l.xy ? { x: l.xy[0], y: l.xy[1] } : null; if (!q) continue;
        lh += `<div class="lab ${l.kind || ''} ${l.side || 'r'}" style="left:${q.x.toFixed(1)}px;top:${q.y.toFixed(1)}px;opacity:${l.a ?? 1}">${l.n ? `<b>${l.n}</b>` : '<i></i>'}<span>${esc(l.text)}</span>${l.sub ? `<em>${esc(l.sub)}</em>` : ''}</div>`; }
      set('labels', labelsRoot, lh);
      // ---- cursor (after panels and plates are in place, so targets can be measured)
      const cu = u.cursor, cue = $('cursor'); cue.style.opacity = cu ? (cu.a ?? 1) : 0;
      if (cu) { const a = posOf(cu.from, ctx) || posOf(cu.to, ctx) || { x: cu.x || 0, y: cu.y || 0 }, b = posOf(cu.to, ctx) || a, k = cu.k ?? 1;
        const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(Math.PI * k) * Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.08); // a slight arc, like a hand on a mouse
        cue.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${cu.press ? 0.84 : 1})`; }
    },
  };
}
