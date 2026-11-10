// digital/thumbnail: 1280x720 video thumbnail (YouTube, Teams, Stream, SharePoint), matching the MVAI goa-agency frames.
// "layout": "title" (default; MVAI title card: mark, kicker, big left headline, bus rule, subtitle, traces right) | "splash" (MVAI splash).
// Content: { "template": "digital/thumbnail", "name": "...", "layout", "ground": "board" | "night" | "navy",
//   "kicker": "Agency 2026 · Explainer 01", "kickerAccent": "purple", "title": "Headline, max ~6 words", "subtitle": "one line",
//   "classification": "UNCLASSIFIED" (false hides the pill), "seed" }
// Thumbnails are read at 320 px wide: headline 2-6 words, no small print.
import { CSS, page, traces, chip, logo, mark, bus, md, isDark, cls, E_, fit } from './lib/digital.mjs';
export const meta = { kind: 'png', width: 1280, height: 720, about: 'Video thumbnail in the MVAI title or splash look', css: CSS };
export function render(d) {
  const g = d.ground ?? 'board', W = 1280, H = 720, dark = isDark(g), BAND = 78;
  const bandEl = `<div class="dg-band" style="height:${BAND}px"></div>${cls(d, `right:40px;bottom:${BAND / 2 - 12}px`)}`;
  if (d.layout === 'splash') {
    const art = traces(W, H - BAND, g, d.seed ?? `thumb-s-${g}`, { edges: 'lr', depth: { l: 0.22, r: 0.24 }, span: { l: [0.35, 0.98], r: [0.12, 0.98] }, density: 1.2 });
    return page(W, H, g, 16, `<div style="position:absolute;inset:0 0 ${BAND}px 0">${art}</div>
      <div class="safe" style="left:40px;top:30px"><div class="dg-hosted">Hosted by</div><div class="dg-host">${md(d.host ?? E_.host)}</div></div>
      ${logo(dark, 'right:40px;top:30px;width:130px')}
      ${chip(56, 'left:690px;top:62px')}
      <div class="safe dg-center" style="left:300px;width:680px;top:120px;height:${H - BAND - 140}px">
        <div class="dg-title" data-fit data-lines="2" style="font-size:${d.titleSize ?? 172}px;line-height:1;margin:0">${md(d.title ?? E_.name.replace(' ', '\n'))}</div>
        <div class="dg-date" style="font-size:2.3em;margin-top:0.25em">${md(d.date ?? E_.dates)}</div>
        <div class="dg-sub" style="font-size:2.1em;margin-top:0.1em">${md(d.place ?? E_.cities)}</div></div>
      ${bandEl}`);
  }
  const art = traces(W, H - BAND, g, d.seed ?? `thumb-${g}`, { edges: 'rb', depth: { r: 0.17, b: 0.17 }, span: { r: [0.1, 0.98], b: [0.12, 0.8] }, density: 1 });
  const tp = d.titleSize ?? fit(d.title ?? '', 900, 108, 2, 40, 0.62);
  return page(W, H, g, 16, `<div style="position:absolute;inset:0 0 ${BAND}px 0">${art}</div>
    ${mark('left:40px;top:28px;font-size:26px')}
    ${logo(dark, 'right:40px;top:26px;width:120px')}
    <div class="safe dg-left" style="left:96px;top:110px;width:930px;height:${H - BAND - 170}px;justify-content:flex-start">
      ${d.kicker ? `<div class="dg-kicker a-${d.kickerAccent ?? 'purple'}" style="font-size:1.3em">${md(d.kicker)}</div>` : ''}
      <div class="dg-title" data-fit data-lines="2" style="font-size:${tp}px;margin:0.12em 0 0">${md(d.title ?? '')}</div>
      ${bus(d.bus ?? ['lilac', 'orange', 'cyan'], 'width:330px;margin:0.9em 0 0.9em -60px;gap:7px')}
      ${d.subtitle ? `<div class="dg-body" style="font-size:2em;max-width:16em;color:var(--g-soft)">${md(d.subtitle)}</div>` : ''}
    </div>
    ${bandEl}`);
}
