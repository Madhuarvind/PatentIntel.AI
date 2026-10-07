import React from 'react';
import { getStoredSettings } from '../services/llmService';
import { RoleMatrixTable } from './RoleMatrixTable';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  user?: { name: string; email: string; role: string };
}

export const SettingsView: React.FC<Props> = ({ user }) => {
  getStoredSettings();
  const role = user?.role || 'Researcher';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PLATFORM GOVERNANCE & ACCESS</p>
          <h1>Platform Settings & Governance</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
            Current session parameters, statutory integrity controls, and institutional role access rules.
          </p>
        </div>
        {user && (
          <span className="badge" style={{ fontSize: '13px', padding: '6px 14px' }}>
            Signed In: <strong>{user.name}</strong> ({role})
          </span>
        )}
      </div>

      <div className="panel" style={{ marginTop: 0 }}>
        <div className="section-heading" style={{ marginTop: 0 }}>
          <h2>Data Integrity & Statutory Safeguards</h2>
        </div>
        <div style={{ padding: '16px 20px', background: '#f5f7f2', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '14px 0 20px' }}>
          <p role="status" style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.6 }}>
            Generative AI and uncalibrated legal probability models are disabled by policy. Custom endpoint fields and browser secret storage have been removed to protect private research disclosures.
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            The enterprise review pilot functions deterministically without paid LLM APIs. Legacy research modules utilize exact lexical token analysis; black-box hallucinations are strictly prohibited.
          </p>
        </div>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>Research integrations</h3>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '14px', color: 'var(--text-muted)' }}>
            Similarity candidate threshold <input type="range" disabled aria-label="Unavailable similarity threshold" style={{ verticalAlign: 'middle', marginLeft: 8 }} />
          </label>
          <p style={{ margin: '4px 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>Not connected to retrieval. This setting currently has no effect.</p>
          <p style={{ margin: '4px 0 12px', fontSize: '13.5px', color: 'var(--text-muted)' }}>No vector index backend is connected.</p>
          {['Reasoning model', 'Multimodal vision', 'Generative evidence synthesis'].map(name => (
            <p key={name} style={{ margin: '4px 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              <label><input type="checkbox" disabled /> {name} — unavailable</label>
            </p>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <a
            href="#/pilot/settings"
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14.5px',
              padding: '11px 18px'
            }}
          >
            Open Account Profile & Team Invitations in Enterprise Review Pilot <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      <RoleMatrixTable currentRole={role} />
    </div>
  );
};