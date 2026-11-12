// On-screen interface: a dark, cinematic re-draw of the planner's real side panel (same title, tabs, groups, layer names,
// counts, buttons and wording as web/src in the planner repo), plus the film's own callouts, labels and Agency 2026 chrome.
// Everything is a pure function of the state passed to render(): no timers, no transitions.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Number(n).toLocaleString('en-CA');
const km = n => `${fmt(Math.round(n))} km`;
const money = n => n >= 1e9 ? `$${(n / 1e9).toFixed(2)} billion` : `$${Math.round(n / 1e6)} million`;

// swatches follow the film's map colours (map.js), which follow the Agency spectrum
export const SWATCH = {
  boundaries: ['line', '#e9f4ff'], world_land: ['fill', '#6b7a88'], subsea_cables: ['rainbow', ''], landing_points: ['ring', '#ffffff'], osm_telecom_lines: ['line', '#E86BA5'],
  broadband_fibre: ['fill', '#8DC63F'], broadband_communities: ['dot', '#EE9A2E'], fixed_link_sites: ['dot', '#E86BA5'], roads: ['line', '#EE7A63'], rail: ['dash', '#C3BBE6'],
  waterways: ['fill', '#2a8fd6'], elevation: ['fill', '#7d8fa3'], permafrost: ['fill', '#b3a8ee'], population_centres: ['fill', '#F2C230'], named_places: ['dot', '#ffffff'],
  remote_communities: ['dot', '#ff5a4d'], indigenous_communities: ['dot', '#EE7A63'], indigenous_lands: ['fill', '#EE7A63'], military: ['fill', '#6F2C83'], critical_infra: ['line', '#F2C230'],
  ports: ['ring', '#6FD6EC'], elevation_coverage: ['fill', '#8DC63F'], data_coverage: ['fill', '#7f8c8d'],
};
const GROUP_ORDER = ['Base', 'Telecommunications', 'Corridors', 'Environment', 'Terrain', 'Places', 'Communities', 'Constraints', 'Infrastructure', 'Quality'];
const TABS = ['Layers', 'Routes', 'Plan', 'Compare', 'Draw lines'];

const swatch = id => { const [k, c] = SWATCH[id] || ['fill', '#888'];
  if (k === 'rainbow') return `<i class="sw sw-rainbow"></i>`;
  return `<i class="sw sw-${k}" style="--c:${c}"></i>`; };
const check = on => `<b class="cb${on ? ' on' : ''}">${on ? '<svg viewBox="0 0 16 16"><path d="M3.5 8.4l3 3 6-6.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</b>`;

