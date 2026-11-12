# Process log: #11 Pan-Canadian Fibre Optics Planner film

A running record of every step, so the process can be repeated for other applications.

## Brief (2026-11-11)

- Subject: `GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK` (the planner tool).
- Deliverable: a 2 to 5 minute cinematic simulation and story film for Agency 2026, with mocked controls that represent the real UI,
  the real data, the real layers, real Canada, and voice-over. Owner direction (mid-build): "as cinematic and hollywood as possible
  while staying real with 100% real data, and showing canada and its major layers as part of the narrative". Storyboard first.
- Look: Agency 2026 design system (`GovAlta-EMU/AIDE-AGENCY-2026-DESIGN`).
- Music: `assets/forward-looking.mp3` (owner-supplied, 3:17.64, 48 kHz stereo, instrumental).
- Tooling: MVAI is available; the owner allows a better route if one exists. Chosen route: a custom frame-exact render (below).

## Folder map

| Path | What |
|---|---|
| `refs/fibre-network/` | the planner repo (clone, unchanged), built and run locally on port 3111 |
| `refs/agency-design/` | the Agency 2026 design repo (clone) |
| `assets/` | the song and its analysis (`song-analysis.json`) |
| `film/server.mjs` | film server (port 3222): static mounts + on-disk caching proxy for NASA and terrain tiles |
| `film/web/` | the stage: `map.js` (MapLibre globe, all layers), `ui.js` (panel, callouts, cards), `main.js`, `film.css` |
| `film/tools/` | data preparation: `prep-routes.mjs`, `solve-plans.mjs`, `trace-solve.mjs`, `estimate-lines.mjs` |
| `film/prep/` | generated inputs for the stage (routes, plans, search traces, estimate) |
| `film/boards.mjs`, `film/stills.mjs` | storyboard key-frame states and the still renderer |
| `storyboard/` | the storyboard page and its frames |
| `tools/analyze_song.py` | tempo, beats, energy and sections of the song |

## Steps

| # | Step | Result |
|---|------|--------|
| 1 | `gh repo clone GovAlta-EMU/AIDE-AGENCY-2026-DESIGN refs/agency-design` | OK |
| 2 | Clone `GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK` | First blocked by SAML SSO (403). After the owner ran `gh-login`, the new token was in `~/.sandbox-env` but not in the running session: `source ~/.sandbox-env` then `git clone` worked. Lesson: after a re-login, re-source the env file. |
| 3 | `ffprobe`, then `tools/analyze_song.py` (librosa in a scratch venv) | 197.6 s, 92.3 bpm, bar 2.62 s. Sections: quiet intro 0–20, groove 20–60, break 60–64, groove 64–102, break 102–106, peak 106–128, quiet bridge 128–158, build 158–168, climax 168–185, outro. ElevenLabs speech-to-text confirmed no vocals. |
| 4 | Read the planner README, walkthrough, manifest, routes, solver; read Agency `AGENTS.md`, `BRAND.md`, `VIDEO.md`, `NARRATION.md`, `VIDEO-STYLE-GUIDE.md`, `voices.json`, tokens | Facts and rules for the film (see NOTES to come) |
| 5 | `npm ci && npm run build`, run the planner (`PORT=3111`, `TILE_CONTACT` set to the repo URL) | Real app running; screenshots of all five tabs in `film/shots/real-*.png` as the reference for the mocked panel |
| 6 | Checked outside sources | NASA GIBS Blue Marble and Black Marble tiles (public domain) and Mapzen terrarium elevation tiles reachable; ElevenLabs (Matilda, `eleven_v4`, with timestamps) works through Ent Tools |
| 7 | Built the stage: MapLibre GL 6 globe, headless Chromium with SwiftShader (no GPU on the VM) | Works. Keys to determinism: `maplibregl.setNow(0)` (frozen clock), style `transition: {duration: 0}`, `fadeDuration: 0`, wait for two consecutive idle renders with all tiles loaded |
| 8 | `film/tools/prep-routes.mjs` | The 15 precomputed routes as drawable lines (land, subsea, gaps), lengths unchanged |
| 9 | `film/tools/solve-plans.mjs` | Three real solves through `POST api/solve`: Calgary–Vancouver 970 km, Edmonton–Vancouver 1,166 km, Edmonton–Prince Rupert 1,529 km |
| 10 | `film/tools/trace-solve.mjs` | The real A* search recorded: a private copy of the compiled solver with a one-line hook; results match the API to the metre (7,794 / 11,625 / 17,370 nodes settled) |
| 11 | `film/tools/estimate-lines.mjs` | Real `POST api/estimate` for a line along the NWT "not routed" stretch: 927 km, 867 km in permafrost, 11 rivers, $44–420 million (buried), indicative |
| 12 | Night lights re-cut in the tile proxy (warm pixels only, alpha = brightness) | City lights sit on top of the graded relief; snow and land tint removed |
| 13 | Interface overlay (`ui.js`): dark re-draw of the real panel (title, five tabs, groups, layer names and counts from `manifest.json`, buttons, warnings), callouts, labels, Agency chrome, title and end cards with `scripts/vectors.mjs` traces (seeds `fibre-planner-11`, `fibre-planner-11-end`, night ground) | Done, first pass |
| 14 | `node boards.mjs && node stills.mjs boards.json` | 16 storyboard key frames in `film/shots/` |
| 15 | Storyboard page published | Waiting for the owner's direction before animating |

