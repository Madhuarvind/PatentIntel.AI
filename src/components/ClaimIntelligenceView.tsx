import React from 'react';
import type { ModuleView } from '../types';
import { 
  GitBranch, 
  ArrowRight
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
}

export const ClaimIntelligenceView: React.FC<Props> = ({ onNavigate }) => {
  const claimElements = [
    { id: 'E1', type: 'Component', term: 'Optical Camera Sensor', details: 'High-resolution visual sensor configured to capture video frames of external roadway environment.', scope: 'Hardware Input' },
    { id: 'E2', type: 'Component', term: 'Deep Neural Network Processor', details: 'Convolutional neural network model trained on object detection and collision threat metrics.', scope: 'AI Inference Engine' },
    { id: 'E3', type: 'Function', term: 'Real-Time Hazard Risk Computation', details: 'Evaluates distance, relative velocity, and trajectories of surrounding dynamic obstacles.', scope: 'Algorithmic Process' },
    { id: 'E4', type: 'Component', term: 'Collision Warning Controller', details: 'Logic controller coupled to processor to issue hazard alert signals when probability exceeds 0.85 threshold.', scope: 'Control Logic' },
    { id: 'E5', type: 'Constraint', term: 'In-Cockpit Visual Display Interface', details: 'Displays warning cues directly on dashboard screen inside cockpit.', scope: 'HMI Output' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Structural Claim Decomposition Engine
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            PatentMatch R&D baseline: Automatically parses claims into granular technical elements (Components, Functions, Constraints).
          </p>
        </div>

        <button className="btn-primary" onClick={() => onNavigate('mapping')}>
          <GitBranch size={16} /> Map to Target Patent Claims <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Split Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left: Original Claim Text */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge badge-cyan">Target Patent: US10928341B2</span>
            <span className="badge badge-indigo">Claim 1 (Independent)</span>
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
            Original Claim Specification
          </h3>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--text-main)' }}>
            "1. A smart autonomous vehicle collision warning apparatus comprising: <br/>
            <span style={{ color: 'var(--accent-cyan)', background: 'rgba(0,242,254,0.1)', padding: '2px 6px', borderRadius: '4px' }}>[E1] an optical camera sensor</span> configured to capture visual video frames of an external roadway environment; <br/>
            <span style={{ color: 'var(--accent-indigo)', background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: '4px' }}>[E2] a deep neural network processor</span> coupled to said optical camera sensor configured to <span style={{ color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>[E3] compute collision probability metrics</span>; <br/>
            <span style={{ color: 'var(--accent-purple)', background: 'rgba(139,92,246,0.1)', padding: '2px 6px', borderRadius: '4px' }}>[E4] a real-time warning controller</span> configured to generate a collision hazard alert signal when said computed collision probability exceeds a predefined threshold; and <br/>
            <span style={{ color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px' }}>[E5] a visual display interface</span> positioned within a vehicle cockpit to display said warning signal."
          </div>
        </div>

        {/* Right: Decomposed Technical Elements Tree */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Decomposed Technical Elements ({claimElements.length})
            </h3>
            <span className="badge badge-emerald">5/5 Elements Extracted</span>
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
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  background: 'var(--gradient-primary)',
                  color: '#0B0F19',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  lineHeight: 1
                }}>
                  {elem.id}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>{elem.term}</span>
                    <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{elem.type}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: '1.4' }}>
                    {elem.details}
                  </p>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    Scope: {elem.scope}
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