function layersPanel(p, manifest) {
  const by = {}; for (const l of manifest.layers) (by[l.group] ||= []).push(l);
  let h = `<h2>Layers</h2>`;
  for (const g of GROUP_ORDER) { if (!by[g]) continue;
    h += `<h3>${esc(g)}</h3>`;
    for (const l of by[g]) { const on = (p.on || {})[l.id] > 0, pulse = (p.pulse || {})[l.id] || 0;
      h += `<div class="row${on ? ' on' : ''}" data-k="layer:${l.id}" style="--pulse:${pulse}">${check(on)}${swatch(l.id)}<span class="t">${esc(l.title)}</span><span class="n">${l.featureCount ? fmt(l.featureCount) : ''}</span><em>i</em></div>`; }
  }
  return h;
}
function routesPanel(p, R) {
  const row = (id, color) => { const r = R.routes[id]; const on = (p.on || {})[id] > 0;
    return `<div class="row route${on ? ' on' : ''}" data-k="route:${id}" style="--pulse:${(p.pulse || {})[id] || 0}">${check(on)}<i class="sw sw-line" style="--c:${color}"></i><span class="t">${esc(r.name)}</span><span class="n">${r.lengthKm ? km(r.lengthKm) : 'not routed'}</span></div>`; };
  let h = `<h2>Modeled routes</h2><p class="note">The modeled routes, solved in advance with each route's default scenario. Solid: solved on roads and rail. Dashed: subsea, indicative. Dotted: not routed.</p><h3>East-west</h3>`;
  h += row('ew-north', '#EE9A2E') + row('ew-south', '#0177CD') + `<h3>North-south</h3>`;
  for (const id of ['ns-ab', 'ns-bc', 'ns-mb', 'ns-nb', 'ns-nl', 'ns-nt', 'ns-ns', 'ns-nu', 'ns-on', 'ns-pe', 'ns-qc', 'ns-sk', 'ns-yt']) h += row(id, '#8DC63F');
  return h;
}
const slider = (label, v, hint, disabled) => `<div class="sl${disabled ? ' dis' : ''}"><span>${esc(label)}</span><div class="track"><div class="fill" style="width:${v * 10}%"></div><div class="knob" style="left:${v * 10}%"></div></div><b>${v}</b></div>${hint ? `<p class="hint">${esc(hint)}</p>` : ''}`;
function metricsTable(m) {
  const rows = [['Length on land', km(m.lengthKm)], ['By road', km(m.kmByKind.road)], ['By rail', km(m.kmByKind.rail)], ['Access links', km(m.kmByKind.access)],
    ['Water crossings', fmt(m.waterCrossings.structure + m.waterCrossings.access)], ['Near critical infrastructure', km(m.kmNearCriticalInfra)], ['Near reserves, land claims and Métis Settlements', km(m.kmNearIndigenousLands)], ['Near military sites', km(m.kmNearMilitary)], ['Cost', 'Hidden (placeholder costs)']];
  return `<table class="metrics">${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>`;
}
function planPanel(p) {
  let h = `<h2>Plan a route</h2><label>Start from</label><div class="select">${esc(p.from || 'Blank: my own waypoints')}<i></i></div><label>Name</label><div class="input">${esc(p.name || '')}</div><h3>Waypoints</h3><fieldset><legend>Segment main: on land</legend>`;
  (p.waypoints || []).forEach((w, i) => { h += `<div class="wp"><b>${i + 1}</b><span>${esc(w)}</span><i>↑</i><i>↓</i><i>✕</i></div>`; });
  h += `<div class="btns"><span class="btn" data-k="btn:AddPlace">Add place</span><span class="btn${p.adding ? ' active' : ''}" data-k="btn:AddPoints">Add points on the map</span></div></fieldset>`;
  if (p.stage !== 'result') {
    h += `<h3>Scenario</h3><fieldset><legend>Weights (0 = no preference)</legend>${slider('Access links', p.weights?.access ?? 0.5)}${slider('Water', p.weights?.water ?? 0)}${slider('Permafrost', 0, 'Not available: routing does not use the permafrost layer yet.', true)}${slider('North of 60°', p.weights?.north ?? 0)}${slider('Unknown data', p.weights?.unknown ?? 0.5)}</fieldset>`;
  }
  h += `<div class="btns"><span class="btn primary${p.press ? ' press' : ''}" data-k="btn:Solve">${p.stage === 'solving' ? 'Solving…' : 'Solve'}</span><span class="btn">Save</span><span class="btn">Export</span></div>`;
  if (p.stage === 'solving') h += `<div class="progress"><div style="width:${Math.round((p.progress || 0) * 100)}%"></div></div><p class="hint">A* search on the road and rail network: ${fmt(p.settled || 0)} nodes settled</p>`;
  if (p.stage === 'result' && p.result) h += `<p class="claim">Optimal on this graph and these weights.</p><p class="warn">Routes run on an interim sample network. Use it to try the tool, not for decisions.</p>${metricsTable(p.result.metrics)}`;
  return h;
}
function comparePanel(p) {
  let h = `<h2>Compare scenarios</h2><p class="note">Each scenario is solved and drawn in its own colour, with a table side by side.</p>`;
  for (const [i, r] of (p.rows || []).entries()) h += `<div class="row${(p.checked ?? 9) > i ? ' on' : ''}" data-k="cmp:${i}">${check((p.checked ?? 9) > i)}<i class="sw sw-line" style="--c:${r.color}"></i><span class="t">${esc(r.name)}</span></div>`;
  h += `<div class="btns"><span class="btn primary${p.press ? ' press' : ''}" data-k="btn:Compare">Compare</span><span class="btn">Clear comparison</span></div>`;
  if (p.show) { const R = p.rows; const sh = i => (Array.isArray(p.show) ? p.show[i] : p.show > i ? 1 : 0);
    const line = (label, f) => `<tr><td>${esc(label)}</td>${R.map((r, i) => `<td style="opacity:${sh(i)}">${esc(f(r.m))}</td>`).join('')}</tr>`;
    h += `<table class="cmp"><tr><th></th>${R.map((r, i) => `<th style="opacity:${sh(i)}"><i class="sw sw-line" style="--c:${r.color}"></i>${esc(r.short)}</th>`).join('')}</tr>` +
      line('Length on land', m => km(m.lengthKm)) + line('By road', m => km(m.kmByKind.road)) + line('By rail', m => km(m.kmByKind.rail)) + line('Water crossings', m => fmt(m.waterCrossings.structure + m.waterCrossings.access)) +
      line('Near critical infrastructure', m => km(m.kmNearCriticalInfra)) + line('Near reserves, land claims and Métis Settlements', m => km(m.kmNearIndigenousLands)) + line('Cost', () => 'Hidden') + `</table><p class="warn">Costs are hidden: the routing cost model uses placeholder units. Compare by length, crossings and places served.</p>`; }
  return h;
}
function drawPanel(p) {
  let h = `<h2>Draw lines</h2><p class="note">Draw your own lines to see roughly what they would cost to build. They are not routes: they are not solved, compared or saved as scenarios.</p><div class="btns"><span class="btn primary${p.press ? ' press' : ''}" data-k="btn:NewLine">New line</span><span class="btn">Import GeoJSON</span><span class="btn">Export GeoJSON</span></div>`;
  if (p.line) { h += `<fieldset><legend>${esc(p.line.name)}</legend><label>Build method</label><div class="select">${esc(p.line.method)}<i></i></div>`;
    if (p.est) { const e = p.est, c = e.crossings;
      h += `<table class="metrics"><tr><td>Length</td><td>${km(e.km)}</td></tr><tr><td>North of 60°</td><td>${km(e.kmNorthOf60)}</td></tr><tr><td>In permafrost</td><td>${km(e.kmPermafrost)}</td></tr><tr><td>Across lakes</td><td>${km(e.kmInWater)}</td></tr><tr><td>Crosses at least</td><td>${c.river} rivers, ${c.road_minor} minor roads, ${c.winter_road} winter roads</td></tr></table>`;
      if (p.showCost) h += `<div class="cost"><span>Indicative</span><b>${money(e.cost.low)} to ${money(e.cost.high)}</b><em>Published benchmark rates, CAD. Not a budget figure.</em></div>`; }
    h += `</fieldset>`; }
  else h += `<p class="note">No lines yet.</p>`;
  return h;
}

