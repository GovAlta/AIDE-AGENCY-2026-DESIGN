// Generic map stage (geographic films): a MapLibre GL globe that draws the film's own data layers, declared in
// film.config.json, over NASA imagery or a light basemap. Plugs into the frame contract (web/main.js):
//   film.config.json: "stage": "/kit/modules/map-stage.js",
//     "map": { "start": { "lng": -113.5, "lat": 53.5, "zoom": 7 },
//              "layers": [ { "id": "stations", "file": "/data/stations.geojson", "type": "circle", "accent": "cyan", "radius": 6 },
//                          { "id": "river",    "file": "/data/river.geojson",    "type": "line",   "accent": "blue", "width": 3, "glow": true, "progress": true },
//                          { "id": "zones",    "file": "/data/zones.geojson",    "type": "fill",   "accent": "green", "opacity": 0.35, "outline": true },
//                          { "id": "scan",     "tiles": "/data/tiles/{z}/{x}/{y}.png", "type": "raster", "maxzoom": 12 } ] }
//   (files come from the film folder or from "mounts"; .geojson.gz is served with gzip encoding by the kit server)
// Colours follow the scene theme: accent fills on light scenes, their lighter tints on dark ones (a navy outline stays visible at night).
// Per-feature styling: any paint value may be a MapLibre expression; "colorBy": { "property": "level", "map": { "A": "green", "B": "orange" }, "default": "cyan" }.
//
// stateAt(t).world.map = {
//   cam: { lng, lat, zoom, pitch, bearing },
//   basemap: 'nasa-night' | 'nasa-day' | 'light' | 'none',   light = NASA relief brightened and desaturated, for light films
//   grade: { brightness, saturation, contrast, lights },        optional overrides of the basemap look
//   terrain: 0 | exaggeration,                                  3D terrain (costly: about 10 s a frame in software; cloud only)
//   layers: { id: opacity 0..1 },                               declared layers; 0 hides
//   reveal: { id: share 0..1 },                                 features appear in a seeded order (cables, stations, parcels)
//   lines:  { id: { p: 0..1, head: bool } },                    progress along a "progress": true line layer (each feature from its start)
//   pulses: [{ p: [lng, lat], c: 'cyan' | '#hex', r, a }],       moving lights (travelling along lines: use stage.along())
//   sky: 'auto' | 'none'
// }
// Labels are drawn by the UI layer (state.ui.labels with lonLat); this stage projects them and hides any on the far side of the globe.
//
// Helpers for timelines: stage.along(id, share) -> [lng, lat] and stage.heading(id, share) -> degrees along a declared line layer
// (its features joined in file order), stage.lengthKm(id). Follow cameras must be time-smoothed with helpers.smoothPath (film #11 lesson).
import * as maplibregl from '/vendor/maplibre-gl/dist/maplibre-gl.mjs';
maplibregl.setWorkerUrl('/vendor/maplibre-gl/dist/maplibre-gl-worker.mjs');
maplibregl.setWorkerCount(4);
maplibregl.setNow(0); // freeze MapLibre's clock: no time-based fades; every frame is a pure function of the state we set

