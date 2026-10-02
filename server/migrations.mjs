const statements = [
  `ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`,
  `CREATE TABLE IF NOT EXISTS account_tokens (token_hash TEXT PRIMARY KEY, user_id TEXT REFERENCES auth_users(id), email TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('verify','invite')), role TEXT NOT NULL DEFAULT 'Researcher', expires_at TIMESTAMPTZ NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES auth_users(id), assigned_reviewer_id TEXT REFERENCES auth_users(id), title TEXT NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE, revision INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS project_versions (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), number INTEGER NOT NULL,
    title TEXT NOT NULL, proposal TEXT NOT NULL, features JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(project_id,number))`,
  `CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), version_id TEXT NOT NULL REFERENCES project_versions(id),
    name TEXT NOT NULL, mime TEXT NOT NULL, byte_size INTEGER NOT NULL, sha256 TEXT NOT NULL, storage_key TEXT NOT NULL, pages JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(version_id,sha256))`,
  `CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), kind TEXT NOT NULL CHECK(kind IN ('PATENT','PAPER')),
    identifier TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL DEFAULT '', publication_date TEXT NOT NULL DEFAULT '', passages JSONB NOT NULL,
    provenance TEXT NOT NULL, retrieved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(project_id,kind,identifier))`,
  `CREATE TABLE IF NOT EXISTS analysis_runs (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), version_id TEXT NOT NULL REFERENCES project_versions(id),
    status TEXT NOT NULL CHECK(status IN ('RUNNING','COMPLETED','INTERRUPTED','FAILED')), method TEXT NOT NULL, results JSONB NOT NULL DEFAULT '[]',
    corpus JSONB NOT NULL DEFAULT '[]', error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, finished_at TIMESTAMPTZ)`,
  `CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), version_id TEXT NOT NULL REFERENCES project_versions(id),
    run_id TEXT NOT NULL REFERENCES analysis_runs(id), reviewer_id TEXT NOT NULL REFERENCES auth_users(id), status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(version_id))`,
  `CREATE TABLE IF NOT EXISTS review_comments (id TEXT PRIMARY KEY, review_id TEXT NOT NULL REFERENCES reviews(id), author_id TEXT NOT NULL REFERENCES auth_users(id),
    feature_id TEXT, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS review_decisions (id TEXT PRIMARY KEY, review_id TEXT NOT NULL UNIQUE REFERENCES reviews(id), author_id TEXT NOT NULL REFERENCES auth_users(id),
    decision TEXT NOT NULL, reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects(owner_id)`,
  `CREATE INDEX IF NOT EXISTS reviews_reviewer_idx ON reviews(reviewer_id)`,
  `CREATE INDEX IF NOT EXISTS versions_project_idx ON project_versions(project_id)`,
  `CREATE INDEX IF NOT EXISTS sources_project_idx ON sources(project_id)`
];

export async function migratePilot(db) {
  await db.transaction(async tx => {
    await tx.query('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    const { rows } = await tx.query('SELECT version FROM schema_migrations WHERE version=2');
    if (rows.length) return;
    for (const sql of statements) await tx.query(sql);
    await tx.query('INSERT INTO schema_migrations(version) VALUES (2)');
  });
  await db.transaction(async tx => {
    if ((await tx.query('SELECT version FROM schema_migrations WHERE version=3')).rows.length) return;
    // These tables are private to the Node API. Supabase Auth/Data API roles are not app identities.
    const tables = ['auth_users', 'auth_sessions', 'auth_resets', 'auth_limits', 'account_tokens', 'projects', 'project_versions', 'documents', 'sources', 'analysis_runs', 'reviews', 'review_comments', 'review_decisions', 'schema_migrations'];
    const roles = (await tx.query("SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated')")).rows;
    for (const table of tables) {
      await tx.query(`REVOKE ALL PRIVILEGES ON TABLE "${table}" FROM PUBLIC`);
      for (const { rolname } of roles) await tx.query(`REVOKE ALL PRIVILEGES ON TABLE "${table}" FROM "${rolname}"`);
      // Defense in depth if privileges are later inherited from an external provider role.
      // The table-owning Node database role retains access; never use the anon/client roles for Node.
      await tx.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }
    await tx.query('INSERT INTO schema_migrations(version) VALUES (3)');
  });
}
