<!-- Copied 2026-11-10 from aide-motion-video/app/video-types/instructions/agency-explainer.md (MVAI). The live version: GET /api/v1/video-types/agency-explainer (instructions). -->
# Agency 2026 explainer (`agency-explainer`)

The Agency 2026 showcase format (Government of Alberta, hosted by the Ministry of Technology and Innovation): a sizzle splash in the circuit-board look of the event invite, then a broad bench of 44 screens for explainers and education: statements, bullets, quotes, comparisons, chats, big numbers and charts, timelines, roadmaps, processes, agent loops, architectures, networks, maps of Alberta and device screens. Light (white board) and dark (night board) themes; captions in their own bottom bar with the spoken word highlighted.

**Use it for:** explainer and education videos for the Agency 2026 showcase; a sizzle or promo for a showcase demo; any short public-service explainer that should share the Agency look.

**Length:** 45-240 s (6-25 scenes).

**Kit:** `goa-agency`, default theme `agency-light`.

**Scene order:** splash → title → (chapter → content screens …) → statement (the takeaway) → end.

Circuit art belongs to the splash, title cards, the end card and the scene transitions; content screens are a clean board. The microchip appears only on the splash. Pick plain, specific icons. Use ground "night" or "navy" on a few scenes for contrast and "spectrum" for the one line people should remember. A complete event sizzle is . Classification defaults to Unclassified and is shown in the bottom bar; set "classification" when the content needs it.

## Rules for every video of this type
- Use only facts the requester gave you. Never invent names, numbers, dates or quotes. Where a screen needs data the brief does not give (an example form, a sample chart), use generic, clearly fictional values.
- The narration is spoken word for word by an ElevenLabs v4 voice. Write plain spoken English: one idea per sentence, mostly under 20 words, active voice, no parentheses, no abbreviations the voice cannot say. Spell numbers the way they should be said if needed.
- Every `...Cue` / `cue` value must be a phrase from **that scene's** narration (matching ignores case and punctuation; use `"word#2"` for the second time a word appears) or a number of seconds from the scene start. Elements appear when the voice says the cue.
- On-screen text is short: headlines under 8 words, list items under 7 words. The narration explains; the screen shows.
- Images and screen recordings: list each file in `assets` (`{"upload": "name.png"}` or `{"video": {"upload": "clip.mp4", "fps": 15}}`) and send the bytes in `images[]` (`{name, base64}` or `{name, url}`) on create_walkthrough. A scene shows an asset with `"image": "<asset id>"`.
- Pace: the voice reads about 2.3 words a second; each scene adds about 1.1 s of lead and tail. check_walkthrough returns `estimate` (seconds): use it to hit the type's length before you create.
- Numbers: write them as they should be said ("twenty twenty-six to twenty-seven", "four point two million dollars"); digits in narration are flagged.
- Names with no expansion (system or product names such as an application called "MAX"): list them in `"terms": ["MAX"]` so the acronym check accepts them.
- Classification: leave `"classification": "Unclassified"` unless the requester names a level; it is drawn on every frame. Drafting (Claude on Google Vertex AI) is approved up to Protected B. Narration (ElevenLabs) and generated images (Azure OpenAI) are processed outside Canada: Protected A shows a notice; Protected B needs the content owner's approval recorded as `"external_processing_ok": true` (or a video without narration and generated images); anything above Protected B may not be made with MVAI. `check_walkthrough` reports these as `group: "data"`.
- If a call returns HTTP 429, a plain-text "Rate exceeded" body or an empty body, the service is busy: wait 30-60 s and retry (never treat it as JSON or as the video file).
- Before you create, call `check_walkthrough` with the spec and fix every error. Then call `create_walkthrough` (add `library: {collection, title}` to file the video in your library in the MVAI app; it stays private to you). Poll `get_video` every 20-30 s until `phase` is `done`; the result then gives the video, captions and poster URLs.
- `kit_options` is optional and not in the template; the guide lists what this kit accepts. `signature` (the Alberta signature, default true; goa-kinetic and showcase kits) can be set `false` for a product that is not a Government of Alberta service. Leave `kit_options` out when the brief gives none of these.
- Screen regions (`region`, `focus`): `[x, y, w, h]` as fractions (0-1) of the **source image** (not the 1920x1080 frame). Example: a button at pixels 1393,124 size 170x49 on a 1600x1000 screenshot is `[0.8706, 0.124, 0.1062, 0.049]`. Look at each screenshot to find the control, then divide by the image width and height. check_walkthrough rejects a region outside the image. A wide screenshot is fitted to the frame width; content in the bottom part of a tall one is reached by scrolling (`scroll` action) or by the camera following the highlight.
- A `click` or `type` action boxes its target in teal; add `"box": false` for a cursor-only click. Use `highlight` to box a field without clicking.
- Names, account numbers and amounts visible on a screenshot come from that screenshot; do not read them aloud or repeat them as overlays unless the brief gives them. Use screenshots of synthetic data.
- When the brief and the screen disagree (a button label, a field name), say what the screen shows, so viewers can find it, and tell the requester about the mismatch.
- Device screens and charts in an explainer are illustrations: use generic labels ("Sample Park A", "Booking 1") and label them as example values or synthetic data. Never present an invented number as a real result.
- Cue each step or item at the **start** of the sentence that introduces it, so it stays on screen while the voice talks about it. The last step of a scene shows only until the voice ends: add `"hold": 1.5` (seconds) to the scene to give it time.
- After the first render, look at the poster and contact sheet (`get_video` gives their URLs once the render's `extras` is `done`, usually 2 to 7 minutes after the video; keep polling) and `warnings` (text the kit had to shorten or drop) before you call it finished; fix and send the spec again with `update_walkthrough` (narration that did not change is not voiced again).
- Captions: `"captions": true` burns captions into the video (VTT and SRT files are always made). Turn it on for videos that will be watched without sound.
- Delete every `FILL:` placeholder. Remove scenes you do not need; repeat a scene type as often as the story needs.

## Scene reference
Every screen of this type is listed in get_video_type (`screens`, grouped by purpose in `screens_by_purpose` for the larger kits). Choose the screen that fits each idea and vary them; most ideas fit two or three screens. `get_screens` gives the full field guide, the JSON Schema and working example scenes for the screens you choose (HTTP: GET /api/v1/video-types/<slug>/screens?names=a,b). The whole guide, template, example and schema are also available one at a time (get_video_type with `part`).
