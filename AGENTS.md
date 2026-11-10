# Instructions for AI agents

This repo is the Agency 2026 design system: the tokens, fonts, art, stylesheets, templates and scripts that make Agency media consistent
across print, slides, digital and video. You fill content files; the templates and MVAI own the design. You should never need to choose a
colour, a font or a layout.

Read these before your first piece:

| File | Read it for |
|---|---|
| `guides/BRAND.md` | Colours and their roles, grounds, type, the marks, where circuit art may go |
| `guides/WRITING.md` | Every rule for words on a page, a slide, a banner or in narration |
| `guides/VIDEO.md` | Making a narrated video with MVAI |
| `motion/README.md` | The stage and social motion pieces (title sequence, day bumpers, lower third, countdown, stat reveal, social loops) and how to render or change them |
| `guides/PRINT.md`, `guides/SLIDES.md`, `guides/DIGITAL.md`, `guides/QR.md` | The templates and rules for each medium |

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
   node scripts/make.mjs <content.json> --check        # no overflow, no text cut off, bundled fonts loaded
   python3 scripts/lint/lint.py <content.json>          # 0 writing errors (add --ai-agent for AI services where staff are "agents")
   node scripts/qr-verify.mjs out/**/*qr*.png           # every QR code decodes (when the piece has one)
   python3 scripts/mvai/mvai.py check <spec.json>       # videos: ok true, 0 errors
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
| A narrated explainer, sizzle or showcase film | MVAI, video type `agency-explainer` | `python3 scripts/mvai/mvai.py check` then `create` (`guides/VIDEO.md`) |
| A video thumbnail, lower-third still or title still | a `digital/*` template | `node scripts/make.mjs content.json` |
| A stage motion piece: opening titles, day bumpers, speaker lower third (alpha), session countdown, stat reveal | the motion library, `MG-01`…`MG-05` | `node scripts/motion-render.mjs MG-03` (`--list` for all) |
| A short social animation (square loop, vertical cutdown) | the motion library, `AN-01`, `AN-02` | `node scripts/motion-render.mjs AN-01` |
| A deck on the event team's own PowerPoint template | `brand/pptx/Agency2026_Slide_Template_compliant.pptx` | open it and use its layouts: TITLE, SECTION_DAY1–3, CONTENT, TITLE_ONLY, STATEMENT |
| A QR code | the QR script, or a `qr` block inside any template | `node scripts/qr.mjs URL --out x.svg --png` |
| Circuit traces, a corner cluster, the chip, the bus rule, the wordmark | the vector script | `node scripts/vectors.mjs traces --w 1920 --h 1080 --seed my-piece --out art.svg --png` |
| The official invite artwork | `brand/art/invites/` | use unchanged |

`node scripts/make.mjs --list` prints every template with its size and purpose. Each template's header comment documents its content
fields, and `samples/<family>/` has a working content file for every template: copy the nearest one and replace its content.

## Two kinds of video

- **Narrated films** (explainers, sizzles, briefings) are made by MVAI. This repo holds the spec format, the rules and a client; it does
  not render them. See `guides/VIDEO.md`.
- **Motion graphics** (stage openers, bumpers, lower thirds, countdowns, stat reveals, social loops) live in `motion/library` and render
  here, frame-exact, with `scripts/motion-render.mjs`. Change their words and timing in `motion/library/agency-pieces.js`, keep the `CLIPS`
  table in step, re-render, and look at `out/motion/<code>-stills.png`. `motion/README.md` lists every piece with its size, length,
  delivery format and placement. Planned pieces on the video contact sheet that are not built yet (AN-03, AN-04, VD-01 to VD-04) have
  placeholder thumbnails only: do not present them as finished.

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
