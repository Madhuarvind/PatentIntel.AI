import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fail } from './http.mjs';
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export async function parseDocument(name, bytes) {
  if (!bytes.length) throw fail(400, 'The document is empty.');
  if (bytes.length > MAX_DOCUMENT_BYTES) throw fail(413, 'Documents must be no larger than 20 MB.');
  let pages, mime;
  if (/\.txt$/i.test(name)) {
    mime = 'text/plain';
    let content;
    try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw fail(400, 'TXT files must contain valid UTF-8 text.'); }
    if (content.includes('\0')) throw fail(400, 'This does not appear to be a text file.');
    pages = [{ page: 1, text: content }];
  } else if (/\.pdf$/i.test(name)) {
    mime = 'application/pdf';
    if (!bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'))) throw fail(400, 'Invalid PDF document.');
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useSystemFonts: false });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 100) throw fail(413, 'PDFs must contain at most 100 pages.');
      pages = [];
      for (let page = 1; page <= pdf.numPages; page++) {
        const content = await (await pdf.getPage(page)).getTextContent();
        pages.push({ page, text: content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('').trim() });
      }
    } catch (error) { if (error.status) throw error; throw fail(400, 'The PDF could not be read. Use an unencrypted text-based PDF.'); }
    finally { await task.destroy(); }
  } else throw fail(415, 'Upload a TXT or text-based PDF file.');
  if (!pages.some(page => page.text.trim())) throw fail(422, 'No text was found. Scanned PDFs require OCR before import.');
  if (pages.reduce((sum, p) => sum + p.text.length, 0) > 500000) throw fail(413, 'Extracted text is too large (500,000 character limit).');
  return { pages, mime, sha256: createHash('sha256').update(bytes).digest('hex') };
}
export function createDocumentStorage(env = process.env) {
  const cloud = !!env.SUPABASE_URL && !!env.SUPABASE_SERVICE_ROLE_KEY;
  if (env.NODE_ENV === 'production' && !cloud) throw new Error('Private Supabase storage must be configured in production.');
  const root = resolve(env.DOCUMENT_DATA_DIR || '.data/documents');
  const bucket = env.SUPABASE_STORAGE_BUCKET || 'patentintel-documents';
  const pathFor = key => { const path = resolve(root, key); if (!path.startsWith(root + sep)) throw Error('Invalid storage path.'); return path; };
  const objectUrl = key => `${env.SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const headers = () => ({ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` });
  return {
    async ready() {
      if (!cloud) { await mkdir(root, { recursive: true }); return; }
      const response = await fetch(`${env.SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(bucket)}`, { headers: headers(), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Private storage bucket is unavailable. Check Supabase configuration.');
      const config = await response.json();
      if (config.public !== false) throw new Error('Document storage bucket must be private. Startup refused.');
    },
    async put(owner, bytes, mime) {
      const key = `${owner}/${randomUUID()}`;
      if (cloud) {
        const response = await fetch(objectUrl(key), { method: 'POST', headers: { ...headers(), 'Content-Type': mime, 'x-upsert': 'false' }, body: bytes, signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw fail(503, 'Document storage is unavailable.');
      } else { await mkdir(resolve(root, owner), { recursive: true }); await writeFile(pathFor(key), bytes, { mode: 0o600 }); }
      return key;
    },
    async get(key) {
      if (cloud) {
        const response = await fetch(objectUrl(key), { headers: headers(), signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw fail(503, 'Document storage is unavailable.');
        return Buffer.from(await response.arrayBuffer());
      }
      return readFile(pathFor(key));
    },
    async remove(key) {
      if (cloud) {
        const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}`, { method: 'DELETE', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [key] }), signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw Error('Storage cleanup failed');
      } else await unlink(pathFor(key));
    }
  };
}
