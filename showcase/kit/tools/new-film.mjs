// Starts a showcase film. Two ways in:
//   from an Agency 2026 inventory slot (the inventory is read, never written):
//     node tools/new-film.mjs 23 [--kind app|map|data|network|spatial] [--theme light|dark] [--slug short-name]
//   from scratch, for any project (no inventory needed):
//     node tools/new-film.mjs --name water-quality --title "North Saskatchewan Water Quality" --kind map [--brief brief.json]
//   options: --root <films dir> (default $FILMS_DIR, else <design repo>/../films), --inventory <path> (default $AGENCY_INVENTORY)
//   --kind app (default): real screenshots and recordings as plates.  map: the app's geographic data on the map stage.
//   network: an architecture explainer for laypersons on the network stage (what it is, architecture, flows, opportunities).
//   spatial: the same four-act explainer in the light neumorphic-glass look: the product's screens as glass windows in 3D space.
//          data: no app and no map; a kinetic data story (big numbers, ranked bars, re-drawn panels, a statement).
//   --theme light (default, the Agency default ground) or dark.
//   --brief <file.json>: in scratch mode, fields for brief.md and SENSITIVITY.md: { program, nature, folders: [{path, role}], repos,
//          live_urls, suggested_video_angle, gaps, sensitivity, slot } (the same keys as an inventory row; every key optional).
// Every per-film resource is namespaced (ports, Cloud Run job and image), so films made at the same time by different sessions never
// collide. Creates <root>/<NN>-<slug>/ with:
//   intake.json      the inventory row or the brief, copied as it was (reference only)
//   brief.md         the brief, prefilled
//   SENSITIVITY.md   the stated sensitivity, as binding rules for capture and narration
//   film.config.json slot, slug, ports (film server, receiver) from free ranges, Cloud Run job and image names
//   web/timeline.js  the starter timeline for the kind; narration/, capture/, assets/, prep/, NOTES.md, owner_lines.txt, PROCESS-LOG.md, storyboard.json
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { KIT, REPO, FILMS, INVENTORY, repoOk } from './lib/paths.mjs';
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const want = String(argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--')) || '').replace('#', '');
const KIND = arg('kind', 'app'), THEME = arg('theme', 'light');
if (!['app', 'map', 'data', 'network', 'spatial'].includes(KIND) || !['light', 'dark'].includes(THEME)) { console.error('--kind is app, map, data, network or spatial; --theme is light or dark'); process.exit(2); }
const NAME = arg('name');
if (!/^\d+$/.test(want) && !NAME) { console.error('usage: node tools/new-film.mjs <slot number>  |  node tools/new-film.mjs --name <slug> --title "<title>" [--brief brief.json]'); process.exit(2); }
const ROOT = path.resolve(arg('root', FILMS));
let row;
if (NAME) {
  const brief = arg('brief') ? JSON.parse(fs.readFileSync(arg('brief'), 'utf8')) : {};
  row = { slot: brief.slot || '', title: arg('title', brief.title || NAME), ...brief, _source: arg('brief') ? `brief ${path.resolve(arg('brief'))}` : 'new-film --name (no inventory row)' };
} else {
  const INV = arg('inventory', INVENTORY);
  if (!fs.existsSync(INV)) { console.error(`no inventory at ${INV}: pass --inventory <path>, set AGENCY_INVENTORY, or start from scratch with --name`); process.exit(1); }
  const inv = JSON.parse(fs.readFileSync(INV, 'utf8'));
  const rows = [...(inv.tracked || []), ...(inv.candidates || [])];
  row = rows.find(r => String(r.slot).replace('#', '') === want);
  if (!row) { console.error(`slot #${want} is not in ${INV}`); process.exit(1); }
}
const slotN = String(row.slot || want || '').replace('#', '');
const slot = slotN ? slotN.padStart(2, '0') : 'x';
const slug = (arg('slug') || NAME || row.title.replace(/\(.*?\)/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 4).join('-')).toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 28);
const dir = path.join(ROOT, slotN ? `${slot}-${slug}` : slug);
const tag = slotN ? slot : slug.slice(0, 20);   // names the Cloud Run job and image
if (fs.existsSync(dir)) { console.error(`${dir} already exists: open it, or pass --slug for a second film of this slot`); process.exit(1); }

