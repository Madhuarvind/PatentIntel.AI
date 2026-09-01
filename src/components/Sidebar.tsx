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
  PenTool
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
        { id: 'search', label: 'Hybrid Search Engine', icon: Search, badge: 'BM25+SBERT' }
      ]
    },
    {
      title: 'ANALYSIS & REASONING',
      items: [
        { id: 'claims', label: 'Claim Decomposition', icon: Layers },
        { id: 'mapping', label: 'Claim-to-Claim Mapping', icon: GitCompare, badge: 'Core' },
        { id: 'timeline', label: 'Prior-Art Timeline', icon: Clock },
        { id: 'ai-evidence', label: 'AI Evidence Reasoning', icon: Sparkles, badge: 'LLM' },
        { id: 'claim-synthesizer', label: 'AI Claim Synthesizer', icon: PenTool, badge: 'NEW' }
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
      width: '285px',
      minWidth: '285px',
      height: '100%',
      flexShrink: 0,
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
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <div style={{
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
                    style={{
                      width: '100%',
                      padding: '10px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <Icon size={17} style={{ flexShrink: 0 }} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                      <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: isActive ? 'rgba(0,242,254,0.2)' : 'var(--bg-surface)',
                        color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)',
                        border: '1px solid var(--border-color)',
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
      <div className="glass-panel" style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        marginTop: '20px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px #10B981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Live Workspace Active</span>
          </div>

          <span className="badge badge-cyan" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
            <Database size={10} style={{ marginRight: '3px' }} /> {patentCount} Patents
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Activity size={12} color="var(--accent-cyan)" />
          <span>USPTO Open Data & Semantic Scholar Synced</span>
        </div>
      </div>
    </aside>
  );
};
