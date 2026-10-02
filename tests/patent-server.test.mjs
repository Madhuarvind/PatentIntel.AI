import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createPatentHandler } from '../server/patents.mjs';

// Deliberately synthetic source metadata, never used by the application.
const fixture = '<meta name="publicationNumber" content="US1234567A"><meta name="DC.title" content="Synthetic sensor fixture">';
async function withServer(fetchSource, run, production = false) {
  const db = { query: async () => ({ rows: [{ id: 'synthetic-user', verified_at: new Date() }] }) };
  const server = createServer(createPatentHandler(db, production ? { NODE_ENV: 'production' } : {}, fetchSource));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const cookie = `${production ? '__Host-' : ''}patentintel_session=${'a'.repeat(64)}`;
  try { await run(async (path = '/api/patents/resolve?identifier=US1234567A', options = {}) => {
    const response = await fetch(origin + path, { headers: { Cookie: cookie }, ...options });
    return { status: response.status, data: await response.json() };
  }); } finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
}
test('Node patent resolver authenticates and validates before contacting a provider', async () => {
  let calls = 0;
  await withServer(async () => { calls++; throw Error(); }, async request => {
    assert.equal((await request(undefined, { headers: {} })).status, 401);
    assert.equal((await request('/api/patents/resolve?identifier=https://example.test')).status, 400);
    assert.equal((await request(undefined, { method: 'POST' })).status, 405);
    assert.equal((await request('/api/patents/unknown')).status, 404);
    assert.equal(calls, 0);
  });
});
test('production-session lookup returns only matching source metadata without invented claims', async () => {
  await withServer(async (url, options) => {
    assert.equal(url, 'https://patents.google.com/patent/US1234567A/en');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return new Response(fixture, { headers: { 'Content-Type': 'text/html' } });
  }, async request => {
    const result = await request();
    assert.equal(result.status, 200);
    assert.equal(result.data.patent.id, 'US1234567A');
    assert.deepEqual(result.data.patent.claims, []);
  }, true);
});
test('source outages, mismatched identity and unsupported responses never yield substitute patents', async () => {
  for (const response of [new Response('', { status: 404 }), new Response('', { status: 503 }), new Response('{}', { headers: { 'Content-Type': 'application/json' } }), new Response(fixture.replace('US1234567A', 'US7654321A'), { headers: { 'Content-Type': 'text/html' } })]) {
    await withServer(async () => response, async request => {
      const result = await request();
      assert.ok([404, 502].includes(result.status));
      assert.equal(result.data.success, false);
      assert.equal(result.data.patent, undefined);
    });
  }
  await withServer(async () => { throw Error('private upstream diagnostic'); }, async request => {
    const result = await request();
    assert.equal(result.status, 502);
    assert.doesNotMatch(result.data.message, /private upstream/);
  });
});
test('oversized declared and streamed source bodies are rejected', async () => {
  for (const response of [new Response('', { headers: { 'Content-Type': 'text/html', 'Content-Length': String(5 * 1024 * 1024) } }), new Response('x'.repeat(4 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'text/html' } })]) {
    await withServer(async () => response, async request => {
      const result = await request();
      assert.equal(result.status, 502);
      assert.equal(result.data.errorCode, 'SOURCE_TOO_LARGE');
    });
  }
});
