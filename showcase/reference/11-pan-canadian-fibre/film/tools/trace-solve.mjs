// Runs the planner's real A* solver with one added line: a hook that records the order in which the search settles nodes.
// The hook is applied to a private copy of the compiled solver (prep/solver-traced); the repo itself is not changed.
// Output: prep/trace-<id>.json = per leg, the settled nodes in order with their parent (so the film can replay the search), plus the result.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.env.FIBRE_PLANNER || path.resolve(import.meta.dirname, '../../refs/fibre-network');
const COPY = path.resolve(import.meta.dirname, '../prep/solver-traced');
fs.rmSync(COPY, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'dist-server'), path.join(COPY, 'dist-server'), { recursive: true });
fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(COPY, 'node_modules'));
fs.writeFileSync(path.join(COPY, 'package.json'), '{"type":"module"}');
const sj = path.join(COPY, 'dist-server/solver/search.js');
let src = fs.readFileSync(sj, 'utf8');
const needle = 's.done[n] = gen;';
if (src.split(needle).length !== 2) throw new Error('search.js changed: hook point not found exactly once');
src = src.replace(needle, needle + ' if (globalThis.__TRACE) globalThis.__TRACE.push(n, n === source ? -1 : s.prev[n]);');
fs.writeFileSync(sj, src);

const { openGraph, readGraphFiles } = await import(path.join(COPY, 'dist-server/server/graphFiles.js'));
const { loadConfig } = await import(path.join(COPY, 'dist-server/server/config.js'));
const { resolveScenario } = await import(path.join(COPY, 'dist-server/solver/resolve.js'));
const { runJob } = await import(path.join(COPY, 'dist-server/server/jobs.js'));
const files = readGraphFiles(path.join(ROOT, 'data/graph'));
const { graph, barriers } = openGraph(files);
const config = loadConfig(ROOT, files.meta);
const env = { graph, barriers, costModel: config.costModel, costModelSha256: config.costModelSha256, places: config.places };
const resolveCfg = { routes: config.routes, places: config.places, enabledLayers: config.enabledLayers ?? [] };

const plans = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../prep/plans.json')));
const g = graph, N = g.N, E = g.E;
const r5 = v => Math.round(v * 1e4) / 1e4;
for (const [id, p] of Object.entries(plans)) {
  if (!p.scenario) continue;
  globalThis.__TRACE = [];
  const rs = resolveScenario(p.scenario, resolveCfg);
  const [res] = runJob(env, { items: [{ scenario: rs, requestSha256: 'film-trace' }] });
  const tr = globalThis.__TRACE; globalThis.__TRACE = null;
  if (!res.ok) { console.log(id, 'FAILED', res.error); continue; }
  // settled nodes -> [lon, lat, parentLon, parentLat]; nodes >= N are the temporary source/target and are skipped
  const pts = [];
  for (let i = 0; i < tr.length; i += 2) {
    const n = tr[i], ref = tr[i + 1];
    if (n >= N) continue;
    let parent = -1;
    if (ref >= 0 && ref < E) { const u = g.edgeUndirectedId[ref]; parent = g.undirA[u] === n ? g.undirB[u] : g.undirA[u]; }
    pts.push(r5(g.nodeLon[n]), r5(g.nodeLat[n]), parent >= 0 && parent < N ? r5(g.nodeLon[parent]) : r5(g.nodeLon[n]), parent >= 0 && parent < N ? r5(g.nodeLat[parent]) : r5(g.nodeLat[n]));
  }
  const same = Math.abs(res.result.metrics.lengthKm - p.result.metrics.lengthKm) < 1e-6;
  fs.writeFileSync(path.resolve(import.meta.dirname, `../prep/trace-${id}.json`), JSON.stringify({ id, settled: pts.length / 4, graphNodes: N, lengthKm: res.result.metrics.lengthKm, sameAsApi: same, pts }));
  console.log(id.padEnd(24), 'settled', pts.length / 4, 'of', N, 'nodes; length', res.result.metrics.lengthKm, 'km; matches the API result:', same);
}