const FILL = { purple: '#6F2C83', blue: '#0177CD', lilac: '#9C90C5', pink: '#E86BA5', coral: '#EE7A63', orange: '#EE9A2E', yellow: '#F2C230', green: '#8DC63F', cyan: '#00AAD2', navy: '#022C4C', white: '#FFFFFF', night: '#041B30', maroon: '#882831', grey: '#9AA6B2' };
const LIGHTER = { purple: '#C9A2DB', blue: '#6FB8F0', lilac: '#C3BBE6', pink: '#F7A8CB', coral: '#F6A693', orange: '#F7BD6B', yellow: '#F7D774', green: '#B5DE7C', cyan: '#6FD6EC', navy: '#9CC3E4', white: '#FFFFFF', grey: '#D5DCE3' };
export const colour = (c, dark) => (!c ? FILL.cyan : c.startsWith('#') || c.startsWith('rgb') ? c : (dark && LIGHTER[c]) || FILL[c] || c);
const z = (...stops) => ['interpolate', ['linear'], ['zoom'], ...stops];
const zs = (v, lo = 0.45, hi = 1.6) => z(3, v * lo, 9, v, 14, v * hi); // a size that grows gently with zoom
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = 6371.0088, rad = Math.PI / 180;
const km = (a, b) => { const dl = (b[1] - a[1]) * rad, dn = (b[0] - a[0]) * rad, h = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const bearing = (a, b) => { const y = Math.sin((b[0] - a[0]) * rad) * Math.cos(b[1] * rad), x = Math.cos(a[1] * rad) * Math.sin(b[1] * rad) - Math.sin(a[1] * rad) * Math.cos(b[1] * rad) * Math.cos((b[0] - a[0]) * rad); return Math.atan2(y, x) / rad; };

export async function createStage(el, { config }) {
  const M = config.map || {}, decl = M.layers || [];
  let errors = 0;
  const sources = {
    bm: { type: 'raster', tiles: [location.origin + '/tiles/bm/{z}/{x}/{y}.jpg'], tileSize: 256, maxzoom: 8 },
    lights: { type: 'raster', tiles: [location.origin + '/tiles/lights/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 8 },
    dem: { type: 'raster-dem', tiles: [location.origin + '/tiles/dem/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 11, encoding: 'terrarium' },
    pulses: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
  };
  const layers = [
    { id: 'bm', type: 'raster', source: 'bm', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0, 'raster-opacity': 1 } },
    { id: 'lights', type: 'raster', source: 'lights', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0, 'raster-opacity': 0 } },
  ];
  const groups = {}; // declared id -> [[styleLayerId, opacityProp, base]]
  const colourProps = []; // [styleLayerId, paintProp, declared layer] whose colour follows the theme (lighter tints on dark scenes)
  const lineIndex = {}; // declared id -> { coords, cum, km } (features joined in file order)
  const progressLayers = new Set();
  const addStyle = (id, layer, prop, base = 1) => { layer.layout = { visibility: 'none', ...(layer.layout || {}) };
    layer.paint = { ...(layer.paint || {}), [prop]: 0, [`${prop}-transition`]: { duration: 0, delay: 0 } }; layers.push(layer); (groups[id] ||= []).push([layer.id, prop, base]); };
  const colorExpr = (L, dark) => { if (L.color) return L.color; if (!L.colorBy) return colour(L.accent, dark);
    const m = ['match', ['to-string', ['get', L.colorBy.property]]]; for (const [k, v] of Object.entries(L.colorBy.map)) m.push(k, colour(v, dark)); m.push(colour(L.colorBy.default || L.accent, dark)); return m; };

  // ---- load every declared vector file now: reveal order (k), line indexes; a failed load is a start-up error (fatal)
  for (const L of decl) {
    if (L.type === 'raster') { sources['s-' + L.id] = { type: 'raster', tiles: [location.origin + L.tiles], tileSize: L.tileSize || 256, maxzoom: L.maxzoom || 14, ...(L.bounds ? { bounds: L.bounds } : {}) };
      addStyle(L.id, { id: `${L.id}-r`, type: 'raster', source: 's-' + L.id, paint: { 'raster-fade-duration': 0 } }, 'raster-opacity', L.opacity ?? 1); continue; }
    let gj; try { const r = await fetch(L.file); if (!r.ok) throw new Error(`HTTP ${r.status}`); gj = await r.json(); } catch (e) { errors++; console.warn(`map layer ${L.id}: ${L.file}: ${e.message}`); continue; }
    if (gj.type === 'Feature') gj = { type: 'FeatureCollection', features: [gj] };
    const rnd = mulberry(hash(L.id)); for (const f of gj.features) (f.properties ||= {}).k = rnd();
    if (L.type === 'line') { const coords = []; for (const f of gj.features) { const g = f.geometry; if (!g) continue; const parts = g.type === 'MultiLineString' ? g.coordinates : g.type === 'LineString' ? [g.coordinates] : []; for (const p of parts) for (const q of p) coords.push(q); }
      if (coords.length > 1) { const cum = [0]; for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + km(coords[i - 1], coords[i])); lineIndex[L.id] = { coords, cum, km: cum[cum.length - 1] }; } }
    sources['s-' + L.id] = { type: 'geojson', data: gj, tolerance: L.tolerance ?? 0.2, buffer: 32, ...(L.progress ? { lineMetrics: true } : {}) };
    const src = 's-' + L.id, f0 = L.filter ? { filter: L.filter } : {};
    const C = (lid, prop) => { colourProps.push([lid, prop, L]); return colorExpr(L, false); };
    if (L.type === 'fill') { addStyle(L.id, { id: `${L.id}-f`, type: 'fill', source: src, ...f0, paint: { 'fill-color': C(`${L.id}-f`, 'fill-color'), 'fill-antialias': true } }, 'fill-opacity', L.opacity ?? 0.4);
      if (L.outline !== false) addStyle(L.id, { id: `${L.id}-o`, type: 'line', source: src, ...f0, paint: { 'line-color': C(`${L.id}-o`, 'line-color'), 'line-width': zs(L.outlineWidth ?? 1.2) } }, 'line-opacity', 0.9); }
    else if (L.type === 'line') { const lay = { 'line-cap': 'round', 'line-join': 'round' };
      if (L.glow) addStyle(L.id, { id: `${L.id}-g`, type: 'line', source: src, ...f0, layout: lay, paint: { 'line-color': C(`${L.id}-g`, 'line-color'), 'line-width': zs((L.width ?? 2) * 4), 'line-blur': zs((L.width ?? 2) * 3) } }, 'line-opacity', 0.45);
      addStyle(L.id, { id: `${L.id}-l`, type: 'line', source: src, ...f0, layout: lay, paint: { 'line-color': C(`${L.id}-l`, 'line-color'), 'line-width': zs(L.width ?? 2), ...(L.dash ? { 'line-dasharray': L.dash } : {}) } }, 'line-opacity', L.opacity ?? 1);
      if (L.progress) progressLayers.add(L.id); }
    else if (L.type === 'circle') {
      if (L.glow) addStyle(L.id, { id: `${L.id}-h`, type: 'circle', source: src, ...f0, paint: { 'circle-color': C(`${L.id}-h`, 'circle-color'), 'circle-radius': zs((L.radius ?? 5) * 2.4), 'circle-blur': 1 } }, 'circle-opacity', 0.5);
      addStyle(L.id, { id: `${L.id}-c`, type: 'circle', source: src, ...f0, paint: { 'circle-color': C(`${L.id}-c`, 'circle-color'), 'circle-radius': zs(L.radius ?? 5), 'circle-stroke-color': L.stroke || '#FFFFFF', 'circle-stroke-width': L.strokeWidth ?? 1.5, 'circle-stroke-opacity': 0 } }, 'circle-opacity', L.opacity ?? 1);
      groups[L.id].push([`${L.id}-c`, 'circle-stroke-opacity', 1]); }
    else if (L.type === 'heatmap') addStyle(L.id, { id: `${L.id}-hm`, type: 'heatmap', source: src, paint: { 'heatmap-radius': zs(L.radius ?? 18), 'heatmap-intensity': L.intensity ?? 1,
        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.3, colour(L.accent || 'cyan'), 1, colour(L.hot || 'yellow')] } }, 'heatmap-opacity', L.opacity ?? 0.8);
    else { errors++; console.warn(`map layer ${L.id}: unknown type ${L.type}`); }
  }
  layers.push({ id: 'pulse-halo', type: 'circle', source: 'pulses', paint: { 'circle-color': ['get', 'c'], 'circle-radius': ['*', ['get', 'r'], 5], 'circle-blur': 1, 'circle-opacity': ['get', 'a'] } });
  layers.push({ id: 'pulse-core', type: 'circle', source: 'pulses', paint: { 'circle-color': '#FFFFFF', 'circle-radius': ['get', 'r'], 'circle-blur': 0.35, 'circle-opacity': ['get', 'a'] } });

  const start = M.start || { lng: -100, lat: 55, zoom: 3 };
  const style = { version: 8, transition: { duration: 0, delay: 0 }, projection: { type: M.projection || 'globe' }, sources, layers,
    sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 0.8, 7.5, 0] } };
  const map = new maplibregl.Map({ container: el, style, interactive: false, attributionControl: false, fadeDuration: 0, pixelRatio: 1, maxPitch: 80, renderWorldCopies: false,
    canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true }, center: [start.lng, start.lat], zoom: start.zoom, maxTileCacheZoomLevels: 8 });
  map.on('error', e => { if (e?.error?.status === 404) return; errors++; console.warn('map error', e?.error?.message || e); });
  await new Promise(r => map.once('load', r));

  const cur = {};
  const setPaint = (id, prop, v) => { const k = id + '|' + prop, s = typeof v === 'object' ? JSON.stringify(v) : v; if (cur[k] === s) return; cur[k] = s; map.setPaintProperty(id, prop, v); };
  const setVis = (id, on) => { const k = id + '|vis'; if (cur[k] === on) return; cur[k] = on; map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); };
  const setFilter = (id, f) => { const k = id + '|flt', s = JSON.stringify(f); if (cur[k] === s) return; cur[k] = s; map.setFilter(id, f); };
  const declById = Object.fromEntries(decl.map(L => [L.id, L]));
  const at = (L, d) => { d = Math.max(0, Math.min(L.km, d)); let lo = 0, hi = L.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L.cum[m] <= d) lo = m; else hi = m; }
    const f = (d - L.cum[lo]) / Math.max(1e-9, L.cum[hi] - L.cum[lo]), a = L.coords[lo], b = L.coords[hi]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };

  const BASE = { 'nasa-night': { bm: [0.5, 0, -0.35, 0.18], lights: 0.85 }, 'nasa-day': { bm: [1, 0, -0.1, 0.05], lights: 0 }, light: { bm: [1, 0.5, -0.55, -0.12], lights: 0 }, none: null };
  async function settle() { let ok = 0; for (let i = 0; i < 80 && ok < 2; i++) { await new Promise(r => { map.once('idle', r); map.triggerRepaint(); }); ok = map.loaded() && map.areTilesLoaded() ? ok + 1 : 0; } }

  return {
    map, along: (id, share) => at(lineIndex[id], share * lineIndex[id].km), lengthKm: id => lineIndex[id]?.km ?? 0,
    heading: (id, share, aheadKm = 30) => { const L = lineIndex[id], d = share * L.km; return bearing(at(L, d - aheadKm * 0.3), at(L, d + aheadKm)); },
    takeErrors() { const n = errors; errors = 0; return n; },
    project(lonLat) { const p = map.project(lonLat); if (p.x < -200 || p.x > 2120 || p.y < -200 || p.y > 1280) return null;
      const back = map.unproject(p); let dl = Math.abs(back.lng - lonLat[0]) % 360; if (dl > 180) dl = 360 - dl; // a far-side point un-projects to the near side
      if (dl * Math.cos(lonLat[1] * rad) > 1.5 || Math.abs(back.lat - lonLat[1]) > 1.5) return null; return { x: p.x, y: p.y }; },
    async apply(world, state) {
      const w = world.map || world || {}, dark = (state.theme ?? config.theme) === 'dark';
      if (cur.dark !== dark) { cur.dark = dark; for (const [lid, prop, L] of colourProps) if (!(progressLayers.has(L.id) && prop === 'line-color')) setPaint(lid, prop, colorExpr(L, dark));
        for (const [lid] of colourProps) if (lid.endsWith('-c')) setPaint(lid, 'circle-stroke-color', declById[lid.slice(0, -2)]?.stroke || (dark ? '#041B30' : '#FFFFFF')); }
      const c = w.cam || start; map.jumpTo({ center: [c.lng, c.lat], zoom: c.zoom, pitch: c.pitch || 0, bearing: c.bearing || 0 });
      // basemap and grade
      const B = BASE[w.basemap ?? (dark ? 'nasa-night' : 'light')], g = w.grade || {};
      setVis('bm', !!B); setVis('lights', !!B && ((g.lights ?? B.lights) > 0));
      if (B) { const [bmax, bmin, sat, con] = B.bm; setPaint('bm', 'raster-brightness-max', g.brightness ?? bmax); setPaint('bm', 'raster-brightness-min', g.brightnessMin ?? bmin);
        setPaint('bm', 'raster-saturation', g.saturation ?? sat); setPaint('bm', 'raster-contrast', g.contrast ?? con); setPaint('lights', 'raster-opacity', g.lights ?? B.lights); }
      const ex = w.terrain || 0; if (cur.terrain !== ex) { cur.terrain = ex; map.setTerrain(ex > 0 ? { source: 'dem', exaggeration: ex } : null); }
      if (cur.sky !== (w.sky || 'auto') + dark) { cur.sky = (w.sky || 'auto') + dark;
        map.setSky(w.sky === 'none' ? { 'atmosphere-blend': 0 } : dark ? { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 0.8, 7.5, 0] }
          : { 'sky-color': '#F2F5F9', 'horizon-color': '#FFFFFF', 'fog-color': '#FFFFFF', 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.55, 5, 0.35, 7.5, 0] }); }
      // declared layers: opacity, seeded reveal, line progress
      for (const [id, list] of Object.entries(groups)) {
        const v = (w.layers || {})[id] ?? 0, rev = (w.reveal || {})[id], lineState = (w.lines || {})[id];
        for (const [lid, prop, base] of list) {
          setVis(lid, v > 0.001); if (v <= 0.001) continue;
          setPaint(lid, prop, base * v);
          if (rev !== undefined && !lid.endsWith('-r')) setFilter(lid, rev >= 1 ? (declById[id].filter || null) : ['all', ['<=', ['get', 'k'], rev], ...(declById[id].filter ? [declById[id].filter] : [])]);
          if (progressLayers.has(id) && lineState && (lid.endsWith('-l') || lid.endsWith('-g'))) { const p = Math.max(0, Math.min(1, lineState.p ?? 1)), col = colour(declById[id].accent, dark);
            setPaint(lid, 'line-gradient', p >= 0.9995 ? ['interpolate', ['linear'], ['line-progress'], 0, col, 1, col]
              : ['interpolate', ['linear'], ['line-progress'], 0, col, Math.max(0.00001, p - 0.0005), lineState.head && lid.endsWith('-l') ? '#FFFFFF' : col, Math.max(0.00002, p), 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0)']); }
        }
      }
      const pk = JSON.stringify(w.pulses || []); if (cur.pulses !== pk) { cur.pulses = pk;
        map.getSource('pulses').setData({ type: 'FeatureCollection', features: (w.pulses || []).map(p => ({ type: 'Feature', properties: { c: colour(p.c, dark), r: p.r ?? 3, a: p.a ?? 1 }, geometry: { type: 'Point', coordinates: p.p } })) }); }
      await settle();
    },
  };
}
