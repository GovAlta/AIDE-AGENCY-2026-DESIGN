# Showcase films

A showcase film is the highest-quality video this repo makes: 2 to 5 minutes, 1080p60, narrated, cut to music, built from the real
project. That means real screenshots and recordings on a cinematic virtual camera, the project's own maps and data, and its real
figures. The film is rendered frame by frame in a temporary Cloud Run job. Film #11, the Pan-Canadian Fibre Optics Planner
(local, outside the repo: `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/`; summary in `showcase/kit/docs/WORKED-EXAMPLE-11.md`), is the bar: the owner called it "excellent".

The kit is `showcase/kit`. The rules agents follow are the `showcase-film` skill (`.claude/skills/showcase-film/SKILL.md`, installed
for SHELL sessions). The kit's `START-HERE.md`, `README.md` and `RECIPE.md` cover every API and command.

## Which kind of video

| You need | Use | Why |
|---|---|---|
| A short explainer, briefing or walkthrough from a script, in a day | MVAI, video type `agency-explainer` (`guides/VIDEO.md`) | Templates and voice are built in; no rendering setup; 44 ready screens |
| A stage or social piece: opener, bumper, lower third, countdown, stat reveal, sizzle | the motion library (`motion/README.md`) | Fixed pieces in the event look, rendered here in minutes |
| A flagship film of one project, for the showcase or the project's own launch | **a showcase film** (this guide) | The real app and data on a cinematic camera, custom scenes, owner sign-off at the storyboard |
| A project whose story is a place: routes, rivers, corridors, sites | a showcase film, kind `map` | The map stage: MapLibre globe, terrain, the project's own layers |
| A programme or result with no app to film | a showcase film, kind `data` | Big numbers, ranked bars, re-drawn tables, one statement, in the same finish |

Showcase films take the most effort: about a day of agent work, owner reviews of the storyboard and the cut, and $2–35 of cloud
rendering. Use them for the projects that deserve them.

## The quality bar (from #11)

- **Real or nothing.** Every number on screen or spoken comes from the project's data, its API (saved in `prep/`), or a derivation
  recorded in `NOTES.md`. Example values are labelled as such until replaced.
- **A true number can still mislead.** Check what each headline figure makes a viewer believe, break it down, and compare fairly.
  #11's "155 landing points in Canada" was true, but 115 of them are small British Columbia coastal systems. The film shows 7
  international cables landing in Canada against 85 in the United States.
- **Cinema, not a screen recording.** The camera moves on monotone splines, follow cameras are smoothed in time, cuts land on the
  music's downbeats, and the climax sits on the energy peak.
- **The Agency look throughout:** tokens only, the chrome on every frame (wordmark, Alberta signature, navy band, classification
  pill), thin circuit traces on title and end cards only, light by default.
- **Sensitivity is binding.** No credentials, remotes, project IDs, personal data or case details on any frame.
- **The owner owns** the classification, the closing line, asks and credit. Store their words in `owner_lines.txt`.

## How a new film starts

```bash
cd showcase/kit && npm ci                                    # once
node tools/new-film.mjs 23 --kind map                        # an Agency inventory slot (read-only)
node tools/new-film.mjs --name river-quality --title "North Saskatchewan Water Quality" --kind map --brief brief.json   # any project
```

The film folder goes to `$FILMS_DIR` (default `films/` beside the repo, outside git). Then follow `showcase/kit/RECIPE.md`:

1. Intake: `brief.md` and `SENSITIVITY.md`.
2. Owner answers: music, classification, the one message, the closing line.
3. Run the app and capture it.
4. Figures in `NOTES.md`.
5. Music analysis.
6. **Storyboard, signed off by the owner.**
7. Narration (`narrate.mjs`: the registry voice, the repo lint).
8. Timeline.
9. Dry run and stills.
10. A cloud preview, one frame every 2 s.
11. The full render.
12. Mix.
13. Encode and QA.
14. Deliver the phone preview.
15. Fix only the changed ranges.
16. Clean up the job and the receiver.

## Path A: app films

Capture named states of the running app (`tools/capture-states.mjs`, with `marks` for exact element boxes). Record interactions as exact
image sequences (`tools/capture-video.mjs`). Put them on plates: push-ins, tilts, a browser frame, spotlights locked to the marked
boxes, and a cursor travelling between targets. Where the real UI is too small to read on a stage screen, re-draw it as a glass panel
in the Agency look, keeping the app's real labels, numbers and warnings.

## Path B: map films (geospatial)

The stage is `showcase/kit/web/modules/map-stage.js`: a MapLibre globe, NASA relief and night lights through the kit's caching tile
proxy, optional terrain, a frozen clock, and fatal load errors.

1. **Find the data.** The project's layer files, usually in its public or data folder. Prefer the files the app itself serves.
2. **Mount them read-only** in `film.config.json`: `"mounts": { "/data/": "<app>/public/layers/" }`. `.geojson.gz` is served with gzip
   encoding, so MapLibre reads it as it is. The cloud build copies every mount into the image.
3. **Declare the layers:** `"map": { "start": { lng, lat, zoom }, "layers": [{ id, file, type: fill|line|circle|heatmap|raster, accent,
   width, radius, opacity, glow, progress, filter, colorBy }] }`.
4. **Drive them from `stateAt(t).world.map`:**
   - `cam`, the camera;
   - `basemap`: `light` for light films, `nasa-night` for dark;
   - layer opacity envelopes, `reveal`, line `progress` and head, and `pulses`;
   - labels in `ui.labels` with `lonLat`, which hide themselves on the far side of the globe.
