// Starter timeline: MAP film (the app's own geographic data on the kit's map stage, web/modules/map-stage.js).
// Declare layers in film.config.json "map.layers" (files from the film folder or from "mounts"), then drive them here.
// Reference: film #11, showcase/reference/11-pan-canadian-fibre/film/web/timeline.js in the design repo (3:17 on a globe).
//
// Theme: a light film uses basemap 'light' (NASA relief, pale); a dark film or one dark scene uses 'nasa-night'.
// Grounds: 'none' behind the map (the map covers the frame), 'stars' only when the camera is far out on the globe.
// A camera that follows a line (a river, a route) must be smoothed with H.smoothPath; never point it at the line head.
// stateAt(t) must be pure.
export const DUR = 16, FPS = 60;

export async function createTimeline({ config, timing, stage, helpers: H }) {
  const script = await fetch('/narration/script.json').then(r => r.json());
  const VO = Object.fromEntries(script.lines.map(l => [l.id, l.at]));
  const CAPS = H.captionsFrom(VO, timing);
  const decl = config.map?.layers || [], ids = decl.map(L => L.id);
  const s0 = config.map?.start || { lng: -100, lat: 55, zoom: 3 };
  // camera keys [t, lng, lat, zoom, pitch, bearing]: a push from the province down to the start view
  const cam = H.track([[0, s0.lng, s0.lat, Math.max(2.2, s0.zoom - 3), 0, 0], [5, s0.lng, s0.lat, s0.zoom - 0.6, 20, -6], [DUR, s0.lng, s0.lat, s0.zoom + 0.6, 45, -14]]);
  // the first line layer marked "progress": a follow camera along it would be H.smoothPath(t => [...stage.along(id, p(t)), stage.heading(id, p(t))], ...)
  const lineId = decl.find(L => L.type === 'line' && L.progress)?.id;

  function stateAt(t) {
    const [lng, lat, zoom, pitch, bearing] = cam(t);
    const layers = {}, reveal = {}; ids.forEach((id, i) => { const t0 = 4 + i * 1.6; layers[id] = H.ramp(t, t0, t0 + 0.8); reveal[id] = H.ramp(t, t0, t0 + 2.5); });
    const lines = lineId ? { [lineId]: { p: H.ramp(t, 4, DUR - 2), head: true } } : {};
    const ui = { chrome: H.ramp(t, 0.4, 1.4), bandTitle: config.bandTitle, credits: config.credits || '', caption: H.captionAt(CAPS, t),
      fade: Math.max(1 - H.ramp(t, 0, 0.9), H.ramp(t, DUR - 0.8, DUR)), callouts: [], labels: [] };
    const k = H.win(t, 0.6, 3.8, 0.9, 0.8);
    if (k > 0) ui.card = { kind: 'title', a: k, traces: H.ramp(t, 0.8, 2.4), kicker: 'Agency 2026 · Demo' + (/^\d+$/.test(String(config.slot)) ? ' ' + Number(config.slot) : ''), lines: [config.title.replace(/^#\d+\s*/, '')], sub: 'Replace this card.' };
    return { bg: { kind: 'none' }, world: { map: { cam: { lng, lat, zoom, pitch, bearing }, layers, reveal, lines } }, ui };
  }
  return { stateAt, CAPS };
}
