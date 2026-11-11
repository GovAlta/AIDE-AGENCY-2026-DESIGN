/* Agency 2026 show: the control booth. Every button is a command (lib/engine.js) sent through the transport:
 *   laptop mode (no ?code): this window runs the engine and drives the stage windows in this browser over BroadcastChannel.
 *   event-code mode (?code=ABC-123&pin=123456): the show server runs the engine; the stage can be on any machine.
 * GO steps forward through the day (slides, then scenes, then segments); BACK steps back; the rundown selects a segment for
 * Preview, and TAKE puts it on air. Sound cues fire on GO/TAKE (not on BACK); the pads fire any cue by hand.
 */
import * as C from './lib/core.js';
import * as Eng from './lib/engine.js';
import * as Tr from './lib/transport.js';

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const toast = (m, bad = true) => { const e = $('#err'); e.textContent = m; e.style.background = bad ? '' : '#1E7A3A'; e.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => (e.style.display = 'none'), 5000); };
let TP, AG, CUES = {}, S, viewDay = 0, stageSeen = 0, lastStatus = null, me = null;
const LOG = [];
const showNow = () => TP.now() + (S?.clockOffset || 0);
const TZ = () => C.tz(AG);

async function send(cmd, args = {}) {
  try { const r = await TP.send(cmd, args); if (r?.conflict) toast('Another control changed the show just before this command. Check Program.'); return r; }
  catch (e) { toast(`${cmd}: ${e.message}`); }
}
const goNext = () => send('next'), goBack = () => send('back');
const take = (step) => send('take', { step });
const select = (step) => send('select', { step });
const lowerOn = (speaker, secs) => send('lower', { speaker, secs });
const lowerOff = () => send('lowerOff');

