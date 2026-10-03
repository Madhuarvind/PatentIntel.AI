import React, { useState, useEffect, useMemo } from 'react';
import { workspaceStore } from '../services/workspaceStore';
import type { PatentDocument } from '../types';
import { PatentSelector } from './PatentSelector';
import {
  generateClaimEvidenceRecord,
  exportClaimEvidenceMarkdown,
  exportClaimEvidenceJson,
  type MatchState
} from '../services/claimEvidenceService';
import {
  BookOpen,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Clock,
  Layers,
  FileText
} from 'lucide-react';

interface Props {
  onOpenPaper?: (query?: string) => void;
}

export const AIEvidenceView: React.FC<Props> = ({ onOpenPaper }) => {
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());

  const initialPair = useMemo(() => workspaceStore.getComparisonPair(), []);
  const [targetId, setTargetId] = useState<string>(initialPair.targetId);
  const [priorArtId, setPriorArtId] = useState<string>(initialPair.candidateId);
  const [claimSelection, setClaimSelection] = useState({ targetClaimNumber: initialPair.targetClaimNumber, candidateClaimNumber: initialPair.candidateClaimNumber });
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      const updated = workspaceStore.getPatents();
      setWorkspacePatents(updated);
    });
    return unsubscribe;
  }, []);

  const handleTargetChange = (newId: string) => {
    setTargetId(newId);
    setClaimSelection({ targetClaimNumber: undefined, candidateClaimNumber: undefined });
    workspaceStore.setComparisonPair(newId, priorArtId);
  };

  const handlePriorArtChange = (newId: string) => {
    setPriorArtId(newId);
    setClaimSelection({ targetClaimNumber: undefined, candidateClaimNumber: undefined });
    workspaceStore.setComparisonPair(targetId, newId);
  };

  const activePatent = workspacePatents.find(p => p.id === targetId);
  const priorArtPatent = workspacePatents.find(p => p.id === priorArtId);

  const evidenceResult = useMemo(() => {
    if (!activePatent || !priorArtPatent) return null;
    return generateClaimEvidenceRecord(activePatent, priorArtPatent, claimSelection);
  }, [activePatent, priorArtPatent, claimSelection]);

  const handleExport = (format: 'md' | 'json') => {
    if (!evidenceResult || !evidenceResult.success) return;
    const content = format === 'md'
      ? exportClaimEvidenceMarkdown(evidenceResult.record)
      : exportClaimEvidenceJson(evidenceResult.record);

    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-ledger-${evidenceResult.record.targetDocumentId}-vs-${evidenceResult.record.candidateDocumentId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported evidence ledger as .${format}`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  const renderMatchBadge = (state: MatchState) => {
    switch (state) {
      case 'SUPPORTED':
        return (
          <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Literal text match
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> Partial Overlap
          </span>
        );
      case 'UNMATCHED':
        return (
          <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> Unmatched
          </span>
        );
      case 'UNASSESSED':
      default:
        return (
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FileQuestion size={12} /> Unassessed
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Prior-Art Evidence Ledger & Reasoning
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Draft lexical comparison of stored claims. Literal text matches require technical review; legal eligibility is not assessed. Parent-claim limitations are not expanded.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {evidenceResult?.success && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn-primary"
                onClick={() => handleExport('md')}
                style={{ fontSize: '0.84rem' }}
                title="Export evidence ledger as Markdown"
              >
                <Download size={14} /> Export Evidence (.md)
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleExport('json')}
                style={{ fontSize: '0.84rem' }}
                title="Export evidence ledger as JSON"
              >
                <Download size={14} /> Export JSON
              </button>
            </div>
          )}

          {onOpenPaper && (
            <button className="btn-secondary" onClick={() => onOpenPaper('AI patent prior art search reasoning RAG')} style={{ fontSize: '0.84rem' }}>
              <BookOpen size={14} /> Search AI Prior-Art Papers
            </button>
          )}
        </div>
      </div>

      {exportNotice && (
        <div style={{ padding: '10px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', borderRadius: '8px', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
          {exportNotice}
        </div>
      )}

      {/* Dynamic Patent Selector Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', borderRadius: '14px' }}>
        <div>
          <PatentSelector
            patents={workspacePatents}
            selectedPatentId={targetId}
            onSelect={handleTargetChange}
            label="Select Target Application Patent:"
            placeholder="Search target application patent..."
          />
        </div>

        <div>
          <PatentSelector
            patents={workspacePatents}
            selectedPatentId={priorArtId}
            onSelect={handlePriorArtChange}
            label="Select Candidate Prior-Art Reference:"
            placeholder="Search prior-art reference patent..."
          />
        </div>
      </div>

      {/* Rejection / Empty States */}
      {(!activePatent || !priorArtPatent) && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '14px' }}>
          <Layers size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Select Target and Prior-Art Documents</h3>
          <p style={{ fontSize: '0.86rem', maxWidth: '480px', margin: '0 auto' }}>
            Choose two distinct patent records in your workspace session to generate a verified evidence ledger.
          </p>
        </div>
      )}

      {evidenceResult && !evidenceResult.success && (
        <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: '14px', border: '1px solid rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <AlertTriangle size={24} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-rose)', margin: '0 0 6px' }}>
                Comparison Input Rejected
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: '0 0 8px', lineHeight: '1.5' }}>
                {evidenceResult.error}
              </p>
              {evidenceResult.rejectionReason === 'SELF_COMPARISON_REJECTED' && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  A document cannot serve as prior art against itself. Select a different candidate reference to evaluate patentability.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real Traceable Evidence Summary & Metrics */}
      {evidenceResult?.success && (
        <>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div className="badge badge-cyan" style={{ marginBottom: '6px' }}>
                  <FileText size={12} /> Draft Evidence Ledger
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Evidence Assessment: {evidenceResult.record.targetDocumentId} ↔ {evidenceResult.record.candidateDocumentId}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Overall Assessment:</span>
                {renderMatchBadge(evidenceResult.record.overallState)}
              </div>
            </div>

            {/* Evidence Metric Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {/* Total Limitations */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Total Limitations</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
                  {evidenceResult.record.totalLimitations}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Target Claim {evidenceResult.record.targetClaimNumber}</div>
              </div>

              {/* Supported */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Literal Text Matches</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)', margin: '4px 0' }}>
                  {evidenceResult.record.supportedCount}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {evidenceResult.record.totalLimitations > 0 ? `${Math.round((evidenceResult.record.supportedCount / evidenceResult.record.totalLimitations) * 100)}% coverage` : '0%'}
                </div>
              </div>

              {/* Partial */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Partial Overlap</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '4px 0' }}>
                  {evidenceResult.record.partialCount}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Requires narrower reading</div>
              </div>

              {/* Unmatched */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Unmatched (Novel)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-rose)', margin: '4px 0' }}>
                  {evidenceResult.record.unmatchedCount}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Distinguishing features</div>
              </div>

              {/* Temporal Prior-Art Status */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Temporal Status</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--accent-cyan)" />
                  {evidenceResult.record.temporalStatus === 'PUBLISHED_BEFORE_FILING' ? 'Earlier publication' : 'Uncertified'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {evidenceResult.record.candidatePublicationDate || evidenceResult.record.candidateFilingDate || 'Date missing'}
                </div>
              </div>
            </div>
          </div>

          {/* Traceable Excerpts Ledger Table */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
              Limitation-by-Limitation Traceable Excerpts
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {evidenceResult.record.limitations.map(lim => (
                <div
                  key={lim.limitationId}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                        {lim.limitationId}: {lim.canonicalName}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                        {lim.limitationText}
                      </div>
                    </div>
                    <div>
                      {renderMatchBadge(lim.matchState)}
                    </div>
                  </div>

                  {/* Traceable Candidate Excerpt */}
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.84rem'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Prior Art Excerpt{lim.candidateClaimNumber ? ` (Claim ${lim.candidateClaimNumber})` : ''}:
                    </span>
                    {lim.candidateExcerpt ? (
                      <span style={{ color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.45' }}>
                        "{lim.candidateExcerpt}"
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        No corresponding limitation passage identified in candidate document.
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                    <strong>Evidence Analysis:</strong> {lim.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
