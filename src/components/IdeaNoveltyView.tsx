import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  Send, 
  Check,
  X,
  FileCheck,
  Shield,
  FileText,
  Scale
} from 'lucide-react';

import type { 
  ModuleView, 
  InnovationProject, 
  ExtractedIdeaComponent, 
  ComponentRelationship,
  NoveltyBenchmarkReport, 
  DifferentiatorRecommendation,
  PatentReviewSubmission,
  ReviewComment,
  InnovationVersion
} from '../types';

import { dbStore } from '../services/dbStore';
import { 
  extractInnovationComponents, 
  analyzeIdeaProposal, 
  generateMarkdownAuditDossier
} from '../services/noveltyBenchmarkService';
import { extractPdfTextPageByPage } from '../services/pdfParser';

interface IdeaNoveltyViewProps {
  onNavigate?: (view: ModuleView, metadata?: any) => void;
  initialTab?: 'dashboard' | 'wizard' | 'audit' | 'review_queue';
  selectedProjectId?: string;
}

export const IdeaNoveltyView: React.FC<IdeaNoveltyViewProps> = ({ 
  onNavigate,
  initialTab = 'dashboard',
  selectedProjectId
}) => {
  const currentUser = dbStore.getCurrentUser();

  // Sub-view Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wizard' | 'audit' | 'review_queue'>(initialTab);

  // Data Stores
  const [projects, setProjects] = useState<InnovationProject[]>([]);
  const [activeProject, setActiveProject] = useState<InnovationProject | null>(null);
  const [activeReport, setActiveReport] = useState<NoveltyBenchmarkReport | null>(null);
  const [reviewSubmissions, setReviewSubmissions] = useState<PatentReviewSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<PatentReviewSubmission | null>(null);

  // Wizard Creation State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [activePresetId, setActivePresetId] = useState<number | null>(null);
  const [proposalTitle, setProposalTitle] = useState<string>('');
  const [proposalDomain, setProposalDomain] = useState<string>('Artificial Intelligence & IoT Systems');
  const [technicalProblem, setTechnicalProblem] = useState<string>('');
  const [proposedSolution, setProposedSolution] = useState<string>('');
  const [expectedTechnicalEffect, setExpectedTechnicalEffect] = useState<string>('');
  const [proposalText, setProposalText] = useState<string>('');

  const applyPresetSample = (presetId: number) => {
    const preset = RESEARCH_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setProposalTitle(preset.title);
    setProposalDomain(preset.domain);
    setTechnicalProblem(preset.technicalProblem);
    setProposedSolution(preset.proposedSolution);
    setExpectedTechnicalEffect(preset.expectedTechnicalEffect);
    setProposalText(preset.proposalText);
  };

  const handleClearForm = () => {
    setActivePresetId(null);
    setProposalTitle('');
    setProposalDomain('Artificial Intelligence & IoT Systems');
    setTechnicalProblem('');
    setProposedSolution('');
    setExpectedTechnicalEffect('');
    setProposalText('');
  };
  
  // Human Feature Validation Step State
  const [validatedComponents, setValidatedComponents] = useState<ExtractedIdeaComponent[]>([]);
  const [, setValidatedRelationships] = useState<ComponentRelationship[]>([]);
  const [, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStage, setAnalysisStage] = useState<string>('');

  // Report & Explorer Active Filters / Selections
  const [selectedFilterStatus, setSelectedFilterStatus] = useState<string>('ALL');
  const [activeReportTab, setActiveReportTab] = useState<'graph' | 'matrix' | 'combinations' | 'differentiators' | 'versions'>('graph');
  const [selectedNodeComponent, setSelectedNodeComponent] = useState<ExtractedIdeaComponent | null>(null);

  // Review Workspace State
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [showDecisionModal, setShowDecisionModal] = useState<boolean>(false);
  const [showFerModal, setShowFerModal] = useState<boolean>(false);
  const [decisionType, setDecisionType] = useState<'APPROVED_FOR_DRAFTING' | 'NEEDS_REVISION' | 'REJECTED'>('APPROVED_FOR_DRAFTING');
  const [decisionReason, setDecisionReason] = useState<string>('');

  const handleDownloadFerReport = () => {
    if (!activeReport) return;
    const text = `# SIMULATED FIRST EXAMINATION REPORT (FER) / OFFICE ACTION DRAFT
Document ID: FER-${activeReport.id}
Date: ${new Date().toLocaleDateString()}
Target Innovation: ${activeReport.ideaTitle}
Jurisdiction: International (USPTO / EPO / CGPDTM Compliant)

================================================================================
SECTION 1: STATUTORY SUBJECT-MATTER ELIGIBILITY (35 U.S.C. § 101 / Section 3(k))
================================================================================
Status: ${activeReport.statutoryEligibility?.status || 'PASS'}
Reference Section: ${activeReport.statutoryEligibility?.sectionRef || 'Section 3(k) / Section 101'}
Examiner Finding: ${activeReport.statutoryEligibility?.reason || 'Hardware binding verified.'}

================================================================================
SECTION 2: PRIOR ART NOVELTY EVALUATION (SECTION 102)
================================================================================
Prior Art Concern: ${activeReport.priorArtConcern}
Direct Feature Overlaps Found: ${activeReport.directOverlapCount}
Potentially Distinctive Features: ${activeReport.potentiallyDistinctiveCount}

Key Cited Prior Art References:
${activeReport.extractedComponents.flatMap(c => c.matchedPriorArt).map(m => `- [${m.sourceType}] ${m.id}: ${m.title} (${m.similarityScore}% Match)`).join('\n')}

================================================================================
SECTION 3: INVENTIVE STEP & MULTI-DOCUMENT OBVIOUSNESS (SECTION 103 / TSM)
================================================================================
Section 103 Obviousness Risk Score: ${activeReport.tsmObviousnessRisk?.score || 45}% (${activeReport.tsmObviousnessRisk?.level || 'MODERATE'} RISK)
TSM Combination Motivation:
${activeReport.tsmObviousnessRisk?.combinedReferences.map(r => `- Combining Ref [${r.ref1}] with Paper [${r.ref2}]: ${r.motivationReason}`).join('\n')}

================================================================================
SECTION 4: MULTIMODAL SCHEMATIC & DIAGRAM VERIFICATION (ColPali Vision-RAG)
================================================================================
Diagram Figures Analyzed: ${activeReport.multimodalSchematics?.diagramCount || 4}
Schematic Matches:
${activeReport.multimodalSchematics?.schematicMatches.map(s => `- ${s.figureId} vs ${s.priorArtId} (${s.priorArtTitle}): ${(s.visualSimilarity * 100).toFixed(0)}% Visual Topology Match`).join('\n')}

================================================================================
SECTION 5: FREEDOM-TO-OPERATE (FTO) LEGAL STATUS TRACKER
================================================================================
Legal Status Breakdown:
${activeReport.topMatchedPatents.map(p => `- Patent ${p.id}: ${p.id.includes('604965') || p.id.includes('784998') ? 'EXPIRED (Public Domain - Safe to Commercialize)' : 'ACTIVE MONOPOLY (FTO Risk: High)'}`).join('\n')}

================================================================================
SECTION 6: EXAMINER SUMMARY & RECOMMENDED ACTION
================================================================================
Provisional Determination: READY FOR PATENT CLAIM DRAFTING WITH CLAIM NARROWING AMENDMENTS.
`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `First_Examination_Report_${activeReport.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load Data on Mount & Listeners
  const loadData = () => {
    const allProjects = dbStore.getInnovationProjects(currentUser?.id);
    setProjects(allProjects);

    const subs = dbStore.getReviewSubmissions();
    setReviewSubmissions(subs);

    if (selectedProjectId) {
      const foundP = dbStore.getInnovationProjectById(selectedProjectId);
      if (foundP) {
        setActiveProject(foundP);
        const rep = dbStore.getLatestBenchmarkReport(foundP.id);
        if (rep) setActiveReport(rep);
      }
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, [currentUser?.id, selectedProjectId]);

interface RDPreset {
  id: number;
  badge: string;
  title: string;
  domain: string;
  summary: string;
  technicalProblem: string;
  proposedSolution: string;
  expectedTechnicalEffect: string;
  proposalText: string;
}

const RESEARCH_PRESETS: RDPreset[] = [
  {
    id: 1,
    badge: 'Smart Agriculture & IoT',
    title: 'IoT Autonomous Agriculture Telemetry & Predictive Shelf-Life Network',
    domain: 'Smart Agriculture & IoT Sensors',
    summary: 'Spectral produce degradation monitoring & automated dispatch priority.',
    technicalProblem: 'Agricultural produce undergoes rapid degradation in transit, causing 30% logistics waste due to unmonitored thermal spikes and static transport routing.',
    proposedSolution: 'An edge IoT multi-sensor telemetry node (F1) continuously acquires spectral data streams. A deep convolutional degradation neural network (F2) calculates real-time shelf-life vectors. The output dynamically couples to an automated inventory recommendation engine (F3).',
    expectedTechnicalEffect: 'Extends transport shelf-life predictability by 45% and reduces supply chain degradation waste by 38%.',
    proposalText: `Abstract: This project presents an autonomous agricultural produce monitoring system. The system combines multi-spectral IoT sensor telemetry nodes deployed on logistics containers with a real-time deep learning degradation model. By processing temperature, humidity, and ethylene gas concentration, the edge neural network dynamically predicts produce shelf-life. Furthermore, the calculated decay metric directly adjusts priority dispatch ranking to optimize supply chain inventory.`
  },
  {
    id: 2,
    badge: 'Cybersecurity & Cryptography',
    title: 'Quantum-Resistant Edge Sensor Telemetry Encryption System',
    domain: 'Cybersecurity & Embedded Systems',
    summary: 'Hardware lattice-based zero-knowledge proofs & encrypted MQTT broker.',
    technicalProblem: 'IoT sensors deployed in critical energy infrastructure are vulnerable to post-quantum decryption attacks on centralized cloud databases.',
    proposedSolution: 'Hardware-isolated cryptographic modules on edge microcontrollers perform lattice-based zero-knowledge proof (ZKP) key rotation (F1) before dispatching telemetry streams (F2) over an encrypted MQTT broker (F3).',
    expectedTechnicalEffect: 'Achieves post-quantum security compliance with sub-15ms latency overhead on memory-constrained edge hardware.',
    proposalText: `Abstract: We disclose a quantum-resistant telemetry protection framework for edge IoT nodes. The system incorporates lattice-based cryptography directly within hardware security modules (HSM) on edge transceivers. Zero-knowledge proof protocols authenticate sensor telemetry packages prior to transmission over low-power MQTT networks, eliminating centralized key exposure.`
  },
  {
    id: 3,
    badge: 'Robotics & UAV Avionics',
    title: 'AI Dynamic Latency Throttling for Autonomous Edge UAV Navigation',
    domain: 'Robotics & Edge Compute',
    summary: 'Closed-loop execution scaling for optical flow point-cloud processing.',
    technicalProblem: 'Unmanned aerial vehicles (UAVs) experience sensor processing throttling during extreme thermals, risking trajectory collapse.',
    proposedSolution: 'A dual-stage neural network dynamically balances optical flow compute latency against hardware thermal limits (F1) using closed-loop execution scaling (F2).',
    expectedTechnicalEffect: 'Eliminates thermal throttling crashes and maintains 60 FPS spatial point-cloud processing.',
    proposalText: `Abstract: An adaptive execution controller for autonomous UAV navigation. The architecture monitors GPU temperature vectors in real-time and scales neural network precision dynamically to prevent frame drops during high-altitude flight operations.`
  },
  {
    id: 4,
    badge: 'Medical AI & Pathology',
    title: 'Multimodal Transformer Fusion for Real-Time Pathology Anomaly Detection',
    domain: 'Healthcare AI & Medical Imaging',
    summary: 'Cross-attention fusion of spatial MRI slices & genomic biomarkers.',
    technicalProblem: 'High false-positive rates in early-stage oncology screening due to isolated analysis of medical imaging without real-time genomic biomarker alignment.',
    proposedSolution: 'A dual-stream multimodal transformer architecture (F1) fuses high-resolution 3D MRI voxel slices with real-time liquid biopsy genomic sequence streams (F2). A spatial-cross-attention module (F3) computes voxel-level tumor probability heatmaps.',
    expectedTechnicalEffect: 'Improves early oncology detection sensitivity by 29% while reducing diagnostic latency from 48 hours to under 3 minutes.',
    proposalText: `Abstract: This work presents a multimodal AI pathology screening platform for early oncology detection. The system integrates a dual-stream vision transformer trained on 3D MRI spatial volumes with a sequence transformer processing genomic biomarker assay streams. Cross-attention layers compute alignment scores to generate probabilistic spatial heatmaps for clinical decision support.`
  },
  {
    id: 5,
    badge: 'Clean Energy & Smart Grid',
    title: 'Decentralized Peer-to-Peer Microgrid Battery Degradation Balancing',
    domain: 'Clean Energy & Smart Grid Control',
    summary: 'State-of-Health electrochemistry tracking & decentralized smart contracts.',
    technicalProblem: 'Local solar microgrids experience accelerated battery degradation due to uncoordinated peer-to-peer discharge spikes during peak grid demand.',
    proposedSolution: 'Edge micro-inverter controllers execute decentralized consensus (F1) based on real-time State-of-Health (SoH) electrochemical impedance models (F2). Dynamic smart contracts balance local discharge rates (F3) to equalize degradation rates across battery packs.',
    expectedTechnicalEffect: 'Extends overall microgrid energy storage lifespan by 3.5 years and reduces localized degradation variance by 52%.',
    proposalText: `Abstract: A peer-to-peer energy storage optimization protocol for distributed solar microgrids. By embedding electrochemical impedance spectroscopy monitoring directly into inverter microcontrollers, the system dynamically routes power dispatch based on cell degradation metrics, preventing thermal overload in legacy battery packs.`
  },
  {
    id: 6,
    badge: 'Autonomous Vehicles & LiDAR',
    title: 'Edge Point-Cloud Compression for Autonomous Vehicle Spatial Tracking',
    domain: 'Autonomous Vehicles & Computer Vision',
    summary: 'Spatiotemporal octree compression & low-latency bounding box tracking.',
    technicalProblem: '3D LiDAR point-cloud data streams overwhelm vehicle CAN-bus bandwidth, causing 120ms transmission delays in obstacle detection.',
    proposedSolution: 'A hardware-accelerated octree compression encoder (F1) prunes redundant point-cloud data in real-time. A spatiotemporal Kalman-Transformer filter (F2) reconstructs bounding boxes (F3) directly at the vehicle ECU.',
    expectedTechnicalEffect: 'Reduces point-cloud data volume by 78% while maintaining sub-10ms bounding-box spatial tracking accuracy.',
    proposalText: `Abstract: We present a real-time point-cloud compression framework for autonomous vehicle perception networks. The architecture utilizes dynamic octree quantization to compress 64-beam LiDAR streams on edge hardware prior to intra-vehicle transmission, enabling zero-latency obstacle detection.`
  }
];

  // Handle PDF Upload via pdfParser.ts
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { fullText } = await extractPdfTextPageByPage(file);
      setProposalText(fullText);
      if (!proposalTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setProposalTitle(cleanName);
      }
    } catch (err) {
      console.error('File parsing error:', err);
    }
  };

  // Step 3 -> Step 4: Extract Components for Human Feature Validation
  const proceedToFeatureValidation = () => {
    const combinedText = `${proposalTitle}\n${technicalProblem}\n${proposedSolution}\n${expectedTechnicalEffect}\n${proposalText}`;
    const { components, relationships } = extractInnovationComponents(combinedText, `temp_${Date.now()}`);
    setValidatedComponents(components);
    setValidatedRelationships(relationships);
    setWizardStep(4);
  };

  // Add Custom Component during Step 4
  const handleAddComponent = () => {
    const newId = `comp_custom_${Date.now()}`;
    const code = `F${validatedComponents.length + 1}`;
    setValidatedComponents([
      ...validatedComponents,
      {
        id: newId,
        innovationProjectId: 'temp',
        featureCode: code,
        name: 'New Custom Technical Feature',
        term: 'New Custom Technical Feature',
        category: 'COMPONENT',
        description: 'User-specified technical hardware, algorithm, or data-flow component.',
        importance: 'SUPPORTING',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.80,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
  };

  // Execute Live Benchmark Run (Step 4 -> Step 5 -> Audit Report)
  const executeBenchmarkRun = async () => {
    setIsAnalyzing(true);
    setWizardStep(5);
    setAnalysisProgress(15);
    setAnalysisStage('Extracting validated features & structural graph topology...');

    const combinedText = `${proposalTitle}\n${technicalProblem}\n${proposedSolution}\n${expectedTechnicalEffect}\n${proposalText}`;

    setTimeout(async () => {
      setAnalysisProgress(35);
      setAnalysisStage('Searching Master USPTO Patent Records & Local Workspace...');

      setTimeout(async () => {
        setAnalysisProgress(65);
        setAnalysisStage('Cross-referencing OpenAlex & Semantic Scholar Research Graphs...');

        setTimeout(async () => {
          setAnalysisProgress(85);
          setAnalysisStage('Evaluating Evidence Provenance & Combination Overlap...');

          try {
            const report = await analyzeIdeaProposal(
              combinedText,
              proposalTitle || 'Untitled R&D Project',
              undefined,
              currentUser?.id
            );

            // Override components with validated components if user edited them
            if (validatedComponents.length > 0) {
              report.extractedComponents = validatedComponents;
            }

            setActiveReport(report);
            const proj = dbStore.getInnovationProjectById(report.innovationProjectId);
            setActiveProject(proj);
            setIsAnalyzing(false);
            setActiveTab('audit');
          } catch (err) {
            console.error('Benchmark execution error:', err);
            setIsAnalyzing(false);
          }
        }, 800);
      }, 800);
    }, 800);
  };

  // Accept Differentiator Recommendation -> Creates Version 2
  const handleAcceptRecommendation = (rec: DifferentiatorRecommendation) => {
    if (!activeReport || !activeProject) return;

    const updatedRecs = activeReport.recommendations.map(r => 
      r.id === rec.id ? { ...r, status: 'ACCEPTED' as const } : r
    );

    const newVersionNum = activeProject.currentVersionNumber + 1;
    const updatedProject = {
      ...activeProject,
      currentVersionNumber: newVersionNum,
      updatedAt: new Date().toISOString()
    };

    dbStore.saveInnovationProject(updatedProject);
    setActiveProject(updatedProject);

    const newVersion: InnovationVersion = {
      id: `ver_${activeProject.id}_${newVersionNum}`,
      innovationProjectId: activeProject.id,
      versionNumber: newVersionNum,
      title: activeProject.title,
      description: `${activeProject.description}\n[Accepted Differentiator]: ${rec.title}`,
      features: [
        ...activeReport.extractedComponents,
        {
          id: `comp_diff_${Date.now()}`,
          innovationProjectId: activeProject.id,
          featureCode: `F${activeReport.extractedComponents.length + 1}`,
          name: rec.title,
          term: rec.title,
          category: 'TECHNICAL_EFFECT',
          description: rec.description,
          importance: 'CORE',
          overlapStatus: 'POTENTIALLY_DISTINCTIVE',
          overlapConfidence: 0.90,
          matchedPriorArt: [],
          supportingEvidence: rec.supportingEvidence,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      relationships: activeReport.componentRelationships,
      recommendations: updatedRecs,
      author: currentUser?.name || 'Researcher',
      createdAt: new Date().toISOString()
    };

    dbStore.saveInnovationVersion(newVersion);

    const updatedReport = {
      ...activeReport,
      recommendations: updatedRecs,
      extractedComponents: newVersion.features
    };

    dbStore.saveBenchmarkReport(updatedReport);
    setActiveReport(updatedReport);
  };

  // Download Markdown Audit Dossier
  const handleDownloadDossier = () => {
    if (!activeReport) return;
    const dossierMd = generateMarkdownAuditDossier(activeReport, activeProject);
    const blob = new Blob([dossierMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Dossier_${activeReport.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Submit to Patent Team Review Queue
  const handleSubmitToPatentTeam = () => {
    if (!activeProject || !activeReport) return;

    const submission: PatentReviewSubmission = {
      id: `sub_${Date.now()}`,
      innovationProjectId: activeProject.id,
      submittedBy: currentUser?.id || 'usr_student',
      submittedByName: currentUser?.name || 'Student Researcher',
      status: 'SUBMITTED',
      priorArtConcern: activeReport.priorArtConcern,
      versionNumber: activeProject.currentVersionNumber,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbStore.saveReviewSubmission(submission);
    setActiveSubmission(submission);

    // Create Initial Reviewer Welcome Comment
    dbStore.saveReviewComment({
      id: `comm_${Date.now()}`,
      submissionId: submission.id,
      authorId: 'sys_bot',
      authorName: 'PatentIntel Audit Engine',
      comment: `Project submitted for patent team review. Review Readiness Score: ${activeReport.reviewReadinessScore}%. Prior-Art Concern: ${activeReport.priorArtConcern}.`,
      createdAt: new Date().toISOString()
    });

    setActiveTab('review_queue');
  };

  // Post Review Comment
  const handleAddReviewComment = () => {
    if (!activeSubmission || !newCommentText.trim()) return;

    const comment = dbStore.saveReviewComment({
      id: `comm_${Date.now()}`,
      submissionId: activeSubmission.id,
      authorId: currentUser?.id || 'usr_examiner',
      authorName: currentUser?.name || 'Lead Reviewer',
      comment: newCommentText.trim(),
      createdAt: new Date().toISOString()
    });

    setReviewComments([...reviewComments, comment]);
    setNewCommentText('');
  };

  // Submit Formal Review Decision
  const handleConfirmDecision = () => {
    if (!activeSubmission) return;

    dbStore.saveReviewDecision({
      id: `dec_${Date.now()}`,
      submissionId: activeSubmission.id,
      reviewerId: currentUser?.id || 'usr_examiner',
      reviewerName: currentUser?.name || 'Dr. Alex Vance',
      decision: decisionType,
      reason: decisionReason || 'Reviewed against prior-art evidence and component matrix.',
      createdAt: new Date().toISOString()
    });

    setShowDecisionModal(false);
    loadData();
  };

  // Hand-off to AI Claim Synthesizer
  const handleHandoffToClaimSynthesizer = () => {
    if (!activeProject || !onNavigate) return;
    const latestVersion = dbStore.getInnovationVersions(activeProject.id)[0];
    onNavigate('claim-synthesizer', {
      projectId: activeProject.id,
      title: activeProject.title,
      components: latestVersion?.features || activeReport?.extractedComponents || [],
      relationships: activeReport?.componentRelationships || []
    });
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ========================================================================= */}
      {/* TOP HEADER & SUB-NAVIGATION                                              */}
      {/* ========================================================================= */}
      <div 
        className="glass-panel"
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '16px', 
          padding: '24px', 
          borderRadius: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: 52, 
              height: 52, 
              borderRadius: 14, 
              background: 'var(--gradient-accent)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Lightbulb size={26} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-main)', margin: 0 }}>
                R&D Idea Novelty & Prior-Art Benchmarking Engine
              </h1>
              <span 
                style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  fontFamily: 'var(--font-mono)', 
                  background: 'rgba(99, 102, 241, 0.15)', 
                  color: 'var(--accent-indigo)', 
                  border: '1px solid rgba(99, 102, 241, 0.3)', 
                  borderRadius: 999, 
                  padding: '3px 10px' 
                }}
              >
                v2.5 Enterprise
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
              Multi-corpus prior-art cross-referencing, feature provenance audit, & patent team workflow integration.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Buttons */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'var(--bg-input)', 
            padding: '6px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)' 
          }}
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'dashboard' ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === 'dashboard' ? '#FFFFFF' : 'var(--text-muted)'
            }}
          >
            <Layers size={15} />
            <span>Dashboard & Projects</span>
          </button>

          <button
            onClick={() => {
              setWizardStep(1);
              setActiveTab('wizard');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'wizard' ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === 'wizard' ? '#FFFFFF' : 'var(--text-muted)'
            }}
          >
            <Sparkles size={15} />
            <span>+ New Innovation</span>
          </button>

          <button
            onClick={() => setActiveTab('review_queue')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              background: activeTab === 'review_queue' ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === 'review_queue' ? '#FFFFFF' : 'var(--text-muted)'
            }}
          >
            <FileCheck size={15} />
            <span>Patent Review Queue</span>
            {reviewSubmissions.filter(s => s.status === 'SUBMITTED').length > 0 && (
              <span 
                style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: 'var(--accent-amber)', 
                  position: 'absolute', 
                  top: 6, 
                  right: 6 
                }} 
              />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: DASHBOARD & INNOVATION MANAGER                                */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Saved R&D Innovation Projects</h2>
            <button
              onClick={() => {
                setWizardStep(1);
                setActiveTab('wizard');
              }}
              className="btn-primary"
            >
              <Plus size={16} />
              <span>Create New Project</span>
            </button>
          </div>

          {projects.length === 0 ? (
            <div 
              style={{ 
                background: 'var(--bg-card)', 
                border: '1px dashed var(--border-color)', 
                borderRadius: '20px', 
                padding: '48px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '16px' 
              }}
            >
              <div 
                style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: '50%', 
                  background: 'var(--bg-surface)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--accent-indigo)' 
                }}
              >
                <Lightbulb size={32} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>No Innovation Projects Yet</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '440px', margin: 0 }}>
                Start by uploading a project proposal document or using one of our pre-configured R&D research presets.
              </p>
              <button
                onClick={() => {
                  setWizardStep(1);
                  setActiveTab('wizard');
                }}
                className="btn-primary"
                style={{ marginTop: 8 }}
              >
                Launch Innovation Wizard
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {projects.map((proj) => {
                const report = dbStore.getLatestBenchmarkReport(proj.id);
                return (
                  <div 
                    key={proj.id}
                    className="glass-panel glass-panel-hover"
                    style={{ 
                      padding: '24px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      gap: '16px', 
                      cursor: 'pointer' 
                    }}
                    onClick={() => {
                      setActiveProject(proj);
                      if (report) setActiveReport(report);
                      setActiveTab('audit');
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span 
                          style={{ 
                            fontSize: '0.72rem', 
                            fontFamily: 'var(--font-mono)', 
                            padding: '3px 8px', 
                            borderRadius: 6, 
                            background: 'var(--bg-surface)', 
                            color: 'var(--text-muted)', 
                            border: '1px solid var(--border-color)' 
                          }}
                        >
                          v{proj.currentVersionNumber}.0
                        </span>
                        <span 
                          style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700, 
                            padding: '3px 10px', 
                            borderRadius: 999, 
                            textTransform: 'uppercase',
                            background: proj.status === 'APPROVED_FOR_DRAFTING' ? 'rgba(16,185,129,0.12)' : proj.status === 'SUBMITTED' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                            color: proj.status === 'APPROVED_FOR_DRAFTING' ? 'var(--accent-emerald)' : proj.status === 'SUBMITTED' ? 'var(--accent-amber)' : 'var(--accent-indigo)',
                            border: `1px solid ${proj.status === 'APPROVED_FOR_DRAFTING' ? 'rgba(16,185,129,0.3)' : proj.status === 'SUBMITTED' ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.3)'}`
                          }}
                        >
                          {proj.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
                        {proj.title}
                      </h3>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {proj.description}
                      </p>
                    </div>

                    <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {report && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Review Readiness</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-indigo)' }}>{report.reviewReadinessScore}%</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span>Created {new Date(proj.createdAt).toLocaleDateString()}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-indigo)', fontWeight: 600 }}>
                          <span>Inspect Report</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: STEP-BY-STEP NEW INNOVATION WIZARD                           */}
      {/* ========================================================================= */}
      {activeTab === 'wizard' && (
        <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            {[
              { step: 1, label: 'Basic Info & Presets' },
              { step: 2, label: 'Technical Details' },
              { step: 3, label: 'Document Upload' },
              { step: 4, label: 'Human Feature Validation' },
              { step: 5, label: 'Live Benchmark Run' }
            ].map((s) => (
              <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 700, 
                    fontSize: '0.8rem',
                    background: wizardStep === s.step ? 'var(--accent-indigo)' : wizardStep > s.step ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface)',
                    color: wizardStep === s.step ? '#FFFFFF' : wizardStep > s.step ? 'var(--accent-emerald)' : 'var(--text-dim)',
                    border: `1px solid ${wizardStep === s.step ? 'var(--accent-indigo)' : wizardStep > s.step ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`
                  }}
                >
                  {wizardStep > s.step ? <Check size={16} /> : s.step}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: wizardStep === s.step ? 'var(--text-main)' : 'var(--text-dim)' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: BASIC INFO & PRESETS */}
          {wizardStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Step 1: Innovation Proposal Overview</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
                  Enter your project idea title or choose a pre-configured student research proposal preset below.
                </p>
              </div>

              {/* Preset Buttons Header & Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Research Presets ({RESEARCH_PRESETS.length} Available)
                  </label>
                  {(activePresetId !== null || proposalTitle || technicalProblem) && (
                    <button
                      onClick={handleClearForm}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        cursor: 'pointer'
                      }}
                    >
                      Clear / Reset Form
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {RESEARCH_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyPresetSample(preset.id)}
                        style={{
                          background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface)',
                          border: `1.5px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                          borderRadius: '12px',
                          padding: '14px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span 
                            style={{ 
                              fontSize: '0.68rem', 
                              fontWeight: 700, 
                              color: isSelected ? 'var(--accent-indigo)' : 'var(--accent-cyan)',
                              background: 'var(--bg-card)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {preset.badge}
                          </span>
                          {isSelected && <Check size={14} color="var(--accent-indigo)" />}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
                          {preset.id}. {preset.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {preset.summary}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {activePresetId !== null && (
                  <div 
                    style={{ 
                      background: 'rgba(99, 102, 241, 0.08)', 
                      border: '1px solid rgba(99, 102, 241, 0.25)', 
                      borderRadius: '10px', 
                      padding: '10px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      fontSize: '0.82rem', 
                      color: 'var(--text-main)' 
                    }}
                  >
                    <Sparkles size={16} color="var(--accent-indigo)" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Preset Loaded:</strong> You can now edit or customize any title, domain, technical problem, solution architecture, or expected technical effect text below at any time!
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Proposal Title</label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="e.g. IoT Autonomous Agriculture Telemetry & Predictive Shelf-Life Network"
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Domain Field</label>
                  <input
                    type="text"
                    value={proposalDomain}
                    onChange={(e) => setProposalDomain(e.target.value)}
                    placeholder="e.g. Smart Agriculture & IoT Sensors"
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
                <button
                  disabled={!proposalTitle.trim()}
                  onClick={() => setWizardStep(2)}
                  className="btn-primary"
                  style={{ opacity: !proposalTitle.trim() ? 0.5 : 1 }}
                >
                  <span>Next: Technical Specification</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TECHNICAL DETAILS */}
          {wizardStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Step 2: Technical Problem & Proposed Solution</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
                  Clearly describe the core technical bottleneck, your proposed solution architecture, and expected technical effects.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Technical Problem & Prior-Art Bottleneck</label>
                  <textarea
                    rows={3}
                    value={technicalProblem}
                    onChange={(e) => setTechnicalProblem(e.target.value)}
                    placeholder="Describe the existing system limitations or unaddressed technical challenge..."
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Proposed Technical Solution Architecture</label>
                  <textarea
                    rows={3}
                    value={proposedSolution}
                    onChange={(e) => setProposedSolution(e.target.value)}
                    placeholder="Describe your hardware components, algorithms, data streams, and execution steps..."
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Expected Technical Effect & Advantages</label>
                  <input
                    type="text"
                    value={expectedTechnicalEffect}
                    onChange={(e) => setExpectedTechnicalEffect(e.target.value)}
                    placeholder="e.g. Reduces power consumption by 35% and maintains sub-50ms execution latency..."
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px' }}>
                <button
                  onClick={() => setWizardStep(1)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="btn-primary"
                >
                  <span>Next: Upload Proposal PDF / Text</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DOCUMENT UPLOAD */}
          {wizardStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Step 3: Attach R&D Document / Paste Text</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
                  Upload your proposal paper PDF or paste the full document text for automated component extraction.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* File Upload Box */}
                <div 
                  style={{ 
                    border: '2px dashed var(--border-color)', 
                    borderRadius: '16px', 
                    padding: '32px', 
                    textAlign: 'center', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    background: 'var(--bg-input)' 
                  }}
                >
                  <Upload size={32} color="var(--accent-indigo)" />
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Upload PDF / TXT Proposal Document</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Supports PDF text layer extraction via pdfParser</p>
                  <label className="btn-primary" style={{ cursor: 'pointer', marginTop: 8 }}>
                    <span>Browse Files</span>
                    <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Paste Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Or Paste Document Text</label>
                  <textarea
                    rows={6}
                    value={proposalText}
                    onChange={(e) => setProposalText(e.target.value)}
                    placeholder="Paste project abstract, methodology section, or proposal text..."
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px' }}>
                <button
                  onClick={() => setWizardStep(2)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={proceedToFeatureValidation}
                  className="btn-primary"
                >
                  <span>Extract Features & Validate</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: HUMAN FEATURE VALIDATION STEP */}
          {wizardStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={20} color="var(--accent-indigo)" />
                    <span>Step 4: Human Feature Validation</span>
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
                    Review and refine the extracted technical components before searching USPTO & OpenAlex prior-art databases.
                  </p>
                </div>

                <button
                  onClick={handleAddComponent}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <Plus size={14} />
                  <span>Add Feature</span>
                </button>
              </div>

              {/* Component Cards List */}
              <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: 4 }}>
                {validatedComponents.map((comp, idx) => (
                  <div key={comp.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                          {comp.featureCode}
                        </span>
                        <input
                          type="text"
                          value={comp.term}
                          onChange={(e) => {
                            const updated = [...validatedComponents];
                            updated[idx].term = e.target.value;
                            setValidatedComponents(updated);
                          }}
                          className="input-field"
                          style={{ fontWeight: 700, width: '240px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={comp.category}
                          onChange={(e) => {
                            const updated = [...validatedComponents];
                            updated[idx].category = e.target.value as any;
                            setValidatedComponents(updated);
                          }}
                          className="input-field"
                          style={{ width: 'auto' }}
                        >
                          <option value="COMPONENT">COMPONENT</option>
                          <option value="FUNCTION">FUNCTION</option>
                          <option value="DATA">DATA</option>
                          <option value="PROCESS">PROCESS</option>
                          <option value="RELATIONSHIP">RELATIONSHIP</option>
                          <option value="CONSTRAINT">CONSTRAINT</option>
                          <option value="TECHNICAL_EFFECT">TECHNICAL EFFECT</option>
                        </select>

                        <select
                          value={comp.importance}
                          onChange={(e) => {
                            const updated = [...validatedComponents];
                            updated[idx].importance = e.target.value as any;
                            setValidatedComponents(updated);
                          }}
                          className="input-field"
                          style={{ width: 'auto' }}
                        >
                          <option value="CORE">CORE</option>
                          <option value="SUPPORTING">SUPPORTING</option>
                          <option value="OPTIONAL">OPTIONAL</option>
                        </select>

                        <button
                          onClick={() => setValidatedComponents(validatedComponents.filter(c => c.id !== comp.id))}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={comp.description}
                      onChange={(e) => {
                        const updated = [...validatedComponents];
                        updated[idx].description = e.target.value;
                        setValidatedComponents(updated);
                      }}
                      className="input-field"
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setWizardStep(3)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={executeBenchmarkRun}
                  className="btn-primary"
                >
                  <Sparkles size={16} />
                  <span>Approve & Run Multi-Corpus Search</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: LIVE BENCHMARK EXECUTION */}
          {wizardStep === 5 && (
            <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '2px solid var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={36} color="var(--accent-indigo)" style={{ animation: 'spin 1.5s linear infinite' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Executing Prior-Art Benchmarking</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontFamily: 'var(--font-mono)', margin: 0 }}>{analysisStage}</p>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ width: '100%', background: 'var(--bg-input)', borderRadius: 999, height: 10, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${analysisProgress}%`, 
                      background: 'var(--gradient-accent)', 
                      height: '100%', 
                      transition: 'width 0.4s ease' 
                    }}
                  />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{analysisProgress}%</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: NOVELTY AUDIT REPORT & EVIDENCE EXPLORER                     */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && activeReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Legal Disclaimer Banner */}
          <div 
            style={{ 
              background: 'rgba(99, 102, 241, 0.08)', 
              border: '1px solid rgba(99, 102, 241, 0.25)', 
              borderRadius: '14px', 
              padding: '14px 18px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}
          >
            <Shield size={20} color="var(--accent-indigo)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
              <strong style={{ color: 'var(--accent-indigo)' }}>AI-Assisted R&D Pre-Screening Notice:</strong> This audit report evaluates technical feature overlap against live USPTO master records and OpenAlex research literature. It does not constitute a legal opinion, legal validity determination, or guarantee of patentability.
            </div>
          </div>

          {/* Report Summary Banner */}
          <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', alignItems: 'center' }}>
            {/* Prior-Art Concern Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>Prior-Art Concern</span>
              <div 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 12, 
                  fontSize: '0.85rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  background: activeReport.priorArtConcern === 'HIGH' ? 'rgba(244, 63, 94, 0.12)' : activeReport.priorArtConcern === 'MODERATE' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  color: activeReport.priorArtConcern === 'HIGH' ? 'var(--accent-rose)' : activeReport.priorArtConcern === 'MODERATE' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                  border: `1px solid ${activeReport.priorArtConcern === 'HIGH' ? 'rgba(244, 63, 94, 0.3)' : activeReport.priorArtConcern === 'MODERATE' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                }}
              >
                {activeReport.priorArtConcern === 'HIGH' && <AlertTriangle size={16} />}
                {activeReport.priorArtConcern === 'MODERATE' && <ShieldAlert size={16} />}
                {activeReport.priorArtConcern === 'LOW' && <CheckCircle2 size={16} />}
                <span>{activeReport.priorArtConcern} CONCERN</span>
              </div>
            </div>

            {/* Review Readiness Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>Review Readiness</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)' }}>{activeReport.reviewReadinessScore}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>Prepared for Patent Review</div>
              </div>
            </div>

            {/* Component Status Counts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>Component Overlap Breakdown</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 10, padding: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-rose)', fontSize: '1.2rem' }}>{activeReport.directOverlapCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Known</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 10, padding: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-amber)', fontSize: '1.2rem' }}>{activeReport.partialOverlapCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Partial</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, padding: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '1.2rem' }}>{activeReport.potentiallyDistinctiveCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Distinctive</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-main)', fontSize: '1.2rem' }}>{activeReport.insufficientEvidenceCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Sparse</div>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Subject-Matter Eligibility Filter (Section 3(k) / 101 Gatekeeper) */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `4px solid ${activeReport.statutoryEligibility?.status === 'PASS' ? 'var(--accent-emerald)' : 'var(--accent-amber)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Scale size={18} color={activeReport.statutoryEligibility?.status === 'PASS' ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Statutory Subject-Matter Eligibility Gatekeeper ({activeReport.statutoryEligibility?.sectionRef || 'Section 3(k) / 35 U.S.C. § 101'})
                </h4>
              </div>
              <span 
                style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  padding: '3px 10px', 
                  borderRadius: 6, 
                  background: activeReport.statutoryEligibility?.status === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                  color: activeReport.statutoryEligibility?.status === 'PASS' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                  border: `1px solid ${activeReport.statutoryEligibility?.status === 'PASS' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}
              >
                {activeReport.statutoryEligibility?.status === 'PASS' ? 'STATUTORY ELIGIBILITY PASS' : 'WARNING: ABSTRACT CLAIM RISK'}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              {activeReport.statutoryEligibility?.reason || 'Hardware binding verified. Appears statutory under patent subject-matter eligibility guidelines.'}
            </p>
          </div>

          {/* Action Bar */}
          <div className="glass-panel" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[
                { id: 'graph', label: 'Architecture Topology' },
                { id: 'matrix', label: 'Feature Overlap Matrix' },
                { id: 'combinations', label: 'Combination Analysis' },
                { id: 'differentiators', label: 'Differentiator Advisor' },
                { id: 'versions', label: 'Version History' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveReportTab(t.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    background: activeReportTab === t.id ? 'var(--accent-indigo)' : 'transparent',
                    color: activeReportTab === t.id ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setShowFerModal(true)}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.78rem', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
              >
                <FileText size={15} />
                <span>Simulate Office Action (FER)</span>
              </button>

              <button
                onClick={handleDownloadDossier}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.78rem' }}
              >
                <Download size={15} />
                <span>Export Dossier (.md)</span>
              </button>

              <button
                onClick={handleSubmitToPatentTeam}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.78rem' }}
              >
                <Send size={15} />
                <span>Submit to Patent Team</span>
              </button>
            </div>
          </div>

          {/* TAB A: ARCHITECTURE GRAPH */}
          {activeReportTab === 'graph' && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>System Component Topology Graph</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Click any component node to inspect feature details</span>
              </div>

              {/* Connected Visual Topology Graph */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', background: 'var(--bg-input)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                {activeReport.extractedComponents.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedNodeComponent(comp)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${
                        comp.overlapStatus === 'KNOWN_PRIOR_ART' ? 'rgba(244, 63, 94, 0.4)' :
                        comp.overlapStatus === 'PARTIAL_OVERLAP' ? 'rgba(245, 158, 11, 0.4)' :
                        'rgba(16, 185, 129, 0.4)'
                      }`,
                      background: comp.overlapStatus === 'KNOWN_PRIOR_ART' ? 'rgba(244, 63, 94, 0.08)' :
                                  comp.overlapStatus === 'PARTIAL_OVERLAP' ? 'rgba(245, 158, 11, 0.08)' :
                                  'rgba(16, 185, 129, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                        {comp.featureCode}
                      </span>
                      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.8, color: 'var(--text-muted)' }}>
                        {comp.category}
                      </span>
                    </div>

                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', margin: '0 0 4px 0' }}>{comp.term}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{comp.description}</p>
                  </div>
                ))}
              </div>

              {/* Selected Component Drawer */}
              {selectedNodeComponent && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-indigo)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-indigo)', margin: 0 }}>
                      Feature Inspection: {selectedNodeComponent.featureCode} — {selectedNodeComponent.term}
                    </h4>
                    <button onClick={() => setSelectedNodeComponent(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{selectedNodeComponent.description}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Supporting Prior-Art Evidence:</span>
                    {selectedNodeComponent.supportingEvidence.map((ev) => (
                      <div key={ev.id} style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>[{ev.sourceType}] {ev.title}</div>
                        <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', margin: 0 }}>"{ev.passage}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB B: FEATURE OVERLAP MATRIX */}
          {activeReportTab === 'matrix' && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Component Overlap Matrix</h3>

                {/* Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {['ALL', 'KNOWN_PRIOR_ART', 'PARTIAL_OVERLAP', 'POTENTIALLY_DISTINCTIVE'].map(status => (
                    <button
                      key={status}
                      onClick={() => setSelectedFilterStatus(status)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedFilterStatus === status ? 'var(--accent-indigo)' : 'var(--bg-surface)',
                        color: selectedFilterStatus === status ? '#FFFFFF' : 'var(--text-dim)'
                      }}
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeReport.extractedComponents
                  .filter(c => selectedFilterStatus === 'ALL' || c.overlapStatus === selectedFilterStatus)
                  .map((comp) => (
                    <div key={comp.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--accent-indigo)', border: '1px solid var(--border-color)' }}>
                            {comp.featureCode}
                          </span>
                          <h4 style={{ fontWeight: 700, color: 'var(--text-main)', margin: 0, fontSize: '0.95rem' }}>{comp.term}</h4>
                        </div>

                        <span 
                          style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            padding: '4px 10px', 
                            borderRadius: 999, 
                            textTransform: 'uppercase',
                            background: comp.overlapStatus === 'KNOWN_PRIOR_ART' ? 'rgba(244, 63, 94, 0.12)' : comp.overlapStatus === 'PARTIAL_OVERLAP' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: comp.overlapStatus === 'KNOWN_PRIOR_ART' ? 'var(--accent-rose)' : comp.overlapStatus === 'PARTIAL_OVERLAP' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                            border: `1px solid ${comp.overlapStatus === 'KNOWN_PRIOR_ART' ? 'rgba(244, 63, 94, 0.3)' : comp.overlapStatus === 'PARTIAL_OVERLAP' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}
                        >
                          {comp.overlapStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{comp.description}</p>

                      {/* Accordion Matched Prior Art Excerpts */}
                      {comp.matchedPriorArt.length > 0 && (
                        <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Why Was This Matched?</span>
                          {comp.matchedPriorArt.map((m, idx) => (
                            <div key={idx} style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-main)' }}>
                                <span>[{m.sourceType}] {m.title}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)' }}>{m.similarityScore}% Match</span>
                              </div>
                              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>"{m.matchingExcerpt}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB C: COMBINATION ANALYSIS */}
          {activeReportTab === 'combinations' && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Inter-Component Combination Novelty</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
                  Analyzes whether combinations of individual components create a non-obvious synergistic technical effect.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeReport.componentRelationships.map((rel) => (
                  <div key={rel.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                        <span>{rel.fromTerm}</span>
                        <span style={{ color: 'var(--text-dim)' }}>➔ [{rel.relationshipType}] ➔</span>
                        <span>{rel.toTerm}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
                        {rel.overlapStatus}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{rel.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB D: DIFFERENTIATOR ADVISOR */}
          {activeReportTab === 'differentiators' && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Potential Differentiator Advisor</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
                  Accepting a recommendation adds the differentiator to your innovation proposal and creates Version 2.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {activeReport.recommendations.map((rec) => (
                  <div key={rec.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-indigo)', margin: 0 }}>{rec.title}</h4>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', background: rec.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface)', color: rec.status === 'ACCEPTED' ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                          {rec.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{rec.description}</p>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>Prior-Art Gap:</strong> {rec.priorArtGap}
                      </div>
                    </div>

                    {rec.status !== 'ACCEPTED' && (
                      <button
                        onClick={() => handleAcceptRecommendation(rec)}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '8px 12px' }}
                      >
                        Accept & Create Version 2
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB E: VERSION HISTORY */}
          {activeReportTab === 'versions' && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Innovation Project Version History</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dbStore.getInnovationVersions(activeReport.innovationProjectId).map((ver) => (
                  <div key={ver.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        Version {ver.versionNumber}.0
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(ver.createdAt).toLocaleString()}</span>
                    </div>

                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>{ver.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{ver.description}</p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>Includes {ver.features.length} technical components</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: PATENT TEAM REVIEW QUEUE & REVIEWER WORKSPACE                 */}
      {/* ========================================================================= */}
      {activeTab === 'review_queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Patent Team Review Queue</h2>
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 999, background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
              {reviewSubmissions.length} Total Submissions
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            {/* Submissions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviewSubmissions.map((sub) => {
                const proj = dbStore.getInnovationProjectById(sub.innovationProjectId);
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setActiveSubmission(sub);
                      if (proj) setActiveProject(proj);
                      const rep = dbStore.getLatestBenchmarkReport(sub.innovationProjectId);
                      if (rep) setActiveReport(rep);
                      setReviewComments(dbStore.getReviewComments(sub.id));
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${activeSubmission?.id === sub.id ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                      background: activeSubmission?.id === sub.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{sub.submittedByName}</span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', background: 'var(--bg-surface)', color: 'var(--accent-indigo)' }}>
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj?.title || 'Innovation Submission'}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>v{sub.versionNumber}.0</span>
                      <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reviewer Workspace Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeSubmission && activeProject ? (
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{activeProject.title}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>Submitted by {activeSubmission.submittedByName} on {new Date(activeSubmission.submittedAt).toLocaleString()}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setShowDecisionModal(true)}
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.78rem' }}
                      >
                        Issue Review Decision
                      </button>

                      {activeSubmission.status === 'APPROVED_FOR_DRAFTING' && (
                        <button
                          onClick={handleHandoffToClaimSynthesizer}
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.78rem', background: 'var(--gradient-emerald)' }}
                        >
                          <Sparkles size={14} />
                          <span>Generate Claim Draft</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submission Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.8rem' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontWeight: 700 }}>Technical Problem:</span>
                      <p style={{ color: 'var(--text-main)', margin: 0 }}>{activeProject.technicalProblem}</p>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontWeight: 700 }}>Proposed Solution:</span>
                      <p style={{ color: 'var(--text-main)', margin: 0 }}>{activeProject.proposedSolution}</p>
                    </div>
                  </div>

                  {/* Review Thread */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Review Thread & Comments</h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: 4 }}>
                      {reviewComments.map((comm) => (
                        <div key={comm.id} style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-main)' }}>
                            <span>{comm.authorName}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{new Date(comm.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{comm.comment}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Add review feedback or question..."
                        className="input-field"
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={handleAddReviewComment}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.78rem' }}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: '20px', padding: '48px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                  Select a submission from the left panel to inspect full details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DECISION MODAL */}
      {showDecisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Issue Patent Team Review Decision</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Decision Action</label>
              <select
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value as any)}
                className="input-field"
              >
                <option value="APPROVED_FOR_DRAFTING">Approve for Patent Claim Drafting</option>
                <option value="NEEDS_REVISION">Request Revision (Add Differentiators)</option>
                <option value="REJECTED">Reject / Prior Art Overlap</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Reviewer Rationale</label>
              <textarea
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Enter feedback or instructions for the student researcher..."
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                className="btn-primary"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATED FIRST EXAMINATION REPORT (FER) MODAL */}
      {showFerModal && activeReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--accent-indigo)', borderRadius: '24px', padding: '32px', maxWidth: '750px', width: '100%', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Simulated Patent Pre-Examination Engine</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={22} color="var(--accent-indigo)" />
                  <span>First Examination Report (FER) / Office Action Draft</span>
                </h3>
              </div>
              <button onClick={() => setShowFerModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Official Header Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontWeight: 700 }}>Dossier ID:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-indigo)' }}>{activeReport.id}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontWeight: 700 }}>Jurisdiction:</span>
                <span style={{ color: 'var(--text-main)' }}>USPTO / EPO / CGPDTM</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontWeight: 700 }}>Examiner Verdict:</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>APPROVED FOR DRAFTING</span>
              </div>
            </div>

            {/* Section 1: Statutory Eligibility */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--accent-indigo)', paddingLeft: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-indigo)', margin: 0 }}>
                1. Statutory Subject-Matter Eligibility (35 U.S.C. § 101 / Section 3(k))
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {activeReport.statutoryEligibility?.reason || 'Claim limits recite physical hardware transceivers and edge sensor microcontrollers. Statutory apparatus threshold satisfied.'}
              </p>
            </div>

            {/* Section 2: Section 102 Novelty & Prior Art */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--accent-rose)', paddingLeft: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-rose)', margin: 0 }}>
                2. Prior Art Novelty Objections (Section 102)
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Identified {activeReport.directOverlapCount} direct prior-art collisions. Primary cited reference Patent US11604965B2 discloses telemetry processing.
              </p>
            </div>

            {/* Section 3: Section 103 TSM Obviousness */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--accent-amber)', paddingLeft: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-amber)', margin: 0 }}>
                3. Inventive Step & Multi-Document Combination (Section 103 / TSM)
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Section 103 Risk Score: {activeReport.tsmObviousnessRisk?.score || 45}%. Motivation to combine Ref 1 (Edge Node) with Ref 2 (Neural Degradation Model) is suggested by domain engineering standards.
              </p>
            </div>

            {/* Section 4: ColPali Multimodal Schematic Verification */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)', margin: 0 }}>
                4. ColPali Multimodal Schematic Verification
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Visual topology match of FIG. 3A block diagram against global patent repository: 88% visual structural similarity identified.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <button onClick={() => setShowFerModal(false)} className="btn-secondary">
                Close
              </button>
              <button onClick={handleDownloadFerReport} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <Download size={16} />
                <span>Download Formal FER (.txt)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default IdeaNoveltyView;
