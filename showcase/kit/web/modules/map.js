// The cinematic map: a MapLibre globe that draws the planner's own data files (data/layers/*.geojson, data/routes/*.json)
// over NASA relief imagery. Every data layer here is one of the planner's layer ids; nothing is drawn that is not in the data.
import * as maplibregl from '/vendor/maplibre-gl/dist/maplibre-gl.mjs';
maplibregl.setWorkerUrl('/vendor/maplibre-gl/dist/maplibre-gl-worker.mjs');
maplibregl.setWorkerCount(4);
maplibregl.setNow(0); // freeze MapLibre's clock: no time-based fades, every frame is a pure function of the state we set
export const C = { navy: '#022C4C', night: '#041B30', white: '#FFFFFF', soft: '#A9C1D6',
  purple: '#6F2C83', blue: '#0177CD', lilac: '#9C90C5', pink: '#E86BA5', coral: '#EE7A63', orange: '#EE9A2E', yellow: '#F2C230', green: '#8DC63F', cyan: '#00AAD2',
  tBlue: '#6FB8F0', tCyan: '#6FD6EC', tGreen: '#B5DE7C', tOrange: '#F7BD6B', tYellow: '#F7D774', tPink: '#F7A8CB', tLilac: '#C3BBE6', tCoral: '#F6A693', tPurple: '#C9A2DB' };

const D = '/data/layers/';
const z = (...stops) => ['interpolate', ['linear'], ['zoom'], ...stops];
// zoom ramp scaled by a per-feature factor (zoom must stay the top-level interpolate input)
const zf = (f, ...stops) => ['interpolate', ['linear'], ['zoom'], ...stops.map((v, i) => i % 2 ? ['*', f, v] : v)];

// group id (the planner's layer id) -> list of [styleLayerId, opacityProp, baseOpacity]
export const GROUPS = {};
const layers = [];
function add(group, layer, prop, base = 1) {
  layer.layout = { ...(layer.layout || {}), visibility: 'none' };
  layer.paint = { ...(layer.paint || {}), [prop]: 0, [`${prop}-transition`]: { duration: 0, delay: 0 } };
  layers.push(layer);
  (GROUPS[group] ||= []).push([layer.id, prop, base]);
}

