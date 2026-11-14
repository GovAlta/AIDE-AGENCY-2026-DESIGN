// Starter timeline: ARCHITECTURE EXPLAINER on the network stage, for people who are not engineers.
// The architecture itself is data: film.config.json "network" (zones, nodes, edges; kit web/modules/network-stage.js).
// Four acts a layperson can follow. Keep the order; replace every EXAMPLE word with the product's own plain words.
//   1  What it is         one plain sentence and the people it serves
//   2  Architecture       zones appear one at a time, each named in plain words; build up, then pull back
//   3  Integrations/flows one request followed end to end (numbered steps, permission gates, the audit record), then the same idea again
//   4  Opportunities      scale-out (containers spawn), many requests at once (the network effect), the owner's closing line, end card
// Legibility rules (web/modules/README.md): one new idea per shot; name every part before it moves; never more than about seven
// labelled things on screen; point the camera at what the narration is about.
// Every name, scope and ledger line below is an EXAMPLE: use real ones recorded in NOTES.md. stateAt(t) must be pure.
export const DUR = 32, FPS = 60;   // set DUR to the music length, and keep film.config.json "dur" equal to it

export async function createTimeline({ config, timing, stage, helpers: H }) {
  const script = await fetch('/narration/script.json').then(r => r.json());
  const VO = Object.fromEntries(script.lines.map(l => [l.id, l.at]));
  const CAPS = H.captionsFrom(VO, timing);
  const EV = (await fetch('/brand/tokens/tokens.json').then(r => r.json())).event;
  const NAME = config.title.replace(/^#\d+\s*/, '');
  const go = (t, a, b, u0 = 0, u1 = 1) => H.lerp(u0, u1, H.ss(H.clamp((t - a) / (b - a))));   // a packet from u0 to u1 between seconds a and b

  // ---- camera: stage.frame(ids, pad, tilt, rot) fits nodes or zones in the safe area as seen at that tilt; H.track joins the keys ----
  const K = (t, c, dx = 0) => [t, c.x, c.y, c.zoom, c.tilt, c.rot, c.ox + dx, c.oy], f = (ids, pad, tilt, rot) => stage.frame(ids, pad, tilt, rot);
  const BOARD = ['people', 'core', 'systems', 'audit', 'cloud'];
  const CAM = H.track(H.holdKeys([
    K(0, f(['people', 'core'], 1.5)), K(5.4, f(['people', 'core'], 1.35)),                                  // act 1: the people and the assistant
    K(7.0, f(['core', 'systems'], 1.12)), K(8.8, f(['core', 'audit'], 1.2)),                                 // act 2: one zone at a time
    K(10.4, f(['core', 'cloud', 'audit'], 1.1)), K(12.6, f(BOARD, 0.94, 50, -6)),                             //        then the whole board, tilted
    K(15.0, f(BOARD, 0.92, 46, -3)), K(18.0, f(BOARD, 0.9, 48, 3)),                                       // act 3: the whole board while the request travels
    K(20.8, f(BOARD, 0.94, 52, 6)),
    K(22.3, stage.spawnFrame('cloud', 1200, 12, 1.5, 28), 200), K(23.6, stage.spawnFrame('cloud', 1200, 12, 1.5, 28), 200),   // act 4: twelve workers, close
    K(25.8, f(['cloud'], 1.5, 40), 220),                                                                    //        then the pull-back: more than a thousand
    K(27.6, f(BOARD, 1.08, 56, -8), 0), K(DUR, f(BOARD, 1.14, 58, -4), 0),                                    //        the network effect
  ]));

  // ---- act 3: the flow. EXAMPLE scopes, names and ledger lines ----
  const LEDGER = [   // t = when the line is written (the moment a gate decides)
    { t: 16.0, result: 'allow', text: 'analyst · read · Documents/policy · allowed' },
    { t: 17.6, result: 'deny', text: 'agent · send · Mail · denied (no consent)' },
    { t: 19.0, result: 'ask', text: 'agent · write · Code/main · asked manager' },
    { t: 20.0, result: 'allow', text: 'manager approved · write · Code/main' },
  ];
  const gU = id => stage.gateU(id);

  function stateAt(t) {
    const [x, y, zoom, tilt, rot, ox, oy0] = CAM(t), oy = oy0 - 150 * H.ramp(t, 27.0, 28.0);   // the board rises to make room for the closing line
    const net = { cam: { x, y, zoom, tilt, rot, ox, oy }, time: t, zonesA: {}, nodes: {}, edges: {}, packets: [], gates: {}, steps: [], notes: [] };
    const ui = { chrome: H.ramp(t, 0.4, 1.4), bandTitle: config.bandTitle, credits: 'Example architecture: replace before review', caption: H.captionAt(CAPS, t),
      fade: Math.max(1 - H.ramp(t, 0, 0.9), H.ramp(t, DUR - 0.8, DUR)), callouts: [], panels: [] };
    let theme, bg = { kind: 'board' };
    const act = (n, title, a, b) => { const k = H.win(t, a, b, 0.5, 0.4); if (k > 0) ui.callouts.push({ x: 960, y: 118, align: 'center', kicker: `${n} · ${title}`, accent: 'blue', a: k }); };

    // ---- what is on the board, and when (name every part before it moves) ----
    const zoneIn = { people: 3.2, core: 3.6, systems: 6.0, audit: 7.8, cloud: 9.4 };
    for (const [id, t0] of Object.entries(zoneIn)) net.zonesA[id] = H.ramp(t, t0, t0 + 0.7);
    const nodeIn = { analyst: 3.5, manager: 3.7, assistant: 3.9, planner: 4.3, docs: 6.3, mail: 6.5, tickets: 6.7, code: 6.9, ledger: 8.0, runner: 9.7 };
    for (const [id, t0] of Object.entries(nodeIn)) net.nodes[id] = { a: H.ramp(t, t0, t0 + 0.5) };
    const edgeIn = { ask: 4.4, plan: 4.8, read: 7.0, send: 7.15, file: 7.3, log: 8.4, start: 10.0, push: 10.4, approve: 10.9 };
    for (const [id, t0] of Object.entries(edgeIn)) net.edges[id] = { p: H.ramp(t, t0, t0 + 0.9) };

    // ---- act 1: what it is ----
    const k1 = H.win(t, 0.6, 3.1, 0.9, 0.6);
    if (k1 > 0) ui.card = { kind: 'title', a: k1, traces: H.ramp(t, 0.8, 2.2), dy: (1 - H.ramp(t, 1.0, 2.2)) * 30, kicker: `${EV.name} · Showcase`, lines: [NAME], sub: 'EXAMPLE: one plain sentence that says what it is.' };
    act(1, 'What it is', 3.3, 5.5);
    net.notes.push({ node: 'assistant', side: 'r', text: 'One assistant for everyone', sub: 'EXAMPLE: it listens, answers and gets work done', a: H.win(t, 4.2, 5.5, 0.4, 0.3) });

    // ---- act 2: architecture, one zone at a time ----
    act(2, 'Architecture', 5.7, 12.6);
    net.notes.push({ node: 'tickets', side: 'b', text: 'The systems people already use', sub: 'EXAMPLE: it connects to them, it does not replace them', a: H.win(t, 6.6, 7.9, 0.4, 0.3) });
    net.notes.push({ node: 'ledger', side: 'l', text: 'Everything it does is written down', a: H.win(t, 8.3, 9.5, 0.4, 0.3) });
    net.notes.push({ node: 'runner', side: 't', text: 'Heavy work runs in sealed containers', a: H.win(t, 9.9, 11.2, 0.4, 0.3) });

    // ---- act 3: one request, end to end ----
    act(3, 'One request, end to end', 12.9, 21.2);
    net.legend = H.win(t, 13.2, 20.6, 0.6, 0.5);
    const P = (o) => net.packets.push(o), pulse = (id, t0) => { const b = H.bump(t, t0, 1.2); if (b > 0) net.nodes[id] = { ...net.nodes[id], pulse: b, state: 'active' }; };
    if (t >= 13.2 && t < 14.3) P({ edge: 'ask', u: go(t, 13.2, 14.3), kind: 'human', label: 'Find the policy', accent: 'blue' });
    if (t >= 14.3 && t < 15.0) P({ edge: 'plan', u: go(t, 14.3, 15.0), kind: 'request', accent: 'purple' });
    pulse('assistant', 14.3); pulse('planner', 15.0);
    //  read: the agent stops at the gate, the gate allows, the agent goes on
    if (t >= 15.0 && t < 16.9) P({ edge: 'read', u: t < 16.0 ? go(t, 15.0, 15.7, 0, gU('read') - 0.03) : go(t, 16.1, 16.9, gU('read') - 0.03, 1), kind: 'agent', label: 'Agent', accent: 'cyan' });
    net.gates.read = { open: H.ramp(t, 15.8, 16.3), result: 'allow' }; pulse('docs', 16.9);
    //  send: denied, the agent turns back
    if (t >= 16.7 && t < 18.3) P({ edge: 'send', u: t < 17.6 ? go(t, 16.7, 17.4, 0, gU('send') - 0.03) : go(t, 17.7, 18.3, gU('send') - 0.03, 0), kind: 'agent', label: 'Agent', accent: 'cyan' });
    net.gates.send = { open: H.ramp(t, 17.4, 17.9) * (1 - H.ramp(t, 20.6, 21.2)), result: 'deny' };
    //  push: the gate asks a person; the manager approves; the work goes through
    if (t >= 18.2 && t < 20.8) P({ edge: 'push', u: t < 20.0 ? go(t, 18.2, 18.9, 0, gU('push') - 0.04) : go(t, 20.1, 20.8, gU('push') - 0.04, 1), kind: 'agent', label: 'Agent', accent: 'green' });
    net.gates.push = { open: H.ramp(t, 18.8, 19.3), result: t < 19.95 ? 'ask' : 'allow', ask: { to: 'manager', p: H.ramp(t, 18.9, 19.6) * (1 - H.ramp(t, 19.9, 20.2)) } };
    if (t >= 19.3 && t < 20.0) P({ edge: 'approve', u: go(t, 19.3, 20.0), kind: 'human', label: 'Approved', accent: 'blue' });
    pulse('manager', 19.2); pulse('code', 20.8);
    [['ask', 0.5, 13.3], ['read', 0.2, 15.1], ['push', 0.25, 18.3]].forEach(([edge, u, t0], i) => net.steps.push({ n: i + 1, edge, u, a: H.win(t, t0, 21.0, 0.3, 0.4) }));
    net.ledger = { lines: LEDGER, shown: LEDGER.reduce((s, l) => s + H.ramp(t, l.t, l.t + 0.45), 0) };
    if (t > 15.4 && t < 21.2) net.focus = t < 16.9 ? ['planner', 'docs', 'ledger', 'read'] : t < 18.3 ? ['planner', 'mail', 'ledger', 'send'] : ['runner', 'code', 'manager', 'planner', 'ledger', 'push', 'approve'];

    // ---- act 4: opportunities ----
    act(4, 'What this makes possible', 21.6, 27.0);
    const N = 1200, cnt = t < 23.6 ? H.lerp(0, 12, H.ramp(t, 21.9, 23.3)) : 12 + (N - 12) * Math.pow(H.ramp(t, 23.6, 26.2), 2.2);
    if (t > 21.6) net.spawn = { zone: 'cloud', of: N, count: cnt, accent: 'green' };
    const solo = H.win(t, 21.6, 26.9, 0.7, 0.7);   // zoom to what the narration is about: everything but the workers steps back
    if (solo > 0) { for (const id of Object.keys(net.zonesA)) if (id !== 'cloud') net.zonesA[id] *= 1 - 0.85 * solo;
      for (const id of Object.keys(net.nodes)) if (id !== 'runner') net.nodes[id] = { ...net.nodes[id], a: (net.nodes[id].a ?? 1) * (1 - 0.9 * solo) };
      for (const id of Object.keys(net.edges)) net.edges[id] = { ...net.edges[id], a: 1 - 0.9 * solo }; }
    const kc = H.win(t, 22.4, 27.0, 0.5, 0.5);
    if (kc > 0) ui.callouts.push({ x: 96, y: 380, kicker: 'EXAMPLE VALUE · workers running', big: Math.round(cnt).toLocaleString('en-CA'), size: 150, sub: 'each in its own sealed container', accent: 'green', a: kc, panel: true });
    if (t > 26.6) { theme = 'dark'; bg = { kind: 'night' }; net.packets.push(...stage.swarm(t, { per: 3, speed: 260 }).map(p => ({ ...p, a: p.a * H.ramp(t, 26.8, 27.6) }))); }
    const k5 = H.win(t, 27.6, 29.9, 0.5, 0.5), words = '[[ OWNER LINE ]]'.split(' ');   // OWNER: owner_lines.txt, word for word
    if (k5 > 0) ui.statement = { a: k5, words: words.map((w, i) => ({ w, a: H.ramp(t, 27.8 + i * 0.07, 28.1 + i * 0.07) })) };
    const k6 = H.ramp(t, 30.0, 30.5);
    if (k6 > 0) { ui.card = { kind: 'end', a: k6, traces: 1, dates: `${EV.dates} · ${EV.cities}`, kicker: `${EV.name} · Showcase`, title: NAME, sources: ['Sources: every name, scope and figure is listed in NOTES.md'] }; net.hide = k6 >= 1; }
    return { theme, bg, world: { net }, ui };
  }
  return { stateAt, CAPS };
}
