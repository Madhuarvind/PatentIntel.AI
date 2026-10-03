import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export function createMailer(env = process.env) {
  if (env.RESEND_API_KEY && env.MAIL_FROM) return async (email, link, purpose = 'reset') => {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [email], subject: `PatentIntel: ${purpose === 'verify' ? 'verify your email' : purpose === 'invite' ? 'team invitation' : 'reset your password'}`,
        text: `Open this single-use link to ${purpose === 'reset' ? 'reset your password (expires in 30 minutes)' : purpose === 'invite' ? 'accept your invitation (expires in 24 hours)' : 'verify your email (expires in 24 hours)'}:\n${link}\nIf you did not request this, ignore this message.` }) });
    if (!response.ok) throw new Error('Email delivery failed.');
  };
  if (env.NODE_ENV !== 'production') return async (email, link, purpose = 'reset') => {
    const directory = resolve(env.AUTH_MAIL_DIR || '.data/mail'); await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, `${randomUUID()}.json`), JSON.stringify({ to: email, purpose, link, ...(purpose === 'reset' ? { resetLink: link } : {}) }), { mode: 0o600 });
  };
  return null;
}
