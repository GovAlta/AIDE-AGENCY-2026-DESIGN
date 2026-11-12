// Film dev/render server: static files + an on-disk caching proxy for public basemap tiles.
// Everything the film page loads comes from this origin, so renders are repeatable once the cache is warm.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.FILM_PORT || 3222);
// FIBRE_PLANNER: a clone of GovAlta-Lab/AIDE-PAN-CANADIAN-FIBRE-NETWORK at 2610761 (its data/ folder feeds every layer).
// AGENCY_BRAND: the design repo's brand folder (default: this repo, four levels up). See ../README.md.
const PLANNER = process.env.FIBRE_PLANNER || path.join(ROOT, '../refs/fibre-network');
const BRAND_DIR = process.env.AGENCY_BRAND || [path.join(ROOT, '../../../../brand'), path.join(ROOT, '../refs/agency-design/brand')].find(p => fs.existsSync(p));
const MOUNTS = {
  '/data/': path.join(PLANNER, 'data/'),
  '/brand/': BRAND_DIR + '/',
  '/vendor/': path.join(ROOT, 'node_modules/'),
  '/prep/': path.join(ROOT, 'prep/'),
  '/assets/': path.join(ROOT, '../assets/'),
  '/narration/': path.join(ROOT, 'narration/'),
  '/': path.join(ROOT, 'web/'),
};
// Public-domain / open tile sources (credited on the end card and in NOTES.md).
const TILES = {
  bm: (z, x, y) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/2004-08-01/GoogleMapsCompatible_Level8/${z}/${y}/${x}.jpeg`,
  night: (z, x, y) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/${z}/${y}/${x}.png`,
  dem: (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
};
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.otf': 'font/otf', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.bin': 'application/octet-stream', '.wav': 'audio/wav' };

// 'lights': Black Marble night lights re-cut as a warm glow with alpha = brightness, so they sit on top of the graded day relief.
async function lightsTile(z, x, y) {
  const file = path.join(ROOT, 'cache', 'lights', String(z), String(x), `${y}.png`);
  if (fs.existsSync(file)) return fs.promises.readFile(file);
  const src = await tile('night', z, x, y);
  if (!src) return null;
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Black Marble paints land and snow blue-grey (b >= r, g) and lights warm (r, g > b): keep only the warm part, plus white-hot cores.
    const lum = Math.max(r, g);
    let a = Math.max((lum - b) / 60, (Math.min(r, g, b) - 170) / 60); a = a < 0 ? 0 : a > 1 ? 1 : a; a = Math.pow(a, 0.8);
    out[o] = 255; out[o + 1] = 205 + 40 * a; out[o + 2] = 140 + 90 * a; out[o + 3] = Math.round(255 * a);
  }
  const buf = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, buf);
  return buf;
}

const inflight = new Map();
async function tile(kind, z, x, y) {
  const ext = kind === 'bm' ? 'jpg' : 'png';
  const file = path.join(ROOT, 'cache', kind, String(z), String(x), `${y}.${ext}`);
  if (fs.existsSync(file)) return fs.promises.readFile(file);
  const key = `${kind}/${z}/${x}/${y}`;
  if (!inflight.has(key)) inflight.set(key, (async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const r = await fetch(TILES[kind](z, x, y));
        if (r.status === 404 || r.status === 400) { await fs.promises.mkdir(path.dirname(file), { recursive: true }); await fs.promises.writeFile(file + '.404', ''); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        await fs.promises.mkdir(path.dirname(file), { recursive: true });
        await fs.promises.writeFile(file + '.tmp', buf); await fs.promises.rename(file + '.tmp', file);
        return buf;
      } catch (e) { await new Promise(r => setTimeout(r, 400 * (attempt + 1))); }
    }
    return null;
  })().finally(() => inflight.delete(key)));
  return inflight.get(key);
}

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const ml = u.pathname.match(/^\/tiles\/lights\/(\d+)\/(\d+)\/(\d+)\.png$/);
    if (ml) { const buf = await lightsTile(+ml[1], +ml[2], +ml[3]); if (!buf) { res.writeHead(502); return res.end(); } res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'max-age=86400' }); return res.end(buf); }
    const m = u.pathname.match(/^\/tiles\/(bm|night|dem)\/(\d+)\/(\d+)\/(\d+)\.(?:jpg|png)$/);
    if (m) {
      const [, kind, z, x, y] = m;
      if (fs.existsSync(path.join(ROOT, 'cache', kind, z, x, `${y}.${kind === 'bm' ? 'jpg' : 'png'}.404`))) { res.writeHead(404); return res.end(); }
      const buf = await tile(kind, +z, +x, +y);
      if (!buf) { res.writeHead(fs.existsSync(path.join(ROOT, 'cache', kind, z, x, `${y}.${kind === 'bm' ? 'jpg' : 'png'}.404`)) ? 404 : 502); return res.end(); }
      res.writeHead(200, { 'content-type': kind === 'bm' ? 'image/jpeg' : 'image/png', 'cache-control': 'max-age=86400' });
      return res.end(buf);
    }
    for (const [prefix, dir] of Object.entries(MOUNTS)) {
      if (!u.pathname.startsWith(prefix)) continue;
      let rel = decodeURIComponent(u.pathname.slice(prefix.length)) || 'index.html';
      const file = path.join(dir, rel);
      if (!file.startsWith(dir)) break;
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
        return fs.createReadStream(file).pipe(res);
      }
    }
    res.writeHead(404); res.end('not found');
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(PORT, '127.0.0.1', () => console.log(`film server http://127.0.0.1:${PORT}`));
export const FILM_PORT = PORT;
