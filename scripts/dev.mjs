import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { openDatabase } from '../server/database.mjs';
import { createAuthHandler } from '../server/auth.mjs';

// Run auth inside Vite's process so a frontend cannot silently outlive its API.
export async function startDevelopmentServer({ env = process.env, port, configFile } = {}) {
  if (env.NODE_ENV === 'production') throw new Error('Use npm start for production.');
  const origin = new URL(env.APP_ORIGIN || `http://localhost:${port || 5173}`);
  if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname)) {
    throw new Error('Local APP_ORIGIN must use http://localhost or http://127.0.0.1.');
  }
  const frontendPort = Number(origin.port || 80);
  if (port !== undefined && Number(port) !== frontendPort) {
    throw new Error('The --port value must match APP_ORIGIN in .env.');
  }
  let db, server;
  let closing;
  const close = () => closing ||= (async () => {
    try { await server?.close(); } finally { await db?.close(); }
  })();
  try {
    server = await createServer({
      ...(configFile === undefined ? {} : { configFile }),
      server: { host: origin.hostname, port: frontendPort, strictPort: true },
      plugins: [{
        name: 'local-authentication',
        // configureServer middleware runs before Vite's proxy and HTML fallback.
        async configureServer(vite) {
          db = await openDatabase(env);
          const auth = await createAuthHandler(db, { ...env, APP_ORIGIN: origin.origin });
          vite.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/api/auth/')) return auth(req, res);
            next();
          });
        }
      }]
    });
    await server.listen();
    return { server, close, origin: origin.origin };
  } catch (error) {
    await close();
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { port: { type: 'string' } } });
    const app = await startDevelopmentServer({ port: values.port });
    console.log(`Frontend and authentication ready at ${app.origin}`);
    console.log('Stop with Ctrl+C to close the local database cleanly.');
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, async () => { await app.close(); process.exit(0); });
    }
  } catch (error) {
    console.error(`Local startup failed: ${error.message}`);
    console.error('Stop other local API/dev processes and check the database folder is writable.');
    process.exitCode = 1;
  }
}
