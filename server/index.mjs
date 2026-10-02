import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { openDatabase } from './database.mjs';
import { createAuthHandler } from './auth.mjs';
import { createPilotHandler } from './pilot.mjs';
import { createPatentHandler } from './patents.mjs';

const db = await openDatabase();
let auth, pilot;
try { auth = await createAuthHandler(db); pilot = await createPilotHandler(db); }
catch (error) { await db.close(); throw error; }
const patents = createPatentHandler(db);
const root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
  }
  if (req.url.startsWith('/api/auth/')) return auth(req, res);
  if (req.url === '/health') {
    try { await db.query('SELECT 1'); res.end('ok'); } catch { res.statusCode = 503; res.end('unavailable'); } return;
  }
  if (req.url.startsWith('/api/patents/')) return patents(req, res);
  if (req.url.startsWith('/api/')) return pilot(req, res);
  if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root + sep)) throw Error();
    const bytes = await readFile(file);
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', extname(file) === '.html' ? 'no-store' : 'public, max-age=3600');
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.statusCode = 404; res.end('Not found'); }
});
server.requestTimeout = 60000;
server.headersTimeout = 15000;
server.once('error', async error => { console.error('Application listener failed:', error.code || 'INTERNAL'); await db.close(); process.exitCode = 1; });
server.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () => console.log('PatentIntel application ready.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close(async () => { await db.close(); process.exit(0); }); server.closeIdleConnections(); });