// ---------- rendering ----------
function render() {
  if (!S || !AG) return;
  const day = AG.days[viewDay];
  $('#days').innerHTML = '';
  AG.days.forEach((d, i) => { const b = document.createElement('button'); b.textContent = `${d.label || 'Day ' + (i + 1)} · ${d.name?.split(',')[0] || ''}`; b.className = i === viewDay ? 'on' : '';
    b.onclick = () => { viewDay = i; select({ day: i, seg: 0, scene: 0 }); }; $('#days').append(b); });
  const rd = $('#rundown'); rd.innerHTML = '';
  const pv = S.preview;
  day.segments.forEach((sg, i) => {
    const air = S.day === viewDay && S.seg === i, isSel = S.select && S.select.day === viewDay && S.select.seg === i, done = S.day === viewDay && i < S.seg;
    const row = document.createElement('div'); row.className = `seg${air ? ' air' : ''}${isSel ? ' sel' : ''}${done ? ' done' : ''}`;
    row.innerHTML = `<div class="tm">${sg.start || ''}</div><div class="nm"></div><div class="ty"></div><div class="scs"></div>`;
    row.querySelector('.nm').textContent = sg.title || sg.type;
    row.querySelector('.ty').textContent = [sg.type, sg.end ? `to ${sg.end}` : '', (sg.speakers || []).map((s) => s.name).join(', ')].filter(Boolean).join(' · ');
    const scs = row.querySelector('.scs');
    C.scenesOf(sg).forEach((sc, k) => {
      const chip = document.createElement('span'); const isAir = air && S.scene === k;
      const r = C.resolve(AG, { day: viewDay, seg: i, scene: k, slide: 0 }), n = r?.scene.type === 'slides' ? r.scene.slideUrls.length : 0;
      chip.className = `sc${isAir ? ' air' : ''}${pv && pv.day === viewDay && pv.seg === i && pv.scene === k ? ' sel' : ''}`;
      chip.textContent = sc.type + (n ? ` ${isAir ? S.slide + 1 + '/' : ''}${n}` : '');
      chip.onclick = (e) => { e.stopPropagation(); select({ day: viewDay, seg: i, scene: k }); };
      chip.ondblclick = (e) => { e.stopPropagation(); take({ day: viewDay, seg: i, scene: k, slide: 0 }); };
      scs.append(chip);
    });
    row.onclick = () => select({ day: viewDay, seg: i, scene: 0 });
    row.ondblclick = () => take({ day: viewDay, seg: i, scene: 0, slide: 0 });
    rd.append(row);
    if (air) requestAnimationFrame(() => row.scrollIntoView({ block: 'nearest' }));
  });
  const cap = (st, el) => { const r = st && C.resolve(AG, st); if (!r) { el.textContent = ''; return; }
    const sl = r.scene.type === 'slides' ? ` · slide ${(st.slide || 0) + 1} of ${r.scene.slideUrls.length}` : '';
    el.innerHTML = `<b></b><span class="small"></span>`; el.querySelector('b').textContent = `${r.seg.start || ''}  ${r.seg.title || r.seg.type}`;
    el.querySelector('span').textContent = `${r.dayIndex + 1}.${r.segIndex + 1} · ${r.scene.type}${sl}${r.scene.transition ? ' · ' + r.scene.transition : ''}`; };
  cap(S, $('#pgmCap')); cap(S.preview, $('#pvwCap')); renderAnnounce();
  const r = C.resolve(AG, Eng.stepOf(S));
  $('#notes').textContent = [...new Set([r?.scene.notes, r?.seg.notes].filter(Boolean))].join('\n') || 'No notes for this step';
  const sp = $('#speakers'); sp.innerHTML = '';
  const list = (r?.scene.speakers || r?.seg.speakers || []), lowerOnAir = Eng.lowerVisible(S, showNow());
  list.forEach((s) => { const b = document.createElement('button'); b.innerHTML = '<b></b><br><small></small>'; b.querySelector('b').textContent = s.name; b.querySelector('small').textContent = [s.role, s.org].filter(Boolean).join(' · ');
    const isOn = lowerOnAir && S.lower.speaker?.name === s.name; b.className = isOn ? 'on' : ''; b.onclick = () => (isOn ? lowerOff() : lowerOn(s, 0)); sp.append(b); });
  if (!list.length) sp.innerHTML = '<span class="small">No speakers in this segment</span>';
  $('#lowerState').textContent = lowerOnAir ? 'on air' : S.lower?.on && S.lower.at > showNow() ? 'starting' : 'off';
  $('#blackout').classList.toggle('on', !!S.blackout); $('#freeze').classList.toggle('on', !!S.freeze); $('#mute').classList.toggle('on', !!S.mute);
  $('#bedName').textContent = S.bed?.id || 'none'; if (document.activeElement !== $('#bedVol')) $('#bedVol').value = S.bed?.vol ?? 1;
  if (document.activeElement !== $('#master')) $('#master').value = S.master ?? 1;
  $('#theme').value = S.theme || 'compliant';
  $('#cdState').textContent = S.countdown ? `to ${C.fmtTime(S.countdown.target, TZ())}` : 'agenda time';
  $('#rhState').textContent = S.clockOffset ? `Rehearsal: ${new Date(showNow()).toLocaleString('en-CA', { timeZone: TZ() })}` : 'Live clock';
}
function pads() {
  const p = $('#pads'); p.innerHTML = '';
  const ids = (AG.audio?.pads || Object.keys(CUES).filter((k) => CUES[k].kind !== 'bed')).slice(0, 9);
  ids.forEach((id, i) => { const c = CUES[id] || {}; const b = document.createElement('button'); b.innerHTML = `<small>${i + 1} · ${c.kind || ''}${CUES[id] ? '' : ' · missing'}</small>`; b.append(c.label || id); b.title = c.use || c.label || id; b.onclick = () => send('fire', { id }); b.dataset.id = id; p.append(b); });
  const stop = document.createElement('button'); stop.innerHTML = '<small>0</small>Stop pads'; stop.onclick = () => send('stopfx'); p.append(stop);
  const bs = $('#bedSel'); bs.innerHTML = ''; Object.values(CUES).filter((c) => c.kind === 'bed' || c.loop).forEach((c) => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.label || c.id; bs.append(o); });
}
// voiced announcements for the segment on air and the segment in Preview (scripts/voice/say.py). Fired clips are marked.
const fired = new Set();
function clipsFor(st) { const sg = st && AG.days[st.day]?.segments[st.seg]; return sg?.id ? Object.values(CUES).filter((c) => c.kind === 'voice' && c.segment === sg.id) : []; }
function renderAnnounce() {
  const box = $('#announce'); if (!box) return;
  const groups = [['On air', clipsFor(S)], ['Next', S.preview && (S.preview.day !== S.day || S.preview.seg !== S.seg) ? clipsFor(S.preview) : []]];
  box.innerHTML = '';
  for (const [lab, list] of groups) for (const c of list) {
    const b = document.createElement('button'); b.className = fired.has(c.id) ? 'done' : ''; b.innerHTML = '<small></small><span></span>';
    b.querySelector('small').textContent = `${lab} · ${c.label}${fired.has(c.id) ? ' · played' : ''}`; b.querySelector('span').textContent = c.text || c.id;
    b.onclick = () => { fired.add(c.id); send('fire', { id: c.id }); renderAnnounce(); }; box.append(b);
  }
  if (!box.children.length) box.innerHTML = `<span class="small">${Object.values(CUES).some((c) => c.kind === 'voice') ? 'No announcements for these segments' : 'No voiced announcements. Make them with scripts/voice/say.py --agenda … --out out/voice'}</span>`;
}
function renderLog() {
  const box = $('#log'); if (!box) return;
  box.innerHTML = LOG.slice(-8).reverse().map((e) => `<div><span class="small">${new Date(e.t).toLocaleTimeString('en-CA', { timeZone: TZ() })}</span> <b></b> <span></span>${e.conflict ? ' <span class="small" style="color:var(--warn)">conflict</span>' : ''}</div>`).join('') || '<span class="small">No commands yet</span>';
  [...box.children].forEach((d, i) => { const e = LOG.slice(-8).reverse()[i]; if (!e) return; d.querySelector('b').textContent = e.cmd; d.querySelectorAll('span')[1].textContent = e.by === me ? '' : `by ${e.by}`; });
}
function tickUi() {
  if (!S) return;
  $('#clock').textContent = C.fmtTime(showNow(), TZ(), { seconds: true });
  const live = Date.now() - stageSeen < 3500; const sp = $('#stagePill'); sp.textContent = live ? 'stage: live' : 'stage: none'; sp.className = `pill ${live ? 'on' : 'bad'}`;
  if (live && lastStatus?.rev != null && lastStatus.rev < S.rev - 1) { sp.textContent = 'stage: behind'; sp.className = 'pill bad'; }
  const ap = $('#audioPill'); const a = live ? lastStatus?.audio : null; ap.textContent = `sound: ${a || '?'}`; ap.className = `pill ${a === 'on' ? 'on' : a === 'locked' ? 'bad' : ''}`;
  ap.title = a === 'locked' ? 'Click once anywhere on the stage screen to enable its sound' : '';
  $('#meter').style.width = `${Math.min(100, (lastStatus?.level || 0) * 140)}%`;
  const v = lastStatus?.video; $('#vtime').textContent = v ? `${C.fmtDur(v.t * 1000)} / ${C.fmtDur(v.d * 1000)}${v.paused ? ' paused' : ''}` : ''; $('#vbar').style.width = v && v.d ? `${(100 * v.t) / v.d}%` : '0';
  const sg = AG.days[S.day]?.segments[S.seg], d = $('#drift');
  if (sg?.start && S.segStartedAt) {
    const late = S.segStartedAt - C.segStart(AG, S.day, S.seg), over = sg.end ? showNow() - C.segEnd(AG, S.day, S.seg) : -1, m = Math.round(late / 60000);
    const amt = (x) => (x >= 2880 ? `${Math.round(x / 1440)} days` : x >= 120 ? `${Math.round(x / 60)} h` : `${x} min`);
    d.textContent = over > 0 ? `over by ${C.fmtDur(over)}` : Math.abs(m) < 1 ? 'on time' : m > 0 ? `started ${amt(m)} late` : `started ${amt(-m)} early`;
    d.className = `drift ${over > 0 || m >= 3 ? 'late' : 'ok'}`;
  } else { d.textContent = 'no schedule'; d.className = 'drift'; }
  $('#lowerState').textContent = Eng.lowerVisible(S, showNow()) ? 'on air' : 'off';
}
function fitMonitors() { for (const f of $$('.mon .frame')) { const s = f.clientWidth / 1920; f.querySelector('iframe').style.transform = `scale(${s})`; } }

