import { openDatabase } from '../server/database.mjs';
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: npm run bootstrap-admin -- existing-account@example.com. Stop local dev/API first.');
const db = await openDatabase();
try {
  const { rows } = await db.query("UPDATE auth_users SET role='Administrator',verified_at=CURRENT_TIMESTAMP WHERE email=$1 RETURNING id", [email]);
  if (!rows.length) throw new Error('Account not found. Register the account first.');
  console.log('Administrator role assigned to the existing account.');
} finally { await db.close(); }
