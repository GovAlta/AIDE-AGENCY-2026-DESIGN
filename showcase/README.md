# Showcase films

The high-quality video category of the Agency 2026 design system: narrated 1080p60 films of real projects, rendered frame-exact in
Cloud Run. Read `guides/SHOWCASE-FILM.md` first.

This folder holds only what is needed to make a film. Films are project outputs and live outside the repo, in `FILMS_DIR` (default: the
`showcase/` folder beside the repo clone, `/mnt/data/projects/agency-2026/showcase/` on SHELL). The reference film #11 is there.

| Path | What |
|---|---|
| `kit/` | The production kit: the frame-exact HTML stage (plates, map stage, Agency chrome, callouts, panels, captions, cards), capture, narration, music analysis, storyboard, dry run, stills, camera check, cloud render farm, mix, encode and QA tools. `START-HERE.md`, `README.md`, `RECIPE.md` |
| `kit/templates/` | Starters for the three kinds: `timeline-app.js`, `timeline-map.js`, `timeline-data.js`, plus the brief, notes, log and storyboard files every film gets |
| `kit/example/` | The inputs of the kit's 8 s smoke film (a real screenshot plate with tilt, push-in, spotlight, cursor, callout and caption); its rendered output is not kept here |
| `kit/docs/RENDER-FARM.md` | How films are rendered: the Cloud Run job farm #11 proved, its sizing, time, cost and rules |
| `kit/docs/WORKED-EXAMPLE-11.md` | How the reference film #11 was built, scene by scene, with the kit feature behind each; the film itself stays local |
| `EVALUATION.md` | What the kit is, how it was evaluated and what changed when it moved into this repo |

```bash
cd showcase/kit && npm ci
node tools/new-film.mjs --name my-film --title "My Project" --kind app     # or a slot: node tools/new-film.mjs 23 --kind map
```