// ---------- controls ----------
function bind() {
  $('#go').onclick = goNext; $('#back').onclick = goBack;
  $('#take').onclick = () => { if (S.preview) take(S.preview); };
  $('#openStage').onclick = () => {
    const u = TP.code ? `stage.html?code=${TP.code}` : 'stage.html?mode=program';
    const w = window.open(u, 'agency-stage', 'popup,width=1280,height=720'); if (!w) toast('The browser blocked the stage window. Allow pop-ups for this page.');
  };
  $('#blackout').onclick = () => send('blackout'); $('#freeze').onclick = () => send('freeze'); $('#mute').onclick = () => send('mute');
  $$('[data-v]').forEach((b) => (b.onclick = () => send('video', { action: b.dataset.v })));
  $('#bedPlay').onclick = () => send('bed', { id: $('#bedSel').value, vol: +$('#bedVol').value });
  $('#bedStop').onclick = () => send('bed', { id: null });
  $('#bedVol').onchange = (e) => send('bedVol', { vol: +e.target.value });
  $('#master').onchange = (e) => send('master', { v: +e.target.value });
  $('#cdSet').onclick = () => { const at = $('#cdAt').value, d = AG.days[S.day]; send('countdown', { target: at ? C.at(d.date, at, TZ()) : showNow() + (+$('#cdMin').value || 0) * 60000 }); };
  $('#cdClear').onclick = () => send('countdown', { target: null });
  $('#rhSet').onclick = () => { const dt = $('#rhDate').value || AG.days[viewDay].date, tm = $('#rhTime').value || AG.days[viewDay].segments[0].start; send('clock', { offset: C.at(dt, tm, TZ()) - TP.now() }); };
  $('#rhLive').onclick = () => send('clock', { offset: 0 });
  $('#theme').onchange = (e) => send('theme', { name: e.target.value });
  $('#reloadStage').onclick = () => send('reload');
  addEventListener('keydown', (e) => {
    if (e.target.matches('input, select')) return;
    const k = e.key;
    if (k === ' ' || k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); goNext(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); goBack(); }
    else if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); const segs = AG.days[viewDay].segments; const cur = S.select && S.select.day === viewDay ? S.select.seg : (viewDay === S.day ? S.seg : 0);
      select({ day: viewDay, seg: Math.max(0, Math.min(segs.length - 1, cur + (k === 'ArrowDown' ? 1 : -1))), scene: 0 }); }
    else if (k === 'Enter') { e.preventDefault(); $('#take').click(); }
    else if (k === 'b' || k === 'B') send('blackout');
    else if (k === 'f' || k === 'F') send('freeze');
    else if (k === 'm' || k === 'M') send('mute');
    else if (k === 'l' || k === 'L') { const r = C.resolve(AG, Eng.stepOf(S)), sp = (r?.scene.speakers || [])[0]; if (Eng.lowerVisible(S, showNow())) lowerOff(); else if (sp) lowerOn(sp, 0); }
    else if (k === 'Escape') lowerOff();
    else if (k === 'v' || k === 'V') send('video', { action: 'toggle' });
    else if (k === 'r' || k === 'R') send('video', { action: 'restart' });
    else if (/^[1-9]$/.test(k)) { const b = $$('#pads button')[+k - 1]; if (b?.dataset.id) b.click(); }
    else if (k === '0') send('stopfx');
    else if (k === 'a' || k === 'A') { const c = clipsFor(S).find((x) => !fired.has(x.id)); if (c) { fired.add(c.id); send('fire', { id: c.id }); renderAnnounce(); } }
  });
  new ResizeObserver(fitMonitors).observe($('.mons')); fitMonitors();
}

