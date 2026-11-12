---
name: showcase-film
description: Make an Agency 2026 showcase film (2–5 minutes, 1080p60, narrated, cut to the owner's music) for an inventory project or any other project (app, map/geospatial, or data story) — real screenshots and screen recordings of the app on a cinematic virtual camera, re-drawn UI in the Agency look, real data and real figures, rendered frame-exact in a temporary Cloud Run job. Use when asked for a "showcase film", "Agency demo video", "cinematic demo/simulation of <app>", "a film like #11 (the fibre planner)", or invoked as /showcase-film #<slot> or /showcase-film <project>.
---

**Read `showcase/kit/docs/LESSONS.md` before you start** (facts → look as rendered frames → script approved as text → picture → sheet reviews → cloud render; the framing, type and wording rules from films #1 and #2).

**First:** `bash /mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN/scripts/sync.sh` (GitHub `main` is the official version; the
local clone is a working copy, and this skill is a link into it). Change the repo only by commit and push.

# Showcase film

**Start with `/mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN/showcase/kit/START-HERE.md`** and `guides/SHOWCASE-FILM.md` in the design repo (`/mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN`, GitHub
`GovAlta-EMU/AIDE-AGENCY-2026-DESIGN`; clone it elsewhere and the kit finds everything relative to itself). They give the reference
film, the one command to scaffold a film (`node tools/new-film.mjs <slot>` from the inventory, or `--name <slug> --title "…"` for any
project), and the three kinds: `app` (the app's screens as plates), `map` (its geographic data on the map stage), `data` (a kinetic data
story with no app or map). Run `npm ci` in `showcase/kit` once.

The reference film is #11, the Pan-Canadian Fibre Optics Planner (`/mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN/`/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/:` `deliver/preview-720p-phone.mp4` the film,
`stills/contact-sheet.jpg`, `PROCESS-LOG.md` every step, `NOTES.md` every figure, `film/web/timeline.js` a full 3:17 timeline, and a
scene-by-scene map to the kit in its `README.md`). The kit is `/mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN/showcase/kit/` (read its `README.md` and `RECIPE.md`). Every tool runs with
`--project <film dir>`; frames are a pure function of their number, so any range can be re-rendered on any machine.

The bar: the owner called #11 "excellent" — the look of a film trailer, and every number, layer and screen real.

## Non-negotiables

1. **Real or nothing.** Every figure on screen or spoken comes from the app's own data, API, or a derivation you record in
   `NOTES.md` (inputs, method, date, sensitivity). No invented names, numbers, quotes or results. Label example values.
2. **A true number can still mislead.** For each headline figure, ask what a listener will infer, break it down, and compare
   it fairly with peers. (#11: "155 landing points on Canada's coasts" was true; 115 were small BC coastal systems; 7
   international cables land in Canada against 85 in the US. The owner caught it.)
3. **Sensitivity is binding.** The inventory row's `sensitivity` → `SENSITIVITY.md`. HIGH = synthetic or redacted data only.
   Never film credentials, tokens, git remotes, terminal logs with project IDs, service accounts, real personal names or case
   details. Check every capture and every frame sheet.
4. **The owner owns** conclusions, the closing line, asks, credit and the classification (default Unclassified). Ask; store
   their words in `owner_lines.txt`; use them word for word (number words and an obvious typo fix only, then confirm).
5. **Agency design system** (`agency-design` skill; repo `/mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN`):
   tokens only (`tools/sync-tokens.mjs` checks `web/film.css`), Inter and Geist Mono, the classification pill on every frame, circuit traces
   only on title and end cards and **thin traces only, no chip icon** (owner, 2026-11-11), the outlined wordmark with the trace underline,
   the spectrum ground at most once. **Light is the Agency default** (`"theme": "light"`: board ground, navy ink); use `"dark"`
   (night ground) when the owner wants it or for one dark scene (`state.theme`). Grounds: `board` behind app screenshots,
   `stars` only for a globe seen from space, never behind an app. Accents by name (`'cyan'`), so text stays readable in both
   themes; `tools/contrast.mjs` checks every text style. The kit's stage already follows this.
6. **Narration rules** (`guides/NARRATION.md`, `guides/reference/VIDEO-STYLE-GUIDE.md`): the narrator from `brand/voice/voices.json`
   (Matilda, premade `XrExE9yKIg1WjnnlVkGX`, `eleven_v4`; `narrate.mjs` reads it and refuses unregistered voices); people are introduced
   with the formulas in `brand/voice/intros.json`; numbers as words; no symbols; ≤ 25 words a sentence; define every term at first use;
   no wayfinding ("in this video…"); context and scale before mechanism; say what the tool does not do. `narrate.mjs` runs the repo lint
   (`scripts/lint/lint.py`) on every line; `--strict` stops on an error.
7. **Never render on the shared VM; never stop a process you did not start.** Other sessions render here too. Check
   `cat /proc/loadavg` first. Local work is one niced browser (dry run, a few stills). All frames render in the Cloud Run job.
   Identify your own processes by parent PID or working directory before stopping anything.

## Phases

Keep `PROCESS-LOG.md` current at every step (the owner wants the process reproducible). Show the owner work early.

1. **Intake.** `node /mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN/showcase/kit/tools/new-film.mjs <slot>` reads the inventory (`$AGENCY_INVENTORY`, default
   `/mnt/data/projects/agency-2026/project-inventory/inventory.json`, read-only: never write it); for a project not in the inventory use
   `--name <slug> --title "…" [--brief brief.json] --kind app|map|data`. It creates `$FILMS_DIR/<NN>-<slug>/` (default
   `/mnt/data/projects/agency-2026/showcase/`, outside git) with `intake.json`, a prefilled `brief.md`, `SENSITIVITY.md`, and a
   `film.config.json` holding this film's own ports and Cloud Run job name. Read `main_folder`, `repos`, `live_urls`,
   `suggested_video_angle`, `gaps`. Ask the owner for music, classification, the one message and the closing line.
2. **Run the real app and capture it.** Clone (if `gh` gives 403 SAML: the owner runs `! gh-login`, then
   `source ~/.sandbox-env` in your shell), build, run on a free port, and screenshot every main screen for reference.
   Write `capture/states.script.json` and run `tools/capture-states.mjs` (named states, `scale: 2` for crisp push-ins, `marks`
   record exact element boxes for spotlights and cursor targets). Record interactions with `tools/capture-video.mjs`
   (→ an exact image sequence plus step times). Call the app's real API for the scenario you will show (as #11 did with
   `api/solve`, `api/estimate`), and save the responses in `prep/`. Seed synthetic data first when sensitivity is HIGH.
