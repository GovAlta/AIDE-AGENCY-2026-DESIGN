// Receives rendered frames from Cloud Run job tasks over the private network and writes them to the frames folder.
//   FARM_TOKEN=<secret> node receiver.mjs --out ../film/out/frames [--port 3999]
// PUT /frame/<n>?token=...   body = JPEG      GET /ping
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const out = path.resolve(arg('out', '../film/out/frames')), port = +arg('port', 3999), token = process.env.FARM_TOKEN;
if (!token) throw new Error('FARM_TOKEN is required');
fs.mkdirSync(out, { recursive: true });
let n = 0; const t0 = Date.now();
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/ping') { res.writeHead(200); return res.end('pong'); }
  const m = u.pathname.match(/^\/frame\/(\d{1,6})$/);
  if (req.method !== 'PUT' || !m || u.searchParams.get('token') !== token) { res.writeHead(403); return res.end(); }
  const chunks = []; for await (const c of req) chunks.push(c); const buf = Buffer.concat(chunks);
  if (buf.length < 1000 || buf[0] !== 0xff || buf[1] !== 0xd8) { res.writeHead(400); return res.end('not a jpeg'); }
  const file = path.join(out, `f${m[1].padStart(6, '0')}.jpg`);
  fs.writeFileSync(file + '.tmp', buf); fs.renameSync(file + '.tmp', file);
  if (++n % 200 === 0) console.log(`${n} frames received, ${(n / ((Date.now() - t0) / 1000)).toFixed(2)} frames/s`);
  res.writeHead(200); res.end('ok');
}).listen(port, '0.0.0.0', () => console.log('receiver on', port, '->', out));
