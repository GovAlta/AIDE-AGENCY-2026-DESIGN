# Imagery

How to choose, make and check pictures for Agency 2026 material: photographs, illustrations and AI-generated art. The aim is one
look across every medium: the circuit-board art of the invite, on white or night navy, with plenty of open space for words.

## Choose the kind of picture

| Use | When | Source |
|---|---|---|
| **Pure graphics** (traces, bus rule, spectrum) | Covers, title slides, social cards, banners, video title cards. The default. | `scripts/vectors.mjs`, `brand/art/` |
| **Official invite art** | Anything that announces the event or one of its days | `brand/art/invites/`, used unchanged |
| **Illustration** (AI-generated, from the prompt library) | A slide, page or post needs a picture of an idea that graphics alone cannot carry: a journey, a network of services, a landscape | `scripts/imagegen.py` with `brand/imagery/prompts.json` |
| **Photograph** | Real people, real places and real moments at the event, or screenshots of a real product | the event photographer, the product team |
| **Screenshot** | Showing a product or a demo | the product, with synthetic data only |

Use a photograph when the point is that something real happened. Use an illustration when the point is an idea. Never use an
illustration to stand in for a real result, a real place or a real person.

## The illustration style

The style is fixed in `brand/imagery/prompts.json` (`style.preamble`). Do not write a new style per image: change a subject and keep the
preamble, so every picture matches.

- **Flat vector.** Solid shapes, crisp edges, no texture, grain, 3D, perspective or photorealism.
- **Circuit traces.** Thin, even lines in parallel bundles that bend only at 45 degrees and end in hollow ring pads. No wide ribbons or
  bold bands, and never the pink microchip (owner direction, 2026-11-11).
- **Spectrum order.** Purples and blues on the left, pinks and oranges along the top, yellows and greens on the right, as on the invite.
- **Grounds.** White (`board`), night navy `#041B30` (`night`) or navy `#022C4C` (`navy`).
- **Open space.** Every image leaves a clear area for words. Choose the composition that matches where the text goes.
- **Never in an image:** text, letters or numbers; logos; flags; maps with borders or labels; faces or recognisable people; hands;
  robots or humanoid AI; glowing brains; handshakes; light bulbs; padlocks; binary code; futuristic cities; lens flare.
  Add words in the template, never in the picture: generated text is garbled, cannot be translated or read by a screen reader, and
  cannot be corrected.

### Colours

Only the token palette (`brand/tokens/tokens.json`). The prompt names each value:

| Name | Hex | Name | Hex |
|---|---|---|---|
| navy | `#022C4C` | orange | `#EE9A2E` |
| night | `#041B30` | yellow | `#F2C230` |
| purple | `#6F2C83` | green | `#8DC63F` |
| blue | `#0177CD` | cyan | `#00AAD2` |
| lilac | `#9C90C5` | pink | `#E86BA5` |
| coral | `#EE7A63` | white | `#FFFFFF` |

Generated colours drift a little. When an image sits next to token-coloured type and tiles, check it by eye; regenerate an image whose
colours read as a different palette (neon, pastel or brown).

## Composition by medium

| Medium | Aspect | Composition | Text goes |
|---|---|---|---|
| Social square, poster background, title slide | square, landscape | `frame` | centre |
| Web hero, email header, report cover band | landscape | `top-clear` or `left-clear` | top or left |
| Content slide with a picture | landscape | `left-clear` | left two thirds |
| Story, roll-up banner, portrait signage | portrait | `top-clear` | top half |
| Sticker, badge back, splash | square | `centre-subject` | none, or below |
| Background behind a dark overlay | landscape | `full-bleed` | anywhere, on the overlay |

Keep text-safe zones clear of art even when the generator crowds them: crop, mask with the template's ground, or regenerate.
Content slides and pages stay clean, as in the MVAI kit: put illustrations on covers, chapter cards and one or two feature slides, not
behind body text.

## AI generation: data rules and disclosure

- Ent Tools images (`azure-openai-images`) are **processed in the United States**. A prompt is the fixed style text plus a short
  subject. Never put a person's name or likeness, Protected information, unpublished figures, internal system names or anything from
  a classified brief into a subject. `scripts/imagegen.py` refuses a custom subject that names roles or protected material, but you are
  responsible for the rest.
- Do not try to generate a real person, a real building, the Alberta logo, the event's own invite or any other organisation's mark.
- Every generated image keeps its `.json` sidecar (`ai_generated: true`, prompt, model, date, alt text).
- Disclose AI generation where the image is used: a credit line ("Illustration generated with AI") in the footer, the notes or the alt
  text. Follow the content owner's rule if it is stricter.
- Generated images are illustrations. They never show results, data or real places.
- Default to `--quality low` while exploring; regenerate the chosen image at `medium` or `high` for print.

## Photography at the event

- **Consent.** Photograph people only where the event's photo notice is posted, and get written consent for close-ups and for anyone
  featured by name. Honour a no-photo lanyard or request at once. Never photograph children without a parent's written consent.
- **Screens.** Do not photograph a screen showing real case data, personal information or anything above Unclassified.
- **Captions.** Name people only with their consent, in the form they gave (name, then role). Say where and when: "Day 1, Edmonton
  Convention Centre."
- **Alt text.** Describe what the picture shows and why it is there, in one or two plain sentences. Do not start with "Image of".
- **Editing.** Crop, straighten and correct exposure. Never add, remove or change people or objects, and never composite a scene that
  did not happen.
- **Files.** Keep originals with their consent record. Strip location metadata before publishing.

## Review checklist

Before an image ships:

1. It is the right kind of picture for the point (graphic, illustration, photograph).
2. It uses only palette colours, on a board, night or navy ground.
3. It has no text, logo, flag, face, robot, brain or other banned motif, and nothing reads as a real place or result.
4. The text-safe zone for its template is clear.
5. It looks right next to the template's type at the size it will be used (look at the rendered PNG, not only the image).
6. A generated image has its sidecar, an AI-generation credit and alt text.
7. A photograph has consent, a caption, alt text and no sensitive screen content.
8. Print images are at least 300 pixels per inch at final size; regenerate or upscale from vector art otherwise.

## Tools

```bash
python3 scripts/imagegen.py --list                                  # subjects
python3 scripts/imagegen.py --prompt rockies-traces                 # the full prompt, no call
python3 scripts/imagegen.py rockies-traces --aspect landscape       # generate (low quality)
python3 scripts/imagegen.py --subject "a single thin trace looping across open white space" --aspect square
```

The samples in `brand/imagery/generated/` and `brand/imagery/contact-sheet.jpg` show what the library produces.
