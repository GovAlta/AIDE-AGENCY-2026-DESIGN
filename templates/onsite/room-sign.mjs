// onsite/room-sign: door or easel sign for a room: the room, the session on now, the next one, and a QR code to the agenda.
// Letter (8.5 x 11 in) or tabloid (11 x 17 in), portrait. Vector PDF + PNG preview. One page per entry in "rooms" (print a set at once).
// Content: { "template": "onsite/room-sign", "name": "...", "size": "letter" | "tabloid", "day": "day1" | "day2" | "day3",
//   "qr": { "url": "...", "label": "Full agenda" },
//   "rooms": [ { "room": "Hall A", "now": { "time": "9:00–10:00", "title": "Session title", "who": "Speaker or host" },
//                "next": { "time": "10:30", "title": "Session title" } } ], "classification": "UNCLASSIFIED", "sample": "Sample" }
// Session titles, times and names come from the confirmed agenda only; leave "next" out when there is none.
import { page, meta as M, traces, logo, wordmark, qrBox, sampleTag, cls, isDark, esc, md, T, E } from './lib/onsite.mjs';

const SIZES = { letter: [8.5, 11], tabloid: [11, 17] };
const dims = (d) => { const s = SIZES[d.size ?? 'letter']; if (!s) throw new Error('size must be letter or tabloid'); return s; };
export const meta = (d) => M({ in: dims(d), size: d.size === 'tabloid' ? 'Tabloid 11x17 in' : 'Letter 8.5x11 in', about: 'Room door sign: room, session now, next session, QR to the agenda' });

export function render(d) {
  const [wi, hi] = dims(d), W = 816, H = Math.round(816 * hi / wi), g = d.ground ?? 'board', dark = isDark(g);
  const day = d.day ? E.days[+String(d.day).replace('day', '') - 1] : null, acc = day?.accent ?? 'blue', c = T.color[acc];
  return (d.rooms ?? []).map((r, i) => page({ in: [wi, hi], design: [W, H], ground: g }, `
    ${traces(W, H, g, `room-${i}-${r.room}`, { edges: 'r', depth: { r: 0.22 }, span: { r: [0.04, 0.3] }, scale: 1 })}
    ${wordmark(dark, 'left:56px;top:50px;width:170px')}
    ${logo(dark, 'left:56px;top:' + (H - 96) + 'px;width:150px')}
    <div class="safe" style="left:56px;width:${W - 112 - 150}px;top:150px;display:flex;flex-direction:column;gap:12px">
      ${day ? `<div class="os-date" style="font-size:20px">${esc(day.day)} · <span class="os-place">${esc(day.title)}</span></div>` : ''}
      <div class="os-title" data-fit style="font-size:${(r.room ?? '').length > 12 ? 86 : 112}px;max-height:240px">${md(r.room)}</div>
      <div style="height:8px;width:180px;border-radius:4px;background:${c}"></div>
    </div>
    ${r.now ? `<div class="safe" style="left:56px;width:${W - 112}px;top:${H * 0.42}px;background:var(--g-field, var(--field));border-radius:14px;border-left:12px solid ${c};padding:26px 30px;display:flex;flex-direction:column;gap:8px">
      <div class="os-kicker" style="font-size:18px">Now · ${esc(r.now.time ?? '')}</div>
      <div class="os-title" data-fit style="font-size:46px;line-height:1.06;max-height:150px">${md(r.now.title)}</div>
      ${r.now.who ? `<div class="os-sub" style="font-size:24px">${md(r.now.who)}</div>` : ''}</div>` : ''}
    ${r.next ? `<div class="safe" style="left:56px;width:${W - 112}px;top:${H * 0.69}px;display:flex;flex-direction:column;gap:6px">
      <div class="os-kicker" style="font-size:16px;color:var(--g-soft, var(--mute))">Next · ${esc(r.next.time ?? '')}</div>
      <div class="os-place" data-fit style="font-size:30px;max-height:80px">${md(r.next.title)}</div></div>` : ''}
    ${d.qr ? `<div class="safe" style="left:${W - 56 - 300}px;width:300px;top:${H - 190}px;font-size:18px;display:flex;justify-content:flex-end">${qrBox(d.qr.url, 120, d.qr.label ?? 'Full agenda')}</div>` : ''}
    ${cls(d, `left:230px;top:${H - 80}px;font-size:11px`)}
    ${sampleTag(d, 'left:250px;top:58px;font-size:12px')}`)).join('');
}
