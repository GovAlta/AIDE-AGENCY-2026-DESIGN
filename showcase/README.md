# Showcase films

The high-quality video category of the Agency 2026 design system: narrated 1080p60 films of real projects, rendered frame-exact in
Cloud Run. Read `guides/SHOWCASE-FILM.md` first.

| Path | What |
|---|---|
| `kit/` | The production kit: the frame-exact HTML stage (plates, map stage, Agency chrome, callouts, panels, captions, cards), capture, narration, music analysis, storyboard, dry run, stills, camera check, cloud render farm, mix, encode and QA tools. `START-HERE.md`, `README.md`, `RECIPE.md` |
| `kit/templates/` | Starters for the three kinds: `timeline-app.js`, `timeline-map.js`, `timeline-data.js`, plus the brief, notes, log and storyboard files every film gets |
| `kit/example/` | The kit's 8 s smoke film (a real screenshot plate with tilt, push-in, spotlight, cursor, callout and caption) |
| `reference/11-pan-canadian-fibre/` | The reference film: its source, figures, process log, storyboard, music, narration, API responses, a contact sheet and the phone preview |
| `EVALUATION.md` | What the kit is, how it was evaluated and what changed when it moved into this repo |

```bash
cd showcase/kit && npm ci
node tools/new-film.mjs --name my-film --title "My Project" --kind app     # or a slot: node tools/new-film.mjs 23 --kind map
```
