# Showcase films

A showcase film is the highest-quality video this repo makes: 2 to 5 minutes, 1080p60, narrated, cut to music, built from the real
project. That means real screenshots and recordings on a cinematic virtual camera, the project's own maps and data, and its real
figures. The film is rendered frame by frame in a temporary Cloud Run job. Film #11, the Pan-Canadian Fibre Optics Planner
(local, outside the repo: `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/`; summary in `showcase/kit/docs/WORKED-EXAMPLE-11.md`), is the bar: the owner called it "excellent".

The kit is `showcase/kit`. The rules agents follow are the `showcase-film` skill (`.claude/skills/showcase-film/SKILL.md`, installed
for SHELL sessions). The kit's `START-HERE.md`, `README.md` and `RECIPE.md` cover every API and command. Before any film, read
**Owner rules: read before every film** below.

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
- **Cinema, not a screen recording.** Map cameras move on monotone splines and follow cameras are smoothed in time. Held screens stay
  still (see the owner rules below). Cuts land on the music's downbeats, and the climax sits on the energy peak.
- **The Agency look throughout:** tokens only, the chrome on every frame (wordmark, Alberta signature, navy band, classification
  pill), thin circuit traces on title and end cards only, light by default.
- **Sensitivity is binding.** No credentials, remotes, project IDs, personal data or case details on any frame.
- **The owner owns** the classification, the closing line, asks and credit. Store their words in `owner_lines.txt`.

## Owner rules: read before every film

The owner rejected these faults in films #1 to #15. Each rule gives the owner's words and, where there is one, the fix. The detail is
in `showcase/kit/docs/LESSONS.md` and in each film's `PROCESS-LOG.md`. The spoken rules are also in `guides/NARRATION.md` (Owner rules).
"Check:" names the tool that catches the fault. Where no tool is named, a person checks it.

### Story and script

