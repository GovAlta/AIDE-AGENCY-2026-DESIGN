// digital/email-header: 600x200 email banner (Outlook, newsletters), rendered at 2x (1200x400 PNG) so it stays sharp; set width=600 in the email.
// Content: { "template": "digital/email-header", "name": "...", "ground": "board" | "night" | "navy", "kicker": "optional mono line",
//   "title": "Agency 2026" (default), "line": "Dec. 7–9, 2026 · Edmonton · Calgary" (default), "seed": "..." }
import { CSS, page, traces, chip, logo, md, isDark, E_ } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 600, height: 200, scale: 2, about: 'Email header 600x200 (PNG at 2x)', css: CSS };
export function render(d) {
  const g = d.ground ?? 'board', W = 600, H = 200;
  const art = traces(W, H, g, d.seed ?? `email-${g}`, { edges: 'rb', depth: { r: 0.36, b: 0.3 }, span: { r: [0.42, 0.95], b: [0.6, 0.9] }, scale: 0.75, density: 1.2 });
  return page(W, H, g, 12, `${art}
    <div class="safe dg-left" style="left:32px;top:0;height:${H}px;width:340px">
      ${d.kicker ? `<div class="dg-kicker">${md(d.kicker)}</div>` : ''}
      <div class="dg-title" data-fit data-lines="1" style="font-size:52px;margin:0.05em 0 0">${md(d.title ?? E_.name)}</div>
      <div class="dg-date" style="font-size:1.35em;margin-top:0.15em">${md(d.line ?? `${E_.dates} · ${E_.cities}`)}</div>
    </div>
    ${chip(34, 'left:430px;top:22px')}
    ${logo(isDark(g), 'right:22px;top:22px;width:92px')}`);
}
