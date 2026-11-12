# Notes: sources, method and open confirmations

Film: #11 Pan-Canadian Fibre Optics Planner, for Agency 2026. Classification: Unclassified (owner, 2026-11-11).
Planner version: `GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK` at commit 2610761 (2026-11-11).

## Every figure and where it comes from

| On screen or spoken | Value | Source |
|---|---|---|
| Subsea cable systems | 713 | `data/layers/manifest.json`, layer `subsea_cables`, `featureCount` (TeleGeography) |
| Cable landing points | 1,928; 155 in Canada | planner README, Data table (`landing_points`) |
| International subsea cables (land in 2+ countries) | Canada 7, United States 85, United Kingdom 55, Singapore 45, France 29, Japan 28, India 21, Ireland 15 | derived by `film/tools/cable-countries.py` (2026-11-11): a cable lands in a country when an end of one of its line parts lies within 15 km of that country's landing point in `landing_points.overview.geojson`. Canada is 7 at 5, 15 and 30 km. Spot checks match public landing lists (EXA Express, Grace Hopper, MAREA, Greenland Connect, Crosslake, Dunant); Topaz also matches Taiwan. Includes planned cables. Of Canada's 155 landing points, 115 are in British Columbia, mostly short domestic coastal systems. Owner asked for this comparison on 2026-11-11 |
| Cable landing points in Alberta | 0 | derived: point-in-polygon of `landing_points` against the Alberta polygon of `boundaries.overview.geojson` (2026-11-11) |
| Gas processing plants in Alberta | 601 of 718 | derived: `critical_infra.overview.geojson`, kind "Gas processing plant", point-in-polygon against the Alberta polygon (2026-11-11). The layer is NRCan CanVec, source dates 1949–2016, and is incomplete (planner README) |
| Layers | 23 | planner README ("23 layer ids") and `manifest.json` |
| Highway segments, rail lines | 27,903; 1,669 | `manifest.json` `featureCount` (`roads`, `rail`) |
| Reserves, land-claim areas and Métis Settlements | 3,387 | `manifest.json` (`indigenous_lands`) |
| First Nations and Inuit community points; military sites | 689; 978 | `manifest.json` (`indigenous_communities`, `military`) |
| Permafrost ecodistricts; remote communities | 1,020; 276 | `manifest.json` (`permafrost`, `remote_communities`) |
| Fibre coverage hexagons; fixed radio link sites | 14,915; 20,939 | `manifest.json` (`broadband_fibre`, `fixed_link_sites`) |
| Communities with no fibre backbone nearby | 661 | planner walkthrough, step 1 (`broadband_communities`) |
| Cities, towns and villages | 2,757 | `manifest.json` (`named_places`) |
| Modeled routes | 15 (2 east-west, 13 north-south) | `data/routes/index.json` |
| Southern route | 7,264 km, Victoria to St. John's | `data/routes/index.json` (`ew-south`, 7264.056 km) |
| Northern route | Prince Rupert to Churchill; subsea legs to Japan and Ireland, indicative | `config/routes/ew-north.json`, `data/routes/ew-north.json` |
| Calgary to Vancouver | 970 km, 15 water crossings | planner `POST api/solve`, 2026-11-11 (`film/prep/plans.json`) |
| Edmonton to Vancouver | 1,166 km, 19 water crossings | same |
| Edmonton to Prince Rupert | 1,529 km (1,523 km by rail), 88 water crossings | same |
| Search replay | 7,794 / 11,625 / 17,370 nodes settled | `film/tools/trace-solve.mjs`: the planner's compiled solver with one added recording line; lengths match the API results exactly |
| Drawn line (Mackenzie Valley) | 927 km; 867 km in permafrost; 56 km across lakes; 11 rivers, 4 minor roads, 4 winter roads | planner `POST api/estimate`, method "buried", 2026-11-11 (`film/prep/estimate.json`). The line follows the "not routed" stretch of `data/routes/ns-nt.json` |
| Indicative cost range | $44 million to $420 million (CAD) | same response (`cost.low` 44,331,000; `cost.high` 420,048,000). Benchmark rates; not a budget figure |
| Event facts | Agency 2026, Dec. 7–9, 2026, Edmonton · Calgary | `brand/tokens/tokens.json` (`event`) |

## Caveats the planner states, and how the film carries them

- Routing runs on an interim sample network (`graph.meta.sample = true`). Shown in the Plan panel and on the end card.
- Route costs are placeholder units and hidden. The Compare table shows "Hidden", as the tool does.
- The drawn-line cost is indicative. Said in the narration and shown on the panel.
- Subsea cable routes are schematic; the two long subsea legs of the northern route are indicative and in no total.
- Military data is from OpenStreetMap and incomplete; critical infrastructure is incomplete; community points are office locations, not territories.

## What is not the planner's own

- Base imagery: NASA Blue Marble (2004-08) and VIIRS Black Marble (2016), from NASA GIBS, public domain. The planner itself uses OpenStreetMap tiles.
  The night lights are re-cut in `film/server.mjs` (warm pixels kept, alpha from brightness).
- 3D terrain and hillshade: Mapzen terrain tiles (AWS Open Data, terrarium encoding). The planner's own relief (NRCan MRDEM) is 2D.
- Layer colours follow the Agency 2026 spectrum instead of the planner's own colours; the subsea cables keep TeleGeography's colours.
- The panel is a re-draw on the night ground. Title, tabs, groups, layer names, counts, buttons and warnings are the planner's.
- The "0 landing points in Alberta" and "601 of 718" figures are derived for the film (method above).

## Credits required on screen (kept on every map frame and on the end card)

- Submarine cable data © TeleGeography (submarinecablemap.com), CC BY-NC-SA 3.0 (unconfirmed). Non-commercial, share-alike.
- © OpenStreetMap contributors (ODbL): military layer.
- Contains information licensed under the Open Government Licence – Canada and – Alberta.

## Open confirmations for the owner

1. Closing line: the owner wrote "a promising feature"; the narration says "a promising future". Confirm.
2. The TeleGeography licence is non-commercial and unconfirmed for this snapshot (planner STRA R10). Confirm that showing it at a public event day is acceptable.
3. Narrator: Matilda (approved 2026-10-11), `eleven_v4`, processed outside Canada. Fine for Unclassified.
