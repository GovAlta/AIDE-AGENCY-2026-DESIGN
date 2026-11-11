# On-site and large format

Templates for the venue: stage and booth backdrops, a media wall, directional and room signs, stickers and lanyards. Each one renders a
vector PDF at its real trim size and a PNG preview:

```bash
node scripts/make.mjs samples/onsite/stage-event.json      # -> out/onsite/stage-event.pdf (192 x 108 in) + .png
node scripts/make.mjs --list | grep onsite
```

Every piece is laid out on a fixed design canvas (for example 1920 x 1080 for a 16:9 backdrop) and scaled to inches, so the PDF stays
vector at 16 ft. Only vector marks are used: the Alberta logo SVG and the outlined Agency wordmark.


| Template | Real size | Use it for | Samples |
|---|---|---|---|
| `onsite/stage-backdrop` | 16 x 9 ft (also 12 x 6.75, 20 x 11.25, 24 x 13.5) | Stage wall behind the lectern: event or one day | `stage-event.json`, `stage-day1-night.json` |
| `onsite/booth-backdrop` | 8 x 8 ft (or 10 x 8) | Demo booth: name at eye level, QR at phone height | `booth.json`, `booth-night.json` |
| `onsite/step-repeat` | 8 x 8 ft (or 10 x 8, 8 x 10) | Media wall for photos: wordmark and Alberta logo in an offset grid | `step-repeat.json` |
| `onsite/wayfinding` | 24 x 36 in (or 18 x 24, 36 x 24) | Directional sign, one to five destinations with arrows | `wayfinding.json`, `wayfinding-landscape-night.json` |
| `onsite/room-sign` | Letter or 11 x 17 in | Door or easel sign: room, session now, next session, QR to the agenda | `room-signs.json`, `room-sign-tabloid.json` |
| `onsite/stickers` | Letter sheet, twelve 2 in rounds | Die-cut stickers with bleed and a magenta cut line | `stickers.json` |
| `onsite/lanyard` | 36 x 0.75 in | Lanyard print, reads upright on both sides | `lanyard.json` |

## Content rules

- Room names, directions, session titles, times and speaker names come from the venue plan and the confirmed agenda only. The samples
  use placeholders and carry a "Sample" tag; remove `"sample"` only when every word on the piece is confirmed.
- Event facts (dates, cities, day titles, venues) come from `brand/tokens/tokens.json`; the templates fill them in.
- QR codes go to short official https addresses. Scan every one from the printed proof, at the distance people will stand.

## Type size for viewing distance

Letters need about 1 in of cap height for every 10 ft of reading distance to be read at a glance (25 ft for 1 in is the legibility limit).
Use these as minimums:

| Read from | Minimum cap height | Use for |
|---|---|---|
| 3 ft | 0.25 in (about 24 pt) | Room sign "next" line, sticker text, booth QR label |
| 10 ft | 1 in | Room name on a door sign, booth demo line |
| 20 ft | 2 in | Wayfinding destination labels (the 24 x 36 template sets about 3 in) |
| 30 ft | 3 in | Wayfinding arrows and labels in a large hall, booth demo name |
| 50 ft | 5 in | Stage backdrop dates and cities |
| 100 ft | 10 in | Stage backdrop title (the 16 x 9 ft template sets about 20 in) |

Contrast for signs is navy on white or white on night. Never put a sign label in a light accent (yellow, lime, rose, lilac).

## Safe zones

- **Stage backdrop:** all words in the top 60 %. The lectern, speakers and front rows hide the bottom third from much of the room, and
  cameras crop it. Keep the centre clear of the logo, where a lectern stands. Traces fill the edges only.
- **Booth backdrop:** the name 5.5 to 7 ft from the floor (standing eye level); the QR code at 4.5 to 5.5 ft, beside it, where a phone
  can reach; only art below 3 ft, where the demo table stands.
- **Step-and-repeat:** marks 15 to 20 in wide, 14 to 22 in apart, so any head-and-shoulders photo holds one of each.
- **Wayfinding:** the most important destination first; no more than five; one arrow per line, pointing the way to walk.
- **Signs on easels or doors:** nothing in the bottom 1 in (frames and stands cover it).

## Vendor notes

- The PDFs are **trim size, RGB, no bleed and no crop marks**. The print-shop export (bleed, crop marks, CMYK / PDF/X) is a separate step;
  see `guides/PRINT.md`. Ask the vendor for their template and bleed (commonly 0.125 in for signs and 1 to 2 in for fabric backdrops and
  pole pockets) before you finalise.
- Fabric backdrops and banners: ask whether they print the PDF at 100 % or a scaled proof. These files are at 100 %.
- Stickers: the magenta 0.5 pt circles are the cut path (`CutContour`), and each design carries 1/16 in of bleed past it. Ask whether
  the vendor wants the cut line on a separate layer or as a separate file; `"cutlines": false` removes it.
- Lanyards: give the vendor the strip and the width; most print both faces from one file and sew the clip at the centre.
- Colour: navy `#022C4C` and the spectrum accents are defined in RGB. Ask for a printed proof of navy and the spectrum on the real
  material (fabric, vinyl, card) before the full run; navy shifts on fabric.
