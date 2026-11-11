# Print production

`make.mjs` writes screen PDFs: RGB, cut exactly at the page edge. A print shop needs more: bleed, crop marks, CMYK and the trim size
written into the file. `scripts/print-export.mjs` does that for any print, digital-PDF or on-site template.

```bash
node scripts/print-export.mjs samples/print/poster-event.json          # -> out/print-ready/poster-event-print.pdf and -print-marks.pdf
node scripts/print-export.mjs content.json --icc GRACoL2013_CRPC6.icc  # the printer's CMYK profile (ask for it)
node scripts/print-export.mjs content.json --mode extend               # never enlarge the page (see Bleed)
node scripts/print-export.mjs content.json --pdfx 3                    # certified PDF/X-3, flattened (see Formats)
node scripts/print-export.mjs content.json --rgb                       # digital press that wants RGB
```

The script renders the content with `make.mjs` first, so the same `--check` faults stop it: fix them before anything goes to print.

## What you get

| File | For | Page |
|---|---|---|
| `<name>-print.pdf` | most digital and large-format printers (banners, backdrops, posters) | trim + 0.125 in bleed on every side |
| `<name>-print-marks.pdf` | offset printers, and anyone who asks for crop marks | trim + bleed + 0.375 in slug with crop marks and a slug line (name, page, trim, bleed, mode) |

Both files carry a **TrimBox** (the finished size) and a **BleedBox**, a CMYK output intent, and fonts embedded and subset. Check with
`pdfinfo -box file.pdf`.

## Bleed

Printers cut a stack of sheets, and the blade can drift by about 1/16 in. Anything that should run to the edge must run past it, into the
bleed, or a white sliver shows after trimming. The script gives the page 0.125 in of bleed in one of two ways:

| Mode | What happens | Good for |
|---|---|---|
| `scale` | The whole page is enlarged so its art runs into the bleed. Text grows by the same amount (about 3 % on Letter, under 1 % on a roll-up). | Posters, roll-ups, backdrops: art runs off the edge |
| `extend` | The page keeps its size; its ground colour (or gradient) fills the bleed. Art and bands that touch the edge stop at the trim line. | Badges, postcards, cards: a small page where 3 % or more would crowd the text |
| `auto` (default) | `scale` when that enlarges the page by 3 % or less, else `extend` | |

Known limit of `extend`: an element that touches the trim edge (the badge's spectrum stripe, a full-width band) is not carried into the
bleed. A small trim drift shows a hairline of the ground colour there. If that matters for a piece, use `--mode scale`.

**Safe zone.** Keep text and logos at least 0.25 in inside the trim on small pieces, 0.5 in on posters, and 2 in on roll-ups and
backdrops (the bottom 6 in of a roll-up sits in the stand and behind the feet of visitors). The templates already keep to this.

## Colour

The screen palette is RGB. Printing converts it to CMYK, and some Agency colours sit outside what ink can print. Measured through
Ghostscript's generic CMYK profile (sRGB to CMYK and back, relative colorimetric):

| Colour | RGB | CMYK (generic profile) | Shift (ΔE76) | What to expect |
|---|---|---|---|---|
| navy | `#022C4C` | C95 M75 Y45 K66 | 13.7 | greyer and flatter; the largest shift. Ask for a proof |
| purple | `#6F2C83` | C72 M100 Y14 K6 | 10.4 | less saturated |
| blue | `#0177CD` | C87 M53 Y0 K0 | 9.1 | slightly duller |
| green | `#8DC63F` | C51 M1 Y100 K0 | 4.1 | close |
| maroon | `#882831` | C28 M100 Y97 K35 | 3.5 | close |
| lilac, pink, coral, orange, yellow, cyan | | | 0 to 2 | prints as on screen |

A shift of about 2 is hard to see; 10 or more is plain side by side. Two consequences:
- **Ask the printer for their profile** (`--icc`). North American offset is usually GRACoL 2013 or SWOP; large-format printers have their
  own per material. The generic profile is fine for proofs, not for a final run.
- **Always see a hard proof** of anything large or expensive, and judge the navy and purple on it, not on screen.

The figures above are from the generic profile; your printer's profile will give different numbers. The table shows which colours to
watch.

## Formats

| `--pdfx` | File | Notes |
|---|---|---|
| `4` (default) | PDF 1.6, CMYK, transparency kept, marked PDF/X-4 | Everything stays vector: type, traces and the QR stay sharp at any size. Ghostscript cannot certify PDF/X-4, so the file is marked but not validated. If the vendor requires certified X-4, preflight it in Acrobat (Print Production > Preflight > "Convert to PDF/X-4") |
| `3` | PDF 1.3, certified PDF/X-3 | PDF/X-3 forbids transparency, and the traces use it, so Ghostscript flattens the page into one 300 ppi CMYK image. Text is no longer searchable. Use only when a vendor insists on X-3 |

**Fonts.** Inter is embedded as Type 3 fonts by Chromium (it embeds the OpenType CFF files that way); Geist Mono embeds as TrueType.
Printers render Type 3 fonts correctly, but some preflight tools warn about them. If a vendor rejects the file for Type 3 fonts, send the
`--pdfx 3` version, which carries the page as an image.

## Paper and materials

| Piece | Stock (suggested) | Notes |
|---|---|---|
| Posters, Letter or 11x17 | 100 lb gloss or silk text | silk reads better under venue lights |
| Handouts, fact sheets, agendas | 80–100 lb silk text, or 24 lb bond for office printing | the screen PDF prints well on office lasers; no bleed needed |
| Badges 4x3 in | 14 pt card, or badge inserts | check the holder's insert size before you print |
| Table tents, demo cards, postcards | 14–16 pt card, matte | score the fold line on tents |
| Certificates | 100 lb cover, uncoated or linen | |
| Roll-up banners, backdrops, step-and-repeat | the vendor's banner vinyl or fabric | send `<name>-print.pdf`; ask the vendor's safe zone and pocket sizes |

## Vendor checklist

Before a file goes out:

- [ ] `node scripts/make.mjs content.json --check` passes, and the PNG looks right.
- [ ] `node scripts/print-export.mjs content.json --icc <vendor profile>` ran with no faults.
- [ ] `pdfinfo -box` shows the trim size you ordered.
- [ ] Every QR code scans from a printed proof at the distance people will stand (`guides/QR.md`), and its URL is printed beside it.
- [ ] Classification and dates are right; names and titles are confirmed in writing by the people named.
- [ ] Quantity, stock, finish, trim size, bleed (0.125 in), delivery date and address are in the order.
- [ ] You have seen and approved a hard proof for anything large-format or over about 100 copies.
