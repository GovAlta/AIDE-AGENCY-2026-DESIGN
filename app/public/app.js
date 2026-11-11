// Agency Studio client: gallery, JSON-to-form editor, live preview, findings. No framework, no external calls.
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
};
const api = async (url, body) => {
  const r = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
};

let CAT = [], TOK = null, CUR = null, DATA = null, LAST = null, page = 0, renderSeq = 0, timer = null;

// ---------- boot ----------
(async () => {
  const [c, t] = await Promise.all([api('/api/templates'), api('/api/tokens')]);
  CAT = c.templates; TOK = t;
  if (c.who) $('#who').textContent = c.who;
  $('#cls').append(...TOK.classifications.map((x) => h('option', { value: x, text: x[0] + x.slice(1).toLowerCase() })));
  buildGallery();
  addEventListener('hashchange', route); route();
})().catch((e) => { $('#cards').textContent = 'Could not load templates: ' + e.message; });

function route() {
  const m = location.hash.match(/^#\/t\/(.+?)(?:\?s=(.+))?$/);
  if (m) openEditor(decodeURIComponent(m[1]), m[2] ? decodeURIComponent(m[2]) : null);
  else { $('#editor').hidden = true; $('#gallery').hidden = false; document.title = 'Agency Studio'; }
}

// ---------- gallery ----------
let famFilter = 'all';
function buildGallery() {
  const fams = [...new Map(CAT.map((t) => [t.family, t.familyTitle])).entries()];
  const chip = (k, label, n) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(famFilter === k), onclick: () => { famFilter = k; buildGallery(); } }, label, h('span', { class: 'cnt', text: n }));
  $('#fam').replaceChildren(chip('all', 'All', CAT.length), ...fams.map(([k, l]) => chip(k, l, CAT.filter((t) => t.family === k).length)));
  const q = $('#q').value.trim().toLowerCase();
  const show = CAT.filter((t) => (famFilter === 'all' || t.family === famFilter) && (!q || (t.name + ' ' + t.about + ' ' + t.samples.map((s) => s.title).join(' ')).toLowerCase().includes(q)));
  const out = [];
  for (const [fam, title] of fams) {
    const list = show.filter((t) => t.family === fam);
    if (!list.length) continue;
    out.push(h('h2', { class: 'fam-h', style: `--c:var(--${['purple', 'blue', 'green', 'orange', 'pink', 'cyan'][fams.findIndex((f) => f[0] === fam) % 6]})` }, title));
    out.push(h('div', { class: 'grid' }, list.map(card)));
  }
  $('#cards').replaceChildren(...(out.length ? out : [h('p', { text: 'No template matches.' })]));
}
$('#q').addEventListener('input', () => buildGallery());
function card(t) {
  const thumb = t.samples.find((s) => s.thumb)?.thumb;
  const href = (s) => `#/t/${encodeURIComponent(t.name)}` + (s ? `?s=${encodeURIComponent(s.file)}` : '');
  return h('article', { class: 'tcard' },
    h('a', { class: 'th', href: href(t.samples[0]), 'aria-hidden': 'true', tabindex: '-1' }, thumb ? h('img', { src: thumb, alt: '', loading: 'lazy' }) : h('span', { class: 'ph', text: t.name })),
    h('div', { class: 'bd' },
      h('h3', {}, h('a', { href: href(t.samples[0]), style: 'color:inherit;text-decoration:none' }, nice(t.name.split('/')[1]))),
      h('div', { class: 'meta', text: `${t.name} · ${t.size}${t.pptx ? ' · PPTX' : ''}` }),
      h('p', { text: t.about }),
      t.samples.length > 1 ? h('div', { class: 'start' }, t.samples.slice(0, 6).map((s) => h('a', { class: 'btn sm', href: href(s), text: s.title.replace(/^Agency 2026:?\s*/, '').slice(0, 28) || 'Sample' }))) : null));
}
const LABELS = { headline: 'Headline', sub: 'Subtitle', cta: 'Call to action', titleSize: 'Title size (px)', seed: 'Art arrangement (seed)',
  url: 'Link (QR code)', qr: 'QR link', kicker: 'Kicker (small line above the title)', label: 'Label', notes: 'Speaker notes', src: 'Image', alt: 'Image description (alt text)', preset: 'Preset' };
const nice = (k) => LABELS[k] ?? String(k).replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

