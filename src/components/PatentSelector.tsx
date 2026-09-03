import React, { useState, useEffect, useRef } from 'react';
import type { PatentDocument } from '../types';
import { 
  Search, 
  ChevronDown, 
  Check, 
  Clock, 
  FolderKanban, 
  X, 
  FileText, 
  ExternalLink
} from 'lucide-react';

export interface WorkspacePatentOption {
  id: string;
  publicationNumber: string;
  title: string;
  source?: string;
  claimCount?: number;
  assignee?: string;
  inventors?: string[];
}

interface Props {
  patents: (PatentDocument | WorkspacePatentOption)[];
  selectedPatentId: string;
  onSelect: (patentId: string) => void;
  label?: string;
  placeholder?: string;
  width?: string;
  showSummary?: boolean;
  onNavigateWorkspace?: () => void;
}

const RECENT_PATENTS_STORAGE_KEY = 'patentintel_recent_patents';

// Helper to normalize patent options from heterogeneous PatentDocument or WorkspacePatentOption
const normalizePatent = (p: PatentDocument | WorkspacePatentOption): WorkspacePatentOption => {
  if ('publicationNumber' in p && typeof p.publicationNumber === 'string') {
    return p as WorkspacePatentOption;
  }
  const doc = p as PatentDocument;
  return {
    id: doc.id,
    publicationNumber: doc.publicationNumber || doc.id,
    title: doc.title || 'Untitled Patent',
    source: doc.source || 'USPTO',
    claimCount: doc.claims?.length || (doc.claimsCount ?? 15),
    assignee: doc.assignee || 'Patent Assignee',
    inventors: doc.inventors
  };
};

// Search filter supporting patent ID, title, assignee, inventors with string normalization
export const filterWorkspacePatents = (
  patents: WorkspacePatentOption[],
  query: string
): WorkspacePatentOption[] => {
  if (!query.trim()) return patents;

  const rawQuery = query.toLowerCase().trim();
  const cleanQuery = rawQuery.replace(/[\s,\-\.]/g, '');

  return patents.filter(p => {
    const rawId = p.id.toLowerCase();
    const cleanId = rawId.replace(/[\s,\-\.]/g, '');
    const rawPub = p.publicationNumber.toLowerCase();
    const cleanPub = rawPub.replace(/[\s,\-\.]/g, '');
    const title = p.title.toLowerCase();
    const assignee = (p.assignee || '').toLowerCase();
    const inventors = (p.inventors || []).join(' ').toLowerCase();

    return (
      rawId.includes(rawQuery) ||
      cleanId.includes(cleanQuery) ||
      rawPub.includes(rawQuery) ||
      cleanPub.includes(cleanQuery) ||
      title.includes(rawQuery) ||
      assignee.includes(rawQuery) ||
      inventors.includes(rawQuery)
    );
  });
};