5. **Follow a path** (a river, a route, a corridor) with `stage.along(id, share)` and `stage.heading(id, share)`, smoothed in time with
   `H.smoothPath` (position σ 0.9 s, heading σ 1.6 s). Never aim the camera straight at the moving head: that made #11 jitter at 243° a
   second; smoothed, it turns at 21°. Check with `tools/camcheck.mjs` (keep turns under about 30° a second).
6. **Basemap detail and licences.** NASA tiles stop at zoom 8 (about 600 m a pixel). For city or reach shots, add the project's own
   licensed basemap to `TILES` in `server.mjs` (the proxy caches it) as a `raster` layer, after checking its licence and attribution.
   Every source goes in `ui.credits` and on the end card (#11: NASA Blue Marble and Black Marble; OGL Canada and Alberta;
   TeleGeography; © OpenStreetMap contributors).
7. **Cost.** A globe with terrain is the heaviest material: about 25 s a frame on one task; a 3-minute film about 45–60 minutes on 100
   tasks, $25–35.

`showcase/kit/docs/WORKED-EXAMPLE-11.md` maps every scene of #11 to the kit feature that reproduces it. The film itself stays local, outside the repo.

## Path C: data films

For a programme, a study or a result with no app or map to film, `--kind data` starts from `templates/timeline-data.js`:
- a title card;
- one big number;
- a ranked bar chart (one scale, the highlighted row in context; `scale` sizes it as a hero);
- a re-drawn table;
- one statement on the spectrum ground;
- the end card, with the event facts taken from `brand/tokens/tokens.json`.

Every value starts as a labelled example and must be replaced from `NOTES.md` before review. Plates (screenshots, photos the owner
supplies) and the map stage can be added to a data film at any point.

## Sound and voice

- **Narrator:** from `brand/voice/voices.json` (`narrate.mjs` refuses an unregistered voice). Lines follow `guides/NARRATION.md` and
  pass `scripts/lint/lint.py`.
- **People** are introduced with the formulas in `brand/voice/intros.json`.
- **Music:** the owner's track, or a cue from the sound library: `"music": "cue:reel-60"` (`brand/audio/cues.json`,
  `guides/SOUND.md`).
- **Mix and captions:** `-16 LUFS / -2.0 dBTP`; SRT and VTT captions from the voice's own word times.

## Times and costs (measured)

| Material | One 4 vCPU task, per frame | 3 min film on 100 tasks | Cloud cost |
|---|---|---|---|
| Screenshot or recording plates, 2D UI | about 1 s | 3–5 minutes | about $2 |
| 3D globe | about 10 s | about 25 minutes | about $10 |
| 3D globe with terrain, low camera | about 25 s | 45–60 minutes | $25–35 |

The kit's 8 s smoke film from this repo rendered 480 frames on 10 tasks in 57 s (2026-11-12). Add about 10 minutes for the first
image build, and about 5 minutes for the encode.

## Rules for the shared VM

- Render frames only in the Cloud Run job (`cloud/farm.sh`), never on the VM.
- Check `cat /proc/loadavg` before local work. Local work is one niced browser: a dry run and a few stills.
- Never stop a process you did not start, and never reuse another film's ports, job or image name (`new-film.mjs` namespaces them).
- Delete the job and stop the receiver when the film is done (`cloud/farm.sh cleanup`).
- Masters (hundreds of MB) stay out of git: keep them in the film's `deliver/`, a GitHub Release or a bucket. The phone preview
  (under 30 MB) is the copy to share in chat.

## Where films live

The repo holds only what is needed to make a film: the kit, its templates, its docs and a small example's inputs. Every film is a project
output and lives outside the repo (owner, 2026-11-12). `new-film.mjs` makes film folders in `FILMS_DIR`, by default the `showcase/` folder
beside the repo clone (`/mnt/data/projects/agency-2026/showcase/` on SHELL). Frames, masters and previews stay there.

## Standard operating procedure: the code travels with the film

Every film must be regenerable by someone else, months later. So, for every showcase film:

1. **The film folder is its own git repository.** `new-film.mjs` runs `git init` and writes a `.gitignore` that keeps frames,
   masters and audio renders out. Commit the timeline, narration script, captures, `prep/` API answers, figure scripts, `NOTES.md`,
   `owner_lines.txt` and `PROCESS-LOG.md` as you go. Push it to its own private repository if the film matters beyond this VM.
2. **Every custom script lives in the film folder**: figure derivations (#11's `cable-countries.py`, `trace-solve.mjs`), data prep,
   one-off renders. A script that would help the next film goes into the kit instead, and the film's log says so.
3. **`REPRODUCE.md`** (from the kit template) lists every dependency with its pin: the kit commit, the app or data commit (#11: the
   planner at 2610761), the music and its licence, the voice. It ends with the exact commands to regenerate.
4. **`deliver/BUILD.json`** is written by `encode.sh` on every encode: the kit's git commit (and whether it had uncommitted changes),
   the film folder's commit, the full `film.config.json`, the frame count, the voice settings and the encoder.
5. **Masters are not in git.** Keep them in `deliver/` and publish them as a release asset or in a bucket; `REPRODUCE.md` says where.
6. **Films live outside the design repo**, in `FILMS_DIR` (default the `showcase/` folder beside the repo clone).
7. **Apps are referenced, not copied**: the app a film shows is checked out beside the films (on SHELL, `agency-2026/apps/<app>`)
   and pinned by commit in `REPRODUCE.md`. The layout of `agency-2026/` is described in its own `README.md`.

The render method itself (why a Cloud Run job, sizing, time, cost, rules) is in `showcase/kit/docs/RENDER-FARM.md`.