// ---------- editor ----------
async function openEditor(name, sampleFile) {
  CUR = CAT.find((t) => t.name === name);
  if (!CUR) { location.hash = '#/'; return; }
  $('#gallery').hidden = true; $('#editor').hidden = false;
  $('#e-fam').textContent = `${CUR.familyTitle} · ${CUR.size}`; $('#e-title').textContent = nice(CUR.name.split('/')[1]); $('#e-about').textContent = CUR.about;
  document.title = `${nice(CUR.name.split('/')[1])} · Agency Studio`;
  $('#doc').textContent = CUR.doc || 'No field guide in the template header.';
  const sel = $('#sample'); sel.replaceChildren(...CUR.samples.map((s) => h('option', { value: s.file, text: s.title })));
  const file = sampleFile && CUR.samples.some((s) => s.file === sampleFile) ? sampleFile : CUR.samples[0]?.file;
  sel.value = file ?? '';
  DATA = file ? await api('/api/sample?file=' + encodeURIComponent(file)) : { template: CUR.name };
  $('#cls').value = (DATA.classification || 'UNCLASSIFIED').toUpperCase();
  clsWarn(); buildForm(); clearPreview(); $('#main').focus(); schedule(0);
}
$('#sample').addEventListener('change', (e) => { location.hash = `#/t/${encodeURIComponent(CUR.name)}?s=${encodeURIComponent(e.target.value)}`; });
$('#cls').addEventListener('change', (e) => { DATA.classification = e.target.value; clsWarn(); syncRaw(); schedule(); });
function clsWarn() {
  const v = $('#cls').value, w = $('#cls-warn');
  w.hidden = v === 'UNCLASSIFIED';
  w.textContent = v === 'PROTECTED B' ? 'Protected B: the marking is printed on every page. Keep drafts and downloads in approved storage, and do not paste this content into other tools. Nothing is sent outside this service.'
    : 'Protected A: the marking is printed on every page. Keep drafts and downloads in approved storage. Nothing is sent outside this service.';
}
// tabs
for (const [btn, panel] of [['#tab-form', '#form'], ['#tab-raw', '#raw-wrap'], ['#tab-doc', '#doc']]) {
  $(btn).addEventListener('click', () => {
    for (const [b, p] of [['#tab-form', '#form'], ['#tab-raw', '#raw-wrap'], ['#tab-doc', '#doc']]) { $(b).setAttribute('aria-selected', String(b === btn)); $(p).hidden = b !== btn; }
    if (btn === '#tab-raw') syncRaw();
  });
}
const syncRaw = () => { $('#raw').value = JSON.stringify(DATA, null, 2); };
$('#raw-apply').addEventListener('click', () => {
  try { const d = JSON.parse($('#raw').value); if (d.template !== CUR.name) throw new Error(`"template" must stay "${CUR.name}"`); DATA = d; $('#raw-err').textContent = ''; buildForm(); schedule(0); }
  catch (e) { $('#raw-err').textContent = e.message; }
});

// path helpers: a.b[0].c (the same notation the lint uses)
const join = (p, k) => (typeof k === 'number' ? `${p}[${k}]` : p ? `${p}.${k}` : k);
const parts = (p) => p.match(/[^.[\]]+/g).map((x) => (/^\d+$/.test(x) ? +x : x));
const getAt = (p) => parts(p).reduce((o, k) => o?.[k], DATA);
const setAt = (p, v) => { const ks = parts(p); let o = DATA; for (const k of ks.slice(0, -1)) o = o[k]; o[ks.at(-1)] = v; };

const LONG = /^(text|lead|intro|body|label|sub|subtitle|note|notes|small|quote|desc|description|caption|support|about|summary|narration|title|headline)$/i;
const isAccentKey = (k, parentKey) => /accent$/i.test(String(k)) || (/^(bus|colors|colours|accents)$/i.test(String(parentKey)) && typeof k === 'number');
const isImageKey = (k) => /^(src|image|photo|logo|img)$/i.test(String(k));

