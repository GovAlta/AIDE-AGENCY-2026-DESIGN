#!/usr/bin/env node
// Agency 2026 show server. Two jobs:
//   1. Laptop mode: serves the repo so the stage and control windows can load the agenda, slides, video and sound.
//   2. Event-code mode: stage and control on different machines (venue LAN, or the published app behind SHELL SSO). The server holds
//      each show's state, applies commands from the control (PIN required) and sends every change to every screen over Server-Sent Events.
//
//   node show/server.mjs [--port 8765] [--host 127.0.0.1|0.0.0.0] [--agenda show/samples/agency-2026.json] [--memory]
//   DATABASE_URL=postgres://...  node show/server.mjs     # shows in Postgres (several Cloud Run instances); else in memory
//   SHOW_TABLE_PREFIX (default agency_show_), SHOW_ASSETS_DIR (default <tmp>/agency-show-assets), PORT (Cloud Run sets 8080)
//
// API (all JSON): GET /api/time · GET /api/agendas · GET /api/voice (voiced announcements) · POST /api/shows {agendaPath | agenda} -> {code, pin, stage, control}
//   GET /api/shows/:code · GET /api/shows/:code/agenda · GET /api/shows/:code/events (SSE: snapshot first, then state/status/log/hb)
//   GET /api/shows/:code/state?since=rev&wait=25 (long-poll fallback) · POST /api/shows/:code/cmd {cmd, args, baseRev} + X-Show-Pin
//   POST /api/shows/:code/status (the program stage's report) · POST /api/shows/:code/assets (zip, X-Show-Pin) · GET /api/shows/:code/log (X-Show-Pin)
// Pages: / (new show, join), /stage?code=, /control?code=&pin=. No dependencies in memory mode; `pg` (show/package.json) for Postgres.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as Eng from './lib/engine.js';
import { MemoryStore, PgStore, TTL_MS } from './server/store.mjs';
import { unzip } from './server/unzip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const a = process.argv.slice(2), val = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const PORT = +val('port', process.env.PORT || 8765), HOST = val('host', process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const AGENDA = val('agenda', 'show/samples/agency-2026.json');
const ASSETS = process.env.SHOW_ASSETS_DIR || path.join(os.tmpdir(), 'agency-show-assets');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg',
  '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.vtt': 'text/vtt' };

// --memory (or SHOW_STORE=memory) keeps shows in memory even when DATABASE_URL is set (the SHELL sandbox exports one in every shell)
const useMemory = a.includes('--memory') || process.env.SHOW_STORE === 'memory';
const store = process.env.DATABASE_URL && !useMemory ? new PgStore(process.env.DATABASE_URL, process.env.SHOW_TABLE_PREFIX || 'agency_show_') : new MemoryStore();

// ---------- codes, PINs, rate limits ----------
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';          // no 0/O, 1/I/L
const newCode = () => { let s = ''; for (let i = 0; i < 6; i++) s += ALPHA[crypto.randomInt(ALPHA.length)]; return s.slice(0, 3) + '-' + s.slice(3); };
const normCode = (c) => { const x = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return x.length === 6 ? x.slice(0, 3) + '-' + x.slice(3) : null; };
const hashPin = (pin, salt = crypto.randomBytes(12).toString('hex')) => `${salt}:${crypto.scryptSync(String(pin), salt, 32).toString('hex')}`;
const pinOk = (pin, h) => { if (!h || !pin) return false; const [salt, x] = h.split(':'); const y = crypto.scryptSync(String(pin), salt, 32).toString('hex'); return crypto.timingSafeEqual(Buffer.from(x, 'hex'), Buffer.from(y, 'hex')); };
const buckets = new Map();
function allow(key, rate, burst) {   // token bucket
  const t = Date.now(), b = buckets.get(key) || { n: burst, t }; b.n = Math.min(burst, b.n + ((t - b.t) / 1000) * rate); b.t = t;
  if (b.n < 1) { buckets.set(key, b); return false; } b.n -= 1; buckets.set(key, b); return true;
}

// ---------- fan-out: SSE clients and long-poll waiters per show, on this instance ----------
const clients = new Map(), waiters = new Map(), recent = new Map(), lastStatus = new Map();
const wire = (m, snapshot) => ({ rev: m.rev, serverTime: Date.now(), state: m.state, cmd: snapshot ? null : m.last?.cmd ?? null, args: snapshot ? null : m.last?.args ?? null,
  events: snapshot ? [] : m.last?.events || [], by: m.last?.by || null, snapshot: !!snapshot });
