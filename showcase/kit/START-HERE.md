# Start here

You are making an Agency 2026 showcase film for one project in the inventory. Read this page first, then the
`showcase-film` skill (`.claude/skills/showcase-film/SKILL.md` in the repo, installed for SHELL at `/mnt/data/projects/.claude/skills/showcase-film/`) for the rules and phases, and
`RECIPE.md` for the checklist. `README.md` is the reference for every API.

## The reference film: #11

Film #11, the Pan-Canadian Fibre Optics Planner, is the bar ("excellent", the owner, 2026-11-11). Everything in this kit
was learned making it.

| What | Where |
|---|---|
| The film (3:17, 1080p60) | `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/deliver/` (master on disk: see its README) |
| Every step, every fault and its fix | `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/PROCESS-LOG.md` |
| Every figure and its source | `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/NOTES.md` |
| A full timeline (globe, chase camera, panel, cursor, charts) | `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/film/web/timeline.js` |
| The owner's words | `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/owner_lines.txt` |
| This kit's 8 s smoke film | inputs in `example/`; render it yourself to see it (about 1 minute on 10 cloud tasks) |

## One command to start

```bash
cd showcase/kit && npm ci                                  # once (Playwright, MapLibre, sharp)
# from an Agency 2026 inventory slot (the inventory is read, never written; $AGENCY_INVENTORY to point elsewhere):
node tools/new-film.mjs 23 --kind map                      # --kind app|map|data; --theme dark for a dark film (light is the Agency default)
# or from scratch, for any project, with no inventory:
node tools/new-film.mjs --name water-quality --title "North Saskatchewan Water Quality" --kind map --brief brief.json
```

The film folder is made in `$FILMS_DIR` (default: a `films/` folder next to the repo, outside git, because frames and masters are
large), with its own ports, Cloud Run job name and seeded trace art. Open the folder, read `brief.md` and `SENSITIVITY.md` (binding),
then pick a path. `--brief` takes the same keys as an inventory row (`program`, `nature`, `folders`, `repos`, `live_urls`,
`suggested_video_angle`, `gaps`, `sensitivity`), all optional.

## Three kinds of film

| Kind | Use it for | Starter |
|---|---|---|
| `app` | web apps, dashboards, chat tools, forms, data products: the app's own screens as plates | `templates/timeline-app.js` |
| `map` | a project whose story is a place: its own geographic layers on the map stage (globe, terrain, routes) | `templates/timeline-map.js` |
| `data` | no app to film and no map: a programme, a study, a result told with big numbers, ranked bars, re-drawn tables and one statement | `templates/timeline-data.js` (every value is a labelled example until replaced from `NOTES.md`) |

## Look: theme and grounds

- `film.config.json` `"theme": "light"` (default, the Agency board: white ground, navy ink) or `"dark"` (night ground).
  A state can override it for one scene: `return { theme: 'dark', ... }` for a night map inside a light film.
- `bg.kind`: `board` (white, behind app screenshots in a light film), `paper` (quiet alternate), `night` / `navy` (dark
  films, chapter moments), `spectrum` (blue, once per film, the line to remember), `none` (a map stage covers the frame),
  `stars` (only for a globe seen from space; never behind an app screenshot). Leave it out to get the theme's ground.
- Accents are names (`accent: 'cyan'`, `color: 'green'`): the kit picks the text-safe value for the theme and the raw fill
  for bars, spots and lines. `node tools/contrast.mjs` checks every text style in both themes (all pass at 4.5:1 or more).
- Circuit traces appear on title and end cards only (BRAND.md). `new-film` makes both versions of the art with one seed.

## Path A: app film (the app's own screens)

For most projects: web apps, dashboards, chat tools, forms, data products.

1. Run the app (or open its live URL) and write `capture/states.script.json`: each state is a list of steps (go to a URL,
   click, type, wait) and `marks` (elements whose boxes you want for spotlights and cursor targets).
2. `node tools/capture-states.mjs --project <film>` writes `capture/<state>.png` and `capture/states.json` (sizes, boxes).
   For motion, `node tools/capture-video.mjs` records an interaction as an image sequence (exact; prefer it to WebM).
3. Check every capture against `SENSITIVITY.md` before it goes into a plate.
4. Build `web/timeline.js` from the starter: plates on a virtual camera (push-in, tilt, browser frame), spotlights on the
   marked boxes, the cursor travelling between `plate:<id>:x,y` targets, callouts and ranked bars for real figures,
   re-drawn glass panels where the real UI is too small to read. Ground: `board` in a light film.

