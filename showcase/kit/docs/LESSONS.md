# Lessons from films #1 (Atlas) and #2 (Contact Alberta)

Written 2026-11-12/13 after both films were made in one night. Read this before starting a film. Each film's own `PROCESS-LOG.md` has
the detail (`/mnt/data/projects/agency-2026/showcase/01-atlas`, `02-contact-alberta`). The owner's wording rules are in
`guides/NARRATION.md` ("Owner rules from the review of film #1").

## The order that works

1. **Facts first.** Check every claim in the brief against the code and the record; return each as supported, partly or not found, with
   its source, before a word of script. Film #1's brief had four claims that needed the owner's decision (licence, a performance
   comparison, an integration not yet connected, product names).
2. **Look second, as real rendered frames.** Storyboard three moments in several styles and let the owner pick. The first look built
   for film #1 (a tilted diagram board) was rejected outright; six style frames found the answer in one round. Ask for references or
   style words ("neumorphism, glass, screens in 3D space") before building an engine.
3. **Script third, approved as plain text before any cue.** Film #1's script changed five times after picture work began, and one cut
   was thrown away. Show the owner the whole script, read aloud, and get a yes.
4. **Then picture, to a shot plan cued from the voice's word times.** One table maps shots to lines; a re-time is a table edit.
5. **Review stills in contact sheets against a stated bar, more than once.** Then render in the cloud, mix, encode, check frames.

## What makes a script land (the owner's reviews)

