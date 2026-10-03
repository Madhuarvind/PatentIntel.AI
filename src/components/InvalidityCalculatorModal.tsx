import React from 'react';
import { computeInvalidityRisk, type AssessedClaimElement } from '../services/invalidityCalculator';
import { Scale, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patentNumber?: string;
  claimElements?: AssessedClaimElement[];
}

export const InvalidityCalculatorModal: React.FC<Props> = ({ isOpen, onClose, patentNumber, claimElements }) => {
  if (!isOpen) return null;
  const assessment = computeInvalidityRisk(patentNumber, claimElements);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="invalidity-title" className="glass-panel"
        style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <h2 id="invalidity-title"><Scale size={20} /> Patent invalidity assessment</h2>
          <button onClick={onClose} className="btn-secondary" aria-label="Close invalidity assessment"><X size={18} /></button>
        </div>
        <p>{assessment.targetPatentNumber || 'No patent selected'}</p>
        <h3>Legal risk: Not assessed</h3>
        <p>{assessment.legalSummary}</p>
        {assessment.status === 'COVERAGE_ONLY' && (
          <dl>
            <dt>Exact element coverage</dt>
            <dd>{assessment.exactMatchesCount} / {assessment.totalElementsCount} ({assessment.exactCoveragePercent}%)</dd>
            <dt>Exact or partial element coverage</dt>
            <dd>{assessment.exactMatchesCount + assessment.partialMatchesCount} / {assessment.totalElementsCount} ({assessment.combinedCoveragePercent}%)</dd>
          </dl>
        )}
        <p style={{ color: 'var(--text-muted)' }}>
          Research assistance only. No verified reference mapping is connected to this assessment.
          These results do not establish prior-art eligibility, anticipation, obviousness, or an expected USPTO decision.
        </p>
        <button className="btn-primary" onClick={onClose}>Return to research</button>
      </div>
    </div>
  );
};