3. **Figures.** Inventory every number you might show in `NOTES.md`, with its source and the misleading-truth check.
4. **Music.** The owner's track, or a cue from the sound library (`"music": "cue:<id>"`, `brand/audio/cues.json`, `guides/SOUND.md`).
   `python3 tools/analyze_song.py <song> <film>/assets/song-analysis.json` (librosa in a scratch venv): tempo,
   downbeats, energy per second, sections. Cut on downbeats; put the climax on the energy peak; give quiet passages to the
   planning or explanation beats.
5. **Storyboard → sign-off.** 12–16 key frames from the real material: write the scenes into `web/timeline.js`, fill
   `storyboard.json` (time, music, camera, data, interface, draft narration), run `tools/storyboard.mjs`, and publish
   `storyboard/index.html` with the Artifact tool (root `storyboard/`, files `frames/*.jpg`). Wait for the owner.
6. **Narration.** `narration/script.json` lines with `at` (start second) — the one source for voice, mix and captions.
   `tools/narrate.mjs` voices changed lines only, with word timestamps, and reports overlaps. Transcribe a few lines back
   (ElevenLabs speech-to-text through Ent Tools) to check names and numbers.
7. **Timeline.** `stateAt(t)` returns the whole picture: `bg`, `plates`, optional `world` (a stage such as the map module),
   `ui` (chrome, callouts, ranked bars, glass panels, caption, statement, cards, cursor, labels). Use `helpers`
   (`track`/`mono` for camera keys, `smoothPath` for anything that follows an irregular path, `captionsFrom`, `cursorAt`, `count`).
   Re-draw app panels in the Agency look with glass panels (`ui.panels`, the `.row .cb .sw .btn .sl table` widgets) or plate
   `overlays`, keeping the app's real labels, numbers and warnings.
8. **Dry run and stills.** `tools/dryrun.mjs` (every frame evaluates, no NaN) and `tools/still-at.mjs --times …`; look at them.
   `tools/camcheck.mjs --from --to` after any camera change (fast turns under about 30°/s).
9. **Preview in the cloud.** `cloud/farm.sh deploy <film>`, then `cloud/farm.sh render <film> <every-2-s ranges>`; build a
   contact sheet; send the owner a silent preview if useful.
