import React, { useState, useEffect } from 'react';
import type { ModuleView } from '../types';
import { workspaceStore } from '../services/workspaceStore';
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
  Activity,
  Database,
  PenTool,
  Lightbulb,
  FileCheck
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
  const [patentCount, setPatentCount] = useState<number>(workspaceStore.getPatents().length);

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setPatentCount(workspaceStore.getPatents().length);
    });
    return unsubscribe;
  }, []);

  const sections: NavSection[] = [
    {
      title: 'CORE R&D MODULES',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'workspace', label: 'Patent Workspace', icon: FolderKanban, badge: 'Live' },
        { id: 'search', label: 'Prior-Art Search', icon: Search, badge: 'Sources' }
      ]
    },
    {
      title: 'ANALYSIS & REASONING',
      items: [
        { id: 'idea-novelty', label: 'R&D Idea Benchmarker', icon: Lightbulb, badge: 'R&D' },
        { id: 'review-queue', label: 'Patent Review Queue', icon: FileCheck, badge: 'Review' },
        { id: 'claims', label: 'Claim Decomposition', icon: Layers },
        { id: 'mapping', label: 'Claim-to-Claim Mapping', icon: GitCompare, badge: 'Core' },
        { id: 'timeline', label: 'Prior-Art Timeline', icon: Clock },
        { id: 'ai-evidence', label: 'Evidence Reasoning', icon: Sparkles, badge: 'Experimental' },
        { id: 'claim-synthesizer', label: 'AI Claim Synthesizer', icon: PenTool, badge: 'Experimental' }
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
    <aside className="app-sidebar" style={{
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-card-solid)',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      {/* Navigation Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Enterprise Pilot Portal Link */}
        <a
          href="#/pilot"
          className="sidebar-pilot-link"
          aria-label="Enterprise Review Pilot"
          title="Enterprise Review Pilot"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, rgba(55,86,125,0.12) 0%, rgba(112,76,135,0.08) 100%)',
            border: '1px solid rgba(112,76,135,0.3)',
            color: 'var(--accent-purple)',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.84rem',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={16} color="var(--accent-purple)" />
            <span style={{ letterSpacing: '-0.01em' }}>Enterprise Review Pilot</span>
          </div>
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(112,76,135,0.2)',
            border: '1px solid rgba(112,76,135,0.4)',
            color: 'var(--accent-purple)'
          }}>
            PILOT ↗
          </span>
        </a>
        <p className="sidebar-workspace-note" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5 }}>
          Experimental local tools. Browser records can be shared across accounts on this device.
          Use the Review Pilot for private, server-persisted proposals and assigned decisions.
        </p>

        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="sidebar-section-title" style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 8px 8px'
            }}>
              {section.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive 
                        ? 'linear-gradient(90deg, rgba(34,104,88,0.15) 0%, rgba(55,86,125,0.08) 100%)'
                        : 'transparent',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      borderLeft: isActive ? '4px solid var(--accent-cyan)' : '4px solid transparent',
                      boxShadow: isActive ? '0 4px 15px rgba(34,104,88,0.15)' : 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <Icon size={18} style={{ flexShrink: 0 }} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                      <span className="sidebar-item-label" style={{ whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="sidebar-badge" style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: isActive ? 'rgba(34,104,88,0.22)' : 'var(--bg-surface)',
                        color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)',
                        border: '1px solid ' + (isActive ? 'rgba(34,104,88,0.4)' : 'var(--border-color)'),
                        flexShrink: 0,
                        marginLeft: '4px'
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

      {/* Dynamic Active Workspace & API Sync Status Card */}
      <div className="glass-panel sidebar-footer-card" style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, rgba(34,104,88,0.05) 0%, rgba(34,104,88,0.05) 100%)',
        border: '1px solid rgba(34,104,88,0.2)',
        marginTop: '20px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              boxShadow: 'var(--shadow-sm)',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Browser-local workspace</span>
          </div>

          <span className="badge badge-cyan" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
            <Database size={10} style={{ marginRight: '3px' }} /> {patentCount} Patents
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Activity size={12} color="var(--accent-cyan)" />
          <span>Local workspace · source availability checked on request</span>
        </div>
      </div>
    </aside>
  );
};
