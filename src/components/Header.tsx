import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  LogOut, 
  Cpu, 
  CheckCircle
} from 'lucide-react';

interface Props {
  user: { name: string; email: string; role: string };
  onOpenLiterature: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
}

export const Header: React.FC<Props> = ({
  user,
  onOpenLiterature,
  onLogout,
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  return (
    <header className="platform-header" style={{
      height: '68px',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-card-solid)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Brand & Workspace Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.3s ease'
          }}>
            <Cpu size={22} color="var(--text-main)" />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              PatentIntel<span className="gradient-text">.AI</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.02em' }}>
              Research & Evidence Workspace
            </div>
          </div>
        </div>

        <div style={{ height: '26px', width: '1px', background: 'var(--border-color)' }} />

        <div className="badge badge-cyan" style={{ fontSize: '0.75rem', gap: '6px', padding: '5px 14px' }}>
          <CheckCircle size={13} /> Browser-local workspace
        </div>
      </div>

      {/* Global Quick Search */}
      <div className="platform-header-search" style={{ flex: 1, maxWidth: '440px', margin: '0 24px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
        <input
          ref={searchInputRef}
          type="text"
          aria-label="Search patent sources"
          placeholder="Search patent numbers, claims, or technical terms (e.g. US10928341)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              onSearchSubmit?.(searchQuery.trim());
            }
          }}
          className="input-field"
          style={{ paddingLeft: '40px', paddingRight: '60px', fontSize: '0.84rem', height: '40px', background: 'var(--bg-input)' }}
        />
        <span style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.68rem',
          fontWeight: 700,
          background: 'var(--bg-surface)',
          padding: '3px 8px',
          borderRadius: '6px',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          Ctrl K
        </span>
      </div>

      {/* Action Buttons & User Menu */}
      <div className="platform-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Literature Review R&D Trigger */}
        <button 
          className="btn-secondary"
          onClick={onOpenLiterature}
          style={{ padding: '8px 16px', fontSize: '0.82rem', borderColor: 'rgba(34,104,88,0.35)', color: 'var(--accent-cyan)', background: 'rgba(34,104,88,0.06)' }}
        >
          <BookOpen size={16} /> Real-Time Academic Search
        </button>


        <div style={{ height: '26px', width: '1px', background: 'var(--border-color)' }} />

        {/* User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px', borderRadius: '12px', background: 'rgba(21,51,60,0.03)', border: '1px solid var(--border-color)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--gradient-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.92rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
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
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s ease'
          }}
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
