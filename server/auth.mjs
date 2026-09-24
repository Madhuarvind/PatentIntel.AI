import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const derive = promisify(scrypt);
const digest = value => createHash('sha256').update(value).digest('hex');
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const safeUser = row => ({ id: row.id, email: row.email, name: row.name, organization: row.organization, role: row.role, createdAt: row.created_at });
const fail = (status, message) => Object.assign(new Error(message), { status });

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, options);
  return `scrypt-v1$${salt}$${key.toString('hex')}`;
}
async function verify(password, encoded) {
  const [version, salt, key] = encoded.split('$');
  if (version !== 'scrypt-v1' || !/^[a-f0-9]{128}$/.test(key || '')) return false;
  return timingSafeEqual(await derive(password, salt, 64, options), Buffer.from(key, 'hex'));
}
function passwordInput(value) {
  if (typeof value !== 'string' || value.length < 15 || value.length > 128) throw fail(400, 'Use a password between 15 and 128 characters.');
  return value;
}
function emailInput(value) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw fail(400, 'Enter a valid email address.');
  return value.trim().toLowerCase();
}
async function readBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw fail(415, 'JSON is required.');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 16384) throw fail(413, 'Request too large.'); chunks.push(chunk); }
  const body = Buffer.concat(chunks).toString('utf8');
  try { const data = JSON.parse(body); if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error(); return data; }
  catch { throw fail(400, 'Invalid request body.'); }
}