## Path B: map film (the app's own geographic data)

For projects whose story is a place: #18 (AI data centre policy and irrigation), #23 (North Saskatchewan water quality),
#5 and #6 (corridor and flood simulators), #41 (rail). The stage is `web/modules/map-stage.js` (MapLibre globe, NASA
relief and night lights through the kit's caching tile proxy, frozen clock, load errors fatal).

1. **Find the data.** The inventory row's `folders` say where the app lives; its layer files are usually in the app's
   public or data folder.
2. **Mount it read-only** in `film.config.json`: `"mounts": { "/swq/": "<app>/client/public/layers/surface-water-quality/vector/" }`.
   `.geojson.gz` files are served with gzip encoding, so MapLibre reads them as they are.
3. **Declare the layers** in `"map": { "start": {lng, lat, zoom}, "layers": [...] }`: `id`, `file`, `type` (`fill`,
   `line`, `circle`, `heatmap`, `raster`), `accent`, and options (`width`, `radius`, `opacity`, `glow`, `progress` for a
   line that draws on, `filter`, `colorBy` for per-feature colours).
4. **Drive them** from `stateAt(t).world.map`: `cam`, `basemap` (`light` for light films, `nasa-night` for dark), `layers`
   (opacity), `reveal` (seeded appearance), `lines` (progress and head), `pulses`. Labels go in `ui.labels` with `lonLat`
   and hide themselves on the far side of the globe. A camera that follows a line (a river, a route) uses
   `stage.along(id, share)` and `stage.heading(id, share)` inside `H.smoothPath`. Never point the camera straight at the
   moving head (that was #11's jitter).
5. **Basemap detail.** NASA tiles stop at zoom 8 (about 600 m a pixel). For city or river-reach shots, use the app's own
   licensed basemap: add it to `TILES` in `server.mjs` (the proxy caches it) and declare it as a `raster` layer. Check its
   licence and attribution first. Put every credit in `ui.credits` and on the end card.

### Worked example: #23 North Saskatchewan River Water Quality

- Inventory: main app `/mnt/data/projects/hilary/app/server/src/prototypes/surface-water-quality`; layers in
  `/mnt/data/projects/hilary/app/client/public/layers/surface-water-quality/vector/` (`nsr-mainstem`, `swqmf-stations`,
  `major-sub-watersheds`, `edmonton-drainage-outfalls`, `river-wqi` …, all `.geojson.gz`), catalogue in
  `catalogue-base.json` (titles, sources, licences, which layers are synthetic).
- Sensitivity: station positions, triggers and public layers are real; **every monitoring value is synthetic**, so the film
  must say so on screen and in narration. The stations file is marked internal use. Confirm with the owner that EPA is
  comfortable before release.
- Suggested angle (inventory): fly down the river from Devon to Pakan, and show how one map replaces scattered scripts to flag
  where water quality exceeds its triggers.
- Starter: `node tools/new-film.mjs 23 --kind map`, then mount the vector folder as `/swq/`, declare `river`
  (`nsr-mainstem`, line, `progress: true`), `stations` (circle), `basins` (fill, low opacity), and start the camera at
  `{ lng: -113.2, lat: 53.62, zoom: 8.6 }`. A proof frame of exactly this rendered correctly on 2026-11-11 (KIT-LOG.md).
- #18 is similar, with layers in `/mnt/data/projects/aidc-policy/irrigation-api/data/` (`districts`, `suitability`,
  `irrigation_all`, `province` …). Its Policy Simulator is marked "Pre-decisional. Advice to Minister": film only the public
  parts or synthetic positions, and ask the owner first.

## Path D: architecture explainer (the network stage)

For films that explain how a system is built and how work flows through it, to a layperson: `--kind network`. Describe the system as
zones, nodes and edges in `film.config.json` `network`, then follow one request end to end before showing many. Rules: one new idea per
shot, name every part before it moves, at most about seven labelled things on screen, zoom to what the narration is about
(`web/modules/README.md`, `README.md`).

## Then, for every path

Dry run → stills → storyboard for the owner → narration → preview every 2 s → cloud render → mix → encode → QA → deliver
→ clean up. The skill has the detail; `RECIPE.md` has the commands. Render frames only in the Cloud Run job
(`cloud/farm.sh`), never on the shared VM, and never stop a process you did not start.
