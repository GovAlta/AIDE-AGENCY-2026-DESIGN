# Displays: stand panels and demo kiosks

The rules for large printed displays on the Agency 2026 floor. The tools, parameters and file list are in `displays/README.md`.

## What a display is

| Kind | Typical size | Faces |
|---|---|---|
| Stand panel | 24 × 60 in to 30 × 84 in (2 to 2.5 ft wide, 5 to 7 ft tall) | one printed front, on a banner stand or rigid board with feet |
| Demo kiosk | 30 × 30 in footprint, 72 or 84 in tall | four printed faces wrapped round a column; a monitor on the front above a small desk ledge |

Make one with a spec file in `displays/specs/` and `node displays/build.mjs <spec> --variant <design>`. The size is a parameter: do not
redraw art for a new size, change the spec and rebuild.

## The lockup

Every face carries the same header, centred across the top of the face (owner review, 2026-11-11):

1. **Row 1: "Agency" and the Alberta logo, side by side at the same height.** The cap height of "Agency" equals the height of the logo's
   script, and both sit on one baseline. The pair is centred and spans the content width of the face. "Agency" stands alone: **no date**
   on a display (the stands stay in use across all three days). `"wordmark": "Agency 2026"` is allowed when the owner asks for the year;
   never a date or a city list. The Alberta logo is the official vector (`brand/logos/alberta-logo.svg`), never redrawn, stretched or
   recoloured (white on a night or navy ground).
2. **The trace underline under "Agency":** a thin blue trace exactly as wide as the word, a 45-degree step and a ring pad under its last
   letter.
3. **Row 2: "Technology and Innovation"** on one line, centred, as wide as row 1, never below a 0.75 in cap height.

The scripts size the whole header from the face width (`headerWidth`, default 1 = the full content width), so a 24 in panel and a 30 in
kiosk face get the same proportions. All of it is outlined in the production files, so it prints the same on every machine.

## Clear zones

Traces never run behind type, the logo, the monitor or a QR code. The model gives each face clear zones, and every trace is cut where it
would enter one (with a pad on the cut end):

| Zone | Where | Why |
|---|---|---|
| Header | the full width of the face down to 0.9 in below the lockup | the brand reads first, on a clean ground |
| Monitor window | the screen plus 0.75 in all round, on a kiosk front | the screen covers it; it is also the mount and cable zone (CutContour path) |
| Title | under the header, when a session or demo title is set | type needs a clean ground |
| QR code | the code plus 1.4 in all round, and its label | a QR code needs a 4-module quiet zone, and traces near it confuse phone cameras |
| Safe margin | 1.5 in inside the trim (default) | type, the logo, QR codes and trace pads stay inside it, so trimming and wrapping round edges cannot cut them |

The desk ledge is **not** a clear zone: the art runs behind it, so the face looks continuous above and below the ledge. The ledge appears
in the layout drawings and the renders only.

## Traces

- **Thin, like a real circuit board.** No stroke wider than 0.2 in at full size; most lines are 0.09 to 0.17 in. Pads are in proportion.
  No ribbons, no bold bands and **no chip icon** (owner direction, 2026-11-11).
- Traces run in from the edges with 45° bends and end in ring pads, in the spectrum's colours: purple and blue from the left, yellow and
  green from the right, the full spectrum from the floor.
- Corners stay calm: on a kiosk, either keep each face's art to that face, or use `wrap`, which draws one system round all four faces so
  every trace meets itself at the corners.
- Same seed, same art. Give each kiosk in a row its own seed or design, so neighbours do not repeat.

## Type size and viewing distance

Cap height (the height of a capital letter) sets how far away a line can be read:

| Viewing distance | Readable (1 in per 10 ft) | Comfortable (1 in per 5 ft) |
|---|---|---|
| 3 ft (at the desk) | 0.3 in | 0.6 in |
| 6 ft | 0.6 in | 1.2 in |
| 10 ft (across an aisle) | 1 in | 2 in |
| 20 ft (across a hall) | 2 in | 4 in |

On a 30 in face the defaults give "Agency" a cap height of about 2.7 in (readable at about 27 ft) and "Technology and Innovation" about
1.7 in. A narrower header (`headerWidth` 0.8) scales both down together. Raise
`subCapHeight` for stands seen mainly from farther away. A session title defaults to about 1.6 in cap height; keep titles under eight words.

## Content

- Use only real facts: the event facts in `brand/tokens/tokens.json` and what the owner gives you. A display has no room for paragraphs:
  the lockup, at most one title with a kicker, and at most one QR code with its printed URL.
- A QR code always has its URL printed under it, for people who cannot scan. Test every code with `node scripts/qr-verify.mjs` on the
  preview PNG and with a phone on the printed proof.
- Screens on a kiosk show Agency content (an MVAI explainer, the show player or slides); the monitor window itself is never printed art.

## Materials and printing

| Material | Use | Notes |
|---|---|---|
| Rigid board (Sintra or other PVC foam, 3–6 mm) | kiosk faces, panels on feet | crisp edges; ask whether the vendor routes the monitor opening from the CutContour path |
| Vinyl wrap on a frame or board | kiosk wraps (`wrap-production.pdf`) | one artboard round all four faces; fold lines are marked outside the trim |
| Fabric (dye-sublimation) | tension-fabric stands | colours print brighter and slightly softer; ask for the vendor's bleed (often 0.5–1 in) and set `bleed` |
| Retractable banner (polyester or vinyl) | panels on a cassette base | the bottom 3 to 6 in sits in the cassette: keep QR codes and titles above it (set `qr.bottom`) |

- Send `<face>-production.pdf` (or `wrap-production.pdf`). It is CMYK with trim and bleed boxes, crop marks and a CutContour spot path.
- Ask the vendor for their ICC profile and rebuild with `--icc`. With the generic profile, night designs come out near 360% total ink;
  most large-format printers want 300% or less.
- Always approve a printed proof of the navy, the date red and the spectrum before the full run (`guides/PRINT-PRODUCTION.md` lists the
  measured colour shifts: navy and purple move most).
- Check the art at full size on screen (the SVG at 100% zoom) before you send it: a trace that looks fine at 40 ppi can sit too close to
  a cut.
