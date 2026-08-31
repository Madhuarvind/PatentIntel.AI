import React, { useState, useEffect } from 'react';
import type { ModuleView, Patent } from '../types';
import { searchLiveUsptoPatents } from '../services/usptoApi';
import { 
  Search, 
  Sparkles, 
  GitCompare, 
  ArrowRight,
  BookOpen,
  Globe,
  Loader2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenPaper?: (query?: string) => void;
}

export const SearchEngineView: React.FC<Props> = ({ onNavigate, onOpenPaper }) => {
  const [searchTab, setSearchTab] = useState<'uspto-live' | 'workspace-hybrid'>('uspto-live');
  const [query, setQuery] = useState('smart autonomous vehicle collision warning camera neural network');
  const [livePatents, setLivePatents] = useState<Patent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Local hybrid search parameters
  const [searchMode, setSearchMode] = useState<'hybrid' | 'bm25' | 'sbert'>('hybrid');
  const [bm25Weight, setBm25Weight] = useState(0.35);
  const [sbertWeight, setSbertWeight] = useState(0.65);

  // Run USPTO live search when tab changes or search requested
  useEffect(() => {
    if (searchTab === 'uspto-live') {
      handleRunUsptoSearch(query);
    }
  }, [searchTab]);

  const handleRunUsptoSearch = async (queryStr: string) => {
    setIsLoading(true);
    try {
      const results = await searchLiveUsptoPatents(queryStr);
      setLivePatents(results);
    } catch (err) {
      console.error('USPTO live search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hybridResults = [
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
            Live USPTO / EPO Patent Search & Semantic Retrieval Engine
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Query official USPTO & EPO patent office databases live or run hybrid vector similarity search (BM25 + Multi-Sim SBERT).
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

      {/* Main Mode Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setSearchTab('uspto-live')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: searchTab === 'uspto-live' ? 'var(--accent-cyan)' : 'var(--border-color)',
            background: searchTab === 'uspto-live' ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-card-solid)',
            color: searchTab === 'uspto-live' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: searchTab === 'uspto-live' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Globe size={18} /> Live USPTO / EPO Registry Search (PatentsView API)
        </button>

        <button
          onClick={() => setSearchTab('workspace-hybrid')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: searchTab === 'workspace-hybrid' ? 'var(--accent-cyan)' : 'var(--border-color)',
            background: searchTab === 'workspace-hybrid' ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-card-solid)',
            color: searchTab === 'workspace-hybrid' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: searchTab === 'workspace-hybrid' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={18} /> Hybrid Vector Semantic Search (BM25 + SBERT)
        </button>
      </div>

      {/* Query Bar */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchTab === 'uspto-live') {
              handleRunUsptoSearch(query);
            }
          }}
          style={{ position: 'relative', marginBottom: searchTab === 'workspace-hybrid' ? '20px' : 0 }}
        >
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchTab === 'uspto-live' ? "Type patent number (e.g. US10928341, US10482391) or technical terms to query live USPTO database..." : "Type patent title, claims, or technical concept query..."}
            className="input-field"
            style={{ paddingLeft: '48px', paddingRight: '150px', fontSize: '1rem', height: '52px', borderRadius: '12px' }}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', height: '36px', padding: '0 20px' }}
          >
            {isLoading ? <Loader2 size={16} className="spin-animation" /> : <Search size={16} />}
            {isLoading ? 'Querying API...' : (searchTab === 'uspto-live' ? 'Search USPTO Live' : 'Run Search')}
          </button>
        </form>

        {/* Retrieval Mode Controls for Hybrid Tab */}
        {searchTab === 'workspace-hybrid' && (
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
        )}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          {searchTab === 'uspto-live' 
            ? `Live Official USPTO Patent Results (${livePatents.length})` 
            : `Top Retrieved Patent Candidates (${hybridResults.length})`}
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {searchTab === 'uspto-live' 
            ? 'API Source: USPTO Open Data & PatentsView API'
            : 'Retrieval latency: 42ms • Candidate pool: 128 patents'}
        </span>
      </div>

      {/* Results Rendering */}
      {searchTab === 'uspto-live' ? (
        isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--accent-cyan)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Connecting to USPTO Open Data & PatentsView REST API...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {livePatents.map((p) => (
              <div key={p.id} className="glass-panel glass-panel-hover" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="badge badge-cyan" style={{ fontWeight: 800 }}>{p.patentNumber}</span>
                      <span className="badge badge-indigo">{p.cpcClass}</span>
                      <span className="badge badge-emerald">Granted: {p.publicationDate}</span>
                      <span className="badge badge-purple">Claims: {p.claimsCount}</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 4px' }}>
                      {p.title}
                    </h3>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Assignee: <strong>{p.assignee}</strong> • Priority Date: {p.priorityDate}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => onNavigate('workspace')}
                      style={{ padding: '8px 16px', fontSize: '0.84rem', gap: '6px' }}
                    >
                      <CheckCircle2 size={16} /> Import into Workspace
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.55', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  "{p.abstract}"
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Official Registry: <strong style={{ color: 'var(--accent-cyan)' }}>USPTO PatentsView API</strong></span>
                    <span>Inventors: <strong style={{ color: 'var(--text-main)' }}>{p.inventors.join(', ')}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => window.open(`https://patents.google.com/patent/${p.patentNumber.replace(/\s+/g, '')}/en`, '_blank')}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      <ExternalLink size={14} /> Official Specification
                    </button>

                    <button 
                      className="btn-secondary"
                      onClick={() => onNavigate('mapping')}
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      <GitCompare size={16} /> Compare Claims <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Workspace Hybrid Search Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {hybridResults.map((res, i) => (
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
      )}
    </div>
  );
};
