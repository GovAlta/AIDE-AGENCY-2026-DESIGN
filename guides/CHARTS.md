# Charts

Seven chart blocks draw as vector SVG in every printed and slide template: `line`, `column`, `stacked`, `donut`, `waffle`, `gauge` and
`timeline`. They follow the MVAI kit's chart screens, so a chart in a handout, a deck and a film about the same project match.
The code is `templates/lib/charts.mjs`; `samples/print/charts-sample.json` and `samples/slides/charts-deck.json` show every type.

## Rules

1. **Only sourced numbers.** Every value comes from the record, and its source goes in the block's `source` line and in the piece's
   `NOTES.md`. Illustrations use example values and say so on the page ("Example values").
2. **One message per chart.** The title states what the chart shows ("Median days to decision"), never a slogan.
3. **Direct labels.** Lines carry their name and last value at the end; columns carry their values on top; donuts and waffles list their
   parts beside them. A legend appears only for grouped columns and stacked bars.
4. **Colour by meaning.** Series run along the spectrum in the MVAI order (purple first, then blue, lilac, pink and on), spaced evenly.
   To point at one bar, colour it and set the others to `"accent": "neutral"` (grey). Words are never set in a light accent; labels use
   the ground's ink.
5. **Zero baselines for columns and bars.** Line charts may start above zero (set `y.min`); say so in the title when it matters.
6. **Accessible.** Every chart has a title and a text description of its data (read by screen readers). Add `"table": true` to print the
   data as a table under the chart, or `"table": "hidden"` for screen readers only. Use one of these in every published PDF.
7. **Fit the space.** Give `width` and `height` in the template's units (points in print, pixels on slides). A full Letter column is
   about 540 wide; half a column is about 258.

## Block fields

| Type | Fields |
|---|---|
| `line` | `x` (labels), `series: [{name, values, accent?, dashed?}]`, `y: {min, max, ticks, unit, prefix, decimals}`, `endLabels` |
| `column` | `x`, `values` (one series) or `series` (grouped), `colors` (per bar, for one series), `y`, `axis: false` (no grid), `valueLabels: false` |
| `stacked` | `parts: [{label, accent?}]`, `rows: [{label, values}]`, `percent: false` (absolute bars), `labelWidth` |
| `donut` | `parts: [{label, value, accent?, display?}]`, `center: {value, label}`, `size`, `percent: false` |
| `waffle` | `value` (0-100) with `label` and `accent`, or `parts: [{label, value}]` that add to 100; `cell` |
| `gauge` | `value`, `min`, `max`, `target`, `label`, `unit`, `decimals`, `display`, `accent`, `size` |
| `timeline` | `items: [{when, title, text?, now?, accent?}]`, `alternate` (labels above and below when crowded) |

Every type also takes `title` (`showTitle: false` hides it on the page but keeps it for screen readers), `desc` (replaces the generated
description), `source`, `table`, `width`, `height` and `font` (base label size; 8.4 in print, 24 on slides).

Two or three charts side by side: `{ "type": "charts", "items": [ {chart}, {chart} ] }` in a document, or `"charts": [...]` on a
`chart` slide.

## Choosing a chart

| To show | Use |
|---|---|
| Change over time | `line` (two to four series), or `column` for a few periods |
| Compare a few amounts | `column` with one series, the item that matters coloured and the rest neutral |
| Parts of a whole, two to four parts | `donut`, or `stacked` to compare that split across groups |
| One share people should remember | `waffle` ("72 of 100") |
| Progress toward a target | `gauge` |
| Milestones | `timeline` |
| Exact values that people will look up | a `table` block, not a chart |
