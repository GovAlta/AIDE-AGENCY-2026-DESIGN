# Slides and PowerPoint

Decks come in two forms built from one outline: HTML slides rendered to PNG and PDF (for contact sheets, screens and sharing), and an
editable PowerPoint file.

```bash
node scripts/make.mjs samples/slides/<deck>.json                       # -> out/slides/<deck>-NN.png (+ PDF)
python3 scripts/pptx/build_deck.py samples/slides/<deck>.json out/slides/<deck>.pptx
python3 scripts/lint/lint.py samples/slides/<deck>.json
```

## Layouts

| Template | Size | Use it for | Samples |
|---|---|---|---|
| `slides/deck` | 1920x1080 PNG | 16:9 deck (title, chapter, statement, bullets, stats, bars, flow, quote, compare, image, agenda, timeline, big-number, end) + editable PPTX | `agency-sample-deck.json` |

## Rules

- **Install the fonts** (`brand/fonts/README.md`) before you edit or present the PowerPoint file. Without Inter, PowerPoint falls back to
  Arial and line breaks change.
- **Same chrome as the video.** The Agency mark top-left, the Alberta logo top-right, the navy band with the classification pill along
  the foot.
- **Circuit art** on the title, section and closing slides only. Content slides are a clean board.
- **One idea per slide.** A headline under 8 words; at most 5 bullets of under 7 words, or one chart, or one diagram.
- **The spectrum ground** once per deck, for the line the audience should remember.
- **Speaker notes** carry the explanation, written to the rules in `guides/WRITING.md`.
- **Edit the outline, rebuild the deck.** Hand edits to the `.pptx` are lost on the next build; make lasting changes in the JSON.
