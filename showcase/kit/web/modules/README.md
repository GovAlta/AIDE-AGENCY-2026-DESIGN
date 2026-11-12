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
