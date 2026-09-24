import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Languages, 
  X, 
  Layers, 
  GitBranch, 
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface ClaimItem {
  number: number;
  text: string;
  type: string;
  isIndependent: boolean;
  parentClaimNumber?: number;
}

interface ClaimNavigatorProps {
  claims: ClaimItem[];
  selectedClaimNumber: number;
  onSelectClaim: (claimNumber: number) => void;
  limitationCount?: number;
  onOpenTranslator?: () => void;
  patentId?: string;
}

export const ClaimNavigator: React.FC<ClaimNavigatorProps> = ({
  claims,
  selectedClaimNumber,
  onSelectClaim,
  limitationCount,
  onOpenTranslator
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'independent' | 'dependent'>('all');
  const [viewStyle, setViewStyle] = useState<'tree' | 'flat'>('tree');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Current active claim
  const currentClaimIndex = claims.findIndex(c => c.number === selectedClaimNumber);
  const currentClaim = claims[currentClaimIndex] || claims[0];

  // Groupings
  const independentClaims = useMemo(() => claims.filter(c => c.isIndependent), [claims]);
  const dependentClaims = useMemo(() => claims.filter(c => !c.isIndependent), [claims]);

  // Find root independent claim for active claim
  const activeRootClaimNumber = useMemo(() => {
    if (!currentClaim) return 1;
    if (currentClaim.isIndependent) return currentClaim.number;
    if (currentClaim.parentClaimNumber) {
      // Trace back
      let parent = claims.find(c => c.number === currentClaim.parentClaimNumber);
      while (parent && !parent.isIndependent && parent.parentClaimNumber) {
        parent = claims.find(c => c.number === parent!.parentClaimNumber);
      }
      if (parent) return parent.number;
      return currentClaim.parentClaimNumber;
    }
    // Fallback: previous independent claim
    const prevIndep = independentClaims.filter(ind => ind.number <= currentClaim.number).pop();
    return prevIndep?.number || 1;
  }, [currentClaim, claims, independentClaims]);

  // Active family claims (Root + its dependent children)
  const activeFamilyClaims = useMemo(() => {
    const root = claims.find(c => c.number === activeRootClaimNumber);
    if (!root) return [currentClaim];
    const deps = claims.filter(c => !c.isIndependent && (c.parentClaimNumber === root.number || (c.number > root.number && c.number < (independentClaims.find(i => i.number > root.number)?.number || 999))));
    return [root, ...deps];
  }, [claims, activeRootClaimNumber, independentClaims, currentClaim]);

  // Steppers
  const handlePrevClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentClaimIndex > 0) {
      onSelectClaim(claims[currentClaimIndex - 1].number);
    }
  };

  const handleNextClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentClaimIndex < claims.length - 1) {
      onSelectClaim(claims[currentClaimIndex + 1].number);
    }
  };

  // Filtered claims in dropdown
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      if (activeTab === 'independent' && !c.isIndependent) return false;
      if (activeTab === 'dependent' && c.isIndependent) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = String(c.number) === q || `claim ${c.number}`.includes(q);
        const textMatch = c.text.toLowerCase().includes(q);
        return numMatch || textMatch;
      }
      return true;
    });
  }, [claims, activeTab, searchQuery]);

  // Hierarchical tree for dropdown
  const claimTree = useMemo(() => {
    const tree: Array<{ parent: ClaimItem; children: ClaimItem[] }> = [];
    const parentMap = new Map<number, ClaimItem[]>();

    independentClaims.forEach(parent => {
      parentMap.set(parent.number, []);
    });

    const unassigned: ClaimItem[] = [];

    dependentClaims.forEach(dep => {
      if (dep.parentClaimNumber && parentMap.has(dep.parentClaimNumber)) {
        parentMap.get(dep.parentClaimNumber)!.push(dep);
      } else {
        const prevIndep = independentClaims.filter(ind => ind.number < dep.number).pop();
        if (prevIndep && parentMap.has(prevIndep.number)) {
          parentMap.get(prevIndep.number)!.push(dep);
        } else {
          unassigned.push(dep);
        }
      }
    });

    independentClaims.forEach(parent => {
      const children = parentMap.get(parent.number) || [];
      // Apply search query filter to tree if active
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const parentMatches = String(parent.number) === q || parent.text.toLowerCase().includes(q);
        const filteredChildren = children.filter(c => String(c.number) === q || c.text.toLowerCase().includes(q));
        if (parentMatches || filteredChildren.length > 0) {
          tree.push({ parent, children: parentMatches ? children : filteredChildren });
        }
      } else {
        tree.push({ parent, children });
      }
    });

    if (unassigned.length > 0 && !searchQuery.trim()) {
      tree.push({
        parent: {
          number: 0,
          text: 'Other Dependent Claims',
          type: 'dependent',
          isIndependent: false
        },
        children: unassigned
      });
    }

    return tree;
  }, [independentClaims, dependentClaims, searchQuery]);

  // Formatted excerpt for active claim
  const claimExcerpt = useMemo(() => {
    if (!currentClaim?.text) return '';
    const clean = currentClaim.text.replace(/^\s*(?:Claim\s*)?\d+[\.\:]\s*/i, '').trim();
    return clean;
  }, [currentClaim]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative'
    }}>
      {/* Top Row: Sleek Unified Claim Combobox Selector & Quick Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Luxury Combobox Trigger */}
        <div style={{ position: 'relative', flex: 1, minWidth: '340px' }}>
          <button
            ref={triggerRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.75) 100%)',
              border: isDropdownOpen 
                ? '1px solid var(--accent-indigo)' 
                : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isDropdownOpen 
                ? '0 0 0 3px rgba(99, 102, 241, 0.2), 0 8px 24px rgba(0, 0, 0, 0.4)' 
                : '0 4px 16px rgba(0, 0, 0, 0.25)',
              borderRadius: '12px',
              padding: '12px 18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              textAlign: 'left',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              outline: 'none'
            }}
          >
            {/* Active Claim Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
              {/* Claim Number Badge */}
              <div style={{
                background: currentClaim?.isIndependent 
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)' 
                  : 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                border: currentClaim?.isIndependent 
                  ? '1px solid var(--accent-cyan)' 
                  : '1px solid var(--accent-purple)',
                color: currentClaim?.isIndependent ? '#38bdf8' : '#c084fc',
                borderRadius: '8px',
                padding: '5px 12px',
                fontWeight: 900,
                fontSize: '0.94rem',
                letterSpacing: '-0.01em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                boxShadow: currentClaim?.isIndependent 
                  ? '0 0 12px rgba(6, 182, 212, 0.25)' 
                  : '0 0 12px rgba(168, 85, 247, 0.25)'
              }}>
                {currentClaim?.isIndependent ? <Sparkles size={13} /> : <GitBranch size={13} />}
                <span>Claim {currentClaim?.number}</span>
              </div>

              {/* Status Pill & Text snippet */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: currentClaim?.isIndependent ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                    background: currentClaim?.isIndependent ? 'rgba(6, 182, 212, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {currentClaim?.isIndependent ? 'Independent Root Claim' : `↳ Dependent on Claim ${currentClaim?.parentClaimNumber || '1'}`}
                  </span>

                  {limitationCount !== undefined && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      • <Layers size={12} style={{ color: 'var(--accent-indigo)' }} /> {limitationCount} Limitations
                    </span>
                  )}
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  "{claimExcerpt}"
                </div>
              </div>
            </div>

            {/* Dropdown Chevron Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '12px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                {claims.length} Claims
              </span>
              <ChevronDown 
                size={16} 
                style={{ 
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease',
                  color: isDropdownOpen ? 'var(--accent-indigo)' : 'var(--text-muted)'
                }} 
              />
            </div>
          </button>

          {/* Floating Luxury Dropdown Panel */}
          {isDropdownOpen && (
            <div 
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '100%',
                maxWidth: '680px',
                background: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '14px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 20px rgba(99, 102, 241, 0.15)',
                backdropFilter: 'blur(24px)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              {/* Dropdown Search & Filter Header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  {/* Search Input */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    flex: 1
                  }}>
                    <Search size={15} style={{ color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      placeholder="Type claim number (e.g. 4) or keyword (e.g. processor)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.84rem',
                        outline: 'none',
                        width: '100%'
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* View Mode Toggle: Tree vs Flat */}
                  <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                    <button
                      onClick={() => setViewStyle('tree')}
                      style={{
                        background: viewStyle === 'tree' ? 'var(--accent-indigo)' : 'transparent',
                        color: viewStyle === 'tree' ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Tree View
                    </button>
                    <button
                      onClick={() => setViewStyle('flat')}
                      style={{
                        background: viewStyle === 'flat' ? 'var(--accent-indigo)' : 'transparent',
                        color: viewStyle === 'flat' ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Flat List
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setActiveTab('all')}
                    style={{
                      background: activeTab === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                      border: activeTab === 'all' ? '1px solid var(--accent-indigo)' : '1px solid transparent',
                      color: activeTab === 'all' ? '#fff' : 'var(--text-muted)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    All ({claims.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('independent')}
                    style={{
                      background: activeTab === 'independent' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                      border: activeTab === 'independent' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                      color: activeTab === 'independent' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Independent Roots ({independentClaims.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('dependent')}
                    style={{
                      background: activeTab === 'dependent' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                      border: activeTab === 'dependent' ? '1px solid var(--accent-purple)' : '1px solid transparent',
                      color: activeTab === 'dependent' ? 'var(--accent-purple)' : 'var(--text-muted)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Dependent ({dependentClaims.length})
                  </button>
                </div>
              </div>

              {/* Dropdown Scrollable Content (Custom Clean Dark Scrollbar) */}
              <div style={{
                maxHeight: '380px',
                overflowY: 'auto',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99, 102, 241, 0.4) transparent'
              }}>
                {viewStyle === 'tree' ? (
                  // Tree View
                  claimTree.map(({ parent, children }) => {
                    const isParentSelected = parent.number === selectedClaimNumber;
                    return (
                      <div 
                        key={parent.number}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '10px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        {/* Parent Independent Claim */}
                        <div
                          onClick={() => {
                            onSelectClaim(parent.number);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: isParentSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: isParentSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: isParentSelected ? '#fff' : 'var(--accent-cyan)' }}>
                              Claim {parent.number}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              background: 'rgba(6, 182, 212, 0.15)',
                              color: 'var(--accent-cyan)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              INDEPENDENT ROOT
                            </span>
                            <span style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-dim)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}>
                              {parent.text.replace(/^\s*\d+[\.\:]\s*/, '').slice(0, 60)}...
                            </span>
                          </div>
                          {isParentSelected && <Check size={15} style={{ color: 'var(--accent-cyan)' }} />}
                        </div>

                        {/* Dependent Branches */}
                        {children.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            paddingLeft: '16px',
                            marginLeft: '10px',
                            borderLeft: '2px dashed rgba(139, 92, 246, 0.3)'
                          }}>
                            {children.map(child => {
                              const isChildSelected = child.number === selectedClaimNumber;
                              return (
                                <div
                                  key={child.number}
                                  onClick={() => {
                                    onSelectClaim(child.number);
                                    setIsDropdownOpen(false);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    background: isChildSelected ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                                    border: isChildSelected ? '1px solid var(--accent-purple)' : '1px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.12s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isChildSelected ? '#fff' : 'var(--accent-purple)' }}>
                                      ↳ Claim {child.number}
                                    </span>
                                    <span style={{
                                      fontSize: '0.76rem',
                                      color: 'var(--text-dim)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      flex: 1
                                    }}>
                                      {child.text.replace(/^\s*\d+[\.\:]\s*/, '').slice(0, 75)}...
                                    </span>
                                  </div>
                                  {isChildSelected && <Check size={14} style={{ color: 'var(--accent-purple)' }} />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Flat List
                  filteredClaims.map(clm => {
                    const isSelected = clm.number === selectedClaimNumber;
                    return (
                      <div
                        key={clm.number}
                        onClick={() => {
                          onSelectClaim(clm.number);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid rgba(255, 255, 255, 0.06)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                            Claim {clm.number}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: clm.isIndependent ? 'rgba(6, 182, 212, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            color: clm.isIndependent ? 'var(--accent-cyan)' : 'var(--accent-purple)'
                          }}>
                            {clm.isIndependent ? 'Independent' : `Dep on ${clm.parentClaimNumber || '1'}`}
                          </span>
                          <span style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-dim)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}>
                            {clm.text.replace(/^\s*\d+[\.\:]\s*/, '').slice(0, 60)}...
                          </span>
                        </div>
                        {isSelected && <Check size={14} style={{ color: 'var(--accent-indigo)' }} />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Stepper & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Stepper Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '3px 4px'
          }}>
            <button
              onClick={handlePrevClaim}
              disabled={currentClaimIndex <= 0}
              title="Previous Claim"
              style={{
                background: 'transparent',
                border: 'none',
                color: currentClaimIndex <= 0 ? 'var(--text-dim)' : 'var(--text-main)',
                cursor: currentClaimIndex <= 0 ? 'not-allowed' : 'pointer',
                padding: '6px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                opacity: currentClaimIndex <= 0 ? 0.35 : 1
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-main)',
              padding: '0 8px',
              whiteSpace: 'nowrap'
            }}>
              {currentClaimIndex + 1} <span style={{ color: 'var(--text-dim)' }}>/</span> {claims.length}
            </span>

            <button
              onClick={handleNextClaim}
              disabled={currentClaimIndex >= claims.length - 1}
              title="Next Claim"
              style={{
                background: 'transparent',
                border: 'none',
                color: currentClaimIndex >= claims.length - 1 ? 'var(--text-dim)' : 'var(--text-main)',
                cursor: currentClaimIndex >= claims.length - 1 ? 'not-allowed' : 'pointer',
                padding: '6px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                opacity: currentClaimIndex >= claims.length - 1 ? 0.35 : 1
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Plain-English Translate Button */}
          {onOpenTranslator && (
            <button
              className="btn-secondary"
              onClick={onOpenTranslator}
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <Languages size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span>Translate</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Contextual Quick-Pill Switcher (Root Anchors or Active Family) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        padding: '10px 14px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <span style={{
          fontSize: '0.74rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-dim)',
          whiteSpace: 'nowrap'
        }}>
          {currentClaim?.isIndependent ? 'Independent Root Anchors:' : `Tree Context (Claim ${activeRootClaimNumber} Family):`}
        </span>

        {/* Dynamic Context Pills: Only 5 to 7 relevant pills, NEVER 45! */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {(currentClaim?.isIndependent ? independentClaims.slice(0, 8) : activeFamilyClaims.slice(0, 8)).map(clm => {
            const isSelected = clm.number === selectedClaimNumber;
            return (
              <button
                key={clm.number}
                onClick={() => onSelectClaim(clm.number)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: isSelected 
                    ? (clm.isIndependent ? '1.5px solid var(--accent-cyan)' : '1.5px solid var(--accent-purple)')
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected 
                    ? (clm.isIndependent ? 'rgba(6, 182, 212, 0.25)' : 'rgba(168, 85, 247, 0.25)')
                    : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected 
                    ? '#fff' 
                    : (clm.isIndependent ? 'var(--accent-cyan)' : 'var(--text-muted)'),
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected 
                    ? (clm.isIndependent ? '0 0 10px rgba(6, 182, 212, 0.3)' : '0 0 10px rgba(168, 85, 247, 0.3)')
                    : 'none'
                }}
              >
                {clm.isIndependent && <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>★</span>}
                <span>Claim {clm.number}</span>
                {!clm.isIndependent && (
                  <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>↳{clm.parentClaimNumber || '1'}</span>
                )}
              </button>
            );
          })}

          {/* Quick Browse More Link */}
          <button
            onClick={() => setIsDropdownOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-indigo)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px'
            }}
          >
            <span>Browse All {claims.length} Claims</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