export async function createAuthHandler(db, env = process.env, deliverOverride) {
  const production = env.NODE_ENV === 'production';
  const origin = new URL(env.APP_ORIGIN || 'http://localhost:5173').origin;
  if (production && (!env.APP_ORIGIN || !origin.startsWith('https://'))) throw Error('Production APP_ORIGIN must use HTTPS.');
  const cookieName = production ? '__Host-patentintel_session' : 'patentintel_session';
  const dummy = await hashPassword(randomBytes(32).toString('hex'));
  let hashing = 0;
  async function expensive(fn) {
    if (hashing >= 4) throw fail(503, 'Authentication is busy. Please retry shortly.');
    hashing++;
    try { return await fn(); } finally { hashing--; }
  }
  let deliver = deliverOverride;
  if (!deliver && env.SMTP_URL && env.MAIL_FROM) {
    const { default: nodemailer } = await import('nodemailer');
    const transport = nodemailer.createTransport(env.SMTP_URL);
    deliver = (email, link) => transport.sendMail({ from: env.MAIL_FROM, to: email, subject: 'Reset your PatentIntel password', text: `Reset your password within 30 minutes: ${link}\nIf you did not request this, ignore this email.` });
  } else if (!deliver && !production) {
    deliver = async (email, link) => {
      const directory = resolve(env.AUTH_MAIL_DIR || '.data/mail');
      await mkdir(directory, { recursive: true });
      await writeFile(resolve(directory, `${randomUUID()}.json`), JSON.stringify({ to: email, resetLink: link }), { mode: 0o600 });
    };
  }
  const cookie = (token, seconds) => `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax${production ? '; Secure' : ''}${seconds === undefined ? '' : `; Max-Age=${seconds}`}`;
  const sessionToken = req => {
    const value = req.headers.cookie?.split(';').map(p => p.trim()).find(p => p.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    return /^[a-f0-9]{64}$/.test(value || '') ? value : '';
  };
  async function limit(key, max) {
    await db.query('DELETE FROM auth_limits WHERE expires_at <= CURRENT_TIMESTAMP');
    const { rows } = await db.query(`INSERT INTO auth_limits(key, attempts, expires_at) VALUES ($1, 1, CURRENT_TIMESTAMP + INTERVAL '15 minutes')
      ON CONFLICT (key) DO UPDATE SET attempts = CASE WHEN auth_limits.expires_at <= CURRENT_TIMESTAMP THEN 1 ELSE auth_limits.attempts + 1 END,
      expires_at = CASE WHEN auth_limits.expires_at <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes' ELSE auth_limits.expires_at END RETURNING attempts`, [digest(key)]);
    if (rows[0].attempts > max) throw fail(429, 'Too many attempts. Try again in 15 minutes.');
  }
  async function startSession(req, res, userId, remember, expectedHash) {
    const token = randomBytes(32).toString('hex');
    const seconds = remember ? 30 * 86400 : 12 * 3600;
    await db.transaction(async tx => {
      const { rows } = await tx.query('SELECT password_hash FROM auth_users WHERE id=$1 FOR UPDATE', [userId]);
      if (rows[0]?.password_hash !== expectedHash) throw fail(401, 'Credentials changed. Please sign in again.');
      await tx.query('DELETE FROM auth_sessions WHERE token_hash=$1 OR expires_at <= CURRENT_TIMESTAMP', [digest(sessionToken(req))]);
      await tx.query('INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES ($1,$2,$3)', [digest(token), userId, new Date(Date.now() + seconds * 1000)]);
    });
    res.setHeader('Set-Cookie', cookie(token, remember ? seconds : undefined));
  }
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
    try {
      const path = req.url.split('?')[0];
      if (req.method === 'GET' && path === '/api/auth/session') {
        const { rows } = await db.query('SELECT u.* FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>CURRENT_TIMESTAMP', [digest(sessionToken(req))]);
        send(200, { user: rows[0] ? safeUser(rows[0]) : null }); return;
      }
      if (req.method !== 'POST') throw fail(405, 'Method not allowed.');
      if (req.headers.origin !== origin) throw fail(403, 'Request origin is not allowed.');
      const body = await readBody(req);
      if (path === '/api/auth/logout') {
        await db.query('DELETE FROM auth_sessions WHERE token_hash=$1', [digest(sessionToken(req))]);
        res.setHeader('Set-Cookie', cookie('', 0)); send(200, { ok: true }); return;
      }
      // Proxy headers are deliberately not trusted. Configure the ingress for production limits too.
      await limit(`ip:${req.socket.remoteAddress}`, 40);
      if (path === '/api/auth/register') {
        const email = emailInput(body.email); const password = passwordInput(body.password);
        if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 100) throw fail(400, 'Enter your name (2–100 characters).');
        if (typeof body.organization !== 'string' || body.organization.length > 200) throw fail(400, 'Organization must be at most 200 characters.');
        const hash = await expensive(() => hashPassword(password));
        try {
          await db.query('INSERT INTO auth_users(id,email,name,organization,password_hash) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), email, body.name.trim(), body.organization.trim(), hash]);
        } catch (error) { if (error.code === '23505') throw fail(409, 'An account with that email already exists. Sign in or reset your password.'); throw error; }
        send(201, { message: 'Account created. You can now sign in.' }); return;
      }
      if (path === '/api/auth/login') {
        const email = emailInput(body.email);
        if (typeof body.password !== 'string' || body.password.length > 128) throw fail(400, 'Invalid password input.');
        await limit(`login:${email}`, 10);
        const { rows } = await db.query('SELECT * FROM auth_users WHERE email=$1', [email]);
        const valid = await expensive(() => verify(body.password, rows[0]?.password_hash || dummy));
        if (!valid || !rows[0]) throw fail(401, 'Email or password is incorrect.');
        await startSession(req, res, rows[0].id, body.rememberMe === true, rows[0].password_hash);
        send(200, { user: safeUser(rows[0]) }); return;
      }
      if (path === '/api/auth/forgot-password') {
        if (!deliver) throw fail(503, 'Password recovery is not configured. Contact the administrator.');
        const email = emailInput(body.email); await limit(`reset:${email}`, 3);
        const { rows } = await db.query('SELECT id FROM auth_users WHERE email=$1', [email]);
        if (rows[0]) {
          const token = randomBytes(32).toString('hex');
          await db.query('DELETE FROM auth_resets WHERE expires_at <= CURRENT_TIMESTAMP');
          await db.query('INSERT INTO auth_resets(token_hash,user_id,expires_at) VALUES ($1,$2,$3)', [digest(token), rows[0].id, new Date(Date.now() + 30 * 60000)]);
          try { await deliver(email, `${origin}/?reset=${token}`); }
          catch { await db.query('DELETE FROM auth_resets WHERE token_hash=$1', [digest(token)]); console.error('Password reset delivery failed.'); }
        }
        send(200, { message: 'If an account exists, a reset link has been sent.', delivery: production ? 'email' : env.SMTP_URL ? 'email' : 'local-outbox' }); return;
      }
      if (path === '/api/auth/reset-password') {
        if (!/^[a-f0-9]{64}$/.test(body.token || '')) throw fail(400, 'Reset link is invalid or expired.');
        const hash = await expensive(() => hashPassword(passwordInput(body.password)));
        await db.transaction(async tx => {
          const { rows } = await tx.query('DELETE FROM auth_resets WHERE token_hash=$1 AND expires_at>CURRENT_TIMESTAMP RETURNING user_id', [digest(body.token)]);
          if (!rows[0]) throw fail(400, 'Reset link is invalid or expired.');
          await tx.query('UPDATE auth_users SET password_hash=$1 WHERE id=$2', [hash, rows[0].user_id]);
          await tx.query('DELETE FROM auth_sessions WHERE user_id=$1', [rows[0].user_id]);
          await tx.query('DELETE FROM auth_resets WHERE user_id=$1', [rows[0].user_id]);
        });
        res.setHeader('Set-Cookie', cookie('', 0)); send(200, { message: 'Password updated. Sign in with your new password.' }); return;
      }
      throw fail(404, 'Endpoint not found.');
    } catch (error) {
      if (!error.status) console.error('Authentication request failed:', error.code || 'INTERNAL');
      if (error.status === 429) res.setHeader('Retry-After', '900');
      send(error.status || 503, { error: error.status ? error.message : 'Authentication is temporarily unavailable. Please retry.' });
    }
  };
}
