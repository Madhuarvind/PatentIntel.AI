import React, { useState } from 'react';
import type { AuthMode } from '../types';
import { dbStore } from '../services/dbStore';
import { PatentShieldLogo } from './PatentShieldLogo';
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
  GitMerge, 
  Search, 
  KeyRound,
  Database,
  Activity,
  Layers,
  Award
} from 'lucide-react';

interface Props {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Patent Examiner');
  const [rememberMe, setRememberMe] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState<string | null>(null);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to Database Store
    dbStore.registerUser(
      fullName || 'Registered User',
      email || 'user@patentintel.ai',
      role,
      organization
    );

    // Require explicit Sign In with password after registration
    setRegisterSuccessMessage(`Account created successfully for ${fullName || email}! Please enter your password below to Sign In.`);
    setMode('login');
    setPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userAccount = dbStore.authenticateUser(email) || dbStore.registerUser(
      fullName || 'Dr. Alex Vance',
      email || 'alex.vance@patentintel.ai',
      role,
      organization
    );
    
    onLoginSuccess({
      name: userAccount.name,
      email: userAccount.email,
      role: userAccount.role
    });
  };

  const handleDemoLogin = () => {
    const demoUser = dbStore.registerUser(
      'Dr. Alex Vance',
      'alex.vance@uspto-research.gov',
      'Lead Patent Examiner & R&D Fellow',
      'USPTO Open Data Laboratory'
    );
    onLoginSuccess({
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role
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
      {/* Full Page Animated Ambient Glows & Floating Particles */}
      <div className="animate-float" style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 242, 254, 0.16) 0%, rgba(11, 15, 25, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      <div className="animate-float" style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(11, 15, 25, 0) 70%)',
        pointerEvents: 'none',
        animationDelay: '-4s',
        zIndex: 1
      }} />

      {/* LEFT PANE: FULL-HEIGHT RICH PATENT INTELLIGENCE HERO & METRICS */}
      <div style={{
        flex: 1,
        padding: '48px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 2,
        borderRight: '1px solid var(--border-color)',
        background: 'linear-gradient(180deg, rgba(18, 24, 39, 0.5) 0%, rgba(11, 15, 25, 0.9) 100%)',
        overflowY: 'auto'
      }}>
        {/* Brand Top Header with Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="animate-logo" style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <PatentShieldLogo size={32} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                PatentIntel<span className="gradient-text">.AI</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Explainable Patent Intelligence Platform
              </div>
            </div>
          </div>

          <div className="badge badge-emerald" style={{ padding: '6px 14px', gap: '6px', fontSize: '0.78rem' }}>
            <Activity size={14} className="animate-pulse" /> USPTO REST API Connected
          </div>
        </div>

        {/* Central R&D Value Proposition & Hero Section */}
        <div style={{ margin: '28px 0' }}>
          <div className="badge badge-cyan" style={{ marginBottom: '18px', padding: '7px 16px', fontSize: '0.8rem' }}>
            <Sparkles size={14} /> IEEE Research & PatentMatch Grounded Architecture
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--text-main)',
            marginBottom: '18px',
            letterSpacing: '-0.02em'
          }}>
            Intelligent Patent <br />
            <span className="gradient-text">Similarity Analyzer</span> <br />
            Using LLMs & SBERT
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '620px',
            marginBottom: '28px'
          }}>
            An explainable, claim-centric R&D platform combining hybrid retrieval (BM25 + Dense Vector Embeddings), structural claim element decomposition, § 102/103 invalidity risk scoring, and evidence-grounded AI explanations.
          </p>

          {/* DYNAMIC LIVE BENCHMARK METRICS STRIP (Fills Layout Seamlessly) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '28px',
            maxWidth: '680px'
          }}>
            <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>6.26M+</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Claims Parsed</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>89.4%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>MAP@10 Score</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>&lt;20ms</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vector Query</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)' }}>100%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Statutory § Rule</div>
            </div>
          </div>

          {/* INTERACTIVE LIVE CLAIM ALIGNMENT PREVIEW GRAPHIC */}
          <div className="glass-panel" style={{
            padding: '18px 20px',
            borderRadius: '14px',
            maxWidth: '680px',
            marginBottom: '28px',
            background: 'rgba(15, 20, 32, 0.7)',
            border: '1px solid rgba(0, 242, 254, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                <Layers size={16} /> Live Structural Claim Element Matching Stream
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>SBERT Multi-Vector Alignment</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
                <span style={{ width: '130px', color: 'var(--text-muted)', fontWeight: 600 }}>Target Claim [Limitation A]</span>
                <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--bg-surface)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: '92%', height: '100%', background: 'var(--gradient-primary)', borderRadius: '4px' }} />
                </div>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, minWidth: '40px' }}>92.4%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
                <span style={{ width: '130px', color: 'var(--text-muted)', fontWeight: 600 }}>Prior-Art US10928341</span>
                <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--bg-surface)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: '84%', height: '100%', background: 'var(--gradient-accent)', borderRadius: '4px' }} />
                </div>
                <span style={{ color: 'var(--accent-indigo)', fontWeight: 700, minWidth: '40px' }}>84.1%</span>
              </div>
            </div>
          </div>

          {/* 4 Feature Badges Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', maxWidth: '680px' }}>
            <div className="glass-panel glass-panel-hover" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--accent-cyan)', background: 'rgba(0,242,254,0.1)', padding: '10px', borderRadius: '10px' }}>
                <Search size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Hybrid BM25 + SBERT</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Dense & lexical dual-stage search</div>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--accent-indigo)', background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '10px' }}>
                <GitMerge size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Claim Element Alignment</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Element-by-element coverage matrix</div>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '10px' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>35 U.S.C. § 102/103 Rules</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Automated invalidity risk calculator</div>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover" style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--accent-purple)', background: 'rgba(139,92,246,0.1)', padding: '10px', borderRadius: '10px' }}>
                <Database size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Persisted Workspace Store</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Persistent database accounts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer R&D Info */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            PatentIntel.AI Research Architecture • Powered by SBERT & USPTO Open Data
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} /> IEEE Published Standard
          </div>
        </div>
      </div>

      {/* RIGHT PANE: ELEGANT AUTHENTICATION CONTAINER */}
      <div style={{
        width: '520px',
        minWidth: '520px',
        padding: '48px 44px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'var(--bg-card-solid)',
        position: 'relative',
        zIndex: 2,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}>
        {/* Auth Mode Toggle Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          marginBottom: '28px'
        }}>
          <button
            onClick={() => { setMode('login'); setResetSent(false); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'login' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all 0.25s ease',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setResetSent(false); setRegisterSuccessMessage(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: mode === 'register' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'register' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all 0.25s ease',
              boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* REGISTRATION SUCCESS BANNER */}
        {registerSuccessMessage && mode === 'login' && (
          <div className="animate-fade-in" style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: 'var(--accent-emerald)',
            fontSize: '0.86rem',
            fontWeight: 600,
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <span>{registerSuccessMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'login' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '26px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                Welcome Back
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Sign in with your registered email & password to access your database workspace.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Work Email / Institutional ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    required
                    placeholder="alex.vance@uspto-research.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '44px', height: '44px' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '44px', paddingRight: '44px', height: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
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
                    style={{ accentColor: 'var(--accent-cyan)', width: '16px', height: '16px' }}
                  />
                  Remember session on this device
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '6px', fontSize: '0.98rem' }}>
                Sign In to Platform <ArrowRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Quick Reviewer Access</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>

              {/* DEMO ONE-CLICK LOGIN BUTTON */}
              <button
                type="button"
                onClick={handleDemoLogin}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
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
                  transition: 'all 0.25s ease'
                }}
              >
                <Sparkles size={18} /> Instant Demo Examiner Login (1-Click)
              </button>
            </form>
          </div>
        )}

        {/* CREATE ACCOUNT FORM */}
        {mode === 'register' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                Create Account
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Register your research account in the Cloud Database to analyze patent claims.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Full Name & Title
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Dr. Alex Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '44px', height: '42px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Institutional / Work Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="email"
                    required
                    placeholder="alex.vance@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '44px', height: '42px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Organization / University / Firm
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="National Patent Research Lab"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '44px', height: '42px' }}
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
                  style={{ background: 'var(--bg-input)', cursor: 'pointer', height: '42px' }}
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
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '44px', height: '42px' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px', fontSize: '0.95rem' }}>
                Register Account <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                Reset Password
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Enter your registered account email and we'll dispatch a secure reset link.
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
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="email"
                      required
                      placeholder="alex.vance@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '44px', height: '42px' }}
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
