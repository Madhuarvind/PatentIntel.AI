import React, { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Check, MapPin, Sparkles, AlertCircle, X } from 'lucide-react';
import { organizationService } from '../services/organizationService';
import type { Organization } from '../data/organizations';

interface Props {
  value: string;
  onChange: (canonicalName: string) => void;
  placeholder?: string;
}

export const OrganizationSelector: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Search institution or organization"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<Organization[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Perform search whenever query or dropdown state changes
  useEffect(() => {
    if (isOpen) {
      const results = organizationService.searchOrganizations(query, 7);
      setSuggestions(results);
      setHighlightedIndex(0);
    }
  }, [query, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrganization = (org: Organization) => {
    organizationService.incrementUsage(org.id);
    onChange(org.officialName);
    setQuery(org.officialName);
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const handleOpenCustomMode = (initialText: string = '') => {
    setCustomInput(initialText || query);
    setCustomError(null);
    setIsCustomMode(true);
    setIsOpen(false);
    setTimeout(() => {
      customInputRef.current?.focus();
    }, 50);
  };

  const handleSaveCustomOrganization = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    
    if (!trimmed || trimmed.length < 3) {
      setCustomError('Institution name must be at least 3 characters long.');
      return;
    }

    try {
      const savedOrg = organizationService.saveUserOrganization(trimmed);
      onChange(savedOrg.officialName);
      setQuery(savedOrg.officialName);
      setIsCustomMode(false);
      setCustomError(null);
    } catch (err: any) {
      setCustomError(err.message || 'Failed to save organization.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    // Total selectable options = suggestions length + 1 (the "+ Other" option)
    const totalOptions = suggestions.length + 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % totalOptions);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex < suggestions.length) {
          handleSelectOrganization(suggestions[highlightedIndex]);
        } else {
          // Selected "+ Other"
          handleOpenCustomMode(query);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {!isCustomMode ? (
        <>
          <div style={{ position: 'relative' }}>
            <Building2
              size={19}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: query ? 'var(--accent-cyan)' : 'var(--text-muted)',
                transition: 'color 0.2s ease'
              }}
            />
            <input
              ref={inputRef}
              type="text"
              required
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onChange(e.target.value); // keep state responsive
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              className="input-field"
              style={{
                width: '100%',
                padding: '12px 14px 12px 44px',
                background: 'var(--bg-card-solid)',
                border: isOpen
                  ? '1px solid var(--accent-cyan)'
                  : '1px solid rgba(21,51,60,0.12)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                outline: 'none',
                boxShadow: isOpen ? '0 0 16px rgba(34,104,88,0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          {/* SEARCHABLE DROPDOWN MENU */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'var(--bg-card-solid)',
                border: '1px solid rgba(34,104,88,0.3)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 100,
                maxHeight: '320px',
                overflowY: 'auto',
                padding: '6px'
              }}
            >
              {suggestions.length > 0 ? (
                suggestions.map((org, index) => {
                  const isHighlighted = index === highlightedIndex;
                  const isSelected = value === org.officialName;

                  return (
                    <div
                      key={org.id}
                      onClick={() => handleSelectOrganization(org)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isHighlighted
                          ? 'rgba(34,104,88,0.12)'
                          : 'transparent',
                        borderLeft: isHighlighted
                          ? '3px solid var(--accent-cyan)'
                          : '3px solid transparent',
                        transition: 'all 0.15s ease',
                        marginBottom: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isHighlighted ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                          {org.officialName}
                        </div>
                        {isSelected && <Check size={16} color="var(--accent-cyan)" />}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {org.city && org.state && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="var(--text-muted)" /> {org.city}, {org.state}
                          </span>
                        )}
                        <span>•</span>
                        <span style={{
                          background: 'rgba(21,51,60,0.06)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: 'var(--text-muted)'
                        }}>
                          {org.type}
                        </span>
                        {org.source === 'user_added' && (
                          <span style={{
                            background: 'rgba(112,76,135,0.15)',
                            color: 'var(--accent-purple)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}>
                            User Added
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No matching institution found.
                </div>
              )}

              {/* ALWAYS VISIBLE "+ OTHER" OPTION AT BOTTOM */}
              <div
                onClick={() => handleOpenCustomMode(query)}
                onMouseEnter={() => setHighlightedIndex(suggestions.length)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: highlightedIndex === suggestions.length
                    ? 'rgba(55,86,125,0.18)'
                    : 'rgba(21,51,60,0.04)',
                  border: '1px dashed rgba(55,86,125,0.4)',
                  color: 'var(--accent-indigo)',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} /> + Other institution / organization
              </div>
            </div>
          )}
        </>
      ) : (
        /* CUSTOM ORGANIZATION INPUT FORM INLINE */
        <div style={{
          background: 'var(--bg-card-solid)',
          border: '1px solid rgba(55,86,125,0.4)',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Add Custom Organization / Institution
            </span>
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              ref={customInputRef}
              type="text"
              placeholder="Enter your institution or organization name"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setCustomError(null);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-card-solid)',
                border: customError ? '1px solid var(--accent-rose)' : '1px solid rgba(21,51,60,0.15)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {customError && (
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} /> {customError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSaveCustomOrganization}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'linear-gradient(135deg, var(--accent-indigo) 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} /> Save Organization
            </button>
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              style={{
                padding: '8px 12px',
                background: 'rgba(21,51,60,0.08)',
                border: '1px solid rgba(21,51,60,0.12)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
