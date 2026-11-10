// print/poster: the invite as a printable poster (Letter or 11x17 tabloid). Traces frame, microchip, centred event type, QR, anchor line, Alberta logo.
// Content:
// { "template": "print/poster", "name": "...", "size": "letter" | "tabloid",
//   "day": "mon" | "tue" | "wed"            (optional: fills date, title, sub and place from tokens.event.days)
//   "event": "Agency 2026", "date": "Dec. 7–9, 2026", "headline": "Agency\n2026", "sub": "...", "place": "Edmonton · Calgary", "cta": "Call for Demos",
//   "titleSize": 96 (pt at Letter; scales with the page),
//   "qr": { "url": "https://...", "title": "Register", "display": "alberta.ca/..." }   (optional),
//   "anchor": "Anchored by the\nVelocity White Papers"  (default from tokens; "" hides it),
//   "seed": "any text: changes the trace arrangement" }
// With no "day" and no "headline", the poster is the main event poster: Agency / 2026, the dates and the cities.
import { SIZES, px, pageCss, printCss, day, logo, inviteFrame, T, esc, md, qr, qrAccent } from './lib/print.mjs';

export const meta = (d) => {
  const [w, h] = SIZES[d.size === 'tabloid' ? 'tabloid' : 'letter'];
  return { kind: 'pdf', size: 'Letter or 11x17 in', about: 'Invite-style event poster (main event or one day), optional QR', vw: px(w), vh: px(h),
    css: printCss() + pageCss(w, h) };
};

// a title size that fits the centre box: by the longest line, in pt at Letter
const autoSize = (title) => {
  const lines = String(title).split('\n'), longest = Math.max(...lines.map((l) => l.length));
  return Math.max(34, Math.min(118, Math.round(520 / Math.max(4, longest))));
};
// break a long title into balanced lines at a word boundary (unless the author gave \n)
const balance = (t, max = 16) => {
  if (t.includes('\n') || t.length <= max) return t;
  const w = t.split(' '); let best = t, score = 1e9;
  for (let i = 1; i < w.length; i++) for (let j = i + 1; j <= w.length; j++) {
    const parts = [w.slice(0, i), w.slice(i, j), w.slice(j)].filter((p) => p.length).map((p) => p.join(' '));
    if (parts.length === 3 && t.length < max * 2) continue;
    const s = Math.max(...parts.map((p) => p.length)) * 10 + parts.length;
    if (s < score) { score = s; best = parts.join('\n'); }
  }
  return best;
};

export function render(d, ctx) {
  const tab = d.size === 'tabloid';
  const [wi, hi] = SIZES[tab ? 'tabloid' : 'letter'], W = px(wi), H = px(hi);
  const k = tab ? 11 / 8.5 : 1;                            // type scale follows the page width
  const dd = d.day ? day(d.day) : null;
  const main = !dd && !d.headline;
  const event = d.event ?? T.event.name;
  const date = d.date ?? (dd ? dd.day : T.event.dates);
  const title = balance(d.headline ?? (dd ? dd.title : 'Agency\n2026'));
  const sub = d.sub ?? (dd ? dd.sub : '');
  const place = d.place ?? (dd ? dd.place : T.event.cities);
  const size = (d.titleSize ?? (main ? 96 : autoSize(title))) * k;
  const anchor = d.anchor ?? 'Anchored by the\nVelocity White Papers';
  const art = inviteFrame({ w: W, h: H, seed: d.seed ?? `poster-${d.name ?? 'x'}`, scale: tab ? 2.2 : 1.5, chipSize: 52 * k, chipTop: '4.2%', depth: { l: 0.19, t: 0.17, r: 0.19, b: 0.15 }, span: { b: [0.3, 0.72] } });
  const content = main
    ? `<div class="tt" data-fit style="font-size:${size}pt;margin-top:0">${md(title)}</div><div class="dt" style="font-size:${30 * k}pt">${md(date)}</div><div class="sb" style="font-size:${24 * k}pt;margin-top:${4 * k}pt">${md(place)}</div>`
    : `${event ? `<div class="ev" style="font-size:${18 * k}pt">${md(event)}</div>` : ''}${date ? `<div class="dt" style="font-size:${18 * k}pt">${md(date)}</div>` : ''}` +
      `<div class="tt" data-fit style="font-size:${size}pt">${md(title)}</div>${sub ? `<div class="sb" style="font-size:${18 * k}pt">${md(sub)}</div>` : ''}` +
      `${place ? `<div class="pl" style="font-size:${15 * k}pt">${md(place)}</div>` : ''}${d.cta ? `<div class="cta" style="font-size:${30 * k}pt">${md(d.cta)}</div>` : ''}`;
  const q = d.qr ? `<div class="qr-box" style="--u:${k}pt">${qr(d.qr.url, { title: d.qr.title, display: d.qr.display, accent: qrAccent(d.qr.accent ?? 'blue') })}</div>` : '';
  return `<section class="page poster g-board" style="width:${wi}in;height:${hi}in;--u:${k}pt">${art}
  <div class="pz" style="left:20%;right:20%;top:17%;bottom:16%">${content}${q}</div>
  <div class="foot" style="left:${0.55 * k}in;right:${0.55 * k}in;bottom:${0.45 * k}in">
    <div class="anchor" style="font-size:${10 * k}pt">${md(anchor)}</div>${logo(ctx, 'ab-logo')}
  </div>
</section>`;
}
