#!/usr/bin/env node
// Agency Studio: pick a template, fill a form, preview, download. A thin web layer over scripts/make.mjs.
//   node app/server.mjs                 # http://localhost:8080 (PORT to change)
// Routes:
//   GET  /api/templates                every template (scanned from templates/**), its header comment, samples and thumbnail
//   GET  /api/sample?file=samples/...  a sample's content JSON (the starting point for a form)
//   GET  /api/tokens                   accent names, grounds, classification labels (for pickers)
//   POST /api/render {content}         render to a job folder: PNG previews, PDF, writing lint, QR check, fit faults
//   POST /api/pptx {job}               slides/deck jobs only: the editable PowerPoint
//   GET  /jobs/<id>/<file>[?download]  job files (jobs expire after 2 hours)
// No content leaves the server: rendering, lint and QR checks all run here. X-Forwarded-Email (SHELL gateway) is shown as "made by".
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(ROOT, 'app');
const JOBS = path.join(process.env.STUDIO_JOBS ?? path.join(os.tmpdir(), 'agency-studio'));
const PORT = +(process.env.PORT ?? 8080);
const TTL_MS = 2 * 3600e3;
fs.mkdirSync(JOBS, { recursive: true });

// make.mjs reads process.argv at import; give it a clean argv so a server flag is never taken as an option
const argv0 = process.argv; process.argv = [argv0[0], path.join(ROOT, 'scripts/make.mjs')];
const { make } = await import(pathToFileURL(path.join(ROOT, 'scripts/make.mjs')).href);
process.argv = argv0;
const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand/tokens/tokens.json'), 'utf8'));
const B = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/browser.mjs')).href);
// the shared Chromium can crash or be killed (memory pressure on a small instance): drop it and retry once with a fresh one
async function makeSafe(file, o) {
  try { return await make(file, o); }
  catch (e) { if (!/closed|crash|Target|disconnected/i.test(e.message)) throw e; console.error('browser lost, restarting:', e.message.split('\n')[0]); await B.close().catch(() => {}); return make(file, o); }
}

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

