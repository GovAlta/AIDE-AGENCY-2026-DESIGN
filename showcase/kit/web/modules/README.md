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

## media-stage.js (`media.css`): existing 3D and 2D simulation footage in the Agency look

For films built on footage the product already made: construction films, flood replays, rooftop or splat renders, interface
recordings (first used for film #5, the Highway and Bridge Simulator; meant for #6 flood, #7 rooftop, the bridge splat and VSAI).
Enable with `"stage": "/kit/modules/media-stage.js"` and link `/kit/modules/media.css`. Drive it from `stateAt(t).world.media`; the
file header lists every field.

- **Plates.** An image or an image sequence (`seq: { pattern, fps, start, t }`, so frames stay a pure function of time in the cloud).
  `crop` (source px) leaves out a HUD the source burned in; `mode: 'window'` puts the footage in a glass window with a bezel and an
  optional title bar; `grow` 0..1 eases the window to full bleed (the signature move from an interface to its own render);
  `zoom` and `pan` give a slow push.
- **Grade.** `'agency'` (default) keeps footage clean and in full colour; `'soft'` a light touch; `'none'` for interface recordings; or
  `{ sat, con, bri, lift, cool }`. **No white washes, vignettes or haze over footage** (owner, film #5 review): legibility comes from the
  glass cards and from `scrims`, a soft patch the size of a text block plus a small margin at about 0.4.
- **Motion.** Never slow a clip below its real speed (a 30 fps source at 0.5x repeats each frame four times and reads as a low frame
  rate). Take a longer source range or cut to a second clip. Map film frames to source frames exactly (`seq.t` = source seconds);
  a 30 fps source on a 60 fps film then shows each frame twice, evenly.
- **Overlays.** `tags` pin a glass label to a source pixel (`at`), mapped through crop and grow, so a tag tracks the footage when the
  timeline keys `at` over time; `stage.toFrame(id, [sx, sy])` gives the frame point. `cards` take HTML built with `md.ledger`,
  `md.checks`, `md.range`, `md.chips` (export `md`). `band` is the Agency strip (glass or `solid` navy) with chapter, place and one
  number; `letterbox` uses the ground colour, not black; `credit` carries the imagery attribution.
- **Rules.** Every value in a card is the product's own, recorded in the film's `NOTES.md`. Prefer clean re-renders of the footage to
  cropping (a crop to clear a HUD enlarges about 1.5 times); re-set the source's own HUD values in glass rather than inventing new ones.
- Mockups of the three variants (full bleed + glass, glass windows that grow, cinema band):
  `/mnt/data/projects/agency-2026/showcase/05-highway-bridge/storyboard/mockups-sheet.jpg` (`web/mockups.js` there is a worked example).

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

## The spatial stage (`spatial-stage.js`, `spatial.css`): glass windows in 3D space

The light neumorphic-glass look (owner's choice for film #1, 2026-11-12): the product's own screens are frosted-glass **windows** at
different depths and angles on one soft, luminous ground; a camera travels through the space with depth of field; thin light **lines**
carry work from one window to the next; a **wall** of thousands of small cards recedes to a horizon for scale. Start a film with
`node tools/new-film.mjs --name <slug> --title "…" --kind spatial` (starter: `templates/timeline-spatial.js`, four acts).

Who owns what: the stage owns the space (camera, glass, focus, lines, wall, ground). The film owns what is inside each window: it
passes HTML as the window's `html` (its own screens and neumorphic controls, in the film's `web/screens.js` and CSS). The kit's `ui`
still draws headlines, big numbers, captions, the chrome and the cursor.

```js
// film.config.json: "stage": "/kit/modules/spatial-stage.js", "space": { "fov": 44, "maxGlass": 3, "maxBlur": 12, "bandH": 44 }
world: { space: {
  cam: { x, y, z, yaw, pitch, fov, focus, aperture },      // focus: a world z, a window id or [x, y, z]; aperture 0 = all sharp
  windows: [{ id, x, y, z, ry, rx, w, h, scale, html, a, glow: 'blue', hero: true, radius, cls, glass }],   // x, y, z = the centre
  lines: [{ id, from: 'ask#send@r', to: 'record#new@l', p, pulses: [u], ring, accent, a, label, front }],
  wall: { x, y, z, ry, rx, card: [w, h], gap, cols, rows, count }   // or blocks: { cols, rows, size: [c, r], gap, lit, labels }
          // + accents, labels, time, a, haze, front
  ground: { tint, glows: [{ x, y, z, accent, r, a }] } } }
```

World units are pixels: x right, y down, z toward the viewer. With the default camera the plane z = 0 maps one to one onto the frame.
Angles follow CSS (`ry` > 0 turns a window's right edge away); a camera with yaw = -ry faces that window squarely.

Helpers: `stage.frame([windows], pad, { yaw, pitch, fov, aperture, shift })` (a camera that fits those windows; pass the same objects you
give to `windows`), `stage.wallFrame(wall, share, pad, o)`, `stage.mix(a, b, u)`, `stage.orbit(cam, yaw, pitch)`,
`stage.enter(win, u)` / `stage.leave(win, u)`, `stage.F(fov)`, and, from the frame last drawn, `stage.project([x, y, z])` and
`stage.anchor('win#data-k@r')` (for `ui.labels` and the cursor; any `[data-k]` inside a window is also a cursor target by name).
Join camera keys with `H.track` so the camera travels instead of cutting (see the starter).

How it is built, and why:

- **Each window carries its own `matrix3d`** (projection x view x model, computed in JS). CSS `preserve-3d` groups cannot keep
  `backdrop-filter`, so there is no 3D group: windows are siblings, sorted by depth with `z-index`, and the stage decides which get real
  backdrop blur: sharp, near-flat windows (turned less than 30 degrees), the hero first, `maxGlass` at most. Turned or out-of-focus
  windows get the same glass as a translucent fill without the backdrop pass (it would not show, and it is the expensive part).
- **Depth of field** is a per-window blur from the thin-lens circle of confusion (distance from the sharp plane), capped at `maxBlur`
  and stepped in quarter pixels. A focus rack is `cam.focus` moving from one window's centre to the next.
- **A window that faces the camera squarely moves in whole pixels**, so its text does not shimmer between frames.
- **Lines** are drawn on canvas layers slotted between the windows: behind the two windows a line joins, in front of everything farther.
- **The wall is one canvas**: a homography per frame, then level of detail by a card's size on screen (rounded card with a label and an
  activity bar; card and bar; a dot). Blocks light one at a time (`blocks.lit`, fractional). 30,000 cards draw in about 40 ms.
- **A window's material never changes while it is visible.** Real backdrop glass or the frosted fill is decided by the window's own
  properties only (`glass: true | false`; default: its `hero` flag), never by its blur, angle or rank. Blur is continuous (no quarter-pixel
  steps) and the shadow is the same sharp or soft. Film #1 flickered on all three before this rule. Keep `hero` (and `glass`) constant for a
  window's whole life; raise `space.maxGlass` if a film marks more windows than the default 3. `snap: true` (whole-pixel placement) is for
  a still camera only. Prove it on rendered frames: `node tools/motion-check.mjs --project <film> --flicker out/frames` must print 0 flags.
- **Nothing about a visible window switches: not its filter, not its opacity reaching 1, not its layer.** The stage keeps a blur
  filter on every window at all times (0.02 px when sharp) and keeps opacity at 0.999 or below, because a window drawn with a filter (or
  inside an opacity group) takes another raster path than one without, and the change shows as a one-frame step in sharpness or fill.
  Screens follow the same rule for their own elements (`rise()` always writes an opacity below 1 and a transform).
- **Small blurs step.** The browser draws a Gaussian blur of about 0.3 to 2.5 px on screen with a few whole-number kernels, so a window
  whose depth-of-field blur drifts through that range (any focus rack, any camera move past a nearly sharp window) changes sharpness in
  single-frame steps: the same frames on every render, found only by the flicker check. For a film that must pass it, set the camera's
  `aperture: 0` and give softness by hand with the window's `soft` (px): 0 for everything meant to be read, a fixed 5 to 10 for
  background shapes, and let it change only while the window is also moving, fading or far below full opacity.
- **A film without WebGL renders on the farm with `"gpu": false`** (film.config.json): the page is composited on the CPU. With the
  software GPU, film #1's windows took a different fill for a frame or more at random frames (different frames on every render).
- **Real backdrop glass is not stable on the render farm.** With `backdrop-filter` windows, film #1's rendered frames had one-frame
  flashes of a window's fill (whole, or in a band the size of a raster tile) at frames where nothing in the state changed; one local
  browser never showed them. Waiting two animation frames and capturing until two screenshots agree (both now in the kit) removed most,
  not all. For a film that must pass the flicker check, set `"space": { "maxGlass": 0 }`: every window takes the frosted fill, which
  is drawn the same way every time.
- **No translucent or blurred image windows.** On the farm, a window holding an image at opacity 0.6 with a 7 px `soft` blur drew its lower
  half blank for single frames (film #3's floating title cards, 2026-11-12; frames 132 and 136, a luminance jump of 17 in that box).
  Bake the softness into the image (blur it and lift it toward the ground colour before the film), and show it at full opacity with
  `soft: 0`. Footage that must step back leaves (`stage.leave`) instead of dimming. `motion-check.mjs --flicker` now measures windows
  from opacity 0.3 up and skips frames where a window's own opacity is changing (it used to skip everything under 0.98).
- **Windows that overlap need a clear gap in depth.** The stage draws windows far to near by their centre's depth from the camera. Two
  overlapping windows at the same z (film #3's title cards) swapped order on alternate frames as the camera moved, a luminance jump of 10
  in the overlap. Give overlapping windows a few hundred pixels of z between them, or keep them apart on screen.
- **Inside a window, values change in fine steps.** A screen that rounds an opacity to tenths shows ten visible steps on a slow fade
  (film #1's Vector Studio window). Round to three decimals.
- **The same inner padding on all four sides.** A screen's root pads once (do not pad a wrapper inside it as well); anything anchored to
  the bottom sits at `bottom:` equal to the top padding; a screen's height in `SIZE` is its content plus the two paddings; text that
  streams in keeps its final place from the first frame (render the words still to come invisible) so a growing list never pushes the last
  row to the edge. Check every screen at u = 0.3, 0.7 and 1: `node tools/padding-check.mjs --project <film>` (bottom gap = top gap within 2 px).
- **The look is CSS variables** on `.sp-space` (`spatial.css`); `#stage.theme-dark` has a first set of dark values.

Legibility rules are the network stage's, plus: the sharp window is the one the narration is about; never more than one hero; keep text
that must be read on a window turned less than about 12 degrees; let the previous act's windows leave before the camera crosses them.