const sources = {
  bm: { type: 'raster', tiles: [location.origin + '/tiles/bm/{z}/{x}/{y}.jpg'], tileSize: 256, maxzoom: 8 },
  lights: { type: 'raster', tiles: [location.origin + '/tiles/lights/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 8 },
  dem: { type: 'raster-dem', tiles: [location.origin + '/tiles/dem/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 9, encoding: 'terrarium' },
  dem2: { type: 'raster-dem', tiles: [location.origin + '/tiles/dem/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 9, encoding: 'terrarium' },
};
const gj = (id, file, extra = {}) => { sources[id] = { type: 'geojson', data: file.startsWith('/') ? file : D + file, tolerance: 0.2, buffer: 32, ...extra }; };

gj('boundaries', 'boundaries.overview.geojson');
gj('world_land', 'world_land.overview.geojson');
gj('waterways', 'waterways.overview.geojson');
gj('roads', 'roads.overview.geojson');
gj('rail', 'rail.overview.geojson');
gj('critical_infra', 'critical_infra.overview.geojson');
gj('indigenous_lands', 'indigenous_lands.overview.geojson');
gj('indigenous_communities', 'indigenous_communities.overview.geojson');
gj('military', 'osm/military.overview.geojson');
gj('ports', 'ports.overview.geojson');
gj('broadband_fibre', 'broadband_fibre.overview.geojson');
gj('broadband_communities', 'broadband_communities.overview.geojson');
gj('fixed_link_sites', 'fixed_link_sites.overview.geojson');
gj('permafrost', 'permafrost.overview.geojson');
gj('population_centres', 'population_centres.overview.geojson');
gj('named_places', 'named_places.overview.geojson');
gj('remote_communities', 'remote_communities.overview.geojson');
gj('elevation_coverage', 'elevation_coverage.overview.geojson');
// subsea cables and landing points are loaded by createMap so each feature can carry a reveal order (k)
sources.subsea_cables = { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, tolerance: 0.2 };
sources.landing_points = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } };
gj('osm_telecom_lines', 'osm/telecom_lines.overview.geojson');

// ---- base
const base = [
  { id: 'bm', type: 'raster', source: 'bm', paint: { 'raster-fade-duration': 0, 'raster-resampling': 'linear', 'raster-brightness-max': 0.5, 'raster-saturation': -0.35, 'raster-contrast': 0.18 } },
  { id: 'hill', type: 'hillshade', source: 'dem2', paint: { 'hillshade-exaggeration': 0.0, 'hillshade-shadow-color': '#000814', 'hillshade-highlight-color': '#9fc4e8', 'hillshade-accent-color': '#000814', 'hillshade-illumination-direction': 315 } },
  { id: 'lights', type: 'raster', source: 'lights', paint: { 'raster-fade-duration': 0, 'raster-opacity': 0 } },
];

// ---- data layers, bottom to top
add('permafrost', { id: 'permafrost-fill', type: 'fill', source: 'permafrost', filter: ['in', ['get', 'zone'], ['literal', ['Continuous', 'Extensive discontinuous', 'Sporadic discontinuous', 'Isolated patches']]],
  paint: { 'fill-color': ['match', ['get', 'zone'], 'Continuous', '#d9d2ff', 'Extensive discontinuous', '#b3a8ee', 'Sporadic discontinuous', '#8f84cf', '#6f66a8'], 'fill-antialias': false } }, 'fill-opacity', 0.42);
add('elevation_coverage', { id: 'lidar-fill', type: 'fill', source: 'elevation_coverage', paint: { 'fill-color': C.green } }, 'fill-opacity', 0.28);
add('population_centres', { id: 'pop-fill', type: 'fill', source: 'population_centres', paint: { 'fill-color': C.yellow, 'fill-outline-color': C.tYellow } }, 'fill-opacity', 0.75);
add('indigenous_lands', { id: 'lands-fill', type: 'fill', source: 'indigenous_lands', paint: { 'fill-color': C.coral } }, 'fill-opacity', 0.38);
add('indigenous_lands', { id: 'lands-line', type: 'line', source: 'indigenous_lands', paint: { 'line-color': C.tCoral, 'line-width': z(2, 0.3, 6, 0.9) } }, 'line-opacity', 0.75);
add('broadband_fibre', { id: 'hex-fill', type: 'fill', source: 'broadband_fibre',
  paint: { 'fill-color': ['match', ['get', 'tech'], 'High-capacity transport', '#b98be0', 'Both', '#d7f59a', C.green], 'fill-antialias': true } }, 'fill-opacity', 0.62);
add('military', { id: 'mil-fill', type: 'fill', source: 'military', filter: ['!=', ['geometry-type'], 'Point'], paint: { 'fill-color': C.purple, 'fill-outline-color': C.tPurple } }, 'fill-opacity', 0.6);
add('waterways', { id: 'water-fill', type: 'fill', source: 'waterways', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#2a8fd6' } }, 'fill-opacity', 0.5);
add('waterways', { id: 'water-line', type: 'line', source: 'waterways', paint: { 'line-color': '#58b7f5', 'line-width': z(2, 0.35, 6, 1.1) } }, 'line-opacity', 0.75);
add('boundaries', { id: 'bound-glow', type: 'line', source: 'boundaries', paint: { 'line-color': '#7fc4ff', 'line-width': z(1, 2.5, 6, 6), 'line-blur': z(1, 3, 6, 6) } }, 'line-opacity', 0.28);
add('boundaries', { id: 'bound-line', type: 'line', source: 'boundaries', paint: { 'line-color': '#e9f4ff', 'line-width': z(1, 0.5, 6, 1.2) } }, 'line-opacity', 0.7);

add('rail', { id: 'rail-line', type: 'line', source: 'rail', paint: { 'line-color': C.tLilac, 'line-width': z(2, 0.5, 6, 1.6), 'line-dasharray': [3, 1.5] } }, 'line-opacity', 0.85);
add('roads', { id: 'roads-glow', type: 'line', source: 'roads', filter: ['==', ['get', 'tch'], true], paint: { 'line-color': C.coral, 'line-width': z(2, 2.5, 6, 7), 'line-blur': z(2, 2.5, 6, 6) } }, 'line-opacity', 0.45);
add('roads', { id: 'roads-line', type: 'line', source: 'roads', layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: { 'line-color': ['case', ['==', ['get', 'tch'], true], '#ffb09e', C.coral], 'line-width': zf(['case', ['==', ['get', 'tch'], true], 1.7, 1], 2, 0.4, 6, 1.5) } }, 'line-opacity', 0.9);

add('critical_infra', { id: 'ci-pipe', type: 'line', source: 'critical_infra', filter: ['==', ['get', 'kind'], 'Pipeline'], paint: { 'line-color': C.orange, 'line-width': z(2, 0.6, 6, 1.6), 'line-dasharray': [2.5, 1.5] } }, 'line-opacity', 0.9);
add('critical_infra', { id: 'ci-power-glow', type: 'line', source: 'critical_infra', filter: ['==', ['get', 'kind'], 'Power line'], paint: { 'line-color': C.yellow, 'line-width': z(2, 2, 6, 5), 'line-blur': z(2, 2, 6, 4) } }, 'line-opacity', 0.35);
add('critical_infra', { id: 'ci-power', type: 'line', source: 'critical_infra', filter: ['==', ['get', 'kind'], 'Power line'], paint: { 'line-color': C.tYellow, 'line-width': z(2, 0.45, 6, 1.3) } }, 'line-opacity', 0.95);
add('critical_infra', { id: 'ci-pts', type: 'circle', source: 'critical_infra', filter: ['all', ['==', ['geometry-type'], 'Point'], ['!=', ['get', 'kind'], 'Tower']],
  paint: { 'circle-color': ['match', ['get', 'kind'], 'Power plant', C.yellow, 'Gas processing plant', C.orange, 'Petroleum refinery', C.coral, 'Dam', C.cyan, 'Transformer station', C.tYellow, '#ffffff'],
    'circle-radius': zf(['match', ['get', 'kind'], 'Petroleum refinery', 1.8, 'Power plant', 1.2, 1], 2, 0.9, 6, 3), 'circle-stroke-color': '#041B30', 'circle-stroke-width': z(2, 0, 5, 0.6) } }, 'circle-opacity', 0.95);
add('critical_infra', { id: 'ci-tower', type: 'circle', source: 'critical_infra', filter: ['==', ['get', 'kind'], 'Tower'], paint: { 'circle-color': '#fff3c4', 'circle-radius': z(2, 0.45, 6, 1.6) } }, 'circle-opacity', 0.7);

add('fixed_link_sites', { id: 'fls', type: 'circle', source: 'fixed_link_sites', paint: { 'circle-color': C.pink, 'circle-radius': z(2, 0.7, 6, 2.2), 'circle-blur': 0.25 } }, 'circle-opacity', 0.9);
add('broadband_communities', { id: 'bbc', type: 'circle', source: 'broadband_communities',
  paint: { 'circle-color': ['case', ['==', ['get', 'backbone'], 'Fibre backbone nearby'], '#cfe3f5', C.orange], 'circle-radius': zf(['case', ['==', ['get', 'backbone'], 'Fibre backbone nearby'], 1, 2.1], 2, 0.6, 6, 2) } }, 'circle-opacity', 0.9);
add('named_places', { id: 'places', type: 'circle', source: 'named_places', paint: { 'circle-color': '#ffffff', 'circle-radius': z(2, 0.7, 6, 2.2) } }, 'circle-opacity', 0.85);
add('indigenous_communities', { id: 'ic', type: 'circle', source: 'indigenous_communities', paint: { 'circle-color': C.coral, 'circle-radius': z(2, 1.1, 6, 3), 'circle-stroke-color': '#fff', 'circle-stroke-width': z(2, 0.2, 6, 0.8) } }, 'circle-opacity', 0.95);
add('military', { id: 'mil-pt', type: 'circle', source: 'military', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': C.tPurple, 'circle-radius': z(2, 1, 6, 3), 'circle-stroke-color': C.purple, 'circle-stroke-width': 1 } }, 'circle-opacity', 0.95);
add('remote_communities', { id: 'remote-halo', type: 'circle', source: 'remote_communities', paint: { 'circle-color': '#ff5a4d', 'circle-radius': z(2, 4, 6, 10), 'circle-blur': 1 } }, 'circle-opacity', 0.55);
add('remote_communities', { id: 'remote', type: 'circle', source: 'remote_communities', paint: { 'circle-color': '#ff5a4d', 'circle-radius': z(2, 1.5, 6, 4), 'circle-stroke-color': '#fff', 'circle-stroke-width': z(2, 0.5, 6, 1.2) } }, 'circle-opacity', 1);
add('ports', { id: 'ports-halo', type: 'circle', source: 'ports', paint: { 'circle-color': C.cyan, 'circle-radius': z(2, 6, 6, 14), 'circle-blur': 1 } }, 'circle-opacity', 0.6);
add('ports', { id: 'ports', type: 'circle', source: 'ports', paint: { 'circle-color': '#041B30', 'circle-radius': z(2, 2.2, 6, 5), 'circle-stroke-color': C.tCyan, 'circle-stroke-width': z(2, 1, 6, 2) } }, 'circle-opacity', 1);

// telecom (display only in the planner, and here)
add('osm_telecom_lines', { id: 'osmtel', type: 'line', source: 'osm_telecom_lines', paint: { 'line-color': C.pink, 'line-width': z(2, 0.8, 7, 1.6) } }, 'line-opacity', 0.95);
add('subsea_cables', { id: 'cables-glow', type: 'line', source: 'subsea_cables', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['coalesce', ['get', 'color'], C.blue], 'line-width': z(0, 3, 3, 5, 6, 9), 'line-blur': z(0, 3, 3, 5, 6, 8) } }, 'line-opacity', 0.5);
add('subsea_cables', { id: 'cables', type: 'line', source: 'subsea_cables', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['coalesce', ['get', 'color'], C.blue], 'line-width': z(0, 0.7, 3, 1.2, 6, 2.2) } }, 'line-opacity', 1);
add('landing_points', { id: 'landings', type: 'circle', source: 'landing_points', paint: { 'circle-color': '#041B30', 'circle-radius': z(0, 0.9, 3, 1.8, 6, 4), 'circle-stroke-color': '#ffffff', 'circle-stroke-width': z(0, 0.5, 3, 0.9, 6, 1.6), 'circle-stroke-opacity': 0 } }, 'circle-opacity', 1);
GROUPS.landing_points.push(['landings', 'circle-stroke-opacity', 1]);

export const ROUTE_COLOR = { 'ew-south': C.blue, 'ew-north': C.orange, ns: C.green, plan: '#ffffff' };
export const ROUTE_CORE = { 'ew-south': '#8fd0ff', 'ew-north': '#ffd89a', ns: '#d8f5a8', plan: '#ffffff' };

export async function createMap(container) {
  const routesData = await (await fetch('/prep/routes.json')).json();
  // reveal order for cables: seeded shuffle, so the same cable always appears at the same moment
  const rnd = (seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(713);
  const cables = await (await fetch(D + 'telegeography/subsea_cables.overview.geojson')).json();
  for (const f of cables.features) f.properties.k = rnd();
  const landings = await (await fetch(D + 'telegeography/landing_points.overview.geojson')).json();
  for (const f of landings.features) f.properties.k = rnd();
  sources.subsea_cables.data = cables; sources.landing_points.data = landings;
  const style = { version: 8, transition: { duration: 0, delay: 0 }, projection: { type: 'globe' }, sources, layers: [...base, ...layers],
    sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 4.5, 0.9, 6.5, 0] },
    light: { anchor: 'map', position: [1.5, 90, 80] } };
  const map = new maplibregl.Map({ container, style, interactive: false, attributionControl: false, fadeDuration: 0, pixelRatio: 1, maxPitch: 78, renderWorldCopies: false,
    canvasContextAttributes: { preserveDrawingBuffer: true, antialias: !new URLSearchParams(location.search).has('noaa') }, center: [-96, 60], zoom: 2.4, maxTileCacheZoomLevels: 8 });
  // a tile that fails to load (other than a real 404) must fail the frame, never leave a hole in the picture
  let loadErrors = 0; map.on('error', e => { if (e?.error?.status !== 404) { loadErrors++; console.warn('map error', e?.error?.message || e); } });
  await new Promise(r => map.once('load', r));

  // ---- routes: one line source per continuous stretch, revealed with a line-gradient on line-progress
  const routeParts = {}; // routeId -> ordered [{srcId, km, kind}]
  const unwrap = lines => { const out = []; let off = 0, prev = null;
    for (const line of lines) for (const p of line) { let x = p[0] + off; if (prev !== null) { while (x - prev > 180) { x -= 360; off -= 360; } while (x - prev < -180) { x += 360; off += 360; } } if (prev === null || x !== prev || out[out.length - 1][1] !== p[1]) out.push([x, p[1]]); prev = x; }
    return out; };
  const lineCoords = {};
  const addLine = (id, coords, color, core, dashed, dotted) => {
    lineCoords[id] = coords;
    map.addSource(id, { type: 'geojson', lineMetrics: true, tolerance: 0.15, data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } } });
    const lay = { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' };
    map.addLayer({ id: id + '-glow', type: 'line', source: id, layout: lay, paint: { 'line-color': color, 'line-width': z(0, 7, 3, 11, 6, 18), 'line-blur': z(0, 6, 3, 9, 6, 14), 'line-opacity': dashed || dotted ? 0.35 : 0.7 } });
    map.addLayer({ id: id + '-core', type: 'line', source: id, layout: lay, paint: { 'line-color': core, 'line-width': z(0, 1.6, 3, 2.6, 6, 4.2), 'line-opacity': 1, ...(dashed ? { 'line-dasharray': [2.2, 2] } : dotted ? { 'line-dasharray': [0.3, 2] } : {}) } });
  };
  for (const r of Object.values(routesData.routes)) {
    const key = r.kind === 'ns' ? 'ns' : r.id; const color = ROUTE_COLOR[key], core = ROUTE_CORE[key]; const parts = [];
    const land = Object.fromEntries(r.land.map(l => [l.seg, l])); const sub = Object.fromEntries(r.subsea.map(s => [s.seg, s]));
    const push = (srcId, coords, km, kind) => { addLine(srcId, coords, color, core, kind === 'subsea', kind === 'gap'); parts.push({ srcId, km, kind }); };
    if (r.id === 'ew-south') { push('r-ew-south-salish', unwrap(sub['bc-salish'].lines), sub['bc-salish'].km, 'subsea'); push('r-ew-south-main', land.mainland.coords, land.mainland.km, 'land');
      push('r-ew-south-cabot', unwrap(sub.cabot.lines), sub.cabot.km, 'subsea'); push('r-ew-south-nl', land.newfoundland.coords, land.newfoundland.km, 'land'); }
    else if (r.id === 'ew-north') { push('r-ew-north-spine', land.spine.coords, land.spine.km, 'land'); }
    else { for (const l of r.land) push(`r-${r.id}-${l.seg}`, l.coords, l.km, 'land'); for (const g of r.gaps) push(`r-${r.id}-${g.seg}`, g.coords, g.km, 'gap'); }
    routeParts[r.id] = parts;
    if (r.id === 'ew-north') { // the two indicative subsea legs, drawn outward from the Canadian end
      const a = unwrap(sub['churchill-europe'].lines), p = unwrap(sub['prince-rupert-asia'].lines);
      addLine('r-ew-north-atl', a, color, core, true); addLine('r-ew-north-pac', p, color, core, true);
      routeParts['ew-north-atl'] = [{ srcId: 'r-ew-north-atl', km: sub['churchill-europe'].km, kind: 'subsea' }]; routeParts['ew-north-pac'] = [{ srcId: 'r-ew-north-pac', km: sub['prince-rupert-asia'].km, kind: 'subsea' }];
    }
  }

  // ---- the film's own plans, solved by the planner's API (prep/plans.json), with the recorded A* search (prep/trace-*.json)
  const plans = await (await fetch('/prep/plans.json')).json();
  const PLAN_COLORS = { 'ab-pacific-south': [C.pink, '#ffd3e6'], 'ab-pacific-yellowhead': [C.cyan, '#c9f3ff'], 'ab-pacific-north': [C.yellow, '#fff1b8'] };
  for (const [id, p] of Object.entries(plans)) {
    if (!p.scenario) continue;
    const coords = []; for (const leg of p.result.legs) for (const q of leg.geometry.coordinates) { const l = coords[coords.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) coords.push(q); }
    addLine('r-' + id, coords, PLAN_COLORS[id][0], PLAN_COLORS[id][1]);
    routeParts[id] = [{ srcId: 'r-' + id, km: p.result.metrics.lengthKm, kind: 'land' }];
    const tr = await (await fetch(`/prep/trace-${id}.json`)).json(); const n = tr.pts.length / 4, feats = [];
    for (let i = 0; i < n; i++) feats.push({ type: 'Feature', properties: { o: i / n }, geometry: { type: 'LineString', coordinates: [[tr.pts[i * 4 + 2], tr.pts[i * 4 + 3]], [tr.pts[i * 4], tr.pts[i * 4 + 1]]] } });
    map.addSource('s-' + id, { type: 'geojson', data: { type: 'FeatureCollection', features: feats }, tolerance: 0 });
    map.addLayer({ id: `s-${id}-all`, type: 'line', source: 's-' + id, layout: { visibility: 'none', 'line-cap': 'round' }, paint: { 'line-color': PLAN_COLORS[id][0], 'line-width': z(3, 1, 6, 2.2), 'line-opacity': 0.55 } }, 'r-' + id + '-glow');
    map.addLayer({ id: `s-${id}-front`, type: 'line', source: 's-' + id, layout: { visibility: 'none', 'line-cap': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': z(3, 2, 6, 4), 'line-blur': 1, 'line-opacity': 0.95 } }, 'r-' + id + '-glow');
  }
  // ---- the drawn line (Draw lines tab): the Northwest Territories "not routed" stretch, as sent to api/estimate
  const est = await (await fetch('/prep/estimate.json')).json();
  addLine('r-sketch', [...est.gap.coords].reverse(), '#ffffff', '#ffffff');
  routeParts.sketch = [{ srcId: 'r-sketch', km: est.gap.km, kind: 'land' }];
  // ---- waypoint pads
  map.addSource('waypoints', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({ id: 'wp-halo', type: 'circle', source: 'waypoints', paint: { 'circle-color': '#ffffff', 'circle-radius': 16, 'circle-blur': 1, 'circle-opacity': 0.5 } });
  map.addLayer({ id: 'wp', type: 'circle', source: 'waypoints', paint: { 'circle-color': '#041B30', 'circle-radius': 6.5, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2.5 } });

  // ---- travelling lights: points that move along the real lines (routes and cables)
  map.addSource('pulses', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({ id: 'pulse-halo', type: 'circle', source: 'pulses', paint: { 'circle-color': ['get', 'c'], 'circle-radius': ['*', ['get', 'r'], 5], 'circle-blur': 1, 'circle-opacity': ['get', 'a'] } });
  map.addLayer({ id: 'pulse-core', type: 'circle', source: 'pulses', paint: { 'circle-color': '#ffffff', 'circle-radius': ['get', 'r'], 'circle-blur': 0.35, 'circle-opacity': ['get', 'a'] } });
  const hav = (a, b) => { const t = Math.PI / 180, dl = (b[1] - a[1]) * t, dn = (b[0] - a[0]) * t, h = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * t) * Math.cos(b[1] * t) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  const indexLine = coords => { const cum = [0]; for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + hav(coords[i - 1], coords[i])); return { coords, cum, km: cum[cum.length - 1] }; };
  const at = (L, km) => { km = Math.max(0, Math.min(L.km, km)); let lo = 0, hi = L.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L.cum[m] <= km) lo = m; else hi = m; }
    const f = (km - L.cum[lo]) / Math.max(1e-9, L.cum[hi] - L.cum[lo]), a = L.coords[lo], b = L.coords[hi]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
  const lineIndex = {}; // srcId -> indexed line
  for (const [rid, parts] of Object.entries(routeParts)) for (const part of parts) lineIndex[part.srcId] = indexLine(lineCoords[part.srcId]);
  const cableLines = []; for (const f of cables.features) for (const line of (f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates])) { const L = indexLine(line); if (L.km > 150) cableLines.push({ L, color: f.properties.color || C.blue, ph: rnd() }); }

  const cur = {}; // last applied values, to skip redundant style calls
  const setPaint = (id, prop, v) => { const k = id + '|' + prop, s = typeof v === 'object' ? JSON.stringify(v) : v; if (cur[k] === s) return; cur[k] = s; map.setPaintProperty(id, prop, v); };
  const setVis = (id, on) => { const k = id + '|vis'; if (cur[k] === on) return; cur[k] = on; map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); };

  const api = {
    map, routesData, routeParts,
    group(id, v) { for (const [lid, prop, b] of GROUPS[id]) { setVis(lid, v > 0.001); setPaint(lid, prop, b * v); } },
    // progress 0..1 along the whole route (all its parts in order); alpha fades the whole route
    route(id, p, alpha = 1, headGlow = 0) {
      const parts = routeParts[id]; const total = parts.reduce((s, x) => s + x.km, 0); let acc = 0;
      for (const part of parts) {
        const lp = Math.max(0, Math.min(1, (p * total - acc) / part.km)); acc += part.km;
        const on = lp > 0.0005 && alpha > 0.001;
        for (const suf of ['-glow', '-core']) {
          const lid = part.srcId + suf; setVis(lid, on); if (!on) continue;
          const col = suf === '-glow' ? map.getPaintProperty(lid, 'line-color') : map.getPaintProperty(lid, 'line-color');
          const baseOp = suf === '-glow' ? (part.kind === 'land' ? 0.7 : 0.35) : 1;
          setPaint(lid, 'line-opacity', baseOp * alpha);
          if (part.kind === 'land') {
            const c = cur[lid + '|basecol'] ||= col;
            setPaint(lid, 'line-gradient', lp >= 0.9995 ? ['interpolate', ['linear'], ['line-progress'], 0, c, 1, c]
              : ['interpolate', ['linear'], ['line-progress'], 0, c, Math.max(0.00001, lp - 0.0004), suf === '-core' && headGlow ? '#ffffff' : c, lp, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0)']);
          }
        }
      }
    },
    plans, est, lineIndex, cableLines, at,
    takeErrors() { const n = loadErrors; loadErrors = 0; return n; },
    // reveal share for cables / landing points (features appear in their seeded order)
    reveal(group, p) { const k = group + '|reveal'; const q = Math.round(p * 1000) / 1000; if (cur[k] === q) return; cur[k] = q; const f = q >= 1 ? null : ['<=', ['get', 'k'], q];
      for (const [lid] of GROUPS[group]) if (cur[lid + '|f'] !== q) { cur[lid + '|f'] = q; map.setFilter(lid, f); } },
    pulses(list) { map.getSource('pulses').setData({ type: 'FeatureCollection', features: list.map(p => ({ type: 'Feature', properties: { c: p.c, r: p.r, a: p.a }, geometry: { type: 'Point', coordinates: p.p } })) }); },
    // replay of the solver's search: p = share of settled nodes shown (in the order the solver settled them)
    search(id, p, alpha = 1) {
      const on = p > 0 && alpha > 0.001;
      setVis(`s-${id}-all`, on); setVis(`s-${id}-front`, on && p < 1); if (!on) return;
      const k = `s-${id}|p`; if (cur[k] !== p) { cur[k] = p; map.setFilter(`s-${id}-all`, ['<=', ['get', 'o'], p]); map.setFilter(`s-${id}-front`, ['all', ['<=', ['get', 'o'], p], ['>', ['get', 'o'], p - 0.035]]); }
      setPaint(`s-${id}-all`, 'line-opacity', 0.55 * alpha); setPaint(`s-${id}-front`, 'line-opacity', 0.95 * alpha);
    },
    waypoints(list) { const s = JSON.stringify(list); if (cur.wp === s) return; cur.wp = s;
      map.getSource('waypoints').setData({ type: 'FeatureCollection', features: list.map(c => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } })) }); },
    // screen position of a place; null when it is on the far side of the globe
    project(lonLat) { const p = map.project(lonLat); if (p.x < -200 || p.x > 2120 || p.y < -200 || p.y > 1280) return null;
      const back = map.unproject(p); let dl = Math.abs(back.lng - lonLat[0]) % 360; if (dl > 180) dl = 360 - dl; // a point behind the globe un-projects to the near side instead
      if (dl * Math.cos(lonLat[1] * Math.PI / 180) > 1.5 || Math.abs(back.lat - lonLat[1]) > 1.5) return null; return { x: p.x, y: p.y }; },
    grade({ brightness = 0.5, saturation = -0.35, contrast = 0.18, lights = 0, hill = 0, brightnessMin = 0 } = {}) {
      setPaint('bm', 'raster-brightness-max', brightness); setPaint('bm', 'raster-brightness-min', brightnessMin); setPaint('bm', 'raster-saturation', saturation); setPaint('bm', 'raster-contrast', contrast);
      setPaint('lights', 'raster-opacity', lights); setPaint('hill', 'hillshade-exaggeration', hill);
    },
    terrain(ex) { const k = 'terrain'; if (cur[k] === ex) return; cur[k] = ex; map.setTerrain(ex > 0 ? { source: 'dem', exaggeration: ex } : null); },
    cam(c, padLeft = 0) { map.jumpTo({ center: [c.lng, c.lat], zoom: c.zoom, pitch: c.pitch || 0, bearing: c.bearing || 0, padding: { left: padLeft, right: 0, top: 0, bottom: 0 } }); },
    // wait until two renders in a row report every tile and source loaded (a single 'idle' can fire before a newly shown source has tiled)
    async settle() { let ok = 0; for (let i = 0; i < 80 && ok < 2; i++) { await new Promise(r => { map.once('idle', r); map.triggerRepaint(); }); ok = map.loaded() && map.areTilesLoaded() ? ok + 1 : 0; } },
  };
  return api;
}
