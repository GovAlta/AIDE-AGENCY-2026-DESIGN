# Instructions for AI agents

This repo is the Agency 2026 design system: the tokens, fonts, art, stylesheets, templates and scripts that make Agency media consistent
across print, slides, digital and video. You fill content files; the templates and MVAI own the design. You should never need to choose a
colour, a font or a layout.

Read these before your first piece:

| File | Read it for |
|---|---|
| `guides/BRAND.md` | Colours and their roles, grounds, type, the marks, where circuit art may go |
| `guides/WRITING.md` | Every rule for words on a page, a slide, a banner, a sign or an email |
| `guides/SLIDE-TEXT.md` | Limits for text on screens: headlines, bullets, labels, lower thirds, captions |
| `guides/NARRATION.md` | Everything spoken: voiceover, announcements, speaker introductions; the approved voices (`brand/voice/voices.json`) and the introduction formulas (`brand/voice/intros.json`) |
| `guides/ACCESSIBILITY.md` | Contrast, alt text, reading order, captions; what `--check` enforces |
| `guides/VIDEO.md` | Making a narrated video with MVAI |
| `motion/README.md` | The stage and social motion pieces (title sequence, day bumpers, lower third, countdown, stat reveal, social loops) and how to render or change them |
| `guides/PRINT.md`, `guides/SLIDES.md`, `guides/DIGITAL.md`, `guides/ONSITE.md`, `guides/OFFICE.md`, `guides/QR.md` | The templates and rules for each medium |
| `guides/CHARTS.md`, `guides/ICONS.md`, `guides/IMAGERY.md` | Charts, the Lucide icon set, illustration style and image-generation prompts |
| `guides/SHOWCASE-FILM.md` | Flagship films (app, map or geospatial, data story): when to use one instead of MVAI or a motion piece, and how |
| `guides/DISPLAYS.md` | Stand panels and monitor kiosks: lockup, clear zones, viewing distance, print files |
| `guides/SHOW.md`, `guides/SOUND.md` | Running the event day on screen; the sound identity, music cues and Suno prompts |
| `guides/PRINT-PRODUCTION.md`, `guides/FORM-APP.md` | Print-shop files (bleed, crop marks, CMYK); the Agency Studio web form |

## The rules

1. **Use only the facts you were given.** Never invent a name, number, date, quote, result or event detail. When a layout needs data the
   brief does not give, leave the block out or use generic values labelled "Example values". Record the source of every figure in a
   `NOTES.md` beside the content file.
2. **Conclusions, lessons, asks, credit and closing lines come from the content owner.** Ask for them; do not draft them.
3. **Classification comes from the owner.** Default to Unclassified. Never infer a level from the material.
4. **`brand/tokens/tokens.json` is the only source of colour, type and size.** Never write a hex value, a font name or a pixel size into
   content. Accents are named (`"accent": "green"`).
5. **Never hand-edit generated files.** `styles/tokens.css`, `brand/tokens/tokens.js`, everything in `out/` and every `.html` that
   `make.mjs` writes are generated. Change the source and rebuild.
6. **No HTML in content.** Content files use the inline marks `**bold**` and `==highlight==` only. A layout that needs something new needs a
   new component in `templates/lib/components.mjs`, not markup in JSON.
7. **Check before you deliver.** All of these must pass:
   ```bash
   node scripts/make.mjs <content.json> --check        # no overflow or cut-off text, fonts loaded, alt text, lang, title, contrast
                                                       # (contrast is a warning; --strict makes it a fault)
   python3 scripts/lint/lint.py <content.json>          # 0 writing errors (add --ai-agent for AI services where staff are "agents")
   node scripts/qr-verify.mjs out/**/*qr*.png           # every QR code decodes (when the piece has one)
   python3 scripts/mvai/mvai.py check <spec.json>       # videos: ok true, 0 errors
   python3 scripts/voice/say.py --agenda <agenda.json> --check   # every spoken announcement fills its formula and passes the lint
   ```
8. **Look at the output.** Open every PNG (one per page or slide) and check it by eye: balance, crowding, art clear of text, the right
   classification. A passing check does not show that a page looks right.
9. **One set of figures across media.** A film, a handout and a deck about the same project use the same numbers from the same source.
10. **Report honestly.** Say which checks ran, what they reported, and anything you could not verify.

## Which tool for which piece

