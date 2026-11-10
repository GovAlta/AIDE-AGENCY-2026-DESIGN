# Agency 2026 visual system

Agency 2026 is the Government of Alberta public-service showcase, hosted by the Ministry of Technology and Innovation (Dec. 7–9, 2026,
Edmonton and Calgary). Its look comes from the event invite: rainbow circuit traces that run in from the edges of a white board, white
ring solder pads at the trace ends, a pink microchip, deep-navy type and a maroon date line.

The same look runs through every medium. The MVAI video kit `goa-agency` defined it first, and this repo takes its values from that kit
(`aide-motion-video/engine/kits/goa-agency.js`). One file holds them all: `brand/tokens/tokens.json`. Every stylesheet, template, slide
builder and vector script reads that file. To change a colour, change it there and run `node scripts/build-tokens.mjs`.

## Colour

### Core colours

| Token | Hex | Role |
|---|---|---|
| `navy` | `#022C4C` | Headlines, the wordmark, the footer band, dark tiles, QR modules |
| `ink` | `#06233C` | Lead paragraphs |
| `body` | `#22384C` | Body text on white |
| `mute` | `#4F6274` | Notes, captions, labels, table headers |
| `maroon` | `#882831` | The date line and the "2026" in the wordmark. Use it for dates and nothing else |
| `night` | `#041B30` | The dark ground (video `agency-dark`, dark slides) |
| `navy2` | `#0E3B63` | A second dark fill inside charts on white |
| `white` | `#FFFFFF` | The board: the default ground |
| `paper` | `#F6F7FA` | A soft alternate ground |
| `field` | `#F2F5F9` | Tile and step backgrounds |
| `track` | `#EDF0F4` | The empty part of a bar |
| `neutralBar` | `#9AA6B2` | The comparison bar (for example, the staff bar beside the AI agent bar) |
| `grey` | `#5F6A72` | The Alberta logo grey. Do not use it for text |

### The spectrum

Nine accents, always in this order: `purple #6F2C83`, `blue #0177CD`, `lilac #9C90C5`, `pink #E86BA5`, `coral #EE7A63`, `orange #EE9A2E`,
`yellow #F2C230`, `green #8DC63F`, `cyan #00AAD2`. Two extras, `rose #F38CBA` and `lime #C4D17F`, appear in the trace art.

A film travels through the spectrum: when a scene names no accent, MVAI picks one from its place in the film. Print and slide templates
spread accents the same way when a block gives none. Give each section of a document its own accent and keep it for that section.

### Fills and text are different colours

The raw accents are fills: bars, tile rules, traces, section squares, step borders. Several of them fail contrast as text on white
(yellow, lime, cyan, orange, lilac). For words, use the text-safe set, which reaches at least 4.5 to 1:

| Accent | Text on white (`textOnLight`) | Text on night or navy (`textOnDark`) |
|---|---|---|
| purple | `#6F2C83` | `#C9A2DB` |
| blue | `#015FA8` | `#6FB8F0` |
| lilac | `#5A4E9A` | `#C3BBE6` |
| pink | `#B0306E` | `#F7A8CB` |
| coral | `#B4442C` | `#F6A693` |
| orange | `#A85A00` | `#F7BD6B` |
| yellow | `#8A6A00` | `#F7D774` |
| green | `#4E7A12` | `#B5DE7C` |
| cyan | `#00708C` | `#6FD6EC` |
| maroon | `#882831` | `#E79AA2` |

In CSS, the class `a-<name>` sets `--c` (the fill) and `--ct` (the text-safe colour, which flips on dark grounds). Yellow, lime, rose and
lilac fills take navy text on top of them, never white.

### Edge palettes for traces

| Edge | Colours |
|---|---|
| Left | purple, blue, lilac, cyan, rose |
| Top | lilac, rose, coral, orange, yellow, maroon, pink |
| Right | yellow, orange, lime, green, coral |
| Bottom | pink, maroon, orange, yellow, green, cyan, coral |

## Grounds

The five grounds have the same names in the video kit, the slides and the CSS (`.g-board`, `.g-paper`, `.g-night`, `.g-navy`,
`.g-spectrum`), so one scene description works in every medium.

| Ground | Background | Text | Use |
|---|---|---|---|
| `board` | white | navy | The default for everything |
| `paper` | `#F6F7FA` | navy | A quiet alternate page or slide |
| `night` | `#041B30` | white | Chapter cards, dark slides, the dark video theme |
| `navy` | `#022C4C` | white | Contrast scenes, the quote box, dark tiles |
| `spectrum` | blue gradient | white | The one line the audience should remember. Once per piece |

## Type

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display and headlines | Inter | 800 | Tracking -0.025 em on display sizes, -0.015 em on page titles |
| Section headings | Inter | 800 | Preceded by a small square in the section accent |
| Body | Inter | 400 to 500 | |
| Strong text and labels | Inter | 600 to 700 | |
| Kickers, labels, URLs, the classification pill | Geist Mono | 600 | Upper case, tracking 0.12 to 0.18 em |

The fonts are bundled in `brand/fonts` (both under the SIL Open Font License; see `brand/fonts/README.md`). Every HTML template loads them
from there, so a PDF looks the same on every machine. PowerPoint and Word files name Inter and Geist Mono and fall back to Arial and
Consolas when the reader does not have them installed.

