// Cost profile in CPU-seconds per frame (independent of how busy the machine is).
//   node tools/profile.mjs [url] [a|b]
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
const url = process.argv[2] || `http://127.0.0.1:${process.env.FILM_PORT || 3222}/`;
const tag = '--film-bench=' + process.pid;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', tag] });
// CPU seconds used so far by this browser and all its child processes (GPU, renderer, network)
const cpu = () => { const rows = execSync('ps -ww -u $(id -u) -o pid=,ppid=,cputimes=,args=', { encoding: 'utf8', maxBuffer: 1 << 26 }).trim().split('\n').map(l => { const m = l.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/); return m ? { pid: m[1], ppid: m[2], c: +m[3], args: m[4] } : null; }).filter(Boolean);
  const root = rows.find(r => r.args.includes(tag) && !r.args.includes('--type=')); if (!root) return 0; const set = new Set([root.pid]); let grew = true;
  while (grew) { grew = false; for (const r of rows) if (set.has(r.ppid) && !set.has(r.pid)) { set.add(r.pid); grew = true; } }
  return rows.filter(r => set.has(r.pid)).reduce((s, r) => s + r.c, 0); };
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(url, { waitUntil: 'load' });
await p.waitForFunction('window.filmReady === true', null, { timeout: 900000 });
const cdp = await p.context().newCDPSession(p);
const shot = () => cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
const time = async (label, f0, n, pre) => { if (pre) await p.evaluate(pre); await p.evaluate(f => window.film.frame(f), f0); await shot();
  const c0 = cpu(), w0 = Date.now(); for (let i = 1; i <= n; i++) { await p.evaluate(f => window.film.frame(f), f0 + i); await shot(); }
  console.log(label.padEnd(36), ((cpu() - c0) / n).toFixed(1), 'cpu-s/frame', ((Date.now() - w0) / n / 1000).toFixed(1), 's wall'); };
const only = process.argv[3];
if (!only || only === 'a') { await time('cables globe (t=16)', 960, 2); await time('layers globe (t=80)', 4800, 2); }
if (!only || only === 'b') { await time('chase (terrain, pitch)', 6500, 2); await time('chase, no hillshade', 6500, 2, "window.film.M.map.setLayoutProperty('hill','visibility','none')"); await time('chase, no terrain', 6500, 2, "window.film.M.terrain = () => {}; window.film.M.map.setTerrain(null)"); }
await b.close();
