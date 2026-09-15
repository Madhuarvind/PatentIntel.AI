import React, { useState, useEffect, useMemo } from 'react';
import type { ModuleView, PatentDocument, ClaimLimitationCategory } from '../types';
import { workspaceStore } from '../services/workspaceStore';
import { PatentSelector } from './PatentSelector';
import { 
  decomposePatentClaim, 
  exportClaimChartMarkdown, 
  exportClaimChartCSV 
} from '../services/claimDecompositionService';
import { 
  GitBranch, 
  ArrowRight, 
  Languages, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Search, 
  Copy, 
  Download, 
  X, 
  ListFilter
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenClaimTranslator?: (patentId: string, claimNumber: number, claimText: string) => void;
}

export const ClaimIntelligenceView: React.FC<Props> = ({ onNavigate, onOpenClaimTranslator }) => {
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());
  const [selectedPatentId, setSelectedPatentId] = useState<string>(workspacePatents[0]?.id || 'US11954112B2');
  const [selectedClaimNumber, setSelectedClaimNumber] = useState<number>(1);
  const [selectedLimitationId, setSelectedLimitationId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'annotated' | 'raw'>('annotated');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      const updated = workspaceStore.getPatents();
      setWorkspacePatents(updated);
      if (!updated.some(p => p.id === selectedPatentId) && updated.length > 0) {
        setSelectedPatentId(updated[0].id);
      }
    });
    return unsubscribe;
  }, [selectedPatentId]);

  const activeDoc = useMemo(() => {
    return workspacePatents.find(p => p.id === selectedPatentId) || workspacePatents[0];
  }, [workspacePatents, selectedPatentId]);

  // Available claims for active patent
  const availableClaims = useMemo(() => {
    if (activeDoc?.claims && activeDoc.claims.length > 0) {
      return activeDoc.claims.map((c, idx) => ({
        number: c.number || c.claimNumber || idx + 1,
        text: c.text,
        type: c.type || (c.isIndependent ? 'independent' : 'dependent'),
        isIndependent: c.isIndependent ?? (c.type === 'independent' || idx === 0)
      }));
    }
    return [
      {
        number: 1,
        text: activeDoc?.title 
          ? `1. An intelligent system for ${activeDoc.title.toLowerCase()}, comprising: a sensor array interface; a primary controller; and a real-time monitoring processor configured to regulate telemetry operations.`
          : '1. An intelligent power distribution system for autonomous edge compute nodes, comprising: a power telemetry interface coupled to a plurality of sensor arrays; a dynamic voltage frequency scaling (DVFS) controller; and a thermal management processor configured to adjust workload distribution based on real-time junction temperature measurements.',
        type: 'independent',
        isIndependent: true
      }
    ];
  }, [activeDoc]);

  // Reset selected claim if patent changes
  useEffect(() => {
    if (!availableClaims.some(c => c.number === selectedClaimNumber)) {
      setSelectedClaimNumber(availableClaims[0]?.number || 1);
    }
    setSelectedLimitationId(null);
    setIsDrawerOpen(false);
  }, [activeDoc?.id, availableClaims]);

  // Active claim text
  const currentClaim = useMemo(() => {
    return availableClaims.find(c => c.number === selectedClaimNumber) || availableClaims[0];
  }, [availableClaims, selectedClaimNumber]);

  // Decompose current claim using syntactic decomposition service
  const decomposedClaim = useMemo(() => {
    return decomposePatentClaim(currentClaim.text, currentClaim.number, activeDoc?.cpcCodes || activeDoc?.cpc);
  }, [currentClaim, activeDoc]);

  // Selected limitation object
  const activeLimitation = useMemo(() => {
    if (!selectedLimitationId) return null;
    return decomposedClaim.limitations.find(l => l.id === selectedLimitationId) || null;
  }, [decomposedClaim, selectedLimitationId]);

  // Category filtering
  const filteredLimitations = useMemo(() => {
    if (activeCategoryFilter === 'ALL') return decomposedClaim.limitations;
    return decomposedClaim.limitations.filter(l => l.category === activeCategoryFilter);
  }, [decomposedClaim, activeCategoryFilter]);

  // Handle clicking a limitation card or highlight span
  const handleSelectLimitation = (id: string) => {
    setSelectedLimitationId(id);
    setIsDrawerOpen(true);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Export handlers
  const handleDownloadMarkdown = () => {
    const md = exportClaimChartMarkdown(activeDoc?.id || 'PATENT', decomposedClaim);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc?.id || 'patent'}_claim_${decomposedClaim.claimNumber}_claim_chart.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCopyFeedback('Downloaded Markdown Claim Chart');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleDownloadCSV = () => {
    const csv = exportClaimChartCSV(activeDoc?.id || 'PATENT', decomposedClaim);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc?.id || 'patent'}_claim_${decomposedClaim.claimNumber}_elements.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCopyFeedback('Downloaded CSV Elements');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Helper for category styling
  const getCategoryStyles = (category: ClaimLimitationCategory) => {
    switch (category) {
      case 'HARDWARE_COMPONENT':
        return {
          color: '#06b6d4',
          bg: 'rgba(6, 182, 212, 0.12)',
          border: 'rgba(6, 182, 212, 0.4)',
          label: 'Hardware Component'
        };
      case 'FUNCTIONAL_LIMITATION':
        return {
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.4)',
          label: 'Functional Limitation'
        };
      case 'DATA_INTERFACE':
        return {
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.12)',
          border: 'rgba(59, 130, 246, 0.4)',
          label: 'Data Interface'
        };
      case 'OPERATIONAL_CONSTRAINT':
        return {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.4)',
          label: 'Operational Constraint'
        };
      case 'PROCESS_STEP':
        return {
          color: '#8b5cf6',
          bg: 'rgba(139, 92, 246, 0.12)',
          border: 'rgba(139, 92, 246, 0.4)',
          label: 'Process Step'
        };
      case 'PREAMBLE':
      default:
        return {
          color: '#6366f1',
          bg: 'rgba(99, 102, 241, 0.12)',
          border: 'rgba(99, 102, 241, 0.4)',
          label: 'Preamble / Scope'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {copyFeedback && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'var(--accent-indigo)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 8,
          fontSize: '0.85rem',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <CheckCircle2 size={16} /> {copyFeedback}
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Structural Claim Decomposition Engine
            </h1>
            <span style={{ fontSize: '0.72rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
              35 U.S.C. § 112 COMPLIANT
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, maxWidth: '820px', lineHeight: 1.5 }}>
            Syntactically parses complex statutory claims into granular technical limitations (Components, Functions, Constraints, Data Interfaces) for limitation-by-limitation prior-art benchmarking, antecedent basis audit, and claim charting.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={handleDownloadMarkdown}
            title="Download formatted Claim Chart in Markdown"
            style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Export Claim Chart
          </button>
          <button 
            className="btn-primary" 
            onClick={() => onNavigate('mapping')}
            style={{ fontSize: '0.82rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <GitBranch size={15} /> Map to Target Claims <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Patent Selector & Claim Navigation Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '320px' }}>
            <PatentSelector
              patents={workspacePatents}
              selectedPatentId={selectedPatentId}
              onSelect={(id) => setSelectedPatentId(id)}
              label="Active Workspace Patent to Decompose:"
              placeholder="Search workspace patents by ID, title, assignee..."
              onNavigateWorkspace={() => onNavigate('workspace')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Assignee:</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 700 }}>
              {activeDoc?.assignee || (activeDoc?.assignees && activeDoc.assignees[0]) || 'Independent Assignee'}
            </span>
          </div>
        </div>

        {/* Multi-Claim Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Claims ({availableClaims.length}):
            </span>
            {availableClaims.map((clm) => {
              const isActive = clm.number === selectedClaimNumber;
              return (
                <button
                  key={clm.number}
                  onClick={() => setSelectedClaimNumber(clm.number)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: isActive ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                    background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-input)',
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Claim {clm.number}</span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '1px 5px', 
                    borderRadius: 4, 
                    background: clm.isIndependent ? 'rgba(6, 182, 212, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                    color: clm.isIndependent ? 'var(--accent-cyan)' : 'var(--accent-purple)'
                  }}>
                    {clm.isIndependent ? 'Indep' : 'Dep'}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Display:</span>
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: 2, borderRadius: 6, border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setViewMode('annotated')}
                style={{
                  padding: '3px 10px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  background: viewMode === 'annotated' ? 'var(--accent-indigo)' : 'transparent',
                  color: viewMode === 'annotated' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Annotated Limitations
              </button>
              <button
                onClick={() => setViewMode('raw')}
                style={{
                  padding: '3px 10px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  background: viewMode === 'raw' ? 'var(--accent-indigo)' : 'transparent',
                  color: viewMode === 'raw' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Raw Claim
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left: Original Claim Text & Statutory Preamble Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Header badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  {activeDoc?.id}
                </span>
                <span className="badge badge-indigo" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  Claim {decomposedClaim.claimNumber} ({decomposedClaim.claimType.toUpperCase()})
                </span>
              </div>

              {onOpenClaimTranslator && (
                <button
                  className="btn-secondary"
                  onClick={() => onOpenClaimTranslator(activeDoc?.id || 'US11954112B2', decomposedClaim.claimNumber, decomposedClaim.fullText)}
                  style={{ padding: '4px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Languages size={13} /> Plain-English Translate
                </button>
              )}
            </div>

            {/* Patent Title */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1.4 }}>
                {activeDoc?.title}
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', gap: 12 }}>
                <span>Filing: {activeDoc?.filingDate || 'N/A'}</span>
                <span>•</span>
                <span>Publication: {activeDoc?.issueDate || 'N/A'}</span>
                <span>•</span>
                <span>Primary CPC: {decomposedClaim.limitations[0]?.cpcCategory || 'G06F'}</span>
              </div>
            </div>

            {/* Preamble & Transitional Phrase Scope Banner */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Statutory Claim Architecture
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: decomposedClaim.transitionalScope === 'OPEN' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                  color: decomposedClaim.transitionalScope === 'OPEN' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                  border: `1px solid ${decomposedClaim.transitionalScope === 'OPEN' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                }}>
                  Transition: "{decomposedClaim.transitionalPhrase}" ({decomposedClaim.transitionalScope}-ENDED SCOPE)
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                <strong>Preamble:</strong> {decomposedClaim.preamble}
              </p>
            </div>

            {/* Claim Text: Either Annotated Interactive Spans OR Raw Text */}
            {viewMode === 'annotated' ? (
              <div style={{ 
                background: 'var(--bg-surface)', 
                padding: '18px', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)', 
                fontSize: '0.88rem', 
                lineHeight: '1.85', 
                color: 'var(--text-main)' 
              }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-indigo)' }}>
                  {decomposedClaim.claimNumber}.{' '}
                </span>
                
                {/* Preamble Span */}
                <span 
                  onClick={() => handleSelectLimitation('E1')}
                  style={{
                    cursor: 'pointer',
                    background: selectedLimitationId === 'E1' ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.12)',
                    borderBottom: selectedLimitationId === 'E1' ? '2px solid var(--accent-indigo)' : '1px dashed rgba(99, 102, 241, 0.5)',
                    padding: '2px 4px',
                    borderRadius: 4,
                    transition: 'all 0.15s ease'
                  }}
                  title="Click to inspect E1 Preamble"
                >
                  {decomposedClaim.preamble}
                </span>

                {/* Transition Word */}
                <span style={{ fontStyle: 'italic', fontWeight: 800, color: 'var(--accent-emerald)', margin: '0 4px' }}>
                  {decomposedClaim.transitionalPhrase}:
                </span>

                {/* Limitation Spans */}
                {decomposedClaim.limitations.filter(l => l.category !== 'PREAMBLE').map((lim, idx, arr) => {
                  const isSelected = selectedLimitationId === lim.id;
                  const styles = getCategoryStyles(lim.category);

                  return (
                    <React.Fragment key={lim.id}>
                      <span
                        onClick={() => handleSelectLimitation(lim.id)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? styles.bg.replace('0.12', '0.35') : styles.bg,
                          borderBottom: isSelected ? `2px solid ${styles.color}` : `1px dashed ${styles.border}`,
                          padding: '2px 4px',
                          borderRadius: 4,
                          color: isSelected ? '#fff' : 'var(--text-main)',
                          fontWeight: isSelected ? 600 : 400,
                          transition: 'all 0.15s ease'
                        }}
                        title={`Click to inspect ${lim.id}: ${lim.canonicalName}`}
                      >
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: styles.color,
                          background: 'var(--bg-input)',
                          padding: '1px 4px',
                          borderRadius: 3,
                          marginRight: 4,
                          border: `1px solid ${styles.border}`
                        }}>
                          {lim.id}
                        </span>
                        {lim.cleanedText}
                      </span>
                      {idx < arr.length - 1 ? '; ' : '.'}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.88rem', lineHeight: '1.8', color: 'var(--text-main)' }}>
                "{decomposedClaim.fullText}"
              </div>
            )}

            {/* Click instruction hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              <Info size={13} color="var(--accent-indigo)" />
              <span>Click any limitation span above or card on the right to inspect technical scope, antecedent basis, and search query.</span>
            </div>
          </div>

          {/* Claim Breadth & Complexity Metrics Card */}
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Claim Breadth & Statutory Integrity
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                35 U.S.C. § 112 Analysis
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 }}>Limitations</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                  {decomposedClaim.complexityMetrics.totalLimitations}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 }}>Scope Breadth</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {decomposedClaim.complexityMetrics.breadthScore}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 }}>Antecedent Health</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: decomposedClaim.antecedentAudit.healthScore >= 90 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {decomposedClaim.antecedentAudit.healthScore}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 }}>Transition</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {decomposedClaim.transitionalScope}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Decomposed Technical Elements Cards with Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Header with Title and Element Count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Decomposed Technical Limitations ({decomposedClaim.limitations.length})
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Click card to drill down into exact limitation scope
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={handleDownloadCSV}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Download CSV limitation elements"
                >
                  <Download size={12} /> CSV
                </button>
                <button
                  onClick={() => handleCopy(exportClaimChartMarkdown(activeDoc?.id || 'PATENT', decomposedClaim), 'Claim Chart Copied to Clipboard')}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Copy formatted claim chart"
                >
                  <Copy size={12} /> Copy Chart
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', marginRight: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <ListFilter size={11} /> Filter:
              </span>
              {[
                { key: 'ALL', label: `All (${decomposedClaim.limitations.length})` },
                { key: 'HARDWARE_COMPONENT', label: `Components (${decomposedClaim.complexityMetrics.categoryCounts['HARDWARE_COMPONENT'] || 0})` },
                { key: 'FUNCTIONAL_LIMITATION', label: `Functions (${decomposedClaim.complexityMetrics.categoryCounts['FUNCTIONAL_LIMITATION'] || 0})` },
                { key: 'DATA_INTERFACE', label: `Interfaces (${decomposedClaim.complexityMetrics.categoryCounts['DATA_INTERFACE'] || 0})` },
                { key: 'OPERATIONAL_CONSTRAINT', label: `Constraints (${decomposedClaim.complexityMetrics.categoryCounts['OPERATIONAL_CONSTRAINT'] || 0})` }
              ].map(cat => {
                const isSelected = activeCategoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategoryFilter(cat.key)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-input)',
                      color: isSelected ? 'var(--text-main)' : 'var(--text-muted)'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Limitations Card List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredLimitations.map((elem) => {
                const isSelected = selectedLimitationId === elem.id;
                const styles = getCategoryStyles(elem.category);

                return (
                  <div
                    key={elem.id}
                    onClick={() => handleSelectLimitation(elem.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface)',
                      border: isSelected ? `2px solid ${styles.color}` : '1px solid var(--border-color)',
                      boxShadow: isSelected ? `0 0 16px ${styles.color}33` : 'none',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {/* Element Number Badge */}
                    <div style={{
                      background: styles.color,
                      color: '#0B0F19',
                      fontWeight: 900,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      padding: '5px 9px',
                      borderRadius: '8px',
                      lineHeight: 1,
                      marginTop: 2,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      {elem.id}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      
                      {/* Top bar: Canonical Name + Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                        <h4 style={{ 
                          fontSize: '0.94rem', 
                          fontWeight: 800, 
                          color: 'var(--text-main)', 
                          margin: 0,
                          lineHeight: 1.3
                        }}>
                          {elem.canonicalName}
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: styles.bg,
                            color: styles.color,
                            border: `1px solid ${styles.border}`
                          }}>
                            {styles.label}
                          </span>
                        </div>
                      </div>

                      {/* Cleaned Statutory Text */}
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--text-muted)', 
                        margin: 0, 
                        lineHeight: '1.45',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        "{elem.cleanedText}"
                      </p>

                      {/* Footer Row: Antecedent Basis status + Scope Tag */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        flexWrap: 'wrap', 
                        gap: 8,
                        paddingTop: 8,
                        marginTop: 4,
                        borderTop: '1px solid var(--border-color)',
                        fontSize: '0.72rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {elem.antecedentStatus === 'VERIFIED' ? (
                            <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                              <CheckCircle2 size={12} /> Antecedent Verified
                            </span>
                          ) : elem.antecedentStatus === 'MISSING_ANTECEDENT' ? (
                            <span style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                              <AlertTriangle size={12} /> §112(b) Antecedent Check
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>
                              {elem.antecedentStatus === 'NEW_INTRODUCTION' ? 'Introduces Element' : 'Statutory Preamble'}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                            {elem.scopeTag}
                          </span>
                          <span style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>
                            Inspect ➔
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

      {/* Limitation Deep-Dive Inspection Drawer / Modal */}
      {isDrawerOpen && activeLimitation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9990,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '580px',
            height: '100%',
            background: 'var(--bg-main)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  background: getCategoryStyles(activeLimitation.category).color,
                  color: '#0B0F19',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '4px 10px',
                  borderRadius: 6
                }}>
                  {activeLimitation.id}
                </span>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {activeLimitation.canonicalName}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    Limitation #{activeLimitation.elementNumber} • Claim {decomposedClaim.claimNumber}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Badges Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                background: getCategoryStyles(activeLimitation.category).bg,
                color: getCategoryStyles(activeLimitation.category).color,
                border: `1px solid ${getCategoryStyles(activeLimitation.category).border}`
              }}>
                {getCategoryStyles(activeLimitation.category).label}
              </span>

              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'var(--bg-input)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--border-color)'
              }}>
                Scope: {activeLimitation.cpcCategory || 'G06F 1/3206'}
              </span>

              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'var(--bg-input)',
                color: activeLimitation.breadthImpact === 'NARROW' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                border: '1px solid var(--border-color)'
              }}>
                Breadth Impact: {activeLimitation.breadthImpact}
              </span>
            </div>

            {/* Exact Statutory Claim Text */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Exact Statutory Claim Language:
                </span>
                <button
                  onClick={() => handleCopy(activeLimitation.cleanedText, 'Limitation Text Copied')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>
                "{activeLimitation.cleanedText}"
              </p>
            </div>

            {/* Antecedent Basis & 35 U.S.C. § 112(b) Audit */}
            <div style={{
              background: activeLimitation.antecedentStatus === 'MISSING_ANTECEDENT' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${activeLimitation.antecedentStatus === 'MISSING_ANTECEDENT' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: activeLimitation.antecedentStatus === 'MISSING_ANTECEDENT' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {activeLimitation.antecedentStatus === 'MISSING_ANTECEDENT' ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                  Antecedent Basis Audit (35 U.S.C. § 112(b))
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                  Definiteness
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                {activeLimitation.antecedentNotes}
              </p>
            </div>

            {/* Targeted Prior-Art Search Query Generator */}
            <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Search size={12} color="var(--accent-cyan)" /> Targeted Prior-Art Search Query:
                </span>
                <button
                  onClick={() => handleCopy(activeLimitation.searchQuerySuggestion || '', 'Search Query Copied')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Copy size={12} /> Copy Query
                </button>
              </div>
              <div style={{
                background: 'var(--bg-surface)',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--accent-cyan)',
                lineHeight: 1.4
              }}>
                {activeLimitation.searchQuerySuggestion}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                Pre-formatted for USPTO Patent Public Search, Google Patents, and Espacenet boolean search bars.
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onNavigate('mapping');
                }}
                style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <GitBranch size={15} /> Map Limitation in Claim Chart <ArrowRight size={14} />
              </button>
              <button
                className="btn-secondary"
                onClick={() => setIsDrawerOpen(false)}
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