// ports: a free port in each range that no other film folder has claimed and nothing is listening on
const claimed = new Set();
if (fs.existsSync(ROOT)) for (const d of fs.readdirSync(ROOT)) { try { const c = JSON.parse(fs.readFileSync(path.join(ROOT, d, 'film.config.json'))); for (const p of Object.values(c.ports || {})) claimed.add(+p); } catch {} }
const free = p => new Promise(r => { const s = net.createServer(); s.once('error', () => r(false)); s.listen(p, '0.0.0.0', () => s.close(() => r(true))); });
async function pick(lo, hi) { for (let p = lo; p <= hi; p++) if (!claimed.has(p) && await free(p)) { claimed.add(p); return p; } throw new Error(`no free port in ${lo}-${hi}`); }
const ports = { server: await pick(3300, 3399), receiver: await pick(4300, 4399) };
const env = fs.existsSync(path.join(process.env.HOME, '.sandbox-env')) ? fs.readFileSync(path.join(process.env.HOME, '.sandbox-env'), 'utf8') : '';
const dev = (env.match(/DEV_NAME="?([a-z0-9-]+)/) || [])[1] || process.env.DEV_NAME || 'dev';

fs.mkdirSync(dir, { recursive: true });
for (const d of ['web', 'narration', 'capture', 'assets', 'prep', 'out']) fs.mkdirSync(path.join(dir, d), { recursive: true });
const T = path.join(KIT, 'templates');
for (const f of ['NOTES.md', 'owner_lines.txt', 'PROCESS-LOG.md', 'storyboard.json', 'states.script.json']) fs.copyFileSync(path.join(T, f), path.join(dir, f === 'states.script.json' ? 'capture/states.script.json' : f));
fs.copyFileSync(path.join(T, `timeline-${KIND}.js`), path.join(dir, 'web/timeline.js'));
fs.writeFileSync(path.join(dir, 'narration/script.json'), JSON.stringify({ voice: JSON.parse(fs.readFileSync(path.join(T, 'script.json'))).voice, lines: [] }, null, 2));
fs.writeFileSync(path.join(dir, 'intake.json'), JSON.stringify(row, null, 1));
// SOP (owner 2026-11-12): the film folder is its own git repository, so the code that makes the film travels with its outputs.
// Frames, masters, images and videos stay out of git (deliver/BUILD.json records the kit commit and settings; REPRODUCE.md says how to regenerate).
fs.copyFileSync(path.join(T, 'REPRODUCE.md'), path.join(dir, 'REPRODUCE.md'));
fs.writeFileSync(path.join(dir, '.gitignore'), ['node_modules/', 'out/', '**/.farm-token', 'cache/', 'deliver/', '*.wav', '# farm and build logs can name the cloud project ID: never commit them', 'prep/*.log', '*.log', '# images and videos stay on this machine at full resolution; GitHub holds code and text only', '*.jpg', '*.jpeg', '*.png', '*.webp', '*.gif', '*.mp4', '*.mov', '*.webm', ''].join('\n'));
// this film's own circuit-trace art for the title and end cards (Agency rule: same seed = same art; record the seed)
{ const AG = REPO; if (!repoOk()) throw new Error('design repo not found');
  // the title card's text starts 200 px from the left (web/film.css .titlewrap), so its left-edge art stops short of it
  const TITLE_DEPTH = 'l=0.085,t=0.2,r=0.16,b=0.02';   // b: no art in the caption zone (owner, film #32: nothing draws over or under a caption)
  fs.mkdirSync(path.join(dir, 'web/art'), { recursive: true });
  // both grounds, same seeds: the UI picks traces-*.svg on dark scenes and traces-*-light.svg on light ones
  try { for (const [f, seed] of [['traces-title', `film-${tag}`], ['traces-end', `film-${tag}-end`]]) for (const [sfx, ground] of [['', 'night'], ['-light', 'board']])
      execFileSync('node', [path.join(AG, 'scripts/vectors.mjs'), 'traces', '--w', '1920', '--h', '1080', '--seed', seed, '--ground', ground, ...(f === 'traces-title' ? ['--depth', TITLE_DEPTH] : []), '--out', path.join(dir, 'web/art', f + sfx + '.svg')], { cwd: AG, stdio: 'ignore' });
    console.log(`traces: seeds film-${tag}, film-${tag}-end`); }
  catch { fs.rmSync(path.join(dir, 'web/art'), { recursive: true, force: true }); console.log('traces: Agency design repo not usable here, the kit default art is used'); } }
const label = slotN ? `#${slotN} ${row.title}` : row.title;
const config = { title: label, slot: slotN ? slot : '', slug, kind: KIND, theme: THEME, dur: KIND === 'map' ? 16 : KIND === 'data' ? 14 : KIND === 'network' ? 30 : KIND === 'spatial' ? 32 : 12, fps: 60, music: 'assets/<owner music>.mp3', musicGain: 0.62, duck: {},
  bandTitle: slotN ? `#${slotN} · ${row.title}` : row.title, sensitivity: row.sensitivity || 'not stated: ask the owner', mounts: {},
  ports, cloud: { job: `shell-${dev}-film-${tag}`, image: `shell-app-${dev}-film-${tag}:job` } };
if (KIND === 'map') Object.assign(config, { stage: '/kit/modules/map-stage.js',
  map: { start: { lng: -113.5, lat: 53.5, zoom: 7 }, layers: [], '$layers': 'declare each layer: { id, file: "/data/x.geojson" (mount the app data folder under "mounts"), type: fill|line|circle|heatmap|raster, accent: cyan|blue|green|..., progress: true for a line drawn on } (kit web/modules/map-stage.js)' },
  credits: 'Imagery: NASA Blue Marble · Data: <source and licence of every layer>' });
// network: an architecture explainer on the network stage (zones, nodes, traces, packets, permission gates, audit ledger, container spawn)
if (KIND === 'network') { const net = JSON.parse(fs.readFileSync(path.join(T, 'network.example.json'), 'utf8')); delete net.$comment;
  Object.assign(config, { stage: '/kit/modules/network-stage.js', network: net, '$network': 'EXAMPLE architecture: replace zones, nodes and edges with the real one, in plain words (kit web/modules/network-stage.js, web/modules/README.md)' }); }
// spatial: the product's screens as frosted-glass windows in 3D space (camera, depth of field, light lines, the wall of cards)
if (KIND === 'spatial') { const sp = JSON.parse(fs.readFileSync(path.join(T, 'spatial.example.json'), 'utf8')); delete sp.$comment;
  Object.assign(config, { stage: '/kit/modules/spatial-stage.js', space: sp, '$space': 'the windows, lines and wall are written in web/timeline.js (kit web/modules/spatial-stage.js, web/modules/README.md); the film supplies each window\'s HTML' }); }
fs.writeFileSync(path.join(dir, 'film.config.json'), JSON.stringify(config, null, 1));
const main = (row.folders || [])[0];
const L = (k, v) => `| ${k} | ${v ? String(v).replace(/\n/g, ' ').replace(/\|/g, '/') : ''} |`;
fs.writeFileSync(path.join(dir, 'brief.md'), `# Brief: ${label}

Prefilled from ${NAME ? 'the brief given to new-film' : 'the inventory row'} (intake.json, reference only). Lines marked OWNER come from the owner only.

| Item | Answer |
|---|---|
${L('Program', row.program)}
${L('Status / video readiness', `${row.status || ''} / ${row.video_readiness || ''}`)}
${L('Main folder', main ? `${main.path}: ${main.role}` : '')}
${L('Repos', (row.repos || []).join('; '))}
${L('Live URLs', (row.live_urls || []).join('; '))}
${L('What it is', row.nature)}
${L('Suggested video angle', row.suggested_video_angle)}
${L('Gaps', Array.isArray(row.gaps) ? row.gaps.join('; ') : row.gaps)}
${L('Sensitivity (binding, see SENSITIVITY.md)', row.sensitivity)}
${L('Existing videos', Array.isArray(row.videos) ? `${row.videos.length} listed in intake.json` : row.videos)}
| The one message (one sentence) | |
| Length ceiling | 2 to 5 minutes (match the music) |
| Music (OWNER) | |
| Classification (OWNER) | Unclassified unless the owner says otherwise |
| Closing line, asks, credit (OWNER) | ask; never draft them |
`);
const high = /\bhigh\b|protected|confidential|very high/i.test(row.sensitivity || '');
fs.writeFileSync(path.join(dir, 'SENSITIVITY.md'), `# Sensitivity: binding for this film

Inventory says: ${row.sensitivity || 'not stated. Ask the owner before capturing anything.'}

${high ? '**HIGH**: film only synthetic or redacted data. Seed the app with synthetic records before capture, or redact in the plate (overlays that replace the real values).' : 'Review every capture against the note above before it goes into a plate.'}

Never on screen or in narration, whatever the level: credentials or tokens, git remotes (\`git remote -v\`, .git/config), terminal output or logs with
project IDs, service accounts or keys, real personal names, emails or case details, internal URLs that are not meant to be shared.
Check every captured PNG and every frame sheet for these before rendering. If in doubt, leave it out and ask the owner.
`);
console.log(`film folder: ${dir}
  ${label}
  sensitivity: ${row.sensitivity || '(not stated)'}${high ? '  -> HIGH: synthetic or redacted data only' : ''}
  ports: film server ${ports.server}, receiver ${ports.receiver}; cloud job ${config.cloud.job}
next: read brief.md and SENSITIVITY.md, then follow the showcase-film skill from phase 2 (kind ${KIND}, theme ${THEME}; START-HERE.md in the kit).\nkit: ${KIT}`);

// make the film folder a git repository (no commit: the author commits once the brief and sensitivity are filled in)
try { (await import('node:child_process')).execSync('git init -q -b main', { cwd: dir, stdio: 'ignore' }); console.log(`git repository: ${dir} (commit as you go; see REPRODUCE.md)`); }
catch { console.log('git not available: keep this folder under version control by hand (REPRODUCE.md)'); }
