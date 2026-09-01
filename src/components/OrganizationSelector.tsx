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
                color: query ? '#00F2FE' : '#64748B',
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
                background: 'rgba(15, 23, 42, 0.6)',
                border: isOpen
                  ? '1px solid #00F2FE'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '0.92rem',
                outline: 'none',
                boxShadow: isOpen ? '0 0 16px rgba(0, 242, 254, 0.2)' : 'none',
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
                background: '#0F172A',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '14px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
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
                          ? 'rgba(0, 242, 254, 0.12)'
                          : 'transparent',
                        borderLeft: isHighlighted
                          ? '3px solid #00F2FE'
                          : '3px solid transparent',
                        transition: 'all 0.15s ease',
                        marginBottom: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isHighlighted ? '#00F2FE' : '#F8FAFC' }}>
                          {org.officialName}
                        </div>
                        {isSelected && <Check size={16} color="#00F2FE" />}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.76rem', color: '#94A3B8' }}>
                        {org.city && org.state && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#64748B" /> {org.city}, {org.state}
                          </span>
                        )}
                        <span>•</span>
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: '#CBD5E1'
                        }}>
                          {org.type}
                        </span>
                        {org.source === 'user_added' && (
                          <span style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#C084FC',
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
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8' }}>
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
                    ? 'rgba(99, 102, 241, 0.18)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: '1px dashed rgba(99, 102, 241, 0.4)',
                  color: '#6366F1',
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
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Add Custom Organization / Institution
            </span>
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
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
                background: '#0B0F19',
                border: customError ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {customError && (
            <div style={{ fontSize: '0.78rem', color: '#EF4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
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
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#CBD5E1',
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
