// Sample timeline: an 8 second shot of a real screenshot as a plate. Copy this file to start a film.
// stateAt(t) returns everything on screen at second t. Keep it pure: no Date, no Math.random, no state between calls.
export const DUR = 8, FPS = 60;

export async function createTimeline({ config, timing, helpers: H }) {
  const script = await fetch('/narration/script.json').then(r => r.json());
  const VO = Object.fromEntries(script.lines.map(l => [l.id, l.at]));   // narration start times: one source for voice, mix and captions
  const CAPS = H.captionsFrom(VO, timing);
  // the camera on the plate: keys [t, cx, cy, s, rotX, rotY] through a monotone spline (smooth, no overshoot)
  // a static framing (slow push-ins are not available, owner 2026-11-13): the plate holds still
  const cam = () => [760, 560, 0.8, 4, -6];
  const CREDIT = 'Data: OGL – Canada, Alberta · © TeleGeography, CC BY-NC-SA 3.0 (unconfirmed) · © OpenStreetMap contributors';

  function stateAt(t) {
    const [cx, cy, s, rotX, rotY] = cam(t);
    const spotA = H.ramp(t, 3.0, 3.6);
    const ui = {
      chrome: H.ramp(t, 0.4, 1.4), bandTitle: config.bandTitle, credits: CREDIT, fade: Math.max(1 - H.ramp(t, 0, 0.9), H.ramp(t, 7.3, 8)),
      callouts: [], caption: H.captionAt(CAPS, t),
      cursor: { ...H.cursorAt(t, [[3.4, 'pt:1500,760', false], [4.6, 'plate:layers:24,302'], [6.2, 'plate:layers:24,380']]), a: H.ramp(t, 3.2, 3.6) },
    };
    const k = H.win(t, 3.6, 7.6, 0.7, 0.5);
    if (k > 0) ui.callouts.push({ x: 1824, y: 150, align: 'right', kicker: 'Layers · data/layers/manifest.json', big: H.count(t, 23, 3.7, 1.4), sub: 'layers of public open data', note: 'Real screenshot of the running planner, Layers tab', accent: 'cyan', a: k, dy: (1 - H.ramp(t, 3.6, 4.4)) * 26 });
    return {
      bg: { kind: 'board' },   // an app screenshot sits on the Agency board ground; stars are for globe/space shots only
      plates: [{ id: 'layers', src: 'capture/layers.png', w: 1920, h: 1080, x: 1010, y: 560, cam: { cx, cy, s }, rotX, rotY,
        frame: 'browser', url: 'fiber-planner · internal', radius: 14, shadow: 1,
        dim: 0.55 * spotA, spots: [{ x: 8, y: 258, w: 344, h: 320, r: 10, a: spotA, color: 'cyan' }] }],
      ui,
    };
  }
  return { stateAt, CAPS };
}
