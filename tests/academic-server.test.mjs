import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAcademicHandler, boundedAcademicFetch } from '../server/academic.mjs';

async function withServer(provider, run) {
  const db = { query: async () => ({ rows: [{ id: 'synthetic-user', verified_at: new Date() }] }) };
  const server = createServer(createAcademicHandler(db, {}, provider));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(async (path, body, signedIn = true) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/academic/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(signedIn ? { Cookie: `patentintel_session=${'a'.repeat(64)}` } : {}) }, body: JSON.stringify(body)
      });
      return { status: response.status, data: await response.json() };
    });
  } finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
}
test('academic endpoints enforce session and bounded validated input before provider access', async () => {
  let calls = 0;
  await withServer(async () => { calls++; throw Error(); }, async request => {
    assert.equal((await request('search', {}, false)).status, 401);
    assert.equal((await request('authors', { query: 'x'.repeat(301) })).status, 400);
    assert.equal((await request('author-works', { author: { id: 'https://evil.test', source: 'OpenAlex', displayName: 'Test' } })).status, 400);
    assert.equal((await request('search', { filters: { query: 'test', yearFrom: 'injected' } })).status, 400);
    assert.equal(calls, 0);
  });
});
test('academic search preserves source identity and distinguishes an empty collection from an outage', async () => {
  await withServer(async (url, options) => {
    assert.equal(options.redirect, 'error'); assert.ok(options.signal);
    if (url.includes('openalex')) return Response.json({ results: [{ id: 'https://openalex.org/W123', display_name: 'Synthetic sensor fixture', publication_year: 2024 }] });
    if (url.includes('crossref')) return Response.json({ message: { items: [] } });
    return new Response('', { status: 503 });
  }, async request => {
    const response = await request('search', { filters: { query: 'sensor', mode: 'TOPIC' } });
    assert.equal(response.status, 200);
    assert.equal(response.data.result.papers[0].id, 'W123');
    assert.equal(response.data.result.papers[0].abstract, '');
    assert.ok(response.data.result.warnings.length);
    assert.deepEqual(response.data.providerStatuses.map(s => s.status).sort(), ['AVAILABLE', 'AVAILABLE', 'UNAVAILABLE']);
  });
});
test('DOI mismatch and malformed records never become source evidence', async () => {
  const statuses = [];
  const bounded = boundedAcademicFetch(async () => Response.json({ id: 'https://openalex.org/W123', display_name: 'Synthetic', doi: 'https://doi.org/10.1234/wrong' }), statuses);
  await assert.rejects(bounded('https://api.openalex.org/works/https://doi.org/10.1234%2Fexpected'), /identity mismatch/);
  const malformed = boundedAcademicFetch(async () => Response.json({ results: [{ display_name: 'Missing identifier' }] }), []);
  await assert.rejects(malformed('https://api.openalex.org/works?search=test'), /identity/);
});
test('academic provider fetch rejects arbitrary hosts, unsupported content and oversized bodies', async () => {
  await assert.rejects(boundedAcademicFetch(() => { throw Error('Should not fetch'); }, [])('https://example.test'), /Unsupported provider/);
  for (const response of [new Response('<html>error</html>'), new Response('x'.repeat(4 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'application/json' } })]) {
    await assert.rejects(boundedAcademicFetch(async () => response, [])('https://api.openalex.org/works?search=test'));
  }
});
test('author publications use only the selected provider ID without unrelated name-search substitution', async () => {
  const urls = [];
  await withServer(async url => { urls.push(url); return Response.json({ results: [] }); }, async request => {
    const response = await request('author-works', { author: { id: 'A123', source: 'OpenAlex', displayName: 'Synthetic author' } });
    assert.equal(response.status, 200); assert.deepEqual(response.data.result, []);
    assert.equal(urls.length, 1); assert.match(urls[0], /filter=author.id:A123/);
  });
});
test('author resolution reports upstream failures rather than claiming there are no authors', async () => {
  await withServer(async () => Response.json({ unexpected: true }), async request => {
    assert.equal((await request('authors', { query: 'Synthetic author' })).status, 502);
  });
});

test('partial author resolution retains identified profiles with an explicit provider warning', async () => {
  await withServer(async url => url.includes('openalex')
    ? Response.json({ results: [{ id: 'https://openalex.org/A123', display_name: 'Synthetic author' }] })
    : new Response('', { status: 503 }), async request => {
    const response = await request('authors', { query: 'Synthetic author' });
    assert.equal(response.status, 200);
    assert.equal(response.data.result[0].id, 'A123');
    assert.match(response.data.warnings.join(' '), /semanticscholar.*unavailable/);
  });
});
