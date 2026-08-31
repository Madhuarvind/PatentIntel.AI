import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';

export interface EmbeddingNode {
  id: string;
  patentNumber: string;
  title: string;
  x: number; // 2D PCA / t-SNE X coordinate (-100 to 100)
  y: number; // 2D PCA / t-SNE Y coordinate (-100 to 100)
  sbertScore: number; // 0 to 100%
  cosineDistance: number; // 0.0 to 1.0
  claimOverlap: string;
  category: 'target' | 'high' | 'moderate' | 'distant';
  cpcClass: string;
}

interface Props {
  onSelectPatentForComparison?: (patentNumber: string) => void;
}

export const VectorClusterVisualizer: React.FC<Props> = ({ onSelectPatentForComparison }) => {
  const [hoveredNode, setHoveredNode] = useState<EmbeddingNode | null>(null);

  const nodes: EmbeddingNode[] = [
    {
      id: 'node_target',
      patentNumber: 'US 10,928,341 B2',
      title: 'Smart Autonomous Vehicle Collision Warning Apparatus (Target)',
      x: 0,
      y: 0,
      sbertScore: 100,
      cosineDistance: 0.00,
      claimOverlap: 'Target Reference',
      category: 'target',
      cpcClass: 'B60W 30/09'
    },
    {
      id: 'node_high_1',
      patentNumber: 'US 10,482,391 B1',
      title: 'Camera-Based Vehicle Sensor Network for Dynamic Hazard Recognition',
      x: 32,
      y: -24,
      sbertScore: 92,
      cosineDistance: 0.12,
      claimOverlap: '91% Match (4/5 Elements)',
      category: 'high',
      cpcClass: 'G08G 1/16'
    },
    {
      id: 'node_high_2',
      patentNumber: 'US 11,048,920 B2',
      title: 'Neural Network Object Detection Controller with Driver Alert Display',
      x: -45,
      y: 30,
      sbertScore: 88,
      cosineDistance: 0.18,
      claimOverlap: '86% Match (4/5 Elements)',
      category: 'high',
      cpcClass: 'G06N 3/08'
    },
    {
      id: 'node_mod_1',
      patentNumber: 'US 10,129,482 B2',
      title: 'Optical Sensing Apparatus for Obstacle Detection in Autonomous Transit',
      x: 68,
      y: 42,
      sbertScore: 84,
      cosineDistance: 0.24,
      claimOverlap: '82% Match (3/5 Elements)',
      category: 'moderate',
      cpcClass: 'B60W 30/09'
    },
    {
      id: 'node_mod_2',
      patentNumber: 'US 11,849,201 B2',
      title: 'Deep Learning Neural Network for Driver Monitoring & Fatigue Detection',
      x: -72,
      y: -50,
      sbertScore: 78,
      cosineDistance: 0.32,
      claimOverlap: '74% Match (3/5 Elements)',
      category: 'moderate',
      cpcClass: 'G06N 3/08'
    },
    {
      id: 'node_dist_1',
      patentNumber: 'US 9,823,481 B1',
      title: 'Multi-Radar Signal Processing Method for Marine Craft Navigation',
      x: 120,
      y: -95,
      sbertScore: 54,
      cosineDistance: 0.68,
      claimOverlap: '38% Match (1/5 Elements)',
      category: 'distant',
      cpcClass: 'G01S 13/93'
    },
    {
      id: 'node_dist_2',
      patentNumber: 'US 9,102,391 B2',
      title: 'Industrial Robotic Arm Actuator Control System',
      x: -130,
      y: 110,
      sbertScore: 42,
      cosineDistance: 0.81,
      claimOverlap: '22% Match (0/5 Elements)',
      category: 'distant',
      cpcClass: 'B25J 9/16'
    }
  ];

  const getNodeColor = (cat: EmbeddingNode['category']) => {
    switch (cat) {
      case 'target': return 'var(--accent-cyan)';
      case 'high': return '#10B981'; // Emerald
      case 'moderate': return '#6366F1'; // Indigo
      case 'distant': return '#F43F5E'; // Rose
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Visualizer Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: '6px' }}>
            <Sparkles size={12} /> 2D Vector Embedding Map (t-SNE / PCA Projection)
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            SBERT Multi-Vector Similarity Cluster Visualizer
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
            Projects 768-dimensional sentence transformer claim vectors onto a 2D Euclidean coordinate space. Closeness to center indicates semantic prior-art infringement proximity.
          </p>
        </div>

        {/* Legend Pills */}
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }} />
            Target Patent
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            High Match (&gt;85%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366F1' }} />
            Moderate (70-85%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F43F5E' }} />
            Distant (&lt;70%)
          </span>
        </div>
      </div>

      {/* Interactive Graph Box */}
      <div style={{
        position: 'relative',
        height: '380px',
        background: 'radial-gradient(circle at center, rgba(0, 242, 254, 0.05) 0%, rgba(11, 15, 25, 0.95) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Background Concentric Distance Circles */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <circle cx="50%" cy="50%" r="60" fill="none" stroke="rgba(0, 242, 254, 0.15)" strokeDasharray="4 4" />
          <circle cx="50%" cy="50%" r="120" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeDasharray="4 4" />
          <circle cx="50%" cy="50%" r="170" fill="none" stroke="rgba(244, 63, 94, 0.1)" strokeDasharray="4 4" />
          {/* Axis lines */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255, 255, 255, 0.05)" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255, 255, 255, 0.05)" />
        </svg>

        {/* Render Vector Nodes */}
        {nodes.map((node) => {
          const color = getNodeColor(node.category);
          const isTarget = node.category === 'target';
          const leftPercent = 50 + (node.x / 300) * 100;
          const topPercent = 50 + (node.y / 300) * 100;

          return (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectPatentForComparison && onSelectPatentForComparison(node.patentNumber)}
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: hoveredNode?.id === node.id ? 20 : (isTarget ? 10 : 5)
              }}
            >
              {/* Glow Pulse for Target */}
              {isTarget && (
                <div style={{
                  position: 'absolute',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0, 242, 254, 0.25)',
                  animation: 'pulse 2s infinite',
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%'
                }} />
              )}

              {/* Node Circle */}
              <div style={{
                width: isTarget ? '22px' : '16px',
                height: isTarget ? '22px' : '16px',
                borderRadius: '50%',
                background: color,
                border: '2px solid #0B0F19',
                boxShadow: `0 0 12px ${color}`,
                transition: 'transform 0.2s ease',
                transform: hoveredNode?.id === node.id ? 'scale(1.4)' : 'scale(1)'
              }} />

              {/* Label Badge */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: color,
                background: 'rgba(11, 15, 25, 0.85)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: `1px solid ${color}40`,
                backdropFilter: 'blur(4px)'
              }}>
                {node.patentNumber}
              </div>
            </div>
          );
        })}

        {/* Hover Tooltip Overlay Card */}
        {hoveredNode && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            width: '340px',
            background: 'var(--bg-card-solid)',
            border: `1px solid ${getNodeColor(hoveredNode.category)}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: 'var(--shadow-glow)',
            zIndex: 30,
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="badge badge-cyan" style={{ fontWeight: 800 }}>{hoveredNode.patentNumber}</span>
              <span className="badge badge-indigo">{hoveredNode.cpcClass}</span>
            </div>

            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px', lineHeight: '1.3' }}>
              {hoveredNode.title}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>SBERT Dense Match</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: getNodeColor(hoveredNode.category) }}>
                  {hoveredNode.sbertScore}%
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-dim)' }}>Cosine Vector Dist</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {hoveredNode.cosineDistance}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '8px', fontSize: '0.76rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Claim Alignment: <strong>{hoveredNode.claimOverlap}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Vector Distance Metric Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.8rem' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-dim)' }}>Embedding Model:</span>
          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>SBERT multi-qa-mpnet-base-v2</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-dim)' }}>Dimensionality Reduction:</span>
          <div style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>t-SNE (Perplexity: 30)</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-dim)' }}>Cluster Distance Metric:</span>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Cosine Similarity</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-dim)' }}>Top Candidate Distance:</span>
          <div style={{ fontWeight: 700, color: '#10B981' }}>0.12 (High Infringement)</div>
        </div>
      </div>
    </div>
  );
};
