import { authenticatedUser } from './auth.mjs';
import { readJson, send, text, fail } from './http.mjs';
import { createAcademicService } from './academic-service.ts';

const HOSTS = new Set(['api.openalex.org', 'api.semanticscholar.org', 'api.crossref.org']);
const MAX_BYTES = 4 * 1024 * 1024;
export function boundedAcademicFetch(fetchSource, statuses) {
  return async input => {
    const url = new URL(input);
    if (url.protocol !== 'https:' || !HOSTS.has(url.hostname) || url.port || url.username || url.password) throw Error('Unsupported provider');
    const status = { provider: url.hostname, status: 'UNAVAILABLE', retrievedAt: new Date().toISOString() };
    statuses.push(status);
    const response = await fetchSource(url.href, { redirect: 'error', signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
    const doi = url.hostname === 'api.openalex.org' && url.pathname.startsWith('/works/https://doi.org/')
      ? decodeURIComponent(url.pathname.slice('/works/https://doi.org/'.length))
      : url.hostname === 'api.semanticscholar.org' && url.pathname.startsWith('/graph/v1/paper/DOI:')
        ? decodeURIComponent(url.pathname.slice('/graph/v1/paper/DOI:'.length)) : null;
    if (response.status === 404 && doi) { await response.body?.cancel(); status.status = 'NOT_FOUND'; return Response.json({}); }
    if (!response.ok || !response.headers.get('content-type')?.includes('json') || Number(response.headers.get('content-length')) > MAX_BYTES) {
      await response.body?.cancel(); throw Error('Source unavailable');
    }
    const chunks = []; let bytes = 0;
    for await (const chunk of response.body || []) {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) throw Error('Source exceeds size limit');
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (doi) {
      const actual = url.hostname === 'api.openalex.org' ? data.doi?.replace(/^https?:\/\/doi.org\//i, '') : data.externalIds?.DOI;
      if (typeof actual !== 'string' || actual.toLowerCase() !== doi.toLowerCase() || !(data.title || data.display_name) || !(data.id || data.paperId)) throw Error('Source identity mismatch');
    } else {
      const rows = url.hostname === 'api.openalex.org' ? data.results : url.hostname === 'api.crossref.org' ? data.message?.items : data.data;
      if (!Array.isArray(rows)) throw Error('Malformed source response');
      const authors = url.pathname.endsWith('/authors') || url.pathname.endsWith('/author/search');
      if (rows.some(item => !item || typeof item !== 'object' || (authors
        ? !(typeof (item.id || item.authorId) === 'string' && typeof (item.display_name || item.name) === 'string')
        : !(typeof (item.id || item.paperId || item.DOI) === 'string' && typeof (item.display_name || (Array.isArray(item.title) ? item.title[0] : item.title)) === 'string')))) throw Error('Missing source identity or title');
    }
    status.status = 'AVAILABLE';
    return Response.json(data);
  };
}

function filters(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail(400, 'Invalid search filters.');
  const out = { ...input, query: text(input.query ?? '', 'Query', 500, false) };
  for (const key of ['yearFrom', 'yearTo', 'minCitations', 'page', 'pageSize']) {
    if (input[key] != null && (!Number.isInteger(input[key]) || input[key] < 0 || input[key] > 100000)) throw fail(400, 'Invalid numeric filter.');
  }
  for (const [key, allowed] of Object.entries({ mode: ['TOPIC', 'AUTHOR', 'TITLE', 'DOI'], sortBy: ['relevance', 'date_desc', 'date_asc', 'citations_desc'] })) {
    if (input[key] !== undefined && !allowed.includes(input[key])) throw fail(400, 'Invalid search mode or sorting.');
  }
  for (const key of ['venue', 'pubType', 'sourceFilter']) if (input[key] !== undefined) out[key] = text(input[key], key, 100);
  if (input.selectedAuthor) out.selectedAuthor = author(input.selectedAuthor);
  if (input.mode === 'DOI' && !/^10\.\d{4,9}\/.+/.test(out.query.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, ''))) throw fail(400, 'Enter a valid DOI.');
  return out;
}
function author(input) {
  if (!input || !['OpenAlex', 'Semantic Scholar'].includes(input.source)) throw fail(400, 'Select an author from a supported provider.');
  const id = text(input.id, 'Author ID', 100).replace('https://openalex.org/', '');
  if (!(input.source === 'OpenAlex' ? /^A\d+$/ : /^\d+$/).test(id)) throw fail(400, 'Invalid provider author ID.');
  return { id, source: input.source, displayName: text(input.displayName, 'Author name', 300) };
}
export function createAcademicHandler(db, env = process.env, fetchSource = fetch) {
  let active = 0;
  return async (req, res) => {
    let admitted = false;
    try {
      const operation = new URL(req.url, 'http://localhost').pathname;
      if (!['/api/academic/search', '/api/academic/authors', '/api/academic/author-works'].includes(operation)) throw fail(404, 'Academic endpoint not found.');
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw fail(405, 'Use POST for academic retrieval.'); }
      if (!await authenticatedUser(db, req, env)) throw fail(401, 'Your session expired. Sign in to search academic sources.');
      if (active >= 4) throw fail(503, 'Academic retrieval is busy. Retry shortly.');
      const body = await readJson(req, 16384);
      active++; admitted = true;
      const statuses = [];
      const service = createAcademicService(boundedAcademicFetch(fetchSource, statuses));
      let result;
      if (operation.endsWith('/authors')) result = await service.resolveAuthor(text(body.query, 'Author name', 300));
      else if (operation.endsWith('/author-works')) result = await service.fetchAuthorWorks(author(body.author), filters(body.filters));
      else result = await service.searchRealtimeAcademicPapers(filters(body.filters));
      const warnings = statuses.filter(s => s.status === 'UNAVAILABLE').map(s => `${s.provider} unavailable. Retry or use another source.`);
      if (Array.isArray(result) && !result.length && warnings.length) throw fail(502, warnings.join(' '));
      if (!Array.isArray(result)) {
        result.warnings = [...new Set(warnings)];
        result.providerStatuses = statuses;
      }
      send(res, 200, { result, warnings: [...new Set(warnings)], providerStatuses: statuses });
    } catch (error) { send(res, error.status || 502, { message: error.status ? error.message : 'Academic source unavailable or invalid. Retry shortly.' }); }
    finally { if (admitted) active--; }
  };
}
