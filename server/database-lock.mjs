import { mkdir, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// Fail closed for incomplete locks. A dead process's complete lock can be reclaimed.
export async function acquireDatabaseLock(directory) {
  const lock = `${directory}.lock`;
  const ownerPath = `${lock}/owner.json`;
  const token = randomUUID();
  const alive = pid => {
    if (!Number.isInteger(pid) || pid < 1) return true;
    try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
  };
  try { await mkdir(lock); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let owner;
    try { owner = JSON.parse(await readFile(ownerPath, 'utf8')); }
    catch { throw new Error('Local database has an incomplete lock. Stop its processes and inspect the lock before recovery.'); }
    if (alive(owner.pid)) throw new Error('Local database is already open in another process. Stop that API/dev server first.');
    const guard = `${lock}/recovery`;
    try { await mkdir(guard); } catch { throw new Error('Local database recovery is already in progress.'); }
    try {
      const latest = JSON.parse(await readFile(ownerPath, 'utf8'));
      if (alive(latest.pid)) throw new Error('Local database is already open in another process.');
      await writeFile(ownerPath, JSON.stringify({ pid: process.pid, token }), { mode: 0o600 });
    } finally { await rmdir(guard); }
    return release;
  }
  await writeFile(ownerPath, JSON.stringify({ pid: process.pid, token }), { mode: 0o600 });
  return release;
  async function release() {
    const owner = JSON.parse(await readFile(ownerPath, 'utf8'));
    if (owner.token !== token) throw new Error('Database lock ownership changed.');
    await unlink(ownerPath);
    await rmdir(lock);
  }
}
