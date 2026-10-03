import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPatentHandler } from '../server/patents.mjs';

async function request(fetchSource, { env = {}, query = 'sensor', signedIn = true, method = 'GET' } = {}) {
  const db = { query: async () => ({ rows: [{ id: 'synthetic-user' }] }) };
  let data;
  const res = { setHeader() {}, end(body) { data = JSON.parse(body); } };
  await createPatentHandler(db, env, fetchSource)({ method, url: `/api/patents/search?query=${encodeURIComponent(query)}`, headers: signedIn ? { cookie: `patentintel_session=${'a'.repeat(64)}` } : {} }, res);
  return { status: res.statusCode, data };
}
const configured = { PATENTSVIEW_API_KEY: 'synthetic-test-key' };
test('keyword search authenticates, validates and reports missing configuration without contacting providers', async () => {
  const forbidden = () => { throw Error('Must not fetch'); };
  assert.equal((await request(forbidden, { signedIn: false })).status, 401);
  assert.equal((await request(forbidden, { query: ' ' })).status, 400);
  assert.equal((await request(forbidden, { query: 'x'.repeat(501) })).status, 400);
  assert.equal((await request(forbidden, { method: 'POST' })).status, 405);
  const result = await request(forbidden);
  assert.equal(result.status, 503);
  assert.equal(result.data.code, 'SOURCE_NOT_CONFIGURED');
});
test('current PatentSearch protocol keeps the API key server-side and returns only source metadata', async () => {
  const result = await request(async (url, options) => {
    assert.equal(url, 'https://search.patentsview.org/api/v1/patent/');
    assert.equal(options.headers['X-Api-Key'], configured.PATENTSVIEW_API_KEY);
    assert.equal(options.redirect, 'error'); assert.ok(options.signal);
    assert.deepEqual(JSON.parse(options.body), { q: { _text_any: { patent_title: 'sensor' } }, f: ['patent_id', 'patent_title', 'patent_date'], o: { size: 10 } });
    return Response.json({ patents: [{ patent_id: '12345678', patent_title: 'Synthetic sensor' }, { patent_id: 'D123456', patent_title: 'Synthetic design' }] });
  }, { env: configured });
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.patents[0], { patent_number: '12345678', patent_title: 'Synthetic sensor', patent_date: '' });
  assert.doesNotMatch(JSON.stringify(result.data), /synthetic-test-key/);
  assert.match(result.data.coverage, /claims and full text are not retrieved/);
});
test('empty results remain successful while malformed, denied and oversized source responses fail explicitly', async () => {
  assert.equal((await request(async () => Response.json({ patents: [] }), { env: configured })).status, 200);
  for (const response of [Response.json({ patents: [{ patent_title: 'Missing ID' }] }), Response.json({ error: true, patents: [] }), new Response('', { status: 401 }), new Response('x'.repeat(2 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'application/json' } })]) {
    const result = await request(async () => response, { env: configured });
    assert.equal(result.status, 502); assert.deepEqual(result.data.patents, []);
  }
});
