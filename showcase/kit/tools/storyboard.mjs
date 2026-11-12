// Storyboard for owner sign-off: renders each board's second from the real timeline and writes a page to publish as an artifact.
//   node tools/storyboard.mjs --project <film dir> [--boards storyboard.json] [--no-render]
// storyboard.json: { "kicker", "title", "lede", "facts": ["<b>1920 × 1080</b> at 60 fps", …],
//   "boards": [{ "t": 12.5, "time": "0:10 – 0:20", "music": "Quiet intro", "title": "…", "camera": "…", "data": "…", "ui": "…", "narration": "…" }],
//   "real": ["…what is real…"], "asks": ["…what the owner must supply…"] }
// writes storyboard/index.html and storyboard/frames/NN.jpg; the song energy strip comes from assets/song-analysis.json if present.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openFilm, arg } from './lib/film-page.mjs';
const P = path.resolve(arg('project', '.')), SB = JSON.parse(fs.readFileSync(path.resolve(P, arg('boards', 'storyboard.json'))));
const OUT = path.join(P, 'storyboard'), FR = path.join(OUT, 'frames'); fs.mkdirSync(FR, { recursive: true });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
if (!process.argv.includes('--no-render')) {
  const { page, close, info } = await openFilm({ project: P }); const cdp = await page.context().newCDPSession(page);
  for (const [i, b] of SB.boards.entries()) { await page.evaluate(n => window.film.frame(n), Math.round(b.t * info.FPS));
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 }); const tmp = path.join(FR, `${i}.tmp.jpg`); fs.writeFileSync(tmp, Buffer.from(shot.data, 'base64'));
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', tmp, '-vf', 'scale=1440:-1', '-q:v', '4', path.join(FR, `${String(i + 1).padStart(2, '0')}.jpg`)]); fs.rmSync(tmp); console.log('board', i + 1, b.t, 's'); }
  await close();
}
let strip = '';
const an = path.join(P, 'assets/song-analysis.json');
if (fs.existsSync(an)) { const a = JSON.parse(fs.readFileSync(an)), r = a.rms_per_s, m = Math.max(...r);
  strip = `<div class="strip"><div class="kick" style="margin-bottom:10px">The song, second by second</div><div class="bars">${r.map(v => `<i style="height:${Math.max(4, Math.round(100 * v / m))}%"></i>`).join('')}</div><div class="ticks"><span>0:00</span><span>${Math.floor(a.duration / 60)}:${String(Math.round(a.duration % 60)).padStart(2, '0')}</span></div></div>`; }
const cards = SB.boards.map((b, i) => `<article class="board"><figure><img src="frames/${String(i + 1).padStart(2, '0')}.jpg" alt="Storyboard frame ${i + 1}: ${esc(b.title)}" loading="lazy" width="1440" height="810"></figure>
<div class="notes"><div class="meta"><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="tc">${esc(b.time)}</span><span class="mu">${esc(b.music || '')}</span></div><h3>${esc(b.title)}</h3><p class="cam">${esc(b.camera)}</p>
<dl><dt>Data on screen</dt><dd>${esc(b.data)}</dd><dt>Interface</dt><dd>${esc(b.ui)}</dd><dt>Narration</dt><dd class="vo">${esc(b.narration)}</dd></dl></div></article>`).join('\n');
const html = `<title>${esc(SB.pageTitle || SB.title + ' Storyboard')}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist+Mono:wght@500;600&display=swap">
<style>
/* Layout: a film strip read top to bottom; each board is a wide frame with its shot notes beside it. One dark look, the Agency 2026 night ground. */
:root { color-scheme: dark; --bg: #041B30; --line: rgba(255,255,255,.16); --fg: #FFFFFF; --soft: #A9C1D6; --cyan: #6FD6EC; --yellow: #F7D774; --blue: #0177CD; }
body { background: var(--bg); color: var(--fg); font: 400 16px/1.55 Inter, Arial, sans-serif; }
.wrap { max-width: 1500px; margin: 0 auto; padding-block: 40px 80px; padding-left: max(20px, env(safe-area-inset-left, 0px)); padding-right: max(20px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 44px; }
.kick { font: 600 13px "Geist Mono", Consolas, monospace; letter-spacing: .18em; text-transform: uppercase; color: var(--cyan); }
h1 { font: 800 clamp(34px, 5vw, 64px)/1.03 Inter, Arial, sans-serif; letter-spacing: -.03em; margin: 10px 0 14px; text-wrap: balance; }
h2 { font: 800 26px/1.15 Inter, Arial, sans-serif; margin: 0 0 12px; }
.lede { font-size: 19px; color: var(--soft); max-width: 68ch; margin: 0; }
.facts { display: flex; flex-wrap: wrap; gap: 10px 28px; font: 600 13px "Geist Mono", monospace; letter-spacing: .06em; color: var(--soft); margin-top: 18px; }
.facts b { color: var(--fg); font-weight: 600; }
.bars { display: flex; align-items: flex-end; gap: 1px; height: 84px; border-bottom: 1px solid var(--line); }
.bars i { flex: 1; background: linear-gradient(var(--cyan), var(--blue)); border-radius: 1px 1px 0 0; opacity: .85; }
.ticks { display: flex; justify-content: space-between; font: 500 11px "Geist Mono", monospace; color: var(--soft); margin-top: 2px; }
.boards { display: flex; flex-direction: column; gap: 34px; }
.board { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); gap: 26px; align-items: start; }
figure { margin: 0; } figure img { display: block; width: 100%; height: auto; border-radius: 6px; border: 1px solid var(--line); }
.notes { min-width: 0; }
.meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; font: 600 12.5px "Geist Mono", monospace; letter-spacing: .1em; text-transform: uppercase; }
.num { color: var(--bg); background: var(--cyan); border-radius: 3px; padding: 1px 7px; } .tc { font-variant-numeric: tabular-nums; } .mu { color: var(--yellow); }
h3 { font: 700 23px/1.2 Inter, Arial, sans-serif; margin: 10px 0 8px; text-wrap: balance; }
.cam { margin: 0 0 12px; max-width: 60ch; }
dl { margin: 0; display: grid; gap: 2px; } dt { font: 600 11.5px "Geist Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--soft); margin-top: 8px; }
dd { margin: 0; color: var(--soft); font-size: 15px; } dd.vo { color: var(--fg); font-size: 16px; border-left: 3px solid var(--cyan); padding-left: 12px; margin-top: 3px; }
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px 44px; }
.cols ul, .cols ol { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; color: var(--soft); max-width: 62ch; }
section { border-top: 1px solid var(--line); padding-top: 28px; }
:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
@media (max-width: 860px) { .board { grid-template-columns: 1fr; gap: 12px; } }
</style>
<div class="wrap">
<header><div class="kick">${esc(SB.kicker || 'Agency 2026 · Storyboard')}</div><h1>${esc(SB.title)}</h1><p class="lede">${esc(SB.lede || '')}</p>
<div class="facts">${(SB.facts || []).map(f => `<span>${f}</span>`).join('')}</div></header>
${strip}
<div class="boards">
${cards}
</div>
<section><div class="cols"><div><h2>What is real in these frames</h2><ul>${(SB.real || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
<div><h2>What I need from you</h2><ol>${(SB.asks || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div></div></section>
</div>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`wrote ${path.join(OUT, 'index.html')}: publish it with the Artifact tool (root: storyboard/, files: frames/*.jpg)`);
