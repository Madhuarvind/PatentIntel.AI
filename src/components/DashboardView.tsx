import React, { useState, useEffect, useMemo } from 'react';
import type { ModuleView } from '../types';
import { workspaceStore } from '../services/workspaceStore';
import { 
  FolderKanban, 
  Search, 
  GitCompare, 
  TrendingUp, 
  FileCheck, 
  ShieldCheck, 
  ArrowUpRight,
  Zap,
  BookOpen,
  PlusCircle,
  Layers,
  Cpu,
  ExternalLink,
  RotateCcw,
  Building2,
  Filter,
  CheckCircle2,
  FileText,
  Eye
} from 'lucide-react';

interface Props {
  onNavigate: (view: ModuleView) => void;
  onOpenLiterature: (query?: string) => void;
}

export const DashboardView: React.FC<Props> = ({ onNavigate, onOpenLiterature }) => {
  const [patents, setPatents] = useState(workspaceStore.getPatents());
  const [metrics, setMetrics] = useState(workspaceStore.getMetrics());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCpcFilter, setSelectedCpcFilter] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState(workspaceStore.getActivityLog());

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setPatents(workspaceStore.getPatents());
      setMetrics(workspaceStore.getMetrics());
      setActivityLogs(workspaceStore.getActivityLog());
    });
    return unsubscribe;
  }, []);

  const filteredPatents = useMemo(() => {
    return patents.filter(p => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || 
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.assignee && p.assignee.toLowerCase().includes(q)) ||
        (p.cpcCodes && p.cpcCodes.some(c => c.toLowerCase().includes(q)));

      const matchesCpc = !selectedCpcFilter || 
        (p.cpcCodes && p.cpcCodes.some(c => c.toUpperCase().startsWith(selectedCpcFilter.toUpperCase())));

      return matchesSearch && matchesCpc;
    });
  }, [patents, searchTerm, selectedCpcFilter]);

  const handleInspectClaims = (patentId: string) => {
    workspaceStore.setActivePatent(patentId);
    onNavigate('claims');
  };

  const handleCompareMapping = (patentId: string) => {
    workspaceStore.setActivePatent(patentId);
    onNavigate('mapping');
  };

  const handleResetToDefault = () => {
    workspaceStore.resetToDefault();
    setSelectedCpcFilter(null);
    setSearchTerm('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner / Executive Welcome */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(99, 102, 241, 0.09) 50%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.22)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ flex: '1 1 560px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
              <Zap size={12} /> Claim-Centric Patent Intelligence System
            </span>
            <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> Local Workspace
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            PatentIntel R&D Executive Workspace
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '720px', lineHeight: '1.55', margin: 0 }}>
            Enterprise examination suite integrating real-time USPTO/EPO patent ingestion, hierarchical claim limitation decomposition, prior-art element coverage mapping, and academic literature cross-referencing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => onNavigate('search')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}>
            <Search size={16} /> Start Prior-Art Search
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('claims')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}>
            <FileText size={16} /> Decompose Claims
          </button>
          <button className="btn-secondary" onClick={() => onOpenLiterature('patent claim decomposition semantic retrieval')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}>
            <BookOpen size={16} /> Academic Literature
          </button>
        </div>
      </div>

      {/* Real-Time Dynamic Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Active Patents */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--accent-cyan)' }}>
              <FolderKanban size={22} />
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
              <TrendingUp size={12} /> Live Session
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1' }}>
            {metrics.totalPatents}
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
            Patents In Session
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {metrics.grantedCount} Granted · {metrics.applicationsCount} Applications
          </div>
        </div>

        {/* Card 2: Decomposed Claims */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--accent-indigo)' }}>
              <FileCheck size={22} />
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, background: 'rgba(0, 242, 254, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
              <Zap size={12} /> {metrics.avgClaimsPerPatent} / patent
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1' }}>
            {metrics.totalClaims}
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
            Claims Decomposed
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {metrics.independentClaims} Independent · {metrics.dependentClaims} Dependent
          </div>
        </div>

        {/* Card 3: Technical Limitations */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--accent-emerald)' }}>
              <Layers size={22} />
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
              {metrics.avgElementsPerClaim} / claim
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1' }}>
            {metrics.totalElements}
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
            Technical Limitations
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Atomic units for § 102/103 mapping
          </div>
        </div>

        {/* Card 4: CPC Classifications */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--accent-purple)' }}>
              <Cpu size={22} />
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-purple)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, background: 'rgba(168, 85, 247, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
              WIPO / CPC
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1' }}>
            {metrics.cpcDistribution.length}
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
            Technology Domains
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Leading: {metrics.cpcDistribution[0]?.code || 'G08G'} ({metrics.cpcDistribution[0]?.percentage || 0}%)
          </div>
        </div>

        {/* Card 5: Decomposition Coverage */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--accent-amber)' }}>
              <ShieldCheck size={22} />
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
              Parsed
            </span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.1' }}>
            {metrics.decompositionCoverage}%
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
            Decomposition Coverage
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Claims with parsed elements; accuracy not assessed
          </div>
        </div>
      </div>

      {/* Two-Column Analytics: Technology Domains & Portfolio Concentration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Left: CPC Technology Subclass Breakdown */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Technology Domain Distribution (CPC)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Hierarchical classification breakdown across active patents
              </p>
            </div>
            {selectedCpcFilter && (
              <button 
                onClick={() => setSelectedCpcFilter(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--accent-cyan)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', cursor: 'pointer' }}
              >
                Clear Filter ({selectedCpcFilter})
              </button>
            )}
          </div>

          {metrics.cpcDistribution.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No CPC classifications recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {metrics.cpcDistribution.map(item => {
                const isSelected = selectedCpcFilter === item.code;
                return (
                  <div 
                    key={item.code} 
                    onClick={() => setSelectedCpcFilter(isSelected ? null : item.code)}
                    style={{ 
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                      border: isSelected ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                        {item.code} — <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{item.label}</span>
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.max(item.percentage, 8)}%`, 
                        height: '100%', 
                        background: isSelected ? 'var(--accent-cyan)' : 'linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo))', 
                        borderRadius: '3px' 
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Portfolio Concentration & Assignees */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Portfolio Assignee Concentration
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Entity distribution and active jurisdictions
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {metrics.jurisdictionDistribution.map(j => (
                <span key={j.code} className="badge badge-indigo" style={{ fontSize: '0.72rem', padding: '3px 7px' }}>
                  {j.code}: {j.count}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.assigneeDistribution.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No assignee data recorded.
              </div>
            ) : (
              metrics.assigneeDistribution.map((a, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={16} color="var(--accent-indigo)" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {a.name}
                    </span>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.76rem' }}>
                    {a.count} {a.count === 1 ? 'patent' : 'patents'}
                  </span>
                </div>
              ))
            )}
          </div>

          {metrics.cpcDistribution[0] && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Target Domain: <strong>{metrics.cpcDistribution[0].code}</strong>
              </span>
              <button 
                className="btn-secondary"
                onClick={() => onOpenLiterature(`${metrics.cpcDistribution[0].label || metrics.cpcDistribution[0].code} machine learning state of the art`)}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                <BookOpen size={13} /> Query Preprints for {metrics.cpcDistribution[0].code} →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Core Workflow Module Pipeline (6 Comprehensive Modules) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 2px' }}>
              R&D Examination & Analytics Pipeline
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Direct access into deep claim analysis, semantic search, and patent synthesis workflows
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Module 01: Hybrid Search Engine */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('search')}
            style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-cyan">Module 01</span>
                <ArrowUpRight size={18} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Prior-Art Search
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                Search external patent and academic sources, or match query terms against local workspace records with visible source labels.
              </p>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                Launch Search Engine →
              </span>
            </div>
          </div>

          {/* Module 02: Claim Decomposition & Hierarchy */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('claims')}
            style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-indigo">Module 02</span>
                <ArrowUpRight size={18} color="var(--accent-indigo)" />
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Claim Decomposition & Tree
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                Extracts atomic claim limitations, classifies structural components, verifies 35 U.S.C. § 112 antecedent basis, and visualizes dependency trees.
              </p>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                Inspect Claim Limitations →
              </span>
            </div>
          </div>

          {/* Module 03: Claim-to-Claim Mapping */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('mapping')}
            style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-emerald">Module 03</span>
                <ArrowUpRight size={18} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Claim Element Mapping Matrix
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                Cross-references subject claim limitations against prior-art citations with verified element-by-element coverage and exportable charts.
              </p>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                Open Mapping Matrix →
              </span>
            </div>
          </div>

          {/* Module 04: Prior-Art Timeline & Vector Clusters */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('timeline')}
            style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-purple">Module 04</span>
                <ArrowUpRight size={18} color="var(--accent-purple)" />
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Prior-Art Trajectory & Clusters
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                Interactive temporal timeline of priority and filing milestones coupled with 2D UMAP/t-SNE semantic vector space projections.
              </p>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                View Trajectory Timeline →
              </span>
            </div>
          </div>

          {/* Module 05: Idea Novelty & FTO Collision */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('idea-novelty')}
            style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-amber">Module 05</span>
                <ArrowUpRight size={18} color="var(--accent-amber)" />
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Idea Novelty & FTO Risk Engine
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                Deconstructs R&D invention disclosures into concept limitations, identifies prior-art overlaps, and highlights white-space patent opportunities.
              </p>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                Evaluate Innovation Novelty →
              </span>
            </div>
          </div>

          {/* Module 06: Traceable Evidence & Examination Dossier */}
          <div 
            className="glass-panel glass-panel-hover" 
            onClick={() => onNavigate('ai-evidence')}
            style={{ padding: '22px', borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-cyan">Module 06</span>
                <ArrowUpRight size={18} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Traceable Evidence & Dossier
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                Generates verifiable patent examiner office-action responses, extracts grounded citation excerpts, and exports formatted legal dossiers.
              </p>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                Generate Examination Dossier →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Workspace Patent Repository Table (Interactive & Filterable) */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
              Live Workspace Patent Repository ({patents.length} Patents In Session)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Local records, including any sample records explicitly loaded for demonstration. Review provenance in Patent Workspace.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Table Search Filter */}
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by ID, title, assignee..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  color: 'var(--text-main)',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              className="btn-primary" 
              onClick={() => onNavigate('workspace')} 
              style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} /> Import Patents
            </button>

            <button 
              className="btn-secondary" 
              onClick={handleResetToDefault} 
              title="Add labeled examples without replacing imported records"
              style={{ fontSize: '0.82rem', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={13} /> Load Sample Records
            </button>
          </div>
        </div>

        {patents.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            <FolderKanban size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
            <h4 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Workspace is Currently Empty</h4>
            <p style={{ fontSize: '0.86rem', maxWidth: '480px', margin: '0 auto 16px' }}>
              No patent documents are loaded into the active session. You can restore standard reference patents or query live registries.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={handleResetToDefault}>
                <RotateCcw size={14} /> Restore Standard Reference Patents
              </button>
              <button className="btn-secondary" onClick={() => onNavigate('workspace')}>
                <PlusCircle size={14} /> Import Live Patent from USPTO API
              </button>
            </div>
          </div>
        ) : filteredPatents.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            <Filter size={28} color="var(--accent-indigo)" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
            <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>No patents match the current filter criteria ({searchTerm || selectedCpcFilter}).</p>
            <button 
              className="btn-secondary" 
              onClick={() => { setSearchTerm(''); setSelectedCpcFilter(null); }}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              Clear Search & CPC Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Patent ID</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Title & Subject Matter</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>CPC Subclass</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Assignee</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Scope</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Filing / Grant</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatents.map((p) => {
                  const claimCount = p.claims ? p.claims.length : 0;
                  const elementCount = p.claims ? p.claims.reduce((acc, c) => acc + (c.elements?.length || 0), 0) : 0;
                  const primaryCpc = p.cpcCodes?.[0] || 'Unclassified';
                  const externalUrl = p.sourceUrl || `https://patents.google.com/patent/${p.id}/en`;

                  return (
                    <tr 
                      key={p.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease'
                      }}
                      className="table-row-hover"
                    >
                      {/* Patent ID with kind badge */}
                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{p.id}</span>
                          {p.kindCode && (
                            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                              {p.kindCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td style={{ padding: '14px', maxWidth: '340px' }}>
                        <div 
                          title={p.title} 
                          style={{ 
                            fontWeight: 600, 
                            color: 'var(--text-main)', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            marginBottom: '2px'
                          }}
                        >
                          {p.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {p.inventors && p.inventors.length > 0 ? p.inventors.slice(0, 2).join(', ') : 'Inventor disclosed in filing'}
                          {p.inventors && p.inventors.length > 2 && ' et al.'}
                        </div>
                      </td>

                      {/* Primary CPC */}
                      <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                        <span 
                          className="badge badge-indigo" 
                          title={primaryCpc}
                          style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                        >
                          {primaryCpc}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td style={{ padding: '14px', color: 'var(--text-muted)', maxWidth: '180px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.assignee || 'Independent / Unassigned'}
                        </div>
                      </td>

                      {/* Scope (claims & limitations) */}
                      <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.82rem' }}>
                          {claimCount} {claimCount === 1 ? 'Claim' : 'Claims'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
                          {elementCount} limitations
                        </div>
                      </td>

                      {/* Dates */}
                      <td style={{ padding: '14px', fontSize: '0.76rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        <div>Filed: {p.filingDate || 'Disclosed'}</div>
                        <div>Issued: {p.issueDate || p.grantDate || p.publicationDate || 'Pending'}</div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleInspectClaims(p.id)}
                            className="btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Inspect parsed claim limitations in Module 02"
                          >
                            <Eye size={12} /> Inspect
                          </button>

                          <button 
                            onClick={() => handleCompareMapping(p.id)}
                            className="btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Cross-reference claims in Module 03 Mapping Matrix"
                          >
                            <GitCompare size={12} /> Map
                          </button>

                          <a 
                            href={externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '5px 8px', display: 'inline-flex', alignItems: 'center', color: 'var(--text-dim)' }}
                            title="View official registry record"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provenance Audit Trail & Recent Activity Card */}
      {activityLogs.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" /> Examination Provenance & Audit Trail
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Last {Math.min(activityLogs.length, 4)} logged examination actions
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {activityLogs.slice(0, 4).map((log, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '3px' }}>
                  <span>{log.user}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                  {log.action}: <span style={{ color: 'var(--accent-cyan)' }}>{log.patentId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
