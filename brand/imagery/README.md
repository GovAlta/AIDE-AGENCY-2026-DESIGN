# Imagery: prompt library and AI-generated samples

| Path | What |
|---|---|
| `prompts.json` | The prompt library: one fixed style preamble, three grounds, five compositions, an avoid list, and 21 subjects with their aspects and uses |
| `generated/` | 11 **AI-generated sample images** with a `.json` sidecar each (prompt, model, size, date, `ai_generated: true`, alt text) |
| `contact-sheet.jpg` | The samples at a glance |

**Every image in `generated/` is AI-generated.** They were made on 2026-11-11 with `gpt-image-2.5-sunburst-nexus` through Ent Tools
(`azure-openai-images`, processed in the United States), at low quality, to prove the style. They are samples. Before using one in
published material, regenerate it at medium or high quality, look at it against the checklist in `guides/IMAGERY.md`, and disclose
it as AI-generated.

The samples from the first round (circuit frame square, data into chip, Rockies, service nodes, velocity lines) used library version 1.0.0.
The second round used 1.1.0, which fixed one fault: a "frame" composition on the night ground drew a white box in the centre. Each
sidecar records its version.

Make one:

```bash
source ~/.sandbox-env
python3 scripts/imagegen.py --list
python3 scripts/imagegen.py three-day-journey --aspect landscape --quality medium
python3 scripts/imagegen.py --prompt circuit-frame        # see the exact prompt, no call
```

Output goes to `brand/imagery/generated/` as PNG with its sidecar. Convert to JPEG for the web if size matters. Never commit an image
without its sidecar.
