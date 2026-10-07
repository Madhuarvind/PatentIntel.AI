import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Shield, User, Award } from 'lucide-react';

interface Props {
  currentRole?: string;
}

interface FeatureRow {
  id: string;
  category: string;
  name: string;
  description: string;
  researcher: { status: 'YES' | 'NO' | 'ASSIGNED'; note: string };
  reviewer: { status: 'YES' | 'NO' | 'ASSIGNED'; note: string };
  admin: { status: 'YES' | 'NO' | 'ASSIGNED'; note: string };
  deliveryStatus: 'Added' | 'Added (Gated)' | 'Deferred / Disabled';
}

const MATRIX_DATA: FeatureRow[] = [
  {
    id: 'P1',
    category: 'Authoring',
    name: 'Proposal Authoring & Versioning',
    description: 'Create, edit, and save immutable version snapshots with technical text.',
    researcher: { status: 'YES', note: 'Full authoring on own projects' },
    reviewer: { status: 'YES', note: 'Own proposals' },
    admin: { status: 'YES', note: 'Own proposals & system audit' },
    deliveryStatus: 'Added'
  },
  {
    id: 'D1',
    category: 'Documents',
    name: 'Private Document Upload (TXT / PDF)',
    description: 'Attach documents (up to 20MB, 100 pages), extract text, append to draft.',
    researcher: { status: 'YES', note: 'Attached to own versions' },
    reviewer: { status: 'YES', note: 'Own versions' },
    admin: { status: 'YES', note: 'All versions' },
    deliveryStatus: 'Added'
  },
  {
    id: 'E1',
    category: 'Evidence',
    name: 'Discrete Feature Confirmation',
    description: 'Explicit statements confirmed by user for exact lexical comparison.',
    researcher: { status: 'YES', note: 'User-confirmed statements' },
    reviewer: { status: 'YES', note: 'User-confirmed statements' },
    admin: { status: 'YES', note: 'User-confirmed statements' },
    deliveryStatus: 'Added'
  },
  {
    id: 'E2-Search',
    category: 'Evidence',
    name: 'Literature & Crossref Evidence Search',
    description: 'Query imported project library and live academic Crossref DOI metadata.',
    researcher: { status: 'YES', note: 'Project scope' },
    reviewer: { status: 'YES', note: 'Assigned scope' },
    admin: { status: 'YES', note: 'Full workspace' },
    deliveryStatus: 'Added'
  },
  {
    id: 'E2-BM25',
    category: 'Evidence',
    name: 'Deterministic BM25 Evidence Ledger',
    description: 'Exact passage ranking and zero-match reporting without fabricated floors.',
    researcher: { status: 'YES', note: 'Executes on own draft' },
    reviewer: { status: 'YES', note: 'Inspects submitted run' },
    admin: { status: 'YES', note: 'Full inspection' },
    deliveryStatus: 'Added'
  },
  {
    id: 'R1-Submit',
    category: 'Review',
    name: 'Submit Proposal for Examination',
    description: 'Freeze active version snapshot and submit to assigned reviewer.',
    researcher: { status: 'YES', note: 'Own completed proposals' },
    reviewer: { status: 'YES', note: 'Own completed proposals' },
    admin: { status: 'YES', note: 'Own completed proposals' },
    deliveryStatus: 'Added'
  },
  {
    id: 'A2-Read',
    category: 'Access',
    name: 'Read Other Proposals',
    description: 'Access proposals and unsubmitted drafts owned by other colleagues.',
    researcher: { status: 'NO', note: 'Not Added (Strictly isolated to own proposals)' },
    reviewer: { status: 'ASSIGNED', note: 'Assigned submitted versions only' },
    admin: { status: 'YES', note: 'Full organizational read access' },
    deliveryStatus: 'Added (Gated)'
  },
  {
    id: 'R1-Comments',
    category: 'Review',
    name: 'Examination Comments & Feedback',
    description: 'Record version-bound review feedback linked to specific features.',
    researcher: { status: 'ASSIGNED', note: 'Author response only' },
    reviewer: { status: 'YES', note: 'Assigned submissions' },
    admin: { status: 'YES', note: 'When assigned' },
    deliveryStatus: 'Added (Gated)'
  },
  {
    id: 'R1-Decision',
    category: 'Governance',
    name: 'Issue Formal Review Decision',
    description: 'Issue formal decision (Approved for Drafting / Needs Revision / Rejected).',
    researcher: { status: 'NO', note: 'Not Added (Decision authority locked)' },
    reviewer: { status: 'YES', note: 'Assigned only (Anti-collision: never own work)' },
    admin: { status: 'YES', note: 'Assigned only (Anti-collision: never own work)' },
    deliveryStatus: 'Added (Gated)'
  },
  {
    id: 'A2-Assign',
    category: 'Governance',
    name: 'Assign Reviewers to Proposals',
    description: 'Designate qualified institutional reviewer for examination.',
    researcher: { status: 'NO', note: 'Not Added (Admin only)' },
    reviewer: { status: 'NO', note: 'Not Added (Admin only)' },
    admin: { status: 'YES', note: 'Full assignment authority' },
    deliveryStatus: 'Added (Gated)'
  },
  {
    id: 'A2-Invite',
    category: 'Governance',
    name: 'Team Invitations & Role Provisioning',
    description: 'Issue 24-hour invitation tokens bound to email for Reviewer / Researcher.',
    researcher: { status: 'NO', note: 'Not Added (Admin only)' },
    reviewer: { status: 'NO', note: 'Not Added (Admin only)' },
    admin: { status: 'YES', note: 'Can invite Reviewers & Researchers' },
    deliveryStatus: 'Added (Gated)'
  },
  {
    id: 'X1',
    category: 'Reports',
    name: 'Version Report Export (JSON & Print PDF)',
    description: 'Export immutable version snapshot with citations, findings, and limitations.',
    researcher: { status: 'YES', note: 'Own proposal versions' },
    reviewer: { status: 'YES', note: 'Assigned submitted versions' },
    admin: { status: 'YES', note: 'All versions' },
    deliveryStatus: 'Added'
  },
  {
    id: 'GEN-AI',
    category: 'Statutory',
    name: 'Generative AI Claims & Hallucinated Scores',
    description: 'Uncalibrated novelty percentages, synthetic claim text, black-box screening.',
    researcher: { status: 'NO', note: 'Not Added / Deferred (Zero hallucinations policy)' },
    reviewer: { status: 'NO', note: 'Not Added / Deferred (Zero hallucinations policy)' },
    admin: { status: 'NO', note: 'Not Added / Deferred (Zero hallucinations policy)' },
    deliveryStatus: 'Deferred / Disabled'
  }
];

