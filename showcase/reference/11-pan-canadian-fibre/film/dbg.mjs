import { chromium } from 'playwright';
const url = process.argv[2] || `http://127.0.0.1:${process.env.FILM_PORT || 3222}/`;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', ...(process.argv[3] ? process.argv[3].split(' ') : [])] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(url, { waitUntil: 'load' });
await p.waitForFunction('window.filmReady === true', null, { timeout: 300000 });
const cdp = await p.context().newCDPSession(p);
const time = async (label, f0, n, pre) => { if (pre) await p.evaluate(pre); let tot = 0;
  for (let i = 0; i < n + 1; i++) { const t = Date.now(); await p.evaluate(f => window.film.frame(f), f0 + i); const a = Date.now() - t; const t2 = Date.now(); await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }); if (i > 0) tot += Date.now() - t; }
  console.log(label.padEnd(34), (tot / n / 1000).toFixed(2), 's/frame'); };
await time('chase (terrain, pitch)', 6500, 4);
await time('chase, no hillshade', 6500, 4, "window.film.M.map.setLayoutProperty('hill','visibility','none')");
await time('chase, no terrain', 6500, 4, "window.film.M.terrain = () => {}; window.film.M.map.setTerrain(null)");
await time('globe layers scene (t=80)', 4800, 4);
await time('globe cables (t=16)', 960, 4);
await time('finale (t=176)', 10560, 4);
await b.close();
