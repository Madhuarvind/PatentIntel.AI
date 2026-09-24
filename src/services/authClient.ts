export interface SessionUser { id: string; name: string; email: string; role: string; organization: string; createdAt: string }
let currentUser: SessionUser | null = null;
export const getSessionUser = () => currentUser;
async function request(path: string, body?: unknown) {
  let response: Response;
  try { response = await fetch(`/api/auth/${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) }); }
  catch { throw new Error('Cannot reach the sign-in service. Please try again.'); }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The sign-in service is unavailable. Please try again shortly.');
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('The sign-in service returned an unreadable response. Please try again.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('The sign-in service returned an unreadable response. Please try again.');
  }
  if (!response.ok) throw new Error(data.error || 'Request failed. Please retry.');
  // A malformed HTTP 200 response must never be mistaken for successful registration.
  if (data.error) throw new Error(typeof data.error === 'string' ? data.error : 'Request failed. Please retry.');
  if ((path === 'session' && data.user !== null || path === 'login') &&
      (!data.user || typeof data.user.id !== 'string' || typeof data.user.email !== 'string' || typeof data.user.name !== 'string' || typeof data.user.role !== 'string')) {
    throw new Error('The sign-in service returned an unreadable response. Please try again.');
  }
  if (['register', 'forgot-password', 'reset-password'].includes(path) && typeof data.message !== 'string') {
    throw new Error('The sign-in service returned an unreadable response. Please try again.');
  }
  if (path === 'logout' && data.ok !== true) throw new Error('Sign-out could not be confirmed. Please retry.');
  return data;
}
export const authClient = {
  async session(): Promise<SessionUser | null> { const data = await request('session'); currentUser = data.user; return currentUser; },
  register: (body: { name: string; email: string; password: string; organization: string }) => request('register', body),
  async login(email: string, password: string, rememberMe: boolean): Promise<SessionUser> { const data = await request('login', { email, password, rememberMe }); currentUser = data.user; return data.user; },
  async logout() { await request('logout', {}); currentUser = null; },
  forgot: (email: string) => request('forgot-password', { email }),
  reset: (token: string, password: string) => request('reset-password', { token, password })
};
