# Office files: Word, PowerPoint, Outlook and the brand guide PDF

Office files are the pieces most teams make by hand. This repo gives them templates with the styles built in, and generators that make
the same files from content JSON.

## Palette and font

The owner has not yet chosen between the two Agency palettes (`guides/BRAND.md`, "Two palettes"). Office files use the **event team's
compliant set** (`tokens.json` → `compliant`): **Arial**, navy `#002C4E`, date red `#9E2B33`, blue `#0077CD`. Arial is installed on every
Government of Alberta computer, so a document looks the same wherever it is opened, and it matches the compliant slide template.

Every generator reads `brand/tokens/tokens.json`. To switch to the MVAI set (Inter), add `--palette mvai`. Inter must then be installed
from `brand/fonts` on every machine that opens the file.

## Word

| Template | Use it for | Sample content |
|---|---|---|
| `templates/office/agency-2026-briefing-note.dotx` | To, From, Date, Decision; Purpose, Background, Analysis, Recommendation; contact | `samples/office/briefing-note.json` |
| `templates/office/agency-2026-memo.dotx` | One-page memo: To, From, Date, Re; body; contact | `samples/office/memo.json` |
| `templates/office/agency-2026-speaker-brief.dotx` | Speaker, day, time, room, host; run of show; talking points; AV needs | `samples/office/speaker-brief.json` |
| `templates/office/agency-2026-report.dotx` | Event report: summary with figures, findings, next steps | `samples/office/event-report.json` |

**By hand.** Double-click a `.dotx` to start a new document from it. Use the built-in styles: Title, Heading 1 to 3, Kicker, Callout,
Note, Caption Agency, List Bullet and List Number. Do not format text by hand; a style keeps the look and gives screen readers the heading
structure. The header holds the Agency 2026 mark, the classification and the Alberta signature. The footer is a navy band with the event
line, the page number and the classification. Change the classification in both when the content owner sets a level.

**From content JSON.**

```bash
python3 scripts/docx/build_docx.py samples/office/briefing-note.json out/office/briefing-note.docx --pdf   # .docx and a PDF proof
python3 scripts/docx/build_docx.py --all --pdf        # every samples/office/*.json -> out/office/
python3 scripts/docx/build_docx.py --templates        # rebuild the four .dotx files
```

Content fields and block types are in the header of `scripts/docx/build_docx.py`: `p`, `bullets`, `numbers`, `h3`, `table` (with
`widths` in inches and an optional `caption`), `figures` (big number tiles), `callout` and `note`. `**bold**` and `==highlight==` work in
any text. Tables repeat their header row on every page. The PDF proof needs LibreOffice (`soffice`).

## PowerPoint

`brand/pptx/Agency2026.potx` is the event team's compliant template made into a real PowerPoint template, with five layouts added. Open
it, or set it as a custom template, and pick layouts from **Home → Layout**:

| Layout | For |
|---|---|
| TITLE | The opening slide: host line, Agency 2026, presentation title, dates |
| SECTION_DAY1, SECTION_DAY2, SECTION_DAY3 | A day's section card in its day colour |
| CONTENT | Title and body text |
| TITLE_ONLY | A title over free content |
| STATEMENT | One line people should remember |
| TWO_COLUMN | Two cards with a heading and text each (before and after, two options) |
| BIG_NUMBER | One figure, its label and its source |
| STATS_4 | Four figures with labels |
| IMAGE_CAPTION | A picture placeholder and its caption. Add alt text to every picture |
| AGENDA | Three day columns: day line, session title, place |

`brand/pptx/Agency2026-layout-guide.pptx` has one filled example of each layout, using the real event facts. Rebuild both with
`python3 scripts/pptx/potx_build.py --examples`.

For a deck generated from JSON, use `scripts/pptx/build_deck.py` (`guides/SLIDES.md`). That deck uses the MVAI look and Inter.

## Outlook

`brand/email/signature.html` is an image-free signature: the Agency 2026 mark is live text and the trace underline is a thin blue table
cell ending in a ring. Many Outlook setups block embedded and remote images, and this signature looks the same either way.

1. Open `signature.html` in a browser, replace the `[placeholders]` in a copy first, select everything and copy it.
2. Outlook for Windows: **File → Options → Mail → Signatures → New**, paste. New Outlook and Outlook on the web: **Settings →
   Accounts → Signatures**, paste.
3. `signature.txt` is the plain-text version for plain-text mail and Teams profiles.

`brand/email/announcement.html` is a 600 px announcement email: header, headline, the three days in their colours, one button and the
navy footer with the classification. The button is "bulletproof": a VML shape for Outlook on Windows and a padded link everywhere else.
Send it from the tool your team uses for bulk mail, and test it in Outlook before you send. To add the email header image, host
`out/digital/email-header.png` at a public https address and rebuild:

```bash
python3 scripts/docx/build_email.py --img-base https://your.host/path/
```

## The brand guide PDF

`samples/print/brand-guide.json` builds a 10-page brand guide for comms staff and vendors on the `print/report` template: how to use the
repo, colour (both palettes), type and marks, circuit art and layout, which template for which piece, QR codes and accessibility,
writing, motion and sound, and do and do not.

```bash
node scripts/make.mjs samples/print/brand-guide.json --check   # -> out/print/brand-guide.pdf
python3 scripts/lint/lint.py samples/print/brand-guide.json
```

Rebuild it after any change to the tokens or the guides. Every fact in it comes from `tokens.json` and the files in `guides/`.

## Checks before you send

- Open the PDF proof and look at every page.
- Set the classification in the header and footer from the content owner.
- Replace every `[placeholder]` and every "Sample" or "Example" value.
- Run `python3 scripts/lint/lint.py` on the content JSON when you generate from JSON.
