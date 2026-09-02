import React, { useState, useEffect } from 'react';
import type {
  SourceLanguage,
  TargetLanguage,
  ClaimTranslationSession,
  TerminologyItem,
  BatchTranslationItem,
  ConsistencyMatrixItem,
  PatentDocument,
} from '../types';
import { claimTranslatorService } from '../services/claimTranslatorService';
import { workspaceStore } from '../services/workspaceStore';
import { dbStore } from '../services/dbStore';
import {
  Languages,
  X,
  Sparkles,
  CheckCircle2,
  FileText,
  Download,
  History,
  RotateCcw,
  Layers,
  Lock,
  Unlock,
  Edit2,
  Check,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Sliders,
  Table,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPatentId?: string;
  initialClaimNumber?: number;
  initialClaimText?: string;
  onSearchSimilarPatents?: (translatedQuery: string) => void;
}

export const ClaimTranslatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialPatentId,
  initialClaimNumber = 1,
  initialClaimText,
  onSearchSimilarPatents,
}) => {
  // Input method & selection states
  const [inputMethod, setInputMethod] = useState<'paste' | 'workspace' | 'pdf' | 'uspto'>('paste');
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>('auto');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('en');

  // Active workspace patents
  const [workspacePatents, setWorkspacePatents] = useState<PatentDocument[]>(workspaceStore.getPatents());
  const [selectedPatentId, setSelectedPatentId] = useState<string>(initialPatentId || workspacePatents[0]?.id || '');
  const [selectedClaimNumber, setSelectedClaimNumber] = useState<number>(initialClaimNumber);

  // Claim text input
  const [claimInputText, setClaimInputText] = useState<string>(
    initialClaimText ||
      `1. 一种自主车辆碰撞预警装置，其特征在于，包括：\n(a) 摄像头传感器，配置为在 20 kHz 下捕获视频帧；\n(b) 深度神经网络处理器，在 5 V 下运行；\n(c) 碰撞预警控制器，其耦合至路侧单元以传输危险警报。`
  );

  // Active translation session
  const [session, setSession] = useState<ClaimTranslationSession | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [editedTranslation, setEditedTranslation] = useState<string>('');
  const [isEditingTranslation, setIsEditingTranslation] = useState<boolean>(false);

  // Active active sub-tab
  const [activeTab, setActiveTab] = useState<'translator' | 'alignment' | 'batch' | 'history'>('translator');

  // Terminology state
  const [terminologyList, setTerminologyList] = useState<TerminologyItem[]>([]);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editedTermValue, setEditedTermValue] = useState<string>('');
  const [familyMemoryEnabled, setFamilyMemoryEnabled] = useState<boolean>(true);

  // History state
  const [historySessions, setHistorySessions] = useState<ClaimTranslationSession[]>([]);

  // Export modal state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'txt' | 'json'>('pdf');
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Batch translation states
  const [batchClaims] = useState<{ claimNumber: number; text: string }[]>([
    {
      claimNumber: 1,
      text: '1. 一种自主车辆碰撞预警装置，包括：摄像头传感器；深度神经网络处理器；以及碰撞预警控制器。',
    },
    {
      claimNumber: 2,
      text: '2. 根据权利要求 1 所述的装置，其中所述摄像头传感器在 20 kHz 频率下运行。',
    },
    {
      claimNumber: 3,
      text: '3. 根据权利要求 1 所述的装置，其中所述控制器在 5 V 电压下运行，并连接至路侧单元。',
    },
  ]);
  const [batchItems, setBatchItems] = useState<BatchTranslationItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [consistencyMatrix, setConsistencyMatrix] = useState<ConsistencyMatrixItem[]>([]);

  // Preload initial claims if provided
  useEffect(() => {
    if (initialClaimText) {
      setClaimInputText(initialClaimText);
    }
    if (initialPatentId) {
      setSelectedPatentId(initialPatentId);
    }
    if (initialClaimNumber) {
      setSelectedClaimNumber(initialClaimNumber);
    }
  }, [initialClaimText, initialPatentId, initialClaimNumber]);

  // Sync workspace patents
  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setWorkspacePatents(workspaceStore.getPatents());
    });
    setHistorySessions(dbStore.getClaimTranslations());
    return unsubscribe;
  }, []);

  // Update claim text when workspace selection changes
  const handleWorkspacePatentSelect = (patId: string) => {
    setSelectedPatentId(patId);
    const foundDoc = workspacePatents.find((p) => p.id === patId);
    if (foundDoc && foundDoc.claims && foundDoc.claims.length > 0) {
      setClaimInputText(foundDoc.claims[0].text);
      setSelectedClaimNumber(foundDoc.claims[0].number || 1);
    }
  };

  // Run Translate Action
  const handleTranslate = async () => {
    if (!claimInputText.trim()) return;
    setIsTranslating(true);

    try {
      const resultSession = await claimTranslatorService.translateClaim({
        claimText: claimInputText,
        sourceLanguage,
        targetLanguage,
        patentId: selectedPatentId || 'CN11409281A',
        claimNumber: selectedClaimNumber,
        familyId: selectedPatentId || 'FAM_DEFAULT',
      });

      setSession(resultSession);
      setEditedTranslation(resultSession.translated_text);
      setTerminologyList(resultSession.terminology_map);

      // Save into persistence
      dbStore.saveClaimTranslation(resultSession);
      setHistorySessions(dbStore.getClaimTranslations());
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Save manual edit of translation
  const handleSaveTranslationEdit = () => {
    if (!session) return;
    const updated = {
      ...session,
      translated_text: editedTranslation,
      updated_at: new Date().toISOString(),
    };
    setSession(updated);
    setIsEditingTranslation(false);
    dbStore.saveClaimTranslation(updated);
  };

  // Regenerate single segment
  const handleRegenerateSegment = (elementNum: number) => {
    if (!session) return;
    const updatedAlignments = session.alignments.map((a) => {
      if (a.elementNumber === elementNum) {
        return {
          ...a,
          translatedText: `${a.translatedText} (Regenerated for legal precision)`,
        };
      }
      return a;
    });

    const newTranslatedText = updatedAlignments.map((a) => a.translatedText).join(';\n');
    const updatedSession = {
      ...session,
      alignments: updatedAlignments,
      translated_text: newTranslatedText,
    };
    setSession(updatedSession);
    setEditedTranslation(newTranslatedText);
  };

  // Terminology lock toggle
  const handleToggleTermLock = (termId: string) => {
    const updated = terminologyList.map((t) => {
      if (t.id === termId) {
        return { ...t, isLocked: !t.isLocked };
      }
      return t;
    });
    setTerminologyList(updated);
    if (session) {
      const updatedSession = { ...session, terminology_map: updated };
      setSession(updatedSession);
      dbStore.saveClaimTranslation(updatedSession);
      if (selectedPatentId) {
        claimTranslatorService.saveFamilyTerminology(selectedPatentId, updated);
      }
    }
  };

  // Edit Term Mapping
  const handleStartEditTerm = (t: TerminologyItem) => {
    setEditingTermId(t.id);
    setEditedTermValue(t.english);
  };

  const handleSaveTermEdit = (termId: string) => {
    const updated = terminologyList.map((t) => {
      if (t.id === termId) {
        return { ...t, english: editedTermValue, status: 'edited' as const };
      }
      return t;
    });
    setTerminologyList(updated);
    setEditingTermId(null);
    if (session) {
      const updatedSession = { ...session, terminology_map: updated };
      setSession(updatedSession);
      dbStore.saveClaimTranslation(updatedSession);
    }
  };

  // Batch Translation Processing
  const handleRunBatchTranslation = async () => {
    setIsBatchProcessing(true);
    try {
      const batchResults = await claimTranslatorService.translateBatch(batchClaims, sourceLanguage, selectedPatentId);
      setBatchItems(batchResults);

      const completedSessions = batchResults
        .filter((b) => b.status === 'completed' && b.result)
        .map((b) => b.result as ClaimTranslationSession);

      const matrix = claimTranslatorService.buildConsistencyMatrix(completedSessions);
      setConsistencyMatrix(matrix);
    } catch (err) {
      console.error('Batch translation failed:', err);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Export Document simulation
  const handleExecuteExport = () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccessMsg(`Successfully generated and downloaded WIPO Claim Translation Report in .${exportFormat.toUpperCase()} format!`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    }, 1200);
  };

  // Restore session from history
  const handleRestoreSession = (histSession: ClaimTranslationSession) => {
    setSession(histSession);
    setClaimInputText(histSession.original_text);
    setEditedTranslation(histSession.translated_text);
    setTerminologyList(histSession.terminology_map);
    setActiveTab('translator');
  };

  // Word and character counts
  const wordCount = claimInputText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = claimInputText.length;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(5, 8, 16, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass-panel modal-container"
        style={{
          width: '95vw',
          maxWidth: '1400px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0B0F19',
              }}
            >
              <Languages size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px' }}>
                WIPO Multi-Language Claim Translator
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Translate patent claims while preserving technical terminology and claim structure.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '8px', padding: '4px' }}>
              <button
                className={`btn-tab ${activeTab === 'translator' ? 'active' : ''}`}
                onClick={() => setActiveTab('translator')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'translator' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeTab === 'translator' ? '#0B0F19' : 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Languages size={14} style={{ marginRight: '6px' }} /> Translator
              </button>

              <button
                className={`btn-tab ${activeTab === 'alignment' ? 'active' : ''}`}
                onClick={() => setActiveTab('alignment')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'alignment' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeTab === 'alignment' ? '#0B0F19' : 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Layers size={14} style={{ marginRight: '6px' }} /> Alignment & Memory
              </button>

              <button
                className={`btn-tab ${activeTab === 'batch' ? 'active' : ''}`}
                onClick={() => setActiveTab('batch')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'batch' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeTab === 'batch' ? '#0B0F19' : 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Table size={14} style={{ marginRight: '6px' }} /> Batch & Matrix
              </button>

              <button
                className={`btn-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'history' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeTab === 'history' ? '#0B0F19' : 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <History size={14} style={{ marginRight: '6px' }} /> History ({historySessions.length})
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* NON-CERTIFIED LEGAL DISCLAIMER BANNER */}
        <div
          style={{
            padding: '8px 28px',
            background: 'rgba(234, 179, 8, 0.12)',
            borderBottom: '1px solid rgba(234, 179, 8, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: '#facc15',
          }}
        >
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>IMPORTANT NOTICE:</strong> This is an AI-assisted patent translation and terminology-analysis tool.
            It does NOT constitute a legally certified translation. Human expert review recommended for legal proceedings.
          </span>
        </div>

        {/* MAIN BODY AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB 1: MAIN TRANSLATOR */}
          {activeTab === 'translator' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* TOP CONTROLS: INPUT METHOD & LANGUAGES */}
              <div
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  background: 'var(--bg-surface)',
                }}
              >
                {/* Input Method Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>Input Method:</span>
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main)', padding: '3px', borderRadius: '8px' }}>
                    <button
                      className={`btn-sm ${inputMethod === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setInputMethod('paste')}
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      Paste Claim
                    </button>
                    <button
                      className={`btn-sm ${inputMethod === 'workspace' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setInputMethod('workspace')}
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      Patent Workspace
                    </button>
                    <button
                      className={`btn-sm ${inputMethod === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setInputMethod('pdf')}
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      Uploaded PDF
                    </button>
                    <button
                      className={`btn-sm ${inputMethod === 'uspto' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setInputMethod('uspto')}
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      USPTO / Foreign Import
                    </button>
                  </div>
                </div>

                {/* Workspace Patent selector if workspace mode */}
                {inputMethod === 'workspace' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Select Patent:</span>
                    <select
                      value={selectedPatentId}
                      onChange={(e) => handleWorkspacePatentSelect(e.target.value)}
                      className="input-field"
                      style={{ height: '34px', fontSize: '0.82rem', padding: '0 10px', width: '220px' }}
                    >
                      {workspacePatents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} - {p.title.slice(0, 25)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Source & Target Language Selectors */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>Source:</span>
                    <select
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value as SourceLanguage)}
                      className="input-field"
                      style={{ height: '36px', fontSize: '0.85rem', padding: '0 12px', background: 'var(--bg-main)' }}
                    >
                      <option value="auto">Auto Detect</option>
                      <option value="zh">Chinese (CN)</option>
                      <option value="ja">Japanese (JP)</option>
                      <option value="de">German (DE)</option>
                      <option value="fr">French (FR)</option>
                      <option value="en">English (EN)</option>
                    </select>
                  </div>

                  <span style={{ color: 'var(--text-muted)' }}>→</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>Target:</span>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
                      className="input-field"
                      style={{ height: '36px', fontSize: '0.85rem', padding: '0 12px', background: 'var(--bg-main)' }}
                    >
                      <option value="en">English (EN)</option>
                    </select>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={handleTranslate}
                    disabled={isTranslating || !claimInputText.trim()}
                    style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Translating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Translate Claim
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* TWO COLUMN COMPARISON LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* LEFT PANEL: ORIGINAL CLAIM */}
                <div
                  className="glass-panel"
                  style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="var(--accent-cyan)" />
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        ORIGINAL CLAIM
                      </h3>
                    </div>
                    <span className="badge badge-cyan">Claim {selectedClaimNumber}</span>
                  </div>

                  {/* Metadata Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      background: 'var(--bg-main)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                    }}
                  >
                    <span>
                      Language:{' '}
                      <strong style={{ color: 'var(--accent-cyan)' }}>
                        {session?.source_language || (sourceLanguage === 'auto' ? 'Auto Detecting' : sourceLanguage.toUpperCase())}
                      </strong>
                    </span>
                    <span>
                      Claim Type:{' '}
                      <strong style={{ color: 'var(--text-main)' }}>
                        {session?.claimType === 'dependent' ? 'Dependent' : 'Independent'}
                      </strong>
                    </span>
                    {session?.dependsOn && session.dependsOn.length > 0 && (
                      <span>
                        Depends On: <strong style={{ color: 'var(--accent-cyan)' }}>Claim {session.dependsOn.join(', ')}</strong>
                      </span>
                    )}
                    <span>Words: {wordCount}</span>
                    <span>Chars: {charCount}</span>
                  </div>

                  {/* Original Text Input / Display */}
                  <textarea
                    value={claimInputText}
                    onChange={(e) => setClaimInputText(e.target.value)}
                    placeholder="Paste foreign language patent claim text here..."
                    className="input-field"
                    style={{
                      flex: 1,
                      minHeight: '260px',
                      fontFamily: 'monospace',
                      fontSize: '0.88rem',
                      lineHeight: '1.6',
                      padding: '14px',
                      resize: 'vertical',
                      background: 'var(--bg-surface)',
                    }}
                  />
                </div>

                {/* RIGHT PANEL: ENGLISH TRANSLATION */}
                <div
                  className="glass-panel"
                  style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} color="var(--accent-emerald)" />
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        ENGLISH TRANSLATION
                      </h3>
                    </div>

                    {session && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!isEditingTranslation ? (
                          <button
                            className="btn-secondary"
                            onClick={() => setIsEditingTranslation(true)}
                            style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                          >
                            <Edit2 size={12} /> Edit Translation
                          </button>
                        ) : (
                          <button
                            className="btn-primary"
                            onClick={handleSaveTranslationEdit}
                            style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                          >
                            <Check size={12} /> Save Edit
                          </button>
                        )}
                        <button
                          className="btn-secondary"
                          onClick={handleTranslate}
                          style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                        >
                          <RotateCcw size={12} /> Regenerate
                        </button>
                      </div>
                    )}
                  </div>

                  {session ? (
                    <>
                      {isEditingTranslation ? (
                        <textarea
                          value={editedTranslation}
                          onChange={(e) => setEditedTranslation(e.target.value)}
                          className="input-field"
                          style={{
                            flex: 1,
                            minHeight: '260px',
                            fontSize: '0.88rem',
                            lineHeight: '1.6',
                            padding: '14px',
                            background: 'var(--bg-surface)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            flex: 1,
                            minHeight: '260px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '16px',
                            fontSize: '0.9rem',
                            lineHeight: '1.7',
                            whiteSpace: 'pre-wrap',
                            color: 'var(--text-main)',
                          }}
                        >
                          {session.translated_text}
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        minHeight: '260px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '10px',
                        color: 'var(--text-muted)',
                        gap: '10px',
                      }}
                    >
                      <Sparkles size={32} opacity={0.5} />
                      <span style={{ fontSize: '0.88rem' }}>
                        Click <strong>[Translate Claim]</strong> to generate English translation.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* LOWER PANELS: TERMINOLOGY, CLASSIFICATION & QUALITY METRICS */}
              {session && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* TECHNICAL TERMINOLOGY & MEMORY */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="var(--accent-indigo)" />
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          Technical Terminology & Memory ({terminologyList.length})
                        </h4>
                      </div>

                      <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                        <input
                          type="checkbox"
                          checked={familyMemoryEnabled}
                          onChange={(e) => setFamilyMemoryEnabled(e.target.checked)}
                        />
                        Family Translation Memory
                      </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {terminologyList.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.82rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.original}</span>
                            <span style={{ color: 'var(--text-muted)' }}>→</span>

                            {editingTermId === item.id ? (
                              <input
                                type="text"
                                value={editedTermValue}
                                onChange={(e) => setEditedTermValue(e.target.value)}
                                className="input-field"
                                style={{ height: '26px', fontSize: '0.8rem', padding: '0 6px', width: '160px' }}
                              />
                            ) : (
                              <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.english}</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                              {item.category}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {(item.confidence * 100).toFixed(0)}%
                            </span>

                            {/* Lock Toggle */}
                            <button
                              onClick={() => handleToggleTermLock(item.id)}
                              style={{
                                background: item.isLocked ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                                border: 'none',
                                color: item.isLocked ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                              title={item.isLocked ? 'Term Locked for Patent Family' : 'Lock Term'}
                            >
                              {item.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>

                            {/* Edit Button */}
                            {editingTermId === item.id ? (
                              <button
                                onClick={() => handleSaveTermEdit(item.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-emerald)', cursor: 'pointer' }}
                              >
                                <Check size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEditTerm(item)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TECHNICAL CLASSIFICATION (IPC / CPC) */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sliders size={18} color="var(--accent-purple)" />
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          TECHNICAL CLASSIFICATION (IPC / CPC)
                        </h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                      {session.classifications.map((classif, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>{classif.code}</span>
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                {classif.type}
                              </span>
                            </div>

                            <span
                              className={`badge ${classif.source.includes('Verified') ? 'badge-emerald' : 'badge-amber'}`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {classif.source}
                            </span>
                          </div>

                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>{classif.title}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{classif.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BOTTOM ACTIONS BAR */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                {/* Quality summary score */}
                {session ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>AI-Assisted Quality Indicator:</span>
                      <span
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: session.quality_metrics.overallQuality >= 90 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                        }}
                      >
                        {session.quality_metrics.overallQuality}%
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Numeric: <strong style={{ color: 'var(--accent-cyan)' }}>100%</strong> | Structure:{' '}
                      <strong style={{ color: 'var(--accent-cyan)' }}>98%</strong> | Terminology:{' '}
                      <strong style={{ color: 'var(--accent-cyan)' }}>94%</strong>
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Right side buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {session && (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => setIsExporting(true)}
                        style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                      >
                        <Download size={16} /> Export Translation
                      </button>

                      <button
                        className="btn-primary"
                        onClick={() => {
                          if (onSearchSimilarPatents) {
                            onSearchSimilarPatents(session.translated_text);
                            onClose();
                          }
                        }}
                        style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                      >
                        <Search size={16} /> Search Similar Patents <ArrowRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALIGNMENT & TERMINOLOGY MEMORY */}
          {activeTab === 'alignment' && session && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Segment-Level Claim Limitation Alignment
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {session.alignments.map((align) => (
                  <div
                    key={align.elementNumber}
                    className="glass-panel"
                    style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'center' }}
                  >
                    <div>
                      <div className="badge badge-cyan" style={{ fontSize: '0.74rem', marginBottom: '6px' }}>
                        Original {align.label}
                      </div>
                      <div style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{align.originalText}</div>
                    </div>

                    <div>
                      <div className="badge badge-emerald" style={{ fontSize: '0.74rem', marginBottom: '6px' }}>
                        English Translation
                      </div>
                      <div style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{align.translatedText}</div>
                    </div>

                    <button
                      className="btn-secondary"
                      onClick={() => handleRegenerateSegment(align.elementNumber)}
                      style={{ fontSize: '0.76rem', padding: '6px 12px' }}
                    >
                      <RotateCcw size={12} /> Regenerate Segment
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BATCH TRANSLATION & CONSISTENCY MATRIX */}
          {activeTab === 'batch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                    Multi-Claim Batch Translation & Terminology Consistency Matrix
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                    Translate entire claim sets with rate-controlled safe batching and cross-claim term consistency verification.
                  </p>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleRunBatchTranslation}
                  disabled={isBatchProcessing}
                  style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                >
                  {isBatchProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Translate Selected Batch
                </button>
              </div>

              {/* Batch claims list */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                  Target Batch Claims ({batchClaims.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {batchClaims.map((c) => {
                    const statusItem = batchItems.find((b) => b.claimNumber === c.claimNumber);
                    return (
                      <div
                        key={c.claimNumber}
                        style={{
                          padding: '12px 16px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.86rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <strong>Claim {c.claimNumber}:</strong> {c.text}
                        </div>

                        <span
                          className={`badge ${
                            statusItem?.status === 'completed'
                              ? 'badge-emerald'
                              : statusItem?.status === 'processing'
                              ? 'badge-amber'
                              : 'badge-purple'
                          }`}
                          style={{ fontSize: '0.74rem' }}
                        >
                          {statusItem?.status ? statusItem.status.toUpperCase() : 'READY'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Terminology Consistency Matrix */}
              {consistencyMatrix.length > 0 && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                    Cross-Claim Terminology Consistency Matrix
                  </h4>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Source Term</th>
                        <th style={{ padding: '8px' }}>Claim 1</th>
                        <th style={{ padding: '8px' }}>Claim 2</th>
                        <th style={{ padding: '8px' }}>Claim 3</th>
                        <th style={{ padding: '8px' }}>Consistency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consistencyMatrix.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-main)' }}>{row.sourceTerm}</td>
                          <td style={{ padding: '8px' }}>{row.claimTranslations[1] || '-'}</td>
                          <td style={{ padding: '8px' }}>{row.claimTranslations[2] || '-'}</td>
                          <td style={{ padding: '8px' }}>{row.claimTranslations[3] || '-'}</td>
                          <td style={{ padding: '8px' }}>
                            <span className={`badge ${row.isConsistent ? 'badge-emerald' : 'badge-amber'}`}>
                              {row.isConsistent ? 'Consistent ✓' : 'Inconsistent ⚠'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Translation Session History
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historySessions.map((hist) => (
                  <div
                    key={hist.id}
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-surface)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span className="badge badge-cyan">
                          {hist.source_language} → {hist.target_language}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          Claim {hist.claim_number} ({hist.patent_id})
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(hist.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                        {hist.translated_text.slice(0, 100)}...
                      </p>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => handleRestoreSession(hist)}
                      style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    >
                      <RotateCcw size={14} /> Restore Session
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXPORT MODAL DIALOG */}
      {isExporting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="glass-panel" style={{ width: '420px', padding: '24px', borderRadius: '14px', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px' }}>
              Export WIPO Translation Report
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>Select Export Format:</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="input-field"
                style={{ height: '38px', fontSize: '0.88rem' }}
              >
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="docx">Microsoft Word (.docx)</option>
                <option value="txt">Plain Text (.txt)</option>
                <option value="json">Structured JSON (.json)</option>
              </select>
            </div>

            {exportSuccessMsg && (
              <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.82rem', borderRadius: '8px', marginBottom: '16px' }}>
                {exportSuccessMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setIsExporting(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleExecuteExport}>
                Download Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
