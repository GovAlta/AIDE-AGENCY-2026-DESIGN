// slides/deck: a 16:9 Agency 2026 deck, 1920x1080. One PNG per slide plus a PDF of the whole deck (out/slides/<name>.pdf).
// The SAME JSON builds the editable PowerPoint: python3 scripts/pptx/build_deck.py <deck.json> out/slides/<name>.pptx
// The look matches the MVAI goa-agency video frames: Agency mark top-left, Alberta signature top-right, navy band with the
// classification pill, mono labels; circuit traces only on title, chapter and end slides; content slides are a clean board.
//
// Deck fields:
// { "template": "slides/deck", "name": "my-deck", "title": "Deck title (PDF metadata)",
//   "footer": "Left text of the navy band", "classification": "UNCLASSIFIED", "numbers": true (page numbers in the band),
//   "slides": [ slide, ... ] }
// Every slide: type, ground (board | paper | night | navy | spectrum), accent (token name: purple blue lilac pink coral orange yellow
//   green cyan maroon), label (mono tag after the mark, like "U4 · How it works"), kicker, title, sub, notes (speaker notes; PowerPoint only),
//   traces (true/false to force circuit art on or off). Text fields take **bold**, ==highlight== (accent colour) and \n.
// Types and their own fields:
//   title      kicker, title, sub                                  (traces right + bottom, like the MVAI title card)
//   chapter    number ("01"), title, sub                           (ground night by default, sweep of traces under the title)
//   statement  kicker, title, sub                                  (the takeaway; use ground "spectrum" for the one line people should remember)
//   bullets    title, items: ["text" | {text, sub}] (3-6)
//   stats      title, items: [{value, unit, label, sub, accent}] (2-4), source
//   big-number kicker, before ("3 days"), value, unit, label, sub, source
//   bars       title, axis ("Median days"), rows: [{label, value (0-100 bar length), display ("24 days"), accent, neutral}], source
//   flow       title, steps: [{title, text, accent}] (3-5)
//   quote      text, who, role
//   compare    title, left: {title, items: [..]}, right: {title, items: [..]}
//   image      title, src (repo-relative path or URL), caption, source
//   agenda     title, items: [{when, title, sub, place, accent}] (3-6)
//   timeline   title, items: [{when, title, text, now: true}] (3-6)
//   end        title, date, place, cta, url (draws a QR code), host
import { top, band, kicker, md, esc, asset, tracesLayer, nth, T } from '../lib/components.mjs';
import { traces as tracesSvg, svgDoc } from '../../scripts/lib/vectors.mjs';
import { qrSvg } from '../../scripts/lib/qr.mjs';

export const meta = { kind: 'png', width: 1920, height: 1080, pdf: true, scale: 1, about: '16:9 deck (title, chapter, statement, bullets, stats, bars, flow, quote, compare, image, agenda, timeline, big-number, end) + editable PPTX' };

const DEFAULT_GROUND = { chapter: 'night' };
// traces stop under the header (y < 13 %) and above the band (the layer is 1016 px tall)
const TRACES = { title: { edges: 'rb', depth: { r: 0.2, b: 0.24 }, span: { r: [0.15, 0.72], b: [0.04, 0.76] } },
  end: { edges: 'lrb', depth: { l: 0.16, r: 0.16, b: 0.2 }, span: { l: [0.17, 0.74], r: [0.15, 0.74], b: [0.66, 0.84] } } };
const isDark = (g) => !!T.grounds[g]?.dark;
const ac = (s, i) => s.accent ?? nth(i + 1);
const cls = (name) => `a-${T.color[name] ? name : 'blue'}`;

