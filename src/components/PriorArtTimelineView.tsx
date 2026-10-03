import React, { useState, useEffect, useMemo } from 'react';
import { CitationLineageGraph } from './CitationLineageGraph';
import { workspaceStore } from '../services/workspaceStore';
import { generatePriorArtCoverageMatrix, checkTemporalEligibility } from '../services/claimEvidenceService';
import type { PatentDocument } from '../types';
import {
  CheckCircle2,
  XCircle,
  BookOpen,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HelpCircle,
  FileText
} from 'lucide-react';

interface Props {
  onOpenPaper?: (query?: string) => void;
  onNavigateToMapping?: (target: PatentDocument, candidate: PatentDocument) => void;
}

export const PriorArtTimelineView: React.FC<Props> = ({ onOpenPaper, onNavigateToMapping }) => {
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedClaimNumber, setSelectedClaimNumber] = useState<number>(1);

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      const current = workspaceStore.getPatents();
      setWorkspacePatents(current);
    });
    return unsubscribe;
  }, []);

  // Determine active target patent
  useEffect(() => {
    if (workspacePatents.length > 0) {
      const comparisonPair = workspaceStore.getComparisonPair();
      const active = workspaceStore.getActivePatent();
      const initialId = comparisonPair?.targetId || active?.id || workspacePatents[0].id;
      if (!selectedTargetId || !workspacePatents.some(p => p.id === selectedTargetId)) {
        setSelectedTargetId(initialId);
      }
    }
  }, [workspacePatents, selectedTargetId]);

  const targetPatent = useMemo(() => {
    return workspacePatents.find(p => p.id === selectedTargetId) || workspacePatents[0] || null;
  }, [workspacePatents, selectedTargetId]);

  // Sort workspace patents chronologically
  const sortedPatents = useMemo(() => {
    return [...workspacePatents].sort((a, b) => {
      const dateA = checkTemporalEligibility('9999-12-31', a.publicationDate).status !== 'TEMPORAL_UNVERIFIED' ? a.publicationDate : undefined;
      const dateB = checkTemporalEligibility('9999-12-31', b.publicationDate).status !== 'TEMPORAL_UNVERIFIED' ? b.publicationDate : undefined;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }, [workspacePatents]);

  // Target filing date for 35 U.S.C. 102 temporal comparison
  const targetFilingDate = targetPatent?.filingDate;

  // Other candidate patents for prior-art coverage
  const candidatePatents = useMemo(() => {
    if (!targetPatent) return [];
    return workspacePatents.filter(p => p.id !== targetPatent.id);
  }, [workspacePatents, targetPatent]);

  // Generate dynamic coverage matrix
  const coverageMatrix = useMemo(() => {
    if (!targetPatent) return null;
    return generatePriorArtCoverageMatrix(targetPatent, candidatePatents, selectedClaimNumber);
  }, [targetPatent, candidatePatents, selectedClaimNumber]);

  if (workspacePatents.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
              Prior-Art Publication Timeline & Claim Text Comparison
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Maps chronological disclosures, forward/backward lineage, and limitation prior-art coverage.
            </p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <Clock size={48} style={{ color: 'var(--accent-cyan)', opacity: 0.6, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            No Patent Records in Workspace
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 20px' }}>
            Your workspace is currently empty. Import patents by publication number, upload PDF specifications, or load sample records from the Patent Workspace to generate chronological timelines and citation networks.
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              workspaceStore.resetToDefault();
            }}
            style={{ fontSize: '0.85rem', margin: '0 auto' }}
          >
            Load Curated Workspace Samples
          </button>
        </div>
      </div>
    );
  }

  const targetClaims = targetPatent?.claims || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Prior-Art Publication Timeline & Claim Text Comparison
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Chronological disclosure timeline, classification networks, and limitation-by-limitation coverage across {workspacePatents.length} workspace records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Target Patent Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Patent:</span>
            <select
              value={targetPatent?.id || ''}
              onChange={(e) => {
                setSelectedTargetId(e.target.value);
                setSelectedClaimNumber(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {workspacePatents.map(p => (
                <option key={p.id} value={p.id} style={{ background: 'var(--bg-card-solid)', color: 'var(--text-main)' }}>
                  {p.id} — {p.title.slice(0, 32)}...
                </option>
              ))}
            </select>
          </div>

          {onOpenPaper && (
            <button className="btn-secondary" onClick={() => onOpenPaper(targetPatent?.title || 'prior art citation network')} style={{ fontSize: '0.82rem' }}>
              <BookOpen size={14} /> Search Citation Papers
            </button>
          )}
        </div>
      </div>

      {/* Feature 1: Dynamic Citation Lineage & Technological Family Tree Graph */}
      <CitationLineageGraph
        targetPatent={targetPatent}
        workspacePatents={workspacePatents}
        onSelectPatent={(cand) => {
          if (onNavigateToMapping && targetPatent) {
            onNavigateToMapping(targetPatent, cand);
          }
        }}
      />

      {/* Feature 2: Chronological Timeline Bar */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 2px' }}>
              Chronological Prior-Art Disclosure Timeline
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Stored publication dates compared with target filing. Legal eligibility is not assessed for {targetPatent?.id}.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.74rem' }}>
            <span className="badge badge-cyan">Target Under Examination</span>
            <span className="badge badge-emerald">Published Before Target Filing</span>
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>Subsequent Disclosure</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '16px', position: 'relative' }}>
          {sortedPatents.map((p) => {
            const isTarget = p.id === targetPatent?.id;
            const temporal = checkTemporalEligibility(targetFilingDate, p.publicationDate);

            let temporalTag = 'Unassessed';
            let badgeClass = 'badge';
            let borderColor = 'var(--border-color)';

            if (isTarget) {
              temporalTag = 'Target Under Examination';
              badgeClass = 'badge badge-cyan';
              borderColor = 'var(--accent-cyan)';
            } else if (temporal.status !== 'TEMPORAL_UNVERIFIED') {
              if (temporal.status === 'PUBLISHED_BEFORE_FILING') {
                temporalTag = 'Published Before Target Filing';
                badgeClass = 'badge badge-emerald';
                borderColor = 'rgba(16, 185, 129, 0.4)';
              } else {
                temporalTag = 'Published On/After Target Filing';
                badgeClass = 'badge badge-amber';
                borderColor = 'rgba(245, 158, 11, 0.3)';
              }
            } else {
              temporalTag = 'Temporal Status Unverified';
              badgeClass = 'badge';
            }

            return (
              <div
                key={p.id}
                style={{
                  background: isTarget ? 'rgba(0, 242, 254, 0.06)' : 'var(--bg-surface)',
                  border: '1px solid',
                  borderColor,
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} style={{ color: 'var(--accent-cyan)' }} />
                    {p.publicationDate ? `Publication: ${p.publicationDate}` : 'Publication date unavailable'}{p.isSample ? ' · Sample (not verified)' : ''}
                  </span>
                  <span className={badgeClass} style={{ fontSize: '0.72rem' }}>{temporalTag}</span>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0' }}>
                  {p.publicationNumber || p.id}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.35', flex: 1, margin: 0 }}>
                  {p.title}
                </p>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Assignee: {p.assignee ? p.assignee.slice(0, 22) : 'Unassigned'}</span>
                  <span>{p.claims?.length || 0} claims</span>
                </div>

                {!isTarget && onNavigateToMapping && targetPatent && (
                  <button
                    onClick={() => onNavigateToMapping(targetPatent, p)}
                    className="btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '4px 8px', marginTop: '4px', justifyContent: 'center' }}
                  >
                    Compare Claims <ArrowRight size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature 3: Dynamic Claim Element Prior-Art Coverage Matrix */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Claim Limitation Prior-Art Coverage Matrix
              </h3>
              {targetClaims.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Claim:</span>
                  <select
                    value={selectedClaimNumber}
                    onChange={(e) => setSelectedClaimNumber(Number(e.target.value))}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      padding: '2px 8px',
                      outline: 'none'
                    }}
                  >
                    {targetClaims.map(c => (
                      <option key={c.number} value={c.number}>
                        Claim {c.number} ({c.type || 'independent'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Limitation-by-limitation evidence analysis of {targetPatent?.id} (Claim {selectedClaimNumber}) against candidate prior disclosures.
            </p>
          </div>

          {coverageMatrix && (
            <div>
              {coverageMatrix.summary.earlierTextMatchCount === 0 ? (
                <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} /> All {coverageMatrix.summary.totalLimitations} Limitations Without Earlier Literal Matches
                </span>
              ) : (
                <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> {coverageMatrix.summary.earlierTextMatchCount}/{coverageMatrix.summary.totalLimitations} Limitations With Earlier Literal Matches
                </span>
              )}
            </div>
          )}
        </div>

        {coverageMatrix && coverageMatrix.limitations.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 14px', width: '320px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                    Target Claim Limitation
                  </th>
                  {coverageMatrix.candidates.map(cand => (
                    <th key={cand.candidateId} style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cand.candidateId}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        {cand.filingOrPubDate ? cand.filingOrPubDate : 'No Date'}
                      </div>
                      <span
                        className={
                          cand.temporalStatus === 'PUBLISHED_BEFORE_FILING'
                            ? 'badge badge-emerald'
                            : cand.temporalStatus === 'POTENTIAL_POST_FILING'
                            ? 'badge badge-amber'
                            : 'badge'
                        }
                        style={{ fontSize: '0.65rem', marginTop: '2px', display: 'inline-block' }}
                      >
                        {cand.temporalStatus === 'PUBLISHED_BEFORE_FILING' ? 'Earlier Publication' : cand.temporalStatus === 'POTENTIAL_POST_FILING' ? 'Post-Filing' : 'Unverified'}
                      </span>
                    </th>
                  ))}
                  <th style={{ padding: '12px 14px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: 'right' }}>
                    Text Match Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {coverageMatrix.limitations.map(lim => {
                  const isNovel = coverageMatrix.summary.unmatchedLimitationIds.includes(lim.id);
                  return (
                    <tr key={lim.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                          L{lim.elementNumber}: {lim.canonicalName}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                          {lim.text.slice(0, 110)}...
                        </div>
                      </td>

                      {coverageMatrix.candidates.map(cand => {
                        const cov = cand.coverageByLimitation[lim.id];
                        if (!cov) {
                          return (
                            <td key={cand.candidateId} style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>
                              <span style={{ fontSize: '0.75rem' }}>—</span>
                            </td>
                          );
                        }

                        if (cand.temporalStatus !== 'PUBLISHED_BEFORE_FILING') {
                          return (
                            <td key={cand.candidateId} style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={13} /> Date order unassessed or on/after filing
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={cand.candidateId} style={{ padding: '12px 14px' }}>
                            {cov.matchState === 'SUPPORTED' ? (
                              <div style={{ color: '#10B981', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  <CheckCircle2 size={16} /> Literal text match
                                </span>
                                {cov.excerpt && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cov.excerpt}>
                                    "{cov.excerpt}"
                                  </span>
                                )}
                              </div>
                            ) : cov.matchState === 'PARTIAL' ? (
                              <div style={{ color: 'var(--accent-cyan)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  <AlertTriangle size={15} /> Partial
                                </span>
                                {cov.excerpt && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cov.excerpt}>
                                    "{cov.excerpt}"
                                  </span>
                                )}
                              </div>
                            ) : cov.matchState === 'UNASSESSED' ? (
                              <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <HelpCircle size={15} /> Unassessed
                              </div>
                            ) : (
                              <div style={{ color: '#F43F5E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <XCircle size={15} /> No lexical match
                              </div>
                            )}
                          </td>
                        );
                      })}

                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {isNovel ? (
                          <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                            No earlier literal match
                          </span>
                        ) : (
                          <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                            Earlier literal match
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Target patent {targetPatent?.id} does not contain parsed claims. Import claims to generate the limitation coverage matrix.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
