# Worked example: film #11, Pan-Canadian Fibre Optics Planner

Film #11 is the quality bar for showcase films (the owner called it "excellent", 2026-11-11): 3:17, 1080p60, narrated, a 3D globe with
terrain, a chase camera along a route, the planner's real panels re-drawn in the Agency look, and ranked comparisons, with every number
from the planner's own data or API.

The film itself is a project output, so it is **not in this repo** (owner, 2026-11-12). It lives locally at
`/mnt/data/projects/agency-2026/showcase/11-pan-canadian-fibre/` (source, `NOTES.md`, `PROCESS-LOG.md`, storyboard, phone preview), and the
full production folder with masters and frames at `/mnt/data/projects/agency-2026/#11 pan-canadian-fibre-optics-simulation/`. The planner
it films is `GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK` at commit 2610761.

## Which kit feature made each scene

Use this table to plan a new map or app film. Every feature named here is in this kit.

| Scene in #11 | Time | In the kit |
|---|---|---|
| Cold open: the globe from space, night lights | 0–10 s | map stage, `basemap: 'nasa-night'`, `bg: { kind: 'stars' }` |
| 713 subsea cables draw on, then landing points | 10–20 s | a `line` layer with `progress: true`, `reveal`, a callout with `H.count` |
| International cables, ranked (Canada 7) | 20–32 s | a callout with `bars` (one scale, one row highlighted), the misleading-truth check in `NOTES.md` |
| Alberta: gas plants, power lines | 32–43 s | layer opacity envelopes (`env`), `ui.labels` with `lonLat` |
| Title card | 53 s | `ui.card` `kind: 'title'` with the film's seeded trace art |
| Layers ticked in the real panel | 64–106 s | a glass panel (`ui.panels`) re-drawn from the planner, `data-k` ticks, the cursor (`H.cursorAt`) |
| Chase camera along the southern route | 106–119 s | `stage.along(id, share)` and `stage.heading()`, smoothed with `H.smoothPath` (never aim at the moving head: the jitter fault in `PROCESS-LOG.md`) |
| All 15 modeled routes | 119–128 s | several `lines` with staggered `p` |
| Plan, Compare, Draw lines (real API answers) | 128–159 s | panels fed from `prep/*.json`; numbers only from the saved responses |
| Climax and end card | 168–197 s | `statement`, `ui.card` `kind: 'end'` with sources |


## Lessons from #11 that the kit now enforces

- **A true number can still mislead.** "155 landing points on Canada's coasts" was true, but 115 were short British Columbia coastal
  systems; 7 international cables land in Canada against 85 in the United States. Record the breakdown and the fair comparison in `NOTES.md`.
- **Never aim the camera at the moving head of a line.** It jitters. Follow `stage.along()` through `H.smoothPath`.
- **Numbers only from saved API answers** (`prep/*.json`), so a re-render shows the same figures.
- **Render only in the Cloud Run job.** #11 took about 45 minutes on 100 tasks for 11,856 frames; the heaviest frames take about 10 s each.