| I need | Use | Command |
|---|---|---|
| A handout, fact sheet or one-pager (PDF) | a `print/*` template | `node scripts/make.mjs content.json` |
| A poster, agenda, certificate, badge or table card | a `print/*` template | `node scripts/make.mjs content.json` |
| A slide deck to present or edit | a `slides/*` outline, then the PowerPoint builder | `node scripts/make.mjs deck.json` and `python3 scripts/pptx/build_deck.py deck.json out.pptx` |
| A social card, web banner, email header, Teams background or screen slide | a `digital/*` template | `node scripts/make.mjs content.json` |
| A flagship film of one project (app, map or geospatial, data story; 2–5 min, 1080p60, real captures and data) | `showcase/kit`, reference film `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/` (local, outside the repo) | `npm run film:install`, then `node showcase/kit/tools/new-film.mjs --name <slug> --title "…" --kind app\|map\|data` (`guides/SHOWCASE-FILM.md`) |
| A narrated explainer or sizzle from slides and screens | MVAI, video type `agency-explainer` | `python3 scripts/mvai/mvai.py check` then `create` (`guides/VIDEO.md`) |
| A video thumbnail, lower-third still or title still | a `digital/*` template | `node scripts/make.mjs content.json` |
| A stage motion piece: opening titles, day bumpers, speaker lower third (alpha), session countdown, stat reveal | the motion library, `MG-01`…`MG-05` | `node scripts/motion-render.mjs MG-03` (`--list` for all) |
| A short social animation (square loop, vertical cutdown) | the motion library, `AN-01`, `AN-02` | `node scripts/motion-render.mjs AN-01` |
| A deck on the event team's own PowerPoint template | `brand/pptx/Agency2026_Slide_Template_compliant.pptx` | open it and use its layouts: TITLE, SECTION_DAY1–3, CONTENT, TITLE_ONLY, STATEMENT |
| A stage announcement or speaker introduction (spoken or on screen) | a formula in `brand/voice/intros.json` | `python3 scripts/voice/say.py <formula> ... --out x.mp3` |
| Run the event day on screen: agenda, countdowns, speaker banners, slides, videos, sound; one laptop, or stage and control on separate machines joined by an event code | `show/` | `node show/server.mjs --agenda <agenda.json>`, or the published app (`guides/SHOW.md`) |
| A Word briefing note, memo, speaker brief or event report | `scripts/docx/build_docx.py` or the `.dotx` in `templates/office/` | `python3 scripts/docx/build_docx.py content.json out.docx` |
| A PowerPoint built by hand | `brand/pptx/Agency2026.potx` (13 layouts) | open in PowerPoint |
| An email signature or announcement email | `brand/email/` | `python3 scripts/docx/build_email.py` |
| Stand panel or demo kiosk graphics (2–2.5 ft × 5–7 ft panels; 2.5 × 2.5 ft kiosks with a monitor and ledge) | `displays/` | `node displays/build.mjs displays/specs/<spec>.json --variant all`; send `<face>-production.pdf` (`displays/README.md`, `guides/DISPLAYS.md`) |
| A stage backdrop, booth backdrop or media wall | `onsite/stage-backdrop`, `onsite/booth-backdrop`, `onsite/step-repeat` | `node scripts/make.mjs content.json` then the print-shop export |
| A directional sign, room door sign, stickers or a lanyard | `onsite/wayfinding`, `onsite/room-sign`, `onsite/stickers`, `onsite/lanyard` | `node scripts/make.mjs content.json` |
| A print-ready file for a print shop | the print export | `node scripts/print-export.mjs content.json` (`guides/PRINT-PRODUCTION.md`) |
| A chart in a document or slide | blocks `line`, `column`, `stacked`, `donut`, `waffle`, `gauge`, `timeline`; slide type `chart` | in any blocks list or deck |
| An icon on a tile, step or list item | `"icon": "<lucide-name>"` (`guides/ICONS.md`) | any content file |
| An illustration or key art | the prompt library | `python3 scripts/imagegen.py --subject <id>` (`guides/IMAGERY.md`) |
| A music cue (bed, sting, walk-up, reel) | `brand/audio/cues.json` | `node scripts/audio-prep.mjs <cue-id> <suno-file>` (`guides/SOUND.md`) |
| A QR code | the QR script, or a `qr` block inside any template | `node scripts/qr.mjs URL --out x.svg --png` |
| Circuit traces (thin lines only), a corner cluster, the bus rule, the wordmark | the vector script | `node scripts/vectors.mjs traces --w 1920 --h 1080 --seed my-piece --out art.svg --png` |
| The official invite artwork | `brand/art/invites/` | use unchanged |

`node scripts/make.mjs --list` prints every template with its size and purpose. Each template's header comment documents its content
fields, and `samples/<family>/` has a working content file for every template: copy the nearest one and replace its content.

## Two kinds of video

- **Narrated films** (explainers, sizzles, briefings) are made by MVAI. This repo holds the spec format, the rules and a client; it does
  not render them. See `guides/VIDEO.md`.
- **Motion graphics** (stage openers, bumpers, lower thirds, countdowns, stat reveals, social loops) live in `motion/library` and render
  here, frame-exact, with `scripts/motion-render.mjs`. Change their words and timing in `motion/library/agency-pieces.js`, keep the `CLIPS`
  table in step, re-render, and look at `out/motion/<code>-stills.png`. `motion/README.md` lists every piece with its size, length,
  delivery format and placement. VD-02 and VD-03 are recap templates with labelled footage slots: the event footage does not exist yet, so do not present them as finished films.

## Workflow

1. **Brief.** Write down the audience, the one message, the formats needed, the classification, and the facts supplied (with sources).
2. **Pick the templates** from the table above. For a set (handout, deck and film for one project), use the same accents per section in
   every piece.
3. **Copy the nearest sample** to your working folder and replace its content. Keep `template` as it is.
4. **Write to the rules** in `guides/WRITING.md`, then run the lint.
5. **Make and check**: `make.mjs --check`, `qr-verify.mjs`, and for video `mvai.py check`.
6. **Look at every PNG.** Fix and remake until it is right.
7. **Deliver** the PDFs, PNGs, PPTX or video link, with the `NOTES.md` of sources and a short list of what was checked.

## Setup

```bash
npm install                      # playwright, qrcode, jsqr, pngjs
npx playwright install chromium  # once, if no Chromium is installed
node scripts/build-tokens.mjs    # after any change to tokens.json
```

Python 3.10 or later (standard library only for the lint and the MVAI client; `python-pptx` for the PowerPoint builder).
