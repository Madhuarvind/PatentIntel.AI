import React from 'react';
import type { ModuleView } from '../types';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Search, 
  Layers, 
  GitCompare, 
  Clock, 
  Sparkles, 
  BarChart3, 
  Settings,
  ShieldAlert
} from 'lucide-react';

interface Props {
  activeView: ModuleView;
  onSelectView: (view: ModuleView) => void;
}

export const Sidebar: React.FC<Props> = ({ activeView, onSelectView }) => {
  const menuItems: { id: ModuleView; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'workspace', label: 'Patent Workspace', icon: FolderKanban, badge: '128' },
    { id: 'search', label: 'Hybrid Search Engine', icon: Search, badge: 'BM25+Dense' },
    { id: 'claims', label: 'Claim Decomposition', icon: Layers, badge: 'Tree' },
    { id: 'mapping', label: 'Claim-to-Claim Mapping', icon: GitCompare, badge: 'Core' },
    { id: 'timeline', label: 'Prior-Art Timeline', icon: Clock },
    { id: 'ai-evidence', label: 'AI Evidence Reasoning', icon: Sparkles, badge: 'LLM' },
    { id: 'analytics', label: 'Evaluation Benchmarks', icon: BarChart3, badge: 'F1: 88%' },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-card-solid)',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Module Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0 12px 10px'
        }}>
          Core R&D Modules
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={isActive ? 'badge badge-cyan' : 'badge'} style={{
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  background: isActive ? 'rgba(0,242,254,0.15)' : 'var(--bg-surface)',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)',
                  border: '1px solid var(--border-color)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* R&D Benchmark Box */}
      <div className="glass-panel" style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <ShieldAlert size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>R&D Benchmark Mode</span>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          PatentMatch 6.26M dataset trained • 8 Literature papers verified • Multi-Sim SBERT integrated.
        </p>
      </div>
    </aside>
  );
};
