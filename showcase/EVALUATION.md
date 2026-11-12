# Evaluation: the showcase film kit and film #11 (2026-11-12)

## What the kit is

A production pipeline for narrated, music-cut 1080p60 films of real projects, generalised from film #11. One film is one folder:
`film.config.json`, a timeline (`web/timeline.js`), captures, narration, notes and logs. The kit serves its engine at `/kit/`, the
design repo's brand files at `/brand/` and the film's files at `/`, so a fix to the kit reaches every film.

- **The frame contract.** `stateAt(t)` is a pure function that returns the whole picture: ground, plates, an optional stage (the map
  module), and the interface (chrome, callouts, ranked bars, glass panels, caption, statement, cards, cursor, labels).
  - `window.film.frame(n)` draws frame n and rejects on any load error.
  - `window.filmInitErrors` makes start-up load errors fatal.
  - The stills tool, the storyboard and the cloud job all use the same contract, so any frame range can be rendered anywhere.
- **Tools.**
  - Starting and capturing: `new-film` (namespaced ports, Cloud Run job and image per film), state capture with exact element
    boxes, and interaction capture as exact image sequences.
  - Sound and narration: song analysis (librosa) and narration (ElevenLabs v4 with word timestamps; only changed lines are voiced).
  - Review and checks: a storyboard page for sign-off, a dry run, stills, a camera-speed check and a contrast check over both themes.
  - Rendering and delivery: a Cloud Run **job** farm (100 tasks at once, frames PUT to a token-checked receiver on the VM), then
    mix, encode, and frame QA (pops, layer dropouts).
- **Look.** The stylesheet carries the Agency tokens in light and dark themes, plus the grounds (board, paper, night, navy, spectrum,
  stars). Accents are named, so text stays readable in both themes. The kit also supplies the chrome, the classification pill, and
  seeded trace art on the title and end cards.

## The quality bar: #11

The 3:17 film has 11,856 frames:
- a 3D globe with terrain and NASA relief and night lights;
- 713 subsea cables drawn on, and ranked international landings;
- the planner's 23 layers ticked in its own re-drawn panel;
- a smoothed chase camera along the 7,264 km southern route;
- real `api/solve` and `api/estimate` answers;
- a climax on the music's energy peak, and the end card with every source.

Every figure is in `NOTES.md` with its source and the misleading-truth check. The owner caught one figure that was true but
misleading, and the kit's rules now require that check. It rendered on 100 tasks in about 45 minutes.

## Gaps and risks found

| # | Finding | Effect | Fixed by |
|---|---|---|---|
| 1 | The kit and film moved into `agency-2026/`; the kit's docs, the skill and the shared `CLAUDE.md` still pointed at `/mnt/data/projects/showcase-film-kit` and `/mnt/data/projects/pan-canadian-fibre-optics-simulation`; `new-film`, `server.mjs` and `cloud/build-context.sh` hard-coded the design repo path | broken commands for the next film | `tools/lib/paths.mjs`: the kit finds the repo, brand, films folder and inventory relative to itself or from `AGENCY_DESIGN`, `AGENCY_BRAND`, `FILMS_DIR`, `AGENCY_INVENTORY`; docs and skill updated; `CLAUDE.md` line given to the owner |
| 2 | Intake only from an inventory slot | only the 41 inventory projects could start a film | `new-film --name <slug> --title … [--brief brief.json]` for any project |
| 3 | Two kinds only (app, map) | data stories without an app or map had no starter | `--kind data` with `templates/timeline-data.js` (title, big number, hero ranked bars, re-drawn table, statement on spectrum, end card from the event tokens; every value a labelled example) |
| 4 | Card art made before the owner's 2026-11-11 look changes | risk of thick ribbons or the chip on new films | default art regenerated with the repo's thin-trace generator; title art keeps its left edge clear of the title (the title starts 200 px in) |
| 5 | The chrome used the live-text wordmark SVG inside an `<img>` | an image SVG cannot use the page's fonts: "Agency" could fall back to another face in the cloud image | the outlined wordmarks (`agency-2026-wordmark-outlined.svg`, `-white-outlined.svg`), which carry the trace underline |
| 6 | Narration voice and settings hard-coded in `narrate.mjs` | could drift from the registry | `narrate.mjs` reads `brand/voice/voices.json`, refuses an unregistered voice, notes a voice that is only proposed, and runs `scripts/lint/lint.py` on every line (`--strict` stops on an error) |
| 7 | Music only from a file path | films could not share the event's sound library | `"music": "cue:<id>"` resolves a cue from `brand/audio/cues.json` |
| 8 | Colours copied into `web/film.css` | silent drift from `tokens.json` | `tools/sync-tokens.mjs [--fix]` checks the 38 colour tokens (all match today) |
| 9 | `docker build` on the default bridge | downloads stall on SHELL VMs (bridge MTU 1500 over a 1460 NIC) | `farm.sh` builds with `--network host`; project and region overridable (`FARM_PROJECT`, `FARM_REGION`) |
| 10 | Callouts could not be enlarged | a centred chart was too small to read on a stage screen | callouts take `scale` (used by the data starter) |
| 11 | #11's own engine hard-coded the planner path and port 3222 | a second film or session on 3222 would collide; the planner path broke on the move | `FIBRE_PLANNER` and `FILM_PORT` in the reference film's server and tools |
| 12 | The repo root ignores `*.mp4` | the motion examples never reached GitHub; previews would not either | `showcase/.gitignore` re-includes the phone previews; the root rule is for the lead to revisit |

## Verified from the repo (2026-11-12)

- **Setup:** `npm ci` (35 packages).
- **`tools/contrast.mjs`:** every text style meets its minimum in both themes.
- **`tools/sync-tokens.mjs`:** 38 tokens match.
- **Kit example:** the dry run covers 480 frames with no errors or bad numbers; three stills render, with the new wordmark in the chrome.
- **New data film from scratch** (`--name`, no inventory): the dry run is clean, and six stills were reviewed and fixed (title art, chart
  scale, table size, dark chrome on the spectrum frame).
- **Reference #11 from `showcase/reference`, against the planner data on disk:** the dry run covers 11,856 frames with no errors and
  no bad camera values; stills render at 25, 95 and 190 s.
- **Cloud smoke render of the example from the repo kit:**
  - Deploy took 23 s with a cached base image.
  - It rendered 480 of 480 frames on 10 tasks in 57 s, about 12 frames a second.
  - The mix came out at -16 LUFS / -2.0 dBTP and the encode produced the master, share and phone copies.
  - The job was deleted, the receiver stopped, and no smoke job remains.

## Not brought into git

| What | Why |
|---|---|
| The film's frames, tile cache and node modules | large and generated |
| #11 master (581 MB) and share copy (156 MB) | too large for git |
| The planner app (`refs/`, `solo/`, `team/`) and the compiled solver copy | the planner's code belongs in its own private repo (`GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK` at `2610761`) |
| The project inventory | internal; read in place through `AGENCY_INVENTORY` |
| The render farm's token | a secret |

The masters stay on the VM, and their paths are in the reference README. A GitHub Release is the place to publish them.
