# Recipe: one showcase film

**Must read first: the owner rules** in `guides/SHOWCASE-FILM.md` ("Owner rules: read before every film"). Step 14 runs its "Before you
send a cut" check list. The render method is in `docs/RENDER-FARM.md`; the code-travels-with-the-film rules are in `guides/SHOWCASE-FILM.md`
(Standard operating procedure).

Follow in order. `F` is the film folder. Tick each line in `$F/PROCESS-LOG.md`.

| # | Step | Command or action | Done when |
|---|---|---|---|
| 1 | Start from the slot | `node tools/new-film.mjs <slot>` | folder made; read `brief.md`, `SENSITIVITY.md` |
| 2 | Ask the owner | music, classification, the one message, the closing line | answers in `brief.md`, `owner_lines.txt` |
| 3 | Run the app | clone, build, run on a free port (`source ~/.sandbox-env` after `gh-login`) | every main screen screenshotted |
| 4 | Capture | `tools/capture-states.mjs`, `tools/capture-video.mjs`; real API calls saved to `prep/` | plates and marks ready; HIGH: synthetic data only |
| 5 | Figures | `NOTES.md`: source, method, breakdown, peer comparison for each headline figure | nothing true-but-misleading |
| 6 | Music | `tools/analyze_song.py` | downbeats and energy known |
| 7 | Storyboard | the plain-text script, then four to six rendered mockup stills (`storyboard.json` → `tools/storyboard.mjs`) | **owner says yes to both**; then fix and deliver without frame-by-frame rounds |
| 8 | Narration | `narration/script.json` → `tools/narrate.mjs` (Matilda) | 0 lint errors, no teaser or hedging warning left, 0 overlaps, names transcribe back right |
| 9 | Timeline | `web/timeline.js`; `tools/dryrun.mjs`; `tools/still-at.mjs`; `tools/camcheck.mjs` | clean dry run (0 slow scale runs, 0 text outside the safe area, no white-on-white warning); stills look right; `python3 tools/ground-sat-check.py <stills of every scene>` prints GROUND OK |
| 10 | Preview | `cloud/farm.sh deploy $F`; `cloud/farm.sh render $F <one frame every 2 s>` | contact sheet approved |
| 11 | Render | `cloud/farm.sh render $F missing`; `cloud/farm.sh wait $F`; `python3 tools/seam-check.py $F`; `node tools/motion-check.mjs --flicker $F/out/frames` | all frames on disk; no seam, no flicker |
| 12 | Sound | `tools/mix-audio.mjs --project $F`; `python3 tools/sfx-audible.py $F` | -16 LUFS, -2.3 dBTP; each effect 6 dB or more over the bed |
| 13 | Encode + QA | `tools/encode.sh $F` (the kit's copy); `tools/deliver-audio.sh $F`; `find-pops.py`; `layer-present.py`; `ground-sat-check.py` on the master; 16-frame sheet; sensitivity review | frame count right, no dropouts; every file at -16 LUFS and under -2.0 dBTP |
| 14 | Deliver | run "Before you send a cut"; send `deliver/preview-720p-phone.mp4`; master stays in `deliver/` | owner reviews |
| 15 | Fix | re-render only affected ranges (`farm.sh render $F a-b,c-d`), re-encode, re-run `deliver-audio.sh` | owner approves; copy `deliver/` to `agency-2026/finals/NN-slug/` |
| 16 | Record | commit the film folder (its own git repository); fill `REPRODUCE.md`; `deliver/BUILD.json` written by encode | someone else could regenerate it |
| 17 | Clean up | `cloud/farm.sh cleanup $F`; lessons into `PROCESS-LOG.md` (and the kit's SKILL.md if general) | job deleted, receiver stopped |

## Never

Slow push-ins, zoom creep or Ken Burns (a held screen stays still) · a white screen on a white ground · frost, haze or a scrim · a cropped
device · a slowed clip · a titles-only cut with no narration · hedging on the owner's claims · images, videos or logs in git · render on the shared VM · stop a process you did not start · write to the inventory · show credentials, git remotes, logs
with project IDs or real personal data · draft the owner's conclusion · use a figure without a source in `NOTES.md`.

## Expectations (from film #11 and the kit smoke test)

- #11: 3:17, 11,856 frames, 3D globe with terrain; 100 tasks delivered about 4 frames a second; about 45 minutes of
  rendering; heaviest frames about 10 s each on 8 vCPU (25 s on a 4 vCPU task).
- Smoke test: screenshot plates, 480 frames on 10 tasks in about 90 s (about 9 frames a second). A 3-minute plate film on
  100 tasks: a few minutes.
- Rough cloud cost: plates about $2 a film; globe films $10–35. Image build and push about 10 minutes; encode about 5.
- Owner review usually finds two or three things; each costs a re-render of only those seconds.
