export const fail = (status, message) => Object.assign(new Error(message), { status });
export async function readJson(req, limit = 1024 * 1024) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw fail(415, 'JSON is required.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw fail(413, 'Request exceeds the size limit.'); chunks.push(chunk); }
  try { const value = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(); return value; }
  catch { throw fail(400, 'Invalid JSON object.'); }
}
export function text(value, name, max = 1000, required = true) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw fail(400, `${name} is required and must be at most ${max} characters.`);
  return value.trim();
}
export function send(res, status, data) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(JSON.stringify(data));
}
