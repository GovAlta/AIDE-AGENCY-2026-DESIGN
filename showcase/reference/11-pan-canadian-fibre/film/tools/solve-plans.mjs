// Runs the film's planning scenarios through the planner's real API (POST api/solve on the running app) and saves the results.
import fs from 'node:fs';
const API = process.env.PLANNER_URL || 'http://localhost:3111/';
const W = { access: 0.5, water: 0, permafrost: 0, northRemoteness: 0, unknownData: 0.5 };
const plan = (id, name, places, extra = {}) => ({ schema: 'scenario/2', id, name, description: '', source: 'user',
  segments: [{ type: 'terrestrial', id: 'main', waypoints: places.map(place => ({ place })) }], weights: { ...W, ...(extra.weights || {}) }, exclusions: extra.exclusions || {}, ...(extra.rest || {}) });
const scenarios = [
  plan('ab-pacific-south', 'Calgary to Vancouver', ['calgary', 'vancouver']),
  plan('ab-pacific-yellowhead', 'Edmonton to Vancouver', ['edmonton', 'vancouver']),
  plan('ab-pacific-north', 'Edmonton to Prince Rupert', ['edmonton', 'prince-rupert']),
];
const out = {};
for (const sc of scenarios) {
  const r = await fetch(API + 'api/solve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: sc }) });
  const j = await r.json();
  if (!r.ok) { console.log(sc.id, r.status, JSON.stringify(j).slice(0, 300)); continue; }
  out[sc.id] = { scenario: sc, result: j };
  const m = j.metrics; console.log(sc.id.padEnd(24), m.lengthKm, 'km road', m.kmByKind.road, 'rail', m.kmByKind.rail, 'cross', JSON.stringify(m.waterCrossings), 'nearCI', m.kmNearCriticalInfra, 'nearIL', m.kmNearIndigenousLands, j.claim, 'legs', j.legs.map(l => l.status).join(','));
}
const cmp = await fetch(API + 'api/compare', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenarios }) });
out.compare = await cmp.json(); console.log('compare', cmp.status, Object.keys(out.compare));
fs.writeFileSync(new URL('../prep/plans.json', import.meta.url), JSON.stringify(out));
