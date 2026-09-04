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
  SlidersHorizontal,
  RotateCcw,
  Building,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Filter
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onNavigateModule?: (module: ModuleView) => void;
}

// Separate Filter State Model
interface FilterState {
  yearFrom: string;
  yearTo: string;
  venue: string;
  pubType: string;
  minCitations: number;
  sortBy: 'relevance' | 'date_desc' | 'date_asc' | 'citations_desc';
  sourceFilter: 'ALL' | 'OpenAlex' | 'Semantic Scholar' | 'Crossref';
}

const DEFAULT_FILTERS: FilterState = {
  yearFrom: '',
  yearTo: '',
  venue: 'ALL',
  pubType: 'ALL',
  minCitations: 0,
  sortBy: 'relevance',
  sourceFilter: 'ALL'
};

export const LiteratureModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  initialQuery = ''
}) => {
  // 1. Search State
  const [searchMode, setSearchMode] = useState<AcademicSearchMode>('TOPIC');
  const [searchQuery, setSearchQuery] = useState(initialQuery || 'patent similarity natural language processing deep learning');

  // 2. Author State
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorProfile | null>(null);
  const [authorQuery, setAuthorQuery] = useState<string>('');
  const [authorSuggestions, setAuthorSuggestions] = useState<AuthorProfile[]>([]);
  const [authorDisambiguationList, setAuthorDisambiguationList] = useState<AuthorProfile[]>([]);
  const [isResolvingAuthors, setIsResolvingAuthors] = useState<boolean>(false);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState<boolean>(false);

  // 3. Separate Filter States: Applied vs Draft (for overlay drawer)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // 4. Result State
  const [papers, setPapers] = useState<RealtimeAcademicPaper[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);
  const [totalResultCount, setTotalResultCount] = useState<number>(0);
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  // 5. Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // 6. UI Feedback State
  const [copiedText, setCopiedText] = useState(false);
  const [copiedBibtexId, setCopiedBibtexId] = useState<string | null>(null);

  // Request ID Ref for stale response protection
  const requestIdRef = useRef<number>(0);
  const authorDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterDrawerRef = useRef<HTMLDivElement | null>(null);

  // Trigger search on modal open or initial query
  useEffect(() => {
    if (isOpen) {
      handleExecuteSearch();
    }
  }, [isOpen]);

  // Click outside listener for filter drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDrawerRef.current && !filterDrawerRef.current.contains(event.target as Node)) {
        setIsFilterDrawerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterDrawerOpen(false);
      }
    };

    if (isFilterDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterDrawerOpen]);

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

  // Active filter count for badge
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (selectedAuthor) count++;
    if (appliedFilters.yearFrom || appliedFilters.yearTo) count++;
    if (appliedFilters.venue !== 'ALL') count++;
    if (appliedFilters.pubType !== 'ALL') count++;
    if (appliedFilters.minCitations > 0) count++;
    if (appliedFilters.sortBy !== 'relevance') count++;
    if (appliedFilters.sourceFilter !== 'ALL') count++;
    return count;
  };

  // Main Live Search Dispatcher with Request ID Stale Protection
  const handleExecuteSearch = async (
    overrideQuery?: string, 
    overrideAuthor?: AuthorProfile | null,
    overrideFilters?: FilterState,
    overrideMode?: AcademicSearchMode
  ) => {
    const currentReqId = ++requestIdRef.current;
    setIsLoading(true);
    setAuthorDisambiguationList([]);

    const activeQuery = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const activeAuthor = overrideAuthor !== undefined ? overrideAuthor : selectedAuthor;
    const activeFilters = overrideFilters !== undefined ? overrideFilters : appliedFilters;
    const activeMode = overrideMode !== undefined ? overrideMode : searchMode;

    // Handle AUTHOR Search Mode
    if (activeMode === 'AUTHOR' && !activeAuthor && activeQuery.trim()) {
      setIsResolvingAuthors(true);
      const candidates = await resolveAuthor(activeQuery);
      
      if (currentReqId !== requestIdRef.current) return;
      setIsResolvingAuthors(false);

      if (candidates.length === 1) {
        setSelectedAuthor(candidates[0]);
        const apiFilters: AcademicSearchFilters = {
          mode: 'AUTHOR',
          query: activeQuery,
          selectedAuthor: candidates[0],
          yearFrom: activeFilters.yearFrom ? parseInt(activeFilters.yearFrom, 10) : null,
          yearTo: activeFilters.yearTo ? parseInt(activeFilters.yearTo, 10) : null,
          venue: activeFilters.venue,
          pubType: activeFilters.pubType,
          minCitations: activeFilters.minCitations,
          sortBy: activeFilters.sortBy,
          sourceFilter: activeFilters.sourceFilter,
          page: currentPage,
          pageSize: pageSize
        };
        const result = await searchRealtimeAcademicPapers(apiFilters);
        if (currentReqId !== requestIdRef.current) return;
        setPapers(result.papers);
        setTotalResultCount(result.totalCount);
        setSourcesUsed(result.sourcesUsed);
      } else if (candidates.length > 1) {
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

    const apiFilters: AcademicSearchFilters = {
      mode: activeMode,
      query: activeQuery,
      selectedAuthor: activeAuthor,
      yearFrom: activeFilters.yearFrom ? parseInt(activeFilters.yearFrom, 10) : null,
      yearTo: activeFilters.yearTo ? parseInt(activeFilters.yearTo, 10) : null,
      venue: activeFilters.venue,
      pubType: activeFilters.pubType,
      minCitations: activeFilters.minCitations,
      sortBy: activeFilters.sortBy,
      sourceFilter: activeFilters.sourceFilter,
      page: currentPage,
      pageSize: pageSize
    };

    try {
      const res = await searchRealtimeAcademicPapers(apiFilters);
      if (currentReqId !== requestIdRef.current) return;
      setPapers(res.papers);
      setTotalResultCount(res.totalCount);
      setSourcesUsed(res.sourcesUsed);
      if (res.papers.length > 0) {
        setExpandedPaperId(res.papers[0].id);
      }
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      console.error('Academic search error:', err);
      setPapers([]);
      setTotalResultCount(0);
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Switch search mode with automatic invalid state cleanup
  const handleModeSwitch = (newMode: AcademicSearchMode) => {
    setSearchMode(newMode);
    setCurrentPage(1);
    
    // Incompatible state reset
    if (newMode !== 'AUTHOR') {
      setSelectedAuthor(null);
      setAuthorDisambiguationList([]);
      setAuthorQuery('');
    }

    let defaultText = searchQuery;
    if (newMode === 'AUTHOR' && (searchQuery.includes('patent') || searchQuery.includes('learning'))) {
      defaultText = 'Steve Chi-Yin Yuen';
      setSearchQuery(defaultText);
    } else if (newMode === 'DOI' && !searchQuery.startsWith('10.')) {
      defaultText = '10.1109/TKDE.2024.3391821';
      setSearchQuery(defaultText);
    }

    handleExecuteSearch(defaultText, newMode === 'AUTHOR' ? selectedAuthor : null, appliedFilters, newMode);
  };

  // Click on author name in paper card -> instant author profile search
  const handleSelectAuthorByName = async (authorName: string) => {
    setSearchMode('AUTHOR');
    setSearchQuery(authorName);
    setAuthorQuery(authorName);
    setCurrentPage(1);

    const resolved = await resolveAuthor(authorName);
    if (resolved.length > 0) {
      setSelectedAuthor(resolved[0]);
      handleExecuteSearch(authorName, resolved[0], appliedFilters, 'AUTHOR');
    } else {
      const tempAuthor: AuthorProfile = {
        id: `author_${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        displayName: authorName,
        worksCount: 0,
        citationCount: 0,
        source: 'OpenAlex'
      };
      setSelectedAuthor(tempAuthor);
      handleExecuteSearch(authorName, tempAuthor, appliedFilters, 'AUTHOR');
    }
  };

  // Apply draft filters from drawer
  const handleApplyDraftFilters = () => {
    setAppliedFilters(draftFilters);
    setIsFilterDrawerOpen(false);
    setCurrentPage(1);
    handleExecuteSearch(searchQuery, selectedAuthor, draftFilters, searchMode);
  };

  // Cancel draft filter changes
  const handleCancelDraftFilters = () => {
    setDraftFilters(appliedFilters);
    setIsFilterDrawerOpen(false);
  };

  // Reset only filters (preserves searchQuery)
  const handleResetFiltersOnly = () => {
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    handleExecuteSearch(searchQuery, selectedAuthor, DEFAULT_FILTERS, searchMode);
  };

  // Clear author filter only
  const handleClearAuthorFilter = () => {
    setSelectedAuthor(null);
    setAuthorQuery('');
    setAuthorDisambiguationList([]);
    if (searchMode === 'AUTHOR') {
      setSearchMode('TOPIC');
    }
    setCurrentPage(1);
    handleExecuteSearch(searchQuery, null, appliedFilters, 'TOPIC');
  };

  // Clear entire search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedAuthor(null);
    setAuthorQuery('');
    setAuthorDisambiguationList([]);
    setPapers([]);
    setTotalResultCount(0);
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

  const activeFilterCount = getActiveFilterCount();

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
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1360px',
        height: '96vh',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-glow)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        background: 'var(--bg-card-solid)',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.10) 0%, rgba(99, 102, 241, 0.10) 100%)',
          flexShrink: 0
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
            </div>
            <h2 style={{ fontSize: '1.30rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Search Mode & Input Controls Bar */}
        <div style={{ 
          padding: '10px 20px', 
          borderBottom: '1px solid var(--border-color)', 
          background: 'var(--bg-surface)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          flexShrink: 0,
          position: 'relative'
        }}>
          
          {/* Top Row: Search Modes & Filter Trigger Button */}
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
                onClick={() => handleModeSwitch(mode.id as AcademicSearchMode)}
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

            {/* Compact Filter Drawer Toggle Button */}
            <div style={{ marginLeft: 'auto', position: 'relative' }} ref={filterDrawerRef}>
              <button
                onClick={() => {
                  setDraftFilters(appliedFilters);
                  setIsFilterDrawerOpen(!isFilterDrawerOpen);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activeFilterCount > 0 ? 'var(--accent-cyan)' : 'var(--border-color)',
                  background: isFilterDrawerOpen || activeFilterCount > 0 ? 'rgba(0, 242, 254, 0.15)' : 'var(--bg-card-solid)',
                  color: activeFilterCount > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <SlidersHorizontal size={14} />
                {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter Options'}
                <ChevronDown size={14} style={{ transform: isFilterDrawerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* FLOATING COMPACT FILTER DRAWER POPOVER (Overlay over results, max height 35-40%) */}
              {isFilterDrawerOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 'min(620px, 92vw)',
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65), var(--shadow-glow)',
                  padding: '16px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Filter size={14} /> Advanced Filter Drawer
                    </div>
                    <button 
                      onClick={() => setIsFilterDrawerOpen(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '12px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {/* Author Filter Input */}
                    {searchMode !== 'DOI' && (
                      <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          Author Autocomplete {isResolvingAuthors && <Loader2 size={12} className="spin-animation" color="var(--accent-cyan)" />}
                        </label>
                        <input
                          type="text"
                          value={authorQuery}
                          onChange={(e) => setAuthorQuery(e.target.value)}
                          placeholder="Filter by author..."
                          className="input-field"
                          style={{ height: '38px', padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px' }}
                        />

                        {showAuthorDropdown && authorSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 300,
                            background: 'var(--bg-card-solid)',
                            border: '1px solid var(--accent-cyan)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-glow)',
                            maxHeight: '180px',
                            overflowY: 'auto'
                          }}>
                            {authorSuggestions.map(auth => (
                              <div
                                key={auth.id}
                                onClick={() => {
                                  setSelectedAuthor(auth);
                                  setAuthorQuery(auth.displayName);
                                  setShowAuthorDropdown(false);
                                }}
                                style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                                className="hover-highlight"
                              >
                                <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{auth.displayName}</div>
                                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>{auth.worksCount} Works • {auth.citationCount} Citations</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Year Range */}
                    <div>
                      <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                        Publication Year
                      </label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={draftFilters.yearFrom}
                          onChange={(e) => setDraftFilters({ ...draftFilters, yearFrom: e.target.value })}
                          placeholder="2015"
                          className="input-field"
                          style={{ height: '38px', padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>–</span>
                        <input
                          type="number"
                          value={draftFilters.yearTo}
                          onChange={(e) => setDraftFilters({ ...draftFilters, yearTo: e.target.value })}
                          placeholder="2026"
                          className="input-field"
                          style={{ height: '38px', padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
                        />
                      </div>
                    </div>

                    {/* Venue Filter */}
                    {searchMode !== 'DOI' && (
                      <div>
                        <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                          Venue / Journal
                        </label>
                        <select
                          value={draftFilters.venue}
                          onChange={(e) => setDraftFilters({ ...draftFilters, venue: e.target.value })}
                          className="input-field"
                          style={{ height: '38px', padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
                        >
                          <option value="ALL">All Venues</option>
                          <option value="IEEE">IEEE Transactions & Conferences</option>
                          <option value="ACM">ACM Digital Library</option>
                          <option value="Springer">Springer / Nature</option>
                          <option value="Elsevier">Elsevier</option>
                          <option value="arXiv">arXiv Preprints</option>
                        </select>
                      </div>
                    )}

                    {/* Publication Type */}
                    {searchMode !== 'DOI' && (
                      <div>
                        <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                          Publication Type
                        </label>
                        <select
                          value={draftFilters.pubType}
                          onChange={(e) => setDraftFilters({ ...draftFilters, pubType: e.target.value })}
                          className="input-field"
                          style={{ height: '38px', padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
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
                    )}

                    {/* Min Citations */}
                    {searchMode !== 'DOI' && (
                      <div>
                        <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                          Minimum Citations
                        </label>
                        <select
                          value={draftFilters.minCitations}
                          onChange={(e) => setDraftFilters({ ...draftFilters, minCitations: parseInt(e.target.value, 10) })}
                          className="input-field"
                          style={{ height: '38px', padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
                        >
                          <option value={0}>All Citations (0+)</option>
                          <option value={10}>10+ Citations</option>
                          <option value={50}>50+ Citations</option>
                          <option value={100}>100+ Citations</option>
                          <option value={500}>500+ Citations</option>
                        </select>
                      </div>
                    )}

                    {/* Sort Order */}
                    <div>
                      <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                        Sort Order
                      </label>
                      <select
                        value={draftFilters.sortBy}
                        onChange={(e) => setDraftFilters({ ...draftFilters, sortBy: e.target.value as any })}
                        className="input-field"
                        style={{ height: '38px', padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
                      >
                        <option value="relevance">Relevance Rank</option>
                        <option value="date_desc">Publication Date (Newest First)</option>
                        <option value="date_asc">Publication Date (Oldest First)</option>
                        <option value="citations_desc">Citation Count (High to Low)</option>
                      </select>
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    <button 
                      onClick={handleResetFiltersOnly} 
                      className="btn-secondary" 
                      style={{ padding: '5px 12px', fontSize: '0.76rem' }}
                    >
                      <RotateCcw size={12} /> Clear Filters
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={handleCancelDraftFilters} 
                        className="btn-secondary" 
                        style={{ padding: '5px 12px', fontSize: '0.76rem' }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleApplyDraftFilters} 
                        className="btn-primary" 
                        style={{ padding: '5px 16px', fontSize: '0.76rem' }}
                      >
                        <Filter size={12} /> Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Search Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentPage(1);
              handleExecuteSearch();
            }}
            style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
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
                  searchMode === 'TITLE' ? 'Search papers by title...' :
                  'Search research papers, topics, keywords...'
                }
                className="input-field"
                style={{ paddingLeft: '44px', paddingRight: searchQuery ? '36px' : '14px', height: '38px', fontSize: '0.88rem', borderRadius: '8px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer'
                  }}
                  title="Clear search text"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ height: '38px', padding: '0 20px', fontSize: '0.84rem' }}>
              {isLoading ? <Loader2 size={18} className="spin-animation" /> : <Search size={18} />}
              {isLoading ? 'Retrieving APIs...' : 'Search Live Papers'}
            </button>
          </form>

          {/* Active Filter Chips Row */}
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '2px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>Active Filters:</span>
              
              {selectedAuthor && (
                <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
                  Author: {selectedAuthor.displayName}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={handleClearAuthorFilter} />
                </span>
              )}

              {(appliedFilters.yearFrom || appliedFilters.yearTo) && (
                <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
                  Year: {appliedFilters.yearFrom || 'Min'}–{appliedFilters.yearTo || 'Max'}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => {
                    const updated = { ...appliedFilters, yearFrom: '', yearTo: '' };
                    setAppliedFilters(updated);
                    handleExecuteSearch(searchQuery, selectedAuthor, updated, searchMode);
                  }} />
                </span>
              )}

              {appliedFilters.venue !== 'ALL' && (
                <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
                  Venue: {appliedFilters.venue}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => {
                    const updated = { ...appliedFilters, venue: 'ALL' };
                    setAppliedFilters(updated);
                    handleExecuteSearch(searchQuery, selectedAuthor, updated, searchMode);
                  }} />
                </span>
              )}

              {appliedFilters.pubType !== 'ALL' && (
                <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
                  Type: {appliedFilters.pubType}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => {
                    const updated = { ...appliedFilters, pubType: 'ALL' };
                    setAppliedFilters(updated);
                    handleExecuteSearch(searchQuery, selectedAuthor, updated, searchMode);
                  }} />
                </span>
              )}

              {appliedFilters.minCitations > 0 && (
                <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
                  Citations: {appliedFilters.minCitations}+
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => {
                    const updated = { ...appliedFilters, minCitations: 0 };
                    setAppliedFilters(updated);
                    handleExecuteSearch(searchQuery, selectedAuthor, updated, searchMode);
                  }} />
                </span>
              )}

              {appliedFilters.sortBy !== 'relevance' && (
                <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}>
                  Sort: {appliedFilters.sortBy}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => {
                    const updated = { ...appliedFilters, sortBy: 'relevance' as const };
                    setAppliedFilters(updated);
                    handleExecuteSearch(searchQuery, selectedAuthor, updated, searchMode);
                  }} />
                </span>
              )}

              <button 
                onClick={handleResetFiltersOnly}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset All
              </button>
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
                  setCurrentPage(1);
                  handleExecuteSearch(topic, null, appliedFilters, 'TOPIC');
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
            padding: '8px 20px',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(0, 242, 254, 0.10) 100%)',
            borderBottom: '1px solid var(--accent-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-indigo)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.90rem'
              }}>
                {selectedAuthor.displayName.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    AUTHOR PROFILE: {selectedAuthor.displayName}
                  </h4>
                  <span className="badge badge-purple">{selectedAuthor.source}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                  <span><Building size={11} /> {selectedAuthor.institution || 'Research Institution'}</span>
                  <span><BookOpen size={11} /> {selectedAuthor.worksCount || papers.length} Works Found</span>
                  <span><Award size={11} /> {selectedAuthor.citationCount} Citations</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClearAuthorFilter}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.74rem', color: 'var(--accent-cyan)' }}
            >
              Clear Author Filter
            </button>
          </div>
        )}

        {/* Papers & Author Disambiguation Results List (DOMINANT VIEWPORT AREA ~75% HEIGHT) */}
        <div style={{ flex: 1, minHeight: 0, padding: '14px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
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
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> Multiple Authors Match Query "{searchQuery}". Please Select the Intended Author:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {authorDisambiguationList.map(auth => (
                  <div
                    key={auth.id}
                    onClick={() => {
                      setSelectedAuthor(auth);
                      setAuthorDisambiguationList([]);
                      handleExecuteSearch(searchQuery, auth, appliedFilters, 'AUTHOR');
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
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {auth.displayName}
                      </span>
                      <span className="badge badge-indigo">{auth.source}</span>
                    </div>

                    <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                      <Building size={13} /> {auth.institution || 'Academic Institution'}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', gap: '12px', marginTop: '4px' }}>
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
              <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)', maxWidth: '520px' }}>
                Try broadening your topic keywords, clearing the author filter, or expanding the publication year range.
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={handleResetFiltersOnly}>
                  Clear Filters
                </button>
                <button className="btn-primary" onClick={handleClearSearch}>
                  Reset Search
                </button>
              </div>
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
                    padding: '18px',
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
                      <h3 style={{ fontSize: '1.10rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 8px', lineHeight: '1.35' }}>
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        Venue: <strong>{paper.venue}</strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                          Real-Time Source Abstract
                        </div>
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: '1.6', margin: 0, background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          "{paper.abstract}"
                        </p>
                      </div>

                      {/* BibTeX Code Box */}
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '4px' }}>
                          BibTeX Citation Record
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '10px',
                          background: '#070A10',
                          borderRadius: '8px',
                          color: 'var(--accent-cyan)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.74rem',
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

        {/* Footer & Pagination Controls (STICKY BOTTOM) */}
        <div style={{ 
          padding: '12px 24px', 
          borderTop: '1px solid var(--border-color)', 
          background: 'var(--bg-surface)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px',
          flexShrink: 0 
        }}>
          <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>
            Showing <strong>{papers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, papers.length)}</strong> of <strong>{papers.length}</strong> unique publications retrieved live.
          </div>

          {/* Pagination Controls */}
          {papers.length > pageSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button className="btn-primary" onClick={onClose} style={{ padding: '6px 20px', fontSize: '0.86rem' }}>
            Close Search
          </button>
        </div>
      </div>
    </div>
  );
};
