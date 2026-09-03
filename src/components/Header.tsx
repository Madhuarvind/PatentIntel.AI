import React from 'react';
import { 
  Search, 
  BookOpen, 
  Sun, 
  Moon, 
  LogOut, 
  CheckCircle
} from 'lucide-react';

interface Props {
  user: { name: string; email: string; role: string };
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenLiterature: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<Props> = ({
  user,
  theme,
  onToggleTheme,
  onOpenLiterature,
  onLogout,
  searchQuery,
  onSearchChange
}) => {
  return (
    <header style={{
      height: '68px',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-card-solid)',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand & Workspace Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/patentintel_logo.png" 
            alt="PatentIntel.AI Logo" 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              objectFit: 'cover',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)'
            }}
          />
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              PatentIntel<span className="gradient-text">.AI</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Claim-Centric LLM Analyzer
            </div>
          </div>
        </div>

        <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

        <div className="badge badge-cyan" style={{ fontSize: '0.75rem', gap: '6px' }}>
          <CheckCircle size={12} /> Active Workspace: Prior-Art R&D #01
        </div>
      </div>

      {/* Global Quick Search */}
      <div style={{ flex: 1, maxWidth: '420px', margin: '0 24px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        <input
          type="text"
          placeholder="Search patent numbers, claims, or technical terms (e.g. US10928341)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '38px', paddingRight: '60px', fontSize: '0.84rem', height: '38px' }}
        />
        <span style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.7rem',
          background: 'var(--bg-surface)',
          padding: '2px 6px',
          borderRadius: '4px',
          color: 'var(--text-dim)',
          border: '1px solid var(--border-color)'
        }}>
          Ctrl K
        </span>
      </div>

      {/* Action Buttons & User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Literature Review R&D Trigger */}
        <button 
          className="btn-secondary"
          onClick={onOpenLiterature}
          style={{ padding: '7px 14px', fontSize: '0.82rem', borderColor: 'rgba(0, 242, 254, 0.3)', color: 'var(--accent-cyan)' }}
        >
          <BookOpen size={16} /> Real-Time Academic Search
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '8px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={18} color="var(--accent-amber)" /> : <Moon size={18} color="var(--accent-indigo)" />}
        </button>

        <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

        {/* User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--gradient-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {user.role}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            padding: '8px',
            cursor: 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
