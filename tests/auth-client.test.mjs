import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { authClient } from '../src/services/authClient.ts';

afterEach(() => mock.restoreAll());
const account = { name: 'Client Test', email: 'client@example.test', password: 'synthetic test passphrase', organization: '' };
const respond = (body, status = 200, type = 'application/json') => {
  mock.method(globalThis, 'fetch', async () => new Response(body, { status, headers: { 'Content-Type': type } }));
};

test('offline proxy and HTML fallback responses cannot report registration success', async () => {
  for (const status of [200, 502, 503]) {
    mock.restoreAll();
    respond('<html>Frontend fallback or proxy error</html>', status, 'text/html');
    await assert.rejects(authClient.register(account), /service is unavailable/);
  }
});

test('malformed JSON and incomplete successful payloads are rejected', async () => {
  for (const body of ['{', 'null', '[]', '{}']) {
    mock.restoreAll(); respond(body);
    await assert.rejects(authClient.register(account), /unreadable response/);
  }
  mock.restoreAll(); respond('{}');
  await assert.rejects(authClient.login(account.email, account.password, false), /unreadable response/);
  await assert.rejects(authClient.session(), /unreadable response/);
});

test('real API validation errors and successful registration messages are preserved', async () => {
  respond(JSON.stringify({ error: 'Email is already registered.' }), 409);
  await assert.rejects(authClient.register(account), /Email is already registered/);
  mock.restoreAll(); respond(JSON.stringify({ message: 'Account created.' }), 201);
  assert.equal((await authClient.register(account)).message, 'Account created.');
});

test('signed-out sessions are accepted and unconfirmed logout is rejected', async () => {
  respond(JSON.stringify({ user: null }));
  assert.equal(await authClient.session(), null);
  mock.restoreAll(); respond('{}');
  await assert.rejects(authClient.logout(), /could not be confirmed/);
});
