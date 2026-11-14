// Screenshots of named states of the real app, plus the exact boxes of chosen UI elements in each, for plates and spotlights.
//   node tools/capture-states.mjs --project <film dir> [--script capture/states.script.json]
// script: { "url": "...", "viewport": [1920, 1080], "scale": 1, "webgl": true, "settle": 1500,
//           "states": [{ "name": "layers", "steps": [...], "marks": { "solve": "role=button[name='Solve']" }, "fresh": false }] }
// writes capture/<name>.png and capture/states.json { name: { file, w, h, marks } }. Use scale 2 for crisp re-framing (a cut to a closer framing; no slow push-ins).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { arg, GL_ARGS } from './lib/film-page.mjs';
import { runSteps, measure } from './lib/steps.mjs';
const P = path.resolve(arg('project', '.')), S = JSON.parse(fs.readFileSync(path.resolve(P, arg('script', 'capture/states.script.json'))));
const [vw, vh] = S.viewport || [1920, 1080], scale = S.scale || 1;
const b = await chromium.launch({ args: S.webgl === false ? [] : GL_ARGS });
const newPage = async () => { const p = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: scale }); p.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0, 200))); await p.goto(S.url, { waitUntil: 'load' }); await p.waitForTimeout(S.settle ?? 1500); return p; };
let page = await newPage(); const outFile = path.join(P, 'capture/states.json');
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile)) : {};
for (const st of S.states) {
  if (st.fresh) { await page.close(); page = await newPage(); }
  await runSteps(page, st.steps, (k, v) => console.log(`  ${st.name}: ${k} ${typeof v === 'string' ? v : JSON.stringify(v)}`));
  await page.waitForTimeout(st.settle ?? 600);
  const file = `capture/${st.name}.png`; await page.screenshot({ path: path.join(P, file), fullPage: !!st.fullPage });
  const m = await measure(page, st.marks); for (const v of Object.values(m)) if (v) for (const k of Object.keys(v)) v[k] *= scale;
  out[st.name] = { file, w: vw * scale, h: vh * scale, scale, marks: m, url: page.url(), at: new Date().toISOString() };
  console.log('wrote', file, Object.keys(m).length ? `marks: ${Object.entries(m).map(([k, v]) => `${k}${v ? '' : ' (missing)'}`).join(', ')}` : '');
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1)); await b.close();
