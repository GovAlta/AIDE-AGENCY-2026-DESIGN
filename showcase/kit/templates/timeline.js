// Starter timeline: APP film (real screenshots and recordings of the app as plates). Runs as soon as the folder exists:
// a title card, then one plate per captured state in capture/ (capture/states.script.json -> tools/capture-states.mjs).
// Reference: the kit's example/web/timeline.js (a plate with a push-in, spotlight, cursor, callout and caption).
//
// Ground: "board" (white) is the Agency default and the right ground behind an app screenshot. Use "night" only in a dark
// film (film.config.json "theme": "dark"); never "stars" behind an app (stars are for globe/space shots only).
// stateAt(t) must be pure: the same t always gives the same picture (no Date, no Math.random, no state kept between calls).
export const DUR = 12, FPS = 60;   // set DUR to the music length, and keep film.config.json "dur" equal to it

export async function createTimeline({ config, timing, helpers: H }) {
  const script = await fetch('/narration/script.json').then(r => r.json());
  const VO = Object.fromEntries(script.lines.map(l => [l.id, l.at]));
  const CAPS = H.captionsFrom(VO, timing);
  // capture/states.json is written by tools/capture-states.mjs: { name: { file, w, h, marks: { key: {x,y,w,h} } } }
  const states = await fetch('/capture/states.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  const first = Object.values(states)[0];
  const cam = H.track([[3, 960, 540, 0.62, 6, -10], [DUR, 760, 520, 0.86, 2, -3]]);

  function stateAt(t) {
    const ui = { chrome: H.ramp(t, 0.4, 1.4), bandTitle: config.bandTitle, credits: '', caption: H.captionAt(CAPS, t),
      fade: Math.max(1 - H.ramp(t, 0, 0.9), H.ramp(t, DUR - 0.8, DUR)), callouts: [] };
    const k = H.win(t, 0.8, 4.2, 1.0, 0.8);
    if (k > 0) ui.card = { kind: 'title', a: k, traces: H.ramp(t, 1.0, 2.6), dy: (1 - H.ramp(t, 1.2, 2.6)) * 30, kicker: 'Agency 2026 · Demo ' + Number(config.slot || 0),
      lines: [config.title.replace(/^#\d+\s*/, '')], sub: 'Replace this card, then build the scenes from the storyboard.' };
    const plates = [];
    if (first) { const [cx, cy, s, rotX, rotY] = cam(t);
      plates.push({ id: 'p0', src: first.file, w: first.w, h: first.h, x: 1010, y: 560, cam: { cx, cy, s }, rotX, rotY, frame: 'browser', url: config.appUrl || '', a: H.ramp(t, 3.6, 4.6) }); }
    return { bg: { kind: 'board' }, plates, ui };
  }
  return { stateAt, CAPS };
}
