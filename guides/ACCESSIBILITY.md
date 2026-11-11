# Accessibility

Agency 2026 material is public-service communication. It meets WCAG 2.1 level AA wherever the medium allows. Most of the work is
done by the templates and the checks; this guide covers what the checks measure and what a person still has to do.

## What the checks do

`node scripts/make.mjs content.json --check` runs these on every page it renders (`scripts/a11y/contrast.mjs`):

| Check | Result | Rule |
|---|---|---|
| Text contrast | warning (fault with `--strict`) | 4.5:1 for body text; 3:1 for large text (24 px and up, or 18.66 px and up at weight 700 or more). WCAG 1.4.3 |
| Image text alternative | fault | every `<img>` has an `alt` attribute. Decorative images take `alt=""`. WCAG 1.1.1 |
| SVG images | fault | an SVG with `role="img"` has an `aria-label` or a `<title>` |
| Page language | fault | the document has a `lang`. WCAG 3.1.1 |
| Page title | fault | the document has a title (it becomes the PDF title). WCAG 2.4.2 |

The contrast check composites the background colours behind each text element. Text over a photograph, a gradient or SVG art cannot be
measured that way, so the report counts it as "unmeasured" and a person checks it by eye. A known false positive can be waived in the
content file with a reason in your notes: `"a11y": {"ignore": ["start of the element's text"]}`.

Run the check on its own against any HTML page: `node scripts/a11y/contrast.mjs out/print/poster-event.html`.

Contrast findings are warnings by default while the existing templates are brought up to AA. Use `--strict` for new work.

## PDFs

Every PDF from `make.mjs` is **tagged**, with a structure tree of headings, paragraphs, lists and tables for screen readers, and has
bookmarks built from its headings. The title comes from the content file's `title`; the language from `lang` (default `en`). Check
with `pdfinfo file.pdf` (it shows `Tagged: yes` and the title). Reading order follows the order of the HTML, so write content in the
order it should be read: heading, lead, then sections, top to bottom and left column before right.

Print PDFs from `print-export.mjs` (CMYK, bleed) are for the printer only. Never post them online: publish the screen PDF from `make.mjs`.

## Rules for content

1. **Alt text.** Every informative image gets alt text that says what the image shows and why it is there, in one sentence: "Bar chart:
   days to approve a permit, by region. Pilot region lowest at 11 days." Decorative art (traces, the bus rule) is drawn as
   inline SVG with no text and needs no alt text; an `<img>` of decorative art takes `alt=""`.
2. **Colour is never the only signal.** Every chart bar, tile and split carries its value and label in text. Day colours always appear
   with the day's name.
3. **Charts.** Give the numbers in text or a table as well as the picture. A chart's title states what it shows; a note gives the source.
4. **Minimum sizes.** Print body text at least 9 pt, notes at least 7.5 pt. Slides: body at least 24 px at 1920×1080. Signs: see
   `guides/ONSITE.md` ("Type size for viewing distance").
5. **QR codes.** Print the URL beside every QR code, short enough to type. A QR code alone shuts out anyone without a phone camera.
6. **Links.** Link text names the destination ("the Agency 2026 agenda"), never "click here".
7. **Plain language.** `guides/WRITING.md`. Short sentences, defined terms, no unexplained acronyms.
8. **Motion.** No flashing more than three times a second (WCAG 2.3.1). Motion pieces on stage screens do not carry information that is
   not also spoken or printed.

## Video and audio

- Every narrated video has captions. MVAI writes VTT and SRT for every render; burn them in (`"captions": true`) for video that plays
  without sound (social, lobby screens).
- Publish a transcript with every video posted online.
- Music-only pieces (bumpers, sizzles) need a one-line text description where they are posted.
- The run-of-show player: a speaker's name and role on screen are also said aloud by the host; countdowns show the session name in text.

## Documents

Word documents from `scripts/docx/build_docx.py` use real heading styles, so the navigation pane and screen readers work. Keep that: do
not fake a heading with bold body text. Run Word's Accessibility Checker (Review > Check Accessibility) before you send a document.
