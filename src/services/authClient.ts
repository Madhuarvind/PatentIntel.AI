export interface SessionUser { id: string; name: string; email: string; role: string; organization: string; createdAt: string }
let currentUser: SessionUser | null = null;
export const getSessionUser = () => currentUser;
async function request(path: string, body?: unknown) {
  let response: Response;
  try { response = await fetch(`/api/auth/${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) }); }
  catch { throw new Error('Cannot reach the sign-in service. Please try again.'); }
  const data = await response.json().catch(() => ({ error: 'Sign-in service returned an invalid response.' }));
  if (!response.ok) throw new Error(data.error || 'Request failed. Please retry.');
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
