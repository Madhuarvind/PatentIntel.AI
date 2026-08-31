import React, { useState } from 'react';
import type { ModuleView } from '../types';
import { 
  Search, 
  Sparkles, 
  GitCompare, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenPaper?: (query?: string) => void;
}

export const SearchEngineView: React.FC<Props> = ({ onNavigate, onOpenPaper }) => {
  const [query, setQuery] = useState('smart autonomous vehicle collision warning apparatus camera neural network');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'bm25' | 'sbert'>('hybrid');
  const [bm25Weight, setBm25Weight] = useState(0.35);
  const [sbertWeight, setSbertWeight] = useState(0.65);

  const results = [
    {
      patentNumber: 'US 10,482,391 B1',
      title: 'Camera-Based Vehicle Sensor Network for Dynamic Hazard Recognition',
      assignee: 'VisionTech Automotive Corp',
      priorityDate: '2017-04-10',
      pubDate: '2019-11-19',
      cpc: 'G08G 1/16',
      overallScore: 92,
      bm25Score: 84,
      sbertScore: 96,
      claimMatch: '91%',
      abstractSnippet: 'A vehicle safety system utilizing a plurality of optical sensors to capture surrounding environmental frames and compute dynamic threat vectors via convolutional neural networks.'
    },
    {
      patentNumber: 'US 11,048,920 B2',
      title: 'Neural Network Object Detection Controller with Driver Alert Display',
      assignee: 'OmniDrive Intelligence Ltd',
      priorityDate: '2019-01-22',
      pubDate: '2021-06-29',
      cpc: 'G06N 3/08',
      overallScore: 88,
      bm25Score: 89,
      sbertScore: 87,
      claimMatch: '86%',
      abstractSnippet: 'A driver assistance apparatus equipped with deep learning neural vision algorithms for identifying pedestrians and generating acoustic/visual warning signals.'
    },
    {
      patentNumber: 'US 10,129,482 B2',
      title: 'Optical Sensing Apparatus for Obstacle Detection in Autonomous Transit',
      assignee: 'Lumina Sensing Labs',
      priorityDate: '2016-08-05',
      pubDate: '2018-11-13',
      cpc: 'B60W 30/09',
      overallScore: 84,
      bm25Score: 72,
      sbertScore: 91,
      claimMatch: '82%',
      abstractSnippet: 'An optical sensing apparatus utilizing multi-spectral camera elements to calculate obstacle trajectories and issue collision mitigation signals.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Hybrid Semantic Retrieval Engine (BM25 + Multi-Sim SBERT)
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Real-time hybrid retrieval — Bridges terminology gaps between exact keywords and dense vector semantics.
          </p>
        </div>

        {onOpenPaper && (
          <button 
            className="btn-secondary" 
            onClick={() => onOpenPaper(query)} 
            style={{ fontSize: '0.82rem' }}
          >
            <BookOpen size={14} /> Fetch Live Academic Papers for Query
          </button>
        )}
      </div>

      {/* Query Bar & Controls */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type patent title, claims, or technical concept query..."
            className="input-field"
            style={{ paddingLeft: '48px', paddingRight: '120px', fontSize: '1rem', height: '52px', borderRadius: '12px' }}
          />
          <button className="btn-primary" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', height: '36px', padding: '0 16px' }}>
            Run Search
          </button>
        </div>

        {/* Retrieval Mode Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setSearchMode('hybrid')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: searchMode === 'hybrid' ? 'var(--gradient-primary)' : 'transparent',
                color: searchMode === 'hybrid' ? '#0B0F19' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} /> Hybrid (BM25 + SBERT)
            </button>
            <button
              onClick={() => setSearchMode('bm25')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: searchMode === 'bm25' ? 'var(--bg-card-solid)' : 'transparent',
                color: searchMode === 'bm25' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Lexical BM25 Only
            </button>
            <button
              onClick={() => setSearchMode('sbert')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: searchMode === 'sbert' ? 'var(--bg-card-solid)' : 'transparent',
                color: searchMode === 'sbert' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Vector SBERT Only
            </button>
          </div>

          {/* Weight Sliders */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>BM25 Weight: <strong>{bm25Weight}</strong></span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={bm25Weight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setBm25Weight(val);
                  setSbertWeight(parseFloat((1 - val).toFixed(2)));
                }}
                style={{ width: '90px', accentColor: 'var(--accent-cyan)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>SBERT Weight: <strong>{sbertWeight}</strong></span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={sbertWeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSbertWeight(val);
                  setBm25Weight(parseFloat((1 - val).toFixed(2)));
                }}
                style={{ width: '90px', accentColor: 'var(--accent-indigo)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Top Retrieved Patent Candidates ({results.length})
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Retrieval latency: <strong>42ms</strong> • Candidate pool: 128 patents
        </span>
      </div>

      {/* Results Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {results.map((res, i) => (
          <div key={i} className="glass-panel glass-panel-hover" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-cyan" style={{ fontWeight: 700 }}>{res.patentNumber}</span>
                  <span className="badge badge-indigo">{res.cpc}</span>
                  <span className="badge badge-emerald">Priority: {res.priorityDate}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 4px' }}>
                  {res.title}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Assignee: <strong>{res.assignee}</strong> • Published: {res.pubDate}
                </div>
              </div>

              {/* Similarity Score Pillar */}
              <div style={{ textAlign: 'right', background: 'var(--bg-surface)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Hybrid Similarity
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1.1 }}>
                  {res.overallScore}<span style={{ fontSize: '1rem' }}>/100</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                  Claim Match: {res.claimMatch}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
              "{res.abstractSnippet}"
            </p>

            {/* Score Breakdown Bar & Action Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>BM25 Score: <strong style={{ color: 'var(--text-main)' }}>{res.bm25Score}%</strong></span>
                <span>SBERT Dense Score: <strong style={{ color: 'var(--accent-cyan)' }}>{res.sbertScore}%</strong></span>
                <span>Terminology Gap: <strong style={{ color: 'var(--accent-emerald)' }}>Bridged (camera ↔ optical sensor)</strong></span>
              </div>

              <button 
                className="btn-secondary"
                onClick={() => onNavigate('mapping')}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
              >
                <GitCompare size={16} /> Compare Claims Side-by-Side <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
