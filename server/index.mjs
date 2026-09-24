import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { openDatabase } from './database.mjs';
import { createAuthHandler } from './auth.mjs';

const db = await openDatabase();
const auth = await createAuthHandler(db);
const root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.url.startsWith('/api/auth/')) return auth(req, res);
  if (req.url === '/health') {
    try { await db.query('SELECT 1'); res.end('ok'); } catch { res.statusCode = 503; res.end('unavailable'); } return;
  }
  if (req.url.startsWith('/api/')) { res.statusCode = 404; res.end('API not configured'); return; }
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
server.requestTimeout = 15000;
server.headersTimeout = 15000;
server.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () => console.log('Authentication server ready.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close(async () => { await db.close(); process.exit(0); }); server.closeIdleConnections(); });
