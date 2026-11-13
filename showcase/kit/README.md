# Showcase film kit

**New here? Open `START-HERE.md` first.**

The production kit behind Agency 2026 film #11 (Pan-Canadian Fibre Optics Planner), generalized for every showcase project:
real screenshots and recordings of the app on a cinematic virtual camera, re-drawn UI in the Agency look, narration, music,
captions, and frame-exact rendering in a temporary Cloud Run job. The instructions agents follow are the `showcase-film` skill
(`.claude/skills/showcase-film/SKILL.md` in the repo, installed for SHELL at `/mnt/data/projects/.claude/skills/showcase-film/`); `RECIPE.md` is the one-page checklist.

```bash
cd showcase/kit            # in the AIDE-AGENCY-2026-DESIGN repo
node tools/new-film.mjs 23 --kind map          # film folder from inventory slot #23 (--kind app|map|data, --theme light|dark)
node tools/new-film.mjs --name my-film --title "My Project" --kind data   # or from scratch, no inventory
node tools/contrast.mjs                         # every text style against its ground, both themes
F=../../../films/23-<slug>   # $FILMS_DIR, default: next to the repo (outside git)
node tools/dryrun.mjs --project $F              # every frame evaluates
node tools/still-at.mjs --project $F --times 2,10,30
cloud/farm.sh deploy $F && cloud/farm.sh render $F missing && cloud/farm.sh wait $F
node tools/mix-audio.mjs --project $F && tools/encode.sh $F
cloud/farm.sh cleanup $F
```

## How a film is built

- **One folder per film** (`new-film.mjs`): `film.config.json` (slot, slug, dur, fps, music, ports, cloud job and image names,
  extra `mounts`), `web/timeline.js`, optional `web/stage.js` and `web/film.css`, `capture/`, `assets/`, `narration/`, `prep/`,
  `NOTES.md`, `owner_lines.txt`, `PROCESS-LOG.md`, `brief.md`, `SENSITIVITY.md`, `intake.json`. Outputs go to `out/` (frames, mix,
  captions) and `deliver/`.
- **The kit serves the engine** at `/kit/` (`server.mjs --project <dir>`), the Agency brand files at `/brand/`, npm packages at
  `/vendor/`, and the film's own files at `/`. Fixes to the kit reach every film.
- **The frame contract** (`web/main.js`): `window.filmReady`, `window.filmInitErrors` (a renderer refuses a page that started with
  load errors), `window.film.frame(n)` (draws frame n; rejects on any load error). Every renderer (stills, storyboard, cloud job)
  uses it.

## The timeline API

`web/timeline.js` exports `DUR`, `FPS` and `createTimeline({ config, timing, stage, helpers })` returning `{ stateAt(t) }`.
`stateAt(t)` must be pure. It returns:

