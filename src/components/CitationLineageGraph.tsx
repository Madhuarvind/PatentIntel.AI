import React, { useState } from 'react';
import { 
  GitCommit, 
  GitBranch, 
  ArrowRight, 
  ExternalLink,
  Calendar,
  Building,
  CheckCircle2
} from 'lucide-react';

export interface CitationNode {
  id: string;
  patentNumber: string;
  title: string;
  assignee: string;
  priorityYear: number;
  type: 'target' | 'backward' | 'forward' | 'family';
  relation: string; // e.g. "Prior Art Citation", "Continuation-in-Part", "Forward Citation"
  cpcClass: string;
  x: number; // percentage X position
  y: number; // percentage Y position
  forwardCount: number;
  backwardCount: number;
}

export const CitationLineageGraph: React.FC = () => {
  const [filterMode, setFilterMode] = useState<'all' | 'family' | 'backward' | 'forward'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('target');

  const nodes: CitationNode[] = [
    // Backward Citations (Parent/Prior Art)
    {
      id: 'back_1',
      patentNumber: 'US 9,823,481 B1',
      title: 'Multi-Sensor Radar Navigation Apparatus',
      assignee: 'Lumina Sensing Labs',
      priorityYear: 2015,
      type: 'backward',
      relation: 'Backward Citation (Prior Art 102)',
      cpcClass: 'G01S 13/93',
      x: 18,
      y: 24,
      forwardCount: 14,
      backwardCount: 6
    },
    {
      id: 'back_2',
      patentNumber: 'US 10,129,482 B2',
      title: 'Optical Obstacle Sensing for Autonomous Transit',
      assignee: 'VisionTech Automotive',
      priorityYear: 2016,
      type: 'backward',
      relation: 'Backward Citation (Prior Art 103)',
      cpcClass: 'B60W 30/09',
      x: 18,
      y: 72,
      forwardCount: 22,
      backwardCount: 11
    },

    // Target Patent Core
    {
      id: 'target',
      patentNumber: 'US 10,928,341 B2',
      title: 'Smart Autonomous Vehicle Collision Warning Apparatus',
      assignee: 'Apex AI Mobility Systems Inc',
      priorityYear: 2018,
      type: 'target',
      relation: 'Target Patent Under Examination',
      cpcClass: 'B60W 30/09',
      x: 50,
      y: 48,
      forwardCount: 18,
      backwardCount: 12
    },

    // Patent Family Continuation
    {
      id: 'fam_1',
      patentNumber: 'US 11,492,019 B2',
      title: 'Dynamic Threat Vector Neural Network Warning Controller',
      assignee: 'Apex AI Mobility Systems Inc',
      priorityYear: 2021,
      type: 'family',
      relation: 'Child Continuation-in-Part (CIP)',
      cpcClass: 'G06N 3/08',
      x: 50,
      y: 84,
      forwardCount: 8,
      backwardCount: 4
    },

    // Forward Citations (Child/Subsequent filings)
    {
      id: 'fwd_1',
      patentNumber: 'US 11,849,201 B2',
      title: 'Deep Learning Vehicle Collision Avoidance System',
      assignee: 'Tesla Motors Inc',
      priorityYear: 2023,
      type: 'forward',
      relation: 'Forward Citation (Cited by Tesla)',
      cpcClass: 'B60W 30/09',
      x: 82,
      y: 28,
      forwardCount: 5,
      backwardCount: 19
    },
    {
      id: 'fwd_2',
      patentNumber: 'EP 3920192 A1',
      title: 'Autonomous Vehicle Obstacle Visual Display Apparatus',
      assignee: 'Waymo LLC (EPO Family)',
      priorityYear: 2022,
      type: 'forward',
      relation: 'Forward Citation (EPO International)',
      cpcClass: 'G08G 1/16',
      x: 82,
      y: 68,
      forwardCount: 9,
      backwardCount: 15
    }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[2];

  const filteredNodes = nodes.filter(n => {
    if (filterMode === 'all') return true;
    if (filterMode === 'family') return n.type === 'target' || n.type === 'family';
    if (filterMode === 'backward') return n.type === 'target' || n.type === 'backward';
    if (filterMode === 'forward') return n.type === 'target' || n.type === 'forward';
    return true;
  });

  const getNodeColor = (type: CitationNode['type']) => {
    switch (type) {
      case 'target': return 'var(--accent-cyan)';
      case 'backward': return '#F43F5E'; // Rose
      case 'forward': return '#10B981'; // Emerald
      case 'family': return '#6366F1'; // Indigo
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: '6px' }}>
            <GitBranch size={12} /> Patent Citation & Lineage Explorer
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Dynamic Patent Citation Network & Family Tree
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            Interactive node visualizer tracing backward prior-art citations, continuations-in-part, and forward technological lineage.
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          {(['all', 'family', 'backward', 'forward'] as const).map(mode => (
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
              {mode === 'all' ? 'All Lineage' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Network Graphic */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* SVG Node Network Container */}
        <div style={{
          position: 'relative',
          height: '420px',
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, rgba(11, 15, 25, 0.96) 100%)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Connecting SVG Lines */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {/* Backward to Target */}
            <path d="M 18% 24% Q 34% 36%, 50% 48%" fill="none" stroke="#F43F5E" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
            <path d="M 18% 72% Q 34% 60%, 50% 48%" fill="none" stroke="#F43F5E" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
            
            {/* Target to Family */}
            <path d="M 50% 48% L 50% 84%" fill="none" stroke="#6366F1" strokeWidth="3" opacity="0.8" />

            {/* Target to Forward */}
            <path d="M 50% 48% Q 66% 38%, 82% 28%" fill="none" stroke="#10B981" strokeWidth="2.5" opacity="0.7" />
            <path d="M 50% 48% Q 66% 58%, 82% 68%" fill="none" stroke="#10B981" strokeWidth="2.5" opacity="0.7" />
          </svg>

          {/* Render Nodes */}
          {filteredNodes.map(node => {
            const color = getNodeColor(node.type);
            const isSelected = selectedNodeId === node.id;
            const isTarget = node.type === 'target';

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
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
                  width: isTarget ? '32px' : '24px',
                  height: isTarget ? '32px' : '24px',
                  borderRadius: '50%',
                  background: color,
                  border: '3px solid #0B0F19',
                  boxShadow: isSelected ? `0 0 20px ${color}` : `0 0 10px ${color}80`,
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0B0F19'
                }}>
                  <GitCommit size={isTarget ? 18 : 14} />
                </div>

                {/* Node Pill Tag */}
                <div style={{
                  background: 'rgba(11, 15, 25, 0.9)',
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
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 6px', lineHeight: '1.35' }}>
              {selectedNode.title}
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              {selectedNode.patentNumber}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', background: 'var(--bg-card-solid)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <Building size={14} /> Assignee: <strong style={{ color: 'var(--text-main)' }}>{selectedNode.assignee}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <Calendar size={14} /> Priority Date: <strong style={{ color: 'var(--text-main)' }}>{selectedNode.priorityYear}-05-14</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={14} /> Classification: <strong style={{ color: 'var(--accent-indigo)' }}>{selectedNode.cpcClass}</strong>
            </div>
          </div>

          {/* Citation Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-card-solid)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Backward Citations</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)' }}>{selectedNode.backwardCount}</div>
            </div>

            <div style={{ background: 'var(--bg-card-solid)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Forward Citations</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{selectedNode.forwardCount}</div>
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
