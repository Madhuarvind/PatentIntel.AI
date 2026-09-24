import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function openDatabase(env = process.env) {
  let db;
  if (env.DATABASE_URL) {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000 });
    db = {
      query: (sql, values) => pool.query(sql, values),
      transaction: async fn => {
        const client = await pool.connect();
        try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
        catch (error) { await client.query('ROLLBACK'); throw error; }
        finally { client.release(); }
      },
      close: () => pool.end()
    };
  } else {
    if (env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required in production.');
    const { PGlite } = await import('@electric-sql/pglite');
    const directory = resolve(env.AUTH_DATA_DIR || '.data/auth');
    await mkdir(directory, { recursive: true });
    const local = new PGlite(directory);
    await local.waitReady;
    db = { query: (sql, values) => local.query(sql, values), transaction: fn => local.transaction(fn), close: () => local.close() };
  }
  // Version-one schema. PostgreSQL constraints are the authority for uniqueness.
  await db.transaction(async tx => {
    await tx.query(`CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      organization TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Researcher', created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await tx.query(`CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await tx.query(`CREATE TABLE IF NOT EXISTS auth_resets (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    )`);
    await tx.query(`CREATE TABLE IF NOT EXISTS auth_limits (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL
    )`);
    await tx.query('CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id)');
    await tx.query('CREATE INDEX IF NOT EXISTS auth_resets_user_idx ON auth_resets(user_id)');
  });
  return db;
}
