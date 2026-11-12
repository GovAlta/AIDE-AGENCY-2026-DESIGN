# Optional world stages

A world stage draws under the plates (state.world). Enable one in `film.config.json`: `"stage": "/kit/modules/<file>.js"` or a
project file such as `"/stage.js"`. Contract:

```js
export async function createStage(el, { config, helpers }) {
  return {
    async apply(world, state) {},   // draw state.world; resolve when the frame is fully drawn (all tiles and data loaded)
    project(lonLat) {},             // screen point {x, y} for labels and the cursor, or null when hidden
    takeErrors() { return 0; },     // load errors since the last call (a frame with errors is rejected)
  };
}
```

## network-stage.js (architecture explainers, any product)

The diagram equivalent of the map stage: a circuit-board world of **zones**, **nodes** and thin **traces** seen through a perspective
camera, with **packets** (requests, agents, people, results) riding the traces, **permission gates** (allow, deny, ask a person), an
**audit ledger**, and **container spawn** (one tile to thousands, with level of detail). It is product-neutral: the architecture is data
in `film.config.json` `"network"`, and the timeline drives it through `stateAt(t).world.net`. Canvas 2D with its own projection, so a
frame costs 2 to 10 ms and renders anywhere (no WebGL). Both themes. The header of the file lists every field.

```bash
node tools/new-film.mjs --name my-platform --title "My Platform" --kind network   # starter: templates/timeline-network.js + an example network
```

- **Layout.** World units are pixels at zoom 1, so lay the board out inside x 80–1840, y 180–910. Nodes take a `pos` or fall into a grid
  in their zone. Traces are routed as horizontal and vertical runs with 45-degree bends and ring pads; edges that leave a node on the
  same side run as a bus. `via` adds waypoints; `route: "h" | "v" | "hv"` forces a shape.
- **Camera.** `stage.frame(ids, pad, tilt, rot)` returns the camera that fits those nodes or zones in the safe area *as seen at that
  tilt* (a tilted board looms at the bottom of the frame; the fit is measured on the projected corners). Join keys with `H.track`.
  Tilt 0 is a flat diagram; 45–58 is the cinematic view. Billboards (node tiles, packets, gates) shrink less than the board when far,
  so labels stay readable.
- **Flows.** A packet is `{ edge | path: ['a', 'b:rev'], u }`; the timeline moves `u`. To stop at a gate, run `u` to
  `stage.gateU(edge)`, set `gates[edge] = { open, result }`, then go on (allow), turn back (deny) or wait for a person (`ask: { to, p }`).
  Write the ledger line at the moment the gate decides. `stage.swarm(t, …)` makes many packets at once for the pull-back.
- **Scale-out.** `spawn: { zone, of, count }` fills a fixed grid from the centre outwards, so nothing jumps as the count grows;
  `stage.spawnFrame(zone, of, n, …)` frames the first n. Start close on a dozen, then pull back to the whole zone.
- **For laypersons.** `focus` ("you are here": the rest dims), `steps` (numbered pins on the flow), `notes` (plain-language captions
  with a leader line, kept inside the frame), `legend` (what a trace, a packet, a gate and a ledger line mean; show it once).
  Labels and the kit cursor attach with `ui.labels[].lonLat = stage.world('nodeId')` and `stage.along(edge, u)`.

**Legibility rules for an explainer** (the starter follows them):

1. One new idea per shot. A shot ends when the narration moves on.
2. Name every part before it moves: a zone appears, is named in plain words, and only then carries a packet.
3. Never more than about seven labelled things on screen. Gate labels show only while a gate decides; dim the rest with `focus`.
4. Point the camera at what the narration is about; let everything else step back (alpha), not vanish.
5. Four acts, in order: what it is, architecture, one request end to end, what it makes possible.
6. Every name, scope and ledger line is real and recorded in `NOTES.md`; label anything else as an example.

Measured 2026-11-12 (one niced software browser, load about 11): 1.6 ms a frame flat, 5 ms tilted with a flow, 9 ms with 1,200
containers, 10 ms for the dark many-packets shot. A network film renders in the cloud at plate-film speed.

## map-stage.js (generic, geographic films)

The first-class map stage. Declare layers in `film.config.json` and drive them from `stateAt(t).world.map`; the full field list is
in the file's header. It keeps every #11 lesson below (frozen clock, settle, fatal load errors, zoom expressions), adds per-theme
basemaps (`light` = NASA relief pale for light films, `nasa-night`, `nasa-day`, `none`), colours that follow the theme, seeded
`reveal`, line `progress` with a bright head, `pulses`, label projection with far-side occlusion, and `along` / `heading` /
`lengthKm` for follow cameras (always through `helpers.smoothPath`). Proven on the planner's layers (light and dark) and on #23's
own `.geojson.gz` layers (2026-11-11). NASA tiles stop at zoom 8; for closer shots add the app's own licensed basemap to `TILES`
in `server.mjs` and declare it as a `raster` layer.

## map.js (film #11 reference)

`map.js` is the MapLibre GL 6 globe from film #11, kept as a working reference. It draws the fibre planner's own layer files
and route results over NASA Blue Marble relief, Black Marble night lights and Mapzen terrain (the kit server proxies and caches
those tiles at `/tiles/…`). It is specific to that app's data (`/data/layers/*.geojson`, `/prep/routes.json`); copy it into a
project's `web/stage.js` and adapt `sources`, `add(...)` layers and the route code for another geographic app. Its `createMap`
API predates the stage contract: wrap it (`apply` = `cam`, `grade`, `group`, `route` calls then `settle()`; `project`; `takeErrors`).

What it teaches, and what any WebGL stage needs:

- `maplibregl.setNow(0)` freezes MapLibre's clock, and the style must have `transition: { duration: 0, delay: 0 }` and
  `fadeDuration: 0`; otherwise `map.loaded()` never turns true and frames depend on wall time.
- MapLibre 6 is ESM only: `import * as maplibregl from '/vendor/maplibre-gl/dist/maplibre-gl.mjs'` and `setWorkerUrl(...)`.
- Settle = two consecutive `idle` renders with `loaded() && areTilesLoaded()`; one `idle` can come before a newly shown source tiles.
- `map.on('error')` must count real load failures (not 404s) and fail the frame.
- Zoom-dependent widths must keep `['zoom']` as the top-level interpolate input (`zf()` helper).
- A camera that follows something irregular (a route head) must be time-smoothed (`helpers.smoothPath`), never pointed at it.
- Software WebGL costs about 2–7 s a frame for a globe and 10–13 s with 3D terrain on 8 vCPU. Render it in the cloud job.
