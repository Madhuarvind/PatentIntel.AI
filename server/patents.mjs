import { authenticatedUser } from './auth.mjs';
import { send } from './http.mjs';
import { createPatentSearchHandler } from './patent-search.mjs';
import { normalizePatentNumber } from '../src/services/patentNormalizer.ts';
import { parseGooglePatentsHtmlServer } from '../src/services/patentHtmlParser.ts';

const MAX_BYTES = 4 * 1024 * 1024;
export function createPatentHandler(db, env = process.env, fetchSource = fetch) {
  const search = createPatentSearchHandler(db, env, fetchSource);
  let active = 0;
  return async (req, res) => {
    const error = (status, errorCode, message) => send(res, status, { success: false, documentType: 'PATENT', errorCode, message });
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/patents/search') return search(req, res);
      if (url.pathname !== '/api/patents/resolve') return error(404, 'NOT_FOUND', 'Patent endpoint not found.');
      if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return error(405, 'METHOD_NOT_ALLOWED', 'Use GET for patent lookup.'); }
      if (!await authenticatedUser(db, req, env)) return error(401, 'AUTH_REQUIRED', 'Sign in before looking up a patent.');
      let identifier;
      try {
        const raw = url.searchParams.get('identifier') || '';
        if (raw.length > 100) throw Error();
        identifier = normalizePatentNumber(raw).normalizedInput;
      } catch { return error(400, 'INVALID_IDENTIFIER', 'Enter a valid patent publication number.'); }
      if (active >= 4) return error(503, 'SOURCE_BUSY', 'Patent lookup is busy. Please retry shortly.');
      active++;
      try {
        // The client supplies an identifier, never a URL. Redirects cannot escape this source.
        const response = await fetchSource(`https://patents.google.com/patent/${identifier}/en`, {
          redirect: 'error', signal: AbortSignal.timeout(15000),
          headers: { Accept: 'text/html', 'User-Agent': 'PatentIntel/1.0 (research source lookup)' }
        });
        if (response.status === 404) { await response.body?.cancel(); return error(404, 'PATENT_NOT_FOUND', `No record was found for ${identifier}.`); }
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
          await response.body?.cancel();
          return error(502, 'SOURCE_UNAVAILABLE', 'Patent source returned an unavailable or unsupported response.');
        }
        if (Number(response.headers.get('content-length')) > MAX_BYTES) {
          await response.body?.cancel();
          return error(502, 'SOURCE_TOO_LARGE', 'Patent source exceeded the import size limit.');
        }
        const chunks = []; let size = 0;
        for await (const chunk of response.body || []) {
          size += chunk.length;
          if (size > MAX_BYTES) return error(502, 'SOURCE_TOO_LARGE', 'Patent source exceeded the import size limit.');
          chunks.push(chunk);
        }
        const patent = parseGooglePatentsHtmlServer(Buffer.concat(chunks).toString('utf8'), identifier);
        if (!patent) return error(502, 'SOURCE_UNVERIFIED', 'Source did not contain a matching publication identity and title.');
        return send(res, 200, { success: true, documentType: 'PATENT', patent });
      } catch {
        return error(502, 'SOURCE_UNAVAILABLE', 'Patent source could not be reached. Please retry; no substitute evidence was imported.');
      } finally { active--; }
    } catch { return error(503, 'SERVICE_UNAVAILABLE', 'Patent lookup is temporarily unavailable. Please retry.'); }
  };
}
