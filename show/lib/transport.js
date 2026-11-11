/* Agency 2026 show: transports. The stage and the control talk through one of two:
 *   local  — one browser, several windows (laptop mode): BroadcastChannel; the control runs the engine and is the authority.
 *   remote — any machines (event-code mode): the show server is the authority. Commands: POST /api/shows/:code/cmd (X-Show-Pin);
 *            updates: Server-Sent Events from /api/shows/:code/events, a full snapshot first on every (re)connect; if no heartbeat
 *            arrives within 20 s (a buffering proxy), it falls back to long-polling /api/shows/:code/state?since=rev.
 * Both deliver messages to onMessage(m):
 *   { kind: 'state', rev, serverTime, state, cmd, events, by, snapshot }   events run only when snapshot is false
 *   { kind: 'status', status }     the program stage's report (sound, level, video position)
 *   { kind: 'log', entry }         remote only: who sent what
 *   { kind: 'conn', state: 'live' | 'poll' | 'lost' | 'local' }
 * now() is the shared clock: server time (median of a few round trips) in remote mode, this machine's time in local mode.
 */
import * as C from './core.js';
import * as Eng from './engine.js';

export function create(o) { return o.code ? new Remote(o) : new Local(o); }

class Base {
  constructor(o) { this.o = o; this.handlers = new Set(); this.offset = 0; this.rev = -1; this.conn = 'local'; }
  onMessage(fn) { this.handlers.add(fn); return () => this.handlers.delete(fn); }
  emit(m) { for (const h of this.handlers) { try { h(m); } catch (e) { console.error(e); } } }
  now() { return Date.now() + this.offset; }
  setConn(s) { if (this.conn !== s) { this.conn = s; this.emit({ kind: 'conn', state: s }); } }
}

// ---------- laptop mode ----------
class Local extends Base {
  constructor(o) {
    super(o); this.role = o.role; this.ch = new BroadcastChannel(C.CHANNEL);
    this.ch.onmessage = (e) => this.onBC(e.data);
  }
  async start() {
    if (this.role === 'control') {
      const url = this.o.agendaUrl, saved = C.load();
      this.agenda = await C.getJSON(url);
      this.state = saved && saved.agendaUrl === url && saved.v === 2 ? saved : { ...Eng.initial(this.agenda, { day: this.o.day }), agendaUrl: url, v: 2 };
      this.publish(null, [], true);
    } else {
      this.ch.postMessage({ kind: 'hello', role: this.role });
      // no control answering within a second: recover from the last saved state (a stage reload during a show)
      setTimeout(async () => { if (this.state) return; const s = C.load(); const url = s?.agendaUrl || this.o.agendaUrl; this.agenda = await C.getJSON(url);
        this.state = s && s.v === 2 ? s : { ...Eng.initial(this.agenda), agendaUrl: url, v: 2 }; this.emit({ kind: 'state', rev: this.state.rev, serverTime: Date.now(), state: this.state, events: [], snapshot: true }); }, 1000);
    }
    this.setConn('local');
    return this;
  }
  async onBC(m) {
    if (m.kind === 'hello' && this.role === 'control' && this.state) this.ch.postMessage(this.msg(null, [], true));
    else if (m.kind === 'state' && this.role !== 'control') {
      if (!this.agenda || this.agenda._url !== m.state.agendaUrl) { this.agenda = await C.getJSON(m.state.agendaUrl); this.agenda._url = m.state.agendaUrl; }
      if (m.rev <= this.rev && !m.snapshot) return; this.rev = m.rev; this.state = m.state; this.emit(m);
    }
    else if (m.kind === 'status' && this.role === 'control') this.emit(m);
    else if (m.kind === 'cmd' && this.role === 'control' && Eng.STAGE_COMMANDS.includes(m.cmd)) this.send(m.cmd, m.args);
  }
  msg(cmd, events, snapshot) { return { kind: 'state', rev: this.state.rev, serverTime: Date.now(), state: this.state, cmd, events, by: 'this laptop', snapshot: !!snapshot }; }
  publish(cmd, events, snapshot) { C.save(this.state); const m = this.msg(cmd, events, snapshot); this.ch.postMessage(m); this.emit(m); }
  async send(cmd, args = {}) {
    if (this.role !== 'control') { this.ch.postMessage({ kind: 'cmd', cmd, args }); return { ok: true }; }
    const { state, events } = Eng.apply(this.state, cmd, args, { agenda: this.agenda, now: Date.now() });
    state.rev = (this.state.rev || 0) + 1; state.agendaUrl = this.state.agendaUrl; state.v = 2; this.state = state;
    this.publish({ cmd, args }, events, false);
    return { ok: true, rev: state.rev };
  }
  status(s) { this.ch.postMessage({ kind: 'status', status: s }); }
  reconnect() {}
}

