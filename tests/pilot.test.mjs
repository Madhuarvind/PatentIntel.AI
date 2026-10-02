import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm, cp, readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { openDatabase } from '../server/database.mjs';
import { createAuthHandler } from '../server/auth.mjs';
import { createPilotHandler } from '../server/pilot.mjs';
import { rankPassages } from '../server/evidence.mjs';
import { parseDocument, MAX_DOCUMENT_BYTES } from '../server/documents.mjs';
import { migratePilot } from '../server/migrations.mjs';
let db, server, root, base, env, auth, pilot;
let author, stranger, reviewer, admin, projectId, versionId, runId, reviewId, documentId;
const password = 'synthetic pilot test passphrase';
const mail = [];
async function request(path, body, cookie, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(base + path, { method, headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, cookie: response.headers.get('set-cookie'), data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text() };
}
async function account(email, role) {
  assert.equal((await request('/api/auth/register', { email, password, name: email.split('@')[0], organization: 'QA' })).status, 201);
  if (role) await db.query('UPDATE auth_users SET role=$1 WHERE email=$2', [role, email]);
  const login = await request('/api/auth/login', { email, password });
  assert.equal(login.status, 200); return { ...login.data.user, cookie: login.cookie };
}
before(async () => {
  await mkdir('.data', { recursive: true }); root = await mkdtemp(resolve('.data/pilot-test-'));
  env = { AUTH_DATA_DIR: resolve(root, 'db'), DOCUMENT_DATA_DIR: resolve(root, 'documents'), APP_ORIGIN: 'http://localhost:5173', AUTH_MAIL_DIR: resolve(root, 'mail') };
  db = await openDatabase(env); auth = await createAuthHandler(db, env, async (...args) => mail.push(args));
  pilot = await createPilotHandler(db, env, { deliver: async (...args) => mail.push(args), fetcher: async () => { throw Error('offline'); } });
  server = createServer((req, res) => req.url.startsWith('/api/auth/') ? auth(req, res) : pilot(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`;
  author = await account('author@example.test'); stranger = await account('stranger@example.test');
  reviewer = await account('reviewer@example.test', 'Reviewer'); admin = await account('admin@example.test', 'Administrator');
});
after(async () => {
  server?.closeAllConnections(); if (server) await new Promise(resolve => server.close(resolve)); await db?.close();
  if (root?.startsWith(resolve('.data') + sep)) await rm(root, { recursive: true, force: true });
});
test('BM25 has no positive floor, rewards query occurrences and is deterministic', () => {
  const passages = [{ sourceId: 'b', index: 0, text: 'optical sensor temperature temperature' }, { sourceId: 'a', index: 0, text: 'unrelated conveyor' }];
  assert.equal(rankPassages('temperature', passages)[0].sourceId, 'b');
  assert.deepEqual(rankPassages('quantum', passages), []); assert.deepEqual(rankPassages('', passages), []);
  assert.deepEqual(rankPassages('temperature', passages), rankPassages('temperature', passages));
});
test('local database lock rejects concurrent opens without damaging the active connection', async () => {
  await assert.rejects(openDatabase(env), /already open/); assert.equal((await db.query('SELECT 1 AS n')).rows[0].n, 1);
});

test('migration revokes provider client access and row security protects accidentally regranted reads', async () => {
  await db.query('CREATE ROLE anon NOLOGIN'); await db.query('CREATE ROLE authenticated NOLOGIN');
  await db.query('GRANT ALL ON auth_users,projects TO anon,authenticated');
  await db.query('DELETE FROM schema_migrations WHERE version=3');
  await migratePilot(db); await migratePilot(db);
  for (const role of ['anon', 'authenticated']) {
    await db.query(`SET ROLE ${role}`);
    try { await assert.rejects(db.query('SELECT * FROM auth_users'), e => e.code === '42501'); }
    finally { await db.query('RESET ROLE'); }
  }
  await db.query('GRANT SELECT ON auth_users TO anon'); await db.query('SET ROLE anon');
  try { assert.deepEqual((await db.query('SELECT * FROM auth_users')).rows, []); }
  finally { await db.query('RESET ROLE'); await db.query('REVOKE ALL ON auth_users FROM anon'); }
  assert.ok((await db.query('SELECT * FROM auth_users')).rows.length >= 4);
});
test('project ownership and optimistic versions are enforced on the server', async () => {
  assert.equal((await request('/api/projects')).status, 401);
  const created = await request('/api/projects', { title: 'Optical sensing', proposal: 'An optical sensor measures temperature and transmits readings.', features: [{ text: 'optical sensor measures temperature' }] }, author.cookie);
  assert.equal(created.status, 201); projectId = created.data.id; versionId = created.data.versionId;
  assert.equal((await request(`/api/projects/${projectId}`, undefined, stranger.cookie)).status, 404);
  assert.equal((await request(`/api/projects/${projectId}`, undefined, reviewer.cookie)).status, 404);
  assert.equal((await request(`/api/projects/${projectId}/versions`, { revision: 0, title: 'bad', proposal: 'bad', features: [] }, author.cookie)).status, 409);
  assert.equal((await request(`/api/projects/${projectId}`, { revision: 1, reviewerId: reviewer.id }, author.cookie, 'PATCH')).status, 403);
  assert.equal((await request(`/api/projects/${projectId}`, { revision: 1, reviewerId: reviewer.id }, admin.cookie, 'PATCH')).status, 200);
});
test('document validation rejects empty, malformed, oversized and invalid UTF8 input', async () => {
  await assert.rejects(parseDocument('empty.txt', Buffer.alloc(0)), /empty/);
  await assert.rejects(parseDocument('large.txt', Buffer.alloc(MAX_DOCUMENT_BYTES + 1)), /20 MB/);
  await assert.rejects(parseDocument('wrong.pdf', Buffer.from('text')), /Invalid PDF/);
  await assert.rejects(parseDocument('bad.txt', Buffer.from([255, 254])), /UTF-8/);
  await assert.rejects(parseDocument('image.png', Buffer.from('image')), /TXT or text-based PDF/);
  const upload = await request('/api/documents', { versionId, name: 'proposal.txt', base64: Buffer.from('An optical sensor measures temperature.').toString('base64') }, author.cookie);
  assert.equal(upload.status, 201); documentId = upload.data.id;
  assert.equal((await request('/api/documents', { versionId, name: 'duplicate.txt', base64: Buffer.from('An optical sensor measures temperature.').toString('base64') }, author.cookie)).status, 409);
  assert.equal((await request(`/api/documents/${documentId}`, undefined, stranger.cookie)).status, 404);
});
test('source failures are explicit and analysis captures exact passages without fabricating metadata', async () => {
  const search = await request('/api/sources/search', { projectId, query: 'temperature sensor', live: true }, author.cookie);
  assert.equal(search.data.live.status, 'UNAVAILABLE'); assert.deepEqual(search.data.live.records, []);
  const source = { projectId, kind: 'PATENT', identifier: 'QA-REFERENCE-1', title: 'QA optical sensor source', url: 'https://example.test/reference', passages: [{ text: 'An optical sensor measures temperature.', page: 2, section: 'Description' }] };
  assert.equal((await request('/api/sources', source, author.cookie)).status, 201);
  assert.equal((await request('/api/sources', source, author.cookie)).status, 409);
  assert.equal((await request('/api/sources', { ...source, identifier: 'BAD', kind: 'UNKNOWN' }, author.cookie)).status, 400);
  assert.equal((await request('/api/sources', { ...source, identifier: 'JS', url: 'javascript:alert(1)' }, author.cookie)).status, 400);
  assert.equal((await request('/api/sources', { ...source, identifier: 'PAPER-NO-TEXT', kind: 'PAPER', passages: [] }, author.cookie)).status, 201);
  const run = await request('/api/analysis-runs', { versionId }, author.cookie); assert.equal(run.status, 201); runId = run.data.id;
  const detail = (await request(`/api/projects/${projectId}`, undefined, author.cookie)).data;
  assert.equal(detail.runs[0].results[0].matches[0].text, source.passages[0].text);
  assert.equal(detail.runs[0].corpus.length, 2); assert.equal(detail.runs[0].results[0].matches.length, 1);
});
test('review permissions freeze the submitted version and permit only assigned decisions', async () => {
  const submitted = await request('/api/reviews', { versionId, runId }, author.cookie); assert.equal(submitted.status, 201); reviewId = submitted.data.id;
  assert.equal((await request(`/api/reviews/${reviewId}/decision`, { decision: 'APPROVED_FOR_DRAFTING', reason: 'Self approve' }, author.cookie)).status, 403);
  assert.equal((await request(`/api/reviews/${reviewId}/decision`, { decision: 'APPROVED_FOR_DRAFTING', reason: 'Unassigned' }, admin.cookie)).status, 403);
  assert.equal((await request(`/api/projects/${projectId}`, undefined, reviewer.cookie)).status, 200);
  assert.equal((await request(`/api/documents/${documentId}`, undefined, reviewer.cookie)).status, 200);
  assert.equal((await request('/api/documents', { versionId, name: 'late.txt', base64: Buffer.from('late').toString('base64') }, author.cookie)).status, 409);
  assert.equal((await request(`/api/reviews/${reviewId}/start`, {}, reviewer.cookie)).status, 200);
  assert.equal((await request(`/api/reviews/${reviewId}/comments`, { comment: 'Explain the sensor difference.', featureId: 'F1' }, reviewer.cookie)).status, 200);
  assert.equal((await request(`/api/reviews/${reviewId}/comments`, { comment: 'Invalid feature', featureId: 'F99' }, reviewer.cookie)).status, 400);
  assert.equal((await request(`/api/reviews/${reviewId}/decision`, { decision: 'NEEDS_REVISION', reason: 'Clarify the technical contribution.' }, reviewer.cookie)).status, 200);
});
test('revisions are private until resubmission and report snapshots preserve earlier evidence', async () => {
  const revised = await request(`/api/projects/${projectId}/versions`, { revision: 1, title: 'Improved sensing', proposal: 'An optical sensor measures temperature with calibration.', features: [{ text: 'optical sensor temperature calibration' }] }, author.cookie);
  assert.equal(revised.status, 201); const v2 = revised.data.versionId;
  const authorView = (await request(`/api/projects/${projectId}`, undefined, author.cookie)).data;
  assert.equal(authorView.documents.filter(d => d.version_id === v2).length, 1);
  const visible = (await request(`/api/projects/${projectId}`, undefined, reviewer.cookie)).data;
  assert.equal(visible.versions.length, 1); assert.equal(visible.project.title, 'Optical sensing');
  assert.equal((await request(`/api/reports/${v2}`, undefined, reviewer.cookie)).status, 404);
  assert.equal((await request(`/api/analysis-runs`, { versionId }, author.cookie)).status, 409);
  const old = (await request(`/api/reports/${versionId}`, undefined, author.cookie)).data;
  assert.equal(old.version.title, 'Optical sensing'); assert.equal(old.comments[0].feature_id, 'F1'); assert.equal(old.decisions[0].decision, 'NEEDS_REVISION');
  assert.equal(old.analysis.id, runId);
  const rerun = await request('/api/analysis-runs', { versionId: v2 }, author.cookie);
  const resubmission = await request('/api/reviews', { versionId: v2, runId: rerun.data.id }, author.cookie);
  assert.equal(resubmission.status, 201);
  assert.equal((await request('/api/reviews', undefined, author.cookie)).data.reviews.find(r => r.id === resubmission.data.id).status, 'RESUBMITTED');
  const responses = await Promise.all(['APPROVED_FOR_DRAFTING','REJECTED'].map(decision => request(`/api/reviews/${resubmission.data.id}/decision`, { decision, reason: 'Concurrent decision test' }, reviewer.cookie)));
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.equal((await request(`/api/projects/${projectId}`, { revision: 2, archived: true }, author.cookie, 'PATCH')).status, 200);
  assert.equal((await request(`/api/analysis-runs`, { versionId: v2 }, author.cookie)).status, 409);
  assert.equal((await request(`/api/projects/${projectId}`, { revision: 2, archived: false }, author.cookie, 'PATCH')).status, 200);
});
test('invitations grant only the intended role to the matching email and cannot replay', async () => {
  assert.equal((await request('/api/admin/invitations', { email: 'invited@example.test', role: 'Reviewer' }, author.cookie)).status, 403);
  const invitation = await request('/api/admin/invitations', { email: 'invited@example.test', role: 'Reviewer' }, admin.cookie);
  assert.equal(invitation.status, 201); const token = new URL(mail.at(-1)[1]).searchParams.get('invite');
  const body = { name: 'Invited Reviewer', email: 'wrong@example.test', password, organization: '', invitation: token };
  assert.equal((await request('/api/auth/register', body)).status, 400);
  assert.equal((await request('/api/auth/register', { ...body, email: 'invited@example.test' })).status, 201);
  const login = await request('/api/auth/login', { email: 'invited@example.test', password }); assert.equal(login.data.user.role, 'Reviewer');
  assert.equal((await request('/api/auth/register', { ...body, email: 'replay@example.test' })).status, 400);
});
test('verification is required when configured and tokens are single use', async () => {
  await db.query('DELETE FROM auth_limits');
  auth = await createAuthHandler(db, { ...env, AUTH_REQUIRE_VERIFICATION: 'true' }, async (...args) => mail.push(args));
  const body = { name: 'Verification User', email: 'verify@example.test', password, organization: '' };
  assert.equal((await request('/api/auth/register', body)).status, 201);
  assert.equal((await request('/api/auth/login', body)).status, 403);
  const token = new URL(mail.at(-1)[1]).searchParams.get('verify');
  assert.equal((await request('/api/auth/verify-email', { token })).status, 200);
  assert.equal((await request('/api/auth/verify-email', { token })).status, 400);
  assert.equal((await request('/api/auth/login', body)).status, 200);
});
test('workspace, sessions and report snapshots survive database reopen; running jobs become interrupted', async () => {
  await db.query("INSERT INTO analysis_runs(id,project_id,version_id,status,method) VALUES ('crashed',$1,$2,'RUNNING','BM25')", [projectId, versionId]);
  await db.close(); db = await openDatabase(env);
  auth = await createAuthHandler(db, env); pilot = await createPilotHandler(db, env);
  assert.equal((await request(`/api/projects/${projectId}`, undefined, author.cookie)).status, 200);
  assert.equal((await request(`/api/reports/${versionId}`, undefined, reviewer.cookie)).data.analysis.id, runId);
  assert.equal((await db.query("SELECT status FROM analysis_runs WHERE id='crashed'")).rows[0].status, 'INTERRUPTED');
});

test('a stopped database and private document backup restore into a separate environment', async () => {
  const originalReport = (await request(`/api/reports/${versionId}`, undefined, reviewer.cookie)).data;
  const originalDocument = (await request(`/api/documents/${documentId}`, undefined, author.cookie)).data;
  await db.close();
  const restoredDb = resolve(root, 'restore-db'), restoredDocuments = resolve(root, 'restore-documents');
  assert.ok(restoredDb.startsWith(root + sep) && restoredDocuments.startsWith(root + sep));
  await cp(env.AUTH_DATA_DIR, restoredDb, { recursive: true });
  await cp(env.DOCUMENT_DATA_DIR, restoredDocuments, { recursive: true });
  env = { ...env, AUTH_DATA_DIR: restoredDb, DOCUMENT_DATA_DIR: restoredDocuments };
  db = await openDatabase(env); auth = await createAuthHandler(db, env); pilot = await createPilotHandler(db, env);
  const restored = (await request(`/api/reports/${versionId}`, undefined, reviewer.cookie)).data;
  assert.deepEqual(restored.analysis, originalReport.analysis); assert.deepEqual(restored.decisions, originalReport.decisions);
  assert.equal((await request(`/api/documents/${documentId}`, undefined, author.cookie)).data, originalDocument);
  assert.equal((await request(`/api/documents/${documentId}`, undefined, stranger.cookie)).status, 404);
  const d = (await db.query('SELECT storage_key FROM documents WHERE id=$1', [documentId])).rows[0];
  assert.equal((await readFile(resolve(restoredDocuments, d.storage_key))).toString('utf8'), originalDocument);
});
