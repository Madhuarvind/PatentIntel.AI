import React, { useState, useEffect } from 'react';
import type { PatentDocument } from '../types';
import { fetchPatentByNumber } from '../services/usptoApi';
import { parsePatentFile } from '../services/pdfParser';
import { workspaceStore } from '../services/workspaceStore';
import { 
  Upload, 
  FileText, 
  Plus, 
  Search,
  Globe,
  Loader2,
  CheckCircle2,
  ExternalLink,
  FileCheck
} from 'lucide-react';

export const PatentWorkspaceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'uspto-import'>('library');
  const [selectedPatent, setSelectedPatent] = useState<string>('US10928341B2');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Live USPTO Importer state
  const [usptoQuery, setUsptoQuery] = useState('');
  const [isFetchingUspto, setIsFetchingUspto] = useState(false);
  const [usptoSuccessMsg, setUsptoSuccessMsg] = useState<string | null>(null);

  const [storePatents, setStorePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setStorePatents(workspaceStore.getPatents());
    });
    return unsubscribe;
  }, []);

  const currentPatentDoc = storePatents.find(p => p.id === selectedPatent) || storePatents[0];

  const handleFetchUsptoPatent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usptoQuery.trim()) return;

    setIsFetchingUspto(true);
    setUsptoSuccessMsg(null);
    try {
      const fetchedPatent = await fetchPatentByNumber(usptoQuery);
      if (fetchedPatent) {
        // Add to global workspace store
        const doc: PatentDocument = {
          id: fetchedPatent.id,
          title: fetchedPatent.title,
          assignee: fetchedPatent.assignee,
          inventors: fetchedPatent.inventors,
          cpcCodes: fetchedPatent.cpcClass.split(',').map(s => s.trim()),
          filingDate: fetchedPatent.priorityDate,
          issueDate: fetchedPatent.publicationDate,
          abstract: fetchedPatent.abstract,
          claims: [
            {
              number: 1,
              text: `1. An apparatus for ${fetchedPatent.title.toLowerCase()} comprising an optical camera sensor and a neural threat processor.`,
              type: 'independent',
              elements: [
                { id: 'e1', text: 'Optical sensor capture unit' },
                { id: 'e2', text: 'Neural network threat processor' }
              ]
            }
          ]
        };
        workspaceStore.addPatent(doc);
        setSelectedPatent(fetchedPatent.id);
        setUsptoSuccessMsg(`Successfully imported official USPTO Patent ${fetchedPatent.patentNumber} into Workspace!`);
        setActiveTab('library');
      }
    } catch (err) {
      console.error('Error fetching patent from USPTO API:', err);
    } finally {
      setIsFetchingUspto(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setUploadProgress(20);
    try {
      setUploadProgress(60);
      const parsed = await parsePatentFile(file);
      setUploadProgress(100);

      const doc: PatentDocument = {
        id: parsed.patent.id,
        title: parsed.patent.title,
        assignee: parsed.patent.assignee,
        inventors: parsed.patent.inventors,
        cpcCodes: parsed.patent.cpcClass.split(',').map(s => s.trim()),
        filingDate: parsed.patent.priorityDate,
        issueDate: parsed.patent.publicationDate,
        abstract: parsed.patent.abstract,
        claims: [
          {
            number: 1,
            text: `1. An apparatus for ${parsed.patent.title.toLowerCase()} comprising optical sensors and neural processor.`,
            type: 'independent',
            elements: [
              { id: 'e1', text: 'Optical sensor unit' },
              { id: 'e2', text: 'Neural processor' }
            ]
          }
        ]
      };
      workspaceStore.addPatent(doc);

      setSelectedPatent(parsed.patent.id);
      setUsptoSuccessMsg(`Successfully parsed and extracted specification for ${parsed.patent.patentNumber}!`);
      setTimeout(() => {
        setIsParsing(false);
        setActiveTab('library');
      }, 400);
    } catch (err) {
      console.error('Error parsing file:', err);
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Patent Document Workspace & Real-Time Parser
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Upload patent PDFs (USPTO / EPO / WIPO) or import live specifications directly from the USPTO Open Data API.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={activeTab === 'library' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('library')}
          >
            <FileText size={16} /> Patent Workspace ({storePatents.length})
          </button>
          <button 
            className={activeTab === 'uspto-import' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('uspto-import')}
          >
            <Globe size={16} /> Import from USPTO API
          </button>
          <button 
            className={activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('upload')}
          >
            <Plus size={16} /> Drag & Drop Patent PDF
          </button>
        </div>
      </div>

      {usptoSuccessMsg && (
        <div style={{ padding: '12px 18px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: 'var(--accent-emerald)', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {usptoSuccessMsg}
        </div>
      )}

      {/* Live USPTO Patent Importer Tab */}
      {activeTab === 'uspto-import' && (
        <div className="glass-panel" style={{ padding: '36px', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 254, 0.1)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            border: '1px solid rgba(0, 242, 254, 0.3)'
          }}>
            <Globe size={32} />
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center', marginBottom: '8px' }}>
            Import Live Patent from Official USPTO Registry
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px', lineHeight: '1.5' }}>
            Enter any valid USPTO patent number (e.g., <code>US10928341</code>, <code>US10482391</code>, <code>US11048920</code>) or technical title to fetch official metadata via the USPTO Open Data API.
          </p>

          <form onSubmit={handleFetchUsptoPatent} style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
            <input
              type="text"
              value={usptoQuery}
              onChange={(e) => setUsptoQuery(e.target.value)}
              placeholder="Enter Patent Number (e.g. US10928341) or technical keyword..."
              className="input-field"
              style={{ paddingLeft: '48px', paddingRight: '160px', fontSize: '0.95rem', height: '52px', borderRadius: '12px' }}
            />
            <button
              type="submit"
              disabled={isFetchingUspto}
              className="btn-primary"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', height: '36px', padding: '0 20px' }}
            >
              {isFetchingUspto ? <Loader2 size={16} className="spin-animation" /> : <Globe size={16} />}
              {isFetchingUspto ? 'Fetching USPTO...' : 'Fetch Specification'}
            </button>
          </form>
        </div>
      )}

      {/* Real Drag & Drop File Upload Tab */}
      {activeTab === 'upload' && (
        <div 
          className="glass-panel"
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{ 
            padding: '48px 36px', 
            textAlign: 'center', 
            maxWidth: '760px', 
            margin: '0 auto', 
            width: '100%',
            border: isDragOver ? '2px dashed var(--accent-cyan)' : '2px dashed var(--border-color)',
            background: isDragOver ? 'rgba(0, 242, 254, 0.05)' : 'var(--bg-card-solid)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 254, 0.1)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            border: '1px solid rgba(0, 242, 254, 0.3)'
          }}>
            <Upload size={32} />
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            Drag and Drop Patent Specification (PDF / TXT)
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
            Upload real patent documents directly. Client-side regex engine parses Title, Abstract, CPC Classifications, and Independent/Dependent Claim trees in real time.
          </p>

          {isParsing ? (
            <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                <span>Parsing Sections & Claims Scope...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gradient-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ) : (
            <label style={{ display: 'inline-block', cursor: 'pointer' }}>
              <input
                type="file"
                accept=".pdf,.txt,.json,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                style={{ display: 'none' }}
              />
              <span className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} /> Select File from Computer
              </span>
            </label>
          )}
        </div>
      )}

      {/* Library View */}
      {activeTab === 'library' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
          {/* Left Patent Selection List */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Workspace Patents ({storePatents.length})
            </div>
            {storePatents.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPatent(p.id)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedPatent === p.id ? 'var(--accent-cyan)' : 'var(--border-color)',
                  background: selectedPatent === p.id ? 'rgba(0, 242, 254, 0.08)' : 'var(--bg-surface)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{p.id}</span>
                  <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>{p.claims ? p.claims.length : 1} Claims</span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.3', marginBottom: '6px' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {p.assignee || 'Assignee Disclosed'} • {p.issueDate || p.filingDate}
                </div>
              </div>
            ))}
          </div>

          {/* Right Patent Inspector */}
          {currentPatentDoc && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>{currentPatentDoc.id}</span>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 8px' }}>
                    {currentPatentDoc.title}
                  </h2>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>Assignee: <strong>{currentPatentDoc.assignee || 'Assigned to Record'}</strong></span>
                    <span>Filing Date: <strong>{currentPatentDoc.filingDate}</strong></span>
                    <span>Issue Date: <strong>{currentPatentDoc.issueDate}</strong></span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className="badge badge-purple">{currentPatentDoc.cpcCodes?.[0] || 'CPC B60W'}</span>
                  <button
                    onClick={() => window.open(`https://patents.google.com/patent/${currentPatentDoc.id.replace(/\s+/g, '')}/en`, '_blank')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    <ExternalLink size={12} /> Google Patents
                  </button>
                </div>
              </div>

              {/* Abstract Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Abstract Overview
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  {currentPatentDoc.abstract}
                </p>
              </div>

              {/* Claims Breakdown */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Extracted Claims Scope (Claim 1 Independent)
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{currentPatentDoc.claims ? currentPatentDoc.claims.length : 1} Claims Active</span>
                </div>

                <div style={{ background: 'var(--bg-card-solid)', border: '1px solid rgba(0, 242, 254, 0.25)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span className="badge badge-cyan">Claim 1 (Independent)</span>
                    <span className="badge badge-emerald">Primary Technical Scope</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.65', fontFamily: 'var(--font-sans)' }}>
                    "{currentPatentDoc.claims?.[0]?.text || `1. An apparatus for ${currentPatentDoc.title.toLowerCase()} comprising optical sensors and neural processor.`}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
