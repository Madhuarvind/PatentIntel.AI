import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { normalizePatentNumber } from './src/services/patentNormalizer.ts'
import { parseGooglePatentsHtmlServer } from './src/services/patentHtmlParser.ts'

// Vite Backend Server Plugin (Node environment - no browser CORS limitations!)
function patentBackendPlugin(): Plugin {
  return {
    name: 'patent-backend-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/patents/resolve')) {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const identifier = urlObj.searchParams.get('identifier') || '';
          
          if (!identifier) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, documentType: 'PATENT', errorCode: 'INVALID_IDENTIFIER', message: 'Missing identifier parameter' }));
            return;
          }

          let normalizedId: string;
          try {
            normalizedId = normalizePatentNumber(identifier).normalizedInput;
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, documentType: 'PATENT', errorCode: 'INVALID_IDENTIFIER', message: 'Invalid patent publication number' }));
            return;
          }

          console.log(`[BACKEND SERVER API] Resolving patent identifier: ${normalizedId}`);

          try {
            const targetUrl = `https://patents.google.com/patent/${normalizedId}/en`;
            const proxyRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml'
              }
            });

            if (proxyRes.ok) {
              const html = await proxyRes.text();
              const parsed = parseGooglePatentsHtmlServer(html, normalizedId);
              if (parsed && parsed.title) {
                console.log(`[BACKEND SERVER API] Successfully resolved ${normalizedId} -> "${parsed.title}"`);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, documentType: 'PATENT', patent: parsed }));
                return;
              }
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              documentType: 'PATENT',
              errorCode: 'PATENT_NOT_FOUND',
              message: `Patent record "${identifier}" (${normalizedId}) was not found in official patent registries.`
            }));
            return;
          } catch (err: any) {
            console.error(`[BACKEND SERVER API] Error resolving ${normalizedId}:`, err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              documentType: 'PATENT',
              errorCode: 'SOURCE_UNAVAILABLE',
              message: `Patent source unavailable: ${err.message}`
            }));
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), patentBackendPlugin()],
});
