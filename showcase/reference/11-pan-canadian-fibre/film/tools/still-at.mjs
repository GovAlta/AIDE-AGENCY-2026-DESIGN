// One frame at a given second, for a layout check: node tools/still-at.mjs 27 out/check-27.jpg
import { chromium } from 'playwright';
const [t, out] = [+process.argv[2], process.argv[3]];
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(`http://127.0.0.1:${process.env.FILM_PORT || 3222}/`, { waitUntil: 'load' }); await p.waitForFunction('window.filmReady === true', null, { timeout: 600000 });
await p.evaluate(n => window.film.frame(n), Math.round(t * 60));
await p.screenshot({ path: out, type: 'jpeg', quality: 90 }); await b.close(); console.log('wrote', out);