export const RoleMatrixTable: React.FC<Props> = ({ currentRole }) => {
  const normRole = (currentRole || 'Researcher').toLowerCase();

  const renderBadge = (item: { status: 'YES' | 'NO' | 'ASSIGNED'; note: string }, isCurrentRole: boolean) => {
    if (item.status === 'YES') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: isCurrentRole ? 'rgba(34,104,88,0.22)' : 'rgba(34,104,88,0.12)',
            color: '#1b5e4a',
            fontWeight: 700,
            fontSize: '0.82rem',
            padding: '3px 8px',
            borderRadius: '6px',
            border: isCurrentRole ? '1px solid #3d8c72' : '1px solid rgba(34,104,88,0.25)'
          }}>
            <CheckCircle2 size={13} /> Added (Yes)
          </span>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
            {item.note}
          </small>
        </div>
      );
    }
    if (item.status === 'NO') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: isCurrentRole ? 'rgba(174,54,67,0.16)' : 'rgba(174,54,67,0.08)',
            color: '#9e2d39',
            fontWeight: 700,
            fontSize: '0.82rem',
            padding: '3px 8px',
            borderRadius: '6px',
            border: isCurrentRole ? '1px solid #d45b68' : '1px solid rgba(174,54,67,0.2)'
          }}>
            <XCircle size={13} /> Not Added (No)
          </span>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
            {item.note}
          </small>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: isCurrentRole ? 'rgba(145,94,16,0.18)' : 'rgba(145,94,16,0.10)',
          color: '#845308',
          fontWeight: 700,
          fontSize: '0.82rem',
          padding: '3px 8px',
          borderRadius: '6px',
          border: isCurrentRole ? '1px solid #b87c1c' : '1px solid rgba(145,94,16,0.25)'
        }}>
          <AlertCircle size={13} /> Conditional
        </span>
        <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginTop: '2px' }}>
          {item.note}
        </small>
      </div>
    );
  };

  return (
    <div className="panel" style={{ marginTop: '20px', padding: '24px' }}>
      <div className="section-heading" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Shield size={22} color="var(--navy)" />
            Role Permissions & Feature Matrix
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: '0.92rem' }}>
            Clear traceability of delivered features vs. restricted actions across user roles per institutional governance.
          </p>
        </div>
        {currentRole && (
          <div style={{
            background: 'var(--mint)',
            color: 'var(--navy)',
            padding: '6px 14px',
            borderRadius: '10px',
            fontWeight: 750,
            fontSize: '0.88rem',
            border: '1px solid #9fcbb3',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            Active Account Role: <strong>{currentRole}</strong>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px' }}>
          <thead>
            <tr style={{ background: '#f5f7f2', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 750, fontSize: '0.88rem', color: 'var(--text-main)', width: '28%' }}>
                Capability / Requirement
              </th>
              <th style={{
                padding: '14px 16px',
                fontWeight: 750,
                fontSize: '0.88rem',
                color: normRole === 'researcher' ? 'var(--navy)' : 'var(--text-main)',
                background: normRole === 'researcher' ? 'rgba(212,241,223,0.45)' : 'transparent',
                width: '24%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} /> Researcher {normRole === 'researcher' && <span style={{ color: 'var(--accent-cyan)' }}>(You)</span>}
                </div>
              </th>
              <th style={{
                padding: '14px 16px',
                fontWeight: 750,
                fontSize: '0.88rem',
                color: normRole === 'reviewer' ? 'var(--navy)' : 'var(--text-main)',
                background: normRole === 'reviewer' ? 'rgba(212,241,223,0.45)' : 'transparent',
                width: '24%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} /> Reviewer {normRole === 'reviewer' && <span style={{ color: 'var(--accent-cyan)' }}>(You)</span>}
                </div>
              </th>
              <th style={{
                padding: '14px 16px',
                fontWeight: 750,
                fontSize: '0.88rem',
                color: normRole === 'administrator' ? 'var(--navy)' : 'var(--text-main)',
                background: normRole === 'administrator' ? 'rgba(212,241,223,0.45)' : 'transparent',
                width: '24%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={15} /> Administrator {normRole === 'administrator' && <span style={{ color: 'var(--accent-cyan)' }}>(You)</span>}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {MATRIX_DATA.map((row, idx) => {
              const bg = idx % 2 === 0 ? '#ffffff' : '#fafbf8';
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', background: bg }}>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '0.74rem', background: '#e8ede6', color: '#445b53', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {row.id}
                      </span>
                      <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>{row.name}</strong>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {row.description}
                    </p>
                  </td>
                  <td style={{
                    padding: '14px 16px',
                    verticalAlign: 'top',
                    background: normRole === 'researcher' ? 'rgba(212,241,223,0.22)' : 'transparent'
                  }}>
                    {renderBadge(row.researcher, normRole === 'researcher')}
                  </td>
                  <td style={{
                    padding: '14px 16px',
                    verticalAlign: 'top',
                    background: normRole === 'reviewer' ? 'rgba(212,241,223,0.22)' : 'transparent'
                  }}>
                    {renderBadge(row.reviewer, normRole === 'reviewer')}
                  </td>
                  <td style={{
                    padding: '14px 16px',
                    verticalAlign: 'top',
                    background: normRole === 'administrator' ? 'rgba(212,241,223,0.22)' : 'transparent'
                  }}>
                    {renderBadge(row.admin, normRole === 'administrator')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f5f7f3', borderRadius: '10px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
        <strong>Institutional Anti-Collision Policy:</strong> Regardless of administrative rank, authors/inventors may never issue decisions or self-approve their own proposals. Every formal drafting approval requires an independent assigned reviewer.
      </div>
    </div>
  );
};
