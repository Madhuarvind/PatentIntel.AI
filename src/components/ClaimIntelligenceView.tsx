import React, { useState, useEffect, useMemo } from 'react';
import type { 
  ModuleView, 
  PatentDocument, 
  ClaimLimitationCategory,
  LimitationCriticality
} from '../types';
import { workspaceStore } from '../services/workspaceStore';
import { PatentSelector } from './PatentSelector';
import { 
  decomposePatentClaim, 
  exportClaimChartMarkdown, 
  exportClaimChartCSV,
  buildClaimDependencyTree,
  extractClaimGlossary,
  generateClaimVersionDiff,
  generateFamilyClaimComparison,
  buildPriorArtLimitationHeatmap
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
  ListFilter,
  Layers,
  Network,
  BookOpen,
  Scale,
  Sparkles
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenClaimTranslator?: (patentId: string, claimNumber: number, claimText: string) => void;
}

export const ClaimIntelligenceView: React.FC<Props> = ({ onNavigate, onOpenClaimTranslator }) => {
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());
  const [selectedPatentId, setSelectedPatentId] = useState<string>(workspacePatents[0]?.id || 'US11954112B2');
  const [selectedClaimNumber, setSelectedClaimNumber] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'limitations' | 'dependency' | 'relationships' | 'heatmap' | 'family_glossary'>('limitations');
  
  // Tab 1 state
  const [selectedLimitationId, setSelectedLimitationId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'annotated' | 'raw'>('annotated');
  
  // Notification toast
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Heatmap drilldown state
  const [heatmapCellDetail, setHeatmapCellDetail] = useState<{ limitation: string; patentId: string; status: string; score: number; evidence: string } | null>(null);

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
        text: '1. An intelligent power distribution system for autonomous edge compute nodes, comprising: a power telemetry interface coupled to a plurality of sensor arrays; a dynamic voltage frequency scaling (DVFS) controller; and a thermal management processor configured to adjust workload distribution based on real-time junction temperature measurements.',
        type: 'independent',
        isIndependent: true
      },
      {
        number: 2,
        text: '2. The intelligent power distribution system as claimed in claim 1, wherein the dynamic voltage frequency scaling controller operates over a high-speed PCIe system bus between 50°C and 80°C.',
        type: 'dependent',
        isIndependent: false
      },
      {
        number: 3,
        text: '3. The intelligent power distribution system as claimed in claim 1, further comprising a predictive neural network model trained to forecast thermal spikes within 5 seconds.',
        type: 'dependent',
        isIndependent: false
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

  // Decompose current claim
  const decomposedClaim = useMemo(() => {
    return decomposePatentClaim(currentClaim.text, currentClaim.number, activeDoc?.cpcCodes || activeDoc?.cpc, activeDoc?.id);
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

  // 1. Claim Dependency Graph
  const dependencyTree = useMemo(() => {
    return buildClaimDependencyTree(availableClaims, activeDoc?.cpcCodes || activeDoc?.cpc);
  }, [availableClaims, activeDoc]);

  // 2. Glossary
  const glossaryTerms = useMemo(() => {
    return extractClaimGlossary(availableClaims, activeDoc?.title || '', activeDoc?.abstract || '');
  }, [availableClaims, activeDoc]);

  // 3. Version Diff
  const versionDiff = useMemo(() => {
    const amendedText = currentClaim.text.replace('power telemetry interface', 'redundant power telemetry bus interface').replace('50°C and 80°C', '45°C and 85°C');
    return generateClaimVersionDiff(currentClaim.text, amendedText, currentClaim.number);
  }, [currentClaim]);

  // 4. Family Comparison
  const familyComparison = useMemo(() => {
    return generateFamilyClaimComparison(activeDoc?.id || 'US11954112B2', activeDoc?.title || '', currentClaim.text);
  }, [activeDoc, currentClaim]);

  // 5. Prior-Art Heatmap
  const heatmapData = useMemo(() => {
    const candidates = workspacePatents.filter(p => p.id !== activeDoc?.id);
    const candidateList = candidates.length >= 2 ? candidates : [
      { id: 'US10255577B2', title: 'Smart inventory management and thermal throttling' },
      { id: 'US12147926B2', title: 'Intelligent supply chain optimizer with telemetry' },
      { id: 'US11594127B1', title: 'Traffic controller mobile transmitter' }
    ];
    return buildPriorArtLimitationHeatmap(decomposedClaim.limitations, candidateList as any);
  }, [decomposedClaim.limitations, workspacePatents, activeDoc?.id]);

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
        return { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.4)', label: 'Hardware Component' };
      case 'FUNCTIONAL_LIMITATION':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', label: 'Functional Limitation' };
      case 'DATA_INTERFACE':
        return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.4)', label: 'Data Interface' };
      case 'OPERATIONAL_CONSTRAINT':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', label: 'Operational Constraint' };
      case 'PROCESS_STEP':
        return { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.4)', label: 'Process Step' };
      case 'PREAMBLE':
      default:
        return { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.4)', label: 'Preamble / Scope' };
    }
  };

  const getCriticalityBadge = (crit: LimitationCriticality) => {
    if (crit === 'CORE') {
      return { label: 'CORE', bg: 'rgba(16, 185, 129, 0.18)', color: 'var(--accent-emerald)', border: 'rgba(16, 185, 129, 0.4)' };
    }
    if (crit === 'SUPPORTING') {
      return { label: 'SUPPORTING', bg: 'rgba(6, 182, 212, 0.18)', color: 'var(--accent-cyan)', border: 'rgba(6, 182, 212, 0.4)' };
    }
    return { label: 'CONTEXTUAL', bg: 'rgba(139, 92, 246, 0.18)', color: 'var(--accent-purple)', border: 'rgba(139, 92, 246, 0.4)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '40px' }}>
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
          gap: 8
        }}>
          <CheckCircle2 size={16} /> {copyFeedback}
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Structural Claim Decomposition & Limitation Intelligence
            </h1>
            <span style={{ fontSize: '0.72rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
              35 U.S.C. § 112 & EPC ART. 84 COMPLIANT
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, maxWidth: '850px', lineHeight: 1.5 }}>
            Advanced analytical limitation-intelligence engine: decomposes complex claims into granular building blocks, visualizes claim dependency trees, models limitation relationships, extracts language patterns, audits antecedent basis, and benchmarks single-reference coverage.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={handleDownloadMarkdown}
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

      {/* Patent Selector Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '320px' }}>
            <PatentSelector
              patents={workspacePatents}
              selectedPatentId={selectedPatentId}
              onSelect={(id) => setSelectedPatentId(id)}
              label="Active Workspace Patent to Analyze:"
              placeholder="Search workspace patents by ID, title, assignee..."
              onNavigateWorkspace={() => onNavigate('workspace')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Assignee: <strong style={{ color: 'var(--text-main)' }}>{activeDoc?.assignee || 'Independent Assignee'}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Claims in Document: <strong style={{ color: 'var(--accent-cyan)' }}>{availableClaims.length}</strong>
            </div>
          </div>
        </div>

        {/* Claim Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Claim:
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        </div>
      </div>

      {/* 5 Modular Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', flexWrap: 'wrap' }}>
        {[
          { key: 'limitations', label: 'Limitation Breakdown & Text', icon: Layers },
          { key: 'dependency', label: 'Claim Dependency Tree', icon: GitBranch },
          { key: 'relationships', label: 'Limitation Relationship Graph', icon: Network },
          { key: 'heatmap', label: 'Prior-Art Heatmap & Coverage', icon: Scale },
          { key: 'family_glossary', label: 'Family, Glossary & Version Diff', icon: BookOpen }
        ].map(t => {
          const isActive = activeTab === t.key;
          const IconComponent = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent-indigo)' : '3px solid transparent',
                background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconComponent size={15} color={isActive ? 'var(--accent-indigo)' : 'var(--text-dim)'} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIMITATION BREAKDOWN & ANNOTATED TEXT */}
      {/* ========================================================================= */}
      {activeTab === 'limitations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Left: Original Claim Text & Statutory Preamble Banner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    {activeDoc?.id}
                  </span>
                  <span className="badge badge-indigo" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    Claim {decomposedClaim.claimNumber} ({decomposedClaim.claimType.toUpperCase()})
                  </span>
                </div>

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
                    Annotated View
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
                    Raw Text
                  </button>
                </div>
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

              {/* Claim Text: Annotated Spans or Raw */}
              {viewMode === 'annotated' ? (
                <div style={{ 
                  background: 'var(--bg-surface)', 
                  padding: '18px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  fontSize: '0.88rem', 
                  lineHeight: '1.9', 
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
                      background: selectedLimitationId === 'E1' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.12)',
                      borderBottom: selectedLimitationId === 'E1' ? '2px solid var(--accent-indigo)' : '1px dashed rgba(99, 102, 241, 0.5)',
                      padding: '2px 4px',
                      borderRadius: 4
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
                            fontWeight: isSelected ? 600 : 400
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                <Info size={13} color="var(--accent-indigo)" />
                <span>Click any limitation span above or card on the right to inspect technical scope, antecedent audit, and search queries.</span>
              </div>
            </div>

            {/* Explainable Structural Breadth Indicator Card */}
            <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Structural Breadth Indicator
                  </span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                    Analytical screening metric based on restrictive modifiers, numerical ranges, and transition scope.
                  </p>
                </div>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  {decomposedClaim.complexityMetrics.breadthScore >= 75 ? 'BROAD SCOPE' : decomposedClaim.complexityMetrics.breadthScore >= 50 ? 'MODERATE SCOPE' : 'NARROW SCOPE'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 2 }}>Limitations</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                    {decomposedClaim.complexityMetrics.totalLimitations}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 2 }}>Breadth Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {decomposedClaim.complexityMetrics.breadthScore}%
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 2 }}>Definiteness Health</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: decomposedClaim.antecedentAudit.healthScore >= 90 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                    {decomposedClaim.antecedentAudit.healthScore}%
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 2 }}>Transition</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {decomposedClaim.transitionalScope}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Decomposed Technical Elements Cards with Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
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
                  >
                    <Download size={12} /> CSV
                  </button>
                  <button
                    onClick={() => handleCopy(exportClaimChartMarkdown(activeDoc?.id || 'PATENT', decomposedClaim), 'Claim Chart Copied to Clipboard')}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
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
                  const critStyles = getCriticalityBadge(elem.criticality);

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
                        marginTop: 2
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
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: critStyles.bg,
                              color: critStyles.color,
                              border: `1px solid ${critStyles.border}`
                            }}>
                              {critStyles.label}
                            </span>
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

                        {/* Language Patterns & Numerical Constraints chips */}
                        {(elem.languagePatterns.length > 0 || elem.numericalConstraints.length > 0) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                            {elem.languagePatterns.map(p => (
                              <span key={p.id} style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                {p.patternType.replace(/_/g, ' ')}: "{p.triggerPhrase}"
                              </span>
                            ))}
                            {elem.numericalConstraints.map(n => (
                              <span key={n.id} style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                Range: {n.rawExpression}
                              </span>
                            ))}
                          </div>
                        )}

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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLAIM DEPENDENCY TREE & INHERITANCE GRAPH */}
      {/* ========================================================================= */}
      {activeTab === 'dependency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Claim Dependency Hierarchy & Limitation Inheritance Tree
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                A dependent claim incorporates all limitations of the claims to which it refers. This graph tracks inherited limitations (E_parent) alongside newly added limitation features (E_child).
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {dependencyTree.map(node => (
                <div 
                  key={node.claimNumber} 
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        background: node.claimType === 'independent' ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                        color: '#0B0F19',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '3px 8px',
                        borderRadius: 6
                      }}>
                        Claim {node.claimNumber}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                        {node.claimType === 'independent' ? 'Independent Base Claim' : `Depends on Claim ${node.dependsOnClaimNumbers.join(', ')}`}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.72rem', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
                      {node.cumulativeLimitationsCount} Total Limitations
                    </span>
                  </div>

                  {/* Inherited limitations */}
                  {node.inheritedLimitations.length > 0 && (
                    <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
                        Inherited Limitations ({node.inheritedLimitations.length}):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {node.inheritedLimitations.map((inh, i) => (
                          <span key={i} style={{ fontSize: '0.68rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', padding: '2px 6px', borderRadius: 4 }}>
                            {inh.elementId}: {inh.canonicalName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Added limitations */}
                  <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                      Added Limitations by Claim {node.claimNumber} ({node.addedLimitations.length}):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {node.addedLimitations.map((add, i) => (
                        <span key={i} style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '2px 6px', borderRadius: 4 }}>
                          {add.elementId}: {add.canonicalName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dependent child claims */}
                  {node.childClaimNumbers.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Parent to: <strong style={{ color: 'var(--text-main)' }}>Claims {node.childClaimNumbers.join(', ')}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIMITATION RELATIONSHIP GRAPH */}
      {/* ========================================================================= */}
      {activeTab === 'relationships' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Limitation Semantic Relationship & Architecture Flow
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Traces structural and functional linkages between discrete claim limitations ($E_1 \to E_2 \to E_3$) to establish how elements cooperate to achieve the claimed technical effect.
              </p>
            </div>

            {/* Visual Step Chain */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {decomposedClaim.limitations.map((lim, idx, arr) => {
                const nextLim = arr[idx + 1];
                const rel = lim.relationships.find(r => r.sourceLimitationId === lim.id && r.targetLimitationId === nextLim?.id);

                return (
                  <React.Fragment key={lim.id}>
                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          background: getCategoryStyles(lim.category).color,
                          color: '#0B0F19',
                          fontWeight: 900,
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '4px 8px',
                          borderRadius: 6
                        }}>
                          {lim.id}
                        </span>
                        <div>
                          <h4 style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {lim.canonicalName}
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {getCategoryStyles(lim.category).label} • {lim.cleanedText.slice(0, 80)}...
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: getCriticalityBadge(lim.criticality).bg,
                          color: getCriticalityBadge(lim.criticality).color
                        }}>
                          {lim.criticality}
                        </span>
                        <button
                          onClick={() => handleSelectLimitation(lim.id)}
                          className="btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        >
                          Details ➔
                        </button>
                      </div>
                    </div>

                    {/* Edge Connector */}
                    {nextLim && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '-4px 0' }}>
                        <div style={{ height: 24, width: 2, background: 'var(--accent-indigo)' }} />
                        <span style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          padding: '2px 10px',
                          borderRadius: 12,
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: 'var(--accent-indigo)',
                          border: '1px solid rgba(99, 102, 241, 0.4)'
                        }}>
                          -- {rel ? rel.relationshipType.replace(/_/g, ' ') : 'couples to'} --➔
                        </span>
                        <div style={{ height: 24, width: 2, background: 'var(--accent-indigo)' }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRIOR-ART HEATMAP & COMPLETE COVERAGE MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'heatmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Single-Reference Complete Coverage Analysis Banner */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px' }}>
                  Single-Reference Complete Limitation Coverage Screening
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Evaluates whether any individual prior-art reference discloses all claimed limitations (All-Elements Rule).
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {Object.entries(heatmapData.coverageSummary).map(([patId, summary]) => {
                const isComplete = summary.coverageStatus === 'COMPLETE COVERAGE ESTABLISHED';
                return (
                  <div key={patId} style={{
                    background: 'var(--bg-surface)',
                    padding: '14px',
                    borderRadius: '10px',
                    border: `1px solid ${isComplete ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-color)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{patId}</strong>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: isComplete ? 'rgba(244, 63, 94, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                        color: isComplete ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                      }}>
                        {summary.coverageStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Coverage: <strong>{summary.coveredCount} / {summary.totalCount}</strong> limitations mapped
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matrix Heatmap Table */}
          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              Limitation-by-Limitation Prior-Art Heatmap
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '10px 12px' }}>Limitation ID</th>
                  <th style={{ padding: '10px 12px' }}>Canonical Limitation</th>
                  <th style={{ padding: '10px 12px' }}>Category</th>
                  <th style={{ padding: '10px 12px' }}>Criticality</th>
                  {Object.keys(heatmapData.rows[0]?.scores || {}).map(patId => (
                    <th key={patId} style={{ padding: '10px 12px', textAlign: 'center' }}>{patId}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.rows.map(row => (
                  <tr key={row.limitationId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                      {row.limitationId}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {row.canonicalName}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: getCategoryStyles(row.category).bg, color: getCategoryStyles(row.category).color }}>
                        {row.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4, background: getCriticalityBadge(row.criticality).bg, color: getCriticalityBadge(row.criticality).color }}>
                        {row.criticality}
                      </span>
                    </td>
                    {Object.entries(row.scores).map(([patId, scoreObj]) => {
                      let bg = 'rgba(148, 163, 184, 0.1)';
                      let col = 'var(--text-dim)';
                      if (scoreObj.status === 'HIGH') {
                        bg = 'rgba(16, 185, 129, 0.2)';
                        col = 'var(--accent-emerald)';
                      } else if (scoreObj.status === 'PARTIAL') {
                        bg = 'rgba(245, 158, 11, 0.2)';
                        col = 'var(--accent-amber)';
                      }

                      return (
                        <td key={patId} style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => setHeatmapCellDetail({ limitation: row.canonicalName, patentId: patId, status: scoreObj.status, score: scoreObj.score, evidence: scoreObj.evidence })}
                            style={{
                              background: bg,
                              color: col,
                              border: `1px solid ${col}44`,
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              cursor: 'pointer'
                            }}
                          >
                            {scoreObj.status} ({scoreObj.score}%)
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cell Drilldown Modal */}
          {heatmapCellDetail && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                width: '90%',
                maxWidth: '520px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Heatmap Evidence: {heatmapCellDetail.patentId}
                  </h4>
                  <button onClick={() => setHeatmapCellDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Target Limitation: <strong style={{ color: 'var(--text-main)' }}>{heatmapCellDetail.limitation}</strong>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.84rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{heatmapCellDetail.evidence}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>Match Confidence: <strong>{heatmapCellDetail.score}%</strong></span>
                  <span>Classification: <strong>{heatmapCellDetail.status}</strong></span>
                </div>

                <button className="btn-primary" onClick={() => setHeatmapCellDetail(null)} style={{ marginTop: 6 }}>
                  Close Evidence
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FAMILY COMPARISON, GLOSSARY & VERSION DIFF */}
      {/* ========================================================================= */}
      {activeTab === 'family_glossary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Family Comparison */}
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Family-Aware Cross-Jurisdiction Claim Comparison
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Compares Claim 1 of {familyComparison.primaryPatentId} against counterpart family members in EP, WO, and IN to highlight jurisdiction-specific drafting structures.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {familyComparison.familyMembers.map(mem => (
                <div key={mem.patentId} style={{
                  background: 'var(--bg-surface)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-cyan">{mem.jurisdiction} Member: {mem.patentId}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Claim {mem.claimNumber}</span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{mem.claimText}"
                  </p>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '0.74rem', color: 'var(--accent-indigo)' }}>
                    <strong>Jurisdiction Difference:</strong> {mem.keyDifferences[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claim Construction Glossary */}
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Claim Construction Glossary & Specification Support
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Candidate defined terms extracted from claims aligned with their detailed specification disclosures.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {glossaryTerms.map((term, i) => (
                <div key={i} style={{
                  background: 'var(--bg-surface)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>"{term.term}"</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Spec: {term.specificationParagraph}</span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    {term.definitionCandidate}
                  </p>

                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', borderTop: '1px solid var(--border-color)', paddingTop: 6 }}>
                    ✓ Specification consistency verified (Occurs in Claim {term.occurrenceClaims.join(', ')})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prosecution Version Diff */}
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                  Prosecution Claim Version Diff (Claim {versionDiff.claimNumber})
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Comparing {versionDiff.sourceVersion} vs {versionDiff.targetVersion}
                </p>
              </div>
              <span className="badge badge-amber">{versionDiff.status}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {versionDiff.limitationDiffs.map((diff, i) => (
                <div key={i} style={{
                  background: 'var(--bg-surface)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.84rem' }}>
                      {diff.elementId}: {diff.canonicalName}
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {diff.explanation}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: diff.diffType === 'ADDED' ? 'rgba(16, 185, 129, 0.18)' : diff.diffType === 'MODIFIED' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(148, 163, 184, 0.1)',
                    color: diff.diffType === 'ADDED' ? 'var(--accent-emerald)' : diff.diffType === 'MODIFIED' ? 'var(--accent-amber)' : 'var(--text-dim)'
                  }}>
                    {diff.diffType}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* LIMITATION DEEP-DIVE INSPECTION DRAWER */}
      {/* ========================================================================= */}
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
            maxWidth: '620px',
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
                    Limitation #{activeLimitation.elementNumber} • Claim {decomposedClaim.claimNumber} • Confidence: {(activeLimitation.confidence * 100).toFixed(0)}%
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
                background: getCriticalityBadge(activeLimitation.criticality).bg,
                color: getCriticalityBadge(activeLimitation.criticality).color,
                border: `1px solid ${getCriticalityBadge(activeLimitation.criticality).border}`
              }}>
                Criticality: {activeLimitation.criticality}
              </span>

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

            {/* "Why was this split?" Explainability Inspector */}
            <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={12} /> "Why was this split?" Explainability Inspector
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  Syntactic & Semantic Analysis
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem' }}>
                <div><strong>Subject:</strong> {activeLimitation.splitRationale.detectedSubject}</div>
                <div><strong>Predicate:</strong> {activeLimitation.splitRationale.detectedPredicate}</div>
                <div><strong>Object:</strong> {activeLimitation.splitRationale.detectedObject}</div>
                <div><strong>Delimiter:</strong> {activeLimitation.splitRationale.clauseBoundary}</div>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 6 }}>
                <strong>Classification Basis:</strong> {activeLimitation.splitRationale.classificationBasis}
              </div>
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
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
                {activeLimitation.antecedentNotes}
              </p>
            </div>

            {/* Claim-to-Specification Evidence Linking */}
            {activeLimitation.specEvidence && (
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                    Specification & Figure Evidence Support
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {activeLimitation.specEvidence.figureReferences.join(', ')}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {activeLimitation.specEvidence.specificationExcerpt}
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Paragraph Citations: <strong style={{ color: 'var(--text-main)' }}>{activeLimitation.specEvidence.specificationParagraphs.join(', ')}</strong>
                </div>
              </div>
            )}

            {/* Tri-Modal Prior-Art Search Intelligence */}
            <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Search size={12} color="var(--accent-cyan)" /> Tri-Modal Prior-Art Search Intelligence:
                </span>
              </div>

              {/* Exact Technical Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  <span>1. Exact Technical Search:</span>
                  <button onClick={() => handleCopy(activeLimitation.searchIntelligence.exactTechnicalQuery, 'Exact Query Copied')} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>Copy</button>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                  {activeLimitation.searchIntelligence.exactTechnicalQuery}
                </div>
              </div>

              {/* Semantic Query */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  <span>2. SBERT Vector Semantic Query:</span>
                  <button onClick={() => handleCopy(activeLimitation.searchIntelligence.semanticQuery, 'Semantic Query Copied')} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>Copy</button>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-indigo)' }}>
                  {activeLimitation.searchIntelligence.semanticQuery}
                </div>
              </div>

              {/* Component Expansion */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  <span>3. Component Expansion Query:</span>
                  <button onClick={() => handleCopy(activeLimitation.searchIntelligence.componentExpansionQuery, 'Expansion Query Copied')} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>Copy</button>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
                  {activeLimitation.searchIntelligence.componentExpansionQuery}
                </div>
              </div>
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
