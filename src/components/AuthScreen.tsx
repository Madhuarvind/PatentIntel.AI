import React, { useState } from 'react';
import { ArrowRight, Fingerprint, Eye, EyeOff, LockKeyhole, ArrowLeft } from 'lucide-react';
import { authClient } from '../services/authClient';
import './AuthScreen.css';

interface Props {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
  serviceError?: string;
}
export const AuthScreen: React.FC<Props> = ({ onLoginSuccess, serviceError }) => {
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
  const changeMode = (value: typeof mode) => { setMode(value); setError(''); setNotice(''); setPassword(''); setConfirmation(''); setVisible(false); };
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
      <a className="auth-brand" href="/" aria-label="PatentIntel.AI home"><span className="auth-brand-icon"><Fingerprint size={25} aria-hidden="true" /></span>PatentIntel<span className="auth-brand-ai">.AI</span></a>
      <div className="auth-intro-content">
        <p className="auth-eyebrow"><span /> A CLEARER VIEW OF INNOVATION</p>
        <h1>Big ideas.<br />Deeper insight.<br /><em>Your next discovery.</em></h1>
        <p className="auth-intro-description">A focused workspace to explore patents, examine claims, and connect your research.</p>
        <div className="auth-blueprint" aria-hidden="true">
          <div className="auth-blueprint-caption"><span>THE ANATOMY OF AN IDEA</span><span>FIG. 01</span></div>
          <svg viewBox="0 0 440 200" fill="none">
            <path d="M35 100H405M220 15V185" stroke="currentColor" strokeOpacity=".2" strokeDasharray="3 6" />
            <g stroke="currentColor" transform="translate(220 100)">
              <ellipse rx="108" ry="44" transform="rotate(-30)" strokeOpacity=".45" />
              <ellipse rx="108" ry="44" transform="rotate(30)" strokeOpacity=".45" />
              <ellipse rx="44" ry="85" strokeOpacity=".45" />
              <circle r="34" strokeWidth="1.5" /><circle r="25" strokeOpacity=".3" />
              <path d="M-12 0 0-16 12 0 0 16Z" fill="currentColor" fillOpacity=".15" strokeWidth="1.5" />
              <circle cx="-78" cy="-44" r="5" fill="#baf0da" /><circle cx="78" cy="44" r="5" fill="#baf0da" /><circle cy="-85" r="4" fill="#baf0da" />
            </g>
            <path d="M142 56H86L66 36H30M298 144H352L372 165H410" stroke="currentColor" strokeOpacity=".5" />
            <g fill="currentColor" fontSize="9" fontFamily="monospace" letterSpacing="1.5"><text x="30" y="26">EXPLORE</text><text x="358" y="183">CONNECT</text></g>
          </svg>
          <div className="auth-blueprint-footer"><span>Different perspectives. New possibilities.</span><span>↗</span></div>
        </div>
      </div>
      <div className="auth-intro-footer"><span>PATENT RESEARCH, IN FOCUS.</span><span>Discover. Examine. Connect.</span></div>
    </section>
    <section className="auth-form-panel" aria-labelledby="auth-title">
    <div className="auth-card">
      <div className="auth-tabs">
        <button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => changeMode('login')}>Sign in</button>
        <button type="button" disabled={busy} aria-pressed={mode === 'register'} onClick={() => changeMode('register')}>Create account</button>
      </div>
      <div className="auth-form-heading">
      <p className="auth-form-eyebrow">YOUR RESEARCH WORKSPACE</p>
      <h2 id="auth-title">{title}</h2>
      <p>{mode === 'register' ? 'Make room for your next discovery. Start with your details below.' : mode === 'login' ? 'Pick up where your curiosity left off.' : 'We’ll help you get back to your research. Reset links are valid for 30 minutes.'}</p>
      </div>
      {(error || serviceError) && <div role="alert" className="auth-error">{error || serviceError}</div>}
      {notice && <div role="status" className="auth-notice">{notice}</div>}
      <form onSubmit={submit}><fieldset disabled={busy}>
        {mode === 'register' && <div className="auth-field-row">
          <div className="auth-field"><label htmlFor="auth-name">Full name</label><input id="auth-name" placeholder="Your full name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="auth-field"><label htmlFor="auth-org">Organization <span>(optional)</span></label><input id="auth-org" placeholder="Company or university" autoComplete="organization" maxLength={200} value={organization} onChange={e => setOrganization(e.target.value)} /></div>
        </div>}
        {mode !== 'reset' && <div className="auth-field"><label htmlFor="auth-email">Email address</label><input id="auth-email" placeholder="you@example.com" type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></div>}
        {mode !== 'forgot' && <div className="auth-field"><label htmlFor="auth-password">Password</label><div className="auth-password"><input id="auth-password" placeholder={mode === 'login' ? 'Enter your password' : 'Create a long passphrase'} type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} aria-describedby={mode !== 'login' ? 'auth-password-hint' : undefined} required minLength={mode === 'login' ? 1 : 15} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>
          {mode !== 'login' && <small id="auth-password-hint">Use 15–128 characters. Spaces are welcome.</small>}
        </div>}
        {(mode === 'register' || mode === 'reset') && <div className="auth-field"><label htmlFor="auth-confirm">Confirm password</label><input id="auth-confirm" placeholder="Enter your passphrase again" type={visible ? 'text' : 'password'} autoComplete="new-password" required maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>}
        {mode === 'login' && <div className="auth-options"><label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember me <span>(30 days)</span></label><button type="button" onClick={() => changeMode('forgot')}>Forgot password?</button></div>}
        <button className="auth-submit" type="submit"><span>{busy ? 'Please wait…' : { login: 'Sign in', register: 'Create account', forgot: 'Send reset link', reset: 'Update password' }[mode]}</span>{!busy && <ArrowRight size={18} aria-hidden="true" />}</button>
      </fieldset></form>
      <div className="auth-switch">{mode === 'login' ? <>New to PatentIntel? <button type="button" disabled={busy} onClick={() => changeMode('register')}>Create an account</button></> : mode === 'register' ? <>Already have an account? <button type="button" disabled={busy} onClick={() => changeMode('login')}>Sign in</button></> : <button type="button" disabled={busy} onClick={() => changeMode('login')}><ArrowLeft size={14} aria-hidden="true" /> Back to sign in</button>}</div>
      <p className="auth-footnote"><LockKeyhole size={14} aria-hidden="true" /> Password-protected access to your account</p>
    </div>
    <p className="auth-panel-footer">A little curiosity can go a long way.</p>
    </section>
  </main>;
};
