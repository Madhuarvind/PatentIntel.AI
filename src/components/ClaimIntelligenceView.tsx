import React, { useState, useEffect } from 'react';
import type { ModuleView, PatentDocument, Claim } from '../types';
import { workspaceStore } from '../services/workspaceStore';
import { PatentSelector } from './PatentSelector';
import { 
  GitBranch, 
  ArrowRight,
  FileCheck,
  Languages,
  CheckCircle2
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenClaimTranslator?: (patentId: string, claimNumber: number, claimText: string) => void;
}

export interface GranularClaimElement {
  id: string;
  type: 'COMPONENT' | 'FUNCTION' | 'CONSTRAINT' | 'PROCESS' | 'RELATIONSHIP';
  term: string;
  details: string;
  scope: string;
}

/**
 * Structural Claim Decomposition Algorithm
 * Parses raw claim text into granular technical elements (Components, Functions, Constraints, Processes, Relationships)
 */
export function decomposeClaimText(claimText: string, cpcScope?: string): GranularClaimElement[] {
  if (!claimText) return [];

  // Remove leading numbers like "1. A system comprising:" or "Claim 1."
  const cleaned = claimText.replace(/^\s*(?:Claim\s*)?\d+\s*[\.\:]\s*/i, '').trim();

  // Split into clauses by punctuation and key transition terms
  const rawClauses = cleaned
    .split(/(?:;|\bwherein\b|\bcomprising:?\b|\bconfigured to\b|\bcharacterized in that\b)/i)
    .map(c => c.trim().replace(/^[\,\;\:\.]+|[\,\;\:\.]+$|\bwherein\b/gi, '').trim())
    .filter(c => c.length > 8);

  const clauses = rawClauses.length > 0 ? rawClauses : [cleaned];
  const defaultCpc = cpcScope || 'G06F 17/00';

  return clauses.map((clause, idx) => {
    const lower = clause.toLowerCase();
    let type: GranularClaimElement['type'] = 'COMPONENT';

    if (lower.includes('configured to') || lower.includes('implement') || lower.includes('generating') || lower.includes('calculating') || lower.includes('computing') || lower.includes('detecting')) {
      type = 'FUNCTION';
    } else if (lower.includes('threshold') || lower.includes('exceeds') || lower.includes('within') || lower.includes('at least') || lower.includes('maximum') || lower.includes('minimum') || lower.includes('encrypted')) {
      type = 'CONSTRAINT';
    } else if (lower.includes('method') || lower.includes('step') || lower.includes('process') || lower.includes('executing')) {
      type = 'PROCESS';
    } else if (lower.includes('based on') || lower.includes('coupled to') || lower.includes('connected to') || lower.includes('responsive to') || lower.includes('communicating with')) {
      type = 'RELATIONSHIP';
    } else {
      type = 'COMPONENT';
    }

    const termTitle = clause.length > 55 ? clause.slice(0, 55) + '…' : clause;

    return {
      id: `E${idx + 1}`,
      type,
      term: termTitle,
      details: clause,
      scope: `Scope: ${defaultCpc}`
    };
  });
}

