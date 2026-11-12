// Render named still frames from a list of states (storyboard / look development).
import { chromium } from 'playwright';
import fs from 'node:fs';
const file = process.argv[2] || 'boards.json';
const only = process.argv[3] ? process.argv[3].split(',') : null;
const boards = JSON.parse(fs.readFileSync(file));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log(m.type(), m.text().slice(0, 300)); });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(`http://127.0.0.1:${process.env.FILM_PORT || 3222}/`, { waitUntil: 'load' });
await p.waitForFunction('window.filmReady === true', null, { timeout: 180000 });
fs.mkdirSync('shots', { recursive: true });
for (const bd of boards) {
  if (only && !only.includes(bd.id)) continue;
  const t0 = Date.now();
  await p.evaluate(s => window.film.apply(s), bd);
  const t1 = Date.now();
  const t2 = Date.now();
  await p.screenshot({ path: `shots/${bd.id}.jpg`, quality: 92, type: 'jpeg', timeout: 240000 });
  console.log(bd.id, 'first', t1 - t0, 'ms; repeat', t2 - t1, 'ms; shot', Date.now() - t2, 'ms');
}
await b.close();
