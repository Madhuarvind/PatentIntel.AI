import React from 'react';
import type { ModuleView } from '../types';
import { 
  FolderKanban, 
  Search, 
  GitCompare, 
  TrendingUp, 
  FileCheck, 
  ShieldCheck, 
  ArrowUpRight,
  Zap,
  BookOpen
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenLiterature: (query?: string) => void;
}

export const DashboardView: React.FC<Props> = ({ onNavigate, onOpenLiterature }) => {
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
            Analyze patent documents using hybrid retrieval (BM25 + SBERT), structural claim element decomposition, prior-art chronological mapping, and evidence-grounded LLM explanations.
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

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-cyan)' }}>
              <FolderKanban size={22} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <TrendingUp size={14} /> +12% this wk
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>128</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Patents In Workspace</div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-indigo)' }}>
              <FileCheck size={22} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <Zap size={14} /> Active Tree
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>1,420</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Claims Decomposed</div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-emerald)' }}>
              <GitCompare size={22} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              F1: 88%
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>842</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Element Mappings</div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-purple)' }}>
              <ShieldCheck size={22} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              Grounded
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>96.4%</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>LLM Evidence Verification</div>
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
              Combines BM25 keyword indexing with dense vector SBERT embeddings to prevent terminology mismatch.
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
              Decomposes independent claims into technical elements (components, processes, constraints) and aligns pairs.
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
              Generates traceable explanations, highlights technical differences, and cites retrieved prior-art evidence.
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

      {/* Recent Patent Analyses Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Recent Patent Similarity Audits
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Target patents actively analyzed against USPTO & PatentMatch benchmark datasets.
            </p>
          </div>
          <button className="btn-secondary" onClick={() => onNavigate('workspace')} style={{ fontSize: '0.82rem' }}>
            View Full Library
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
              <th style={{ padding: '10px 12px' }}>Patent No.</th>
              <th style={{ padding: '10px 12px' }}>Title</th>
              <th style={{ padding: '10px 12px' }}>CPC Class</th>
              <th style={{ padding: '10px 12px' }}>Top Similar Patent</th>
              <th style={{ padding: '10px 12px' }}>Similarity Score</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>US10928341B2</td>
              <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>AI Autonomous Collision Warning Apparatus</td>
              <td style={{ padding: '12px' }}><span className="badge badge-indigo">B60W 30/09</span></td>
              <td style={{ padding: '12px', color: 'var(--text-muted)' }}>US10482391 (89% match)</td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '88%', height: '100%', background: 'var(--gradient-primary)' }} />
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>88/100</span>
                </div>
              </td>
              <td style={{ padding: '12px' }}><span className="badge badge-emerald">Verified</span></td>
            </tr>

            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>US11048920B1</td>
              <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Multi-Modal Visual Sensor Array & Object Detection</td>
              <td style={{ padding: '12px' }}><span className="badge badge-indigo">G06V 20/58</span></td>
              <td style={{ padding: '12px', color: 'var(--text-muted)' }}>US10129482 (84% match)</td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '84%', height: '100%', background: 'var(--gradient-primary)' }} />
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>84/100</span>
                </div>
              </td>
              <td style={{ padding: '12px' }}><span className="badge badge-emerald">Verified</span></td>
            </tr>

            <tr>
              <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>US11849201B2</td>
              <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Deep Learning Neural Network for Driver Monitoring</td>
              <td style={{ padding: '12px' }}><span className="badge badge-indigo">G06N 3/08</span></td>
              <td style={{ padding: '12px', color: 'var(--text-muted)' }}>US10992381 (92% match)</td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '92%', height: '100%', background: 'var(--gradient-primary)' }} />
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>92/100</span>
                </div>
              </td>
              <td style={{ padding: '12px' }}><span className="badge badge-amber">Audit Flagged</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
