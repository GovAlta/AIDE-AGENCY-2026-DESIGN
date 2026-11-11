# Motion graphics library

The Agency 2026 stage and social motion pieces. MG-01 to MG-05, AN-01 and AN-02 were supplied by the event team on 2026-11-10 ("Agency 2026
Video Contact Sheet" export); AN-03, AN-04 and VD-01 to VD-04 were added on 2026-11-11. Every piece is drawn in code as a pure function of
time, so it renders the same on every machine and every frame can be checked. In alpha mode (`window.AGENCY_ALPHA`, set by the renderer's
alpha pass) MG-03 and AN-03 draw on a transparent ground.

## The pieces

| Code | Piece | Aspect | Length | Delivery | Placement |
|---|---|---|---|---|---|
| MG-01 | Opening title sequence | 16:9 | 8 s | ProRes 422 HQ, 3840×2160 | Main stage open |
| MG-02 | Day bumpers (one per day, each with its colour wipe) | 16:9 | 9 s | H.264 MP4 | Stage transitions, days 1–3 |
| MG-03 | Speaker lower third | 16:9 | 6 s | ProRes 4444 with alpha | Live broadcast and recordings |
| MG-04 | Session countdown loop | 16:9 | 5 min | H.264 MP4, 3840×2160 | Lobby and stage screens |
| MG-05 | Stat reveal: 40 working demos | 16:9 | 7 s | ProRes 422 | Day 1 keynote insert |
| AN-01 | Square social loop | 1:1 | 8 s | H.264 MP4 | LinkedIn and Instagram feed |
| AN-02 | Vertical social cutdown | 9:16 | 8 s | H.264 MP4 | Stories and Reels |
| AN-03 | Circuit logo sting: thin traces converge from every edge, then the lockup lands | 16:9 | 4 s | ProRes 4444 with alpha, 3840×2160 | Video open and close |
| AN-04 | Save a demo: QR toolbox loop (sample QR and demo names) | 1:1 | 15 s | H.264 MP4 | Demo booth screens |
| VD-01 | Agency 2026 sizzle reel, cut on the Tech Sizzle Cue downbeats | 16:9 | 65 s | H.264 MP4 with audio | Web, social, stage |
| VD-02 | Day 1 recap template: five labelled footage slots | 16:9 | 3 min | H.264 MP4 | Internal channels |
| VD-03 | Day 3 highlights template: four labelled footage slots | 16:9 | 2.5 min | H.264 MP4 | Web and social |
| VD-04 | Social cutdown "Alberta is moving", burned-in captions | 9:16 | 30 s | H.264 MP4 with audio | Instagram, LinkedIn |

`node scripts/motion-render.mjs --list` prints this table from the source. All 13 pieces on the planning sheet
(`library/agency-2026-video-contact-sheet.dc.html`) now exist. VD-02 and VD-03 are **templates**: the event footage does not exist yet, so
each has labelled footage slots ("Footage: Day 1 keynote", with a lower-third placeholder) between a day title card and the end lockup.
An editor cuts the real clips into those slots in a video editor, using the rendered template as the guide track; the slot times are in
`RECAP` in `agency-pieces.js`.

## Render

```bash
node scripts/motion-render.mjs MG-01              # out/motion/MG-01.mp4 + MG-01-stills.png (key frames)
node scripts/motion-render.mjs MG-03              # also MG-03-alpha.mov (ProRes 4444, transparent) for live switching; AN-03 too
node scripts/motion-render.mjs AN-03 --scale 2    # 3840×2160
node scripts/motion-render.mjs --all              # all 13; pieces over 2 min (MG-04, VD-02, VD-03) are cut to 20 s unless you add --max 0
node scripts/motion-render.mjs --all --stills-only
```

The renderer serves `library/` on a local port (the pages fetch their modules, so `file://` does not work), seeks each frame with the
runtime's own transport event, and captures it at 2× before scaling to size. Output does not depend on how fast the machine is.

## Music

VD-01 and VD-04 carry their music in `CLIPS` (`audio`, `audioStart`): the owner's Tech Sizzle Cue from 34.5 s (VD-01) and from 62.97 s
(VD-04). Their cuts land on the cue's measured downbeats (`SZ` and `VC` in `agency-pieces.js`, from
`brand/audio/analysis/tech-sizzle-cue.beats.json`: bar 2.31 s, break at 28.47 s, peak at 32.33 s of the reel). If the music changes, run
the beat tool on the new file and update those two tables. The renderer trims the audio to the piece, fades the last 1.5 s and masters to
-16 LUFS / -1.5 dBTP with a two-pass loudnorm:

```bash
node scripts/motion-render.mjs VD-01                                   # with its own music
node scripts/motion-render.mjs MG-01 --audio brand/audio/cues/open-show.m4a   # any piece with any cue
node scripts/motion-render.mjs VD-01 --no-audio
```

Which cue plays under which piece on the day is in `brand/audio/cues.json` and `guides/SOUND.md`.

## Watch and export by hand

Serve the folder and open the library page: `npx http-server motion/library -p 8090`, then
`http://localhost:8090/agency-2026-graphics-library.dc.html`. Each card plays live and has an export button; each
`video-<code>-*.dc.html` page opens one piece full size with a timeline (space plays and pauses, ← → step).

## Change a piece

- Words, colours and timing are in `library/agency-pieces.js`: one function per piece (`pOpening`, `pBumper`, `pLower`, `pCount`, `pStat`,
  `pSquare`, `pVertical`, `pSting`, `pToolbox`, `pSizzle`, `pRecap1`, `pRecap3`, `pCutdown`) and the `CLIPS` table (code, length, aspect, delivery, placement, key frames for stills).
- The scene list each piece's page shows on its timeline is the `OM_SCENES` line in its `video-<code>-*.dc.html`. Keep the scene lengths
  adding up to the piece's `dur`.
- Use only the event facts in `brand/tokens/tokens.json` (`event`). A lower third's name and role come from the person, in writing.
- Render, then open `out/motion/<code>-stills.png` and the MP4 and look at them before you send anything.

## Files

| Path | What |
|---|---|
| `library/agency-pieces.js` | the 13 pieces and the `CLIPS` table |
| `library/animations-v3.jsx`, `agency-export.jsx` | the composition stage (time, seek, export) and the piece wrapper |
| `library/support.js`, `image-slot.js` | the page runtime that loads the `.dc.html` pages (vendored unchanged) |
| `library/assets/` | key art and the slide-template images the pieces use |
| `library/reference/` | the reference image supplied with the export |

## Look

The pieces follow the compliant slide template (`brand/pptx/Agency2026_Slide_Template_compliant.pptx`): Liberation Sans (Arial), navy
`#002C4E`, date red `#9E2B33`, and the day colours blue `#0077CD`, plum `#730067` and orange `#ED8C00`. That is close to the MVAI kit
palette in `brand/tokens/tokens.json` but not identical; see "Two palettes" in `guides/BRAND.md`.