const sse = (res, event, data, id) => res.write(`${id != null ? `id: ${id}\n` : ''}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
store.on('msg', (m) => {
  if (m.type === 'status') { lastStatus.set(m.code, m.status); for (const c of clients.get(m.code) || []) sse(c.res, 'status', m.status); return; }
  const w = wire(m, false);
  const buf = recent.get(m.code) || []; if (!buf.length || buf[buf.length - 1].rev < m.rev) { buf.push(w); if (buf.length > 50) buf.shift(); recent.set(m.code, buf); }
  for (const c of clients.get(m.code) || []) { sse(c.res, 'state', w, m.rev); if (m.logEntry && c.role === 'control') sse(c.res, 'log', m.logEntry); }
  for (const x of waiters.get(m.code) || []) if (m.rev > x.since) x.done();
});
setInterval(() => { for (const set of clients.values()) for (const c of set) sse(c.res, 'hb', { t: Date.now() }); }, 15000);
setInterval(() => store.sweep().catch((e) => console.error('sweep', e.message)), 15 * 60000);

// ---------- helpers ----------
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const who = (req) => String(req.headers['x-forwarded-email'] || req.headers['x-goog-authenticated-user-email'] || 'local').replace(/^accounts\.google\.com:/, '').slice(0, 120);
function body(req, limit) {
  return new Promise((resolve, reject) => { const chunks = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > limit) { reject(Object.assign(new Error('request too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); });
}
const readJSON = async (req, limit = 2e6) => { const b = await body(req, limit); try { return b.length ? JSON.parse(b) : {}; } catch { throw Object.assign(new Error('bad JSON'), { status: 400 }); } };
function sampleAgendas() {
  const dir = path.join(ROOT, 'show/samples'), out = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) { try { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (j.days) out.push({ path: `show/samples/${f}`, title: j.event?.name || f, days: j.days.map((d) => d.label + ' · ' + d.name) }); } catch {} }
  return out;
}
const agendaFor = (show) => JSON.parse(JSON.stringify(show.agenda).replaceAll('{assets}/', `shows/${show.code}/assets/`));

// ---------- static files (Range requests for video and audio) ----------
// a file that cannot be read ends that one response; it never takes the server down
const stream = (f, res, o) => fs.createReadStream(f, o).on('error', (e) => { console.error('read', f, e.code); res.destroy(); }).pipe(res);
function serveFile(req, res, f) {
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found'); }
    const head = { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': /\.(mp4|mp3|m4a|jpg|png|otf|ttf|woff2)$/.test(f) ? 'public, max-age=300' : 'no-cache' };
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      let s = range[1] ? +range[1] : st.size - +range[2], en = range[1] && range[2] ? +range[2] : st.size - 1;
      if (s >= st.size || s > en) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...head, 'Content-Range': `bytes ${s}-${en}/${st.size}`, 'Content-Length': en - s + 1 });
      return req.method === 'HEAD' ? res.end() : stream(f, res, { start: s, end: en });
    }
    res.writeHead(200, { ...head, 'Content-Length': st.size });
    return req.method === 'HEAD' ? res.end() : stream(f, res);
  });
}

// ---------- API ----------
async function api(req, res, u) {
  const p = u.pathname;
  if (p === '/api/time') return json(res, 200, { t: Date.now() });
  if (p === '/api/agendas') return json(res, 200, { agendas: sampleAgendas(), default: AGENDA, store: store.kind });
  // voiced announcements (scripts/voice/say.py --agenda ... --out out/voice): the manifest if there is one, else no clips
  if (p === '/api/voice') {
    const rel = u.searchParams.get('path') || 'out/voice/manifest.json', f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !f.endsWith('.json') || !fs.existsSync(f)) return json(res, 200, { clips: [] });
    try { return json(res, 200, JSON.parse(fs.readFileSync(f, 'utf8'))); } catch { return json(res, 200, { clips: [], error: 'manifest unreadable' }); }
  }
  if (p === '/api/shows' && req.method === 'POST') {
    if (!allow('create:' + who(req), 0.2, 5)) return json(res, 429, { error: 'too many new shows; wait a minute' });
    const b = await readJSON(req, 5e6);
    let agenda;
    if (b.agenda) agenda = b.agenda;
    else { const ap = path.join(ROOT, b.agendaPath || AGENDA); if (!ap.startsWith(path.join(ROOT, 'show')) || !ap.endsWith('.json')) return json(res, 400, { error: 'agendaPath must be a sample under show/' }); agenda = JSON.parse(fs.readFileSync(ap, 'utf8')); }
    if (!agenda?.days?.length) return json(res, 400, { error: 'the agenda has no days' });
    let code; do code = newCode(); while (await store.exists(code));
    const pin = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
    const state = Eng.initial(agenda);
    await store.create({ code, pinHash: hashPin(pin), agenda, state });
    console.log(`show ${code} created by ${who(req)}`);
    const host = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}`;
    return json(res, 201, { code, pin, expires: Date.now() + TTL_MS, stage: `${host}/stage?code=${code}`, control: `${host}/control?code=${code}&pin=${pin}` });
  }
  const m = /^\/api\/shows\/([^/]+)(\/[a-z]+)?$/.exec(p); if (!m) return json(res, 404, { error: 'no such endpoint' });
  const code = normCode(decodeURIComponent(m[1])), sub = m[2] || '';
  const show = code && (await store.get(code));
  if (!show) return json(res, 404, { error: 'no show with that code (it may have expired)' });
  const needPin = () => { if (pinOk(req.headers['x-show-pin'], show.pinHash)) return false; json(res, 401, { error: 'wrong or missing PIN' }); return true; };

  if (sub === '' && req.method === 'GET') return json(res, 200, { code, title: show.agenda.event?.name, days: show.agenda.days.length, rev: show.rev ?? show.state.rev, created: show.created, expires: show.created + TTL_MS, store: store.kind });
  if (sub === '/agenda') return json(res, 200, agendaFor(show));
  if (sub === '/log') { if (needPin()) return; return json(res, 200, { log: show.log || [] }); }
  if (sub === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no', Connection: 'keep-alive' });
    res.write(`: ${' '.repeat(2048)}\nretry: 2000\n\n`);   // padding pushes early bytes through buffering proxies
    const c = { res, role: u.searchParams.get('role') || 'stage' };
    if (!clients.has(code)) clients.set(code, new Set()); clients.get(code).add(c);
    sse(res, 'snapshot', wire({ rev: show.state.rev, state: show.state, last: show.last }, true), show.state.rev);
    if (lastStatus.has(code)) sse(res, 'status', lastStatus.get(code));
    req.on('close', () => clients.get(code)?.delete(c));
    return;
  }
  if (sub === '/state') {
    const since = +u.searchParams.get('since'), wait = Math.min(25, +u.searchParams.get('wait') || 0);
    const reply = async () => { const cur = await store.get(code); const buf = (recent.get(code) || []).filter((x) => x.rev > since);
      const messages = since < 0 || !buf.length || buf[0].rev > since + 1 ? [wire({ rev: cur.state.rev, state: cur.state, last: cur.last }, true)] : buf;
      json(res, 200, { messages, status: lastStatus.get(code) || null }); };
    if (since >= 0 && show.state.rev <= since && wait > 0) {
      const x = { since, done: () => { clearTimeout(x.timer); waiters.get(code)?.delete(x); reply().catch(() => {}); } };
      x.timer = setTimeout(x.done, wait * 1000); if (!waiters.has(code)) waiters.set(code, new Set()); waiters.get(code).add(x);
      req.on('close', () => { clearTimeout(x.timer); waiters.get(code)?.delete(x); });
      return;
    }
    return reply();
  }
  if (sub === '/cmd' && req.method === 'POST') {
    const b = await readJSON(req);
    if (!Eng.COMMANDS.includes(b.cmd)) return json(res, 400, { error: `unknown command ${b.cmd}` });
    if (!Eng.STAGE_COMMANDS.includes(b.cmd) && needPin()) return;
    if (!allow('cmd:' + code, 10, 40)) return json(res, 429, { error: 'too many commands' });
    const by = who(req); let conflict = false, before = 0;
    const out = await store.update(code, (s) => {
      // a conflict: this control had not yet seen a change that someone else made (its own quick repeats are not conflicts)
      before = s.state.rev; conflict = b.baseRev != null && b.baseRev < before && !Eng.STAGE_COMMANDS.includes(b.cmd) && !!s.last?.by && s.last.by !== by && !Eng.STAGE_COMMANDS.includes(s.last.cmd);
      const { state, events } = Eng.apply(s.state, b.cmd, b.args || {}, { agenda: s.agenda, now: Date.now() });
      state.rev = before + 1;
      const last = { cmd: b.cmd, args: b.args || {}, events, by, t: Date.now() };
      return { state, last, logEntry: { t: last.t, by, cmd: b.cmd, args: b.args || {}, rev: state.rev, conflict } };
    });
    if (!out) return json(res, 404, { error: 'show gone' });
    return json(res, 200, { ok: true, rev: out.state.rev, conflict, message: wire({ rev: out.state.rev, state: out.state, last: out.last }, false) });
  }
  if (sub === '/status' && req.method === 'POST') {
    if (!allow('status:' + code, 3, 6)) return json(res, 429, { error: 'too many status reports' });
    const s = await readJSON(req, 2e4); await store.status(code, { ...s, at: Date.now() });
    return json(res, 200, { ok: true });
  }
  if (sub === '/assets' && req.method === 'POST') {
    if (needPin()) return;
    const buf = await body(req, 30e6); let n = 0; const dir = path.join(ASSETS, code);
    for (const { name, data } of unzip(buf)) {
      const f = path.resolve(dir, name); if (!f.startsWith(dir + path.sep) || name.includes('..')) continue;
      fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); n++;
    }
    console.log(`show ${code}: ${n} asset files uploaded by ${who(req)}`);
    return json(res, 200, { ok: true, files: n, base: `shows/${code}/assets/`, note: 'Stored on this server instance only; bake event media into the image for the real event.' });
  }
  return json(res, 405, { error: 'method not allowed' });
}

