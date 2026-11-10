// digital/teams-background: 1920x1080 Microsoft Teams / Zoom background. The centre and left stay clear for the person; art runs on the
// right edge and top-right only; a small mark and date sit top-left where name labels do not cover them.
// Content: { "template": "digital/teams-background", "name": "...", "ground": "board" | "night" | "navy",
//   "line1": "Dec. 7–9, 2026" (default: event dates), "line2": "Edmonton · Calgary" (default: event cities), "seed": "...", "chip": true }
// Teams mirrors your self-view only: other people see the text the right way round.
import { CSS, page, traces, chip, logo, mark, md, isDark, E_ } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 1920, height: 1080, about: 'Teams/Zoom background: art on the right, centre left clear', css: CSS };
export function render(d) {
  const g = d.ground ?? 'board', W = 1920, H = 1080;
  const art = traces(W, H, g, d.seed ?? `teams-${g}`, { edges: 'rtb', depth: { r: 0.24, t: 0.16, b: 0.14 }, span: { t: [0.66, 0.97], b: [0.7, 0.97], r: [0.12, 0.86] }, density: 1.1 });
  return page(W, H, g, 22, `${art}
    ${mark('left:80px;top:70px;font-size:48px')}
    <div class="safe" style="left:80px;top:156px"><div class="dg-date" style="font-size:1.6em;margin:0">${md(d.line1 ?? E_.dates)}</div><div class="dg-line" style="font-size:1.4em;margin-top:0.2em">${md(d.line2 ?? E_.cities)}</div></div>
    ${d.chip === false ? '' : chip(70, 'left:1500px;top:40px')}
    ${logo(isDark(g), 'left:80px;bottom:64px;width:200px')}`);
}
