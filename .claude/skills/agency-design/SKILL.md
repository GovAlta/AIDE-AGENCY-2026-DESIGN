---
name: agency-design
description: Make any Agency 2026 media (the Government of Alberta showcase, Dec. 7–9, 2026, Edmonton and Calgary) in the event's look from the AIDE-AGENCY-2026-DESIGN repo - handouts, fact sheets, posters, agendas, badges, table tents, certificates, reports, postcards, slide decks and PowerPoint, social posts, stories, banners, email headers, Teams backgrounds, signage, roll-up and stage backdrops, wayfinding, stickers, QR codes, Word briefing notes and memos, motion graphics (title sequence, day bumpers, lower thirds, countdowns, sizzle), the day-long run-of-show player, sound cues, narrated MVAI agency-explainer videos, stand panels and monitor kiosks, and flagship showcase films (app, map or geospatial, data story) through the showcase kit. Use whenever someone asks for anything "for Agency 2026", "in the Agency look", "with the circuit traces", or names one of these pieces for the event.
---

**First:** `bash /mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN/scripts/sync.sh` (GitHub `main` is the official version; the
local clone is a working copy, and this skill is a link into it). Change the repo only by commit and push.

# Agency 2026 design system

Everything Agency 2026 is made from one repo. You fill content files; the templates, tokens and MVAI own the design. Never choose a
colour, font or layout yourself.

## Where it is

- On a SHELL VM: `/mnt/data/projects/agency-2026/AIDE-AGENCY-2026-DESIGN`
- GitHub (private, GovAlta-EMU): `gh repo clone GovAlta-EMU/AIDE-AGENCY-2026-DESIGN && cd AIDE-AGENCY-2026-DESIGN && npm ci && npx playwright install chromium`

Work from the repo root. Read `AGENTS.md` there before your first piece; it is the full rule set and decision table. This skill is the
summary.

## Rules (from AGENTS.md)

1. Use only the facts you were given. Event facts are in `brand/tokens/tokens.json` (`event`). Never invent names, numbers, dates,
   quotes or results; label sample values "Example values"; record every figure's source in a `NOTES.md` beside the content.
2. Conclusions, asks, credit, closing lines and the classification come from the content owner. Default classification: Unclassified.
3. `brand/tokens/tokens.json` is the only source of colour and type. Content names accents (`"accent": "green"`), never hex values.
4. Never hand-edit generated files (`styles/tokens.css`, `brand/tokens/tokens.js`, anything in `out/`). No HTML in content: `**bold**`
   and `==highlight==` only.
5. Writing follows `guides/WRITING.md`; narration follows `guides/reference/VIDEO-STYLE-GUIDE.md`.
6. Accessibility follows `guides/ACCESSIBILITY.md`: alt text on every image, a printed URL beside every QR code, colour never the only signal.
7. Look at every PNG you produce before you deliver it. Report which checks ran and what they found.

## Which tool

| Piece | Use | Command |
|---|---|---|
| Handout, fact sheet, report, poster, agenda, badge, table tent, demo card, certificate, postcard | `print/*` | `node scripts/make.mjs content.json` |
| The same, for a print shop (bleed, crop marks, CMYK) | print export | `node scripts/print-export.mjs content.json` (`guides/PRINT-PRODUCTION.md`) |
| Social post, story, banner, email header, web hero, Teams background, signage, thumbnail, lower-third still, roll-up | `digital/*` | `node scripts/make.mjs content.json` |
| Stage or booth backdrop, step-and-repeat, room and wayfinding signs, stickers, lanyard | `onsite/*` | `node scripts/make.mjs content.json` |
| Slide deck (PNG/PDF and editable PowerPoint) | `slides/deck` | `node scripts/make.mjs deck.json` then `python3 scripts/pptx/build_deck.py deck.json out/slides/deck.pptx` |
| Word briefing note, memo, speaker brief, event report | office docs | `python3 scripts/docx/build_docx.py content.json out/office/x.docx --pdf` |
| Outlook signature, email announcement | email | `python3 scripts/docx/build_email.py` |
| QR code | QR script or a `qr` block in any template | `node scripts/qr.mjs URL --out x.svg --png` then `node scripts/qr-verify.mjs x.png` |
| Circuit traces (thin only, no chip), bus rule, wordmark | vectors | `node scripts/vectors.mjs traces --w 1920 --h 1080 --seed name --out art.svg --png` |
| Motion graphics (MG-01…05, AN-01…04, VD-01…04) | motion library | `node scripts/motion-render.mjs --list`, then `node scripts/motion-render.mjs MG-03` (`motion/README.md`) |
| Sound cues for transitions, walk-ons, sizzles | cue sheet | `node scripts/audio-prep.mjs --list` (`guides/SOUND.md`) |
| On-brand illustration | prompt library | `python3 scripts/imagegen.py --list` (`guides/IMAGERY.md`; every image is disclosed as AI-generated) |
| The whole day on screen: countdowns, speaker welcomes, slides, video, music | run-of-show player | `node show/server.mjs --agenda show/samples/agency-2026.json` (`show/`) |
| Flagship film of one project: real app captures or geospatial data on a cinematic camera, 2–5 min, 1080p60 | showcase kit (also the `showcase-film` skill) | `npm run film:install`, `node showcase/kit/tools/new-film.mjs --name <slug> --title "…" --kind app\|map\|data` (`guides/SHOWCASE-FILM.md`; reference: `/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/` (local, outside the repo)) |
| Narrated explainer, sizzle or briefing film from slides and screens | MVAI, video type `agency-explainer` | `python3 scripts/mvai/mvai.py check spec.json`, then `create` (`guides/VIDEO.md`) |
| A non-technical person making their own piece | Agency Studio form app | `node app/server.mjs` (`guides/FORM-APP.md`) |

`node scripts/make.mjs --list` prints every template with its size and purpose. Each template's header comment documents its fields, and
`samples/<family>/` has a working content file for every template: copy the nearest sample, keep its `"template"`, replace the content.

## Checks before delivery

```bash
node scripts/make.mjs content.json --check        # fit, overflow, fonts, alt text, page title/lang; contrast warnings (--strict: faults)
python3 scripts/lint/lint.py content.json         # 0 writing errors (--ai-agent when staff are also called "agents")
node scripts/qr-verify.mjs out/<family>/<name>.png   # when the piece has a QR code (crop to the code for the shrink test)
python3 scripts/mvai/mvai.py check spec.json      # videos: ok true, 0 errors
```

Then open every PNG and look at it. Deliver the files, the `NOTES.md` of sources, and a short list of what was checked and what was not.

## Open decision

Two close palettes exist: the MVAI kit (Inter, navy `#022C4C`), used by the tokens and every template, and the event team's compliant
template and motion library (Arial or Liberation Sans, navy `#002C4E`). `guides/BRAND.md` ("Two palettes") sets them side by side. Do not
mix them inside one piece, and do not pick one for the owner.
