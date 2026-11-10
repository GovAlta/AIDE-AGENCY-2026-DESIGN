// digital/web-hero: 1920x600 website or SharePoint hero banner. Text left (inside 140..1040 px), art on the right.
// Content: { "template": "digital/web-hero", "name": "...", "preset": "event" | "day1" | "day2" | "day3" | "cfd" | "custom", "ground",
//   overrides as social-square ("kicker", "title", "date", "subtitle", "lines", "cta", "body"), "seed" }
// Keep the important text inside the left 1040 px: many sites crop hero banners on narrow screens from the right.
import { CSS, page, traces, chip, logo, mark, stack, preset, isDark } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 1920, height: 600, about: 'Web/SharePoint hero 1920x600, text left, art right', css: CSS };
export function render(d) {
  const g = d.ground ?? 'board', W = 1920, H = 600, p = preset(d);
  // the mark already says Agency 2026: day presets show their date as the kicker, the event preset keeps its title on one line
  if (p.event) { p.kicker = p.kicker ?? p.date; p.event = undefined; p.date = undefined; }
  if ((d.preset ?? 'event') === 'event' && !d.title) p.title = 'Agency 2026';
  p.maxLines = 2;
  const art = traces(W, H, g, d.seed ?? `hero-${g}`, { edges: 'rtb', depth: { r: 0.34, t: 0.24, b: 0.24 }, span: { t: [0.6, 0.86], b: [0.62, 0.95], r: [0.22, 0.96] }, density: 1.1 });
  return page(W, H, g, 20, `${art}
    ${mark('left:140px;top:44px;font-size:30px')}
    <div class="safe dg-left" style="left:140px;top:96px;width:900px;height:460px">${stack(p, 112, 'left')}</div>
    ${chip(60, 'left:1300px;top:30px')}
    ${logo(isDark(g), 'right:56px;top:40px;width:150px')}`);
}