10. **Full render.** `cloud/farm.sh render <film> missing`, `cloud/farm.sh wait <film>`. Re-render only what changed.
11. **Sound.** `tools/mix-audio.mjs` (voice at its cues, music ducked, -16 LUFS, -2.0 dBTP, SRT and VTT captions).
12. **Encode and QA.** `tools/encode.sh <film>` (master, share copy, phone preview under 30 MB). Check: frame count, loudness and
    peak, `tools/find-pops.py` (short flickers), `tools/layer-present.py` over long scenes (dropouts of one element; leave
    fades out of the range), a 16-frame contact sheet across the film, and the sensitivity review.
13. **Deliver** to `<film>/deliver/` and send the phone preview (SendUserFile; 30 MB limit). Ask for review notes; fix by
    re-rendering only the affected ranges.
14. **Clean up** after sign-off: `cloud/farm.sh cleanup <film>` (deletes the job, stops this film's receiver). Record lessons.

## Pitfalls already paid for (film #11)

- MapLibre (any WebGL lib): freeze its clock (`setNow(0)`), style `transition: {duration: 0}`, `fadeDuration: 0`; MapLibre 6 is
  ESM only. Settle on two consecutive idle renders.
- **Start-up load errors must be fatal.** A data file that failed as one browser started drew 99 frames with two layers
  missing (one cloud task's whole share). The kit sets `window.filmInitErrors`; renderers refuse such a page.
- A chase camera that aims along the next stretch of an irregular path jitters (243°/s turns). Smooth it in time
  (`helpers.smoothPath`, position σ 0.9 s, heading σ 1.6 s): 21°/s.
- Cloud Run **services** stalled at about 12 instances; a Cloud Run **job** ran 100 tasks at once. Region is locked to
  `northamerica-northeast1` by org policy. The user's gcloud token goes stale and cannot re-prompt: `farm.sh` falls back to
  `CLOUDSDK_CORE_ACCOUNT=shell-<dev>@abde-goa-aimgemgcp-dev.iam.gserviceaccount.com`.
- `apt` inside `node:22-bookworm-slim` failed; build on `mcr.microsoft.com/playwright:v1.65.0-noble` (same version as the kit).
- Several films render at once: `farm.sh` caps each film's tasks to share about 100 tasks in all (`FARM_TOTAL_TASKS`); lower
  `--tasks` when the owner is waiting on several films.
- `timeout` on a Playwright script orphans its browsers; the kit's tools close theirs on SIGTERM.
- AAC adds about 0.7 dB of peak: master at -2.0 dBTP to stay under the Agency -1.5 ceiling.
- Chat attachments are limited to 30 MB: send `deliver/preview-720p-phone.mp4`; the master stays on the VM.
- Narration that runs long: move the line to an earlier downbeat rather than speeding it up; re-render only frames whose
  captions changed.
- `layer-present` flags planned fades; `find-pops` misses dropouts longer than about 24 frames. Use both.
- Every film in its own folder with its own ports, job and image (`new-film.mjs`); never reuse another film's names.

## Time and cost (measured)

| Material | Per frame (one 4 vCPU task) | 3:17 film (11,856 frames) on 100 tasks | Cloud cost, rough |
|---|---|---|---|
| Screenshot or recording plates, 2D UI | about 1 s | about 3–5 minutes | about $2 |
| 3D globe (WebGL in software) | about 10 s | about 25 minutes | about $10 |
| 3D globe with terrain, low camera | about 25 s | about 45–60 minutes | about $25–35 |

Plus about 10 minutes for the image build and push, and about 5 minutes for the encode. Narration: a few cents a line.

## Measured from the design repo (2026-11-12)

The kit's smoke film, from `showcase/kit`: 480 frames on 10 Cloud Run tasks in 57 s (about 12 frames a second, deploy 23 s with a
cached base image), mixed to -16 LUFS / -2.0 dBTP and encoded; job deleted and receiver stopped afterwards. The reference film #11
dry-runs all 11,856 frames from `showcase/reference` with no errors. `farm.sh` builds with `--network host` (the SHELL Docker bridge
MTU is above the VM's), and each film's receiver needs a free port: if `render` says "receiver did not start", another film holds it;
change `ports.receiver` in `film.config.json`.

## Reproducibility (standard operating procedure, owner 2026-11-12)

The film folder is its own git repository (`new-film.mjs` sets it up). Keep every custom script in it, fill `REPRODUCE.md` with each
dependency and its pin, and let `encode.sh` write `deliver/BUILD.json`. Masters stay out of git. Films live in `FILMS_DIR`, outside the
design repo. The render method: `showcase/kit/docs/RENDER-FARM.md`.
