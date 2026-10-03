import { authenticatedUser } from './auth.mjs';
import { send } from './http.mjs';

const MAX_BYTES = 2 * 1024 * 1024;
export function createPatentSearchHandler(db, env = process.env, fetchSource = fetch) {
  let active = 0;
  return async (req, res) => {
    const error = (status, code, message) => send(res, status, { success: false, code, message, patents: [] });
    try {
      if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return error(405, 'METHOD_NOT_ALLOWED', 'Use GET for patent search.'); }
      if (!await authenticatedUser(db, req, env)) return error(401, 'AUTH_REQUIRED', 'Sign in before searching patent sources.');
      const query = new URL(req.url, 'http://localhost').searchParams.get('query')?.trim();
      if (!query || query.length > 500) return error(400, 'INVALID_QUERY', 'Enter a patent search query of 1–500 characters.');
      if (!env.PATENTSVIEW_API_KEY?.trim()) return error(503, 'SOURCE_NOT_CONFIGURED', 'Patent keyword search is not configured. An administrator must configure the server PatentsView API key. You can still look up a patent by publication number.');
      if (active >= 4) return error(503, 'SOURCE_BUSY', 'Patent search is busy. Retry shortly.');
      active++;
      try {
        const response = await fetchSource('https://search.patentsview.org/api/v1/patent/', {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12000),
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Api-Key': env.PATENTSVIEW_API_KEY },
          body: JSON.stringify({ q: { _text_any: { patent_title: query } }, f: ['patent_id', 'patent_title', 'patent_date'], o: { size: 10 } })
        });
        if (!response.ok || !response.headers.get('content-type')?.includes('json') || Number(response.headers.get('content-length')) > MAX_BYTES) {
          await response.body?.cancel();
          return error(502, 'SOURCE_UNAVAILABLE', 'PatentsView could not complete the search. Check server configuration or retry later.');
        }
        const chunks = []; let size = 0;
        for await (const chunk of response.body || []) {
          size += chunk.length;
          if (size > MAX_BYTES) return error(502, 'SOURCE_TOO_LARGE', 'Patent source exceeded the response limit.');
          chunks.push(chunk);
        }
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (data.error === true || !Array.isArray(data.patents) || data.patents.length > 10) throw Error();
        const patents = data.patents.map(p => {
          if (typeof p.patent_id !== 'string' || !/^(?:\d{6,12}|D\d{5,9}|RE\d{4,8}|PP\d{4,8})$/.test(p.patent_id) || typeof p.patent_title !== 'string' || !p.patent_title.trim()) throw Error();
          return { patent_number: p.patent_id, patent_title: p.patent_title, patent_date: typeof p.patent_date === 'string' ? p.patent_date : '' };
        });
        send(res, 200, { success: true, patents, provider: 'PatentsView', retrievedAt: new Date().toISOString(), coverage: 'Grant metadata and title search only; claims and full text are not retrieved.' });
      } catch { return error(502, 'SOURCE_UNAVAILABLE', 'Patent source returned unavailable or invalid data. Retry later; no substitute records were created.'); }
      finally { active--; }
    } catch { return error(503, 'SERVICE_UNAVAILABLE', 'Patent search is temporarily unavailable. Retry shortly.'); }
  };
}
