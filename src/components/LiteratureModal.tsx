import React, { useState, useEffect } from 'react';
import type { RealtimeAcademicPaper, ModuleView } from '../types';
import { searchRealtimeAcademicPapers } from '../services/academicApi';
import { DEFAULT_SEARCH_TOPICS } from '../data/literaturePapers';
import { 
  X, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  FileCode,
  Globe,
  Loader2,
  BookOpen
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onNavigateModule?: (module: ModuleView) => void;
}

export const LiteratureModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  initialQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery || 'patent claim similarity deep learning SBERT');
  const [papers, setPapers] = useState<RealtimeAcademicPaper[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedBibtexId, setCopiedBibtexId] = useState<string | null>(null);
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  // Trigger live search when modal opens or query changes
  useEffect(() => {
    if (isOpen) {
      handleRunSearch(searchQuery);
    }
  }, [isOpen]);

  const handleRunSearch = async (queryToSearch: string) => {
    setIsLoading(true);
    try {
      const results = await searchRealtimeAcademicPapers(queryToSearch);
      setPapers(results);
      if (results.length > 0) {
        setExpandedPaperId(results[0].id); // Auto-expand top paper
      }
    } catch (err) {
      console.error('Real-time paper retrieval error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyAllBibtex = () => {
    let allBib = "% REAL-TIME ACADEMIC PRIOR-ART REFERENCES\n\n";
    papers.forEach(p => {
      allBib += p.bibtex + "\n\n";
    });
    navigator.clipboard.writeText(allBib);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopySingleBibtex = (paperId: string, bibtex: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bibtex);
    setCopiedBibtexId(paperId);
    setTimeout(() => setCopiedBibtexId(null), 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      background: 'rgba(11, 15, 25, 0.88)',
      backdropFilter: 'blur(14px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1240px',
        maxHeight: '92vh',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-glow)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        background: 'var(--bg-card-solid)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan"><Globe size={12} /> Real-Time Live Academic Retrieval API</span>
              <span className="badge badge-emerald">Semantic Scholar & OpenAlex Graph APIs</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Live Prior-Art Literature Search Engine
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-secondary" onClick={handleCopyAllBibtex} style={{ fontSize: '0.82rem' }}>
              {copiedText ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              {copiedText ? 'All BibTeX Copied!' : 'Export All Citations (BibTeX)'}
            </button>

            <button 
              onClick={onClose}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Real-Time Live Search Bar */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleRunSearch(searchQuery);
            }}
            style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type query to fetch live academic research papers from Semantic Scholar / OpenAlex..."
                className="input-field"
                style={{ paddingLeft: '44px', height: '46px', fontSize: '0.94rem', borderRadius: '10px' }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ height: '46px', padding: '0 24px' }}>
              {isLoading ? <Loader2 size={18} className="spin-animation" /> : <Search size={18} />}
              {isLoading ? 'Fetching APIs...' : 'Search Live Papers'}
            </button>
          </form>

          {/* Quick Topic Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Quick Topics:
            </span>
            {DEFAULT_SEARCH_TOPICS.map((topic, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchQuery(topic);
                  handleRunSearch(topic);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  background: searchQuery === topic ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-card-solid)',
                  color: searchQuery === topic ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Papers Results List */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--accent-cyan)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>Querying Semantic Scholar & OpenAlex API endpoints in real time...</div>
            </div>
          ) : papers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              No academic papers retrieved for query "{searchQuery}". Try modifying keywords.
            </div>
          ) : (
            papers.map((paper) => {
              const isExpanded = expandedPaperId === paper.id;
              return (
                <div
                  key={paper.id}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isExpanded ? 'var(--accent-cyan)' : 'var(--border-color)',
                    background: isExpanded ? 'rgba(0, 242, 254, 0.04)' : 'var(--bg-surface)',
                    padding: '20px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div 
                    onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-cyan" style={{ fontWeight: 800 }}>{paper.source}</span>
                        <span className="badge badge-indigo">{paper.year}</span>
                        <span className="badge badge-purple">{paper.venue}</span>
                        {paper.citationCount > 0 && (
                          <span className="badge badge-emerald">Citations: {paper.citationCount}</span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 6px', lineHeight: '1.35' }}>
                        {paper.title}
                      </h3>

                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        Authors: <strong>{paper.authors.join(', ')}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {paper.pdfUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(paper.pdfUrl, '_blank');
                          }}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <BookOpen size={14} /> Open PDF
                        </button>
                      )}

                      {paper.url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(paper.url, '_blank');
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <ExternalLink size={14} /> View DOI
                        </button>
                      )}

                      <button
                        onClick={(e) => handleCopySingleBibtex(paper.id, paper.bibtex, e)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}
                      >
                        {copiedBibtexId === paper.id ? <Check size={14} color="var(--accent-emerald)" /> : <FileCode size={14} />}
                        {copiedBibtexId === paper.id ? 'BibTeX Copied!' : 'BibTeX'}
                      </button>

                      {isExpanded ? <ChevronUp size={20} color="var(--accent-cyan)" /> : <ChevronDown size={20} color="var(--text-dim)" />}
                    </div>
                  </div>

                  {/* Expanded Paper Details */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                          Real-Time Abstract
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.65', margin: 0, background: 'var(--bg-main)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          "{paper.abstract}"
                        </p>
                      </div>

                      {/* BibTeX Box */}
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '4px' }}>
                          Generated BibTeX Citation
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '12px',
                          background: '#070A10',
                          borderRadius: '8px',
                          color: 'var(--accent-cyan)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.76rem',
                          overflowX: 'auto'
                        }}>
                          {paper.bibtex}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Real-time external academic queries executed live via Semantic Scholar & OpenAlex API graphs.
          </div>
          <button className="btn-primary" onClick={onClose} style={{ padding: '8px 22px', fontSize: '0.88rem' }}>
            Close Live Search
          </button>
        </div>
      </div>
    </div>
  );
};
