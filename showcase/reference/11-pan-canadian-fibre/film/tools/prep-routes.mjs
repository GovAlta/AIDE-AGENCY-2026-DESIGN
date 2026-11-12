// Turns the planner's precomputed route results (data/routes/*.json, result/3) into drawable lines for the film.
// No geometry is invented: land lines are the solver's legs joined in order; subsea and gap lines are copied as they are.
import fs from 'node:fs';
import path from 'node:path';
const DATA = path.join(process.env.FIBRE_PLANNER || path.resolve(import.meta.dirname, '../../refs/fibre-network'), 'data');
const CONFIG = path.join(process.env.FIBRE_PLANNER || path.resolve(import.meta.dirname, '../../refs/fibre-network'), 'config');
const index = JSON.parse(fs.readFileSync(path.join(DATA, 'routes/index.json')));
const places = JSON.parse(fs.readFileSync(path.join(CONFIG, 'places.json')));
const hav = (a, b) => { const R = 6371, t = Math.PI / 180, dl = (b[1] - a[1]) * t, dn = (b[0] - a[0]) * t;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * t) * Math.cos(b[1] * t) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const out = { routes: {}, places };
for (const r of index.routes) {
  const res = JSON.parse(fs.readFileSync(path.join(DATA, r.file)));
  const cfg = JSON.parse(fs.readFileSync(path.join(CONFIG, 'routes', `${r.id}.json`)));
  const bySeg = new Map();
  for (const leg of res.legs) {
    if (leg.status !== 'ok') continue;
    const line = bySeg.get(leg.segmentId) || [];
    const c = leg.geometry.coordinates;
    const flat = leg.geometry.type === 'MultiLineString' ? c.flat() : c;
    for (const p of flat) { const last = line[line.length - 1]; if (!last || last[0] !== p[0] || last[1] !== p[1]) line.push(p); }
    bySeg.set(leg.segmentId, line);
  }
  const land = [...bySeg.entries()].map(([seg, coords]) => { let km = 0; for (let i = 1; i < coords.length; i++) km += hav(coords[i - 1], coords[i]); return { seg, coords, km: +km.toFixed(1) }; });
  const waypoints = cfg.segments.filter(s => s.type === 'terrestrial').flatMap(s => s.waypoints.map(w => w.place ? { id: w.place, name: places[w.place].name, lonLat: places[w.place].lonLat } : { lonLat: w.lonLat }));
  out.routes[r.id] = { id: r.id, name: r.name, kind: r.kind, province: r.province || null, lengthKm: r.lengthKm, metrics: res.metrics, claim: res.claim,
    land, subsea: res.subsea.map(s => ({ seg: s.segmentId, name: s.name, km: s.km, lines: s.geometry.coordinates })), gaps: res.gaps.map(g => ({ seg: g.segmentId, km: g.km, reason: g.reason, coords: g.geometry.coordinates })),
    waypoints, warnings: res.warnings, limitations: res.limitations };
}
fs.mkdirSync(path.resolve(import.meta.dirname, '../prep'), { recursive: true });
fs.writeFileSync(path.resolve(import.meta.dirname, '../prep/routes.json'), JSON.stringify(out));
for (const r of Object.values(out.routes)) console.log(r.id.padEnd(9), String(r.lengthKm).padStart(9), 'km  land segs', r.land.map(l => `${l.seg}:${l.coords.length}pt/${l.km}km`).join(' '), '| subsea', r.subsea.map(s => `${s.seg} ${s.km}`).join(', '), '| gaps', r.gaps.map(g => g.km).join(','));
