// Showcase film server: serves the kit engine (/kit/), the Agency brand files (/brand/), npm packages (/vendor/) and one film project.
//   node server.mjs --project <film dir> [--port 3222]
// Project layout (made by tools/new-film.mjs): web/ (timeline.js, optional stage.js, styles), capture/, assets/, narration/, prep/,
// film.config.json ({ "title", "dur", "fps", "mounts": { "/data/": "../some/repo/data/" } }).
// Optional public tile proxy for the map module: /tiles/{bm|night|lights|dem}/z/x/y (NASA GIBS, Mapzen terrain), cached on disk.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const PROJECT = path.resolve(arg('project', process.env.FILM_PROJECT || '.'));

// brand files: the film's own copy (cloud image), else the design repo this kit lives in (showcase/kit -> ../../brand), else $AGENCY_BRAND
const BRAND = process.env.AGENCY_BRAND || [path.join(PROJECT, 'brand'), path.resolve(KIT, '../../brand'), path.join(KIT, 'brand')].find(p => fs.existsSync(p));
const cfgFile = path.join(PROJECT, 'film.config.json');
const CFG = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {};
// the film's own port (tools/new-film.mjs picks a free one per film), so films served at the same time never collide
const PORT = Number(arg('port', process.env.FILM_PORT || CFG.ports?.server || 3222));

const MOUNTS = [
  ['/kit/', path.join(KIT, 'web/')],
  ['/vendor/', path.join(KIT, 'node_modules/')],
  ['/brand/', (BRAND || path.join(KIT, 'brand')) + '/'],
  ...Object.entries(CFG.mounts || {}).map(([k, v]) => [k, path.resolve(PROJECT, v) + '/']),
  ['/capture/', path.join(PROJECT, 'capture/')],
  ['/assets/', path.join(PROJECT, 'assets/')],
  ['/narration/', path.join(PROJECT, 'narration/')],
  ['/prep/', path.join(PROJECT, 'prep/')],
  ['/film.config.json', cfgFile],
  ['/', path.join(PROJECT, 'web/')],
  ['/', path.join(KIT, 'web/')], // fallback: the kit's index.html
];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webm': 'video/webm', '.mp4': 'video/mp4', '.bin': 'application/octet-stream' };

// ---- public tile proxy (map module only)
const TILES = {
  bm: (z, x, y) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/2004-08-01/GoogleMapsCompatible_Level8/${z}/${y}/${x}.jpeg`,
  night: (z, x, y) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/${z}/${y}/${x}.png`,
  dem: (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
};
const CACHE = path.join(PROJECT, 'cache');
const inflight = new Map();
async function tile(kind, z, x, y) {
  const ext = kind === 'bm' ? 'jpg' : 'png', file = path.join(CACHE, kind, String(z), String(x), `${y}.${ext}`);
  if (fs.existsSync(file)) return fs.promises.readFile(file);
  if (fs.existsSync(file + '.404')) return null;
  const key = `${kind}/${z}/${x}/${y}`;
  if (!inflight.has(key)) inflight.set(key, (async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try { const r = await fetch(TILES[kind](z, x, y));
        if (r.status === 404 || r.status === 400) { await fs.promises.mkdir(path.dirname(file), { recursive: true }); await fs.promises.writeFile(file + '.404', ''); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer()); await fs.promises.mkdir(path.dirname(file), { recursive: true });
        await fs.promises.writeFile(file + '.tmp', buf); await fs.promises.rename(file + '.tmp', file); return buf;
      } catch { await new Promise(r => setTimeout(r, 400 * (attempt + 1))); }
    }
    return null;
  })().finally(() => inflight.delete(key)));
  return inflight.get(key);
}
// night lights re-cut as a warm glow with alpha = brightness (Black Marble paints land blue-grey; lights are warm)
async function lightsTile(z, x, y) {
  const file = path.join(CACHE, 'lights', String(z), String(x), `${y}.png`);
  if (fs.existsSync(file)) return fs.promises.readFile(file);
  const src = await tile('night', z, x, y); if (!src) return null;
  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) { const r = data[i], g = data[i + 1], b = data[i + 2], lum = Math.max(r, g);
    let a = Math.max((lum - b) / 60, (Math.min(r, g, b) - 170) / 60); a = a < 0 ? 0 : a > 1 ? 1 : a; a = Math.pow(a, 0.8);
    out[o] = 255; out[o + 1] = 205 + 40 * a; out[o + 2] = 140 + 90 * a; out[o + 3] = Math.round(255 * a); }
  const buf = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  await fs.promises.mkdir(path.dirname(file), { recursive: true }); await fs.promises.writeFile(file, buf); return buf;
}

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const t = u.pathname.match(/^\/tiles\/(bm|night|lights|dem)\/(\d+)\/(\d+)\/(\d+)\.(?:jpg|png)$/);
    if (t) { const [, kind, z, x, y] = t; const buf = kind === 'lights' ? await lightsTile(+z, +x, +y) : await tile(kind, +z, +x, +y);
      if (!buf) { res.writeHead(fs.existsSync(path.join(CACHE, kind, z, x, `${y}.${kind === 'bm' ? 'jpg' : 'png'}.404`)) ? 404 : 502); return res.end(); }
      res.writeHead(200, { 'content-type': kind === 'bm' ? 'image/jpeg' : 'image/png', 'cache-control': 'max-age=86400' }); return res.end(buf); }
    for (const [prefix, target] of MOUNTS) {
      if (!u.pathname.startsWith(prefix)) continue;
      let file;
      if (!prefix.endsWith('/')) file = target; // a single-file mount
      else { const rel = decodeURIComponent(u.pathname.slice(prefix.length)) || 'index.html'; file = path.join(target, rel); if (!file.startsWith(target)) continue; }
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        // .geojson.gz / .json.gz (as some apps ship their layers): sent as JSON with gzip encoding, so the browser unpacks it
        const gz = /\.(geo)?json\.gz$/i.test(file);
        res.writeHead(200, { 'content-type': gz ? 'application/json' : (MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'), ...(gz ? { 'content-encoding': 'gzip' } : {}), 'cache-control': 'no-cache' });
        return fs.createReadStream(file).pipe(res);
      }
    }
    res.writeHead(404); res.end('not found');
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(PORT, '127.0.0.1', () => console.log(`film server http://127.0.0.1:${PORT}  project ${PROJECT}  brand ${BRAND || '(none found)'}`));