| 16 | Owner answers (2026-11-11) saved in `owner_lines.txt`: closing line, integrated-Canada framing, plans fine, "indicative" fine, Unclassified | Narration rewritten around them |
| 17 | `film/narration/script.json` → `film/tools/narrate.mjs` (Matilda, `eleven_v4`, with character timestamps) | 18 lines, 137.9 s of speech; `narration/timing.json` holds word times. Eight clips transcribed back (ElevenLabs speech-to-text): names and numbers correct |
| 18 | `film/web/timeline.js`: the whole film as `stateAt(t)`: camera splines (monotone cubic), a chase camera that follows the solver's southern route, layer envelopes, panel and cursor script, callouts, captions from word times | Cuts sit on the song's downbeats; narration cue times in `VO` |
| 19 | `film/tools/dryrun.mjs` | All 11,856 states evaluate with no error; at most 874 moving lights in a frame |
| 20 | `film/tools/mix-audio.mjs` | Voice at cue times, song ducked under the voice (sidechain), two-pass loudnorm: -15.9 LUFS, -1.5 dBTP. Captions written as SRT and VTT |
| 21 | `film/render.mjs` (parallel browsers on the VM) | **Abandoned**: the VM was shared with another session's 40-browser render (load ~600 on 64 cores). Never render heavy video on the shared VM |
| 22 | Cloud Run *service* farm (`service.mjs`, `render-farm/farm-render.mjs`, 8 vCPU / 16 GiB, concurrency 1) | Works, but scaled to only 12 instances (quota); ~1 frame/s, ETA over 2 h |
| 23 | Cloud Run *job* (`film/job.mjs`, 100 tasks × 4 vCPU / 8 GiB, VPC connector) sending JPEGs to `render-farm/receiver.mjs` on the VM over the private network (token-checked PUT) | **The working route**: all 100 tasks ran at once, ~4 frames/s. The last 3% (3D-terrain scenes) went to a second 70-task run to cut the tail |
| 24 | `film/tools/mix-audio.mjs`, `film/tools/encode.sh` (niced, 12 threads) | Master: 11,856 frames, 1920×1080, 60 fps, 3:17.6, H.264 CRF 15 + AAC 256k, -16.0 LUFS / -1.4 dBTP, 590 MB. Frame count and black-frame checks pass (only the planned 1 s fade-in) |
| 25 | Delivery copies | `deliver/…-share.mp4` (1080p60, 152 MB) and `deliver/preview-720p-phone.mp4` (two-pass, 28 MB, under the 30 MB send limit) |
| 26 | Cleanup | Deleted the Cloud Run job and service; stopped this project's receiver and film server (checked by working directory first). No other process touched |

