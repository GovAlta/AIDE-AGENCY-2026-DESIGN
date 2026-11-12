# Recipe: one showcase film

The render method is in `docs/RENDER-FARM.md`; the code-travels-with-the-film rules are in `guides/SHOWCASE-FILM.md` (Standard operating procedure).

Follow in order. `F` is the film folder. Tick each line in `$F/PROCESS-LOG.md`.

| # | Step | Command or action | Done when |
|---|---|---|---|
| 1 | Start from the slot | `node tools/new-film.mjs <slot>` | folder made; read `brief.md`, `SENSITIVITY.md` |
| 2 | Ask the owner | music, classification, the one message, the closing line | answers in `brief.md`, `owner_lines.txt` |
| 3 | Run the app | clone, build, run on a free port (`source ~/.sandbox-env` after `gh-login`) | every main screen screenshotted |
| 4 | Capture | `tools/capture-states.mjs`, `tools/capture-video.mjs`; real API calls saved to `prep/` | plates and marks ready; HIGH: synthetic data only |
| 5 | Figures | `NOTES.md`: source, method, breakdown, peer comparison for each headline figure | nothing true-but-misleading |
| 6 | Music | `tools/analyze_song.py` | downbeats and energy known |
| 7 | Storyboard | timeline scenes + `storyboard.json` → `tools/storyboard.mjs` → publish | **owner signs off** |
| 8 | Narration | `narration/script.json` → `tools/narrate.mjs` | 0 lint findings, 0 overlaps, names transcribe back right |
| 9 | Timeline | `web/timeline.js`; `tools/dryrun.mjs`; `tools/still-at.mjs`; `tools/camcheck.mjs` | clean dry run; stills look right |
| 10 | Preview | `cloud/farm.sh deploy $F`; `cloud/farm.sh render $F <one frame every 2 s>` | contact sheet approved |
| 11 | Render | `cloud/farm.sh render $F missing`; `cloud/farm.sh wait $F` | all frames on disk |
| 12 | Sound | `tools/mix-audio.mjs --project $F` | -16 LUFS, peak ≤ -2.0 dBTP |
| 13 | Encode + QA | `tools/encode.sh $F`; `find-pops.py`; `layer-present.py`; 16-frame sheet; sensitivity review | frame count right, no dropouts |
| 14 | Deliver | send `deliver/preview-720p-phone.mp4`; master stays in `deliver/` | owner reviews |
| 15 | Fix | re-render only affected ranges (`farm.sh render $F a-b,c-d`), re-encode | owner approves |
| 16 | Record | commit the film folder (its own git repository); fill `REPRODUCE.md`; `deliver/BUILD.json` written by encode | someone else could regenerate it |
| 17 | Clean up | `cloud/farm.sh cleanup $F`; lessons into `PROCESS-LOG.md` (and the kit's SKILL.md if general) | job deleted, receiver stopped |

## Never

Render on the shared VM · stop a process you did not start · write to the inventory · show credentials, git remotes, logs
with project IDs or real personal data · draft the owner's conclusion · use a figure without a source in `NOTES.md`.

## Expectations (from film #11 and the kit smoke test)

- #11: 3:17, 11,856 frames, 3D globe with terrain; 100 tasks delivered about 4 frames a second; about 45 minutes of
  rendering; heaviest frames about 10 s each on 8 vCPU (25 s on a 4 vCPU task).
- Smoke test: screenshot plates, 480 frames on 10 tasks in about 90 s (about 9 frames a second). A 3-minute plate film on
  100 tasks: a few minutes.
- Rough cloud cost: plates about $2 a film; globe films $10–35. Image build and push about 10 minutes; encode about 5.
- Owner review usually finds two or three things; each costs a re-render of only those seconds.
