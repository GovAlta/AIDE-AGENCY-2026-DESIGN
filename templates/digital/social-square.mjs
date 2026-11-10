// digital/social-square: 1080x1080 social post in the invite's layout (Instagram, LinkedIn, Teams, Viva Engage).
// Content: { "template": "digital/social-square", "name": "...", "preset": "event" | "day1" | "day2" | "day3" | "cfd" | "custom",
//   "ground": "board" | "night" | "navy",
//   optional overrides (any preset): "event", "date", "title" (\n breaks), "subtitle", "lines": [..], "cta", "kicker", "anchor", "body",
//   "seed" (trace arrangement), "titleSize" (px), "chip": false, "sample": true | "label" }
// Presets print only the facts in brand/tokens/tokens.json "event".
import { CSS, inviteCover } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 1080, height: 1080, about: 'Square social post in the invite layout (event, each day, call for demos)', css: CSS };
export const render = (d, ctx) => inviteCover(d, ctx, 1080, 1080);
