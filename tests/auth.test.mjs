import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { openDatabase } from '../server/database.mjs';
import { createAuthHandler } from '../server/auth.mjs';

let db, server, base, directory, handler;
const deliveries = [];
const origin = 'http://localhost:5173';
const password = 'correct horse battery river';
const dataRoot = resolve('.data');
const account = { name: 'Test Researcher', email: 'auth-test@example.test', organization: 'Test Lab', password };
async function request(path, body, cookie, extra = {}) {
  const response = await fetch(`${base}/api/auth/${path}`, { method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, cookie: response.headers.get('set-cookie'), data: await response.json() };
}
const login = (rememberMe = false) => request('login', { email: account.email, password, rememberMe });
before(async () => {
  await mkdir(dataRoot, { recursive: true }); directory = await mkdtemp(resolve(dataRoot, 'auth-test-'));
  db = await openDatabase({ AUTH_DATA_DIR: directory });
  handler = await createAuthHandler(db, { APP_ORIGIN: origin }, async (email, link) => deliveries.push({ email, link }));
  server = createServer((req, res) => handler(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(async () => { await db.query('DELETE FROM auth_limits'); });
after(async () => {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await db?.close();
  if (directory && resolve(directory).startsWith(dataRoot + sep)) await rm(directory, { recursive: true, force: true });
});

test('registration validates password, normalizes email, stores only a salted hash and rejects duplicate accounts', async () => {
  assert.equal((await request('register', { ...account, password: 'short' })).status, 400);
  assert.equal((await request('register', { ...account, email: ' AUTH-TEST@example.test ', role: 'Administrator' })).status, 201);
  const { rows } = await db.query('SELECT * FROM auth_users');
  assert.equal(rows.length, 1); assert.equal(rows[0].email, account.email);
  assert.equal(rows[0].role, 'Researcher'); assert.match(rows[0].password_hash, /^scrypt-v1\$/);
  assert.ok(!rows[0].password_hash.includes(password));
  assert.equal((await request('register', account)).status, 409);
  assert.equal((await request('session')).data.user, null);
});
test('unknown users and wrong passwords fail without creating users', async () => {
  const wrong = await request('login', { email: account.email, password: 'wrong password!' });
  const unknown = await request('login', { email: 'unknown@example.test', password });
  assert.equal(wrong.status, 401); assert.deepEqual(wrong.data, unknown.data);
  assert.equal(Number((await db.query('SELECT COUNT(*) FROM auth_users')).rows[0].count), 1);
});
test('login issues HttpOnly cookies; remember-me persists cookies, ordinary login does not', async () => {
  const ordinary = await login(); assert.equal(ordinary.status, 200);
  assert.match(ordinary.cookie, /HttpOnly/); assert.match(ordinary.cookie, /SameSite=Lax/); assert.doesNotMatch(ordinary.cookie, /Max-Age/);
  assert.equal((await request('session', undefined, ordinary.cookie)).data.user.email, account.email);
  assert.equal(ordinary.data.user.password_hash, undefined);
  const remembered = await login(true); assert.match(remembered.cookie, /Max-Age=2592000/);
  const rawToken = remembered.cookie.split(';')[0].split('=')[1];
  assert.equal((await db.query('SELECT token_hash FROM auth_sessions')).rows.some(row => row.token_hash === rawToken), false);
});
test('forged, expired and logged-out sessions cannot restore identity', async () => {
  assert.equal((await request('session', undefined, `patentintel_session=${'f'.repeat(64)}`)).data.user, null);
  const user = await login();
  assert.equal((await request('logout', {}, user.cookie)).status, 200);
  assert.equal((await request('session', undefined, user.cookie)).data.user, null);
  const next = await login(); await db.query("UPDATE auth_sessions SET expires_at=CURRENT_TIMESTAMP-INTERVAL '1 second'");
  assert.equal((await request('session', undefined, next.cookie)).data.user, null);
});
test('signing in again rotates the existing session token', async () => {
  const first = await login();
  const second = await request('login', { email: account.email, password }, first.cookie);
  assert.equal(second.status, 200); assert.notEqual(first.cookie, second.cookie);
  assert.equal((await request('session', undefined, first.cookie)).data.user, null);
  assert.equal((await request('session', undefined, second.cookie)).data.user.email, account.email);
});
test('concurrent registration relies on the unique email constraint', async () => {
  const input = { ...account, email: 'race@example.test' };
  const results = await Promise.all([request('register', input), request('register', input)]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  assert.equal(Number((await db.query('SELECT COUNT(*) FROM auth_users WHERE email=$1', [input.email])).rows[0].count), 1);
});
test('cross-origin mutations and unsupported media types are rejected', async () => {
  assert.equal((await request('login', { ...account }, undefined, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await request('logout', {}, undefined, { 'Content-Type': 'text/plain' })).status, 415);
});
test('database rate limits block repeated login attempts', async () => {
  for (let i = 0; i < 10; i++) await request('login', { email: account.email, password: 'incorrect' });
  assert.equal((await login()).status, 429);
});
test('password recovery is generic, tokens expire and successful reset revokes sessions and cannot replay', async () => {
  const session = await login();
  const known = await request('forgot-password', { email: account.email });
  const unknown = await request('forgot-password', { email: 'missing@example.test' });
  assert.deepEqual(known.data, unknown.data); assert.equal(deliveries.length, 1);
  const expiredToken = new URL(deliveries[0].link).searchParams.get('reset');
  await db.query("UPDATE auth_resets SET expires_at=CURRENT_TIMESTAMP-INTERVAL '1 second'");
  assert.equal((await request('reset-password', { token: expiredToken, password })).status, 400);
  await request('forgot-password', { email: account.email });
  const token = new URL(deliveries[1].link).searchParams.get('reset');
  const updated = 'updated horse battery river';
  assert.equal((await request('reset-password', { token, password: updated })).status, 200);
  assert.equal((await request('reset-password', { token, password: updated })).status, 400);
  assert.equal((await request('session', undefined, session.cookie)).data.user, null);
  assert.equal((await login()).status, 401);
  assert.equal((await request('login', { email: account.email, password: updated })).status, 200);
});
test('accounts and sessions persist after closing and reopening the local database', async () => {
  const user = await request('login', { email: account.email, password: 'updated horse battery river' });
  await db.close(); db = await openDatabase({ AUTH_DATA_DIR: directory });
  handler = await createAuthHandler(db, { APP_ORIGIN: origin }, async () => {});
  assert.equal((await request('session', undefined, user.cookie)).data.user.email, account.email);
});
test('production requires a real PostgreSQL URL and HTTPS origin; cookies use Secure', async () => {
  await assert.rejects(openDatabase({ NODE_ENV: 'production' }), /DATABASE_URL/);
  await assert.rejects(createAuthHandler(db, { NODE_ENV: 'production', APP_ORIGIN: origin }), /HTTPS/);
  handler = await createAuthHandler(db, { NODE_ENV: 'production', APP_ORIGIN: 'https://patent.example' });
  const login = await request('login', { email: account.email, password: 'updated horse battery river' }, undefined, { Origin: 'https://patent.example' });
  assert.match(login.cookie, /^__Host-patentintel_session=/); assert.match(login.cookie, /; Secure/);
  assert.equal((await request('forgot-password', { email: account.email }, undefined, { Origin: 'https://patent.example' })).status, 503);
});
