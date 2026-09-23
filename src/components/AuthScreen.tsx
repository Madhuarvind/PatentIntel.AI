import React, { useState } from 'react';
import { authClient } from '../services/authClient';
import './AuthScreen.css';

interface Props { onLoginSuccess: (user: { name: string; email: string; role: string }) => void }
export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('reset') || '');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(token ? 'reset' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const changeMode = (value: typeof mode) => { setMode(value); setError(''); setNotice(''); setPassword(''); setConfirmation(''); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    setError(''); setNotice('');
    if ((mode === 'register' || mode === 'reset') && password !== confirmation) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      if (mode === 'login') { onLoginSuccess(await authClient.login(email, password, remember)); }
      else if (mode === 'register') {
        await authClient.register({ name, email, password, organization });
        changeMode('login'); setNotice('Account created. Sign in with your new password.');
      } else if (mode === 'forgot') {
        const result = await authClient.forgot(email);
        setNotice(result.delivery === 'local-outbox' ? 'If an account exists, a reset link is in the local development mail outbox. Ask the local administrator to retrieve it.' : result.message);
      } else {
        await authClient.reset(token, password);
        window.history.replaceState(null, '', window.location.pathname + window.location.hash);
        changeMode('login'); setNotice('Password updated. Sign in again; previous sessions have been revoked.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed. Please retry.'); }
    finally { setBusy(false); }
  };
  const title = { login: 'Welcome back', register: 'Create your account', forgot: 'Reset your password', reset: 'Choose a new password' }[mode];
  return <main className="auth-page">
    <section className="auth-intro">
      <a className="auth-brand" href="/">PatentIntel<span>.AI</span></a>
      <p className="auth-eyebrow">YOUR RESEARCH STARTS HERE</p>
      <h1>A workspace for<br />patent research.</h1>
      <p>Explore sources, examine claims, and organize your research in one place.</p>
      <div className="auth-intro-note">Registration and sign-in protect your account. Research modules are being reviewed in stages.</div>
    </section>
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-tabs">
        <button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => changeMode('login')}>Sign in</button>
        <button type="button" disabled={busy} aria-pressed={mode === 'register'} onClick={() => changeMode('register')}>Create account</button>
      </div>
      <h2 id="auth-title">{title}</h2>
      <p>{mode === 'register' ? 'Use your email and a unique passphrase. Your role starts as Researcher.' : mode === 'login' ? 'Enter the credentials you registered with.' : 'Reset links expire after 30 minutes and can be used once.'}</p>
      {error && <div role="alert" className="auth-error">{error}</div>}
      {notice && <div role="status" className="auth-notice">{notice}</div>}
      <form onSubmit={submit}><fieldset disabled={busy}>
        {mode === 'register' && <><label htmlFor="auth-name">Full name</label><input id="auth-name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} />
          <label htmlFor="auth-org">Organization <span>(optional)</span></label><input id="auth-org" autoComplete="organization" maxLength={200} value={organization} onChange={e => setOrganization(e.target.value)} /></>}
        {mode !== 'reset' && <><label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></>}
        {mode !== 'forgot' && <><label htmlFor="auth-password">Password</label><div className="auth-password"><input id="auth-password" type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 15} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button></div></>}
        {(mode === 'register' || mode === 'reset') && <><small>Use 15–128 characters. Spaces and long passphrases are welcome.</small><label htmlFor="auth-confirm">Confirm password</label><input id="auth-confirm" type={visible ? 'text' : 'password'} autoComplete="new-password" required maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></>}
        {mode === 'login' && <div className="auth-options"><label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember me for 30 days</label><button type="button" onClick={() => changeMode('forgot')}>Forgot password?</button></div>}
        <button className="auth-submit" type="submit">{busy ? 'Please wait…' : { login: 'Sign in', register: 'Create account', forgot: 'Send reset link', reset: 'Update password' }[mode]}</button>
      </fieldset></form>
      <p className="auth-footnote">Existing demonstration profiles are not registered accounts. Create an account to continue.</p>
    </section>
  </main>;
};
