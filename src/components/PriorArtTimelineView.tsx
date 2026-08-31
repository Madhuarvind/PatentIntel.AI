import React, { useState, useEffect } from 'react';
import { CitationLineageGraph } from './CitationLineageGraph';
import { workspaceStore } from '../services/workspaceStore';
import type { PatentDocument } from '../types';
import { 
  CheckCircle2, 
  XCircle,
  BookOpen
} from 'lucide-react';

interface Props {
  onOpenPaper?: (query?: string) => void;
}

export const PriorArtTimelineView: React.FC<Props> = ({ onOpenPaper }) => {
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setWorkspacePatents(workspaceStore.getPatents());
    });
    return unsubscribe;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Prior-Art Chronology Timeline & Citation Lineage Engine
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Maps forward and backward citations, parent/child patent families, and priority date chronologies across {workspacePatents.length} active workspace patents.
          </p>
        </div>

        {onOpenPaper && (
          <button className="btn-secondary" onClick={() => onOpenPaper('prior art citation network graph attention')} style={{ fontSize: '0.82rem' }}>
            <BookOpen size={14} /> Search Citation Network Papers
          </button>
        )}
      </div>

      {/* Feature 5: Dynamic Citation Lineage & Patent Family Tree Graph Visualizer */}
      <CitationLineageGraph />

      {/* Chronological Timeline Bar */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px' }}>
          Workspace Prior-Art Lineage ({workspacePatents.length} Patents Registered)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(workspacePatents.length, 3)}, 1fr)`, gap: '20px', position: 'relative' }}>
          {workspacePatents.map((p, i) => (
            <div key={p.id} style={{
              background: i === 0 ? 'rgba(0, 242, 254, 0.08)' : 'var(--bg-surface)',
              border: '1px solid',
              borderColor: i === 0 ? 'var(--accent-cyan)' : 'var(--border-color)',
              padding: '18px',
              borderRadius: '12px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.85rem', fontWeight: 800 }}>{p.filingDate || '2021'}</span>
                <span className={i === 0 ? 'badge badge-emerald' : 'badge badge-indigo'}>{i === 0 ? 'Target Document' : 'Prior Disclosure'}</span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0' }}>{p.id}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{p.title}</p>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '8px' }}>Assignee: {p.assignee || 'Assigned to Record'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Novelty Evidence Coverage Matrix */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Claim Element Prior-Art Coverage Matrix
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Identifies which earlier disclosures contain evidence for individual technical elements.
            </p>
          </div>
          <span className="badge badge-purple">4/5 Elements Antedated</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
              <th style={{ padding: '12px 14px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>Target Claim Element</th>
              <th style={{ padding: '12px 14px' }}>US 10,482,391 (2017)</th>
              <th style={{ padding: '12px 14px' }}>US 11,048,920 (2019)</th>
              <th style={{ padding: '12px 14px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>Prior-Art Evidence Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600 }}>E1: Optical Camera Sensor</td>
              <td style={{ padding: '12px 14px', color: '#10B981' }}><CheckCircle2 size={18} /> Disclosed</td>
              <td style={{ padding: '12px 14px', color: '#10B981' }}><CheckCircle2 size={18} /> Disclosed</td>
              <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">Prior Art Exists</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600 }}>E2: Deep Neural Network Processor</td>
              <td style={{ padding: '12px 14px', color: '#10B981' }}><CheckCircle2 size={18} /> Disclosed</td>
              <td style={{ padding: '12px 14px', color: '#10B981' }}><CheckCircle2 size={18} /> Disclosed</td>
              <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">Prior Art Exists</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600 }}>E3: Real-Time Risk Computation</td>
              <td style={{ padding: '12px 14px', color: '#10B981' }}><CheckCircle2 size={18} /> Disclosed</td>
              <td style={{ padding: '12px 14px', color: '#F43F5E' }}><XCircle size={18} /> Not Present</td>
              <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">Prior Art Exists</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600 }}>E4: Collision Warning Controller</td>
              <td style={{ padding: '12px 14px', color: '#F43F5E' }}><XCircle size={18} /> Not Present</td>
              <td style={{ padding: '12px 14px', color: '#10B981' }}><CheckCircle2 size={18} /> Disclosed</td>
              <td style={{ padding: '12px 14px' }}><span className="badge badge-emerald">Prior Art Exists</span></td>
            </tr>
            <tr>
              <td style={{ padding: '12px 14px', fontWeight: 600 }}>E5: In-Cockpit Dashboard Display</td>
              <td style={{ padding: '12px 14px', color: '#F43F5E' }}><XCircle size={18} /> HUD Only</td>
              <td style={{ padding: '12px 14px', color: '#F43F5E' }}><XCircle size={18} /> Acoustic Only</td>
              <td style={{ padding: '12px 14px' }}><span className="badge badge-purple">Potential Novelty Point</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
