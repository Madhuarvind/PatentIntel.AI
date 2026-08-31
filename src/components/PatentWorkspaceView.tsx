import React, { useState } from 'react';
import type { Patent } from '../types';
import { fetchPatentByNumber } from '../services/usptoApi';
import { 
  Upload, 
  FileText, 
  Plus, 
  Sparkles,
  Search,
  Globe,
  Loader2,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const PatentWorkspaceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'uspto-import'>('library');
  const [selectedPatent, setSelectedPatent] = useState<string>('US10928341B2');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);

  // Live USPTO Importer state
  const [usptoQuery, setUsptoQuery] = useState('');
  const [isFetchingUspto, setIsFetchingUspto] = useState(false);
  const [usptoSuccessMsg, setUsptoSuccessMsg] = useState<string | null>(null);

  const [patents, setPatents] = useState<Patent[]>([
    {
      id: 'US10928341B2',
      patentNumber: 'US 10,928,341 B2',
      title: 'Smart Autonomous Vehicle Collision Avoidance System and Warning Apparatus',
      assignee: 'Apex AI Mobility Systems Inc.',
      inventors: ['Dr. Marcus Chen', 'Elena Rostova'],
      publicationDate: '2021-02-23',
      priorityDate: '2018-09-14',
      cpcClass: 'B60W 30/09, G06V 20/58',
      abstract: 'An autonomous vehicle warning apparatus comprising an optical camera sensor, a deep neural network for obstacle detection, a real-time risk evaluation processor, and a collision alert visual display.',
      claimsCount: 18
    },
    {
      id: 'US10482391B1',
      patentNumber: 'US 10,482,391 B1',
      title: 'Camera-Based Vehicle Sensor Network for Dynamic Hazard Recognition',
      assignee: 'VisionTech Automotive Corp',
      inventors: ['Sarah Jenkins', 'David Kim'],
      publicationDate: '2019-11-19',
      priorityDate: '2017-04-10',
      cpcClass: 'G08G 1/16, G06V 10/82',
      abstract: 'A vehicle safety system utilizing a plurality of optical sensors to capture surrounding environmental frames and compute dynamic threat vectors via convolutional neural networks.',
      claimsCount: 22
    },
    {
      id: 'US11048920B2',
      patentNumber: 'US 11,048,920 B2',
      title: 'Neural Network Object Detection Controller with Driver Alert Display',
      assignee: 'OmniDrive Intelligence Ltd',
      inventors: ['Hiroshi Tanaka'],
      publicationDate: '2021-06-29',
      priorityDate: '2019-01-22',
      cpcClass: 'G06N 3/08, B60W 50/14',
      abstract: 'A driver assistance apparatus equipped with deep learning neural vision algorithms for identifying pedestrians and generating acoustic/visual warning signals.',
      claimsCount: 15
    }
  ]);

  const currentPatent = patents.find(p => p.id === selectedPatent) || patents[0];

  const handleFetchUsptoPatent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usptoQuery.trim()) return;

    setIsFetchingUspto(true);
    setUsptoSuccessMsg(null);
    try {
      const fetchedPatent = await fetchPatentByNumber(usptoQuery);
      if (fetchedPatent) {
        setPatents(prev => [fetchedPatent, ...prev]);
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

  const handleSimulateUpload = () => {
    setIsParsing(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsParsing(false);
          setActiveTab('library');
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Patent Document Workspace & PDF Parser
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
            <FileText size={16} /> Patent Workspace ({patents.length})
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
            <Plus size={16} /> Upload Patent PDF
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

      {/* PDF Upload Tab */}
      {activeTab === 'upload' && (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
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
            Upload Patent Specification or Claim Text (PDF / TXT)
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
            Drag and drop patent files here or click browse. Automatic PyMuPDF / Tesseract OCR section extraction will parse Title, Abstract, Background, and Independent/Dependent Claims.
          </p>

          {isParsing ? (
            <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                <span>Extracting Sections & Claims...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gradient-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ) : (
            <button className="btn-primary" onClick={handleSimulateUpload} style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
              <Sparkles size={18} /> Select Sample Patent PDF (US10928341)
            </button>
          )}
        </div>
      )}

      {/* Library View */}
      {activeTab === 'library' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
          {/* Left Patent Selection List */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Workspace Patents ({patents.length})
            </div>
            {patents.map((p) => (
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
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{p.patentNumber}</span>
                  <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>{p.claimsCount} Claims</span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.3', marginBottom: '6px' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {p.assignee} • {p.publicationDate}
                </div>
              </div>
            ))}
          </div>

          {/* Right Patent Inspector */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>{currentPatent.patentNumber}</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 8px' }}>
                  {currentPatent.title}
                </h2>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>Assignee: <strong>{currentPatent.assignee}</strong></span>
                  <span>Priority Date: <strong>{currentPatent.priorityDate}</strong></span>
                  <span>Publication: <strong>{currentPatent.publicationDate}</strong></span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span className="badge badge-purple">{currentPatent.cpcClass}</span>
                <button
                  onClick={() => window.open(`https://patents.google.com/patent/${currentPatent.patentNumber.replace(/\s+/g, '')}/en`, '_blank')}
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
                {currentPatent.abstract}
              </p>
            </div>

            {/* Claims Breakdown */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Extracted Claims Scope (Claim 1 Independent)
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{currentPatent.claimsCount} Total Claims Extracted</span>
              </div>

              <div style={{ background: 'var(--bg-card-solid)', border: '1px solid rgba(0, 242, 254, 0.25)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span className="badge badge-cyan">Claim 1 (Independent)</span>
                  <span className="badge badge-emerald">Primary Technical Scope</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.65', fontFamily: 'var(--font-sans)' }}>
                  "1. An apparatus for {currentPatent.title.toLowerCase()} comprising: 
                  an optical camera sensor configured to capture visual video frames of an external environment; 
                  a deep neural network processor configured to compute threat vectors; 
                  a warning controller configured to issue hazard alert signals; and 
                  a visual display interface to present said warning signal."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
