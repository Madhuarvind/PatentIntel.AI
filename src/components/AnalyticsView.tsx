import React, { useEffect, useState } from 'react';
import { workspaceStore } from '../services/workspaceStore';

export const AnalyticsView: React.FC = () => {
  const [patents, setPatents] = useState(workspaceStore.getPatents());
  useEffect(() => workspaceStore.subscribe(() => setPatents(workspaceStore.getPatents())), []);
  const claims = patents.reduce((total, patent) => total + (patent.claims?.length ?? 0), 0);
  const withClaims = patents.filter(patent => patent.claims?.length).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1>Evaluation Benchmarks</h1>
        <p>Workspace inventory is available. Retrieval quality has not been measured against a labeled evaluation set.</p>
      </header>
      <div className="glass-panel" style={{ padding: 24 }}>
        <h2>Observed workspace inventory</h2>
        <p>{patents.length} patents · {claims} stored claims · {withClaims} patents with claim text</p>
        <p>These counts describe the stored records; they do not establish retrieval accuracy or source verification.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 }}>
        {['Precision @ 10', 'Recall @ 10', 'Mean Reciprocal Rank (MRR)', 'Claim Matching F1 Score'].map(label => (
          <div key={label} className="glass-panel" style={{ padding: 20 }}>
            <h3>{label}</h3><strong>Not measured</strong>
            <p>No labeled evaluation run is available.</p>
          </div>
        ))}
      </div>
      <div className="glass-panel" style={{ padding: 24 }}>
        <h2>Ablation studies and embedding projections</h2>
        <p>Not measured. No component comparison runs or computed embedding coordinates are available.</p>
        <p>A reproducible benchmark needs a versioned query set, relevance judgments, ranked results, model configuration, and a run timestamp. Component comparisons must use the same evaluation set.</p>
      </div>
    </div>
  );
};
