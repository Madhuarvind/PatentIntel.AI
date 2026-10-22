import { openDatabase } from '../server/database.mjs';
import { hashPassword } from '../server/auth.mjs';
import { randomUUID } from 'node:crypto';

async function seed() {
  const db = await openDatabase();
  try {
    const accounts = [
      {
        email: 'admin@patentintel.ai',
        password: 'PatentIntel2026!Admin',
        name: 'Lead Administrator',
        organization: 'PatentIntel.AI Research Lab',
        role: 'Administrator'
      },
      {
        email: 'researcher@patentintel.ai',
        password: 'PatentIntel2026!Research',
        name: 'Lead Researcher',
        organization: 'M. Kumarasamy College of Engineering',
        role: 'Researcher'
      }
    ];

    for (const acc of accounts) {
      const existing = await db.query('SELECT id FROM auth_users WHERE email = $1', [acc.email]);
      const hash = await hashPassword(acc.password);
      if (existing.rows.length === 0) {
        await db.query(
          `INSERT INTO auth_users (id, email, name, organization, password_hash, role, verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [randomUUID(), acc.email, acc.name, acc.organization, hash, acc.role]
        );
        console.log(`Created default account: ${acc.email} (${acc.role})`);
      } else {
        await db.query(
          `UPDATE auth_users SET password_hash = $1, role = $2, verified_at = CURRENT_TIMESTAMP WHERE email = $3`,
          [hash, acc.role, acc.email]
        );
        console.log(`Updated default account: ${acc.email} (${acc.role})`);
      }
    }
  } finally {
    await db.close();
  }
}

seed().catch(err => {
  console.error('Failed to seed default accounts:', err);
  process.exit(1);
});
