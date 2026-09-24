import React, { useState } from 'react';
import {
  GitCommit,
  GitBranch,
  ArrowRight,
  ExternalLink,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { PatentDocument } from '../types';
import { checkTemporalEligibility } from '../services/claimEvidenceService';

export interface DynamicCitationNode {
  id: string;
  patentNumber: string;
  title: string;
  assignee: string;
  filingDate?: string;
  priorityDate?: string;
  publicationDate?: string;
  type: 'target' | 'backward' | 'forward' | 'cpc_peer' | 'unassessed';
  relation: string;
  cpcClass: string;
  x: number;
  y: number;
  document: PatentDocument;
}

interface Props {
  targetPatent?: PatentDocument | null;
  workspacePatents?: PatentDocument[];
  onSelectPatent?: (p: PatentDocument) => void;
}

export const CitationLineageGraph: React.FC<Props> = ({
  targetPatent,
  workspacePatents = [],
  onSelectPatent
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'backward' | 'forward' | 'cpc'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('target');

  if (!targetPatent || workspacePatents.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <GitBranch size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', margin: '0 0 6px' }}>
          No Target Patent Selected
        </h4>
        <p style={{ fontSize: '0.85rem', margin: 0 }}>
          Load or import patents into the workspace to visualize chronological disclosures and classification lineage.
        </p>
      </div>
    );
  }

  // Construct target node
  const targetId = targetPatent.id;
  const targetCpc = (targetPatent.cpcCodes && targetPatent.cpcCodes[0]) ||
                    (targetPatent.cpc && targetPatent.cpc[0]) ||
                    'Unclassified';
  const targetCpcPrefix = targetCpc.length >= 4 ? targetCpc.slice(0, 4) : targetCpc;

  // Build candidate nodes from other workspace patents
  const otherPatents = workspacePatents.filter(p => p.id !== targetId);

  const backwardList: PatentDocument[] = [];
  const forwardList: PatentDocument[] = [];
  const unassessedList: PatentDocument[] = [];

  for (const p of otherPatents) {
    const temporal = checkTemporalEligibility(targetPatent.filingDate, p.publicationDate);
    if (temporal.status !== 'TEMPORAL_UNVERIFIED') {
      if (temporal.status === 'PUBLISHED_BEFORE_FILING') {
        backwardList.push(p);
      } else {
        forwardList.push(p);
      }
    } else {
      unassessedList.push(p);
    }
  }

  const nodes: DynamicCitationNode[] = [
    {
      id: 'target',
      patentNumber: targetPatent.publicationNumber || targetPatent.id,
      title: targetPatent.title || 'Target Document',
      assignee: targetPatent.assignee || 'Unassigned',
      filingDate: targetPatent.filingDate,
      priorityDate: targetPatent.priorityDate,
      publicationDate: targetPatent.publicationDate,
      type: 'target',
      relation: 'Target Patent Under Examination',
      cpcClass: targetCpc,
      x: 50,
      y: 50,
      document: targetPatent
    }
  ];

  // Distribute backward nodes on left side
  backwardList.forEach((p, idx) => {
    const total = backwardList.length;
    const yPos = total === 1 ? 50 : 20 + (idx / (total - 1)) * 60;
    const pCpc = (p.cpcCodes && p.cpcCodes[0]) || (p.cpc && p.cpc[0]) || 'Unclassified';
    nodes.push({
      id: `back_${p.id}`,
      patentNumber: p.publicationNumber || p.id,
      title: p.title || 'Prior Disclosure',
      assignee: p.assignee || 'Unassigned',
      filingDate: p.filingDate,
      priorityDate: p.priorityDate,
      publicationDate: p.publicationDate,
      type: 'backward',
      relation: 'Published Before Target Filing',
      cpcClass: pCpc,
      x: 18,
      y: yPos,
      document: p
    });
  });

  // Distribute forward nodes on right side
  forwardList.forEach((p, idx) => {
    const total = forwardList.length;
    const yPos = total === 1 ? 50 : 20 + (idx / (total - 1)) * 60;
    const pCpc = (p.cpcCodes && p.cpcCodes[0]) || (p.cpc && p.cpc[0]) || 'Unclassified';
    nodes.push({
      id: `fwd_${p.id}`,
      patentNumber: p.publicationNumber || p.id,
      title: p.title || 'Subsequent Disclosure',
      assignee: p.assignee || 'Unassigned',
      filingDate: p.filingDate,
      priorityDate: p.priorityDate,
      publicationDate: p.publicationDate,
      type: 'forward',
      relation: 'Subsequent Disclosure (Post-Filing)',
      cpcClass: pCpc,
      x: 82,
      y: yPos,
      document: p
    });
  });

  // Distribute unassessed nodes along the bottom
  unassessedList.forEach((p, idx) => {
    const total = unassessedList.length;
    const xPos = total === 1 ? 50 : 30 + (idx / (total - 1)) * 40;
    const pCpc = (p.cpcCodes && p.cpcCodes[0]) || (p.cpc && p.cpc[0]) || 'Unclassified';
    nodes.push({
      id: `unassessed_${p.id}`,
      patentNumber: p.publicationNumber || p.id,
      title: p.title || 'Unverified Date Record',
      assignee: p.assignee || 'Unassigned',
      filingDate: p.filingDate,
      priorityDate: p.priorityDate,
      publicationDate: p.publicationDate,
      type: 'unassessed',
      relation: 'Temporal Order Unassessed (Missing Date)',
      cpcClass: pCpc,
      x: xPos,
      y: 86,
      document: p
    });
  });

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const filteredNodes = nodes.filter(n => {
    if (filterMode === 'all') return true;
    if (filterMode === 'backward') return n.type === 'target' || n.type === 'backward';
    if (filterMode === 'forward') return n.type === 'target' || n.type === 'forward';
    if (filterMode === 'cpc') {
      if (n.type === 'target') return true;
      const nPrefix = n.cpcClass.slice(0, 4);
      return nPrefix && targetCpcPrefix && nPrefix.toUpperCase() === targetCpcPrefix.toUpperCase();
    }
    return true;
  });

  const getNodeColor = (type: DynamicCitationNode['type']) => {
    switch (type) {
      case 'target': return 'var(--accent-cyan)';
      case 'backward': return '#10B981'; // Emerald for eligible prior art
      case 'forward': return '#F59E0B'; // Amber for subsequent art
      case 'cpc_peer': return '#6366F1'; // Indigo for peers
      case 'unassessed': return '#94A3B8'; // Slate for unassessed
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: '6px' }}>
            <GitBranch size={12} /> Workspace Dates & Classifications
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Workspace Date & Classification Network
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            Visualizes stored publication dates and CPC classifications around {targetPatent.id}.
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          {(['all', 'backward', 'forward', 'cpc'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: filterMode === mode ? 'var(--bg-card-solid)' : 'transparent',
                color: filterMode === mode ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {mode === 'all' ? 'All Disclosures' : mode === 'backward' ? 'Earlier Publications' : mode === 'forward' ? 'Subsequent Filings' : 'Shared CPC Class'}
            </button>
          ))}
        </div>
      </div>

      {/* Provenance Notice */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <AlertCircle size={14} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
        <span>
          <strong>Source context:</strong> Lines compare stored publication dates and classifications. They do not represent citations or patent-family relationships. Source dates and legal eligibility require review; examiner citation ledgers are not imported here.
        </span>
      </div>

      {/* Main Interactive Network Graphic */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* SVG Node Network Container */}
        <div style={{
          position: 'relative',
          height: '420px',
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.06) 0%, rgba(11, 15, 25, 0.96) 100%)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Connecting SVG Lines */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {filteredNodes.filter(n => n.type !== 'target').map(n => {
              const color = getNodeColor(n.type);
              const isBackward = n.type === 'backward';
              return (
                <line
                  key={`line_${n.id}`}
                  x1={`${n.x}%`}
                  y1={`${n.y}%`}
                  x2="50%"
                  y2="50%"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray={isBackward ? 'none' : '4 4'}
                  opacity="0.6"
                />
              );
            })}
          </svg>

          {/* Render Nodes */}
          {filteredNodes.map(node => {
            const color = getNodeColor(node.type);
            const isSelected = selectedNodeId === node.id;
            const isTarget = node.type === 'target';

            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  if (onSelectPatent && !isTarget) {
                    onSelectPatent(node.document);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isSelected ? 20 : 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {/* Glow ring if selected */}
                <div style={{
                  width: isTarget ? '36px' : '26px',
                  height: isTarget ? '36px' : '26px',
                  borderRadius: '50%',
                  background: color,
                  border: '3px solid #0B0F19',
                  boxShadow: isSelected ? `0 0 20px ${color}` : `0 0 8px ${color}80`,
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B0F19'
                }}>
                  <GitCommit size={isTarget ? 20 : 14} />
                </div>

                {/* Node Pill Tag */}
                <div style={{
                  background: 'rgba(11, 15, 25, 0.92)',
                  border: `1px solid ${color}`,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: color,
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  {node.patentNumber}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Node Details Inspector Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <span className="badge" style={{ background: `${getNodeColor(selectedNode.type)}20`, color: getNodeColor(selectedNode.type), border: `1px solid ${getNodeColor(selectedNode.type)}40`, marginBottom: '6px' }}>
              {selectedNode.relation}
            </span>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 6px', lineHeight: '1.35' }}>
              {selectedNode.title}
            </h4>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              {selectedNode.patentNumber}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', background: 'var(--bg-card-solid)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <Building size={14} /> Assignee: <strong style={{ color: 'var(--text-main)' }}>{selectedNode.assignee}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <Calendar size={14} /> Filing Date: <strong style={{ color: 'var(--text-main)' }}>{selectedNode.filingDate || 'Not recorded'}</strong>
            </div>

            {selectedNode.publicationDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Calendar size={14} /> Pub/Grant Date: <strong style={{ color: 'var(--text-main)' }}>{selectedNode.publicationDate}</strong>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={14} /> Classification: <strong style={{ color: 'var(--accent-indigo)' }}>{selectedNode.cpcClass}</strong>
            </div>
          </div>

          {/* Temporal Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-card-solid)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Earlier Publications</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>{backwardList.length}</div>
            </div>

            <div style={{ background: 'var(--bg-card-solid)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Subsequent Art</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F59E0B' }}>{forwardList.length}</div>
            </div>
          </div>

          <button
            onClick={() => window.open(`https://patents.google.com/patent/${selectedNode.patentNumber.replace(/\s+/g, '')}/en`, '_blank')}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', width: '100%', marginTop: 'auto', justifyContent: 'center' }}
          >
            <ExternalLink size={14} /> Open Full Patent Record <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