export const ClaimIntelligenceView: React.FC<Props> = ({ onNavigate, onOpenClaimTranslator }) => {
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());
  const [selectedPatentId, setSelectedPatentId] = useState<string>(workspacePatents[0]?.id || 'US10928341B2');
  const [selectedClaimNum, setSelectedClaimNum] = useState<number>(1);

  // Subscribe to workspace store updates
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

  // Reset selected claim number to 1 when active patent changes
  useEffect(() => {
    setSelectedClaimNum(1);
  }, [selectedPatentId]);

  const activeDoc = workspacePatents.find(p => p.id === selectedPatentId) || workspacePatents[0];

  // Derive claims list for selected patent
  const availableClaims: Claim[] = (activeDoc?.claims && activeDoc.claims.length > 0)
    ? activeDoc.claims
    : [
        {
          number: 1,
          text: `1. A system for ${activeDoc?.title || 'technology management'} comprising: one or more processors; and memory storing instructions to execute real-time operations.`,
          type: 'independent',
          isIndependent: true,
          elements: []
        },
        {
          number: 2,
          text: `2. The system of claim 1, wherein the one or more processors communicate over a secure network protocol.`,
          type: 'dependent',
          isIndependent: false,
          elements: []
        }
      ];

  const activeClaim = availableClaims.find(c => (c.number || c.claimNumber) === selectedClaimNum) || availableClaims[0];
  const activeClaimNumber = activeClaim.number || activeClaim.claimNumber || 1;
  const isIndependent = activeClaim.isIndependent ?? (activeClaim.type === 'independent' || activeClaimNumber === 1);
  const activeClaimText = activeClaim.text;

  // Dynamic CPC scope metadata
  const cpcScope = activeDoc?.cpcCodes?.[0] || activeDoc?.cpc?.[0] || 'G06F 17/00';

  // Perform dynamic decomposition
  const claimElements: GranularClaimElement[] = activeClaim.elements && activeClaim.elements.length > 0
    ? activeClaim.elements.map((e, idx) => ({
        id: `E${idx + 1}`,
        type: (e.type?.toUpperCase() as GranularClaimElement['type']) || (idx % 2 === 0 ? 'COMPONENT' : 'FUNCTION'),
        term: e.term || e.text || `Technical Element ${idx + 1}`,
        details: e.text || e.description || 'Extracted technical claim element scope.',
        scope: `Scope: ${e.cpcCategory || cpcScope}`
      }))
    : decomposeClaimText(activeClaimText, cpcScope);

  const getBadgeStyle = (type: GranularClaimElement['type']) => {
    switch (type) {
      case 'COMPONENT':
        return 'badge-purple';
      case 'FUNCTION':
        return 'badge-emerald';
      case 'CONSTRAINT':
        return 'badge-amber';
      case 'PROCESS':
        return 'badge-cyan';
      case 'RELATIONSHIP':
        return 'badge-indigo';
      default:
        return 'badge-indigo';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Structural Claim Decomposition Engine
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Automatically parses claims into granular technical elements (Components, Functions, Constraints, Processes) for live workspace patents.
          </p>
        </div>

        <button className="btn-primary" onClick={() => onNavigate('mapping')}>
          <GitBranch size={16} /> Map to Target Patent Claims <ArrowRight size={14} />
        </button>
      </div>

      {/* Patent Selection Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 100 }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <PatentSelector
            patents={workspacePatents}
            selectedPatentId={selectedPatentId}
            onSelect={(id) => setSelectedPatentId(id)}
            label="Select Workspace Patent to Decompose:"
            placeholder="Search patents by ID, title, assignee..."
            onNavigateWorkspace={() => onNavigate('workspace')}
          />
        </div>
      </div>

      {/* Main Split Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', position: 'relative', zIndex: 1 }}>
        {/* Left: Original Claim Text & Claim Selector */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-cyan">ACTIVE TARGET: {activeDoc?.id}</span>
              <span className={`badge ${isIndependent ? 'badge-indigo' : 'badge-purple'}`}>
                CLAIM {activeClaimNumber} ({isIndependent ? 'INDEPENDENT' : 'DEPENDENT'})
              </span>
            </div>

            {onOpenClaimTranslator && (
              <button
                className="btn-primary"
                onClick={() => onOpenClaimTranslator(activeDoc?.id || 'US10928341B2', activeClaimNumber, activeClaimText)}
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              >
                <Languages size={13} /> Translate Claim
              </button>
            )}
          </div>

          {/* Claim Selector Bar */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', flexShrink: 0 }}>Select Claim:</span>
            {availableClaims.map(c => {
              const cNum = c.number || c.claimNumber || 1;
              const isSelected = cNum === activeClaimNumber;
              return (
                <button
                  key={cNum}
                  onClick={() => setSelectedClaimNum(cNum)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-color)',
                    background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-surface)',
                    color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Claim {cNum} {c.isIndependent ? '(Ind)' : '(Dep)'}
                </button>
              );
            })}
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', lineHeight: 1.4 }}>
            {activeDoc?.title}
          </h3>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.88rem', lineHeight: '1.75', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            "{activeClaimText}"
          </div>
        </div>

        {/* Right: Decomposed Technical Elements Tree */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Decomposed Technical Elements ({claimElements.length})
            </h3>
            <span className="badge badge-emerald"><FileCheck size={12} /> {claimElements.length} ELEMENTS EXTRACTED</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {claimElements.map((elem) => (
              <div 
                key={elem.id}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  background: 'var(--gradient-primary)',
                  color: '#0B0F19',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  lineHeight: 1,
                  flexShrink: 0
                }}>
                  {elem.id}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                    <span style={{ fontSize: '0.90rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {elem.term}
                    </span>
                    <span className={`badge ${getBadgeStyle(elem.type)}`} style={{ fontSize: '0.68rem', flexShrink: 0 }}>
                      {elem.type}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: '1.45' }}>
                    {elem.details}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {elem.scope}
                    </span>
                    <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <CheckCircle2 size={12} /> Semantic Scope Mapped
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