| 27 | Owner review of the master | Two glitches: camera jitter 1:46–1:56; layers and lights drop out 0:39–0:41. Owner questioned "155 on Canada's coasts" |
| 28 | Jitter: the chase camera aimed along the next ~200 km of highway, so switchbacks swung it | Replaced with a camera path Gaussian-smoothed in time (position 0.9 s, heading 1.6 s, centred). Measured: fastest turn 243°/s → 21°/s; shake ~400× lower (`film/tools/camcheck.mjs`) |
| 29 | Dropout: frames 2364–2466, exactly one cloud task's share | A load error at that browser's start was cleared with the start-up noise, so it drew frames with layers missing. Now start-up errors are fatal and the task opens a new browser. Found by measuring lit-pixel share per frame; the generic pop detector (`film/tools/find-pops.py`) misses drops longer than its window |
| 30 | "155" check (`film/tools/cable-countries.py`) | 155 landing points is right, but 115 are BC coastal; only 7 international cables land in Canada vs 85 in the US. Narration line rewritten to compare countries; ranked bar chart replaces the callout; line moved to 0:19.4 to fit |
| 31 | Re-render only the changed frames in the cloud job (0:19–0:33, 0:39–0:41, 1:46–2:00) | about 1,700 frames, 82–92 tasks |

## Recipe for the next application (what to repeat)

1. Clone the app; build and run it; screenshot every tab (reference for the re-drawn panel).
2. Inventory its real data (manifest counts, precomputed results) and call its real API for the scenario shown; record every figure in `NOTES.md`.
3. Analyze the music (`tools/analyze_song.py`); storyboard 12–16 key frames rendered from the real data; get the owner's lines.
4. Voice the narration with word timestamps (`film/tools/narrate.mjs`); write the film as `stateAt(t)` (`film/web/timeline.js`), cut on downbeats.
5. Dry-run every frame (`film/tools/dryrun.mjs`), then a 1-frame-every-2-s preview.
6. Render in a **Cloud Run job** (100 tasks), never on the VM; receive JPEGs on the VM; mix, encode niced, check, deliver; delete the job.

## Measurements

- Software rendering cost: about 2.3 s a frame for globe shots, about 4.5 s with 3D terrain (one browser). The VM has 64 cores, so the
  11,858 frames (197.6 s at 60 fps) will be rendered by parallel browsers, each on its own frame range.

## Open items (after delivery)

- Owner to confirm "a promising future" (owner wrote "feature") and the TeleGeography non-commercial licence for the event (NOTES.md).

## Lessons (things that cost time)

- **Kill only your own processes.** Another session on this VM was rendering video with the same Playwright Chromium build. A `kill` by
  build path stopped browsers that may not have been this project's. Use the renderer's own shutdown (it closes its browsers on SIGTERM)
  or kill by parent process id. Never `pkill -f` with a pattern that also matches the shell running it.
- **`timeout` on a Playwright script orphans its browsers.** The renderer now closes them on SIGTERM, SIGINT and SIGHUP.
- **Check the machine before a long render** (`cat /proc/loadavg`, other headless browsers). Software WebGL uses many threads per browser;
  more workers than free cores makes every frame slower, and first frames can pass any timeout.
- **MapLibre under a frozen clock needs `transition: {duration: 0}` in the style**, or `map.loaded()` never becomes true.
- **MapLibre 6 is ESM only**: import `maplibre-gl.mjs` and call `setWorkerUrl`.

## Follow-on work (2026-11-11)

| # | Step | Result |
|---|------|--------|
| 32 | Production kit for the other Agency projects (fork session) | Skill `/mnt/data/projects/.claude/skills/showcase-film/`, kit `/mnt/data/projects/showcase-film-kit/` (stage with screenshot/recording plates, capture, narration, mix, encode, QA, `cloud/farm.sh`), 8 s smoke film rendered in the cloud job. Steps: `KIT-LOG.md` |
| 33 | Planner redesign pull request (fork session) | GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK PR #21, branch `ui/night-theme`: Night view toggle, NASA imagery basemap through same-origin server routes, globe atmosphere, route glow. 577/577 tests, lint clean, not merged. Steps: `PR-LOG.md` |
