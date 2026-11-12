// Storyboard key frames: each is one full state of the stage (camera, layers, routes, interface), rendered by stills.mjs.
import fs from 'node:fs';
const R = JSON.parse(fs.readFileSync('prep/routes.json')), P = R.places;
const plans = JSON.parse(fs.readFileSync('prep/plans.json')), est = JSON.parse(fs.readFileSync('prep/estimate.json'));
const CREDIT = 'Imagery: NASA Blue Marble and Black Marble · Data: OGL – Canada, Alberta · © TeleGeography, CC BY-NC-SA 3.0 (unconfirmed) · © OpenStreetMap contributors';
const chrome = (extra = {}) => ({ chrome: 1, credits: CREDIT, ...extra });
const lab = (id, o = {}) => ({ lonLat: P[id].lonLat, text: P[id].name.replace(/,.*$/, ''), ...o });
const on = (...ids) => Object.fromEntries(ids.map(i => [i, 1]));
const allRoutes = Object.fromEntries(Object.keys(R.routes).map(id => [id, { p: 1 }]));
const NS = Object.keys(R.routes).filter(k => k.startsWith('ns-'));
const pm = id => plans[id].result.metrics;

const boards = [
 { id: '01-cold-open', cam: { lng: -72, lat: 28, zoom: 2.15 }, grade: { brightness: 0.14, lights: 1 }, ui: chrome() },
 { id: '02-cables', cam: { lng: -42, lat: 44, zoom: 2.75 }, grade: { brightness: 0.2, lights: 1 }, groups: on('subsea_cables', 'landing_points'),
   ui: chrome({ callouts: [{ x: 96, y: 610, kicker: 'Subsea fibre cables · TeleGeography', big: '713', sub: 'cable systems carry data between continents', accent: '#6FD6EC' }] }) },
 { id: '03-canada-coasts', cam: { lng: -97, lat: 59, zoom: 2.85 }, grade: { brightness: 0.34, lights: 0.9 }, groups: on('subsea_cables', 'landing_points', 'boundaries'),
   ui: chrome({ callouts: [{ x: 96, y: 150, kicker: 'Cable landing points', big: '155', sub: 'of 1,928 landing points are on Canada\'s coasts', accent: '#6FD6EC' }],
     labels: [lab('vancouver', { side: 'l' }), lab('halifax'), lab('st-johns'), lab('prince-rupert', { side: 'l' }), lab('churchill', { kind: 'small' })] }) },
 { id: '04-alberta', cam: { lng: -113.6, lat: 53.6, zoom: 5.25, pitch: 50, bearing: -14 }, terrain: 1.5, grade: { brightness: 0.5, lights: 0.9, hill: 0.35 }, groups: { ...on('boundaries', 'critical_infra'), waterways: 0.6 },
   ui: chrome({ callouts: [{ x: 1824, y: 150, align: 'right', kicker: 'Critical infrastructure · NRCan CanVec', sub: 'Power lines, pipelines, plants and stations', note: 'Alberta has the energy and the land. It has no coast.', accent: '#F7D774' }],
     labels: [lab('edmonton', { kind: 'big' }), lab('calgary', { kind: 'big' }), lab('cold-lake', { kind: 'small' }), lab('lethbridge', { kind: 'small' }), lab('peace-river', { kind: 'small' })] }) },
 { id: '05-title', cam: { lng: -98, lat: 60, zoom: 2.6 }, grade: { brightness: 0.22, lights: 0.5 }, groups: { boundaries: 0.8 },
   ui: chrome({ card: { kind: 'title', kicker: 'Agency 2026 · Demo 11', lines: ['Pan-Canadian', 'Fibre Optics Planner'], sub: 'A map and route solver for planning a fibre network across Canada.' } }) },
 { id: '06-layers-corridors', cam: { lng: -106, lat: 59.5, zoom: 2.95 }, grade: { brightness: 0.42, lights: 0.4 }, groups: on('boundaries', 'roads', 'rail', 'waterways', 'ports'),
   ui: chrome({ panel: { tab: 'Layers', on: on('boundaries', 'roads', 'rail', 'waterways', 'ports'), pulse: { roads: 1 }, scroll: 330 },
     callouts: [{ x: 1824, y: 150, align: 'right', kicker: 'Corridors', big: '27,903', size: 104, sub: 'highway segments, and 1,669 rail lines', accent: '#F6A693' }] }) },
 { id: '07-layers-communities', cam: { lng: -106, lat: 59.5, zoom: 2.95 }, grade: { brightness: 0.42, lights: 0.4 }, groups: { ...on('boundaries', 'indigenous_lands', 'indigenous_communities', 'military'), roads: 0.35 },
   ui: chrome({ panel: { tab: 'Layers', on: on('boundaries', 'roads', 'rail', 'waterways', 'ports', 'indigenous_lands', 'indigenous_communities', 'military'), pulse: { indigenous_lands: 1 }, scroll: 900 },
     callouts: [{ x: 1824, y: 150, align: 'right', kicker: 'Communities and constraints', big: '3,387', size: 104, sub: 'reserves, land-claim areas and Métis Settlements', note: '689 First Nations and Inuit community points · 978 military sites', accent: '#F6A693' }] }) },
 { id: '08-layers-north', cam: { lng: -112, lat: 66.5, zoom: 3.55, pitch: 38, bearing: 8 }, grade: { brightness: 0.45, lights: 0.3 }, groups: { ...on('boundaries', 'permafrost', 'remote_communities'), waterways: 0.5, roads: 0.5 },
   ui: chrome({ panel: { tab: 'Layers', on: on('boundaries', 'roads', 'waterways', 'permafrost', 'remote_communities'), pulse: { permafrost: 1 }, scroll: 640 },
     callouts: [{ x: 1824, y: 150, align: 'right', kicker: 'Terrain · AAFC', big: '1,020', size: 104, sub: 'ecodistricts mapped for permafrost', note: '276 remote communities are off the main power grid', accent: '#C3BBE6' }] }) },
 { id: '09-layers-connectivity', cam: { lng: -100, lat: 52.5, zoom: 3.9, pitch: 30, bearing: 0 }, grade: { brightness: 0.36, lights: 0.25 }, groups: { ...on('boundaries', 'broadband_fibre', 'fixed_link_sites', 'broadband_communities') },
   ui: chrome({ panel: { tab: 'Layers', on: on('boundaries', 'broadband_fibre', 'fixed_link_sites', 'broadband_communities'), pulse: { broadband_fibre: 1 }, scroll: 120 },
     callouts: [{ x: 1824, y: 150, align: 'right', kicker: 'Telecommunications · ISED', big: '14,915', size: 104, sub: 'hexagons where a provider reports fibre', note: '20,939 fixed radio link sites · 661 communities with no fibre backbone nearby', accent: '#B5DE7C' }] }) },
 { id: '10-route-south-rockies', cam: { lng: -115.9, lat: 51.25, zoom: 6.6, pitch: 66, bearing: 78 }, terrain: 1.7, grade: { brightness: 0.6, lights: 0.7, hill: 0.3 }, groups: { ...on('boundaries'), roads: 0.7, waterways: 0.6, rail: 0.5 },
   routes: { 'ew-south': { p: 0.158, head: 1 } },
   ui: chrome({ callouts: [{ x: 96, y: 150, kicker: 'Southern east-west route', big: '7,264 km', size: 104, sub: 'Victoria to St. John\'s, along the Trans-Canada main line', accent: '#6FB8F0' }], labels: [lab('golden', { kind: 'small' }), lab('calgary', { kind: 'big' })] }) },
 { id: '11-routes-all', cam: { lng: -104, lat: 60, zoom: 2.9 }, grade: { brightness: 0.36, lights: 0.6 }, groups: { ...on('boundaries', 'ports'), roads: 0.25 },
   routes: { ...allRoutes, 'ew-north-atl': { p: 1 }, 'ew-north-pac': { p: 1 } },
   ui: chrome({ panel: { tab: 'Routes', on: on(...Object.keys(R.routes)), pulse: { 'ns-ab': 1 } },
     callouts: [{ x: 1824, y: 150, align: 'right', kicker: 'Modeled routes', big: '15', sub: 'two east-west routes and thirteen north-south', note: 'Dashed: subsea, indicative. Dotted: not routed, no road or rail corridor.', accent: '#B5DE7C' }],
     labels: [lab('victoria', { side: 'l', kind: 'small' }), lab('st-johns', { kind: 'small' }), lab('prince-rupert', { side: 'l', kind: 'small' }), lab('churchill', { kind: 'small' }), lab('edmonton', { kind: 'small' })] }) },
 { id: '12-plan-solve', cam: { lng: -122.6, lat: 52.6, zoom: 5.15, pitch: 44, bearing: -8 }, terrain: 1.5, grade: { brightness: 0.5, lights: 0.6, hill: 0.3 }, groups: { ...on('boundaries'), roads: 0.55, rail: 0.5, waterways: 0.4 },
   search: { 'ab-pacific-yellowhead': { p: 0.62 } }, waypoints: [P.edmonton.lonLat, P.vancouver.lonLat],
   ui: chrome({ panel: { tab: 'Plan', name: 'Edmonton to Vancouver', waypoints: ['Edmonton', 'Vancouver'], stage: 'solving', progress: 0.62, settled: Math.round(0.62 * 11625), press: 0 },
     labels: [{ ...lab('edmonton'), n: 1 }, { ...lab('vancouver', { side: 'l' }), n: 2 }], cursor: { x: 150, y: 742 } }) },
 { id: '13-compare', cam: { lng: -122.6, lat: 52.9, zoom: 5.05, pitch: 40, bearing: -8 }, terrain: 1.5, grade: { brightness: 0.5, lights: 0.6, hill: 0.3 }, groups: { ...on('boundaries', 'ports'), roads: 0.3, waterways: 0.4, subsea_cables: 0.9, landing_points: 1 },
   routes: { 'ab-pacific-south': { p: 1 }, 'ab-pacific-yellowhead': { p: 1 }, 'ab-pacific-north': { p: 1 } },
   ui: chrome({ panel: { tab: 'Compare', show: 3, rows: [
       { name: 'Calgary to Vancouver', short: 'Calgary to Vancouver', color: '#E86BA5', m: pm('ab-pacific-south') }, { name: 'Edmonton to Vancouver', short: 'Edmonton to Vancouver', color: '#00AAD2', m: pm('ab-pacific-yellowhead') }, { name: 'Edmonton to Prince Rupert', short: 'Edmonton to Prince Rupert', color: '#F2C230', m: pm('ab-pacific-north') }] },
     labels: [lab('edmonton'), lab('calgary'), lab('vancouver', { side: 'l' }), lab('prince-rupert', { side: 'l' })] }) },
 { id: '14-draw-estimate', cam: { lng: -131, lat: 65.6, zoom: 4.6, pitch: 40, bearing: 10 }, terrain: 1.4, grade: { brightness: 0.5, lights: 0.3, hill: 0.25 }, groups: { ...on('boundaries', 'permafrost', 'remote_communities'), waterways: 0.6, roads: 0.6 },
   routes: { 'ns-nt': { p: 1 }, sketch: { p: 1 } },
   ui: chrome({ panel: { tab: 'Draw lines', line: { name: 'Mackenzie Valley line', method: 'Buried' }, est: est.lines.buried.lines[0], showCost: 1 },
     labels: [{ lonLat: [-133.7297, 68.3609], text: 'Inuvik', n: 3 }, { lonLat: [-126.8316, 65.2811], text: 'Norman Wells', n: 2 }, { lonLat: [-121.3527, 61.8609], text: 'Fort Simpson', n: 1 }] }) },
 { id: '15-finale', cam: { lng: -101, lat: 52, zoom: 2.75 }, grade: { brightness: 0.24, lights: 1 }, groups: { ...on('boundaries', 'subsea_cables', 'landing_points'), roads: 0.3 },
   routes: { ...allRoutes, 'ew-north-atl': { p: 1 }, 'ew-north-pac': { p: 1 }, 'ab-pacific-south': { p: 1 }, 'ab-pacific-yellowhead': { p: 1 }, 'ab-pacific-north': { p: 1 } },
   ui: chrome({ callouts: [{ x: 960, y: 800, align: 'center', sub: 'Planning the routes that connect Alberta to the world.', accent: '#6FD6EC' }], labels: [lab('edmonton', { kind: 'big' })] }) },
 { id: '16-end', cam: { lng: -101, lat: 50, zoom: 2.1 }, grade: { brightness: 0.1, lights: 0.35 }, groups: { boundaries: 0.4 },
   ui: chrome({ credits: '', card: { kind: 'end', dates: 'Dec. 7–9, 2026 · Edmonton · Calgary', kicker: 'Demo 11', title: 'Pan-Canadian Fibre Optics Planner',
     sources: ['Data: Natural Resources Canada, ISED, AAFC, Indigenous Services Canada, Transport Canada, Government of Alberta (Open Government Licence – Canada, Alberta)', 'Submarine cable data © TeleGeography, CC BY-NC-SA 3.0 (unconfirmed) · © OpenStreetMap contributors (ODbL) · Imagery: NASA Blue Marble, Black Marble · Terrain: Mapzen terrain tiles'] } }) },
];
fs.writeFileSync('boards.json', JSON.stringify(boards));
console.log(boards.length, 'boards');
