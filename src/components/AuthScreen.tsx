import React, { useState } from 'react';
import type { AuthMode } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  GitMerge, 
  Search, 
  BookOpen,
  KeyRound
} from 'lucide-react';

interface Props {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
  onOpenLiterature: () => void;
}

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess, onOpenLiterature }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Patent Examiner');
  const [rememberMe, setRememberMe] = useState(true);
  const [resetSent, setResetSent] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      name: fullName || 'Dr. Alex Vance',
      email: email || 'alex.vance@patentintel.ai',
      role: role
    });
  };

  const handleDemoLogin = () => {
    onLoginSuccess({
      name: 'Dr. Alex Vance',
      email: 'alex.vance@uspto-research.gov',
      role: 'Lead Patent Examiner & R&D Fellow'
    });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      background: 'var(--bg-main)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 242, 254, 0.12) 0%, rgba(11, 15, 25, 0) 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(11, 15, 25, 0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* LEFT PANE: BRANDING & PATENT INTELLIGENCE VISUALIZER */}
      <div style={{
        flex: 1,
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 2,
        borderRight: '1px solid var(--border-color)',
        background: 'linear-gradient(180deg, rgba(18, 24, 39, 0.4) 0%, rgba(11, 15, 25, 0.8) 100%)'
      }}>
        {/* Brand Top Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Cpu size={24} color="#0B0F19" />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                PatentIntel<span className="gradient-text">.AI</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Explainable Patent Intelligence Platform
              </div>
            </div>
          </div>
        </div>

        {/* Central Graphic & R&D Value Proposition */}
        <div style={{ margin: '40px 0' }}>
          <div className="badge badge-cyan" style={{ marginBottom: '16px', padding: '6px 14px' }}>
            <Sparkles size={14} /> IEEE & PatentMatch Benchmark Grounded
          </div>

          <h1 style={{
            fontSize: '2.6rem',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--text-main)',
            marginBottom: '20px'
          }}>
            Intelligent Patent <br />
            <span className="gradient-text">Similarity Analyzer</span> <br />
            Using LLMs & SBERT
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '560px',
            marginBottom: '32px'
          }}>
            An explainable, claim-centric R&D platform combining hybrid retrieval (BM25 + Dense Embeddings), structural claim element mapping, prior-art timeline analysis, and evidence-grounded AI explanations.
          </p>

          {/* Feature Badges Container */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', maxWidth: '560px' }}>
            <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ color: 'var(--accent-cyan)', background: 'rgba(0,242,254,0.1)', padding: '8px', borderRadius: '8px' }}>
                <Search size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>Hybrid Retrieval</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>BM25 + Patent Vector Search</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ color: 'var(--accent-indigo)', background: 'rgba(99,102,241,0.1)', padding: '8px', borderRadius: '8px' }}>
                <GitMerge size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>Claim Mapping</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Element-to-element alignment</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '8px' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>Prior-Art Evidence</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Chronology & coverage matrix</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ color: 'var(--accent-purple)', background: 'rgba(139,92,246,0.1)', padding: '8px', borderRadius: '8px' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>Evidence LLM</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Traceable reasoning & diffs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info & literature trigger */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Real-Time IEEE & Academic Literature Retrieval Index
          </div>
          <button 
            className="btn-secondary" 
            onClick={onOpenLiterature}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            <BookOpen size={14} /> Real-Time Academic Search
          </button>
        </div>
      </div>

      {/* RIGHT PANE: AUTHENTICATION CARD */}
      <div style={{
        width: '480px',
        minWidth: '480px',
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'var(--bg-card-solid)',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Auth Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '32px'
        }}>
          <button
            onClick={() => { setMode('login'); setResetSent(false); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'login' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setResetSent(false); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: mode === 'register' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'register' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* SIGN IN FORM */}
        {mode === 'login' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                Welcome Back
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Sign in to access your patent intelligence workspace & claim similarity models.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Work Email / Institutional ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    required
                    placeholder="alex.vance@uspto-research.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--accent-cyan)' }}
                  />
                  Remember session on this device
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px', fontSize: '0.95rem' }}>
                Sign In to Platform <ArrowRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Quick Reviewer Access</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>

              {/* DEMO ONE-CLICK LOGIN BUTTON */}
              <button
                type="button"
                onClick={handleDemoLogin}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(0, 242, 254, 0.08)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sparkles size={18} /> Instant Demo Examiner Login (1-Click)
              </button>
            </form>
          </div>
        )}

        {/* CREATE ACCOUNT FORM */}
        {mode === 'register' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                Create Account
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Register your research workspace to analyze patent claims and prior-art networks.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Full Name & Title
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Dr. Alex Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Institutional / Work Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    required
                    placeholder="alex.vance@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Organization / University / Firm
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="National Patent Research Lab"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Research Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                  style={{ background: 'var(--bg-input)', cursor: 'pointer' }}
                >
                  <option value="Patent Examiner">Patent Examiner / Analyst</option>
                  <option value="IP Attorney">IP Attorney / Legal Counsel</option>
                  <option value="R&D Researcher">R&D Scientist / Engineer</option>
                  <option value="Academic Researcher">Academic Researcher / Student</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px', fontSize: '0.95rem' }}>
                Register & Enter Platform <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                Reset Password
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Enter your account email and we'll dispatch a secure password reset link.
              </p>
            </div>

            {resetSent ? (
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '6px' }}>Reset Link Sent</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  We've sent recovery instructions to <strong>{email || 'your email'}</strong>. Please check your inbox.
                </p>
                <button className="btn-secondary" onClick={() => setMode('login')} style={{ width: '100%', justifyContent: 'center' }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="email"
                      required
                      placeholder="alex.vance@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  <KeyRound size={18} /> Send Reset Link
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' }}
                >
                  Cancel and return to Sign In
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
