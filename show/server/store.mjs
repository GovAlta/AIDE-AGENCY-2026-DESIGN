// Show storage for the event-code server.
//   MemoryStore: one process (a laptop, or Cloud Run held to one instance).
//   PgStore:     when DATABASE_URL is set. One row per show; every change is made in a transaction (row lock), then announced with
//                NOTIFY on one channel, so every Cloud Run instance fans the change out to its own SSE clients.
// Interface: create(show), get(code), update(code, fn(show) -> {state, rev, last, log}), status(code, s), on('msg', fn), sweep(), close().
// A message is { code, type: 'state', rev, state, last: {cmd, args, events, by, t} } or { code, type: 'status', status }.
import { EventEmitter } from 'node:events';

export const TTL_MS = 72 * 3600 * 1000;
const LOG_MAX = 200;

export class MemoryStore extends EventEmitter {
  constructor() { super(); this.setMaxListeners(0); this.shows = new Map(); this.kind = 'memory'; }
  async init() { return this; }
  async create(s) { this.shows.set(s.code, { ...s, log: [], created: Date.now(), updated: Date.now() }); return this.get(s.code); }
  async get(code) { const s = this.shows.get(code); if (!s || Date.now() - s.created > TTL_MS) return null; return s; }
  async update(code, fn) {
    const s = await this.get(code); if (!s) return null;
    const r = fn(s); if (!r) return null;
    Object.assign(s, { state: r.state, rev: r.state.rev, last: r.last, updated: Date.now() });
    if (r.logEntry) { s.log.push(r.logEntry); if (s.log.length > LOG_MAX) s.log.shift(); }
    this.emit('msg', { code, type: 'state', rev: s.rev, state: s.state, last: s.last, logEntry: r.logEntry });
    return s;
  }
  async status(code, status) { this.emit('msg', { code, type: 'status', status }); }
  async exists(code) { return !!(await this.get(code)); }
  async sweep() { for (const [k, s] of this.shows) if (Date.now() - s.created > TTL_MS) this.shows.delete(k); }
  async close() {}
}

export class PgStore extends EventEmitter {
  constructor(url, prefix = 'agency_show_') {
    super(); this.setMaxListeners(0); this.url = url; this.P = prefix.replace(/[^a-z0-9_]/gi, '').toLowerCase(); this.kind = 'postgres'; this.cache = new Map();
  }
  async init() {
    const { default: pg } = await import('pg');
    const ssl = /sslmode=require/.test(this.url) ? { rejectUnauthorized: false } : undefined;
    this.pool = new pg.Pool({ connectionString: this.url, max: 6, ssl });
    await this.pool.query(`create table if not exists ${this.P}shows (code text primary key, pin_hash text not null, agenda jsonb not null, state jsonb not null,
      rev integer not null default 0, last jsonb, log jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`);
    this.listener = new pg.Client({ connectionString: this.url, ssl });
    await this.listener.connect();
    await this.listener.query(`listen ${this.P}events`);
    this.listener.on('notification', (n) => this.onNotify(n.payload));
    this.listener.on('error', (e) => { console.error('pg listener', e.message); this.reconnectListener(); });
    return this;
  }
  async reconnectListener() {
    try { await this.listener.end(); } catch {}
    setTimeout(async () => { try { const { default: pg } = await import('pg'); this.listener = new pg.Client({ connectionString: this.url }); await this.listener.connect(); await this.listener.query(`listen ${this.P}events`);
      this.listener.on('notification', (n) => this.onNotify(n.payload)); } catch (e) { console.error('pg relisten', e.message); this.reconnectListener(); } }, 2000);
  }
  async onNotify(payload) {
    let m; try { m = JSON.parse(payload); } catch { return; }
    if (m.type === 'status') return this.emit('msg', m);
    // the state itself is read from the row (a NOTIFY payload is limited to 8000 bytes); the cue events ride in the payload
    const r = await this.pool.query(`select state, rev from ${this.P}shows where code = $1`, [m.code]);
    if (!r.rows[0]) return;
    this.emit('msg', { code: m.code, type: 'state', rev: r.rows[0].rev, state: r.rows[0].state, last: m.last, logEntry: m.logEntry });
  }
  row(x) { return x && { code: x.code, pinHash: x.pin_hash, agenda: x.agenda, state: x.state, rev: x.rev, last: x.last, log: x.log, created: +x.created_at, updated: +x.updated_at }; }
  async create(s) {
    await this.pool.query(`insert into ${this.P}shows (code, pin_hash, agenda, state, rev) values ($1, $2, $3, $4, $5)`, [s.code, s.pinHash, s.agenda, s.state, s.state.rev || 0]);
    return this.get(s.code);
  }
  async get(code) {
    const r = await this.pool.query(`select * from ${this.P}shows where code = $1 and created_at > now() - interval '72 hours'`, [code]);
    return this.row(r.rows[0]);
  }
  async exists(code) { return (await this.pool.query(`select 1 from ${this.P}shows where code = $1`, [code])).rowCount > 0; }
  async update(code, fn) {
    const c = await this.pool.connect();
    try {
      await c.query('begin');
      const r = await c.query(`select * from ${this.P}shows where code = $1 and created_at > now() - interval '72 hours' for update`, [code]);
      const s = this.row(r.rows[0]); if (!s) { await c.query('rollback'); return null; }
      const out = fn(s); if (!out) { await c.query('rollback'); return null; }
      await c.query(`update ${this.P}shows set state = $2, rev = $3, last = $4, updated_at = now(),
        log = case when jsonb_array_length(log) >= ${LOG_MAX} then (log - 0) || $5::jsonb else log || $5::jsonb end where code = $1`,
        [code, out.state, out.state.rev, out.last, JSON.stringify(out.logEntry ? [out.logEntry] : [])]);
      const payload = JSON.stringify({ code, type: 'state', rev: out.state.rev, last: out.last, logEntry: out.logEntry });
      await c.query(`select pg_notify('${this.P}events', $1)`, [payload.length < 7900 ? payload : JSON.stringify({ code, type: 'state', rev: out.state.rev, last: { ...out.last, args: {} } })]);
      await c.query('commit');
      return { ...s, state: out.state, rev: out.state.rev, last: out.last };
    } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); }
  }
  async status(code, status) { const p = JSON.stringify({ code, type: 'status', status }); if (p.length < 7900) await this.pool.query(`select pg_notify('${this.P}events', $1)`, [p]); }
  async sweep() { await this.pool.query(`delete from ${this.P}shows where created_at < now() - interval '72 hours'`); }
  async drop() { await this.pool.query(`drop table if exists ${this.P}shows`); }
  async close() { try { await this.listener?.end(); } catch {} try { await this.pool?.end(); } catch {} }
}
