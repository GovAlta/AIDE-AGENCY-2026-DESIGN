// digital/countdown: 1080x1080 "N days to go" social tile in the invite layout.
// Content: { "template": "digital/countdown", "name": "...", "days": 12, "ground": "board" | "night" | "navy", "seed", "sample": true }
// Count the days yourself from the event start (Dec. 7, 2026) on the day you post; "1" prints "day to go".
import { CSS, inviteCover, E_ } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 1080, height: 1080, about: 'Countdown tile "N days to go"', css: CSS };
export function render(d, ctx) {
  const n = d.days ?? 'N';
  return inviteCover({ preset: 'custom', event: E_.name, date: E_.dates, title: String(n), subtitle: +n === 1 ? 'day to go' : 'days to go', lines: [E_.cities],
    anchor: E_.anchor, titleSize: 300, ...d }, ctx, 1080, 1080, { maxLines: 1 });
}