function buildForm() {
  const f = $('#form'); f.replaceChildren();
  for (const [k, v] of Object.entries(DATA)) {
    if (k.startsWith('$')) { if (typeof v === 'string') f.append(h('div', { class: 'note-box', text: v })); continue; }
    if (k === 'template' || k === 'classification') continue;
    f.append(field(k, v, k, null, k === 'name' ? 'File name' : undefined));
  }
  syncRaw();
}
function field(k, v, p, parentKey, label) {
  const L = label ?? nice(k);
  if (Array.isArray(v)) return arrayField(k, v, p);
  if (v && typeof v === 'object') {
    const fs = h('fieldset', { class: 'grp' }, h('legend', { text: nice(k) }));
    for (const [ck, cv] of Object.entries(v)) { if (String(ck).startsWith('$')) { if (typeof cv === 'string') fs.append(h('div', { class: 'note-box', text: cv })); continue; } fs.append(field(ck, cv, join(p, ck), k)); }
    return fs;
  }
  const id = 'f-' + p.replace(/[^a-z0-9]/gi, '_');
  const wrap = h('div', { class: 'f', 'data-path': p });
  const lab = h('label', { class: 'lab', for: id }, L);
  let input;
  if (k === 'type') { return h('div', { class: 'f', 'data-path': p }, h('span', { class: 'lab' }, 'Type', h('span', { class: 'hint', text: String(v) }))); }
  if (typeof v === 'boolean') {
    input = h('input', { type: 'checkbox', id, checked: v, onchange: (e) => upd(p, e.target.checked) });
    return h('div', { class: 'f', 'data-path': p }, h('label', { class: 'lab', for: id, style: 'justify-content:flex-start;gap:8px' }, input, L));
  }
  if (typeof v === 'number') input = h('input', { type: 'number', id, value: v, step: 'any', oninput: (e) => upd(p, e.target.value === '' ? 0 : +e.target.value) });
  else if (isAccentKey(k, parentKey) && (TOK.accents.includes(v) || v === '' || !v.includes(' '))) {
    const sw = h('span', { class: 'sw', style: `background:${TOK.colors[v] ?? 'transparent'}` });
    input = h('select', { id, onchange: (e) => { sw.style.background = TOK.colors[e.target.value] ?? 'transparent'; upd(p, e.target.value); } },
      [...new Set([...TOK.accents, v])].filter(Boolean).map((a) => h('option', { value: a, selected: a === v, text: a })));
    wrap.append(lab, h('div', { class: 'accent-row' }, sw, input), h('div', { class: 'msg' }));
    return wrap;
  } else if (k === 'preset' && parentKey == null) input = h('select', { id, onchange: (e) => upd(p, e.target.value) }, [...new Set(['event', 'day1', 'day2', 'day3', 'cfd', 'custom', v])].map((g) => h('option', { value: g, selected: g === v, text: { event: 'Event (all three days)', day1: 'Day 1: The Art of the Possible', day2: 'Day 2: Research & the Future AI Economy', day3: 'Day 3: Alberta Velocity', cfd: 'Call for demos', custom: 'Custom (use the fields below)' }[g] ?? g })));
  else if (k === 'ground') input = h('select', { id, onchange: (e) => upd(p, e.target.value) }, [...new Set([...TOK.grounds, v])].map((g) => h('option', { value: g, selected: g === v, text: g })));
  else if (isImageKey(k)) {
    input = h('input', { type: 'text', id, value: String(v ?? '').startsWith('data:') ? '(uploaded image)' : v ?? '', oninput: (e) => upd(p, e.target.value) });
    const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/svg+xml', 'aria-label': `Upload image for ${L}`, onchange: (e) => {
      const fl = e.target.files[0]; if (!fl) return; if (fl.size > 4e6) { alert('Images up to 4 MB, please.'); return; }
      const r = new FileReader(); r.onload = () => { upd(p, r.result); input.value = '(uploaded image) ' + fl.name; }; r.readAsDataURL(fl); } });
    wrap.append(lab, h('div', { class: 'img-row' }, input, file), h('div', { class: 'msg' }));
    return wrap;
  } else {
    const s = String(v ?? '');
    const long = s.length > 48 || s.includes('\n') || LONG.test(String(k));
    input = long ? h('textarea', { id, rows: Math.min(8, Math.max(2, Math.ceil(s.length / 46) + (s.match(/\n/g) || []).length)), oninput: (e) => upd(p, e.target.value) }) : h('input', { type: 'text', id, value: s, oninput: (e) => upd(p, e.target.value) });
    if (long) { input.value = s; lab.append(h('span', { class: 'hint', text: '**bold**  ==highlight==' })); }
  }
  wrap.append(lab, input, h('div', { class: 'msg' }));
  return wrap;
}
function arrayField(k, arr, p) {
  const fs = h('fieldset', { class: 'grp' }, h('legend', { text: `${nice(k)} (${arr.length})` }));
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; buildForm(); schedule(); };
  const del = (i) => { arr.splice(i, 1); buildForm(); schedule(); };
  arr.forEach((item, i) => {
    const ip = join(p, i);
    const ctl = h('span', { class: 'ctl' },
      h('button', { type: 'button', title: 'Move up', 'aria-label': `Move item ${i + 1} up`, onclick: (e) => { e.preventDefault(); move(i, -1); } }, '↑'),
      h('button', { type: 'button', title: 'Move down', 'aria-label': `Move item ${i + 1} down`, onclick: (e) => { e.preventDefault(); move(i, 1); } }, '↓'),
      h('button', { type: 'button', title: 'Remove', 'aria-label': `Remove item ${i + 1}`, onclick: (e) => { e.preventDefault(); del(i); } }, '✕'));
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const label = item.title ?? item.headline ?? item.text ?? item.label ?? item.name ?? item.value ?? item.when ?? item.day ?? '';
      const d = h('details', { class: 'item', 'data-path': ip, open: arr.length <= 4 ? true : null },
        h('summary', {}, h('span', { class: 'st', text: `${i + 1}. ${String(label).replace(/[*=]/g, '').slice(0, 60)}` }), item.type ? h('span', { class: 'typ', text: item.type }) : null, ctl),
        h('div', { class: 'in' }, Object.entries(item).filter(([ck]) => !String(ck).startsWith('$')).map(([ck, cv]) => field(ck, cv, join(ip, ck), k))));
      fs.append(d);
    } else fs.append(h('div', { class: 'prim-row' }, field(i, item, ip, k, `${nice(k).replace(/s$/, '')} ${i + 1}`), ctl));
  });
  fs.append(h('button', { type: 'button', class: 'btn sm add', onclick: () => { arr.push(structuredClone(arr.at(-1) ?? '')); buildForm(); schedule(); } }, `+ Add ${nice(k).replace(/s$/, '').toLowerCase()}`));
  return fs;
}
function upd(p, v) { setAt(p, v); if (!$('#raw-wrap').hidden) syncRaw(); schedule(); }