| Rule | The owner's words | Before → after, and the check |
|---|---|---|
| **Every film is narrated by Matilda and tells a story.** The music sits under the voice | "a real step down in quality" (a titles-only sizzle cut to the beat, #15) | Beat-cut title cards → one family followed from registration to report card, voiced |
| **Build the story on the product's main point, as the owner frames it, shown through its main users.** Follow one fictional case or person from start to finish. The owner picks the case where there is one | #15: OASIS is "a one stop student information system… for parents, teachers, and registrars" · #6: "use the case from Muttart" | A translation feature as the subject → one student record that a registrar, a teacher and a parent all use |
| **Describe the end product, not the prototype. State the owner's claims plainly**, with no "prototype", "planned", "concept", "could" or "the owner states". The owner's own statement wins over the record. Fact-check code and third-party claims | "It fixated on the prototype instead of describing the end product. Stop hedging on what I'm saying." (#12) | "The concept app could one day…" → "The Alberta App is coming in twenty twenty seven." Check: lint warns on hedging words |
| **No teaser, idiom or mood openings.** Every line names who does what to what. Define the term inside the sentence, and do not let a pronoun lean on the line before | "This language isn't helpful." (#15) | "A school year runs on one thing: the student record…" → "Every Alberta school keeps a record for each student, with their registration, courses, attendance, marks, report cards and fees." Check: lint warns on a colon, "runs on", "it all", "one thing" |
| **Explain how it works, step by step, on one real case.** Give each unknown one line | "it didnt really explain how the simulation worked, and mostly focused on the things we dont know" (#6) | Most of the film walks the mechanism; the limits get one line with the standard caveat |
| **Use the owner's spelling of product names** | OASIS, in capitals (#15) | "Oasis" → "OASIS" on screen and in `lexicon.json` |
| **Say precisely how AI helps, from the code.** Name the model for each AI step, say which steps are plain code with no AI, name the checks that make the result reliable and consistent, say what people still decide, and say how AI built the tool. Use facts, never metaphors | "you're doing people a critical disservice by using metaphors when facts are what they need to learn" (#16) | "every row has its own address" → "AI then splits each file into topics… and notes the paragraph, slide or spreadsheet row where each topic sits". A person checks it |
| **Every film is Unclassified, and every example is invented.** Show no "Protected" marking; mask an app's own chip. Use no real business data in any example | "All these videos are unclass. Don't include real business data in the examples" (#13, #16) | The app's "Protected A · draft" chip → masked; real records → an invented case. A person checks every frame |
| **Say that synthetic people are fictional when they are first named** | | "The Haddad family, a fictional family, registers…" (not only on the end card) |
| **Voice the owner's lines word for word.** When the owner rewrites the script, fact-check it and change nothing | #15 v5: the owner's own lines | `owner_lines.txt`; `lint.py --owner-lines` never flags them |
| **Get the owner's yes before building**, on the plain-text script and four to six rendered mockup stills. After that, fix and deliver without repeated frame-by-frame rounds | "I can review" (#5) | #15 round 2: script v2 and six stills, then "Go and build" |

### Picture

| Rule | The owner's words | Before → after, and the check |
|---|---|---|
| **No slow push, zoom creep or Ken Burns, ever.** Held screens, devices and cards stay completely still. Entrances and exits may fade or slide; a framing changes by a cut or a quick move (under 0.5 s) | "a very minor scaling effect ... 100% to like 103% ... causes everything to jitter ... very disorienting" · "The slow push always looks bad" (#12) | A 4 % push over each shot → a still framing with a highlight ring. Check: the dry run fails any slow scale, with no override |
| **Hold each screen 4 to 8 s, one idea per screen.** A rapid flip suits only a style montage | "Screens too fast and mean nothing." (#15) | Six screens in 10 s → one screen for 6 s, named in the narration |
| **A white screen never sits on a white ground.** Use a dark window or device frame, a soft shadow, and a deeper gradient or navy behind it | "white on a white background" (#15) | `bg: 'board'` behind a white app → `bg: 'navy'` and a dark frame. Check: the dry run warns |
| **Keep the standard Agency chrome:** the wordmark top right and the classification in the bottom navy band | (#15) | Kit chrome on every frame |
| **No frost, haze or foggy white anywhere, not even behind text.** Text sits on an opaque or glass card or a navy band | "the frosted white covers too much" (#5) · "don't use that foggy white background behind text in any more videos" | A wash or scrim over footage → clean footage and a navy caption band. `scrims` are retired |
| **Colour washes stay at the level of films #1 and #20, and stay behind the cards.** One pale wash a scene, of one size and strength, behind the hero; card faces are the same soft neutral surface in every scene | "the background colours are getting pretty strong. Is this gradually drifting toward higher contrast?" · "They also seem to be covering the cards" (#40) | Each film copied the one before and scaled its windows up; a window's glow grows with the window, and the frosted fill lets it through. Film #21 measured 32.5 and 11.5 % against film #20's 27.7 and 3.7 % → a fixed wash and near-opaque faces: 29.9 and 3.2 % on the master. Check: `tools/ground-sat-check.py` on stills of every scene and on the master |
| **No busy texture or tile floor behind explanation cards** | "distracting" (#5) | A floor of tiles → the calm glass ground of #1 and #2 |
| **Show a device whole.** A phone is about 80 to 88 % of the frame height, never cropped or sliced at the frame edge. A ring and a caption card point at the part that matters | "the mobile phone display is far too big in most pages ... Everything looks cut off" (#12) | A phone 980 px wide showing its top half → the whole phone at 900 px high, a ring on the field |
| **No wall of tiny text.** A comparison shows three to five items in large type (30 px or more), one at a time | (#12, #15) | A 12-row table → four rows, each shown alone. A long comparison is cut, not shrunk |
| **Captions and burned subtitles never cover screen content** | (#15) | Keep screens above the caption bar (about y 954) |
| **Nothing draws over or under a caption**, not even the trace art of a title or end card | "the circuit boards cover up subtitles on the first frame" (#32) | Trace art crossing the caption bar → the kit fades card art out above the caption zone. Check: the dry run fails on any element over or under the caption bar |
| **Text on a card is dark on light or light on dark, 3:1 or more.** A card over a map or a dark scene keeps its own ink: do not let the scene's theme turn its text light | "white text on a white background for the login" (#32) | Body text that followed the dark theme on a white glass card → card ink fixed to navy. Check: the dry run measures every text on a card against the card behind it |
| **Inside a card, every line has its own row.** No text overlaps other text or a button, runs outside the card or is cut off. Check a translated edition again: longer text wraps | (#32, French edition: a title wrapped and pushed the next line into the button row; the sheet looked at by eye missed it) | Check: the dry run measures every text element inside every card |
| **Typed text looks like a person typing into a real field.** Lay the final text out once, at its final line breaks, in a field sized to hold it; reveal it in place with a caret; prefer one line | "the typing doesn't fill up the text window properly. It's all jagged ... It keeps breaking to second lines" (#32) | Typed and untyped parts as separate flex items, each wrapping → `helpers.typed(text, p)` |
| **Never slow a clip.** Footage plays at speed 1.0 | (#5: slowed clips "read as a low frame rate") | A long shot takes a longer source range or a second clip |
| **Bake the blur into see-through cards and show them opaque** | flicker on the farm (#5) | Check: `motion-check.mjs --flicker` |
| **Remove recorded cursors from captures** | (#15) | Pick cursor-free moments, or fill the cursor flat on plain ground; never inpaint over text |
| **Nothing is clipped, and all text sits inside the 48 px safe area** | "…test it with Al…" ran off the edge (#12) · "Final subtext overflows the slide" (#6) | Check: the dry run (`UI.textCheck`, `cardCheck`), `padding-check.mjs` |

### Sound and delivery

| Rule | The owner's words | Before → after, and the check |
|---|---|---|
| **Sound effects stand at least 6 dB over the bed** | | Check: `tools/sfx-audible.py` |
| **Mix to −16 LUFS and −2.3 dBTP, and every delivered file stays under −2 dBTP at −16 LUFS** | | `encode.sh` lowers a file that overshoots (to −16.4 to −17.6 LUFS in #6, #9, #15) → run `tools/deliver-audio.sh <film>` after it: the sound is re-muxed from the mix through a limiter, and it fails on any file not under −2.0 dBTP |
| **Use the owner's music at its own speed.** The track's last note lands under the end card | (#2) | Offset the start; never stretch the track or cut it mid-note |
| **Run `encode.sh` from the kit**, then `seam-check.py` and `motion-check.mjs --flicker` after every farm render | | BUILD.json pins the kit commit only when the kit's copy runs |
| **Images and videos never go to GitHub.** Approved cuts go to `agency-2026/finals/NN-slug/` | (2026-11-12) | The film `.gitignore` from `new-film.mjs` keeps media, `out/`, `deliver/` and logs out |
| **Never commit a log that names the cloud project ID** | | `prep/*.log` and `*.log` are in the new-film `.gitignore` |
| **Write large outputs under `/mnt/data`**, not the root disk or `/tmp` | | Film folders, frames and renders stay in `FILMS_DIR` |

### Before you send a cut

- [ ] The script is the one the owner approved, voiced by Matilda, and it follows one case from start to finish.
- [ ] `lint.py --owner-lines owner_lines.txt` shows 0 errors, and each teaser or hedging warning is fixed or is the owner's own line.
- [ ] Product names use the owner's spelling; each synthetic person is called fictional at first naming.
- [ ] `dryrun.mjs`: 0 errors, 0 slow scale runs, 0 text outside the safe area, 0 text under 3:1 on its card, 0 overlapping or clipped texts inside cards, 0 elements over or under the caption bar, and no white-on-white warning left unexplained.
- [ ] `ground-sat-check.py` on the master prints GROUND OK (mean saturation at most 31, at most 5 % of light pixels over 50 %), and the card faces match film #20's.
- [ ] Each screen holds 4 to 8 s and stays still; each device is whole; no frost, haze or texture; no recorded cursor.
- [ ] Captions clear the screens; comparisons show 3 to 5 items at 30 px or more.
- [ ] `seam-check.py` and `motion-check.mjs --flicker` pass on the farm frames.
- [ ] `sfx-audible.py` passes; `encode.sh` from the kit, then `deliver-audio.sh`: each file at −16 LUFS and under −2.0 dBTP.
- [ ] A 16-frame contact sheet checked by eye against these rules and `SENSITIVITY.md`.
- [ ] No media or project-ID logs staged in the film repository; the approved cut copied to `agency-2026/finals/`.

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
13. Encode, re-mux the sound (`tools/deliver-audio.sh`) and QA, against "Before you send a cut" above.
14. Deliver the phone preview.
15. Fix only the changed ranges.
16. Clean up the job and the receiver.

## Path A: app films

Capture named states of the running app (`tools/capture-states.mjs`, with `marks` for exact element boxes). Record interactions as exact
image sequences (`tools/capture-video.mjs`), with the recorded cursor removed. Put them on plates (a still framing: no slow push-ins,
owner 2026-11-13): a dark browser or device frame, a soft shadow, a navy or deeper ground (never a white screen on the white board),
spotlights and rings locked to the marked boxes. Where the real UI is too small to read on a stage screen, re-draw it as an opaque
panel in the Agency look, keeping the app's real labels, numbers and warnings.

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
- **Mix and captions:** `-16 LUFS / -2.3 dBTP` in the mix, so every delivered file stays under −2 dBTP after `tools/deliver-audio.sh`; SRT and VTT captions from the voice's own word times.

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
- Images and videos never go to GitHub (owner, 2026-11-12). Masters, previews, stills, captures and storyboards stay on this machine
  at full resolution. The phone preview (under 30 MB) is the copy to share in chat.

## Where films live

The repo holds only what is needed to make a film: the kit, its templates, its docs and a small example's inputs. Every film is a project
output and lives outside the repo (owner, 2026-11-12). `new-film.mjs` makes film folders in `FILMS_DIR`, by default the `showcase/` folder
beside the repo clone (`/mnt/data/projects/agency-2026/showcase/` on SHELL). Frames, masters and previews stay there.

## Standard operating procedure: the code travels with the film

Every film must be regenerable by someone else, months later. So, for every showcase film:

1. **The film folder is its own git repository, pushed to a private GitHub repository** named
   `GovAlta-EMU/AIDE-AGENCY-2026-FILM-NN-SLUG` (make it with `create-repo`, then `gh repo rename`). `new-film.mjs` runs `git init` and
   writes a `.gitignore` that keeps `out/`, `deliver/`, audio renders, images and videos out. Commit the timeline, narration script,
   `prep/` API answers, figure scripts, `NOTES.md`, `owner_lines.txt` and `PROCESS-LOG.md` as you go; GitHub holds code and text only.
2. **Every custom script lives in the film folder**: figure derivations (#11's `cable-countries.py`, `trace-solve.mjs`), data prep,
   one-off renders. A script that would help the next film goes into the kit instead, and the film's log says so.
3. **`REPRODUCE.md`** (from the kit template) lists every dependency with its pin: the kit commit, the app or data commit (#11: the
   planner at 2610761), the music and its licence, the voice. It ends with the exact commands to regenerate.
4. **`deliver/BUILD.json`** is written by `encode.sh` on every encode: the kit's git commit (and whether it had uncommitted changes),
   the film folder's commit, the full `film.config.json`, the frame count, the voice settings and the encoder.
5. **Images and videos are not in git.** Captures, stills and storyboards stay in the film folder; masters stay in `deliver/`. When the
   owner approves a cut, copy `deliver/` to `agency-2026/finals/NN-slug/` (read-only, with `SHA256SUMS`) and list it in
   `agency-2026/finals/README.md`.
6. **Films live outside the design repo**, in `FILMS_DIR` (default the `showcase/` folder beside the repo clone).
7. **Apps are referenced, not copied**: the app a film shows is checked out beside the films (on SHELL, `agency-2026/apps/<app>`)
   and pinned by commit in `REPRODUCE.md`. The layout of `agency-2026/` is described in its own `README.md`.

The render method itself (why a Cloud Run job, sizing, time, cost, rules) is in `showcase/kit/docs/RENDER-FARM.md`.