// ---------- routes ----------
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname.startsWith('/api/')) return await api(req, res, u);
    if (u.pathname === '/healthz') return json(res, 200, { ok: true, store: store.kind });
    if (u.pathname === '/' || u.pathname === '/show' || u.pathname === '/show/') { res.writeHead(302, { Location: '/show/index.html' }); return res.end(); }
    if (u.pathname === '/stage' || u.pathname === '/control') { res.writeHead(302, { Location: `/show${u.pathname}.html${u.search}` }); return res.end(); }
    const am = /^\/shows\/([^/]+)\/assets\/(.+)$/.exec(u.pathname);
    if (am) { const code = normCode(am[1]); const dir = path.join(ASSETS, code || '_'); const f = path.resolve(dir, decodeURIComponent(am[2])); if (!code || !f.startsWith(dir + path.sep)) { res.writeHead(403); return res.end(); } return serveFile(req, res, f); }
    const f = path.join(ROOT, decodeURIComponent(u.pathname));
    const rel = path.relative(ROOT, f);
    if (!f.startsWith(ROOT) || /(^|[\\/])(\.git|\.env|node_modules|\.bundle)([\\/]|$)/.test(rel) || /^show[\\/]server[\\/]/.test(rel)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, f);
  } catch (e) { console.error(req.method, u.pathname, e.message); if (!res.headersSent) json(res, e.status || 500, { error: e.message }); else res.end(); }
});
srv.keepAliveTimeout = 65000; srv.requestTimeout = 0;   // SSE streams stay open (Cloud Run allows up to its --timeout, 60 min max)

await store.init();
srv.listen(PORT, HOST, () => {
  const base = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
  console.log(`Agency 2026 show, serving ${ROOT} (shows in ${store.kind})`);
  console.log(`  start page:          ${base}/            (new show with an event code, join as stage or control)`);
  console.log(`  this laptop only:    ${base}/show/control.html?agenda=${encodeURIComponent(AGENDA)}`);
  if (HOST === '0.0.0.0') for (const ni of Object.values(os.networkInterfaces()).flat()) if (ni && ni.family === 'IPv4' && !ni.internal) console.log(`  on the venue network: http://${ni.address}:${PORT}/`);
  console.log('Ctrl+C to stop.');
});
const stop = async () => { srv.close(); await store.close(); process.exit(0); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
