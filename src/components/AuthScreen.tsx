import React, { useState } from 'react';
import type { AuthMode } from '../types';
import { dbStore } from '../services/dbStore';
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
  KeyRound,
  Database,
  Zap,
  Activity,
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
    dbStore.registerUser(
      fullName || 'Registered User',
      email || 'user@patentintel.ai',
      role,
      organization
    );

    setRegisterSuccessMessage(`Account registered for ${fullName || email}! Please enter your password below to Sign In.`);
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
      height: '100vh',
      width: '100vw',
      display: 'flex',
      background: '#0B0F19',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Background Multi-Layer Ambient Orbs & Grid Overlay */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 242, 254, 0.16) 0%, rgba(11, 15, 25, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.20) 0%, rgba(11, 15, 25, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.6,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* LEFT PANE: FUTURISTIC AI HERO & BRANDING SECTION WITH DYNAMIC GLASS BACKGROUND */}
      <div style={{
        flex: '1.3',
        height: '100vh',
        padding: '48px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1,
        backgroundImage: 'linear-gradient(135deg, rgba(11, 15, 25, 0.88) 0%, rgba(15, 23, 42, 0.92) 100%), url(/patent_intel_hero_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Brand Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 28px rgba(0, 242, 254, 0.45)'
            }}>
              <Cpu size={28} color="#0B0F19" />
            </div>
            <div>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                PatentIntel<span style={{ background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>.AI</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#00F2FE', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Next-Gen Explainable Patent Intelligence
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            color: '#10B981',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)'
          }}>
            <Activity size={15} /> USPTO Open Data Live Synced
          </div>
        </div>

        {/* Hero Value Proposition */}
        <div style={{ maxWidth: '660px', margin: 'auto 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.28)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.84rem',
            color: '#00F2FE',
            fontWeight: 700,
            marginBottom: '24px',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.15)'
          }}>
            <Award size={16} /> Grounded on 6.26M PatentMatch Dataset & IEEE Standards
          </div>

          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            lineHeight: 1.14,
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
            marginBottom: '22px'
          }}>
            Claim-Centric Prior-Art <br />
            <span style={{
              background: 'linear-gradient(135deg, #00F2FE 0%, #6366F1 50%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Similarity & Invalidity</span> <br />
            Engine Powered by SBERT
          </h1>

          <p style={{
            fontSize: '1.08rem',
            color: '#94A3B8',
            lineHeight: 1.68,
            marginBottom: '38px',
            maxWidth: '620px'
          }}>
            Decompose multi-tier independent claims into structural limitations, compute 35 U.S.C. § 102/103 invalidity risk probabilities, and generate USPTO-grade audit reports in real time.
          </p>

          {/* Interactive Feature Matrix Cards with Generous Spacing */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            
            {/* Card 1 */}
            <div style={{
              background: 'rgba(18, 24, 39, 0.72)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.14)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00F2FE',
                flexShrink: 0
              }}>
                <Search size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3 }}>
                  Hybrid Search Engine
                </div>
                <div style={{ fontSize: '0.81rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  BM25 keyword + SBERT dense vectors
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div style={{
              background: 'rgba(18, 24, 39, 0.72)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.14)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
                flexShrink: 0
              }}>
                <GitMerge size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3 }}>
                  Claim Limitation Trees
                </div>
                <div style={{ fontSize: '0.81rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  Element-by-element structural mapping
                </div>
              </div>
            </div>

            {/* Card 3 - Enhanced Spacing & Clarity */}
            <div style={{
              background: 'rgba(18, 24, 39, 0.72)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                flexShrink: 0
              }}>
                <ShieldCheck size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3 }}>
                  35 U.S.C. § 102 & § 103 Assessment
                </div>
                <div style={{ fontSize: '0.81rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  Automated statutory invalidity risk calculator
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div style={{
              background: 'rgba(18, 24, 39, 0.72)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.14)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#A855F7',
                flexShrink: 0
              }}>
                <Database size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3 }}>
                  Cloud Database Sync
                </div>
                <div style={{ fontSize: '0.81rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  Persisted user workspace & patent storage
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom System Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '22px'
        }}>
          <div style={{ fontSize: '0.84rem', color: '#64748B' }}>
            © 2026 PatentIntel.AI • Madhuaravind P, Harish M, Mouneesh R
          </div>
          <div style={{ fontSize: '0.84rem', color: '#00F2FE', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={15} /> PatentMatch Benchmark: 89.4% Precision@10
          </div>
        </div>
      </div>

      {/* RIGHT PANE: FULL-HEIGHT STRETCHED PREMIUM AUTHENTICATION CARD */}
      <div style={{
        flex: '1',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0F172A 0%, #0B0F19 100%)',
        padding: '48px 56px',
        position: 'relative',
        zIndex: 1,
        boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center'
        }}>

          {/* Navigation Pill Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '6px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '32px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
          }}>
            <button
              onClick={() => { setMode('login'); setResetSent(false); }}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.94rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: mode === 'login' ? 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)' : 'transparent',
                color: mode === 'login' ? '#0B0F19' : '#94A3B8',
                transition: 'all 0.25s ease',
                boxShadow: mode === 'login' ? '0 0 20px rgba(0, 242, 254, 0.4)' : 'none'
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
                borderRadius: '12px',
                fontSize: '0.94rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: mode === 'register' ? 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)' : 'transparent',
                color: mode === 'register' ? '#0B0F19' : '#94A3B8',
                transition: 'all 0.25s ease',
                boxShadow: mode === 'register' ? '0 0 20px rgba(0, 242, 254, 0.4)' : 'none'
              }}
            >
              Create Account
            </button>
          </div>

          {/* REGISTRATION SUCCESS BANNER */}
          {registerSuccessMessage && mode === 'login' && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10B981',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <span>{registerSuccessMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Welcome Back
                </h2>
                <p style={{ fontSize: '0.94rem', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                  Enter your registered credentials to access your Cloud Workspace.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                    Work Email / Institutional ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={19} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="email"
                      required
                      placeholder="alex.vance@uspto-research.gov"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 44px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      style={{ background: 'none', border: 'none', color: '#00F2FE', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={19} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      style={{
                        width: '100%',
                        padding: '14px 44px 14px 44px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: '#94A3B8', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#00F2FE', borderRadius: '4px' }}
                    />
                    Remember session on this device
                  </label>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                    border: 'none',
                    color: '#0B0F19',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 0 24px rgba(0, 242, 254, 0.35)',
                    transition: 'all 0.2s ease',
                    marginTop: '4px'
                  }}
                >
                  Sign In to Platform <ArrowRight size={19} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '14px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                  <span style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Quick Examiner Access</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                </div>

                {/* DEMO ONE-CLICK LOGIN BUTTON */}
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(0, 242, 254, 0.08)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#00F2FE',
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Sparkles size={19} /> Instant Demo Examiner Login (1-Click)
                </button>
              </form>
            </div>
          )}

          {/* CREATE ACCOUNT FORM */}
          {mode === 'register' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Create Account
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#94A3B8', margin: 0 }}>
                  Register your examiner account to sync patent claim datasets.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Full Name & Title
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={19} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="text"
                      required
                      placeholder="Dr. Alex Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Institutional / Work Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={19} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="email"
                      required
                      placeholder="alex.vance@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Organization / Firm / University
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={19} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="text"
                      placeholder="National Patent Research Lab"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="input-field"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Research Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0F172A',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '0.92rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Patent Examiner">Patent Examiner / Analyst</option>
                    <option value="IP Attorney">IP Attorney / Legal Counsel</option>
                    <option value="R&D Researcher">R&D Scientist / Engineer</option>
                    <option value="Academic Researcher">Academic Researcher / Student</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={19} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="password"
                      required
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                    border: 'none',
                    color: '#0B0F19',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 0 24px rgba(0, 242, 254, 0.35)',
                    marginTop: '6px'
                  }}
                >
                  Register Account <ArrowRight size={19} />
                </button>
              </form>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
                  Reset Password
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#94A3B8', margin: 0 }}>
                  Enter your account email and we'll dispatch a secure reset token.
                </p>
              </div>

              {resetSent ? (
                <div style={{
                  padding: '24px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  textAlign: 'center'
                }}>
                  <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 14px' }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', marginBottom: '8px' }}>Reset Link Dispatched</h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '20px' }}>
                    We've sent recovery instructions to <strong>{email || 'your email'}</strong>. Please check your inbox.
                  </p>
                  <button
                    onClick={() => setMode('login')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                      Registered Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={19} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                      <input
                        type="email"
                        required
                        placeholder="alex.vance@institution.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        style={{
                          width: '100%',
                          padding: '14px 14px 14px 44px',
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '0.95rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                      border: 'none',
                      color: '#0B0F19',
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    <KeyRound size={19} /> Send Reset Token
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.88rem', cursor: 'pointer', textAlign: 'center' }}
                  >
                    Cancel and return to Sign In
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
