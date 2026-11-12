// Records one continuous interaction with the real app at 1920x1080, then turns it into an exact image sequence for a plate.
//   node tools/capture-video.mjs --project <film dir> --name solve [--script capture/solve.script.json] [--fps 30]
// script: { "url", "viewport", "webgl", "settle", "steps": [...], "marks": {...} } (same step language as capture-states)
// writes capture/<name>.webm, capture/<name>/f00001.jpg… and capture/<name>.json { fps, count, w, h, events: [{ t, step }], marks }
// In the timeline: plates: [{ id, seq: { pattern: 'capture/<name>/f%05d.jpg', fps, count, at: <seconds into the recording> }, w, h }]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { arg, GL_ARGS } from './lib/film-page.mjs';
import { runSteps, measure } from './lib/steps.mjs';
const P = path.resolve(arg('project', '.')), name = arg('name', 'rec'), fps = +arg('fps', 30);
const S = JSON.parse(fs.readFileSync(path.resolve(P, arg('script', `capture/${name}.script.json`))));
const [vw, vh] = S.viewport || [1920, 1080], tmp = path.join(P, 'capture', `.${name}-raw`);
fs.rmSync(tmp, { recursive: true, force: true });
const b = await chromium.launch({ args: S.webgl === false ? [] : GL_ARGS });
const ctx = await b.newContext({ viewport: { width: vw, height: vh }, recordVideo: { dir: tmp, size: { width: vw, height: vh } } });
const page = await ctx.newPage(); const t0 = Date.now(), events = [];
await page.goto(S.url, { waitUntil: 'load' }); await page.waitForTimeout(S.settle ?? 1500);
await runSteps(page, S.steps, (k, v) => events.push({ t: (Date.now() - t0) / 1000, step: { [k]: v } }));
await page.waitForTimeout(S.tail ?? 800);
const marks = await measure(page, S.marks);
const vpath = await page.video().path(); await ctx.close(); await b.close();
const webm = path.join(P, 'capture', `${name}.webm`); fs.renameSync(vpath, webm); fs.rmSync(tmp, { recursive: true, force: true });
const dir = path.join(P, 'capture', name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
execFileSync('nice', ['ffmpeg', '-loglevel', 'error', '-y', '-i', webm, '-vf', `fps=${fps}`, '-q:v', '2', path.join(dir, 'f%05d.jpg')]);
const count = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
fs.writeFileSync(path.join(P, 'capture', `${name}.json`), JSON.stringify({ fps, count, w: vw, h: vh, pattern: `capture/${name}/f%05d.jpg`, events, marks }, null, 1));
console.log(`wrote ${webm} and ${count} frames at ${fps} fps; ${events.length} steps logged (times are seconds into the recording)`);