// ---------- event-code mode ----------
class Remote extends Base {
  constructor(o) { super(o); this.code = o.code.toUpperCase(); this.pin = o.pin || ''; this.base = o.base || ''; this.lastBeat = 0; this.mode = null; }
  api(p) { return `${this.base}/api/shows/${encodeURIComponent(this.code)}${p}`; }
  async start() {
    await this.sync();
    const info = await fetch(this.api('')).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? `No show with code ${this.code} (it may have expired)` : `HTTP ${r.status}`))));
    this.info = info;
    this.agenda = await fetch(this.api('/agenda')).then((r) => r.json()); this.agenda._url = this.api('/agenda');
    this.sse();
    setInterval(() => this.sync(), 60000);
    setInterval(() => { if (this.mode === 'sse' && Date.now() - this.lastBeat > 20000) this.poll(); }, 5000);
    return this;
  }
  // clock offset: median of five round trips to /api/time
  async sync() {
    const xs = [];
    for (let i = 0; i < 5; i++) {
      try { const t0 = Date.now(), r = await fetch(`${this.base}/api/time`, { cache: 'no-store' }).then((r) => r.json()), t1 = Date.now(); xs.push({ off: r.t + (t1 - t0) / 2 - t1, rtt: t1 - t0 }); } catch {}
    }
    if (xs.length) { xs.sort((a, b) => a.off - b.off); this.offset = xs[Math.floor(xs.length / 2)].off; this.rtt = Math.min(...xs.map((x) => x.rtt)); }
  }
  take(m, snapshot) {
    if (!snapshot && m.rev <= this.rev) return;
    this.rev = m.rev; this.state = m.state; this.emit({ kind: 'state', ...m, snapshot });
  }
  sse() {
    this.mode = 'sse'; this.es?.close();
    const es = (this.es = new EventSource(this.api(`/events?role=${this.o.role}`)));
    const beat = () => { this.lastBeat = Date.now(); this.setConn('live'); };
    es.addEventListener('snapshot', (e) => { beat(); this.take(JSON.parse(e.data), true); });
    es.addEventListener('state', (e) => { beat(); this.take(JSON.parse(e.data), false); });
    es.addEventListener('status', (e) => { beat(); this.emit({ kind: 'status', status: JSON.parse(e.data) }); });
    es.addEventListener('log', (e) => { beat(); this.emit({ kind: 'log', entry: JSON.parse(e.data) }); });
    es.addEventListener('hb', beat);
    es.onopen = beat;
    es.onerror = () => { if (es.readyState === EventSource.CLOSED) setTimeout(() => this.mode === 'sse' && this.sse(), 2000); this.setConn('lost'); };
    this.lastBeat = Date.now();
  }
  // fallback when the gateway buffers SSE: long-poll the state
  async poll() {
    if (this.mode === 'poll') return; this.mode = 'poll'; this.es?.close(); this.setConn('poll');
    console.warn('show: no SSE heartbeat for 20 s, switching to long-poll');
    let first = true;
    while (this.mode === 'poll') {
      try {
        const r = await fetch(this.api(`/state?since=${first ? -1 : this.rev}&wait=25`), { cache: 'no-store' });
        if (!r.ok) throw new Error(r.status);
        const j = await r.json(); this.setConn('poll');
        for (const m of j.messages || []) this.take(m, first || m.snapshot);
        for (const s of j.status ? [j.status] : []) this.emit({ kind: 'status', status: s });
        first = false;
      } catch { this.setConn('lost'); await new Promise((r) => setTimeout(r, 2000)); }
    }
  }
  async send(cmd, args = {}) {
    const r = await fetch(this.api('/cmd'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Show-Pin': this.pin }, body: JSON.stringify({ cmd, args, baseRev: this.rev }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
    if (j.message) this.take(j.message, false);   // apply our own change at once; SSE confirms
    return j;
  }
  status(s) {
    const t = Date.now(); if (t - (this._st || 0) < 900) return; this._st = t;
    fetch(this.api('/status'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s), keepalive: true }).catch(() => {});
  }
  reconnect() { this.es?.close(); this.mode = null; this.sse(); }
}
