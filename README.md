# AIDE-AGENCY-2026-DESIGN

The design system for **Agency 2026**, the Government of Alberta public-service showcase hosted by the Ministry of Technology and
Innovation (Dec. 7–9, 2026, Edmonton and Calgary). Any team, or any AI agent, can use it to make handouts, posters, slide decks, banners,
social cards, QR codes and videos that share one look: the circuit-board art of the event invite, Inter type, navy and maroon, and the
nine-colour spectrum.

Everything reads one file of design tokens, `brand/tokens/tokens.json`, taken from the MVAI video kit `goa-agency`. A handout, a deck and a
film made from this repo use the same colours, fonts, marks and footer band.

## What is here

| Path | What |
|---|---|
| `AGENTS.md` | Instructions for AI agents: the rules, which template for which piece, the workflow |
| `guides/` | `BRAND.md`, `WRITING.md`, `VIDEO.md`, `PRINT.md`, `SLIDES.md`, `DIGITAL.md`, `QR.md`; `reference/` holds the owner's video standard and the shared writing guide |
| `brand/tokens/` | `tokens.json`, the one source of colour, type, sizes and event facts |
| `brand/fonts/` | Inter and Geist Mono (SIL Open Font License) |
| `brand/logos/` | The Alberta signature (colour and white), the Alberta logo, the Agency 2026 wordmark |
| `brand/art/` | The official invite vectors, the handout corner art, generated trace sets (thin lines; the chip icon is retired) |
| `styles/` | `tokens.css` (generated) and `agency.css`, the shared components |
| `templates/` | Print, digital, slide and video-still templates (JavaScript modules that render content JSON to HTML) |
| `scripts/` | `make.mjs` (content to PDF/PNG), `vectors.mjs`, `qr.mjs`, `qr-verify.mjs`, `build-tokens.mjs`, `pptx/build_deck.py`, `lint/lint.py`, `mvai/mvai.py` |
| `samples/` | A working content file for every template, the Contact Alberta handout reproduction, and video specs with MVAI frames |
| `motion/` | The stage and social motion library (MG-01 to MG-05, AN-01, AN-02), rendered by `scripts/motion-render.mjs` |
| `brand/pptx/` | The event team's compliant PowerPoint template |
| `showcase/` | High-quality narrated films: the production kit (`showcase/kit`), the reference film #11 Pan-Canadian Fibre Optics Planner, the evaluation (`guides/SHOWCASE-FILM.md`) |
| `show/` | The run-of-show player: one agenda JSON runs the event day; stage and control on one laptop or on two machines joined by an event code (`guides/SHOW.md`) |
| `displays/` | Parametric stand panels and monitor kiosks: real-size SVG, PDF, `.ai`, print-ready CMYK, layout drawings, 3D renders (`displays/README.md`) |
| `app/` | Agency Studio, a web form for staff: pick a template, fill it in, preview, download (`guides/FORM-APP.md`) |
| `brand/voice/`, `brand/audio/`, `brand/imagery/`, `brand/icons/`, `brand/email/`, `brand/pptx/` | Approved voices and introduction formulas; music cues and Suno prompts; image prompts and samples; Lucide icons; Outlook signature and email; the PowerPoint template |
| `contact-sheets/` | Every template, video screen and motion piece at a glance (`index.html`) |
| `examples/` | Finished outputs to look at without building: handout PDF, sample deck PDF and PPTX, motion MP4s |

## Quick start

```bash
npm install && npx playwright install chromium
node scripts/make.mjs --list                                   # every template
node scripts/make.mjs samples/print/contact-alberta-handout.json   # -> out/print/contact-alberta-handout.pdf
node scripts/make.mjs --all --check                            # every sample, with fit and font checks
python3 scripts/lint/lint.py samples/**/*.json                 # writing rules
node scripts/qr.mjs "https://www.alberta.ca" --out out/qr/ab.svg --png && node scripts/qr-verify.mjs out/qr/ab.png
```

Narrated videos: see `guides/VIDEO.md`. MVAI renders them; `scripts/mvai/mvai.py` checks and submits specs.
Motion graphics: `node scripts/motion-render.mjs --list`, then `node scripts/motion-render.mjs MG-01` (see `motion/README.md`).
Slides: `python3 scripts/pptx/build_deck.py samples/slides/agency-sample-deck.json out/slides/deck.pptx`.
Rebuild everything and the contact sheets: `npm run build`.

## For Claude Code users

The `agency-design` skill is installed for every session under `/mnt/data/projects` (source: `.claude/skills/agency-design/`). Asking for any
Agency 2026 piece ("a poster for day 2", "a deck for our demo", "kiosk graphics", "run the show") loads the rules and commands.

## Look

Traces are thin lines of even weight; there are no thick ribbons and no chip icon (owner direction, 2026-11-11).

## Open decision

The MVAI kit (Inter, navy `#022C4C`) and the event team's compliant template and motion library (Arial or Liberation Sans, navy `#002C4E`)
are two close variants of the Agency look. `guides/BRAND.md` (Two palettes) sets them side by side. The owner decides which is canonical.

## Sources

- Video kit and tokens: `aide-motion-video/engine/kits/goa-agency.js` (MVAI).
- Handout: `contact-alberta/docs/handout/agency-2026-handout.html`, reproduced from JSON by `samples/print/contact-alberta-handout.json`.
- Motion library and compliant slide template: the event team's "Agency 2026 Video Contact Sheet" export of 2026-11-10.
- Invite artwork: the VSAI vectors of 2026-11-03 (`brand/art/invites/README.md`).
- Writing rules: `/mnt/data/projects/_styles/` and the owner's narrated-video standard (`guides/reference/`).
