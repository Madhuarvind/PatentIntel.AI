import React, { useState, useEffect } from 'react';
import type { ModuleView } from '../types';
import { workspaceStore } from '../services/workspaceStore';
import { 
  FolderKanban, 
  Search, 
  GitCompare, 
  TrendingUp, 
  FileCheck, 
  ShieldCheck, 
  ArrowUpRight,
  Zap,
  BookOpen,
  PlusCircle
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenLiterature: (query?: string) => void;
}

export const DashboardView: React.FC<Props> = ({ onNavigate, onOpenLiterature }) => {
  const [patents, setPatents] = useState(workspaceStore.getPatents());
  const [metrics, setMetrics] = useState(workspaceStore.getMetrics());

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setPatents(workspaceStore.getPatents());
      setMetrics(workspaceStore.getMetrics());
    });
    return unsubscribe;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Welcome */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: '10px' }}>
            <Zap size={12} /> Claim-Centric Patent Intelligence System
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>
            Welcome to PatentIntel R&D Workspace
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '680px', lineHeight: '1.5' }}>
            Analyze real patent documents using live USPTO/EPO retrieval, client-side PDF parsing, 2D vector clusters, statutory § 102/103 invalidity scores, and grounded LLM reasoning.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={() => onNavigate('search')}>
            <Search size={16} /> Start Hybrid Search
          </button>
          <button className="btn-secondary" onClick={() => onOpenLiterature('patent similarity deep learning')}>
            <BookOpen size={16} /> Real-Time Academic Search
          </button>
        </div>
      </div>

      {/* Real-Time Dynamic Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-cyan)' }}>
              <FolderKanban size={22} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <TrendingUp size={14} /> Live Sync
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{metrics.totalPatents}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Real Patents In Workspace</div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-indigo)' }}>
              <FileCheck size={22} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <Zap size={14} /> Parsed Scope
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{metrics.totalClaims}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Active Claims Decomposed</div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-emerald)' }}>
              <GitCompare size={22} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              SBERT Metric
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{metrics.totalElements}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Claim Elements Mapped</div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-purple)' }}>
              <ShieldCheck size={22} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              Verified
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{metrics.accuracy > 0 ? `${metrics.accuracy}%` : '0%'}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>LLM Grounding Score</div>
        </div>
      </div>

      {/* Core Workflow Module Shortcut Cards */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          R&D Module Workflow Pipeline
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {/* Card 1: Hybrid Retrieval */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('search')}
            style={{ padding: '20px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge badge-cyan">Module 01</span>
              <ArrowUpRight size={18} color="var(--accent-cyan)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Hybrid Search Engine
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '14px' }}>
              Combines BM25 keyword indexing with dense vector SBERT embeddings across official USPTO/EPO databases.
            </p>
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenLiterature('semantic query expansion patent retrieval'); }}
              style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
            >
              Search Semantic Retrieval Papers →
            </button>
          </div>

          {/* Card 2: Claim-to-Claim Mapping */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('mapping')}
            style={{ padding: '20px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge badge-indigo">Module 02</span>
              <ArrowUpRight size={18} color="var(--accent-indigo)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Claim Element Mapping
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '14px' }}>
              Decomposes independent claims into technical elements and calculates 35 U.S.C. § 102/103 statutory invalidity scores.
            </p>
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenLiterature('patent plagiarism claim similarity SBERT'); }}
              style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', color: 'var(--accent-indigo)', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
            >
              Search Claim Plagiarism Papers →
            </button>
          </div>

          {/* Card 3: Prior-Art & AI Reasoning */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('ai-evidence')}
            style={{ padding: '20px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge badge-purple">Module 03</span>
              <ArrowUpRight size={18} color="var(--accent-purple)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Evidence LLM Reasoning
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '14px' }}>
              Generates traceable explanations, highlights technical differences, and exports 1-click USPTO examination dossiers.
            </p>
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenLiterature('prior art search artificial intelligence'); }}
              style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', color: 'var(--accent-purple)', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
            >
              Search AI Prior-Art Papers →
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Dynamic Patent Analyses Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Live Workspace Patent Repository ({patents.length} Patents Loaded)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Real patents currently imported into active examination session.
            </p>
          </div>
          <button className="btn-primary" onClick={() => onNavigate('workspace')} style={{ fontSize: '0.82rem' }}>
            <PlusCircle size={14} /> Upload / Import Patents
          </button>
        </div>

        {patents.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            <p>No patents currently imported in workspace session.</p>
            <button className="btn-secondary" onClick={() => onNavigate('workspace')}>Import Live Patent from USPTO API</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '10px 12px' }}>Patent No.</th>
                <th style={{ padding: '10px 12px' }}>Title</th>
                <th style={{ padding: '10px 12px' }}>CPC Class</th>
                <th style={{ padding: '10px 12px' }}>Assignee</th>
                <th style={{ padding: '10px 12px' }}>Claims Count</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {patents.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{p.id}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{p.title}</td>
                  <td style={{ padding: '12px' }}><span className="badge badge-indigo">{p.cpcCodes?.[0] || 'Unclassified'}</span></td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.assignee || 'Independent Inventor'}</td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{p.claims ? p.claims.length : 0} Claims</td>
                  <td style={{ padding: '12px' }}><span className="badge badge-emerald">Live Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