| Key | What it draws |
|---|---|
| `theme` | optional `'light' \| 'dark'` for this frame; default `film.config.json` `theme` (light, the Agency default). Swaps every colour token, the logos and the card art |
| `bg` | `{ kind: 'board' \| 'paper' \| 'night' \| 'navy' \| 'spectrum' \| 'stars' \| 'none', glow, lift }` an Agency ground (missing kind = the theme's ground). `stars` only for globe/space shots |
| `world` | handed to the optional stage (e.g. the map module, `web/modules/README.md`) |
| `plates` | real material on a virtual camera: `src` (screenshot), `seq` (image sequence from `capture-video.mjs`), or `video`; `w, h, x, y, cam {cx, cy, s}, rotX, rotY, rotZ, a, z, frame: 'browser', url, radius, shadow, grade, dim, spots [{x, y, w, h, k}], overlays [{x, y, w, h, html, k}]` — geometry in the plate's own pixels, so spotlights and overlays stay locked to the UI; `cam` is a still framing (slow push-ins are not available: the dry run fails them) |
| `ui.chrome`, `bandTitle`, `credits`, `fade` | Agency chrome (wordmark, GoA signature, band, UNCLASSIFIED pill), credits line, fade to black |
| `ui.callouts` | big numbers with kicker, sub and note; `bars` for a ranked bar chart (one scale, values in text colour, one row highlighted); `panel: true` for a night-ground card |
| `ui.panels` | glass panels with any HTML: re-draw an app panel in the Agency look (`.row .cb .sw .btn .sl .select .input fieldset table .cost` widgets); `data-k` on any element makes it a cursor target |
| `ui.caption`, `ui.statement` | captions from the voice's word times (`helpers.captionsFrom`, `captionAt`); one large line revealed word by word |
| `ui.card` | title card (`kicker`, `lines`, `sub`) and end card (`dates`, `kicker`, `title`, `sources`) with the film's seeded circuit traces |
| `ui.cursor` | `helpers.cursorAt(t, [[time, target, press?], …])`; targets: `pt:x,y`, `plate:<id>:x,y`, `map:lng,lat`, or any `data-k` |
| `ui.labels` | `{ lonLat \| plate: [id, x, y] \| xy: [x, y], text, sub, n, kind, side }` |

`helpers`: `clamp lerp ss ramp win env bump outBack count mono track smoothPath captionsFrom captionAt cursorAt mulberry`.

Examples: `example/web/timeline.js` (8 s: a real screenshot plate with tilt, spotlight, cursor, callout, caption; the framing holds still);
`templates/timeline.js` (what `new-film` starts from); film #11's `film/web/timeline.js` (3:17 on the map stage).

## Tools

| Tool | Does |
|---|---|
| `tools/new-film.mjs <slot>` or `--name <slug> --title …` | film folder from an inventory row (read-only) or from scratch (`--brief`), kinds `app`, `map`, `data`; namespaced ports, job and image, seeded trace art |
| `tools/sync-tokens.mjs [--fix]` | `web/film.css` colours against `brand/tokens/tokens.json` (38 tokens) |
| `tools/capture-states.mjs` | screenshots of named app states plus exact element boxes (`marks`) |
| `tools/capture-video.mjs` | a recorded interaction → WebM → exact JPEG sequence, with step times |
| `tools/seam-check.py <film>` | a farm task that drew its chunk differently (stale page): islands and boundary jumps, from the frames and their write order |
| `tools/analyze_song.py <song> <out.json>` | tempo, downbeats, energy per second, sections (needs librosa: `python3 -m venv v && v/bin/pip install librosa soundfile`) |
| `tools/storyboard.mjs` | key frames rendered from the timeline + `storyboard.json` → `storyboard/index.html` to publish for sign-off |
| `tools/narrate.mjs` | the approved narrator from `brand/voice/voices.json` (Matilda, eleven_v4), word timestamps, voices changed lines only, runs the repo lint (`scripts/lint/lint.py`) on every line, reports overlaps |
| `tools/dryrun.mjs`, `tools/still-at.mjs`, `tools/camcheck.mjs` | every frame evaluates; chosen seconds as JPEGs; camera speed and shake |
| `tools/mix-audio.mjs` | voice at cues, music ducked, sound effects from `out/sfx-events.json` (`--no-sfx` skips; stem `out/sfx.wav`), -16 LUFS / -2.3 dBTP (`peakTP`), SRT + VTT; `"music": "cue:<id>"` takes a cue from `brand/audio/cues.json` |
| `tools/sfx-events.mjs` | reads the film's `SFX` events (`web/timeline.js`), checks the ids against the palette, warns on crowding, writes `out/sfx-events.json` |
| `tools/sfx.mjs` | the sound-effect palette (`brand/audio/sfx`): `list`, `generate`, `check`; see `guides/SOUND.md` "Sound effects" |
| `tools/encode.sh <film>` | master (CRF 15), share copy, phone preview under 30 MB |
| `tools/find-pops.py`, `tools/layer-present.py` | frame QA: short flickers; an element missing over a range |
| `cloud/farm.sh deploy\|render\|status\|wait\|missing\|cleanup <film>` | the Cloud Run job farm |

## The cloud farm

`farm.sh` builds an image (the Playwright image, kit at `/app/kit`, the film at `/app/project`, extra mounts copied in), creates
or updates the film's job (`shell-<dev>-film-<slot>`, 4 vCPU / 8 GiB a task, VPC connector `sandbox-vpc-connector`, region
`northamerica-northeast1`), starts this film's receiver on the VM's private address (its own port and token), and runs one
execution over the frames you ask for. Each task renders a contiguous share and PUTs JPEGs to the receiver. A Cloud Run
*service* stalled at about 12 instances; *jobs* ran 100 tasks at once. With several films rendering, each film is capped to a
share of about 100 tasks in all (`FARM_TOTAL_TASKS`).

## Smoke test (2026-11-11)

`example/`: 8 s, 480 frames. Dry run clean; cloud render on 10 tasks in about 90 s (about 9 frames a second); encode: 480 of 480
frames, -16.1 LUFS, -2.0 dBFS peak; job deleted afterward. The output is not kept: render the example again to see it.

The example music is an excerpt of the owner's track for film #11; use each film's own music.

## Themes and the map stage (added 2026-11-11)

- **Themes.** `film.config.json` `"theme": "light" | "dark"`; a frame may set `theme` for one scene. `web/film.css` holds both token
  sets; components use only the variables. Accent names (`'cyan'`, `'green'`) resolve to `--t-<name>` for text and `--f-<name>` for
  fills. On light scenes the chrome uses `agency-2026-wordmark.svg` and `goa-signature.png`; on dark ones the `-white` files. The
  navy classification band and the navy caption bar are the same in both.
- **Map stage.** `"stage": "/kit/modules/map-stage.js"` and a `"map"` block in `film.config.json` (layers from the film folder or
  `mounts`). See `web/modules/README.md` and the "map film" path in `START-HERE.md`.

## In the design repo (2026-11-12)

The kit lives in `AIDE-AGENCY-2026-DESIGN/showcase/kit` and finds everything relative to itself (`tools/lib/paths.mjs`): brand files in
`<repo>/brand`, films in `$FILMS_DIR` (default `<repo>/../films`), the inventory in `$AGENCY_INVENTORY` (optional). The reference film is
`/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/.` The rules for when to make a showcase film, and how, are in `guides/SHOWCASE-FILM.md`.

## The network stage and architecture explainers (added 2026-11-12)

`node tools/new-film.mjs --name <slug> --title "…" --kind network` starts an **architecture explainer**: a film that helps a layperson
understand a system's parts, integrations, flows and opportunities. The stage is `web/modules/network-stage.js` (`"stage":
"/kit/modules/network-stage.js"` and a `"network"` block of zones, nodes and edges in `film.config.json`): a circuit-board plane in
perspective where requests and agents travel thin traces, stop at permission gates (allow, deny, ask a person), write lines to an audit
record, and containers scale from a dozen to thousands. `templates/timeline-network.js` is the four-act starter (what it is, architecture,
one request end to end, opportunities). API and legibility rules: `web/modules/README.md`. First film made with it: #1 Atlas.
