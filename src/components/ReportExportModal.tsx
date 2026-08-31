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

  // Clean dedicated print window to guarantee 100% full-page report printing without scroll clipping
  const handlePrintPdf = () => {
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) {
      window.print();
      return;
    }

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>USPTO Official Patent Audit Report - ${patentNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: Georgia, 'Times New Roman', serif;
              color: #0B0F19;
              background: #FFFFFF;
              line-height: 1.6;
              margin: 0;
              padding: 24px;
            }
            .header-bar {
              border-bottom: 3px double #000000;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .uspto-title {
              font-size: 1.35rem;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.03em;
              margin: 0;
            }
            .sub-title {
              font-size: 0.92rem;
              font-weight: bold;
              color: #333333;
              margin-top: 2px;
            }
            .rejection-box {
              background-color: #F8FAFC;
              border: 1px solid #CBD5E1;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 24px;
              font-size: 0.9rem;
            }
            .rejection-title {
              font-weight: bold;
              color: #B91C1C;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            h3 {
              font-size: 1.05rem;
              font-weight: bold;
              border-bottom: 1px solid #94A3B8;
              padding-bottom: 4px;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0 24px;
              font-size: 0.85rem;
            }
            th, td {
              border: 1px solid #94A3B8;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background-color: #E2E8F0;
              font-weight: bold;
            }
            .status-match { color: #15803D; font-weight: bold; }
            .status-obvious { color: #B45309; font-weight: bold; }
            .status-novel { color: #6B21A8; font-weight: bold; }
            .signature-area {
              margin-top: 45px;
              border-top: 1px solid #CBD5E1;
              padding-top: 16px;
              display: flex;
              justify-content: space-between;
              font-size: 0.82rem;
              color: #475569;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1 class="uspto-title">United States Patent and Trademark Office</h1>
              <div class="sub-title">OFFICIAL PATENT EXAMINATION AUDIT REPORT & INVALIDITY DOSSIER</div>
              <div style="font-size: 0.82rem; color: #666666; margin-top: 2px;">
                PatentIntel.AI R&D Platform • Grounded Multi-Vector Prior-Art Analysis
              </div>
            </div>
            <div style="text-align: right; font-size: 0.85rem;">
              <div><strong>Application No:</strong> ${patentNumber}</div>
              <div><strong>Examination Date:</strong> ${new Date().toISOString().split('T')[0]}</div>
              <div><strong>Art Unit:</strong> 2684 (Automotive Sensing)</div>
            </div>
          </div>

          <div class="rejection-box">
            <div class="rejection-title">Statutory Rejection Determination</div>
            <div>
              Rejection under <strong>35 U.S.C. § 103(a) (Obviousness Combination)</strong> based on primary reference <code>US 10,482,391 B1</code> (VisionTech) in view of secondary reference <code>US 11,048,920 B2</code> (OmniDrive).
            </div>
            <div style="margin-top: 8px; font-size: 0.86rem; color: #475569;">
              Overall Multi-Vector Infringement / Plagiarism Risk Score: <strong>88.4%</strong> (4/5 Claim Elements Antedated).
            </div>
          </div>

          <h3>1. Claim Element Alignment Matrix (35 U.S.C. § 102 / § 103)</h3>
          <table>
            <thead>
              <tr>
                <th>Element ID</th>
                <th>Target Application Claim Element</th>
                <th>Primary Reference Disclosure</th>
                <th>Statutory Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1[a]</strong></td>
                <td>Optical camera sensor configured to capture video frames</td>
                <td>Disclosed in US 10,482,391 (Col 4, L 12–28)</td>
                <td class="status-match">§ 102 Anticipated</td>
              </tr>
              <tr>
                <td><strong>1[b]</strong></td>
                <td>Deep neural network threat processor computing threat vectors</td>
                <td>Disclosed in US 10,482,391 (Col 6, L 05–18)</td>
                <td class="status-match">§ 102 Anticipated</td>
              </tr>
              <tr>
                <td><strong>1[c]</strong></td>
                <td>Real-time hazard warning controller issuing cockpit alert signal</td>
                <td>Disclosed in US 11,048,920 (Col 3, L 40)</td>
                <td class="status-obvious">§ 103 Obvious</td>
              </tr>
              <tr>
                <td><strong>1[d]</strong></td>
                <td>Visual display interface in vehicle cockpit</td>
                <td>Difference: Prior art discloses HUD projection</td>
                <td class="status-novel">Novelty Point</td>
              </tr>
            </tbody>
          </table>

          <h3>2. Grounded AI Reasoning & Legal Assessment</h3>
          <p style="font-size: 0.88rem; color: #1E293B; line-height: 1.6;">
            A person having ordinary skill in the art (PHOSITA) in automotive neural vision systems would find it obvious to combine the optical CNN threat detector of US 10,482,391 with the acoustic cockpit warning controller of US 11,048,920 to achieve predictable driver hazard alerts.
          </p>

          <div class="signature-area">
            <div>
              <div><strong>Lead Patent Examiner:</strong> Dr. Alex Vance</div>
              <div>USPTO Art Unit 2684 • Senior Fellow</div>
            </div>
            <div style="text-align: right;">
              <div><strong>Audit Signature:</strong> <em>Alex Vance, Ph.D.</em></div>
              <div>OFFICIAL RECORD • USPTO PATENTINTEL.AI ENGINE</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(reportHtml);
    printWin.document.close();
    
    // Auto trigger print in popup window once DOM renders
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 300);
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
          className="no-print"
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
        <div className="no-print" style={{ marginBottom: '20px' }}>
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
        <div className="no-print" style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
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

        {/* Tab 1: Printable Official Preview Document */}
        {activeTab === 'preview' && (
          <div className="printable-report-area" style={{ background: '#FFFFFF', color: '#0B0F19', padding: '32px', borderRadius: '12px', fontFamily: 'Georgia, serif', lineHeight: '1.6', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', marginBottom: '24px' }}>
            <div style={{ borderBottom: '3px double #000', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  United States Patent and Trademark Office
                </h1>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#333', marginTop: '2px' }}>
                  OFFICIAL PATENT EXAMINATION AUDIT REPORT & INVALIDITY DOSSIER
                </div>
                <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '2px' }}>
                  PatentIntel.AI R&D Platform • Grounded Multi-Vector Prior-Art Analysis
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                <div><strong>Application No:</strong> {patentNumber}</div>
                <div><strong>Examination Date:</strong> {new Date().toISOString().split('T')[0]}</div>
                <div><strong>Art Unit:</strong> 2684 (Automotive Sensing)</div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '6px', border: '1px solid #CBD5E1', marginBottom: '24px', fontSize: '0.92rem' }}>
              <div style={{ fontWeight: 'bold', color: '#B91C1C', textTransform: 'uppercase', marginBottom: '4px' }}>
                Statutory Rejection Determination
              </div>
              <div>
                Rejection under <strong>35 U.S.C. § 103(a) (Obviousness Combination)</strong> based on primary reference <code>US 10,482,391 B1</code> (VisionTech) in view of secondary reference <code>US 11,048,920 B2</code> (OmniDrive).
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.86rem', color: '#475569' }}>
                Overall Multi-Vector Infringement / Plagiarism Risk Score: <strong>88.4%</strong> (4/5 Claim Elements Antedated).
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '1px solid #94A3B8', paddingBottom: '6px', marginBottom: '12px' }}>
              1. Claim Element Alignment Matrix (35 U.S.C. § 102 / § 103)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', margin: '14px 0 24px', border: '1px solid #94A3B8' }}>
              <thead>
                <tr style={{ background: '#E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '8px', border: '1px solid #94A3B8' }}>Element ID</th>
                  <th style={{ padding: '8px', border: '1px solid #94A3B8' }}>Target Application Claim Element</th>
                  <th style={{ padding: '8px', border: '1px solid #94A3B8' }}>Primary Reference Disclosure</th>
                  <th style={{ padding: '8px', border: '1px solid #94A3B8' }}>Statutory Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8', fontWeight: 'bold' }}>1[a]</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8' }}>Optical camera sensor configured to capture video frames</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8' }}>Disclosed in US 10,482,391 (Col 4, L 12–28)</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8', color: '#15803D', fontWeight: 'bold' }}>§ 102 Anticipated</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8', fontWeight: 'bold' }}>1[b]</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8' }}>Deep neural network threat processor computing threat vectors</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8' }}>Disclosed in US 10,482,391 (Col 6, L 05–18)</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8', color: '#15803D', fontWeight: 'bold' }}>§ 102 Anticipated</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8', fontWeight: 'bold' }}>1[c]</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8' }}>Real-time hazard warning controller issuing cockpit alert signal</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8' }}>Disclosed in US 11,048,920 (Col 3, L 40)</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8', color: '#B45309', fontWeight: 'bold' }}>§ 103 Obvious</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8', fontWeight: 'bold' }}>1[d]</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8' }}>Visual display interface in vehicle cockpit</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8' }}>Difference: Prior art discloses HUD projection</td>
                  <td style={{ padding: '8px', border: '1px solid #94A3B8', color: '#6B21A8', fontWeight: 'bold' }}>Novelty Point</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '1px solid #94A3B8', paddingBottom: '6px', marginBottom: '12px' }}>
              2. Grounded AI Reasoning & Legal Assessment
            </h3>
            <p style={{ fontSize: '0.88rem', margin: '0 0 12px', color: '#1E293B', lineHeight: '1.6' }}>
              A person having ordinary skill in the art (PHOSITA) in automotive neural vision systems would find it obvious to combine the optical CNN threat detector of US 10,482,391 with the acoustic cockpit warning controller of US 11,048,920 to achieve predictable driver hazard alerts.
            </p>

            <div style={{ marginTop: '40px', borderTop: '1px solid #CBD5E1', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569' }}>
              <div>
                <div><strong>Lead Patent Examiner:</strong> Dr. Alex Vance</div>
                <div>USPTO Art Unit 2684 • Senior Fellow</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Audit Signature:</strong> <em>Alex Vance, Ph.D.</em></div>
                <div>OFFICIAL RECORD • USPTO PATENTINTEL.AI ENGINE</div>
              </div>
            </div>
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
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
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
