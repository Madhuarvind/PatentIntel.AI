import React, { useState } from 'react';
import { 
  generateMarkdownReport, 
  generateBibTeXExport, 
  downloadFile 
} from '../services/reportExporter';
import { 
  FileText, 
  X, 
  Download, 
  Printer, 
  Code, 
  CheckCircle2, 
  Award
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patentNumber?: string;
}

export const ReportExportModal: React.FC<Props> = ({ isOpen, onClose, patentNumber = 'US 10,928,341 B2' }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'bibtex'>('preview');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownContent = generateMarkdownReport(patentNumber);
  const bibtexContent = generateBibTeXExport();

  const handlePrintPdf = () => {
    window.print();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '32px',
        borderRadius: '20px',
        border: '1px solid var(--accent-cyan)',
        boxShadow: '0 0 40px rgba(0, 242, 254, 0.15)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-cyan" style={{ padding: '6px 12px', fontWeight: 800 }}>
              <Award size={14} /> 1-CLICK EXECUTIVE PATENT EXAMINATION REPORT GENERATOR
            </span>
            <span className="badge badge-indigo">{patentNumber}</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
            Official USPTO-Grade Patent Audit Report & Citation Dossier
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Export claim alignment matrix, statutory 35 U.S.C. § 102/103 invalidity scores, and grounded AI reasoning into PDF, Markdown, or BibTeX.
          </p>
        </div>

        {/* Export Tabs */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeTab === 'preview' ? 'var(--accent-cyan)' : 'transparent',
              background: activeTab === 'preview' ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-surface)',
              color: activeTab === 'preview' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={16} /> Official PDF Audit Preview
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeTab === 'markdown' ? 'var(--accent-cyan)' : 'transparent',
              background: activeTab === 'markdown' ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-surface)',
              color: activeTab === 'markdown' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={16} /> Markdown Dossier (.md)
          </button>

          <button
            onClick={() => setActiveTab('bibtex')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeTab === 'bibtex' ? 'var(--accent-cyan)' : 'transparent',
              background: activeTab === 'bibtex' ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-surface)',
              color: activeTab === 'bibtex' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Code size={16} /> BibTeX Citations (.bib)
          </button>
        </div>

        {/* Tab 1: Printable Official Preview */}
        {activeTab === 'preview' && (
          <div style={{ background: '#FFFFFF', color: '#0B0F19', padding: '32px', borderRadius: '12px', fontFamily: 'serif', lineHeight: '1.6', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', marginBottom: '24px' }}>
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
                  United States Patent and Trademark Office
                </h1>
                <div style={{ fontSize: '0.9rem', color: '#444' }}>OFFICIAL PATENT EXAMINATION & PRIOR-ART AUDIT REPORT</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                <div><strong>Application:</strong> {patentNumber}</div>
                <div><strong>Date:</strong> {new Date().toISOString().split('T')[0]}</div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '20px', fontSize: '0.9rem' }}>
              <strong>Rejection Summary:</strong> Rejection under <strong>35 U.S.C. § 103(a) (Obviousness Combination)</strong> based on primary reference <code>US 10,482,391 B1</code> in view of secondary reference <code>US 11,048,920 B2</code>.
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '1px solid #CCC', paddingBottom: '4px' }}>
              Claim Element Alignment & Prior-Art Disclosures
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', margin: '14px 0', border: '1px solid #DDD' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                  <th style={{ padding: '8px', border: '1px solid #DDD' }}>Element</th>
                  <th style={{ padding: '8px', border: '1px solid #DDD' }}>Target Application (US 10,928,341)</th>
                  <th style={{ padding: '8px', border: '1px solid #DDD' }}>Primary Ref (US 10,482,391)</th>
                  <th style={{ padding: '8px', border: '1px solid #DDD' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #DDD' }}>1[a]</td>
                  <td style={{ padding: '8px', border: '1px solid #DDD' }}>Optical camera sensor</td>
                  <td style={{ padding: '8px', border: '1px solid #DDD' }}>Disclosed (Col 4, L 12)</td>
                  <td style={{ padding: '8px', border: '1px solid #DDD', color: 'green', fontWeight: 'bold' }}>§ 102 Match</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #DDD' }}>1[b]</td>
                  <td style={{ padding: '8px', border: '1px solid #DDD' }}>Deep neural threat processor</td>
                  <td style={{ padding: '8px', border: '1px solid #DDD' }}>Disclosed (Col 6, L 05)</td>
                  <td style={{ padding: '8px', border: '1px solid #DDD', color: 'green', fontWeight: 'bold' }}>§ 102 Match</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Markdown Code View */}
        {activeTab === 'markdown' && (
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <pre style={{ margin: 0, fontSize: '0.84rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {markdownContent}
            </pre>
          </div>
        )}

        {/* Tab 3: BibTeX View */}
        {activeTab === 'bibtex' && (
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <pre style={{ margin: 0, fontSize: '0.84rem', color: 'var(--accent-indigo)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {bibtexContent}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Report Exporter • <strong>PatentIntel.AI R&D Platform</strong>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {activeTab === 'markdown' && (
              <button 
                className="btn-secondary"
                onClick={() => downloadFile(markdownContent, `Patent_Audit_Report_${patentNumber.replace(/\s+/g, '')}.md`, 'text/markdown')}
              >
                <Download size={16} /> Download Markdown (.md)
              </button>
            )}

            {activeTab === 'bibtex' && (
              <button 
                className="btn-secondary"
                onClick={() => downloadFile(bibtexContent, `Patent_References_${patentNumber.replace(/\s+/g, '')}.bib`, 'text/plain')}
              >
                <Download size={16} /> Download BibTeX (.bib)
              </button>
            )}

            <button 
              className="btn-primary" 
              onClick={() => {
                if (activeTab === 'preview') handlePrintPdf();
                else if (activeTab === 'markdown') handleCopy(markdownContent);
                else handleCopy(bibtexContent);
              }}
            >
              {copied ? <CheckCircle2 size={16} /> : (activeTab === 'preview' ? <Printer size={16} /> : <Download size={16} />)}
              {copied ? 'Copied to Clipboard!' : (activeTab === 'preview' ? 'Print / Export Official PDF Report' : 'Copy Content')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
