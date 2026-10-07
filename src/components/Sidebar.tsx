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
      background: '#fbfcf8',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      {/* Navigation Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="sidebar-section-title" style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '0 8px 8px'
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
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '9px',
                      border: 'none',
                      background: isActive ? '#e2f0e5' : 'transparent',
                      color: isActive ? '#204b40' : '#526a70',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease',
                      boxShadow: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                      <Icon size={20} style={{ flexShrink: 0 }} color={isActive ? '#204b40' : '#526a70'} />
                      <span className="sidebar-item-label" style={{ whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="sidebar-badge" style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isActive ? 'rgba(34,104,88,0.22)' : 'var(--bg-surface)',
                        color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)',
                        border: '1px solid ' + (isActive ? 'rgba(34,104,88,0.4)' : 'var(--border-color)'),
                        flexShrink: 0,
                        marginLeft: '8px'
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
      <div className="sidebar-footer-card" style={{
        padding: '16px',
        borderRadius: '12px',
        background: '#ffffff',
        border: '1px solid #cad7cf',
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
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>Browser-local workspace</span>
          </div>

          <span className="badge badge-cyan" style={{ fontSize: '0.72rem', padding: '2px 7px' }}>
            <Database size={11} style={{ marginRight: '3px' }} /> {patentCount} Patents
          </span>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={13} color="var(--accent-cyan)" />
          <span>Local workspace · source availability checked on request</span>
        </div>
      </div>
    </aside>
  );
};
