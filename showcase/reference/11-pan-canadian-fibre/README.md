# Reference film #11: Pan-Canadian Fibre Optics Planner

The quality bar for every Agency 2026 showcase film. The owner called it "excellent" on 2026-11-11. It is a 3:17, 1080p60, narrated film
of the Pan-Canadian Fibre Optics Planner, cut to the owner's music. Every number on screen comes from the planner's own data or API.
The film has a 3D globe with terrain, a chase camera along the southern route, the planner's real panels re-drawn in the Agency look,
and ranked comparisons.

- **Watch:** `deliver/preview-720p-phone.mp4` (720p, 28 MB; captions `deliver/captions.srt`, `.vtt`).
- **At a glance:** `stills/contact-sheet.jpg` (16 key frames). **Storyboard the owner signed off:** `storyboard/index.html`.
- **Classification:** Unclassified (owner, 2026-11-11). The planner is an internal tool. Its military sites (OpenStreetMap) and
  critical infrastructure layers are public data, but frame them with care; the narration voice is processed outside Canada (fine for
  Unclassified).

## What is here

| Path | What |
|---|---|
| `NOTES.md` | Every figure on screen or spoken, with its source, method and date, and the caveats the film carries |
| `PROCESS-LOG.md` | Every step of production, every fault and its fix (the recipe this kit was generalised from) |
| `KIT-LOG.md` | What was generalised from this film into `showcase/kit` |
| `PR-LOG.md` | The planner pull request that brought the film's night look into the real app |
| `owner_lines.txt` | The owner's words, used word for word |
| `assets/forward-looking.mp3`, `assets/song-analysis.json` | The owner's music and its beat map (`tools/analyze_song.py`) |
| `film/` | The film's own engine (it predates the kit): `server.mjs` (static files and the tile proxy), `web/` (`timeline.js`, `map.js`, `ui.js`, `film.css`), `job.mjs` and `render.mjs` (Cloud Run render), `tools/` (narration, mix, encode, QA, and the figure tools `cable-countries.py`, `trace-solve.mjs`, `solve-plans.mjs`, `estimate-lines.mjs`) |
| `film/narration/` | `script.json` (the 18 lines with their start seconds), `timing.json` (word times), the voiced lines |
| `film/prep/` | Real planner API responses the film shows: `plans.json` (`POST api/solve`), `estimate.json` (`POST api/estimate`), `routes.json`, the solver search traces |
| `stills/contact-sheet.jpg` | 16 frames of the finished film |
| `deliver/` | The phone preview and captions |

Not in git, and where they are on the SHELL VM:

| What | Size | Where |
|---|---|---|
| Master, 1080p60 (CRF 15) | 581 MB | `/mnt/data/projects/agency-2026/#11 pan-canadian-fibre-optics-simulation/deliver/pan-canadian-fibre-optics-planner-1080p60.mp4` |
| Share copy, 1080p60 | 156 MB | same folder, `…-1080p60-share.mp4` |
| Frames (11,856 JPEGs), tile cache | 7 GB | `…/film/out/`, `…/film/cache/` |
| The planner (data layers for a re-render) | | `GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK` at commit `2610761` (private); a clone is in `…/refs/fibre-network` |

Masters belong in a GitHub Release of this repo or in the project's bucket, not in git.

## Run it again

```bash
cd showcase/reference/11-pan-canadian-fibre/film && npm ci
export FIBRE_PLANNER=/path/to/AIDE-PAN-CANADIAN-FIBRE-NETWORK   # at 2610761; its data/ feeds every layer
FILM_PORT=3291 node server.mjs &                                  # brand files come from this repo (or AGENCY_BRAND)
FILM_PORT=3291 node tools/dryrun.mjs                              # every frame evaluates
FILM_PORT=3291 node tools/still-at.mjs 95 out/check-95.jpg        # one frame
```

Checked from this location on 2026-11-12: dry run of all 11,856 frames with no errors and no bad camera values (0.12 ms a state,
39 captions); stills at 25, 95 and 190 s rendered correctly. Full renders run in the Cloud Run job, as the film did (`job.mjs`); see
`PROCESS-LOG.md` steps 23 onward, or make a new film with the kit instead.

The film was made before the owner's look changes of 2026-11-11 (thin traces only, no chip icon, the trace underline under "Agency").
Re-rendered from here, the chrome and end card pick up the current brand files; the kit applies all three rules to new films.

## What to copy for a new film

Start a new film with the kit (`showcase/kit`, `guides/SHOWCASE-FILM.md`), not from this folder. Use this film as the worked example:

| Scene in #11 | Time | In the kit |
|---|---|---|
| Cold open: the globe from space, night lights | 0–10 s | map stage, `basemap: 'nasa-night'`, `bg: { kind: 'stars' }` |
| 713 subsea cables draw on, then landing points | 10–20 s | a `line` layer with `progress: true`, `reveal`, a callout with `H.count` |
| International cables, ranked (Canada 7) | 20–32 s | a callout with `bars` (one scale, one row highlighted), the misleading-truth check in `NOTES.md` |
| Alberta: gas plants, power lines | 32–43 s | layer opacity envelopes (`env`), `ui.labels` with `lonLat` |
| Title card | 53 s | `ui.card` `kind: 'title'` with the film's seeded trace art |
| Layers ticked in the real panel | 64–106 s | a glass panel (`ui.panels`) re-drawn from the planner, `data-k` ticks, the cursor (`H.cursorAt`) |
| Chase camera along the southern route | 106–119 s | `stage.along(id, share)` and `stage.heading()`, smoothed with `H.smoothPath` (never aim at the moving head: the jitter fault in `PROCESS-LOG.md`) |
| All 15 modeled routes | 119–128 s | several `lines` with staggered `p` |
| Plan, Compare, Draw lines (real API answers) | 128–159 s | panels fed from `prep/*.json`; numbers only from the saved responses |
| Climax and end card | 168–197 s | `statement`, `ui.card` `kind: 'end'` with sources |
