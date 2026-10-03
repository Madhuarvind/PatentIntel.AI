import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ModuleView, Patent, RealtimeAcademicPaper } from '../types';
import { getPatentSourceUrl } from '../services/usptoApi';
import { searchPriorArt } from '../services/priorArtSearch';
import { searchWorkspace } from '../services/workspaceSearch';
import { workspaceStore } from '../services/workspaceStore';
import { 
  Search, 
  Sparkles, 
  GitCompare, 
  ArrowRight,
  BookOpen,
  Globe,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenPaper?: (query?: string) => void;
  initialQuery?: string;
}

export const SearchEngineView: React.FC<Props> = ({ onNavigate, onOpenPaper, initialQuery }) => {
  const [searchTab, setSearchTab] = useState<'uspto-live' | 'workspace-hybrid'>('uspto-live');
  const [query, setQuery] = useState(initialQuery || 'autonomous vehicle collision warning camera neural network');
  const [livePatents, setLivePatents] = useState<Patent[]>([]);
  const [livePapers, setLivePapers] = useState<RealtimeAcademicPaper[]>([]);
  const [searchError, setSearchError] = useState('');
  const requestId = useRef(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Local workspace patents from store
  const [workspacePatents, setWorkspacePatents] = useState(workspaceStore.getPatents());

  const [includeSamples, setIncludeSamples] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setWorkspacePatents(workspaceStore.getPatents());
    });
    return unsubscribe;
  }, []);

  const handleRunUsptoSearch = useCallback(async (queryStr: string) => {
    const current = ++requestId.current;
    setIsLoading(true);
    setSearchError('');
    setSubmittedQuery(queryStr.trim());
    setLivePatents([]);
    setLivePapers([]);
    try {
      const results = await searchPriorArt(queryStr);
      if (current !== requestId.current) return;
      setLivePatents(results.patents);
      setLivePapers(results.papers);
      setSearchError(results.warnings?.join(' ') || '');
    } catch {
      if (current === requestId.current) setSearchError('Search could not be completed. Please try again.');
    } finally {
      if (current === requestId.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
      setSearchTab('uspto-live');
      void handleRunUsptoSearch(initialQuery);
    }
    return () => { requestId.current++; };
  }, [initialQuery, handleRunUsptoSearch]);

  const importPatent = (p: Patent) => {
    // A search summary must never overwrite a fuller existing specification.
    const existing = workspaceStore.findPatent(p.id);
    if (existing && !existing.isSample) { workspaceStore.setActivePatent(p.id); return; }
    workspaceStore.addPatent({
      id: p.id, title: p.title, assignee: p.assignee, inventors: p.inventors,
      cpcCodes: p.cpcClass ? [p.cpcClass] : [], filingDate: p.filingDate,
      publicationDate: p.publicationDate, issueDate: p.grantDate,
      priorityDate: p.priorityDate, abstract: p.abstract,
      claims: p.parsedClaims?.map(c => ({ number: c.claimNumber, text: c.text, type: c.type, elements: [] })) || [],
      displayNumber: p.patentNumber, rawSourceIdentifier: p.id, sourceIdentifier: p.id,
      source: p.source, sourceUrl: getPatentSourceUrl(p), importQuality: 'PARTIAL'
    });
    workspaceStore.setActivePatent(p.id);
  };

  const filteredWorkspaceResults = searchWorkspace(workspacePatents, query, includeSamples).map(({patent: p, score, matchedTerms, totalTerms}) => ({
    id: p.id, patentNumber: p.displayNumber || p.id, title: p.title,
    assignee: p.assignee || 'Unavailable', priorityDate: p.priorityDate || 'Unavailable',
    pubDate: p.publicationDate || 'Unavailable', cpc: p.cpcCodes?.join(', ') || p.cpc?.join(', ') || 'Unavailable',
    overallScore: score, matchedTerms, totalTerms, abstractSnippet: p.abstract,
    source: p.source || 'Unspecified', isSample: p.isSample
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Patent and academic prior-art search
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Search patent sources, local records, and academic literature. Review each result’s source before using it as evidence.
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
          <Globe size={18} /> Patent and academic search
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
          <Sparkles size={18} /> Workspace Text Search ({workspacePatents.length} Patents)
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
            placeholder={searchTab === 'uspto-live' ? "Type a patent number or technical terms to search external sources..." : "Type patent title, claims, or technical concept query..."}
            className="input-field"
            style={{ paddingLeft: '48px', paddingRight: '150px', fontSize: '1rem', height: '52px', borderRadius: '12px' }}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={searchTab === 'uspto-live' && isLoading}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', height: '36px', padding: '0 20px' }}
          >
            {searchTab === 'uspto-live' && isLoading ? <Loader2 size={16} className="spin-animation" /> : <Search size={16} />}
            {isLoading ? 'Querying API...' : (searchTab === 'uspto-live' ? 'Search sources' : 'Run Search')}
          </button>
        </form>

        {searchTab === 'workspace-hybrid' && (
          <div>
            <p>Exact query-term coverage across identifiers, titles, abstracts, claims, assignees and classifications. This is a lexical search, not an embedding model or legal assessment.</p>
            <label><input type="checkbox" checked={includeSamples} onChange={e => setIncludeSamples(e.target.checked)} /> Include labeled sample records</label>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          {searchTab === 'uspto-live' 
            ? `Search results (${livePatents.length} patents, ${livePapers.length} academic papers)` 
            : `Workspace Patent Candidates (${filteredWorkspaceResults.length})`}
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {searchTab === 'uspto-live' 
            ? 'Retrieved patent sources and academic providers; samples excluded'
            : `Retrieval pool: ${workspacePatents.length} workspace patents`}
        </span>
      </div>

      {searchError && <p role="alert">{searchError}</p>}
      {/* Results Rendering */}
      {searchTab === 'uspto-live' ? (
        isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--accent-cyan)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Searching patent and academic sources...</div>
          </div>
        ) : livePatents.length === 0 && livePapers.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 8px', fontSize: '1.1rem' }}>No results available</h3>
            <p style={{ margin: 0, fontSize: '0.88rem', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' }}>
              {submittedQuery ? `No results returned for "${submittedQuery}". See any source warnings above.` : 'Enter a publication number or keywords and select Search sources.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {livePapers.map(paper => (
              <article key={`${paper.source}:${paper.id}`} className="glass-panel" style={{ padding: '24px' }}>
                <span className="badge badge-indigo">Academic paper · {paper.source}</span>
                <h3>{paper.title}</h3>
                <p>{paper.authors.join(', ') || 'Authors unavailable'} · {paper.year || 'Year unavailable'} · {paper.venue || 'Venue unavailable'}</p>
                <p>{paper.abstract || 'Abstract unavailable'}</p>
                {paper.doi && <p>DOI: {paper.doi}</p>}
                {paper.url && /^https?:\/\//i.test(paper.url) && (
                  <a href={paper.url} target="_blank" rel="noopener noreferrer">View academic source</a>
                )}
              </article>
            ))}
            {livePatents.map((p) => (
              <div key={p.id} className="glass-panel glass-panel-hover" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="badge badge-cyan" style={{ fontWeight: 800 }}>{p.patentNumber}</span>
                      <span className="badge badge-indigo">{p.cpcClass || 'CPC unavailable'}</span>
                      <span className="badge badge-emerald">Publication: {p.publicationDate || 'Unavailable'}</span>
                      <span className="badge badge-purple">Claims retrieved: {p.claimsCount}</span>
                      {typeof p.similarityScore === 'number' && (
                        <span className="badge badge-cyan" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--accent-cyan)' }}>
                          Heuristic keyword score: {p.similarityScore} / 100
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 4px' }}>
                      {p.title}
                    </h3>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Assignee: <strong>{p.assignee || 'Unavailable'}</strong> • Priority Date: {p.priorityDate || 'Unavailable'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => {
                        importPatent(p);
                        onNavigate('workspace');
                      }}
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
                    <span>Source: <strong style={{ color: 'var(--accent-cyan)' }}>{p.source || 'Unspecified'}</strong></span>
                    <span>Inventors: <strong style={{ color: 'var(--text-main)' }}>{p.inventors.join(', ')}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => window.open(getPatentSourceUrl(p), '_blank')}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      <ExternalLink size={14} /> View source
                    </button>

                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        // Ensure record is in workspace before comparing
                        importPatent(p);
                        onNavigate('mapping');
                      }}
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
          {filteredWorkspaceResults.length === 0 && <p role="status">{query.trim() ? `No matching workspace records.${includeSamples ? '' : ' Sample records are excluded unless selected above.'}` : 'Enter search terms to find workspace records.'}</p>}
          {filteredWorkspaceResults.map((res) => (
            <div key={res.id} className="glass-panel glass-panel-hover" style={{ padding: '24px' }}>
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
                    Query-term coverage
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1.1 }}>
                    {res.overallScore}<span style={{ fontSize: '1rem' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    {res.matchedTerms.length} of {res.totalTerms} unique query terms
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                "{res.abstractSnippet}"
              </p>

              {/* Score Breakdown Bar & Action Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Matched terms: {res.matchedTerms.join(', ')}</span>
                  <span>{res.isSample ? 'Sample record (not verified)' : res.source}</span>
                </div>

                <button 
                  className="btn-secondary"
                  onClick={() => { workspaceStore.setActivePatent(res.id); onNavigate('mapping'); }}
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