The invite vectors use Liberation Sans (metric-compatible with Arial) because the vectorizer matched the original artwork. New media use
Inter. Keep the invite files as they are and set new text in Inter.

### Sizes by medium

| Element | Print (pt, Letter) | Slides (px at 1920 × 1080) |
|---|---|---|
| Display | 34 | 132 |
| Page or slide title | 26 | 88 |
| Section heading | 13 | 56 |
| Card heading | 10.4 | |
| Lead | 11.6 | 40 |
| Body | 9.4 | 32 |
| Small | 8.6 | 24 |
| Note | 7.8 | |
| Kicker | 8.4 | 22 |
| Stat value | 21 | 120 |

Video sizes belong to the MVAI kit, which fits headlines between 92 and 60 px. Set them through the spec, never by hand.

## The marks

**The Agency wordmark.** "Agency" in navy Inter 800 with "2026" in maroon, over a 3-point spectrum rule. Files:
`brand/logos/agency-2026-wordmark.svg|png` and `agency-2026-wordmark-white.svg|png` (for night and navy). Templates draw it as live text
in the top-left corner of every page, slide and frame, which matches every MVAI frame.

**The Alberta signature.** The official Government of Alberta logo sits top-right (`brand/logos/goa-signature.png` on light grounds,
`goa-signature-white.png` on dark) or bottom-right on covers and end cards (`brand/logos/alberta-logo.svg`). Use the supplied files only.
Do not recolour, stretch, outline or redraw the signature, and keep clear space around it at least the height of its blue square.

**The bird mark.** `brand/art/third-party/bird/bird-mark.png` is a stock vector that arrived as a "LOREM IPSUM" logo template. Its licence
has not been confirmed. Do not use it in published media until the licence is confirmed and recorded in
`brand/art/third-party/bird/README.md`.

## Circuit art

The trace art is the signature of the event. Use it in these places and nowhere else:

- covers, splash screens, title slides and title cards;
- section and chapter cards;
- end cards;
- banners, posters, social cards and other one-message pieces;
- the corners of a handout page, kept outside the text column.

Content screens, content slides and the body of a document stay a clean board. This rule comes from the MVAI kit and from the sponsor's
review of the Contact Alberta film.

Rules for the traces themselves:

- Traces run in from the edges, bend only at 45 degrees and end in white ring pads.
- Corners stay clear. Each edge's art stops short of its neighbour's (`scripts/lib/vectors.mjs` does this by default).
- Art never sits behind text. Templates reserve a safe box, and the art stops at its edge.
- Use `scripts/vectors.mjs` with a seed for new arrangements. The same seed always gives the same art, so record the seed with the piece.
- The invite artwork in `brand/art/invites` is the reference. Reuse it unchanged for the event's own announcements.

**The microchip.** The pink chip appears on the splash, a cover or a title card only, once per piece, with its lead trace running to a pad.

**The bus rule.** Two to four stacked coloured rules, each shorter than the one above, sit under a page or slide title. Choose the colours
of the section that follows.

**The spectrum bar.** A 3 to 4 point gradient rule in spectrum order. It sits under the wordmark and along the bottom edge of the navy
quote box.

## The classification band

Every page, slide and video frame ends in a navy band with a white mono classification pill on the right. The default is UNCLASSIFIED.
The content owner sets the level; a template never infers it from the material. MVAI draws the same marking on every frame
(`classification` in the spec).

## Do and do not

| Do | Do not |
|---|---|
| Take every colour from `tokens.json` | Pick colours by eye or from a screenshot |
| Use the text-safe accent for words | Set yellow, lime or cyan text on white |
| Keep content pages and slides clean | Put traces behind charts, tables or paragraphs |
| Give each section one accent | Use every spectrum colour on one slide |
| Use the spectrum ground once per piece | Make a spectrum slide for every point |
| Use Inter and Geist Mono from `brand/fonts` | Substitute another typeface in HTML or PDF output |
| Use the supplied Alberta signature files | Recolour, crop or redraw the signature |
| Keep the date in maroon | Use maroon as a general accent |
| Show the classification on every page | Remove the band to gain space |
| Use generic, labelled example values in samples | Present invented numbers as results |

## Two palettes (open decision)

Two close variants of the Agency look exist in the official materials:

| | MVAI kit (this repo's tokens) | Event team (compliant template, motion library, invites) |
|---|---|---|
| Type | Inter, Geist Mono | Liberation Sans or Arial (the invites' text was matched to Liberation Sans) |
| Navy | `#022C4C` | `#002C4E` |
| Date red | `#882831` | `#9E2B33` |
| Blue | `#0177CD` | `#0077CD` |
| Other accents | purple `#6F2C83`, pink `#E86BA5`, orange `#EE9A2E`, yellow `#F2C230`, green `#8DC63F`, cyan `#00AAD2` | plum `#730067`, pink `#EF4B8B`, orange `#ED8C00`, yellow `#FFC836`, green `#78BF26`, cyan `#00B6ED` |
| Used by | MVAI videos, the Contact Alberta handout, every template here | the slide template, MG/AN motion pieces, the invite vectors |

The differences are small enough that the two sit together on one stage, but they are visible side by side. The event team's values are
recorded in `tokens.json` under `compliant`. Which set is canonical is the owner's decision; until it is made, keep each piece in its own
set and do not mix the two inside one piece.