- Start from what the audience already does and the gap they feel, in the owner's words if the owner offers them.
- Show value before mechanism: one piece of work followed from a conversation to an outcome. A list of features is not a film.
- Every line says what it means in words people use. If you cannot say what a phrase means in one plain sentence, cut the phrase.
- Define a term inside its sentence. No second sentence that leans on a pronoun.
- Say what exists today and how it grows. Never a count that will date the film ("20 people today").
- Pitch lines are the owner's own words. On-screen lines name what is shown, as film #11 did.
- A clean lint run is not a review. The lint checks words and shapes; the owner checks meaning.
- Focus on capability. Do not criticise what exists today (film #2: no staff comparisons).

## What makes a frame market quality

- **The hero fills the frame**: 55–70 % of the width, key text 30 px or more. Supporting windows are readable, or soft shapes in clear
  depth cropped by the frame. A wide frame of many small windows always reads as a diagram.
- **Type is a designed element**: headlines Inter 800 at 76–96 px, arriving by word; pitch statements full frame at 110–150 px on a calm
  ground with everything else far back, dimmed and defocused before the first word.
- **Numbers and scale are felt**: a counter 200 px or taller; the wall as a floor seen from its near edge, running to a horizon.
- **No dead frames**: a window enters at the start of its line, not on a name spoken at its end; overlap outgoing and incoming windows;
  rack focus instead of travelling through empty space; no window sits half empty waiting for content.
- **One real capture** inside a glass window for the moment that must feel real; re-drawn screens with the app's real labels elsewhere.
- **No template or instruction text can reach a frame**: the dry run fails on `[[ … ]]`, `EXAMPLE:` and "replace before review".

## Production numbers (Cloud Run job farm, 100 tasks of 4 vCPU)

| Film | Frames | Render | Cost (estimate) | Note |
|---|---|---|---|---|
| #1 Atlas, 4:00, spatial stage | 14,386 | about 10 min, no failed tasks | $5–7 | floor frames were the slow ones |
| #2 Contact Alberta, 2:15, spatial stage | 8,100 | about 3 min for 8,000 frames; one slow task took 20 min for the last 81 | under $2 | after the wall canvas became CPU-backed (0.25 s a floor frame, was 5–10 s) |
| #11 Fibre planner, 3:17, globe with terrain | 11,856 | about 45 min | $10–35 | software WebGL |

- Measure frame cost in the cloud job's first minute, not on the shared VM (load there made numbers 2–4 times too high).
- A stuck last task is normal: start a second small execution for the missing frames instead of waiting.
- AAC encoding lifts the true peak by about 0.2–0.3 dB: mix to −2.3 dBTP if the master must stay under −2.

## Working with agents on a film

- Split by file ownership: facts, captures, engine, screens, direction. One director per film holds the timeline.
- Give the director the bar in the owner's words and a numbered punch list after each sheet review; ask for the weakest five moments
  honestly in every report.
- Start the second film's maker with the first film's review findings up front: film #2's first pass needed one short polish, film
  #1's needed three.
- Kit fixes go in the kit, product-neutral, committed and pushed as they are made; films pin the kit commit in `deliver/BUILD.json`.

## Still to build in the kit

- Sound design beyond voice and music (interface ticks, call audio).
- Cuts on the music, and a signature transition between shots.
- Real third-party product screens are not available; name tiles stand in. A library of richer generic tiles would help openings.
- `camcheck` for the spatial camera is `tools/motion-check.mjs`; run it on rendered frames as well as locally.

## From film #1's owner review (2026-11-13): flicker and padding

- **Flicker the owner saw, causes found on the rendered frames.** (1) A window's blur moved in quarter-pixel steps during a focus rack, and
  the window swapped between real backdrop glass and the frosted fill, and between two shadows, as its blur crossed a threshold: a
  text-heavy window (the team board) visibly jumped several times. (2) A screen rounded opacity to one decimal: a three-second fade showed
  as ten jumps (Vector Studio). Fixes are in the kit (`spatial-stage.js`: continuous blur, material from the window's own properties only,
  one shadow, snap opt-in) and the rule is in `web/modules/README.md`. **A contact sheet cannot show flicker; neither can a global
  frame-difference test when the camera is moving.** Measure each window's own box on the rendered frames:
  `tools/motion-check.mjs --flicker out/frames` (luminance and sharpness per window; zero flags passes).
- **Never decide how a thing is drawn from a threshold on a value that moves** (blur, angle, rank, distance). Either make the drawing
  continuous in that value or fix the choice for the thing's whole visible life. Frames render independently in the cloud, so "remember
  the last choice" is not available: the choice must be a pure function of the state.
- **Padding.** Content that sat lower than its top gap, or was clipped at the bottom, came from three faults: a padded wrapper inside a
  padded root; bottom-anchored rows placed 30 or 34 px from the edge under a 36 px top; and rows whose text grew as it streamed in.
  `tools/padding-check.mjs` measures all four gaps for every screen at three moments and fails on a 2 px difference.
- **The centrepiece must look like the real thing.** A raw capture of a toy page read as "simplistic". A re-drawn, believable application
  in the organisation's own web look (header, breadcrumb, filters, a real-looking map, a legend, a popup, "Invented demo data") reads as a product.

## From films #3 (MVAI) and #5 (Highway and Bridge), owner reviews 2026-11-13

- **Never slow a clip.** Ten clips in #5 were slowed to fill their shots and read as a low frame rate. Play footage at speed 1.0 mapped
  to the source's own frames; a long shot takes a longer source range or a second clip. Measure unique frames a second on the rendered
  frames (24 or more for moving footage).
- **No frost, haze or foggy white anywhere on footage, not even behind text.** Washes "cover too much" (film #5, first cut); the soft
  patch behind headlines that replaced them was also rejected (owner, 2026-11-13: "don't use that foggy white background behind text
  in any more videos"). Put text on a glass card or a solid navy band; footage stays clean and in full colour. `scrims` are retired.
- **No busy texture behind an explanation.** A floor of tiles under the cards was "distracting". Explanation scenes use the calm glass
  ground of #1 and #2; a product's own frames appear only where they are the subject (a style flip, a montage).
- **See-through cards flicker on the farm.** A blurred, half-transparent card drew blank for single frames, and two cards at the same
  depth swapped order as the camera moved. Bake the blur into the card image and show it opaque; keep overlapping cards apart in
  depth. The flicker check now includes see-through windows.
- **Working with the owner:** make visual contact sheets and mockups first and get a yes; then fix and deliver without repeated
  frame-by-frame rounds ("I can review"). Approved cuts go to `agency-2026/finals/NN-slug/`; images and videos never go to GitHub.

## From film #4 (VSAI), owner review 2026-11-13: a seam from one farm task

- **One task drew its whole chunk without the film's stylesheet.** Frames 1126-1136 (0.18 s) showed the gallery cards at their images'
  natural size and the headline wrapped at the kit's narrower width, then snapped back. `/film.css` is linked with `onerror="this.remove()"`
  (a film may have none), so a failed request dropped the film's look silently and the page still reported ready. Fix in `web/main.js`:
  a missing stylesheet or @import now counts in `window.filmInitErrors` (the farm refuses the page and opens a new one); before frame 0
  the page waits for `document.fonts.ready`, decodes every image and waits two animation frames; each `frame(n)` decodes any new image.
- **Check seams on the rendered frames:** `python3 tools/seam-check.py <film>` finds a chunk (from the frames' write order) that jumps in
  and back out while the frames on either side agree (ISLAND), and single jumps on a chunk boundary (BOUNDARY, look at them). Run it
  after every farm render, with the flicker check.
