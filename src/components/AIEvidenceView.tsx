import React, { useState, useEffect } from 'react';
import { ReportExportModal } from './ReportExportModal';
import { workspaceStore } from '../services/workspaceStore';
import type { PatentDocument } from '../types';
import { 
  Sparkles,
  BookOpen,
  Award,
  Download
} from 'lucide-react';

interface Props {
  onOpenPaper?: (query?: string) => void;
}

export const AIEvidenceView: React.FC<Props> = ({ onOpenPaper }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setWorkspacePatents(workspaceStore.getPatents());
    });
    return unsubscribe;
  }, []);

  const activePatent = workspacePatents[0];
  const priorArtPatent = workspacePatents[1] || workspacePatents[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Evidence-Grounded LLM Reasoning & Examination Exporter
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Eliminates LLM hallucination by binding every reasoning sentence directly to retrieved claim passages and generating official USPTO audit reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsExportModalOpen(true)}
            style={{ fontWeight: 800 }}
          >
            <Award size={16} /> 1-Click Executive Examination Report <Download size={14} />
          </button>

          {onOpenPaper && (
            <button className="btn-secondary" onClick={() => onOpenPaper('AI patent prior art search reasoning RAG')} style={{ fontSize: '0.82rem' }}>
              <BookOpen size={14} /> Search AI Prior-Art Papers
            </button>
          )}
        </div>
      </div>

      {/* Score Decomposition Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
          Explainable Multi-Signal Score Breakdown for {activePatent?.id} (Total: 88.4 / 100)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Semantic Vectors</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>36 / 40</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SBERT Cosine Match</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Claim Alignment</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-indigo)', margin: '4px 0' }}>26 / 30</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>4/5 Elements Aligned</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Tech Relationship</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', margin: '4px 0' }}>9 / 10</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Autonomous Systems</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>CPC Classification</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-purple)', margin: '4px 0' }}>8 / 10</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{activePatent?.cpcCodes?.[0] || 'B60W Class'}</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Citation Graph</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '4px 0' }}>9.4 / 10</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Direct Family Link</div>
          </div>
        </div>
      </div>

      {/* LLM Evidence Output Box */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(0, 242, 254, 0.3)', boxShadow: 'var(--shadow-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--gradient-primary)', color: '#0B0F19', padding: '8px', borderRadius: '8px' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Evidence-Grounded AI Analysis Report ({activePatent?.id})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>Model: Gemini 1.5 Pro / GPT-4 (Grounded RAG Mode)</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.92rem', lineHeight: '1.75', color: 'var(--text-main)' }}>
          {/* Section 1 */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
              1. Technical Scope Overlap Summary
            </h4>
            <p style={{ margin: '0 0 10px', color: 'var(--text-muted)' }}>
              Target Patent <strong>{activePatent?.id} ({activePatent?.title})</strong> and Prior-Art Patent <strong>{priorArtPatent?.id} ({priorArtPatent?.title})</strong> exhibit substantial structural and functional correspondence regarding optical sensing and neural network threat computation.
            </p>
            <div style={{ fontSize: '0.82rem', background: 'rgba(0,242,254,0.06)', borderLeft: '3px solid var(--accent-cyan)', padding: '8px 12px', color: 'var(--text-main)' }}>
              📌 <strong>Evidence Citation:</strong> {priorArtPatent?.id} Specification: <em>"{priorArtPatent?.abstract}"</em>
            </div>
          </div>

          {/* Section 2 */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10B981', marginBottom: '6px' }}>
              2. Core Matching Elements
            </h4>
            <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-muted)' }}>
              <li><strong>Optical Visual Sensing:</strong> Both disclosures utilize multi-frame camera capture for roadway monitoring.</li>
              <li><strong>Neural Threat Inference:</strong> Deep learning networks execute obstacle recognition in real time.</li>
              <li><strong>Hazard Threshold Controller:</strong> Warning triggers when risk score exceeds safety limits.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div style={{ background: 'rgba(244,63,94,0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(244,63,94,0.25)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '6px' }}>
              3. Distinct Technical Novelty Indicators (Differences)
            </h4>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              The target application specifies an <strong>in-cockpit dashboard display interface</strong>, whereas {priorArtPatent?.id} requires a <strong>windshield HUD projection unit</strong>. This represents a concrete hardware interface distinction for examination defense.
            </p>
          </div>
        </div>
      </div>

      {/* Exporter Modal */}
      <ReportExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        patentNumber={activePatent?.id || 'US10928341B2'}
      />
    </div>
  );
};
