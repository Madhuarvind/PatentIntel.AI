import React, { useState, useEffect, useMemo } from 'react';
import type { ModuleView, PatentDocument } from '../types';
import { InvalidityCalculatorModal } from './InvalidityCalculatorModal';
import { workspaceStore } from '../services/workspaceStore';
import { PatentSelector } from './PatentSelector';
import {
  generateClaimEvidenceRecord,
  exportClaimEvidenceMarkdown,
  exportClaimEvidenceJson,
  type MatchState
} from '../services/claimEvidenceService';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Scale,
  Download,
  Layers,
  FileQuestion,
  Clock
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenPaper?: (query?: string) => void;
}

export const ClaimMappingView: React.FC<Props> = ({ onNavigate, onOpenPaper }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());

  const initialPair = useMemo(() => workspaceStore.getComparisonPair(), []);
  const [targetId, setTargetId] = useState<string>(initialPair.targetId);
  const [candidateId, setCandidateId] = useState<string>(initialPair.candidateId);
  const [targetClaimNumber, setTargetClaimNumber] = useState<number>(initialPair.targetClaimNumber ?? workspaceStore.getPatents().find(p => p.id === initialPair.targetId)?.claims?.[0]?.number ?? 1);
  const [candidateClaimNumber, setCandidateClaimNumber] = useState<number | undefined>(initialPair.candidateClaimNumber);
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
    const claimNumber = workspacePatents.find(p => p.id === newId)?.claims?.[0]?.number ?? 1;
    setTargetClaimNumber(claimNumber);
    workspaceStore.setComparisonPair(newId, candidateId, claimNumber, candidateClaimNumber);
  };

  const handleCandidateChange = (newId: string) => {
    setCandidateId(newId);
    setCandidateClaimNumber(undefined);
    workspaceStore.setComparisonPair(targetId, newId, targetClaimNumber);
  };

  const targetDoc = workspacePatents.find(p => p.id === targetId);
  const candidateDoc = workspacePatents.find(p => p.id === candidateId);

  // Compute Evidence Record
  const evidenceResult = useMemo(() => {
    if (!targetDoc || !candidateDoc) return null;
    return generateClaimEvidenceRecord(targetDoc, candidateDoc, {
      targetClaimNumber,
      candidateClaimNumber
    });
  }, [targetDoc, candidateDoc, targetClaimNumber, candidateClaimNumber]);

  const targetClaims = targetDoc?.claims || [];
  const candidateClaims = candidateDoc?.claims || [];

  const handleExport = (format: 'md' | 'json') => {
    if (!evidenceResult || !evidenceResult.success) return;
    const content = format === 'md'
      ? exportClaimEvidenceMarkdown(evidenceResult.record)
      : exportClaimEvidenceJson(evidenceResult.record);

    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claim-mapping-${evidenceResult.record.targetDocumentId}-vs-${evidenceResult.record.candidateDocumentId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported evidence chart as .${format}`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Claim-to-Claim Element Mapping & Evidence Ledger
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Draft lexical comparison with exact candidate excerpts. Text matches are not verified technical or legal support. Parent-claim limitations are not expanded.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => setIsModalOpen(true)}
            style={{ border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.08)', fontWeight: 600, fontSize: '0.84rem' }}
          >
            <Scale size={15} /> Statutory Invalidity Calculator
          </button>

          {evidenceResult?.success && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn-secondary"
                onClick={() => handleExport('md')}
                style={{ fontSize: '0.84rem' }}
                title="Export claim evidence comparison as Markdown"
              >
                <Download size={14} /> Export Markdown
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleExport('json')}
                style={{ fontSize: '0.84rem' }}
                title="Export claim evidence comparison as JSON"
              >
                <Download size={14} /> Export JSON
              </button>
            </div>
          )}

          {onOpenPaper && (
            <button className="btn-secondary" onClick={() => onOpenPaper('patent claim plagiarism similarity SBERT')} style={{ fontSize: '0.84rem' }}>
              <BookOpen size={15} /> Search Plagiarism Papers
            </button>
          )}

          <button className="btn-primary" onClick={() => onNavigate('ai-evidence')} style={{ fontSize: '0.84rem' }}>
            <Sparkles size={15} /> AI Evidence Dossier <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {exportNotice && (
        <div style={{ padding: '10px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', borderRadius: '8px', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
          {exportNotice}
        </div>
      )}

      {/* Dynamic Patent Selector Bar */}
      <div className="glass-panel" style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', borderRadius: '14px' }}>
        <div>
          <PatentSelector
            patents={workspacePatents}
            selectedPatentId={targetId}
            onSelect={handleTargetChange}
            label="Select Target Application Patent:"
            placeholder="Search target patent in workspace..."
          />
          {targetDoc && targetClaims.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Claim:</span>
              <select
                value={targetClaimNumber}
                onChange={(e) => { const n = parseInt(e.target.value, 10); setTargetClaimNumber(n); workspaceStore.setComparisonPair(targetId, candidateId, n, candidateClaimNumber); }}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              >
                {targetClaims.map(c => (
                  <option key={c.number || 1} value={c.number || 1}>
                    Claim {c.number || 1} ({c.isIndependent || c.type === 'independent' ? 'Independent' : 'Dependent'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <PatentSelector
            patents={workspacePatents}
            selectedPatentId={candidateId}
            onSelect={handleCandidateChange}
            label="Select Candidate Prior-Art Patent:"
            placeholder="Search candidate patent in workspace..."
          />
          {candidateDoc && candidateClaims.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scope:</span>
              <select
                value={candidateClaimNumber ?? ''}
                onChange={(e) => { const n = e.target.value ? parseInt(e.target.value, 10) : undefined; setCandidateClaimNumber(n); workspaceStore.setComparisonPair(targetId, candidateId, targetClaimNumber, n); }}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              >
                <option value="">All Candidate Claims + Abstract</option>
                {candidateClaims.map(c => (
                  <option key={c.number || 1} value={c.number || 1}>
                    Claim {c.number || 1} ({c.isIndependent || c.type === 'independent' ? 'Independent' : 'Dependent'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Rejection / Empty / Error States */}
      {(!targetDoc || !candidateDoc) && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '14px' }}>
          <Layers size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Select Target and Prior-Art Documents</h3>
          <p style={{ fontSize: '0.86rem', maxWidth: '480px', margin: '0 auto' }}>
            Choose two distinct patent documents from your workspace session to perform element-by-element claim mapping.
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
                  Prior-art invalidity analysis requires two distinct patent records. Comparing a patent against itself produces no legally valid novelty assessment.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Overview & Evidence Summary */}
      {evidenceResult?.success && (
        <>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', borderRadius: '14px' }}>
            {/* Target Document Details */}
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-cyan">Target Application</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{evidenceResult.record.targetProvenance}</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
                {evidenceResult.record.targetDocumentId} (Claim {evidenceResult.record.targetClaimNumber})
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {evidenceResult.record.targetDocumentTitle}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                Filing Date: {evidenceResult.record.targetFilingDate || 'Unavailable'}
              </div>
            </div>

            {/* Central Coverage Summary */}
            <div style={{ padding: '0 24px', textAlign: 'center', minWidth: '220px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                Limitation Coverage
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {evidenceResult.record.supportedCount} / {evidenceResult.record.totalLimitations}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
                {evidenceResult.record.totalLimitations > 0
                  ? `${Math.round((evidenceResult.record.supportedCount / evidenceResult.record.totalLimitations) * 100)}% literal matches`
                  : 'No limitations'}
              </div>
              <div style={{ marginTop: '8px' }}>
                {renderMatchBadge(evidenceResult.record.overallState)}
              </div>
            </div>

            {/* Candidate Prior Art Details */}
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-indigo">Retrieved Prior Art</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{evidenceResult.record.candidateProvenance}</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
                {evidenceResult.record.candidateDocumentId} {evidenceResult.record.candidateClaimNumber ? `(Claim ${evidenceResult.record.candidateClaimNumber})` : '(All Claims)'}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {evidenceResult.record.candidateDocumentTitle}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                Pub/Issue Date: {evidenceResult.record.candidatePublicationDate || evidenceResult.record.candidateFilingDate || 'Unavailable'}
              </div>
            </div>
          </div>

          {/* Temporal Notice Bar */}
          {evidenceResult.record.temporalNote && (
            <div style={{
              padding: '12px 18px',
              borderRadius: '10px',
              background: evidenceResult.record.temporalStatus === 'POTENTIAL_POST_FILING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid',
              borderColor: evidenceResult.record.temporalStatus === 'POTENTIAL_POST_FILING' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.82rem'
            }}>
              <Clock size={16} color={evidenceResult.record.temporalStatus === 'POTENTIAL_POST_FILING' ? 'var(--accent-amber)' : 'var(--text-muted)'} />
              <span style={{ color: 'var(--text-main)' }}>
                <strong>Temporal Status:</strong> {evidenceResult.record.temporalNote}
              </span>
            </div>
          )}

          {/* Target Full Claim Text Box */}
          <div className="glass-panel" style={{ padding: '18px 22px', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Target Claim {evidenceResult.record.targetClaimNumber} Text:
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
              "{evidenceResult.record.targetClaimText}"
            </p>
          </div>

          {/* Element-by-Element Evidence Ledger */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 2px' }}>
                  Element-by-Element Structural Alignment
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Lexical alignment of each limitation against candidate disclosure ({evidenceResult.record.supportedCount} supported, {evidenceResult.record.partialCount} partial, {evidenceResult.record.unmatchedCount} unmatched)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {evidenceResult.record.limitations.map((lim) => {
                const isPartial = lim.matchState === 'PARTIAL';
                const isUnmatched = lim.matchState === 'UNMATCHED';

                return (
                  <div
                    key={lim.limitationId}
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: isUnmatched
                        ? 'rgba(244, 63, 94, 0.04)'
                        : isPartial
                        ? 'rgba(245, 158, 11, 0.04)'
                        : 'var(--bg-surface)',
                      border: '1px solid',
                      borderColor: isUnmatched
                        ? 'rgba(244, 63, 94, 0.25)'
                        : isPartial
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                            {lim.limitationId}: {lim.canonicalName}
                          </span>
                          {lim.category && (
                            <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                              {lim.category}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.45' }}>
                          {lim.limitationText}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {renderMatchBadge(lim.matchState)}
                      </div>
                    </div>

                    {/* Candidate Disclosure Excerpt */}
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '0.84rem'
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)', fontWeight: 700, marginBottom: '4px' }}>
                        Candidate Disclosure Passage{lim.candidateClaimNumber ? ` (Claim ${lim.candidateClaimNumber})` : ''}:
                      </div>
                      {lim.candidateExcerpt ? (
                        <div style={{ color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.5' }}>
                          "{lim.candidateExcerpt}"
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>
                          No matching technical disclosure found in prior art.
                        </div>
                      )}
                    </div>

                    {/* Substantive Analysis & Matched Terms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong>Analysis:</strong> {lim.explanation}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                        {lim.matchingTerms.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Matched terms:</span>
                            {lim.matchingTerms.map((t, idx) => (
                              <span key={idx} className="badge badge-emerald" style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {lim.missingTerms.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Missing terms:</span>
                            {lim.missingTerms.map((t, idx) => (
                              <span key={idx} className="badge badge-rose" style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {lim.numericalDiscrepancy?.isMismatch && (
                        <div style={{ color: 'var(--accent-amber)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <AlertTriangle size={13} />
                          <span>Numerical parameter discrepancy: target [{lim.numericalDiscrepancy.targetNumbers.join(', ')}] vs candidate [{lim.numericalDiscrepancy.candidateNumbers.join(', ')}]</span>
                        </div>
                      )}

                      {lim.negationConflict && (
                        <div style={{ color: 'var(--accent-rose)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <AlertTriangle size={13} />
                          <span>Negation contradiction detected between target limitation and prior art disclosure.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Statutory Invalidity Calculator Modal */}
      <InvalidityCalculatorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patentNumber={targetDoc?.id || ''}
      />
    </div>
  );
};
