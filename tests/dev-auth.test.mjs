import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { startDevelopmentServer } from '../scripts/dev.mjs';

test('one development server supports registration, cookies and persistence across restart', { timeout: 90000 }, async () => {
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const dataRoot = resolve('.data');
  await mkdir(dataRoot, { recursive: true });
  const directory = await mkdtemp(resolve(dataRoot, 'dev-auth-test-'));
  const env = { APP_ORIGIN: `http://127.0.0.1:${port}`, AUTH_DATA_DIR: directory };
  let app;
  const request = async (path, body, cookie) => {
    const response = await fetch(`${env.APP_ORIGIN}/api/auth/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    assert.match(response.headers.get('content-type'), /application\/json/);
    return { status: response.status, cookie: response.headers.get('set-cookie'), data: await response.json() };
  };
  try {
    app = await startDevelopmentServer({ env });
    assert.equal((await request('session')).data.user, null);
    const account = { name: 'Development Test', email: 'dev-test@example.test', organization: 'Test', password: 'synthetic development passphrase' };
    assert.equal((await request('register', account)).status, 201);
    const login = await request('login', { email: account.email, password: account.password });
    assert.equal(login.status, 200);
    assert.match(login.cookie, /HttpOnly/);
    assert.equal((await request('session', undefined, login.cookie)).data.user.email, account.email);
    await app.close(); app = undefined;
    app = await startDevelopmentServer({ env });
    assert.equal((await request('session', undefined, login.cookie)).data.user.email, account.email);
    assert.equal((await request('logout', {}, login.cookie)).status, 200);
    assert.equal((await request('session', undefined, login.cookie)).data.user, null);
    assert.equal((await request('login', { email: account.email, password: 'incorrect' })).status, 401);
  } finally {
    await app?.close();
    if (directory.startsWith(dataRoot + sep)) await rm(directory, { recursive: true, force: true });
  }
});

test('development startup refuses an origin/port mismatch', async () => {
  await assert.rejects(startDevelopmentServer({ env: { APP_ORIGIN: 'http://localhost:5173' }, port: '5180' }), /must match APP_ORIGIN/);
});
