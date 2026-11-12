// Renders chosen seconds as JPEGs for a layout check or a storyboard (one local browser, so keep the list short).
//   node tools/still-at.mjs --project <film dir> --times 0,12.5,40 [--out <dir>]
import fs from 'node:fs';
import path from 'node:path';
import { openFilm, arg } from './lib/film-page.mjs';
const project = path.resolve(arg('project', '.')), out = path.resolve(project, arg('out', 'out/stills'));
fs.mkdirSync(out, { recursive: true });
const { page, close, info } = await openFilm({ project });
const cdp = await page.context().newCDPSession(page);
for (const t of arg('times', '0').split(',').map(Number)) {
  await page.evaluate(n => window.film.frame(n), Math.round(t * info.FPS));
  const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  const file = path.join(out, `t${t.toFixed(2).padStart(7, '0')}.jpg`); fs.writeFileSync(file, Buffer.from(shot.data, 'base64')); console.log('wrote', file);
}
await close();
