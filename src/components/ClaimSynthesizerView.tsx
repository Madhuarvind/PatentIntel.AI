/**
 * ClaimSynthesizerView.tsx
 *
 * AI-Powered Patent Claim Synthesizer — primary workspace view.
 *
 * Layout:
 *   HEADER
 *   ┌──────────────┬───────────────────────────────┬─────────────────────┐
 *   │  LEFT PANEL  │       CENTRE PANEL            │    RIGHT PANEL      │
 *   │  (Input &    │  (Generated Claims & Tree)    │  (Evidence &        │
 *   │   Config)    │                               │   Grounding)        │
 *   └──────────────┴───────────────────────────────┴─────────────────────┘
 *   BOTTOM PANEL (Quality | Dependency Tree | Version History | Warnings)
 *
 * This is an AI-assisted drafting workspace — NOT legal advice.
 */

import React, { useState, useRef, useCallback } from 'react';
import type {
  ClaimCandidate,
  GeneratedClaim,
  ClaimStrategy,
  ClaimCategory,
  ClaimDraft,
  ClaimVersion,
  TechnicalElementsModel,
  ClaimSynthesisRequest,
} from '../types';
import { workspaceStore } from '../services/workspaceStore';
import { claimDraftStore } from '../services/claimDraftStore';
import { generateClaimSet, regenerateSection } from '../services/claimSynthesizerService';
import { PatentSelector } from './PatentSelector';
import {
  Wand2, Upload, FolderOpen, ChevronDown,
  CheckCircle2, AlertTriangle, XCircle, Shield,
  Edit3, RefreshCw, Plus, Save, Download,
  GitBranch, History, Layers, ArrowRight,
  FileText, Copy, CheckCheck, Info, Zap, BarChart3,
  ChevronUp, AlertCircle, Clock
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Sub-component: SupportBadge
// ---------------------------------------------------------------------------
type SupportStatus = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED';

const SupportBadge: React.FC<{ status: SupportStatus; score?: number }> = ({ status, score }) => {
  const configs = {
    SUPPORTED: { color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: <CheckCircle2 size={11} />, label: 'Supported' },
    PARTIALLY_SUPPORTED: { color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: <AlertTriangle size={11} />, label: 'Partial' },
    UNSUPPORTED: { color: 'var(--accent-rose)', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)', icon: <XCircle size={11} />, label: 'Unsupported' },
  };
  const c = configs[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {c.icon} {c.label} {score !== undefined && `(${(score * 100).toFixed(0)}%)`}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: QualityMetricCard
// ---------------------------------------------------------------------------
const QualityCard: React.FC<{ label: string; value: string | number; suffix?: string; color: string; warning?: boolean }> = ({ label, value, suffix, color, warning }) => (
  <div style={{ background: 'var(--bg-surface)', padding: '16px 14px', borderRadius: 12, border: `1px solid ${warning ? 'rgba(244,63,94,0.3)' : 'var(--border-color)'}`, textAlign: 'center' }}>
    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6, letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: warning ? 'var(--accent-rose)' : color }}>
      {value}<span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>{suffix}</span>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Sub-component: ClaimTextBlock (editable)
// ---------------------------------------------------------------------------
const ClaimTextBlock: React.FC<{
  claim: GeneratedClaim;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (text: string) => void;
  onRegenerate: () => void;
  onAddLimitation: () => void;
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ claim, isEditing, onEdit, onSave, onRegenerate, onAddLimitation, isSelected, onClick }) => {
  const [editText, setEditText] = useState(claim.text);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(claim.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <div
      onClick={!isEditing ? onClick : undefined}
      style={{
        background: isSelected ? 'rgba(0,242,254,0.06)' : 'var(--bg-surface)',
        border: `1px solid ${isSelected ? 'rgba(0,242,254,0.4)' : 'var(--border-color)'}`,
        borderRadius: 12, padding: '16px', cursor: !isEditing ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Claim header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'var(--gradient-primary)', color: '#0B0F19', fontWeight: 800, fontSize: '0.78rem', padding: '3px 10px', borderRadius: 6 }}>
            Claim {claim.claimNumber}
          </span>
          <span className={`badge ${claim.isIndependent ? 'badge-cyan' : 'badge-indigo'}`} style={{ fontSize: '0.68rem' }}>
            {claim.isIndependent ? 'Independent' : `Depends on ${claim.dependsOn.join(', ')}`}
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{claim.category}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleCopy} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }} title="Copy">
            {copied ? <CheckCheck size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
          </button>
          {!isEditing && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
              <Edit3 size={12} /> Edit
            </button>
          )}
          {!isEditing && (
            <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
              <RefreshCw size={12} /> Regen
            </button>
          )}
          {claim.isIndependent && !isEditing && (
            <button onClick={(e) => { e.stopPropagation(); onAddLimitation(); }} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
              <Plus size={12} /> Limit
            </button>
          )}
        </div>
      </div>

      {/* Claim text */}
      {isEditing ? (
        <div>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="input-field"
            style={{ width: '100%', minHeight: 140, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.7, resize: 'vertical' }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={() => onSave(editText)}>
              <Save size={13} /> Save Changes
            </button>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={() => { setEditText(claim.text); onSave(claim.text); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', lineHeight: 1.75, color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
          {claim.text}
        </pre>
      )}

      {/* Why this claim */}
      {claim.whySelected && claim.isIndependent && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}>
            <Info size={12} style={{ display: 'inline', marginRight: 4 }} />Why This Claim?
          </summary>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, padding: '8px 12px', background: 'rgba(0,242,254,0.05)', borderRadius: 8, lineHeight: 1.5 }}>
            {claim.whySelected}
          </p>
        </details>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: DependencyTree
// ---------------------------------------------------------------------------
const DependencyTree: React.FC<{
  independentClaims: GeneratedClaim[];
  dependentClaims: GeneratedClaim[];
  selectedClaimNum: number | null;
  onSelectClaim: (num: number) => void;
}> = ({ independentClaims, dependentClaims, selectedClaimNum, onSelectClaim }) => {
  const renderDepChildren = (parentNum: number, depth: number): React.ReactNode => {
    const children = dependentClaims.filter(dc => dc.dependsOn.includes(parentNum));
    if (children.length === 0) return null;
    return (
      <div style={{ marginLeft: 20, borderLeft: '2px solid var(--border-color)', paddingLeft: 12 }}>
        {children.map((child, idx) => (
          <div key={child.claimNumber}>
            <div
              onClick={() => onSelectClaim(child.claimNumber)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
                cursor: 'pointer', background: selectedClaimNum === child.claimNumber ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: selectedClaimNum === child.claimNumber ? 'var(--accent-indigo)' : 'var(--text-muted)',
                transition: 'all 0.15s', marginBottom: 2, fontSize: '0.84rem', fontWeight: 500,
              }}
            >
              <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{idx < children.length - 1 ? '├──' : '└──'}</span>
              <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-indigo)', borderRadius: 4, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 800 }}>
                {child.claimNumber}
              </span>
              <span>Claim {child.claimNumber}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-dim)' }}>→ {child.dependsOn[0]}</span>
            </div>
            {renderDepChildren(child.claimNumber, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {independentClaims.map(ic => (
        <div key={ic.claimNumber}>
          <div
            onClick={() => onSelectClaim(ic.claimNumber)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10,
              cursor: 'pointer', background: selectedClaimNum === ic.claimNumber ? 'rgba(0,242,254,0.1)' : 'var(--bg-surface)',
              color: selectedClaimNum === ic.claimNumber ? 'var(--accent-cyan)' : 'var(--text-main)',
              border: `1px solid ${selectedClaimNum === ic.claimNumber ? 'rgba(0,242,254,0.3)' : 'var(--border-color)'}`,
              transition: 'all 0.15s', fontSize: '0.88rem', fontWeight: 700,
            }}
          >
            <GitBranch size={14} />
            <span style={{ background: 'var(--gradient-primary)', color: '#0B0F19', borderRadius: 4, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
              {ic.claimNumber}
            </span>
            <span>Claim {ic.claimNumber} — Independent ({ic.category})</span>
          </div>
          {renderDepChildren(ic.claimNumber, 0)}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: EvidencePanel (right column)
// ---------------------------------------------------------------------------
const EvidencePanel: React.FC<{ claim: GeneratedClaim | null }> = ({ claim }) => {
  const [expandedEl, setExpandedEl] = useState<string | null>(null);

  if (!claim) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', gap: 12, padding: 24 }}>
        <Shield size={36} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.5 }}>Select a claim to view evidence grounding and support classification.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Shield size={16} color="var(--accent-emerald)" />
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Evidence — Claim {claim.claimNumber}</span>
      </div>

      {claim.elements.length === 0 && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No elements mapped to this claim.</p>
      )}

      {claim.elements.map(el => (
        <div key={el.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${el.evidence?.supportStatus === 'UNSUPPORTED' ? 'rgba(244,63,94,0.35)' : 'var(--border-color)'}`, borderRadius: 10, overflow: 'hidden' }}>
          {/* Element header */}
          <div
            onClick={() => setExpandedEl(expandedEl === el.id ? null : el.id)}
            style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'var(--gradient-primary)', color: '#0B0F19', fontWeight: 800, fontSize: '0.72rem', padding: '2px 7px', borderRadius: 4 }}>{el.id}</span>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>{el.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {el.evidence && <SupportBadge status={el.evidence.supportStatus} score={el.evidence.supportScore} />}
              {expandedEl === el.id ? <ChevronUp size={14} color="var(--text-dim)" /> : <ChevronDown size={14} color="var(--text-dim)" />}
            </div>
          </div>

          {/* Element body */}
          {expandedEl === el.id && (
            <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-color)' }}>
              {/* Claim element text */}
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '10px 0 8px', fontStyle: 'italic' }}>
                "{el.text}"
              </p>

              {/* Unsupported warning */}
              {el.evidence?.supportStatus === 'UNSUPPORTED' && (
                <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8 }}>
                  <AlertTriangle size={14} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 2 }}>⚠ Unsupported Element</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No corresponding disclosure found in source material. This element should not be included without additional specification support.</div>
                  </div>
                </div>
              )}

              {/* Evidence reference */}
              {el.evidence && el.evidence.paragraphRef && (
                <div style={{ background: 'rgba(0,242,254,0.04)', border: '1px solid rgba(0,242,254,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    Source Evidence
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 6 }}>
                    {el.evidence.sourceSection} · {el.evidence.paragraphRef}
                  </div>
                  {el.evidence.quote && (
                    <blockquote style={{ margin: 0, padding: '6px 10px', borderLeft: '3px solid var(--accent-cyan)', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{el.evidence.quote.length > 160 ? el.evidence.quote.slice(0, 160) + '…' : el.evidence.quote}"
                    </blockquote>
                  )}
                </div>
              )}

              {/* Relationships */}
              {el.relationships.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {el.relationships.map((rel, ri) => (
                    <span key={ri} style={{ fontSize: '0.74rem', color: 'var(--text-dim)', background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '2px 8px' }}>
                      {el.id} → {rel.relationLabel} → {rel.targetId}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: TechElementsPreview
// ---------------------------------------------------------------------------
const TechElementsPreview: React.FC<{ elements: TechnicalElementsModel; collapsed: boolean; onToggle: () => void }> = ({ elements, collapsed, onToggle }) => (
  <div className="glass-panel" style={{ overflow: 'hidden' }}>
    <div onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={15} color="var(--accent-amber)" />
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Extracted Technical Features</span>
        <span className="badge badge-amber" style={{ fontSize: '0.66rem' }}>{elements.components.length + elements.modules.length} elements</span>
      </div>
      {collapsed ? <ChevronDown size={16} color="var(--text-dim)" /> : <ChevronUp size={16} color="var(--text-dim)" />}
    </div>

    {!collapsed && (
      <div style={{ padding: '0 18px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'System', items: [elements.system].filter(Boolean), color: 'var(--accent-cyan)' },
          { label: 'Components', items: elements.components, color: 'var(--accent-blue)' },
          { label: 'Modules', items: elements.modules, color: 'var(--accent-indigo)' },
          { label: 'Functions', items: elements.functions.slice(0, 5), color: 'var(--accent-emerald)' },
          { label: 'Inputs', items: elements.inputs.slice(0, 4), color: 'var(--accent-purple)' },
          { label: 'Outputs', items: elements.outputs.slice(0, 4), color: 'var(--accent-amber)' },
        ].map(group => (
          <div key={group.label} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: group.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{group.label}</div>
            {group.items.length === 0
              ? <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>—</span>
              : group.items.map((item, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: group.color, display: 'inline-block', flexShrink: 0 }} />
                  {item}
                </div>
              ))
            }
          </div>
        ))}
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Sub-component: CandidateCard
// ---------------------------------------------------------------------------
const CandidateCard: React.FC<{
  candidate: ClaimCandidate;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ candidate, isSelected, onSelect }) => {
  const stratColors = {
    broad: 'var(--accent-indigo)',
    balanced: 'var(--accent-cyan)',
    narrow: 'var(--accent-emerald)',
  };
  const col = stratColors[candidate.strategy];
  const totalClaims = candidate.independentClaims.length + candidate.dependentClaims.length;

  return (
    <div
      onClick={onSelect}
      style={{
        flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
        background: isSelected ? `rgba(${candidate.strategy === 'broad' ? '99,102,241' : candidate.strategy === 'balanced' ? '0,242,254' : '16,185,129'}, 0.08)` : 'var(--bg-surface)',
        border: `1.5px solid ${isSelected ? col : 'var(--border-color)'}`,
        transition: 'all 0.2s ease', boxShadow: isSelected ? `0 0 20px ${col}22` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: col, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate {candidate.id}</span>
        {isSelected && <CheckCircle2 size={15} color={col} />}
      </div>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>{candidate.label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{ flex: 1, background: 'var(--bg-card-solid)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${candidate.coverage}%`, height: '100%', background: col, borderRadius: 999, transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: col }}>{candidate.coverage}%</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        {totalClaims} claims · {candidate.quality.unsupportedElements === 0 ? '✓ Fully grounded' : `⚠ ${candidate.quality.unsupportedElements} unsupported`}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: Import from Workspace Modal
// ---------------------------------------------------------------------------
const WorkspaceImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string, patentId: string) => void;
}> = ({ isOpen, onClose, onImport }) => {
  const patents = workspaceStore.getPatents();
  const [selectedId, setSelectedId] = useState(patents[0]?.id || '');
  const [selected, setSelected] = useState({ abstract: true, description: false, claims: true, elements: true, citations: false });

  if (!isOpen) return null;

  const patent = patents.find(p => p.id === selectedId);

  const handleImport = () => {
    if (!patent) return;
    const parts: string[] = [];
    if (selected.abstract && patent.abstract) parts.push(`Abstract:\n${patent.abstract}`);
    if (selected.claims && patent.claims) {
      parts.push(`Claims:\n${patent.claims.map(c => c.text).join('\n')}`);
    }
    if (selected.elements && patent.claims) {
      const elText = patent.claims.flatMap(c => c.elements || []).map(e => e.text || e.description || '').filter(Boolean);
      if (elText.length > 0) parts.push(`Technical Elements:\n${elText.join('\n')}`);
    }
    if (parts.length > 0) {
      onImport(`Title: ${patent.title}\n\n${parts.join('\n\n')}`, patent.id);
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: 540, padding: 28, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>✕</button>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>Import from Patent Workspace</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 20px' }}>Select a patent and choose which content to use as the synthesis source.</p>

        <div style={{ marginBottom: 18 }}>
          <PatentSelector
            patents={patents}
            selectedPatentId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            label="Select Patent"
            placeholder="Search workspace patent..."
          />
        </div>

        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>Include in synthesis source:</div>
        {([
          { key: 'abstract', label: '☑ Abstract' },
          { key: 'claims', label: '☑ Claims' },
          { key: 'elements', label: '☑ Extracted Technical Elements' },
          { key: 'description', label: '☐ Description (placeholder)' },
          { key: 'citations', label: '☐ Citations' },
        ] as { key: keyof typeof selected; label: string }[]).map(item => (
          <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={selected[item.key]} onChange={e => setSelected(s => ({ ...s, [item.key]: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }} />
            <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>{item.label.replace(/^[☑☐]\s*/, '')}</span>
          </label>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={handleImport} style={{ flex: 1 }}>
            <ArrowRight size={15} /> Import Selected Content
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: Export Modal
// ---------------------------------------------------------------------------
const ExportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  claims: GeneratedClaim[];
  quality: ClaimCandidate['quality'] | null;
}> = ({ isOpen, onClose, claims, quality }) => {
  if (!isOpen) return null;

  const disclaimer = '\n⚠ AI-ASSISTED DRAFT — FOR ATTORNEY/EXAMINER REVIEW ONLY\nThis document is generated by AI and does not constitute legal advice or guarantee patentability.\n\n';

  const txtContent = disclaimer + 'DRAFT PATENT CLAIM SET\n' + '='.repeat(50) + '\n\n' +
    claims.map(c => `Claim ${c.claimNumber}.\n${c.text}`).join('\n\n');

  const jsonContent = JSON.stringify({
    disclaimer: 'AI-assisted draft for review — not a legal document',
    promptVersion: 'claim-synthesizer-v1',
    generatedAt: new Date().toISOString(),
    claims: claims.map(c => ({
      claimNumber: c.claimNumber,
      isIndependent: c.isIndependent,
      dependsOn: c.dependsOn,
      category: c.category,
      text: c.text,
      elements: c.elements.map(e => ({
        id: e.id, label: e.label, text: e.text,
        support: e.evidence?.supportStatus,
        supportScore: e.evidence?.supportScore,
        evidence: e.evidence?.paragraphRef,
      })),
    })),
    quality,
  }, null, 2);

  const download = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Draft Patent Claims</title>
      <style>body{font-family:Georgia,serif;padding:40px;color:#000;line-height:1.7}
      h1{border-bottom:2px solid #000;padding-bottom:10px}
      .disclaimer{background:#fff3cd;border:1px solid #ffc107;padding:12px;margin:16px 0;font-size:0.9rem}
      .claim{margin:20px 0;page-break-inside:avoid}
      pre{white-space:pre-wrap;font-family:Georgia,serif;margin:0}
      </style></head><body>
      <h1>Draft Patent Claim Set</h1>
      <div class="disclaimer"><strong>⚠ AI-ASSISTED DRAFT</strong><br>For attorney/examiner review only. This document does not constitute legal advice or guarantee patentability.</div>
      ${claims.map(c => `<div class="claim"><strong>Claim ${c.claimNumber}.</strong><pre>${c.text}</pre></div>`).join('')}
      </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: 500, padding: 28, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>✕</button>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px' }}>Export Draft Claim Set</h3>
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
          <AlertTriangle size={13} style={{ display: 'inline', marginRight: 5 }} />
          All exports include the disclaimer: <em>"AI-assisted draft — for review only"</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }} onClick={() => download(txtContent, 'draft_claims.txt', 'text/plain')}>
            <FileText size={16} /> Export as TXT
          </button>
          <button className="btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }} onClick={() => download(jsonContent, 'draft_claims.json', 'application/json')}>
            <FileText size={16} /> Export as JSON (full structured)
          </button>
          <button className="btn-primary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }} onClick={handlePrint}>
            <Download size={16} /> Print / Save as PDF
          </button>
        </div>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 16, textAlign: 'center' }}>
          DOCX export — coming in next release
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export const ClaimSynthesizerView: React.FC = () => {
  // --- Input state ---
  const [sourceText, setSourceText] = useState('');
  const [technologyDomain, setTechnologyDomain] = useState('');
  const [targetJurisdiction, setTargetJurisdiction] = useState('');
  const [strategy, setStrategy] = useState<ClaimStrategy>('balanced');
  const [claimCategories, setClaimCategories] = useState<ClaimCategory[]>(['apparatus']);
  const [dependentClaimCount, setDependentClaimCount] = useState(5);

  // --- Workspace import ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedPatentId, setImportedPatentId] = useState<string | null>(null);

  // --- Generation state ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState('');

  // --- Results state ---
  const [candidates, setCandidates] = useState<ClaimCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<'A' | 'B' | 'C'>('B');
  const [activeClaims, setActiveClaims] = useState<GeneratedClaim[]>([]);
  const [techElements, setTechElements] = useState<TechnicalElementsModel | null>(null);
  const [techElementsCollapsed, setTechElementsCollapsed] = useState(false);

  // --- UI state ---
  const [selectedClaimNum, setSelectedClaimNum] = useState<number | null>(null);
  const [editingClaimNum, setEditingClaimNum] = useState<number | null>(null);
  const [bottomTab, setBottomTab] = useState<'quality' | 'tree' | 'versions' | 'warnings'>('quality');
  const [isExportOpen, setIsExportOpen] = useState(false);

  // --- Draft state ---
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [savedVersions, setSavedVersions] = useState<ClaimVersion[]>([]);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) ?? null;
  const selectedClaim = activeClaims.find(c => c.claimNumber === selectedClaimNum) ?? null;
  const independentClaims = activeClaims.filter(c => c.isIndependent);
  const dependentClaims = activeClaims.filter(c => !c.isIndependent);
  const quality = selectedCandidate?.quality ?? null;

  // --- File upload ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setSourceText(text || '');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Workspace import ---
  const handleWorkspaceImport = (text: string, patentId: string) => {
    setSourceText(text);
    setImportedPatentId(patentId);
  };

  // --- Toggle claim category ---
  const toggleCategory = (cat: ClaimCategory) => {
    setClaimCategories(prev =>
      prev.includes(cat) ? (prev.length > 1 ? prev.filter(c => c !== cat) : prev) : [...prev, cat]
    );
  };

  // --- Generate ---
  const handleGenerate = useCallback(async () => {
    if (!sourceText.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
    setCandidates([]);
    setActiveClaims([]);
    setTechElements(null);
    setSelectedClaimNum(null);

    const steps = ['Extracting technical features…', 'Chunking source for evidence…', 'Drafting claim candidates…', 'Running grounding verification…', 'Validating claim quality…'];
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      setGenerationStep(steps[Math.min(stepIdx++, steps.length - 1)]);
    }, 400);

    try {
      const request: ClaimSynthesisRequest = {
        sourceText,
        strategy,
        claimCategories,
        dependentClaimCount,
        sourcePatentId: importedPatentId || undefined,
        technologyDomain: technologyDomain || undefined,
        targetJurisdiction: targetJurisdiction || undefined,
      };

      const result = await generateClaimSet(request);

      if (!result.success) {
        setGenerateError(result.error || 'Generation failed.');
        return;
      }

      setCandidates(result.candidates);
      setTechElements(result.technicalElements);

      // Default: select the strategy the user chose, fallback to B
      const preferredId = strategy === 'broad' ? 'A' : strategy === 'narrow' ? 'C' : 'B';
      const preferredCandidate = result.candidates.find(c => c.id === preferredId) ?? result.candidates[0];
      setSelectedCandidateId(preferredCandidate.id);
      const allClaims = [...preferredCandidate.independentClaims, ...preferredCandidate.dependentClaims];
      setActiveClaims(allClaims);
      if (allClaims.length > 0) setSelectedClaimNum(allClaims[0].claimNumber);

    } catch (err) {
      setGenerateError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      clearInterval(stepInterval);
      setGenerationStep('');
      setIsGenerating(false);
    }
  }, [sourceText, strategy, claimCategories, dependentClaimCount, importedPatentId, technologyDomain, targetJurisdiction, isGenerating]);

  // --- Select candidate ---
  const handleSelectCandidate = (candidateId: 'A' | 'B' | 'C') => {
    const cand = candidates.find(c => c.id === candidateId);
    if (!cand) return;
    setSelectedCandidateId(candidateId);
    const all = [...cand.independentClaims, ...cand.dependentClaims];
    setActiveClaims(all);
    if (all.length > 0) setSelectedClaimNum(all[0].claimNumber);
    setEditingClaimNum(null);
  };

  // --- Edit claim ---
  const handleSaveClaimEdit = (claimNum: number, newText: string) => {
    setActiveClaims(prev => prev.map(c => c.claimNumber === claimNum ? { ...c, text: newText } : c));
    setEditingClaimNum(null);
  };

  // --- Add limitation ---
  const handleAddLimitation = (claimNum: number) => {
    const parent = activeClaims.find(c => c.claimNumber === claimNum);
    if (!parent) return;
    const newNum = Math.max(...activeClaims.map(c => c.claimNumber)) + 1;
    const newClaim: GeneratedClaim = {
      claimNumber: newNum,
      category: parent.category,
      isIndependent: false,
      dependsOn: [claimNum],
      text: `The apparatus of claim ${claimNum}, wherein [add limitation here].`,
      elements: [{ id: 'L1', label: 'User-added limitation', text: '[add limitation here]', evidence: { elementText: '', sourceSection: 'User-added', paragraphRef: '', quote: '', supportScore: 0, supportStatus: 'UNSUPPORTED' }, relationships: [] }],
      addedLimitations: ['[add limitation here]'],
    };
    setActiveClaims(prev => [...prev, newClaim]);
    setSelectedClaimNum(newNum);
    setEditingClaimNum(newNum);
  };

  // --- Regenerate section ---
  const handleRegenerateSection = async (section: 'independent' | 'dependents') => {
    if (!selectedCandidate || !sourceText) return;
    setIsGenerating(true);
    setGenerationStep(`Regenerating ${section} claims…`);
    try {
      const request: ClaimSynthesisRequest = { sourceText, strategy, claimCategories, dependentClaimCount };
      const rebuilt = await regenerateSection(section, selectedCandidate, request);
      const all = [...rebuilt.independentClaims, ...rebuilt.dependentClaims];
      setActiveClaims(all);
      setCandidates(prev => prev.map(c => c.id === selectedCandidateId ? rebuilt : c));
    } catch {
      /* silent */
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // --- Save draft ---
  const handleSaveDraft = () => {
    if (activeClaims.length === 0) return;

    let draft: ClaimDraft;
    if (currentDraftId) {
      const existing = claimDraftStore.getDraftById(currentDraftId);
      draft = existing ? { ...existing, activeClaimsEdited: activeClaims, updatedAt: new Date().toISOString() } : createNewDraftObject();
    } else {
      draft = createNewDraftObject();
    }

    const saved = claimDraftStore.saveDraft(draft);
    setCurrentDraftId(saved.draftId);

    const version = claimDraftStore.createVersion(
      saved.draftId,
      activeClaims,
      strategy,
      importedPatentId ? `Patent: ${importedPatentId}` : 'Manual input',
      `Saved with ${activeClaims.length} claims`
    );

    if (version) {
      setSavedVersions(claimDraftStore.getDraftById(saved.draftId)?.versions ?? []);
    }

    setSaveFeedback('Draft saved successfully!');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const createNewDraftObject = (): ClaimDraft => ({
    draftId: `draft_${Date.now()}`,
    sourceText,
    sourcePatentId: importedPatentId || undefined,
    technicalElements: techElements || { system: '', components: [], modules: [], inputs: [], outputs: [], functions: [], processingSteps: [], technicalRelationships: [], constraints: [], technicalEffects: [], optionalFeatures: [] },
    selectedCandidateId,
    candidates,
    activeClaimsEdited: activeClaims,
    quality: quality || { technicalCoverage: 0, evidenceSupport: 0, unsupportedElements: 0, dependencyErrors: 0, terminologyConflicts: 0, missingCoreElements: [], redundantElements: [], warnings: [] },
    versions: savedVersions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  const hasResults = candidates.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ background: 'var(--gradient-accent)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wand2 size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              AI-Powered Patent Claim Synthesizer
            </h1>
            <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>NEW</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Generate evidence-grounded patent claim drafts from technical specifications.
            <span style={{ color: 'var(--text-dim)', marginLeft: 8, fontSize: '0.8rem' }}>AI-assisted drafting · Not legal advice</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {hasResults && (
            <>
              {saveFeedback
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: 'var(--accent-emerald)', fontWeight: 600 }}><CheckCircle2 size={14} />{saveFeedback}</span>
                : <button className="btn-secondary" onClick={handleSaveDraft} style={{ fontSize: '0.84rem' }}><Save size={14} /> Save Draft</button>
              }
              <button className="btn-secondary" onClick={() => setIsExportOpen(true)} style={{ fontSize: '0.84rem' }}><Download size={14} /> Export</button>
            </>
          )}
        </div>
      </div>

      {/* ── DISCLAIMER BANNER ── */}
      <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Info size={15} color="var(--accent-indigo)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          <strong style={{ color: 'var(--accent-indigo)' }}>Research & Drafting Tool Only.</strong> Claim output is AI-assisted and grounded in your provided specification. All results must be reviewed by a qualified patent attorney or agent. Quality scores are internal model indicators, not legal validity assessments.
        </span>
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: 20, minHeight: 0 }}>

        {/* ════════════════════ LEFT PANEL — INPUT ════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
          <div className="glass-panel" style={{ padding: 18 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Technical Specification</div>

            <textarea
              id="claim-synthesizer-spec-input"
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              className="input-field"
              placeholder="Describe the invention, system architecture, components, functions, technical relationships, and constraints..."
              style={{ width: '100%', minHeight: 180, resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', lineHeight: 1.6 }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '8px 10px' }} onClick={() => fileInputRef.current?.click()}>
                <Upload size={13} /> Upload Spec
              </button>
              <button className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '8px 10px' }} onClick={() => setIsImportModalOpen(true)}>
                <FolderOpen size={13} /> From Workspace
              </button>
              <input ref={fileInputRef} type="file" accept=".txt,.pdf,.md,.text" style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>

            {importedPatentId && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--accent-emerald)' }}>
                <CheckCircle2 size={12} /> Imported from: {importedPatentId}
                <button onClick={() => setImportedPatentId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0, marginLeft: 2 }}>✕</button>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="glass-panel" style={{ padding: 18 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Configuration</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Technology Domain (optional)</label>
              <input value={technologyDomain} onChange={e => setTechnologyDomain(e.target.value)} className="input-field" placeholder="e.g. telecommunications, AI/ML, biotech…" style={{ fontSize: '0.84rem' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Target Jurisdiction (optional)</label>
              <select value={targetJurisdiction} onChange={e => setTargetJurisdiction(e.target.value)} className="input-field" style={{ fontSize: '0.84rem' }}>
                <option value="">Not specified</option>
                <option value="US">United States (USPTO)</option>
                <option value="EP">European Patent Office (EPO)</option>
                <option value="PCT">PCT International</option>
                <option value="CN">China (CNIPA)</option>
                <option value="JP">Japan (JPO)</option>
              </select>
            </div>

            {/* Claim Strategy */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Claim Strategy</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {([
                  { value: 'broad', label: 'Broadest Supported Claim', desc: 'Max scope within disclosure' },
                  { value: 'balanced', label: 'Balanced Claim', desc: 'Default — recommended' },
                  { value: 'narrow', label: 'Narrow Technical Claim', desc: 'Exact terminology preserved' },
                ] as { value: ClaimStrategy; label: string; desc: string }[]).map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: strategy === opt.value ? 'rgba(0,242,254,0.07)' : 'transparent', border: `1px solid ${strategy === opt.value ? 'rgba(0,242,254,0.25)' : 'transparent'}`, transition: 'all 0.15s' }}>
                    <input type="radio" name="strategy" value={opt.value} checked={strategy === opt.value} onChange={() => setStrategy(opt.value)} style={{ marginTop: 3, accentColor: 'var(--accent-cyan)' }} />
                    <div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, color: strategy === opt.value ? 'var(--accent-cyan)' : 'var(--text-main)' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.4 }}>
                "Broad" means broadest within the supplied disclosure — not unlimited scope.
              </p>
            </div>

            {/* Claim Categories */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Claim Categories</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {([
                  { value: 'apparatus', label: 'Apparatus / System' },
                  { value: 'method', label: 'Method' },
                  { value: 'computer-method', label: 'Computer-implemented Method' },
                  { value: 'crm', label: 'Computer-readable Medium' },
                ] as { value: ClaimCategory; label: string }[]).map(cat => (
                  <label key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <input type="checkbox" checked={claimCategories.includes(cat.value)} onChange={() => toggleCategory(cat.value)} style={{ accentColor: 'var(--accent-cyan)', width: 14, height: 14 }} />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Dependent claims count */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Dependent Claims: <strong style={{ color: 'var(--accent-cyan)' }}>{dependentClaimCount}</strong>
              </label>
              <input type="range" min={2} max={12} value={dependentClaimCount} onChange={e => setDependentClaimCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
            </div>
          </div>

          {/* Generate Button */}
          <button
            id="claim-synthesizer-generate-btn"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating || !sourceText.trim()}
            style={{ width: '100%', padding: '13px', fontSize: '0.95rem', fontWeight: 800, opacity: isGenerating || !sourceText.trim() ? 0.6 : 1, justifyContent: 'center' }}
          >
            {isGenerating ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> {generationStep || 'Generating…'}</> : <><Wand2 size={16} /> Generate Claims</>}
          </button>

          {generateError && (
            <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 8 }}>
              <AlertCircle size={15} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--accent-rose)', margin: 0, lineHeight: 1.5 }}>{generateError}</p>
            </div>
          )}
        </div>

        {/* ════════════════════ CENTRE PANEL — CLAIMS ════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 340px)' }}>

          {!hasResults && !isGenerating && (
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 300 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Wand2 size={26} color="var(--accent-purple)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>Ready to Synthesize</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
                Provide a technical specification in the left panel and click <strong>Generate Claims</strong> to begin AI-assisted drafting.
              </p>
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', maxWidth: 380 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-indigo)', marginBottom: 6 }}>Try the acceptance test spec:</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "A traffic control communication system includes a traffic controller, a mobile transmitter, a communication module, and a processor configured to receive traffic information and transmit a priority control message."
                </p>
                <button className="btn-secondary" style={{ marginTop: 8, fontSize: '0.78rem', padding: '5px 12px' }}
                  onClick={() => setSourceText('A traffic control communication system includes a traffic controller, a mobile transmitter, a communication module, and a processor configured to receive traffic information and transmit a priority control message.')}>
                  <ArrowRight size={12} /> Use this example
                </button>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 200, gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--accent-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{generationStep || 'Synthesizing claims…'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Grounding every element to source evidence</div>
            </div>
          )}

          {hasResults && !isGenerating && (
            <>
              {/* Technical elements preview */}
              {techElements && (
                <TechElementsPreview elements={techElements} collapsed={techElementsCollapsed} onToggle={() => setTechElementsCollapsed(p => !p)} />
              )}

              {/* Candidate selector */}
              <div className="glass-panel" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Layers size={15} color="var(--accent-purple)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Claim Candidates</span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginLeft: 4 }}>Select one to use as base</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {candidates.map(cand => (
                    <CandidateCard key={cand.id} candidate={cand} isSelected={selectedCandidateId === cand.id} onSelect={() => handleSelectCandidate(cand.id)} />
                  ))}
                </div>
              </div>

              {/* Section regeneration controls */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '7px 12px' }} onClick={() => handleRegenerateSection('independent')}>
                  <RefreshCw size={13} /> Regenerate Independent
                </button>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '7px 12px' }} onClick={() => handleRegenerateSection('dependents')}>
                  <RefreshCw size={13} /> Regenerate Dependents
                </button>
              </div>

              {/* Independent claims */}
              {independentClaims.length > 0 && (
                <div className="glass-panel" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>Independent Claims</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>{independentClaims.length} claim{independentClaims.length > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {independentClaims.map(claim => (
                      <ClaimTextBlock
                        key={claim.claimNumber}
                        claim={claim}
                        isEditing={editingClaimNum === claim.claimNumber}
                        onEdit={() => setEditingClaimNum(claim.claimNumber)}
                        onSave={(text) => handleSaveClaimEdit(claim.claimNumber, text)}
                        onRegenerate={() => handleRegenerateSection('independent')}
                        onAddLimitation={() => handleAddLimitation(claim.claimNumber)}
                        isSelected={selectedClaimNum === claim.claimNumber}
                        onClick={() => setSelectedClaimNum(claim.claimNumber)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Dependent claims */}
              {dependentClaims.length > 0 && (
                <div className="glass-panel" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>Dependent Claims</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>{dependentClaims.length} claims</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {dependentClaims.map(claim => (
                      <ClaimTextBlock
                        key={claim.claimNumber}
                        claim={claim}
                        isEditing={editingClaimNum === claim.claimNumber}
                        onEdit={() => setEditingClaimNum(claim.claimNumber)}
                        onSave={(text) => handleSaveClaimEdit(claim.claimNumber, text)}
                        onRegenerate={() => handleRegenerateSection('dependents')}
                        onAddLimitation={() => handleAddLimitation(claim.claimNumber)}
                        isSelected={selectedClaimNum === claim.claimNumber}
                        onClick={() => setSelectedClaimNum(claim.claimNumber)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ════════════════════ RIGHT PANEL — EVIDENCE ════════════════════ */}
        <div className="glass-panel" style={{ padding: 18, overflowY: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Evidence & Grounding</div>
          <EvidencePanel claim={selectedClaim} />
        </div>
      </div>

      {/* ── BOTTOM PANEL ── */}
      {hasResults && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 8px' }}>
            {([
              { id: 'quality', label: 'Claim Quality', icon: <BarChart3 size={14} /> },
              { id: 'tree', label: 'Dependency Tree', icon: <GitBranch size={14} /> },
              { id: 'versions', label: `Version History (${savedVersions.length})`, icon: <History size={14} /> },
              { id: 'warnings', label: `Warnings (${quality?.warnings.length ?? 0})`, icon: <AlertTriangle size={14} /> },
            ] as { id: typeof bottomTab; label: string; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setBottomTab(tab.id)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '12px 16px',
                  fontSize: '0.82rem', fontWeight: bottomTab === tab.id ? 700 : 500,
                  color: bottomTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${bottomTab === tab.id ? 'var(--accent-cyan)' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 20 }}>
            {/* Quality Tab */}
            {bottomTab === 'quality' && quality && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                  <QualityCard label="Technical Coverage" value={quality.technicalCoverage} suffix="%" color="var(--accent-cyan)" />
                  <QualityCard label="Evidence Support" value={quality.evidenceSupport} suffix="%" color="var(--accent-emerald)" />
                  <QualityCard label="Unsupported Elements" value={quality.unsupportedElements} color="var(--accent-rose)" warning={quality.unsupportedElements > 0} />
                  <QualityCard label="Dependency Errors" value={quality.dependencyErrors} color="var(--accent-amber)" warning={quality.dependencyErrors > 0} />
                  <QualityCard label="Terminology Conflicts" value={quality.terminologyConflicts} color="var(--accent-purple)" warning={quality.terminologyConflicts > 0} />
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: 0 }}>
                  <Info size={11} style={{ display: 'inline', marginRight: 4 }} />These are internal model-quality indicators only. They do not represent legal validity, patentability, or freedom-to-operate assessments.
                </p>
              </div>
            )}

            {/* Dependency Tree Tab */}
            {bottomTab === 'tree' && (
              <div>
                <DependencyTree
                  independentClaims={independentClaims}
                  dependentClaims={dependentClaims}
                  selectedClaimNum={selectedClaimNum}
                  onSelectClaim={(num) => { setSelectedClaimNum(num); }}
                />
                {activeClaims.length === 0 && <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>No claims generated yet.</p>}
              </div>
            )}

            {/* Version History Tab */}
            {bottomTab === 'versions' && (
              <div>
                {savedVersions.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0', color: 'var(--text-dim)' }}>
                    <Clock size={24} style={{ opacity: 0.4 }} />
                    <p style={{ fontSize: '0.84rem', margin: 0 }}>No saved versions yet. Click <strong>Save Draft</strong> to create version history.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {savedVersions.slice().reverse().map(ver => (
                      <div key={ver.versionId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                        <div style={{ background: 'var(--gradient-primary)', color: '#0B0F19', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
                          v{ver.versionNumber}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>{ver.label}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 2 }}>
                            {ver.strategy} · {ver.modelUsed} · {new Date(ver.createdAt).toLocaleString()}
                          </div>
                          {ver.changes && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{ver.changes}</div>}
                        </div>
                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                          onClick={() => {
                            setActiveClaims(ver.claimsSnapshot);
                            if (ver.claimsSnapshot.length > 0) setSelectedClaimNum(ver.claimsSnapshot[0].claimNumber);
                          }}>
                          <History size={12} /> Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Warnings Tab */}
            {bottomTab === 'warnings' && (
              <div>
                {(quality?.warnings ?? []).length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-emerald)' }}>
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>All quality checks passed — no warnings.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {quality?.warnings.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                        <AlertTriangle size={14} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <WorkspaceImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleWorkspaceImport} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} claims={activeClaims} quality={quality} />

      {/* Inline keyframe for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
