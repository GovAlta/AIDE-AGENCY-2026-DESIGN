// digital/cover: 1280x720 video cover (YouTube custom thumbnail, Stream, SharePoint) with a still from the film itself.
// Title block left (mark, kicker, headline, bus rule, subtitle), the film still right as a lit screen in 3D space, band and classification
// at the foot. Same type, grounds and traces as digital/thumbnail, so a series of covers reads as one family.
// Content: { "template": "digital/cover", "name": "...", "ground": "night" (default) | "navy" | "board",
//   "kicker": "Agency 2026 · Showcase 01", "kickerAccent": "purple", "title": "Project name", "subtitle": "one line, what it does",
//   "image": "path/to/still.png" (relative to the content file; an approved frame of the film, 2:1 or 16:9), "alt": "what the still shows",
//   "aspect": 2.02 (width / height of the still; 2.02 = a 1920x950 crop above the caption line), "tilt": 12 (degrees the screen turns toward the title; 0 = flat), "classification": "UNCLASSIFIED" (false hides the pill), "seed" }
// Covers are read at 320 px wide: headline 1-5 words, subtitle under 8 words, no small print. Use a still whose own text is large.
import fs from 'node:fs';
import path from 'node:path';
import { CSS, page, traces, logo, mark, bus, md, isDark, cls, fit, esc } from './lib/digital.mjs';

const COVER_CSS = `
.cv-stage { position: absolute; perspective: 1500px; perspective-origin: 0% 50%; z-index: 1; }
.cv-screen { position: absolute; inset: 0; transform-origin: 0% 50%; border-radius: 14px; overflow: hidden;
  outline: 1px solid color-mix(in srgb, var(--g-ink) 22%, transparent);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--g-ink) 5%, transparent), 0 34px 80px rgba(0, 0, 0, 0.55),
    0 0 120px color-mix(in srgb, var(--cyan) 26%, transparent); }
.cv-screen img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 0%; }
.cv-screen::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(100deg, color-mix(in srgb, var(--g-ink) 10%, transparent) 0%, transparent 38%); }
.cv-glow { position: absolute; z-index: 0; border-radius: 50%; filter: blur(60px);
  background: radial-gradient(closest-side, color-mix(in srgb, var(--cyan) 30%, transparent), transparent); }
`;

export const meta = { kind: 'png', width: 1280, height: 720, about: 'Video cover with a still from the film, title block left', css: CSS + COVER_CSS };

function dataUri(d, ctx) {
  if (!d.image) return '';
  if (/^(data:|https?:)/.test(d.image)) return d.image;
  const f = path.resolve(path.dirname(ctx.file), d.image);
  const ext = path.extname(f).slice(1).toLowerCase().replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(f).toString('base64')}`;
}

export function render(d, ctx) {
  const g = d.ground ?? 'night', W = 1280, H = 720, dark = isDark(g), BAND = 78;
  const art = traces(W, H - BAND, g, d.seed ?? `cover-${g}`, { edges: 'b', depth: { b: 0.15 }, span: { b: [0.02, 0.46] }, density: 0.8 });
  // screen box: right side, leaving the left 470 px to the title block
  const SW = 700, SH = Math.round(SW / (d.aspect ?? 2.02)), SX = 500, SY = Math.round((H - BAND - SH) / 2) + 8, tilt = d.tilt ?? 12;
  const tp = d.titleSize ?? fit(d.title ?? '', 400, 74, 3, 36, 0.6);
  const src = dataUri(d, ctx);
  return page(W, H, g, 16, `<div style="position:absolute;inset:0 0 ${BAND}px 0">${art}</div>
    ${mark('left:40px;top:28px;font-size:26px')}
    ${logo(dark, 'right:40px;top:26px;width:120px')}
    ${src ? `<div class="cv-glow" style="left:${SX + 60}px;top:${SY - 40}px;width:${SW}px;height:${SH + 120}px"></div>
    <div class="cv-stage" style="left:${SX}px;top:${SY}px;width:${SW}px;height:${SH}px">
      <div class="cv-screen" style="transform:rotateY(-${tilt}deg)"><img src="${src}" alt="${esc(d.alt ?? '')}"></div></div>` : ''}
    <div class="safe dg-left" style="left:56px;top:96px;width:420px;height:${H - BAND - 130}px;justify-content:center;z-index:2">
      ${d.kicker ? `<div class="dg-kicker a-${d.kickerAccent ?? 'purple'}" style="font-size:1.05em">${md(d.kicker)}</div>` : ''}
      <div class="dg-title" data-fit data-lines="3" style="font-size:${tp}px;margin:0.18em 0 0">${md(d.title ?? '')}</div>
      ${bus(d.bus ?? ['lilac', 'orange', 'cyan'], 'width:260px;margin:0.8em 0 0.8em -56px;gap:6px')}
      ${d.subtitle ? `<div class="dg-body" style="font-size:1.45em;max-width:15em;color:var(--g-soft)">${md(d.subtitle)}</div>` : ''}
    </div>
    <div class="dg-band" style="height:${BAND}px"></div>${cls(d, `right:40px;bottom:${BAND / 2 - 12}px`)}`);
}
