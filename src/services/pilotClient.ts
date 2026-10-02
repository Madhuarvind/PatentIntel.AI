import { getAuthEpoch } from './authClient';
export async function pilotApi<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const epoch = getAuthEpoch();
  let response: Response;
  try { response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000) }); }
  catch { throw new Error('The workspace service could not be reached. Your unsaved changes are still on this page.'); }
  if (response.status === 401 && epoch === getAuthEpoch()) window.dispatchEvent(new Event('pilot-session-expired'));
  const data = await response.json().catch(() => { throw new Error('The workspace service is unavailable. Please retry.'); });
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data as T;
}
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
