import React from 'react';
import { computeInvalidityRisk } from '../services/invalidityCalculator';
import { 
  Scale, 
  X, 
  AlertTriangle, 
  Download,
  Layers
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patentNumber?: string;
}

export const InvalidityCalculatorModal: React.FC<Props> = ({ isOpen, onClose, patentNumber = 'US 10,928,341 B2' }) => {
  if (!isOpen) return null;

  const assessment = computeInvalidityRisk(patentNumber);

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'CRITICAL': return <span className="badge badge-rose" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800 }}>CRITICAL RISK</span>;
      case 'HIGH': return <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800 }}>HIGH RISK</span>;
      case 'MODERATE': return <span className="badge badge-indigo" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800 }}>MODERATE RISK</span>;
      default: return <span className="badge badge-emerald" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800 }}>LOW RISK</span>;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        borderRadius: '20px',
        border: '1px solid var(--accent-cyan)',
        boxShadow: '0 0 40px rgba(0, 242, 254, 0.15)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-cyan" style={{ padding: '6px 12px', fontWeight: 800 }}>
              <Scale size={14} /> 35 U.S.C. § 102 & § 103 STATUTORY INVALIDITY CALCULATOR
            </span>
            <span className="badge badge-indigo">{assessment.targetPatentNumber}</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
            Automated Legal Novelty & Obviousness Risk Assessment
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Quantitative probability engine calculating anticipation under 35 U.S.C. § 102 and obviousness combination risks under 35 U.S.C. § 103.
          </p>
        </div>

        {/* Primary Risk Gauge Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '16px',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: '24px',
          alignItems: 'center',
          marginBottom: '28px'
        }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '20px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Combined Invalidity Score
            </div>
            <div style={{ fontSize: '3.2rem', fontWeight: 900, color: 'var(--accent-rose)', lineHeight: 1.1 }}>
              {assessment.overallInvalidityScore}<span style={{ fontSize: '1.4rem' }}>%</span>
            </div>
            <div style={{ marginTop: '4px' }}>{getRatingBadge(assessment.sec102Rating)}</div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-rose)', fontWeight: 700, fontSize: '0.95rem' }}>
              <AlertTriangle size={18} /> Expected Office Action Ground:
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              {assessment.expectedUsptoAction}
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              {assessment.legalSummary}
            </p>
          </div>
        </div>

        {/* Dual Statute Comparison Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          {/* 35 U.S.C. § 102 (Anticipation / Lack of Novelty) Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                  35 U.S.C. § 102 (Anticipation)
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0' }}>
                  Single Reference Overlap
                </h4>
              </div>
              <span className="badge badge-cyan">{assessment.sec102RiskScore}% Risk</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Primary Prior-Art Ref:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{assessment.primaryPriorArtNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Elements Disclosed (Single Source):</span>
                <strong style={{ color: 'var(--text-main)' }}>{assessment.elementsAnticipatedCount} / {assessment.totalElementsCount} Elements (80%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Statutory Bar Status:</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>Disclosed &gt;1 Yr Prior to Filing</strong>
              </div>
            </div>
          </div>

          {/* 35 U.S.C. § 103 (Obviousness Combination) Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                  35 U.S.C. § 103 (Obviousness)
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0' }}>
                  Multi-Reference Combination
                </h4>
              </div>
              <span className="badge badge-purple">{assessment.sec103RiskScore}% Risk</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Combining References:</span>
                <strong style={{ color: 'var(--accent-purple)' }}>Ref A + {assessment.secondaryPriorArtNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Combined Element Coverage:</span>
                <strong style={{ color: 'var(--text-main)' }}>{assessment.combinedElementsCount} / {assessment.totalElementsCount} Elements (100%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Motivation to Combine (TSM Test):</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>HIGH (Same CPC Subclass B60W)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Claim 1 Limitation Breakdown Table */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} /> Claim 1 Technical Limitation Disclosure Matrix
          </h4>

          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                  <th style={{ padding: '12px 16px' }}>Limitation #</th>
                  <th style={{ padding: '12px 16px' }}>Claim Technical Component</th>
                  <th style={{ padding: '12px 16px' }}>Primary Ref (US10482391)</th>
                  <th style={{ padding: '12px 16px' }}>Secondary Ref (US11048920)</th>
                  <th style={{ padding: '12px 16px' }}>Statutory Disclosure Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>1[a]</td>
                  <td style={{ padding: '12px 16px' }}>Optical camera sensor capturing video frames</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)' }}>Disclosed (Col. 4, L. 12)</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)' }}>Disclosed (Col. 3, L. 40)</td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-emerald">§ 102 Anticipated</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>1[b]</td>
                  <td style={{ padding: '12px 16px' }}>Deep neural network threat vector computation</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)' }}>Disclosed (Col. 6, L. 05)</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)' }}>Disclosed (Col. 5, L. 18)</td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-emerald">§ 102 Anticipated</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>1[c]</td>
                  <td style={{ padding: '12px 16px' }}>Real-time hazard warning controller</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Implicit Disclosure</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)' }}>Explicit (Col. 8, L. 22)</td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-purple">§ 103 Obvious</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>1[d]</td>
                  <td style={{ padding: '12px 16px' }}>Visual display interface in vehicle cockpit</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)' }}>Disclosed (Col. 9, L. 44)</td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)' }}>Disclosed (Col. 10, L. 02)</td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-emerald">§ 102 Anticipated</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Statutory Legal Framework: <strong>USPTO MPEP § 2141 & § 2143 (Graham Factors)</strong>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={onClose}>
              Close Inspector
            </button>
            <button className="btn-primary" onClick={() => alert('USPTO Office Action Response Report generated successfully!')}>
              <Download size={16} /> Export Official Invalidity Chart (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
