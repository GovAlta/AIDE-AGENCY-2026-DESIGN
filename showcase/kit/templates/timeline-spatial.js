// Starter timeline: ARCHITECTURE EXPLAINER in the light neumorphic-glass look, on the spatial stage (kit web/modules/spatial-stage.js).
// The product's own screens are frosted-glass windows at different depths and angles; a camera travels through the space; thin light
// lines carry work from one window to the next; a wall of small cards shows scale. For people who are not engineers.
// Four acts. Keep the order; replace every EXAMPLE word with the product's own plain words (recorded in NOTES.md).
//   1  What it is         the main window alone, large and sharp: one plain sentence, the people it serves
//   2  Architecture       the systems it reaches appear one at a time around it; the focus moves to each as it is named
//   3  One request        followed end to end along the lines: ask, read, a person says yes, the record
//   4  Opportunities      the camera travels on to the wall: from one block to all of them; the owner's closing line; end card
// Rules (web/modules/README.md): one new idea per shot; name every part before it moves; at most about seven things to read at once;
// the sharp window is the one the narration is about. stateAt(t) must be pure: no clocks, no random numbers.
// The window interiors below use the stage's plain .sp-* text helpers. A real film brings its own screens (web/screens.js, with its
// neumorphic controls) and passes their HTML as each window's `html`.
export const DUR = 32, FPS = 60;   // set DUR to the music length, and keep film.config.json "dur" equal to it

