import React, { useState, useEffect, useRef } from 'react';
import type { 
  RealtimeAcademicPaper, 
  AuthorProfile, 
  AcademicSearchMode, 
  AcademicSearchFilters, 
  ModuleView 
} from '../types';
import { 
  searchRealtimeAcademicPapers, 
  resolveAuthor 
} from '../services/academicApi';
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
  BookOpen,
  User,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Building,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles
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
  // Main Search State
  const [searchMode, setSearchMode] = useState<AcademicSearchMode>('TOPIC');
  const [searchQuery, setSearchQuery] = useState(initialQuery || 'patent similarity natural language processing deep learning');
  const [papers, setPapers] = useState<RealtimeAcademicPaper[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);
  const [totalResultCount, setTotalResultCount] = useState<number>(0);

  // Author Resolution & Disambiguation State
  const [authorQuery, setAuthorQuery] = useState<string>('');
  const [authorSuggestions, setAuthorSuggestions] = useState<AuthorProfile[]>([]);
  const [isResolvingAuthors, setIsResolvingAuthors] = useState<boolean>(false);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorProfile | null>(null);
  const [authorDisambiguationList, setAuthorDisambiguationList] = useState<AuthorProfile[]>([]);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState<boolean>(false);

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');
  const [venueFilter, setVenueFilter] = useState<string>('ALL');
  const [pubTypeFilter, setPubTypeFilter] = useState<string>('ALL');
  const [minCitations, setMinCitations] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'date_desc' | 'date_asc' | 'citations_desc'>('relevance');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'OpenAlex' | 'Semantic Scholar' | 'Crossref'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // UI Interactive State
  const [copiedText, setCopiedText] = useState(false);
  const [copiedBibtexId, setCopiedBibtexId] = useState<string | null>(null);
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  // Debounce ref for author resolution
  const authorDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger search on modal open or initial query
  useEffect(() => {
    if (isOpen) {
      handleExecuteSearch();
    }
  }, [isOpen]);

  // Debounced Author Search Suggestion handler
  useEffect(() => {
    if (authorQuery.trim().length >= 2) {
      if (authorDebounceTimer.current) clearTimeout(authorDebounceTimer.current);
      authorDebounceTimer.current = setTimeout(async () => {
        setIsResolvingAuthors(true);
        const resolved = await resolveAuthor(authorQuery);
        setAuthorSuggestions(resolved);
        setIsResolvingAuthors(false);
        setShowAuthorDropdown(true);
      }, 400);
    } else {
      setAuthorSuggestions([]);
      setShowAuthorDropdown(false);
    }
    return () => {
      if (authorDebounceTimer.current) clearTimeout(authorDebounceTimer.current);
    };
  }, [authorQuery]);

  // Construct active filter object
  const buildActiveFilters = (): AcademicSearchFilters => {
    return {
      mode: searchMode,
      query: searchQuery,
      selectedAuthor: selectedAuthor,
      yearFrom: yearFrom ? parseInt(yearFrom, 10) : null,
      yearTo: yearTo ? parseInt(yearTo, 10) : null,
      venue: venueFilter,
      pubType: pubTypeFilter,
      minCitations: minCitations,
      sortBy: sortBy,
      sourceFilter: sourceFilter,
      page: currentPage,
      pageSize: pageSize
    };
  };

  // Main Live Search Dispatcher
  const handleExecuteSearch = async (overrideQuery?: string, overrideAuthor?: AuthorProfile | null) => {
    setIsLoading(true);
    setAuthorDisambiguationList([]);
    
    const activeQuery = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const activeAuthor = overrideAuthor !== undefined ? overrideAuthor : selectedAuthor;

    // Handle AUTHOR Search Mode
    if (searchMode === 'AUTHOR' && !activeAuthor && activeQuery.trim()) {
      // Resolve author first
      setIsResolvingAuthors(true);
      const candidates = await resolveAuthor(activeQuery);
      setIsResolvingAuthors(false);

      if (candidates.length === 1) {
        // Single author found
        setSelectedAuthor(candidates[0]);
        const result = await searchRealtimeAcademicPapers({
          ...buildActiveFilters(),
          mode: 'AUTHOR',
          selectedAuthor: candidates[0]
        });
        setPapers(result.papers);
        setTotalResultCount(result.totalCount);
        setSourcesUsed(result.sourcesUsed);
      } else if (candidates.length > 1) {
        // Multiple authors found -> show disambiguation panel
        setAuthorDisambiguationList(candidates);
        setPapers([]);
        setTotalResultCount(0);
      } else {
        setPapers([]);
        setTotalResultCount(0);
      }
      setIsLoading(false);
      return;
    }

    const filters = {
      ...buildActiveFilters(),
      query: activeQuery,
      selectedAuthor: activeAuthor
    };

    try {
      const res = await searchRealtimeAcademicPapers(filters);
      setPapers(res.papers);
      setTotalResultCount(res.totalCount);
      setSourcesUsed(res.sourcesUsed);
      if (res.papers.length > 0) {
        setExpandedPaperId(res.papers[0].id);
      }
    } catch (err) {
      console.error('Academic search error:', err);
      setPapers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Click on author name in paper card -> instant author profile search
  const handleSelectAuthorByName = async (authorName: string) => {
    setIsLoading(true);
    setSearchMode('AUTHOR');
    setSearchQuery(authorName);
    setAuthorQuery(authorName);

    const resolved = await resolveAuthor(authorName);
    if (resolved.length > 0) {
      setSelectedAuthor(resolved[0]);
      handleExecuteSearch(authorName, resolved[0]);
    } else {
      const tempAuthor: AuthorProfile = {
        id: `author_${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        displayName: authorName,
        worksCount: 0,
        citationCount: 0,
        source: 'OpenAlex'
      };
      setSelectedAuthor(tempAuthor);
      handleExecuteSearch(authorName, tempAuthor);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchMode('TOPIC');
    setSelectedAuthor(null);
    setAuthorQuery('');
    setYearFrom('');
    setYearTo('');
    setVenueFilter('ALL');
    setPubTypeFilter('ALL');
    setMinCitations(0);
    setSortBy('relevance');
    setSourceFilter('ALL');
    setCurrentPage(1);
    handleExecuteSearch(searchQuery, null);
  };

  if (!isOpen) return null;

  // Pagination calculation
  const totalPages = Math.ceil(papers.length / pageSize) || 1;
  const paginatedPapers = papers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      background: 'rgba(11, 15, 25, 0.90)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1280px',
        maxHeight: '94vh',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-glow)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        background: 'var(--bg-card-solid)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.10) 0%, rgba(99, 102, 241, 0.10) 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-cyan"><Globe size={12} /> REAL-TIME LIVE ACADEMIC RETRIEVAL API</span>
              <span className="badge badge-emerald">
                {sourcesUsed.length > 0 ? sourcesUsed.join(' • ') : 'OpenAlex • Semantic Scholar • Crossref'}
              </span>
              {totalResultCount > 0 && (
                <span className="badge badge-indigo">{totalResultCount} Papers Retreived</span>
              )}
              {selectedAuthor && (
                <span className="badge badge-purple"><User size={12} /> Author Filter: {selectedAuthor.displayName}</span>
              )}
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Live Prior-Art Literature Search Engine
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-secondary" onClick={handleCopyAllBibtex} style={{ fontSize: '0.82rem' }} disabled={papers.length === 0}>
              {copiedText ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              {copiedText ? 'BibTeX Copied!' : `Export Citations (${papers.length})`}
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

        {/* Search Mode & Control Panel */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Search Mode Selector Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Search Mode:</span>
            {[
              { id: 'TOPIC', label: 'Topic / Keyword' },
              { id: 'AUTHOR', label: 'Author Search' },
              { id: 'TITLE', label: 'Title Search' },
              { id: 'DOI', label: 'Exact DOI' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => {
                  setSearchMode(mode.id as AcademicSearchMode);
                  if (mode.id !== 'AUTHOR') setSelectedAuthor(null);
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: searchMode === mode.id ? 'var(--accent-cyan)' : 'var(--border-color)',
                  background: searchMode === mode.id ? 'rgba(0, 242, 254, 0.15)' : 'var(--bg-card-solid)',
                  color: searchMode === mode.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.80rem',
                  fontWeight: searchMode === mode.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {mode.label}
              </button>
            ))}

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                marginLeft: 'auto',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: showFilters ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card-solid)',
                color: showFilters ? 'var(--accent-indigo)' : 'var(--text-muted)',
                fontSize: '0.80rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={14} />
              {showFilters ? 'Hide Filters' : 'Filter Options'}
            </button>
          </div>

          {/* Main Search Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteSearch();
            }}
            style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchMode === 'AUTHOR' ? 'Search papers by author name (e.g. Steve Chi-Yin Yuen)...' :
                  searchMode === 'DOI' ? 'Enter exact DOI string (e.g. 10.1109/TKDE.2024.3391821)...' :
                  searchMode === 'TITLE' ? 'Enter exact paper title...' :
                  'Search research papers, authors, topics, DOI, or keywords...'
                }
                className="input-field"
                style={{ paddingLeft: '44px', height: '46px', fontSize: '0.94rem', borderRadius: '10px' }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ height: '46px', padding: '0 24px' }}>
              {isLoading ? <Loader2 size={18} className="spin-animation" /> : <Search size={18} />}
              {isLoading ? 'Retrieving APIs...' : 'Search Live Papers'}
            </button>
          </form>

          {/* Advanced Multi-Field Filter Bar */}
          {showFilters && (
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '4px'
            }}>
              {/* Author Filter Input */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  Author Filter {isResolvingAuthors && <Loader2 size={12} className="spin-animation" color="var(--accent-cyan)" />}
                </label>
                <input
                  type="text"
                  value={authorQuery}
                  onChange={(e) => setAuthorQuery(e.target.value)}
                  placeholder="Filter by author..."
                  className="input-field"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />

                {/* Author Autocomplete Suggestions Dropdown */}
                {showAuthorDropdown && authorSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    background: 'var(--bg-card-solid)',
                    border: '1px solid var(--accent-cyan)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-glow)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {authorSuggestions.map(auth => (
                      <div
                        key={auth.id}
                        onClick={() => {
                          setSelectedAuthor(auth);
                          setAuthorQuery(auth.displayName);
                          setShowAuthorDropdown(false);
                          handleExecuteSearch(searchQuery, auth);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                        className="hover-highlight"
                      >
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          {auth.displayName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {auth.institution} • {auth.worksCount} Works • {auth.citationCount} Citations
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Range */}
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Publication Year
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="From (2015)"
                    className="input-field"
                    style={{ height: '36px', fontSize: '0.82rem' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>–</span>
                  <input
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="To (2026)"
                    className="input-field"
                    style={{ height: '36px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Venue Filter */}
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Venue / Journal
                </label>
                <select
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value)}
                  className="input-field"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Venues</option>
                  <option value="IEEE">IEEE Transactions & Conferences</option>
                  <option value="ACM">ACM Digital Library</option>
                  <option value="Springer">Springer / Nature</option>
                  <option value="Elsevier">Elsevier</option>
                  <option value="arXiv">arXiv Preprints</option>
                </select>
              </div>

              {/* Publication Type Filter */}
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Publication Type
                </label>
                <select
                  value={pubTypeFilter}
                  onChange={(e) => setPubTypeFilter(e.target.value)}
                  className="input-field"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Types</option>
                  <option value="RESEARCH_PAPER">Research Paper</option>
                  <option value="IEEE_JOURNAL">IEEE Journal</option>
                  <option value="IEEE_CONFERENCE">IEEE Conference</option>
                  <option value="CONFERENCE_PAPER">Conference Paper</option>
                  <option value="REVIEW">Review Article</option>
                  <option value="PREPRINT">Preprint</option>
                </select>
              </div>

              {/* Min Citations */}
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Minimum Citations
                </label>
                <select
                  value={minCitations}
                  onChange={(e) => setMinCitations(parseInt(e.target.value, 10))}
                  className="input-field"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  <option value={0}>All Citations (0+)</option>
                  <option value={10}>10+ Citations</option>
                  <option value={50}>50+ Citations</option>
                  <option value={100}>100+ Citations</option>
                  <option value={500}>500+ Citations</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input-field"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  <option value="relevance">Relevance Rank</option>
                  <option value="date_desc">Publication Date (Newest First)</option>
                  <option value="date_asc">Publication Date (Oldest First)</option>
                  <option value="citations_desc">Citation Count (High to Low)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '6px' }}>
                <button 
                  onClick={handleResetFilters} 
                  className="btn-secondary" 
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  <RotateCcw size={14} /> Clear Filters
                </button>
                <button 
                  onClick={() => handleExecuteSearch()} 
                  className="btn-primary" 
                  style={{ padding: '6px 18px', fontSize: '0.78rem' }}
                >
                  <Filter size={14} /> Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Quick Topics Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingTop: '2px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Quick Topics:
            </span>
            {DEFAULT_SEARCH_TOPICS.map((topic, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchMode('TOPIC');
                  setSelectedAuthor(null);
                  setSearchQuery(topic);
                  handleExecuteSearch(topic, null);
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

        {/* Selected Author Profile Header Card */}
        {selectedAuthor && (
          <div style={{
            padding: '14px 24px',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(0, 242, 254, 0.10) 100%)',
            borderBottom: '1px solid var(--accent-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--accent-indigo)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem'
              }}>
                {selectedAuthor.displayName.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    AUTHOR PROFILE: {selectedAuthor.displayName}
                  </h4>
                  <span className="badge badge-purple">{selectedAuthor.source}</span>
                </div>
                <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '14px' }}>
                  <span><Building size={12} /> {selectedAuthor.institution || 'Research Institution'}</span>
                  <span><BookOpen size={12} /> {selectedAuthor.worksCount || papers.length} Works Found</span>
                  <span><Award size={12} /> {selectedAuthor.citationCount} Citations</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedAuthor(null);
                setSearchMode('TOPIC');
                handleExecuteSearch(searchQuery, null);
              }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}
            >
              Clear Author Filter
            </button>
          </div>
        )}

        {/* Papers & Author Disambiguation Results List */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Loading Indicator */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--accent-cyan)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Loader2 size={36} className="spin-animation" />
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Querying OpenAlex, Semantic Scholar & Crossref Graph APIs...</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Filtering, deduplicating, and ranking live academic prior-art...</div>
            </div>
          ) : authorDisambiguationList.length > 0 ? (
            /* Author Disambiguation Selection Panel */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> Multiple Authors Match Query "{searchQuery}". Please Select the Intended Author:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {authorDisambiguationList.map(auth => (
                  <div
                    key={auth.id}
                    onClick={() => {
                      setSelectedAuthor(auth);
                      setAuthorDisambiguationList([]);
                      handleExecuteSearch(searchQuery, auth);
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                    className="hover-highlight"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {auth.displayName}
                      </span>
                      <span className="badge badge-indigo">{auth.source}</span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Building size={13} /> {auth.institution || 'Academic Institution'}
                    </div>

                    <div style={{ fontSize: '0.80rem', color: 'var(--text-dim)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span><strong>{auth.worksCount}</strong> Works</span>
                      <span><strong>{auth.citationCount}</strong> Citations</span>
                      {auth.hIndex && <span>h-index: <strong>{auth.hIndex}</strong></span>}
                    </div>

                    <button className="btn-primary" style={{ marginTop: '8px', padding: '6px', fontSize: '0.78rem' }}>
                      Select & Load Publications
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : papers.length === 0 ? (
            /* Zero Results Indicator */
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={32} color="var(--text-dim)" />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                No live academic publications found matching the query and filter constraints.
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', maxWidth: '500px' }}>
                Try broadening your topic keywords, clearing the author filter, or expanding the publication year range.
              </div>
              <button className="btn-secondary" onClick={handleResetFilters} style={{ marginTop: '8px' }}>
                Reset Search Filters
              </button>
            </div>
          ) : (
            /* Paper Result Cards */
            paginatedPapers.map((paper) => {
              const isExpanded = expandedPaperId === paper.id;
              const displaySources = paper.sources && paper.sources.length > 0 ? paper.sources : [paper.source];

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
                      {/* Source & Metadata Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {displaySources.map((src, sIdx) => (
                          <span key={sIdx} className="badge badge-cyan" style={{ fontWeight: 800 }}>{src}</span>
                        ))}
                        <span className="badge badge-indigo">{paper.year}</span>
                        {paper.documentType && (
                          <span className="badge badge-purple">{paper.documentType}</span>
                        )}
                        <span className="badge badge-emerald">Citations: {paper.citationCount}</span>
                        {paper.isOpenAccess && (
                          <span className="badge badge-amber">Open Access PDF</span>
                        )}
                      </div>

                      {/* Paper Title */}
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 8px', lineHeight: '1.35' }}>
                        {paper.title}
                      </h3>

                      {/* Clickable Authors List */}
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>Authors:</span>
                        {paper.authors.map((authName, aIdx) => (
                          <span 
                            key={aIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAuthorByName(authName);
                            }}
                            style={{
                              color: 'var(--accent-cyan)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              textUnderlineOffset: '3px'
                            }}
                            title={`Click to search all publications by ${authName}`}
                          >
                            {authName}{aIdx < paper.authors.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>

                      {/* Venue / Journal Name */}
                      <div style={{ fontSize: '0.80rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        Venue: <strong>{paper.venue}</strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

                  {/* Expanded Details Panel */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                          Real-Time Source Abstract
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.65', margin: 0, background: 'var(--bg-main)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          "{paper.abstract}"
                        </p>
                      </div>

                      {/* BibTeX Code Box */}
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '4px' }}>
                          BibTeX Citation Record
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

        {/* Footer & Pagination Controls */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing <strong>{papers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, papers.length)}</strong> of <strong>{papers.length}</strong> unique publications retrieved live.
          </div>

          {/* Pagination Buttons */}
          {papers.length > pageSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button className="btn-primary" onClick={onClose} style={{ padding: '8px 22px', fontSize: '0.88rem' }}>
            Close Search
          </button>
        </div>
      </div>
    </div>
  );
};