// ---------- template catalogue ----------
const FAMILY = { print: 'Print and PDF', digital: 'Digital and social', slides: 'Slides', onsite: 'On-site and large format', office: 'Office documents', video: 'Video stills' };
async function catalogue() {
  const samples = walk(path.join(ROOT, 'samples')).filter((f) => f.endsWith('.json')).map((f) => { try { return { f, d: JSON.parse(fs.readFileSync(f, 'utf8')) }; } catch { return null; } }).filter((x) => x && x.d.template);
  const out = [];
  for (const f of walk(path.join(ROOT, 'templates')).filter((f) => f.endsWith('.mjs') && !/\/lib\//.test(f)).sort()) {
    const name = rel(f).replace(/^templates\//, '').replace(/\.mjs$/, '');
    let meta = {};
    try { const t = await import(pathToFileURL(f).href + '?v=' + fs.statSync(f).mtimeMs); meta = typeof t.meta === 'function' ? t.meta({}) : t.meta; if (!t.render) continue; } catch (e) { continue; }
    const doc = fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.replace(/^\/\/ ?/, '')).join('\n');
    const mine = samples.filter((s) => s.d.template === name).map((s) => ({ file: rel(s.f), title: s.d.title ?? s.d.name ?? path.basename(s.f, '.json'), thumb: thumbFor(s.f) }));
    out.push({ name, family: name.split('/')[0], familyTitle: FAMILY[name.split('/')[0]] ?? name.split('/')[0], kind: meta.kind, size: meta.kind === 'pdf' ? meta.size ?? 'PDF' : `${meta.width}×${meta.height}`, about: meta.about ?? '', doc, samples: mine, pptx: name === 'slides/deck' });
  }
  return out;
}
let CAT = null, CAT_AT = 0;
const getCat = async () => { if (!CAT || Date.now() - CAT_AT > 60e3) { CAT = await catalogue(); CAT_AT = Date.now(); } return CAT; };

// thumbnails: app/thumbs/<sample>.jpg made by app/build-thumbs.mjs (docker build), else the first PNG in out/ if one exists
function thumbFor(sampleFile) {
  const base = path.basename(sampleFile, '.json'), fam = path.basename(path.dirname(sampleFile));
  const t = path.join(APP, 'thumbs', `${fam}--${base}.jpg`);
  if (fs.existsSync(t)) return '/thumbs/' + path.basename(t);
  const d = path.join(ROOT, 'out', fam);
  if (fs.existsSync(d)) { const hit = fs.readdirSync(d).filter((x) => x.startsWith(base) && x.endsWith('.png')).sort()[0]; if (hit) return `/out/${fam}/${hit}`; }
  return null;
}

// ---------- render ----------
const slug = (s) => String(s || 'piece').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'piece';
const PLACEHOLDER = /\b(sample|example|placeholder|tbc|fill:|lorem|your demo|replace with|speaker name|session title)\b/i;
function placeholders(o, p = '', out = []) {
  if (typeof o === 'string') { if (PLACEHOLDER.test(o) && !p.startsWith('$') && !/\.\$|^\$|template$|^name$|sample$/.test(p)) out.push({ field: p, text: o.slice(0, 80) }); }
  else if (Array.isArray(o)) o.forEach((v, i) => placeholders(v, `${p}[${i}]`, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!k.startsWith('$')) placeholders(v, p ? `${p}.${k}` : k, out);
  return out;
}
function urls(o, out = new Set()) {
  if (typeof o === 'string') { if (/^https?:\/\//.test(o)) out.add(o); }
  else if (Array.isArray(o)) o.forEach((v) => urls(v, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!k.startsWith('$')) urls(v, out);
  return out;
}
function qrRead(file) {
  try {
    const png = PNG.sync.read(fs.readFileSync(file));
    for (let i = 0; i < png.data.length; i += 4) { const a = png.data[i + 3] / 255; for (let c = 0; c < 3; c++) png.data[i + c] = Math.round(png.data[i + c] * a + 255 * (1 - a)); png.data[i + 3] = 255; }
    const r = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    return r ? r.data : null;
  } catch { return null; }
}

let QUEUE = Promise.resolve();   // one render at a time: the browser is shared and a deck is heavy
const serial = (fn) => { const p = QUEUE.then(fn, fn); QUEUE = p.catch(() => {}); return p; };

async function render(content, who) {
  const cat = await getCat();
  const tpl = cat.find((t) => t.name === content.template);
  if (!tpl) throw Object.assign(new Error(`unknown template "${content.template}"`), { code: 400 });
  const id = crypto.randomBytes(8).toString('hex'), dir = path.join(JOBS, id);
  fs.mkdirSync(dir, { recursive: true });
  const data = { ...content, name: slug(content.name ?? path.basename(tpl.name)) };
  const file = path.join(dir, 'content.json');
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
  fs.writeFileSync(path.join(dir, 'job.json'), JSON.stringify({ id, template: tpl.name, who: who ?? null, at: new Date().toISOString() }));
  const t0 = Date.now();
  const rep = await serial(() => makeSafe(file, { out: dir }));
  const famDir = path.join(dir, tpl.family);
  const files = fs.existsSync(famDir) ? fs.readdirSync(famDir).filter((f) => /\.(png|pdf)$/.test(f)).sort() : [];
  let lint = [];
  try { const r = await run('python3', [path.join(ROOT, 'scripts/lint/lint.py'), '--json', file], { cwd: ROOT }).catch((e) => e); lint = JSON.parse(r.stdout || '[]'); } catch { lint = []; }
  const want = [...urls(data)];
  const qr = [];
  if (want.length) for (const f of files.filter((f) => f.endsWith('.png'))) { const got = qrRead(path.join(famDir, f)); if (got) qr.push({ file: f, decodes: got, ok: want.includes(got) }); }
  return {
    id, template: tpl.name, ms: Date.now() - t0, faults: rep.faults, warnings: rep.warnings ?? [],
    lint: lint.map((x) => ({ severity: x.severity, rule: x.rule, field: x.field, text: x.text })),
    placeholders: placeholders(data), qr, qrExpected: want, pptx: tpl.pptx,
    files: files.map((f) => ({ name: f, kind: f.endsWith('.pdf') ? 'pdf' : 'png', url: `/jobs/${id}/${tpl.family}/${f}` })),
  };
}

async function pptx(id) {
  const dir = path.join(JOBS, id.replace(/[^a-f0-9]/g, ''));
  const file = path.join(dir, 'content.json');
  if (!fs.existsSync(file)) throw Object.assign(new Error('job expired: render again'), { code: 404 });
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (d.template !== 'slides/deck') throw Object.assign(new Error('PowerPoint is for slide decks only'), { code: 400 });
  const out = path.join(dir, 'slides', `${d.name}.pptx`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await serial(() => run('python3', [path.join(ROOT, 'scripts/pptx/build_deck.py'), file, out], { cwd: ROOT, timeout: 240e3 }));
  return { url: `/jobs/${id}/slides/${d.name}.pptx` };
}

// expire old jobs
setInterval(() => { for (const j of fs.readdirSync(JOBS)) { const p = path.join(JOBS, j); try { if (Date.now() - fs.statSync(p).mtimeMs > TTL_MS) fs.rmSync(p, { recursive: true, force: true }); } catch {} } }, 600e3).unref();

// ---------- http ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
function sendFile(res, f, download) {
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found'); }
  const h = { 'Content-Type': TYPES[path.extname(f)] ?? 'application/octet-stream', 'Cache-Control': f.startsWith(JOBS) ? 'no-store' : 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' };
  if (download) h['Content-Disposition'] = `attachment; filename="${path.basename(f)}"`;
  res.writeHead(200, h); fs.createReadStream(f).pipe(res);
}
const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
const within = (base, p) => { const f = path.resolve(base, '.' + path.posix.normalize('/' + p)); return f.startsWith(base + path.sep) || f === base ? f : null; };
async function body(req, limit = 12e6) {
  let n = 0; const chunks = [];
  for await (const c of req) { n += c.length; if (n > limit) throw Object.assign(new Error('content too large (12 MB limit; use smaller images)'), { code: 413 }); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

// static roots the UI and the generated pages need
const STATIC = [['/styles/', path.join(ROOT, 'styles')], ['/brand/', path.join(ROOT, 'brand')], ['/thumbs/', path.join(APP, 'thumbs')], ['/out/', path.join(ROOT, 'out')], ['/contact-sheets/', path.join(ROOT, 'contact-sheets')]];

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname), who = req.headers['x-forwarded-email'] ?? null;
  try {
    if (p === '/healthz') return json(res, 200, { ok: true });
    if (p === '/api/templates') return json(res, 200, { templates: await getCat(), who });
    if (p === '/api/tokens') return json(res, 200, { accents: [...T.spectrumNames, 'navy', 'maroon', 'rose', 'lime'], colors: T.color, grounds: Object.keys(T.grounds).filter((k) => !k.startsWith('$')),
      classifications: ['UNCLASSIFIED', 'PROTECTED A', 'PROTECTED B'], event: T.event });
    if (p === '/api/sample') { const f = within(path.join(ROOT, 'samples'), (u.searchParams.get('file') ?? '').replace(/^samples\//, '')); if (!f || !f.endsWith('.json')) return json(res, 400, { error: 'bad sample' }); return sendFile(res, f); }
    if (p === '/api/render' && req.method === 'POST') { const b = await body(req); if (!b.content?.template) return json(res, 400, { error: 'content.template missing' }); return json(res, 200, await render(b.content, who)); }
    if (p === '/api/pptx' && req.method === 'POST') { const b = await body(req); return json(res, 200, await pptx(String(b.job ?? ''))); }
    if (p.startsWith('/jobs/')) { const f = within(JOBS, p.slice(6)); return f ? sendFile(res, f, u.searchParams.has('download')) : json(res, 400, { error: 'bad path' }); }
    for (const [pre, dir] of STATIC) if (p.startsWith(pre)) { const f = within(dir, p.slice(pre.length)); return f ? sendFile(res, f) : json(res, 400, { error: 'bad path' }); }
    const f = within(path.join(APP, 'public'), p === '/' ? 'index.html' : p.slice(1));
    return f ? sendFile(res, f) : json(res, 404, { error: 'not found' });
  } catch (e) {
    console.error(new Date().toISOString(), p, e.message);
    return json(res, e.code && e.code >= 400 && e.code < 600 ? e.code : 500, { error: e.message.split('\n')[0] });
  }
});
server.listen(PORT, '0.0.0.0', () => console.log(`Agency Studio on http://0.0.0.0:${PORT}  (jobs in ${JOBS})`));
