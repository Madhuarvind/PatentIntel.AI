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
  ShieldCheck
} from 'lucide-react';

interface Props {
  activeView: ModuleView;
  onSelectView: (view: ModuleView) => void;
}

interface NavSection {
  title: string;
  items: { id: ModuleView; label: string; icon: React.ElementType; badge?: string }[];
}

export const Sidebar: React.FC<Props> = ({ activeView, onSelectView }) => {
  const sections: NavSection[] = [
    {
      title: 'CORE R&D MODULES',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'workspace', label: 'Patent Workspace', icon: FolderKanban, badge: 'Live Library' },
        { id: 'search', label: 'Hybrid Search Engine', icon: Search, badge: 'BM25 + SBERT' }
      ]
    },
    {
      title: 'ANALYSIS & REASONING',
      items: [
        { id: 'claims', label: 'Claim Decomposition', icon: Layers },
        { id: 'mapping', label: 'Claim-to-Claim Mapping', icon: GitCompare, badge: 'Core' },
        { id: 'timeline', label: 'Prior-Art Citation Timeline', icon: Clock },
        { id: 'ai-evidence', label: 'AI Evidence Reasoning', icon: Sparkles, badge: 'LLM' }
      ]
    },
    {
      title: 'EVALUATION & SYSTEM',
      items: [
        { id: 'analytics', label: 'Evaluation Benchmarks', icon: BarChart3 },
        { id: 'settings', label: 'System Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside style={{
      width: '270px',
      minWidth: '270px',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-card-solid)',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Module Links Grouped by Category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 12px 8px'
            }}>
              {section.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.86rem',
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
                        fontSize: '0.66rem',
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
          </div>
        ))}
      </div>

      {/* R&D Benchmark Box */}
      <div className="glass-panel" style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        marginTop: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <ShieldCheck size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Real-Time R&D Suite</span>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
          PatentMatch Benchmark • Real-Time OpenAlex & Semantic Scholar Search • SBERT Multi-Sim Integrated.
        </p>
      </div>
    </aside>
  );
};
