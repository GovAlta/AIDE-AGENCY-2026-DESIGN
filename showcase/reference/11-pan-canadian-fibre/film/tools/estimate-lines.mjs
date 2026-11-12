// Sends the film's drawn line to the planner's real estimate API (POST api/estimate) and saves the answer.
// The line follows the "not routed" stretch of the Northwest Territories route (data/routes/ns-nt.json, gap "mackenzie-gap").
import fs from 'node:fs';
const API = process.env.PLANNER_URL || 'http://localhost:3111/';
const routes = JSON.parse(fs.readFileSync(new URL('../prep/routes.json', import.meta.url)));
const gap = routes.routes['ns-nt'].gaps[0];
const coords = [...gap.coords].reverse(); // south to north: Fort Simpson, Norman Wells, Inuvik
const out = { gap, lines: {} };
for (const method of ['buried', 'aerial', 'ploughed']) {
  const r = await fetch(API + 'api/estimate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lines: [{ id: 'mackenzie', method, coordinates: coords }] }) });
  const j = await r.json(); out.lines[method] = j;
  console.log(method, r.status, JSON.stringify(j).slice(0, 1500));
}
fs.writeFileSync(new URL('../prep/estimate.json', import.meta.url), JSON.stringify(out));
