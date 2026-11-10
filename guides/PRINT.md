# Print and PDF

Print pieces are HTML templates rendered to PDF by headless Chromium, with the fonts in `brand/fonts` embedded. The content lives in a
JSON file; the template owns the layout.

```bash
node scripts/make.mjs samples/print/contact-alberta-handout.json     # -> out/print/<name>.pdf and one PNG per page
node scripts/make.mjs my-handout.json --out build/ --check           # exit 1 on overflow, text too long for its box, or a missing font
node scripts/make.mjs --list                                         # every template, its size and purpose
python3 scripts/lint/lint.py my-handout.json                         # writing rules; 0 errors required
```

## Templates

| Template | Size | Use it for | Samples |
|---|---|---|---|
| `print/agenda` | Letter 8.5x11 in | Three-day program, one column per day | `agenda-sample.json` |
| `print/badge` | Badge 4x3 in | Name badges, one per page, day colour stripe, optional QR | `badge-sample.json` |
| `print/certificate` |   | Letter landscape 11x8.5 in Certificate of participation in the invite frame | `certificate-sample.json` |
| `print/demo-card` |   | Half-letter 5.5x8.5 in Showcase demo card: description, points, team, QR | `demo-card-sample.json` |
| `print/factsheet` | Letter 8.5x11 in | One-page fact sheet: tiles, bars, flow, quote, QR | `factsheet-sample.json` |
| `print/handout` | Letter 8.5x11 in | Two-page event handout: tiles, score bars, flow, tables, quote, QR | `contact-alberta-handout.json` |
| `print/postcard` | Postcard 6x4 in | Invite postcard, front and back with the three days and QR | `postcard-sample.json` |
| `print/poster` | Letter or 11x17 in | Invite-style event poster (main event or one day), optional QR | `poster-call-for-demos.json`, `poster-event-tabloid.json`, `poster-event.json`, `poster-mon.json`, `poster-tue.json`, `poster-wed.json` |
| `print/report` | Letter 8.5x11 in | Report: invite-look cover plus numbered interior pages of blocks | `report-sample.json` |
| `print/table-tent` |   | Letter, folded to 8.5x5.5 in Folded table tent for a demo station, QR | `table-tent-sample.json` |

## Rules

- **Page furniture.** The Agency mark top-left, the Alberta signature top-right, the navy band with the classification pill at the foot of
  every page. The band's left text names the piece, the event and the month.
- **Circuit art** goes on covers, posters and the outer corners of a handout page, outside the text column. Body pages stay clean.
- **One accent per section.** The section heading's square, the tile rules and the bars in that section share it.
- **Tiles hold one number and one short label.** A long explanation belongs in a card or a sentence.
- **Notes and sources** go in a small `terms` or `note` block at the foot of the page; the full source table goes in the project's
  `NOTES.md`.
- **Look at the PNG** of every page before delivery. `--check` catches overflow; it cannot judge balance or crowding.
- **Colour.** Templates print with backgrounds on (`print-color-adjust: exact`). For a commercial print run, ask the printer for a
  proof; the PDFs are RGB.
