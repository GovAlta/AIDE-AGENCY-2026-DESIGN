# Kit log: from film #11 to a reusable showcase-film kit (2026-11-11)

| # | Step | Result |
|---|------|--------|
| 1 | Kit folder `/mnt/data/projects/showcase-film-kit/` | Engine served at `/kit/`, films hold only their own files; kit fixes reach every film |
| 2 | Engine `web/main.js` | Frame contract: `filmReady`, `filmInitErrors` (fatal start-up load errors), `film.frame(n)` rejects on load errors |
| 3 | `web/plates.js` | Real screenshots / image sequences / recordings on a virtual camera: push-in, zoom-to-region, tilt, browser frame, spotlights, overlays, all in plate px |
| 4 | `web/ui.js`, `film.css` | Generic chrome, callouts, ranked bars, glass panels with the re-drawn widgets of #11, captions, statement, cards, cursor (panel, plate, map or point targets), labels |
| 5 | `web/helpers.js` | `mono`, `track`, `smoothPath` (the chase-jitter fix, generalized), `captionsFrom`, `cursorAt`, `count`, … |
| 6 | `web/modules/map.js` | #11's MapLibre globe kept as the reference geographic stage, with its lessons |
| 7 | Tools | new-film (inventory slot → namespaced folder, ports, job, seeded traces, sensitivity), capture-states, capture-video, storyboard, narrate (+ lint, overlaps), mix (-2.0 dBTP), encode (sub-30 MB preview), dryrun, still-at, camcheck, find-pops, layer-present |
| 8 | `cloud/` | job.mjs, receiver.mjs, build-context.sh, farm.sh (deploy, render, status, wait, missing, cleanup); per-film job/image/port; task share across concurrent films |
| 9 | Smoke film `example/` | 8 s, 480 frames: dry run clean; cloud render 10 tasks ≈ 90 s; 480/480 frames, -16.1 LUFS, -2.0 dBFS; job deleted |
| 10 | Capture tools tested against the kit stage | states + element boxes; recording → 170 frames; sequence plate with spotlight, cursor and plate label through a tilt |
| 11 | Skill `/mnt/data/projects/.claude/skills/showcase-film/SKILL.md` | Phases, rules, pitfalls, time and cost; pointer added to `/mnt/data/projects/CLAUDE.md` |
| 12 | Coordinator additions | Intake from the inventory slot (read-only); sensitivity binding (SENSITIVITY.md); one folder per film under `/mnt/data/projects/agency-2026/films/`; namespaced job, image and ports; task cap when several films render |

## Fixes found while proving the kit

- farm.sh status misread empty fields (awk on whitespace) → csv output.
- The phone preview filled 28 MB even for 8 s → bitrate capped at 4 Mb/s.
- layer-present flags planned fades → documented: leave fades out of the range.
- new-film first copied the sample timeline, which needs captures a new film lacks → a starter timeline that runs at once.

## Upgrade: grounds, light theme, map stage, START-HERE (2026-11-11, owner feedback)

Owner: "Why were there stars in the background of the test", "we need light mode styles", and a clear starting point for other
agents, including geospatial films (#18 AIDC policy and irrigation, #23 river water quality).

| # | Step | Result |
|---|------|--------|
| U1 | `web/background.js` | Agency grounds from `brand/tokens/tokens.json`: `board`, `paper`, `night`, `navy`, `spectrum`, plus `stars` (explicit only, globe/space shots) and `none`. A missing kind takes the theme's ground. The example and starter timelines now use `board` |
| U2 | `web/film.css` rewritten on tokens | `#stage.theme-light` (default) and `.theme-dark`: ground, ink, soft, field, lines, panels, shadows, halos, captions, bars, pins, plates, fade, shade. Accent names map to `--t-*` (text-safe per theme) and `--f-*` (fills) |
| U3 | `web/main.js`, `web/ui.js`, `web/plates.js` | `config.theme`, per-frame `state.theme` override; logo files swap by theme; card art `traces-*-light.svg` on light; accent names in callouts and spots; spotlight shade washes to white on light; long titles shrink to fit |
| U4 | `tools/contrast.mjs` | 38 text styles, both themes, all ≥ 4.5:1 (lowest: light yellow accent 5.07, light green 5.10, light orange 5.09) |
| U5 | `web/modules/map-stage.js` | Generic map stage on the frame contract: layers declared in config, `world.map` state (cam, basemap `light`/`nasa-night`/`nasa-day`/`none`, grade, terrain, layers, reveal, lines with progress and head, pulses, sky), theme-following colours, fatal load errors, two-idle settle, far-side label occlusion, `along`/`heading`/`lengthKm` for smoothed follow cameras |
| U6 | `server.mjs` | `.geojson.gz` / `.json.gz` served with gzip encoding (#23 ships its layers that way) |
| U7 | `tools/new-film.mjs` | `--kind app|map`, `--theme light|dark`; starter `templates/timeline-app.js` / `timeline-map.js`; map config skeleton; trace art made for both grounds with one seed |
| U8 | `cloud/build-context.sh` | brand tokens copied into the container too |
| U9 | `START-HERE.md`; pointers in `SKILL.md` and `README.md`; `web/modules/README.md` | the first file to open: #11 as reference, one command, app path, map path, worked #23 walk-through, #18 notes |
| U10 | Proof (scratchpad, deleted after) | Example plate still light and dark; a map film on the planner's layers (title card, light map, dark map); a #23 frame from its own `.geojson.gz` layers (river with progress head, stations, basins). Dry runs clean. One niced browser, load 5–47 from other sessions |

Not done: the example MP4 was not re-rendered (its frames still have the old star ground; re-render with `cloud/farm.sh` when
needed). NASA tiles stop at zoom 8, soft at river scale; START-HERE says how to add an app's licensed basemap.