export async function createTimeline({ config, timing, stage, helpers: H }) {
  const script = await fetch('/narration/script.json').then(r => r.json());
  const VO = Object.fromEntries(script.lines.map(l => [l.id, l.at]));
  const CAPS = H.captionsFrom(VO, timing);
  const EV = (await fetch('/brand/tokens/tokens.json').then(r => r.json())).event;
  const NAME = config.title.replace(/^#\d+\s*/, '');

  // ---- the windows: where each one lives in the space (x, y, z = its centre; ry, rx = how it is turned). EXAMPLE names ----
  const ASK = { id: 'ask', x: 800, y: 560, z: 0, ry: 5, w: 840, h: 560, hero: true, glow: 'blue' };
  const SYS = [
    { id: 'docs', x: 1570, y: 300, z: -300, ry: -22, w: 430, h: 240, glow: 'cyan', name: 'Documents', accent: 'cyan' },
    { id: 'mail', x: 1650, y: 650, z: 60, ry: -30, w: 430, h: 240, glow: 'lilac', name: 'Mail and calendar', accent: 'purple' },
    { id: 'tick', x: 1430, y: 940, z: -520, ry: -16, rx: 5, w: 430, h: 240, glow: 'yellow', name: 'Tickets', accent: 'orange', tag: 'reads' },
    { id: 'code', x: 70, y: 290, z: -620, ry: 26, w: 430, h: 240, glow: 'green', name: 'Code', accent: 'green' },
    { id: 'chat', x: 10, y: 770, z: -260, ry: 32, rx: -4, w: 430, h: 240, glow: 'pink', name: 'Team chat', accent: 'pink' },
  ];
  const GATE = { id: 'gate', x: 1290, y: 560, z: 240, ry: -8, w: 620, h: 430, glow: 'orange' };
  const REC = { id: 'record', x: 1860, y: 700, z: -80, ry: -24, w: 600, h: 400, glow: 'green' };
  const SYS_T = [7.2, 8.5, 9.8, 11.1, 12.4];   // when each system appears (the narration names it then)
  // the wall: 30 blocks of 160 small cards in one long row, far behind and to the right, receding to a horizon. EXAMPLE numbers
  const PER = 160, WALL = { x: 48000, y: 700, z: -24000, ry: 24, card: [150, 86], gap: 26, blocks: { cols: 30, rows: 1, size: [16, 10], gap: 150, labels: true }, accents: ['blue', 'purple', 'green', 'cyan'], labels: ['Worker'] };

  // ---- the camera: one continuous move. Keys are fitted with stage.frame (windows) and stage.wallFrame; H.track joins them smoothly.
  //      pad < 1 frames tighter than the safe area, > 1 looser. A window turned by ry faces a camera whose yaw is -ry. ----
  const ctr = w => [w.x, w.y, w.z];
  const K = (t, c, focus) => { const f = focus || c.focus; return [t, c.x, c.y, c.z, c.yaw, c.pitch, c.aperture ?? 1, f[0], f[1], f[2]]; };
  const ALL = [ASK, ...SYS];
  // the camera holds still on each framing and moves between framings in 0.4 s: slow push-ins, orbits and zoom creep are not available
  // (owner, 2026-11-13: "The slow push always looks bad"); the dry run fails any slow scale during a hold
  const hold = (a, b, c, focus) => [K(a, c, focus), K(b, c, focus)];
  const F1 = stage.frame([ASK], 1.06, { yaw: 4 }), F2 = stage.frame([ASK, SYS[0], SYS[1]], 0.98, { yaw: 7 }), F3 = stage.frame(ALL, 0.96, { yaw: 0, pitch: 2 });
  const F4 = stage.frame([ASK, GATE], 0.98, { yaw: 8 }), F5 = stage.frame([GATE, REC], 1.0, { yaw: 14, pitch: 2 });
  const W1 = stage.wallFrame(WALL, 1 / 30, 1.3, { yaw: 28, pitch: 2, shift: [230, 110] }), W2 = stage.wallFrame(WALL, 5 / 30, 0.8, { yaw: 38, pitch: 5, shift: [120, 130] });
  const CAM = H.track([
    ...hold(0, 7.4, F1, ctr(ASK)),                                     // act 1: the main window
    ...hold(7.8, 9.8, F2, ctr(SYS[0])),                                // act 2: the systems as they are named
    ...hold(10.2, 15.8, F3, ctr(ASK)),
    ...hold(16.2, 19.8, F4, ctr(GATE)),                                // act 3: follow the request
    ...hold(20.2, 25.4, F5, ctr(REC)),
    ...hold(25.8, 28.4, W1), ...hold(28.8, DUR, W2),                   // act 4: the wall: one block, then the horizon (a cut-like 0.4 s move)
  ]);

  // ---- window interiors (EXAMPLE content; a real film uses its own screens) ----
  const askHtml = u => `<div class="sp-pad"><div class="sp-kick">The assistant</div>
    <div class="sp-row" style="justify-content:flex-end"><div class="sp-chip on" data-k="q" style="font-size:30px;padding:16px 28px">EXAMPLE: where is the policy?</div></div>
    <div class="sp-text" style="opacity:${H.clamp(u * 3 - 0.6)}"><b>One plain answer.</b> EXAMPLE: the assistant answers from the systems this person can open.</div>
    <div class="sp-row" style="opacity:${H.clamp(u * 3 - 1.4)}"><span class="sp-chip" data-k="src">Documents · 2</span><span class="sp-chip">Mail · 1</span></div></div>`;
  const sysHtml = s => `<div class="sp-pad" style="gap:14px"><div class="sp-row"><span class="sp-dot" style="--c:var(--${s.accent})"></span><span class="sp-title" style="font-size:36px">${s.name}</span>${s.tag ? `<span class="sp-chip" style="margin-left:auto;font-size:20px">${s.tag}</span>` : ''}</div>
    <div class="sp-kick">Example system</div><div class="sp-bar" style="width:86%"></div><div class="sp-bar" style="width:62%"></div></div>`;
  const gateHtml = yes => `<div class="sp-pad"><div class="sp-kick">Permission request</div><div class="sp-title">Code · open a change</div>
    <div class="sp-row" style="margin-top:6px"><span class="sp-chip">Always</span><span class="sp-chip on">Ask me</span><span class="sp-chip">Never</span></div>
    <div class="sp-row" style="margin-top:auto"><span class="sp-chip${yes > 0.5 ? ' on' : ''}" data-k="yes" style="font-size:30px;padding:16px 44px">Yes</span><span class="sp-chip" style="font-size:30px;padding:16px 34px">Not now</span></div></div>`;
  const recHtml = n => `<div class="sp-pad" style="gap:12px"><div class="sp-row"><span class="sp-title" style="font-size:34px">The record</span><span class="sp-chip" style="margin-left:auto;font-size:20px">append-only</span></div>
    ${['Analyst · asked · the assistant', 'Assistant · read · Documents'].map(x => `<div class="sp-text" style="font-size:24px;opacity:.6">${x}</div>`).join('')}
    <div class="sp-chip" data-k="new" style="opacity:${n};border-radius:22px;padding:16px 22px;font-size:24px">Analyst · approved · change · EXAMPLE</div></div>`;

  function stateAt(t) {
    const [x, y, z, yaw, pitch, aperture, fx, fy, fz] = CAM(t);
    const space = { cam: { x, y, z, yaw, pitch, aperture, focus: [fx, fy, fz] }, windows: [], lines: [], ground: { glows: [{ x: 300, y: 900, z: -1400, accent: 'cyan', r: 700, a: 0.22 }, { x: 1700, y: 200, z: -1800, accent: 'lilac', r: 800, a: 0.24 }, { x: 3600, y: 600, z: -3800, accent: 'blue', r: 1500, a: 0.2 }] } };
    const ui = { chrome: H.ramp(t, 0.4, 1.4), bandTitle: config.bandTitle, credits: 'Example content: replace before review', caption: H.captionAt(CAPS, t),
      fade: Math.max(1 - H.ramp(t, 0, 0.9), H.ramp(t, DUR - 0.8, DUR)), callouts: [], panels: [] };
    const act = (n, title, a, b) => { const k = H.win(t, a, b, 0.5, 0.4); if (k > 0) ui.callouts.push({ x: 960, y: 118, align: 'center', kicker: `${n} · ${title}`, accent: 'blue', a: k }); };
    const out = H.ramp(t, 23.4, 25.0);   // everything leaves as the camera travels on to the wall
    const put = (w, uIn, html, uOut = 0) => { if (uIn <= 0) return; let o = stage.enter({ ...w, html }, uIn); const g = Math.max(out, uOut); if (g > 0) o = stage.leave(o, g); space.windows.push(o); };

    // ---- act 1: what it is ----
    act(1, 'What it is', 0.8, 6.4);
    put(ASK, H.ramp(t, 0.5, 1.6), askHtml(H.ramp(t, 1.4, 5.0)), H.ramp(t, 19.4, 20.4));   // the main window steps back once the request has moved on

    // ---- act 2: the architecture, one system at a time ----
    act(2, 'What it can reach', 6.8, 14.6);
    SYS.forEach((s, i) => { const u = H.ramp(t, SYS_T[i], SYS_T[i] + 1.0), away = s.id === 'docs' ? H.ramp(t, 19.4, 20.4) : H.ramp(t, 15.0, 16.2); put(s, u, sysHtml(s), away);
      if (u > 0) space.lines.push({ id: 'l-' + s.id, from: s.x > ASK.x ? 'ask@r' : 'ask@l', to: s.id + (s.x > ASK.x ? '@l' : '@r'), p: H.ramp(t, SYS_T[i] + 0.3, SYS_T[i] + 1.2), accent: s.accent,
        pulses: [((t - SYS_T[i]) * 0.45) % 1], a: (1 - out) * (1 - away) }); });

    // ---- act 3: one request, end to end ----
    act(3, 'One request, end to end', 15.2, 23.0);
    const uG = H.ramp(t, 17.0, 18.0), yes = H.ramp(t, 19.6, 19.9), uR = H.ramp(t, 19.0, 20.0), landed = H.ramp(t, 20.6, 21.0);
    put(GATE, uG, gateHtml(yes)); put(REC, uR, recHtml(landed));
    if (uG > 0) space.lines.push({ id: 'l-gate', from: 'docs@b', to: 'gate@t', p: H.ramp(t, 17.3, 18.2), accent: 'orange', pulses: [H.ramp(t, 17.4, 18.4)], label: t > 18.2 && t < 19.6 ? 'asks a person' : null, a: 1 - out });
    if (yes > 0) space.lines.push({ id: 'l-rec', from: 'gate#yes@r', to: 'record#new@l', p: H.ramp(t, 19.9, 20.7), accent: 'green', pulses: [H.ramp(t, 19.9, 20.8)], ring: H.ramp(t, 20.7, 21.6), a: 1 - out });

    // ---- act 4: what this makes possible ----
    act(4, 'What this makes possible', 24.6, 29.0);
    const lit = 1 + 29 * Math.pow(H.ramp(t, 26.0, 28.8), 1.6);
    const k5 = H.win(t, 29.2, 31.3, 0.5, 0.5);   // the closing line: the wall steps back so the words read
    if (t > 22.5) space.wall = { ...WALL, blocks: { ...WALL.blocks, lit }, time: t, a: H.ramp(t, 22.8, 24.6) * (1 - 0.8 * k5) };
    const kc = H.win(t, 25.4, 29.2, 0.5, 0.5);
    if (kc > 0) ui.callouts.push({ x: 96, y: 210, kicker: 'EXAMPLE VALUE · workers running', big: Math.round(lit * PER).toLocaleString('en-CA'), size: 150, sub: `${Math.floor(lit)} of 30 blocks of ${PER}`, accent: 'blue', a: kc, panel: true });
    const words = '[[ OWNER LINE ]]'.split(' ');   // OWNER: owner_lines.txt, word for word
    if (k5 > 0) ui.statement = { a: k5, words: words.map((w, i) => ({ w, a: H.ramp(t, 29.4 + i * 0.07, 29.7 + i * 0.07) })) };
    return { theme: 'light', bg: { kind: 'none' }, world: { space }, ui };
  }
  return { stateAt, CAPS };
}
