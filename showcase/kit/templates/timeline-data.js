// Starter timeline: DATA film (no app screens, no map): a kinetic data story for a programme, a study or a result.
// Runs as soon as the folder exists: title card, one big number, a ranked bar chart, a re-drawn panel (a table), one statement,
// and the end card. Every value below is an EXAMPLE VALUE: replace each one with a figure recorded in NOTES.md (source, method, date,
// the misleading-truth check) before anything is rendered for review.
// Ground: "board" (white) in a light film; "night" in a dark one; "spectrum" at most once, for the one line people should remember.
// stateAt(t) must be pure: the same t always gives the same picture (no Date, no Math.random, no state kept between calls).
export const DUR = 14, FPS = 60;   // set DUR to the music length, and keep film.config.json "dur" equal to it

export async function createTimeline({ config, timing, helpers: H }) {
  const script = await fetch('/narration/script.json').then(r => r.json());
  const VO = Object.fromEntries(script.lines.map(l => [l.id, l.at]));
  const CAPS = H.captionsFrom(VO, timing);
  const EV = (await fetch('/brand/tokens/tokens.json').then(r => r.json())).event;   // event facts: one source with every other medium
  // EXAMPLE VALUES: replace from NOTES.md
  const BIG = { n: 1234, kicker: 'Example value · source in NOTES.md', sub: 'what the number counts, in plain words' };
  const BARS = [{ label: 'Example A', v: 85 }, { label: 'Example B', v: 55 }, { label: 'Example C', v: 45 }, { label: 'Alberta (example)', v: 7, hl: true }];   // ranked: largest first
  const ROWS = [['Measure', 'Before', 'After'], ['Example measure 1', '12 days', '3 days'], ['Example measure 2', '40%', '85%']];
  const STATEMENT = 'One plain sentence the owner wants people to remember.';   // OWNER: use owner_lines.txt word for word

  function stateAt(t) {
    const ui = { chrome: H.ramp(t, 0.4, 1.4), bandTitle: config.bandTitle, credits: 'Example values: replace before review', caption: H.captionAt(CAPS, t),
      fade: Math.max(1 - H.ramp(t, 0, 0.9), H.ramp(t, DUR - 0.8, DUR)), callouts: [], panels: [] };
    let bg = { kind: 'board' }, theme;
    const k1 = H.win(t, 0.8, 3.4, 1.0, 0.7);
    if (k1 > 0) ui.card = { kind: 'title', a: k1, traces: H.ramp(t, 1.0, 2.4), dy: (1 - H.ramp(t, 1.2, 2.4)) * 30, kicker: `${EV.name} · Showcase`,
      lines: [config.title.replace(/^#\d+\s*/, '')], sub: 'A data story: replace this card from the storyboard.' };
    const k2 = H.win(t, 3.4, 6.4, 0.6, 0.6);
    if (k2 > 0) ui.callouts.push({ x: 960, y: 330, align: 'center', kicker: BIG.kicker, big: H.count(t, BIG.n, 3.5, 1.4), size: 200, sub: BIG.sub, accent: 'cyan', a: k2, dy: (1 - H.ramp(t, 3.4, 4.2)) * 26 });
    const k3 = H.win(t, 6.4, 9.4, 0.6, 0.6);
    if (k3 > 0) ui.callouts.push({ x: 960, y: 250, align: 'center', barWidth: 620, scale: 1.6, kicker: 'Example comparison · one scale', sub: 'Ranked, with the highlighted row in context', accent: 'blue', a: k3,
      bars: BARS.map((b, i) => ({ ...b, g: H.ramp(t, 6.6 + i * 0.18, 7.4 + i * 0.18) })), max: Math.max(...BARS.map(b => b.v)) });
    const k4 = H.win(t, 9.4, 11.6, 0.6, 0.5);
    if (k4 > 0) ui.panels.push({ x: 460, y: 300, w: 1000, h: 330, a: k4, dy: (1 - H.ramp(t, 9.4, 10.2)) * 24, title: 'Example table (re-drawn in the Agency look)',
      html: `<table style="font-size:32px">${ROWS.map((r, i) => `<tr>${r.map(c => (i ? `<td style="padding:16px 6px">${c}</td>` : `<th style="font-size:22px;padding:8px 6px">${c}</th>`)).join('')}</tr>`).join('')}</table>` });
    const k5 = H.win(t, 11.4, 13.0, 0.4, 0.5);
    if (k5 > 0) { bg = { kind: 'spectrum' }; theme = 'dark'; const words = STATEMENT.split(' ');
      ui.statement = { a: k5, words: words.map((w, i) => ({ w, a: H.ramp(t, 11.5 + i * 0.07, 11.8 + i * 0.07) })) }; }
    const k6 = H.ramp(t, 12.9, 13.3);
    if (k6 > 0) ui.card = { kind: 'end', a: k6, traces: 1, dates: `${EV.dates} · ${EV.cities}`, kicker: `${EV.name} · Showcase`, title: config.title.replace(/^#\d+\s*/, ''), sources: ['Sources: every figure is listed in NOTES.md'] };
    return { theme, bg, ui };
  }
  return { stateAt, CAPS };
}