export const PatentSelector: React.FC<Props> = ({
  patents: rawPatents,
  selectedPatentId,
  onSelect,
  label,
  placeholder = 'Select workspace patent...',
  width = '100%',
  showSummary = false,
  onNavigateWorkspace
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Normalize patents list
  const normalizedPatents = rawPatents.map(normalizePatent);

  // Load recently used patent IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_PATENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentIds(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse recent patents from localStorage:', e);
    }
  }, []);

  // Save selection to recent list
  const recordRecentSelection = (patentId: string) => {
    try {
      const updated = [patentId, ...recentIds.filter(id => id !== patentId)].slice(0, 5);
      setRecentIds(updated);
      localStorage.setItem(RECENT_PATENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent patent selection:', e);
    }
  };

  // Currently selected patent object
  const selectedPatent = normalizedPatents.find(p => p.id === selectedPatentId) || normalizedPatents[0];

  // Auto-clear invalid selection if patent was deleted
  useEffect(() => {
    if (selectedPatentId && normalizedPatents.length > 0 && !normalizedPatents.some(p => p.id === selectedPatentId)) {
      onSelect(normalizedPatents[0].id);
    }
  }, [normalizedPatents, selectedPatentId, onSelect]);

  // Filtered search results
  const filteredPatents = filterWorkspacePatents(normalizedPatents, searchQuery);

  // Filter valid recent patents present in current workspace
  const validRecentPatents = recentIds
    .map(id => normalizedPatents.find(p => p.id === id))
    .filter((p): p is WorkspacePatentOption => p !== undefined);

  // Combine options list for keyboard navigation
  const selectableList = searchQuery.trim() 
    ? filteredPatents 
    : [...validRecentPatents, ...normalizedPatents.filter(p => !validRecentPatents.some(r => r.id === p.id))];

  // Check dropdown position relative to viewport on open
  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 380 && rect.top > 380);
    }
    setIsOpen(!isOpen);
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Click outside and ESC listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < selectableList.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : selectableList.length - 1));
      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < selectableList.length) {
        e.preventDefault();
        handleSelectPatent(selectableList[focusedIndex].id);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, selectableList]);

  const handleSelectPatent = (patentId: string) => {
    onSelect(patentId);
    recordRecentSelection(patentId);
    setIsOpen(false);
  };

  return (
    <div style={{ width: width, position: 'relative' }} ref={containerRef}>
      {label && (
        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <FolderKanban size={16} color="var(--accent-cyan)" />
          {label}
        </label>
      )}

      {/* Collapsed Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={handleToggle}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 14px',
          background: 'var(--bg-input)',
          border: '1px solid',
          borderColor: isOpen ? 'var(--accent-cyan)' : 'var(--border-color)',
          borderRadius: '10px',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 15px rgba(0, 242, 254, 0.2)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1, paddingRight: '8px' }}>
          <Search size={16} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          {selectedPatent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.88rem', flexShrink: 0 }}>
                {selectedPatent.publicationNumber}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
              <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedPatent.title}
              </span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>{placeholder}</span>
          )}
        </div>

        <ChevronDown 
          size={16} 
          color="var(--text-muted)" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} 
        />
      </button>

      {/* Expanded Command-Style Dropdown Popover */}
      {isOpen && (
        <div 
          role="listbox"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            ...(openUpward ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
            zIndex: 600,
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: '12px',
            boxShadow: '0 16px 36px rgba(0,0,0,0.65), var(--shadow-glow)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '400px'
          }}
        >
          {/* Top Search Input Bar */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="var(--accent-cyan)" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFocusedIndex(0);
              }}
              placeholder="Search by patent number, title, assignee..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                padding: '2px 0'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            )}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, flexShrink: 0 }}>
              {filteredPatents.length} {filteredPatents.length === 1 ? 'patent' : 'patents'}
            </span>
          </div>

          {/* Scrollable Patent Items Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {normalizedPatents.length === 0 ? (
              /* Empty Workspace State */
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileText size={28} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  No patents available in workspace.
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  Import a patent first to use Claim Decomposition.
                </div>
                {onNavigateWorkspace && (
                  <button 
                    onClick={onNavigateWorkspace}
                    className="btn-primary" 
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                  >
                    Go to Patent Workspace <ExternalLink size={12} />
                  </button>
                )}
              </div>
            ) : filteredPatents.length === 0 ? (
              /* Empty Search Results State */
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Search size={24} color="var(--text-dim)" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  No workspace patents match "{searchQuery}".
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Try searching by patent number (e.g. US11604965B2) or keywords.
                </div>
              </div>
            ) : searchQuery.trim() ? (
              /* Active Search Results List */
              <div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', padding: '4px 8px 6px' }}>
                  SEARCH RESULTS ({filteredPatents.length})
                </div>
                {filteredPatents.map((p, idx) => (
                  <PatentCardItem
                    key={p.id}
                    patent={p}
                    isSelected={p.id === selectedPatentId}
                    isFocused={focusedIndex === idx}
                    onSelect={() => handleSelectPatent(p.id)}
                  />
                ))}
              </div>
            ) : (
              /* Grouped List: RECENTLY USED & ALL PATENTS */
              <div>
                {validRecentPatents.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.70rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', padding: '4px 8px 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} /> RECENTLY USED
                    </div>
                    {validRecentPatents.map((p, idx) => (
                      <PatentCardItem
                        key={`recent_${p.id}`}
                        patent={p}
                        isSelected={p.id === selectedPatentId}
                        isFocused={focusedIndex === idx}
                        onSelect={() => handleSelectPatent(p.id)}
                      />
                    ))}
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', padding: '4px 8px 6px', borderTop: validRecentPatents.length > 0 ? '1px solid var(--border-color)' : 'none', paddingTop: validRecentPatents.length > 0 ? '10px' : '4px' }}>
                    ALL WORKSPACE PATENTS ({normalizedPatents.length})
                  </div>
                  {normalizedPatents.map((p, idx) => {
                    const navIndex = validRecentPatents.length + idx;
                    return (
                      <PatentCardItem
                        key={p.id}
                        patent={p}
                        isSelected={p.id === selectedPatentId}
                        isFocused={focusedIndex === navIndex}
                        onSelect={() => handleSelectPatent(p.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional Compact Selected Patent Summary Box Below Selector */}
      {showSummary && selectedPatent && (
        <div style={{
          marginTop: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(0, 242, 254, 0.04)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.80rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{selectedPatent.publicationNumber}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedPatent.title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{selectedPatent.source}</span>
            <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{selectedPatent.claimCount} Claims</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual patent option item
const PatentCardItem: React.FC<{
  patent: WorkspacePatentOption;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: () => void;
}> = ({ patent, isSelected, isFocused, onSelect }) => {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: isSelected 
          ? 'var(--accent-cyan)' 
          : isFocused 
          ? 'rgba(0, 242, 254, 0.3)' 
          : 'transparent',
        background: isSelected 
          ? 'rgba(0, 242, 254, 0.10)' 
          : isFocused 
          ? 'var(--bg-surface)' 
          : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '4px',
        transition: 'all 0.15s ease'
      }}
      className="hover-highlight"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ 
            fontSize: '0.88rem', 
            fontWeight: 800, 
            color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
            fontFamily: 'var(--font-mono)'
          }}>
            {patent.publicationNumber}
          </span>
          {patent.assignee && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              • {patent.assignee}
            </span>
          )}
        </div>

        {/* Title with line-clamp 2 */}
        <div style={{
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: '1.35',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '6px'
        }}>
          {patent.title}
        </div>

        {/* Badges footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="badge badge-cyan" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
            {patent.source || 'USPTO'}
          </span>
          <span className="badge badge-indigo" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
            {patent.claimCount ? `${patent.claimCount} Claims` : 'Claims unavailable'}
          </span>
        </div>
      </div>

      {isSelected && (
        <Check size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '4px' }} />
      )}
    </div>
  );
};
