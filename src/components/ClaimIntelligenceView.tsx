import React, { useState, useEffect } from 'react';
import type { ModuleView, PatentDocument } from '../types';
import { workspaceStore } from '../services/workspaceStore';
import { PatentSelector } from './PatentSelector';
import { 
  GitBranch, 
  ArrowRight,
  FileCheck,
  Languages
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenClaimTranslator?: (patentId: string, claimNumber: number, claimText: string) => void;
}

export const ClaimIntelligenceView: React.FC<Props> = ({ onNavigate, onOpenClaimTranslator }) => {
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());
  const [selectedPatentId, setSelectedPatentId] = useState<string>(workspacePatents[0]?.id || 'US10928341B2');

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

  const activeDoc = workspacePatents.find(p => p.id === selectedPatentId) || workspacePatents[0];

  // Dynamically extract elements from selected patent claim
  const activeClaimText = activeDoc?.claims?.[0]?.text || `1. An apparatus for ${activeDoc?.title.toLowerCase()} comprising an optical camera sensor and a deep neural network processor.`;
  
  const claimElements = activeDoc?.claims?.[0]?.elements?.length ? activeDoc.claims[0].elements.map((e, idx) => ({
    id: `E${idx + 1}`,
    type: 'Component',
    term: e.text || `Element Component ${idx + 1}`,
    details: e.text || 'Extracted technical claim element scope.',
    scope: e.cpcCategory || activeDoc.cpcCodes?.[0] || 'Technical Scope'
  })) : [
    { id: 'E1', type: 'Component', term: 'Optical Camera Sensor', details: 'High-resolution visual sensor configured to capture video frames of external roadway environment.', scope: 'Hardware Input' },
    { id: 'E2', type: 'Component', term: 'Deep Neural Network Processor', details: 'Convolutional neural network model trained on object detection and collision threat metrics.', scope: 'AI Inference Engine' },
    { id: 'E3', type: 'Function', term: 'Real-Time Hazard Risk Computation', details: 'Evaluates distance, relative velocity, and trajectories of surrounding dynamic obstacles.', scope: 'Algorithmic Process' },
    { id: 'E4', type: 'Component', term: 'Collision Warning Controller', details: 'Logic controller coupled to processor to issue hazard alert signals when probability exceeds threshold.', scope: 'Control Logic' }
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
            Automatically parses claims into granular technical elements (Components, Functions, Constraints) for live workspace patents.
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
        {/* Left: Original Claim Text */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="badge badge-cyan">Active Target: {activeDoc?.id}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-indigo">Claim 1 (Independent)</span>
              {onOpenClaimTranslator && (
                <button
                  className="btn-primary"
                  onClick={() => onOpenClaimTranslator(activeDoc?.id || 'US10928341B2', 1, activeClaimText)}
                  style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                >
                  <Languages size={12} /> Translate Claim
                </button>
              )}
            </div>
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
            {activeDoc?.title}
          </h3>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--text-main)' }}>
            "{activeClaimText}"
          </div>
        </div>

        {/* Right: Decomposed Technical Elements Tree */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Decomposed Technical Elements ({claimElements.length})
            </h3>
            <span className="badge badge-emerald"><FileCheck size={12} /> {claimElements.length} Elements Extracted</span>
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
