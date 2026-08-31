import React, { useState } from 'react';
import type { ModuleView } from '../types';
import { InvalidityCalculatorModal } from './InvalidityCalculatorModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Scale
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenPaper?: (query?: string) => void;
}

export const ClaimMappingView: React.FC<Props> = ({ onNavigate, onOpenPaper }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mappings = [
    {
      target: 'E1: Optical Camera Sensor',
      retrieved: 'Claim 1(a): Plurality of optical sensors positioned on bumper',
      score: 94,
      status: 'Semantic Match',
      type: 'exact',
      explanation: 'SBERT embeddings recognize camera sensor and optical sensor as functionally identical visual input elements.'
    },
    {
      target: 'E2: Deep Neural Network Processor',
      retrieved: 'Claim 1(b): Convolutional neural network threat processor',
      score: 92,
      status: 'High Match',
      type: 'exact',
      explanation: 'Both claims specify deep learning models for pattern recognition and hazard detection.'
    },
    {
      target: 'E3: Real-Time Risk Computation',
      retrieved: 'Claim 1(c): Dynamic threat vector trajectory calculator',
      score: 88,
      status: 'Functional Overlap',
      type: 'semantic',
      explanation: 'Risk computation and threat vector calculation share structural logic.'
    },
    {
      target: 'E4: Collision Warning Controller',
      retrieved: 'Claim 1(d): Emergency braking actuation unit',
      score: 82,
      status: 'Partial Overlap',
      type: 'partial',
      explanation: 'Target generates driver warnings; retrieved triggers automatic active braking.'
    },
    {
      target: 'E5: In-Cockpit Visual Display',
      retrieved: 'Claim 1(e): Windshield Heads-Up Display (HUD)',
      score: 76,
      status: 'Technical Difference',
      type: 'difference',
      explanation: 'Key structural distinction: Target uses dashboard cockpit display, whereas prior art uses windshield projection HUD.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Claim-to-Claim Element Mapping & Invalidity Risk Engine
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Multi-Sim SBERT Benchmark — Aligns claim elements side-by-side to compute 35 U.S.C. § 102 & § 103 invalidity probabilities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={() => setIsModalOpen(true)}
            style={{ border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.08)', fontWeight: 700 }}
          >
            <Scale size={16} /> 35 U.S.C. § 102 / § 103 Invalidity Risk Calculator
          </button>

          {onOpenPaper && (
            <button className="btn-secondary" onClick={() => onOpenPaper('patent claim plagiarism similarity SBERT')} style={{ fontSize: '0.84rem' }}>
              <BookOpen size={16} /> Search Plagiarism Papers
            </button>
          )}

          <button className="btn-primary" onClick={() => onNavigate('ai-evidence')}>
            <Sparkles size={16} /> Generate AI Evidence Explanation <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Comparison Overview Bar */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, paddingRight: '20px' }}>
          <div className="badge badge-cyan" style={{ marginBottom: '6px' }}>Target Application</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            US 10,928,341 B2 (Claim 1)
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Smart Autonomous Vehicle Collision Warning</div>
        </div>

        <div style={{ padding: '0 24px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
            Claim Similarity Score
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1.1 }}>
            88.4<span style={{ fontSize: '1.1rem' }}>%</span>
          </div>
          <span className="badge badge-emerald" style={{ marginTop: '4px' }}>4/5 Elements Matched</span>
        </div>

        <div style={{ flex: 1, paddingLeft: '20px' }}>
          <div className="badge badge-indigo" style={{ marginBottom: '6px' }}>Retrieved Prior Art</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            US 10,482,391 B1 (Claim 1)
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Camera-Based Sensor Network (Prior: 2017)</div>
        </div>
      </div>

      {/* Element Mapping Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
          Element-by-Element Structural Alignment
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mappings.map((m, i) => (
            <div key={i} style={{
              padding: '16px',
              borderRadius: '12px',
              background: m.type === 'difference' ? 'rgba(244, 63, 94, 0.05)' : 'var(--bg-surface)',
              border: '1px solid',
              borderColor: m.type === 'difference' ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-color)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 180px',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>Target Element</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{m.target}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>Prior-Art Element</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{m.retrieved}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                  {m.type === 'difference' ? (
                    <span className="badge" style={{ background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.3)' }}>
                      <AlertTriangle size={12} /> {m.status}
                    </span>
                  ) : (
                    <span className="badge badge-emerald">
                      <CheckCircle2 size={12} /> {m.status}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: m.type === 'difference' ? 'var(--accent-rose)' : 'var(--accent-cyan)', marginTop: '4px' }}>
                  {m.score}%
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', fontSize: '0.82rem', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                💡 <strong>NLP Explanation:</strong> {m.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Invalidity Calculator Modal */}
      <InvalidityCalculatorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        patentNumber="US 10,928,341 B2"
      />
    </div>
  );
};