// ---------- render ----------
function schedule(ms) { clearTimeout(timer); if ($('#auto').checked || ms === 0) timer = setTimeout(go, ms ?? (CUR?.name === 'slides/deck' ? 2200 : 1200)); }
$('#go').addEventListener('click', () => go());
addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !$('#editor').hidden) { e.preventDefault(); go(); } });
function clearPreview() { LAST = null; page = 0; $('#stage').replaceChildren(h('div', { class: 'empty', text: 'Your preview appears here.' })); $('#strip').replaceChildren(); $('#downloads').replaceChildren(); $('#findings').replaceChildren(); }

async function go() {
  clearTimeout(timer);
  const seq = ++renderSeq;
  const st = $('#status'); st.className = 'status busy'; st.textContent = 'Rendering…'; $('#stage').classList.add('stale'); $('#go').disabled = true;
  try {
    const r = await api('/api/render', { content: DATA });
    if (seq !== renderSeq) return;   // a newer edit is on its way
    LAST = r; page = Math.min(page, r.files.filter((f) => f.kind === 'png').length - 1); if (page < 0) page = 0;
    showPreview(); showFindings(); showDownloads();
    st.className = 'status'; st.textContent = `Rendered in ${(r.ms / 1000).toFixed(1)} s`;
  } catch (e) { if (seq === renderSeq) { st.className = 'status'; st.textContent = ''; $('#findings').replaceChildren(h('div', { class: 'fd error' }, h('b', { text: 'Error' }), e.message)); } }
  finally { if (seq === renderSeq) { $('#stage').classList.remove('stale'); $('#go').disabled = false; } }
}
function showPreview() {
  const pngs = LAST.files.filter((f) => f.kind === 'png'), bust = '?t=' + LAST.id;
  const cur = pngs[page];
  $('#stage').replaceChildren(cur ? h('img', { src: cur.url + bust, alt: `Preview of page ${page + 1} of ${pngs.length}` }) : h('div', { class: 'empty', text: 'No image output.' }));
  $('#strip').replaceChildren(...(pngs.length > 1 ? pngs.map((f, i) => h('button', { type: 'button', role: 'listitem', 'aria-current': String(i === page), 'aria-label': `Page ${i + 1}`, onclick: () => { page = i; showPreview(); } }, h('img', { src: f.url + bust, alt: '' }))) : []));
}
function showDownloads() {
  const d = $('#downloads'); d.replaceChildren();
  const pdf = LAST.files.find((f) => f.kind === 'pdf'), pngs = LAST.files.filter((f) => f.kind === 'png');
  if (pdf) d.append(h('a', { class: 'btn primary', href: pdf.url + '?download', text: 'Download PDF' }));
  if (pngs.length === 1) d.append(h('a', { class: 'btn', href: pngs[0].url + '?download', text: 'Download PNG' }));
  else pngs.forEach((f, i) => i === page && d.append(h('a', { class: 'btn', href: f.url + '?download', text: `Download PNG (page ${i + 1} of ${pngs.length})` })));
  if (LAST.pptx) {
    const b = h('button', { class: 'btn', type: 'button', text: 'Make PowerPoint' });
    b.onclick = async () => { b.disabled = true; b.textContent = 'Building PowerPoint…'; try { const r = await api('/api/pptx', { job: LAST.id }); location.href = r.url + '?download'; b.textContent = 'Download PowerPoint again'; b.onclick = () => (location.href = r.url + '?download'); } catch (e) { b.textContent = 'PowerPoint failed: ' + e.message; } b.disabled = false; };
    d.append(b);
  }
}
function showFindings() {
  for (const el of document.querySelectorAll('.f.bad, .f.warned, .f.ph-left')) { el.classList.remove('bad', 'warned', 'ph-left'); const m = el.querySelector('.msg'); if (m) m.textContent = ''; }
  const out = [];
  const jump = (field) => h('button', { class: 'jump', type: 'button', onclick: () => focusField(field), text: 'Show field' });
  for (const f of LAST.faults) out.push(h('div', { class: 'fd error' }, h('b', { text: /^a11y/.test(f) ? 'Access' : 'Fit' }), f.replace(/^a11y: /, '')));
  for (const w of LAST.warnings ?? []) out.push(h('div', { class: 'fd warn' }, h('b', { text: 'Access' }), w.replace(/^a11y: /, '')));
  for (const l of LAST.lint) {
    const sev = l.severity === 'error' ? 'error' : 'warn';
    out.push(h('div', { class: 'fd ' + sev }, h('b', { text: sev === 'error' ? 'Writing' : 'Check' }), `${l.rule}: “${l.text}”`, l.field ? jump(l.field) : null));
    mark(l.field, sev === 'error' ? 'bad' : 'warned', l.rule);
  }
  if (LAST.placeholders.length) {
    out.push(h('div', { class: 'fd warn' }, h('b', { text: 'Placeholder' }), `${LAST.placeholders.length} field${LAST.placeholders.length > 1 ? 's' : ''} still hold sample text (highlighted). Replace ${LAST.placeholders.length > 1 ? 'them' : 'it'} before you share this.`, jump(LAST.placeholders[0].field)));
    for (const ph of LAST.placeholders) mark(ph.field, 'ph-left');
  }
  if (LAST.qrExpected.length) {
    const good = LAST.qr.filter((q) => q.ok);
    out.push(good.length ? h('div', { class: 'fd ok' }, h('b', { text: 'QR' }), `Decodes to ${good[0].decodes}. Scan the printed piece with a phone before it ships.`)
      : h('div', { class: 'fd info' }, h('b', { text: 'QR' }), 'The QR code was not read from the full page automatically. Download the PNG and scan it with a phone before it ships.'));
  }
  if (!LAST.faults.length && !LAST.lint.some((l) => l.severity === 'error')) out.unshift(h('div', { class: 'fd ok' }, h('b', { text: 'Checks' }), 'Fits its pages, fonts loaded, no writing errors.'));
  $('#findings').replaceChildren(...out);
}
function fieldEl(path) { return document.querySelector(`.f[data-path="${CSS.escape(path)}"]`) || document.querySelector(`[data-path="${CSS.escape(path)}"]`); }
function mark(path, cls, msg) {
  if (!path) return; const el = fieldEl(path); if (!el) return;
  if (el.classList.contains('f')) { el.classList.add(cls); const m = el.querySelector('.msg'); if (m && msg && !m.textContent) m.textContent = msg; }
  let d = el.closest('details'); while (d) { d.open = true; d = d.parentElement.closest('details'); }
}
function focusField(path) {
  $('#tab-form').click();
  const el = fieldEl(path); if (!el) return;
  let d = el.closest('details'); while (d) { d.open = true; d = d.parentElement.closest('details'); }
  el.scrollIntoView({ block: 'center', behavior: 'smooth' }); (el.querySelector('input,textarea,select') || el).focus({ preventScroll: true });
}