// a ranked bar chart inside a callout: one series, drawn to one scale (max = c.max), values in text colour, one row highlighted
function barsHtml(c) {
  const W = 470;
  return `<div class="bars">${c.bars.map(b => { const g = b.g ?? 1, w = Math.max(0, (b.v / c.max) * W * g);
    return `<div class="br${b.hl ? ' hl' : ''}" style="opacity:${Math.min(1, g * 3)}"><span class="bl">${esc(b.label)}</span><span class="bt"><i style="width:${w.toFixed(1)}px"></i></span><b>${Math.round(b.v * g)}</b></div>`; }).join('')}</div>`;
}
export function createUI(root, labelsRoot, ctx) {
  root.innerHTML = `
    <div id="chrome"><img id="wm" src="/brand/logos/agency-2026-wordmark-white.svg" alt=""><img id="goa" src="/brand/logos/goa-signature-white.png" alt="">
      <div id="band"><div id="spectrum"></div><span id="bandtitle"></span><span id="credits"></span><span id="pill">UNCLASSIFIED</span></div></div>
    <div id="panel"><div id="ptop"></div><div id="ptitle">Pan-Canadian Fiber Network planner</div><div id="tabs"></div><div id="pbody"><div id="pscroll"></div></div></div>
    <div id="callouts"></div><div id="caption"></div><div id="statement"></div><div id="fade"></div>
    <div id="card"></div>
    <svg id="cursor" viewBox="0 0 28 28"><path d="M4 2l17 10-7.4 1.7L10 21z" fill="#fff" stroke="#041B30" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const $ = id => root.querySelector('#' + id);
  let last = {};
  const set = (key, el, html) => { if (last[key] !== html) { last[key] = html; el.innerHTML = html; } };
  return {
    render(u = {}, M) {
      $('chrome').style.opacity = u.chrome ?? 0; $('fade').style.opacity = u.fade ?? 0;
      set('bandtitle', $('bandtitle'), esc(u.bandTitle ?? '#11 · Pan-Canadian Fibre Optics Planner'));
      set('credits', $('credits'), esc(u.credits || ''));
      // ---- panel
      const p = u.panel, pe = $('panel');
      pe.style.opacity = p ? (p.a ?? 1) : 0;
      if (p) {
        pe.style.transform = `translate(${p.dx || 0}px, ${p.dy || 0}px) scale(${p.scale || 1})`;
        set('tabs', $('tabs'), TABS.map(t => `<span class="${t === p.tab ? 'on' : ''}" data-k="tab:${t}">${t}</span>`).join(''));
        const body = p.tab === 'Layers' ? layersPanel(p, ctx.manifest) : p.tab === 'Routes' ? routesPanel(p, ctx.routes) : p.tab === 'Plan' ? planPanel(p) : p.tab === 'Compare' ? comparePanel(p) : drawPanel(p);
        set('pscroll', $('pscroll'), body);
        // scroll: a number, or {from, to, k} naming rows (data-k) to keep in view
        let sc = p.scroll || 0;
        if (typeof sc === 'object') { const off = id => { if (!id) return 0; const el = $('pscroll').querySelector(`[data-k="${id}"]`); return el ? Math.max(0, Math.min($('pscroll').scrollHeight - 772, el.offsetTop - 300)) : 0; };
          sc = off(sc.from) + (off(sc.to) - off(sc.from)) * (sc.k ?? 1); }
        $('pscroll').style.transform = `translateY(${-sc}px)`;
      }
      // ---- callouts (big figure + label)
      set('callouts', $('callouts'), (u.callouts || []).filter(c => (c.a ?? 1) > 0.001).map(c =>
        `<div class="callout ${c.align || 'left'}${c.panel ? ' panel' : ''}" style="${c.align === 'right' ? `right:${1920 - c.x}px` : `left:${c.x}px`};top:${c.y}px;opacity:${c.a ?? 1};transform:translateY(${c.dy || 0}px);--acc:${c.accent || '#6FD6EC'}">${c.kicker ? `<span class="k">${esc(c.kicker)}</span>` : ''}${c.big ? `<b style="font-size:${c.size || 120}px">${esc(c.big)}</b>` : ''}${c.sub ? `<span class="s">${esc(c.sub)}</span>` : ''}${c.bars ? barsHtml(c) : ''}${c.note ? `<em>${esc(c.note)}</em>` : ''}</div>`).join(''));
      // ---- caption bar
      const cap = u.caption; $('caption').style.opacity = cap ? (cap.a ?? 1) : 0; if (cap) set('caption', $('caption'), `<span>${esc(cap.text)}</span>`);
      // ---- title / end card
      const c = u.card, ce = $('card'); ce.style.opacity = c ? (c.a ?? 1) : 0;
      if (c) set('card', ce, c.kind === 'end'
        ? `<img class="traces" src="/art/traces-end.svg" style="opacity:${c.traces ?? 1}"><div class="endwrap"><img class="wmbig" src="/brand/logos/agency-2026-wordmark-white.svg"><div class="dates">${esc(c.dates)}</div><div class="kick">${esc(c.kicker)}</div><h1>${esc(c.title)}</h1><div class="src">${(c.sources || []).map(esc).join('<br>')}</div></div>`
        : `<img class="traces" src="/art/traces-title.svg" style="opacity:${c.traces ?? 1}"><div class="titlewrap" style="transform:translateY(${c.dy || 0}px)"><div class="kick">${esc(c.kicker)}</div><h1>${c.lines.map(esc).join('<br>')}</h1><div class="bus"><i></i><i></i><i></i></div>${c.sub ? `<p>${esc(c.sub)}</p>` : ''}</div>`);
      // ---- cursor
      // the cursor travels between named targets: a panel control (data-k), a map place ("map:lng,lat") or a point ("pt:x,y")
      const cu = u.cursor, cue = $('cursor'); cue.style.opacity = cu ? (cu.a ?? 1) : 0;
      if (cu) { const pos = k => { if (!k) return null; if (k.startsWith('pt:')) { const [x, y] = k.slice(3).split(',').map(Number); return { x, y }; }
          if (k.startsWith('map:')) { const q = M.project(k.slice(4).split(',').map(Number)); return q || { x: 1200, y: 600 }; }
          const el = root.querySelector(`[data-k="${k}"]`); if (!el) return null; const r = el.getBoundingClientRect(), s0 = root.getBoundingClientRect();
          return k.startsWith('layer:') || k.startsWith('route:') || k.startsWith('cmp:') ? { x: r.left - s0.left + 17, y: r.top - s0.top + r.height / 2 + 2 } : { x: r.left - s0.left + Math.min(r.width / 2, 60), y: r.top - s0.top + r.height / 2 + 2 }; };
        const a = pos(cu.from) || pos(cu.to) || { x: cu.x || 0, y: cu.y || 0 }, b = pos(cu.to) || a, k = cu.k ?? 1;
        // a slight arc, like a hand on a mouse
        const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(Math.PI * k) * Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.08);
        cue.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${cu.press ? 0.84 : 1})`; }
      // ---- statement (one large line)
      const st = u.statement, ste = $('statement'); ste.style.opacity = st ? (st.a ?? 1) : 0; if (st) { set('statement', ste, st.words.map(w => `<span style="opacity:${w.a}">${esc(w.w)}</span>`).join(' ')); ste.style.transform = `translateY(${st.dy || 0}px)`; }
      // ---- map labels (projected each frame)
      let lh = '';
      for (const l of u.labels || []) { if ((l.a ?? 1) <= 0.001) continue; const q = M.project(l.lonLat); if (!q) continue;
        lh += `<div class="lab ${l.kind || ''} ${l.side || 'r'}" style="left:${q.x.toFixed(1)}px;top:${q.y.toFixed(1)}px;opacity:${l.a ?? 1}">${l.n ? `<b>${l.n}</b>` : '<i></i>'}<span>${esc(l.text)}</span>${l.sub ? `<em>${esc(l.sub)}</em>` : ''}</div>`; }
      set('labels', labelsRoot, lh);
    },
  };
}