function stage(s, i, ctx) {
  const k = kicker(s.kicker, s.accent);
  const head = (big) => `${k}${s.title ? `<div class="s-title${big ? ' ' + big : ''}">${md(s.title)}</div>` : ''}${s.sub ? `<div class="s-sub">${md(s.sub)}</div>` : ''}`;
  const src = s.source ? `<div class="source">${md(s.source)}</div>` : '';
  switch (s.type) {
    case 'title': return `<div class="stage">${head('l')}<div class="bus">${['purple', 'yellow', 'cyan'].map((c) => `<i style="--c:var(--${c})"></i>`).join('')}</div></div>`;
    case 'chapter': return `<div class="stage"><div class="chap-n">${esc(s.number ?? String(i).padStart(2, '0'))}</div><div><div class="s-title">${md(s.title)}</div>${s.sub ? `<div class="s-sub">${md(s.sub)}</div>` : ''}</div></div>`;
    case 'statement': return `<div class="stage"><div class="accent-bar"></div>${head()}</div>`;
    case 'bullets': return `<div class="stage">${head()}<ul class="s-list">${(s.items ?? []).map((it, j) => { const o = typeof it === 'string' ? { text: it } : it;
      return `<li style="--c:var(--${o.accent ?? nth(j)})"><span class="dot"></span><span>${md(o.text)}${o.sub ? `<small>${md(o.sub)}</small>` : ''}</span></li>`; }).join('')}</ul>${src}</div>`;
    case 'stats': return `<div class="stage">${head()}<div class="s-stats" style="--n:${(s.items ?? []).length}">${(s.items ?? []).map((it, j) =>
      `<div class="s-stat" style="--c:var(--${it.accent ?? nth(j)})"><div class="v">${md(it.value)}${it.unit ? `<small>${esc(it.unit)}</small>` : ''}</div><div class="l">${md(it.label ?? '')}</div>${it.sub ? `<div class="d">${md(it.sub)}</div>` : ''}</div>`).join('')}</div>${src}</div>`;
    case 'big-number': return `<div class="stage">${k}${s.before ? `<div class="bn-before">${md(s.before)}<small>BEFORE</small></div>` : ''}<div class="bn-v">${md(s.value)}${s.unit ? `<small>${esc(s.unit)}</small>` : ''}</div><div class="bn-rule"></div><div class="bn-l">${md(s.label ?? '')}</div>${s.sub ? `<div class="s-sub" style="margin-top:12px">${md(s.sub)}</div>` : ''}${src}</div>`;
    case 'bars': return `<div class="stage">${head()}${s.axis ? `<div class="s-axis">${esc(s.axis)}</div>` : ''}<div class="s-bars">${(s.rows ?? []).map((r) =>
      `<div class="s-bar" style="--c:var(--${r.accent ?? s.accent ?? 'blue'})"><span>${md(r.label)}</span><div class="t"><i class="${r.neutral ? 'neutral' : ''}" style="width:${Math.max(0, Math.min(100, r.value))}%"></i></div><b>${md(r.display ?? r.value + '%')}</b></div>`).join('')}</div>${src}</div>`;
    case 'flow': return `<div class="stage">${head()}<div class="s-flow" style="--n:${(s.steps ?? []).length}">${(s.steps ?? []).map((st, j) =>
      `<div class="s-step" style="--c:var(--${st.accent ?? nth(j)})"><div class="n">${j + 1}</div><div class="h">${md(st.title)}</div><div class="d">${md(st.text ?? '')}</div></div>`).join('')}</div>${src}</div>`;
    case 'quote': return `<div class="stage"><div class="q-mark">“</div><div class="q-text">${md(s.text)}</div>${s.who ? `<div class="q-who">${md(s.who)}</div>` : ''}${s.role ? `<div class="q-role">${esc(s.role)}</div>` : ''}</div>`;
    case 'compare': { const col = (c, a) => `<div class="s-col" style="--c:var(--${c.accent ?? a})"><h3>${md(c.title)}</h3>${(c.items ?? []).map((x) => `<div class="it">${md(x)}</div>`).join('')}</div>`;
      return `<div class="stage">${head()}<div class="s-compare">${col(s.left ?? {}, 'neutral-bar')}<div class="vs">vs</div>${col(s.right ?? {}, s.accent ?? 'green')}</div>${src}</div>`; }
    case 'image': return `<div class="stage">${head()}<div class="s-image"><div class="frame">${s.src ? `<img src="${/^(https?:|data:)/.test(s.src) ? s.src : asset(ctx, s.src)}" alt="${esc(s.alt ?? '')}">` : ''}</div><div class="cap">${md(s.caption ?? '')}</div></div>${src}</div>`;
    case 'agenda': return `<div class="stage">${head()}<div class="s-agenda">${(s.items ?? []).map((it, j) =>
      `<div class="r ${cls(it.accent ?? nth(j))}"><div class="w">${md(it.when)}</div><div class="h">${md(it.title)}${it.sub ? `<small>${md(it.sub)}</small>` : ''}</div><div class="p">${md(it.place ?? '')}</div></div>`).join('')}</div>${src}</div>`;
    case 'timeline': return `<div class="stage">${head()}<div class="s-tl" style="--n:${(s.items ?? []).length}">${(s.items ?? []).map((it, j) =>
      `<div class="e ${it.now ? 'now' : ''} ${cls(it.accent ?? nth(j))}"><div class="pin"></div><div class="when">${md(it.when)}</div><div class="h">${md(it.title)}</div>${it.text ? `<div class="d">${md(it.text)}</div>` : ''}</div>`).join('')}</div>${src}</div>`;
    case 'end': return `${s.host ? `<div class="host"><small>Hosted by</small>${md(s.host)}</div>` : ''}<div class="stage">${k}<div class="s-title">${md(s.title)}</div>` +
      `${s.date || s.place ? `<div class="end-date">${s.date ? `<span class="date">${md(s.date)}</span>` : ''}${md(s.place ?? '')}</div>` : ''}${s.cta ? `<div class="cta">${md(s.cta)}</div>` : ''}` +
      `${s.url ? `<div class="end-qr">${qrSvg(s.url, { style: 'rounded', accent: s.accent ?? 'blue' })}<span>${esc(s.url.replace(/^https?:\/\//, ''))}</span></div>` : ''}</div>`;
    default: throw new Error(`slides/deck: unknown slide type "${s.type}"`);
  }
}

export function render(d, ctx) {
  const n = (d.slides ?? []).length;
  return `<link rel="stylesheet" href="${ctx.base}/styles/slides.css">\n` + (d.slides ?? []).map((s, i) => {
    const ground = s.ground ?? DEFAULT_GROUND[s.type] ?? 'board', dark = isDark(ground);
    const tr = s.traces === false ? null : s.traces === true ? TRACES.end : TRACES[s.type];
    const art = tr ? tracesLayer({ w: 1920, h: 1016, seed: `${d.name ?? 'deck'}-${i}-${s.type}`, ground, ...tr, depth: { l: 0.16, t: 0.2, r: 0.16, b: 0.2, ...tr.depth } }) : '';
    const sweep = s.type === 'chapter' ? `<div class="art" style="left:770px;top:640px;width:1100px">${sweepLines()}</div>` : '';
    const right = d.numbers === false ? '' : `<span class="pg">${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span>`;
    return `<section class="page slide t-${s.type} g-${ground}${s.type === 'end' && s.host ? ' has-host' : ''} ${dark ? 'dark' : ''} ${cls(s.accent ?? ac(s, i))}" style="--c:var(--${s.accent ?? ac(s, i)})">${art}${sweep}
  ${top(ctx, { dark, label: s.label })}
  ${stage(s, i, ctx)}
  <div class="band"><span>${md(d.footer ?? '')}</span>${right}<span class="cls">${esc(d.classification ?? T.classification.default)}</span></div>
</section>`;
  }).join('\n');
}

// the chapter card's sweep: parallel spectrum traces that bend up and end in pads (the MVAI chapter look), as SVG
function sweepLines() {
  const cols = T.spectrum, p = [];
  cols.forEach((c, i) => {
    const y = 60 + i * 9, x1 = 320 + i * 34;
    p.push(`<path d="M0 ${y} H${x1} L${x1 + 40} ${y - 40} H${760 + i * 22}" stroke="${c}" stroke-width="3" fill="none" stroke-linejoin="round" opacity="0.95"/>`,
      `<circle cx="${760 + i * 22}" cy="${y - 40}" r="5" fill="${T.color.night}" stroke="${c}" stroke-width="2.5"/>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="160" viewBox="0 0 1100 160">${p.join('')}</svg>`;
}

// art for scripts/pptx/build_deck.py: [{ index, kind: 'traces' | 'sweep', svg, x, y, w, h }] in slide px, same seeds as render()
export function slideArt(d) {
  const out = [];
  (d.slides ?? []).forEach((s, i) => {
    const ground = s.ground ?? DEFAULT_GROUND[s.type] ?? 'board';
    const tr = s.traces === false ? null : s.traces === true ? TRACES.end : TRACES[s.type];
    if (tr) out.push({ index: i, kind: 'traces', x: 0, y: 0, w: 1920, h: 1016,
      svg: svgDoc(1920, 1016, tracesSvg({ w: 1920, h: 1016, seed: `${d.name ?? 'deck'}-${i}-${s.type}`, ground, ...tr, depth: { l: 0.16, t: 0.2, r: 0.16, b: 0.2, ...tr.depth } })) });
    if (s.type === 'chapter') out.push({ index: i, kind: 'sweep', x: 770, y: 640, w: 1100, h: 160, svg: sweepLines() });
  });
  return out;
}