// ---------- start ----------
(async () => {
  const code = C.qs('code', null), pin = C.qs('pin', null) || (code ? sessionStorage.getItem('pin:' + code.toUpperCase()) : null);
  if (code && pin) { sessionStorage.setItem('pin:' + code.toUpperCase(), pin); history.replaceState(null, '', `control.html?code=${code.toUpperCase()}`); }   // keep the PIN out of the address bar
  if (code && !pin) { const p = prompt(`PIN for show ${code.toUpperCase()}`); if (p) { sessionStorage.setItem('pin:' + code.toUpperCase(), p); location.reload(); return; } }
  TP = Tr.create({ role: 'control', code, pin, agendaUrl: C.qs('agenda', null) || C.load()?.agendaUrl || 'show/samples/agency-2026.json', day: +C.qs('day', 0) });
  me = code ? null : 'this laptop';
  TP.onMessage((m) => {
    if (m.kind === 'state') { const first = !S; S = m.state; AG = TP.agenda; if (first) { viewDay = S.day; } if (m.cmd && m.by && m.by !== me && TP.code && !m.snapshot) LOG.push({ t: Date.now(), by: m.by, cmd: m.cmd }); render(); renderLog(); }
    if (m.kind === 'status' && (m.status.mode === 'program' || m.status.mode === undefined)) { stageSeen = Date.now(); lastStatus = m.status; }
    if (m.kind === 'log') { if (!LOG.some((x) => x.t === m.entry.t && x.cmd === m.entry.cmd)) LOG.push(m.entry); if (LOG.length > 50) LOG.shift(); renderLog(); }
    if (m.kind === 'conn') { const c = $('#connPill'); c.textContent = `link: ${m.state}`; c.className = `pill ${m.state === 'live' || m.state === 'local' ? 'on' : m.state === 'poll' ? '' : 'bad'}`; }
  });
  await TP.start();
  AG = TP.agenda; CUES = await C.loadCues(AG);
  if (code) {
    $('#codePill').textContent = `code ${TP.code}`; $('#codePill').hidden = false;
    $('#share').hidden = false;
    const base = location.origin; $('#stageUrl').value = `${base}/stage?code=${TP.code}`; $('#ctlUrl').value = `${base}/control?code=${TP.code}&pin=${pin}`;
    $$('[data-copy]').forEach((b) => (b.onclick = () => { navigator.clipboard?.writeText($('#' + b.dataset.copy).value); toast('Copied', false); }));
    try { const lg = await fetch(`/api/shows/${TP.code}/log`, { headers: { 'X-Show-Pin': pin } }).then((r) => r.json()); LOG.push(...(lg.log || []).slice(-20)); renderLog(); } catch {}
  }
  $('#pgm').src = code ? `stage.html?mode=monitor&code=${TP.code}` : 'stage.html?mode=monitor';
  $('#pvw').src = code ? `stage.html?mode=preview&code=${TP.code}` : 'stage.html?mode=preview';
  bind(); pads(); render();
  setInterval(tickUi, 250); tickUi();
  window.SHOW_CONTROL = { get state() { return S; }, goNext, goBack, take, select, lowerOn, lowerOff, send, fire: (id) => send('fire', { id }), get agenda() { return AG; }, get status() { return lastStatus; }, get transport() { return TP; } };
})().catch((e) => { toast('Control failed to start: ' + e.message); console.error(e); });
