# Motion graphics library

The Agency 2026 stage and social motion pieces, supplied by the event team on 2026-11-10 ("Agency 2026 Video Contact Sheet" export).
Every piece is drawn in code as a pure function of time, so it renders the same on every machine and every frame can be checked.

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

`node scripts/motion-render.mjs --list` prints this table from the source. The planning sheet
(`library/agency-2026-video-contact-sheet.dc.html`) also lists AN-03 (circuit logo sting), AN-04 (QR toolbox loop) and VD-01 to VD-04
(sizzle, day recaps, social cutdown). Those six are planned and have placeholder thumbnails only.

## Render

```bash
node scripts/motion-render.mjs MG-01              # out/motion/MG-01.mp4 + MG-01-stills.png (key frames)
node scripts/motion-render.mjs MG-03              # also MG-03-alpha.mov (ProRes 4444, transparent) for live switching
node scripts/motion-render.mjs --all              # all seven; MG-04 is cut to 20 s unless you add --max 0
node scripts/motion-render.mjs MG-01 --scale 2    # 3840×2160
node scripts/motion-render.mjs --all --stills-only
```

The renderer serves `library/` on a local port (the pages fetch their modules, so `file://` does not work), seeks each frame with the
runtime's own transport event, and captures it at 2× before scaling to size. Output does not depend on how fast the machine is.

## Watch and export by hand

Serve the folder and open the library page: `npx http-server motion/library -p 8090`, then
`http://localhost:8090/agency-2026-graphics-library.dc.html`. Each card plays live and has an export button; each
`video-<code>-*.dc.html` page opens one piece full size with a timeline (space plays and pauses, ← → step).

## Change a piece

- Words, colours and timing are in `library/agency-pieces.js`: one function per piece (`pOpening`, `pBumper`, `pLower`, `pCount`, `pStat`,
  `pSquare`, `pVertical`) and the `CLIPS` table (code, length, aspect, delivery, placement, key frames for stills).
- The scene list each piece's page shows on its timeline is the `OM_SCENES` line in its `video-<code>-*.dc.html`. Keep the scene lengths
  adding up to the piece's `dur`.
- Use only the event facts in `brand/tokens/tokens.json` (`event`). A lower third's name and role come from the person, in writing.
- Render, then open `out/motion/<code>-stills.png` and the MP4 and look at them before you send anything.

## Files

| Path | What |
|---|---|
| `library/agency-pieces.js` | the seven pieces and the `CLIPS` table |
| `library/animations-v3.jsx`, `agency-export.jsx` | the composition stage (time, seek, export) and the piece wrapper |
| `library/support.js`, `image-slot.js` | the page runtime that loads the `.dc.html` pages (vendored unchanged) |
| `library/assets/` | key art and the slide-template images the pieces use |
| `library/reference/` | the reference image supplied with the export |

## Look

The pieces follow the compliant slide template (`brand/pptx/Agency2026_Slide_Template_compliant.pptx`): Liberation Sans (Arial), navy
`#002C4E`, date red `#9E2B33`, and the day colours blue `#0077CD`, plum `#730067` and orange `#ED8C00`. That is close to the MVAI kit
palette in `brand/tokens/tokens.json` but not identical; see "Two palettes" in `guides/BRAND.md`.
