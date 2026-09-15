import type {
  InnovationProject,
  NoveltyBenchmarkReport,
  PatentReviewSubmission,
  ReviewComment
} from '../types';

export const DEFAULT_PRESET_PROJECTS: InnovationProject[] = [
  {
    id: 'proj_preset_1',
    ownerId: 'usr_demo_101',
    ownerName: 'Dr. Alex Vance',
    title: 'IoT Autonomous Agriculture Telemetry & Predictive Shelf-Life Network',
    domain: 'Smart Agriculture & IoT Sensors',
    description: 'Spectral produce degradation monitoring & automated dispatch priority.',
    technicalProblem: 'Agricultural produce undergoes rapid degradation in transit, causing 30% logistics waste due to unmonitored thermal spikes and static transport routing.',
    proposedSolution: 'An edge IoT multi-sensor telemetry node (F1) continuously acquires spectral data streams. A deep convolutional degradation neural network (F2) calculates real-time shelf-life vectors. The output dynamically couples to an automated inventory recommendation engine (F3).',
    expectedTechnicalEffect: 'Extends transport shelf-life predictability by 45% and reduces supply chain degradation waste by 38%.',
    status: 'APPROVED_FOR_DRAFTING',
    currentVersionNumber: 2,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'proj_preset_2',
    ownerId: 'usr_demo_101',
    ownerName: 'Dr. Alex Vance',
    title: 'Quantum-Resistant Edge Sensor Telemetry Encryption System',
    domain: 'Cybersecurity & Embedded Systems',
    description: 'Hardware lattice-based zero-knowledge proofs & encrypted MQTT broker.',
    technicalProblem: 'IoT sensors deployed in critical energy infrastructure are vulnerable to post-quantum decryption attacks on centralized cloud databases.',
    proposedSolution: 'Hardware-isolated cryptographic modules on edge microcontrollers perform lattice-based zero-knowledge proof (ZKP) key rotation (F1) before dispatching telemetry streams (F2) over an encrypted MQTT broker (F3).',
    expectedTechnicalEffect: 'Achieves post-quantum security compliance with sub-15ms latency overhead on memory-constrained edge hardware.',
    status: 'UNDER_REVIEW',
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'proj_preset_3',
    ownerId: 'usr_demo_101',
    ownerName: 'Dr. Alex Vance',
    title: 'AI Dynamic Latency Throttling for Autonomous Edge UAV Navigation',
    domain: 'Robotics & Edge Compute',
    description: 'Closed-loop execution scaling for optical flow point-cloud processing.',
    technicalProblem: 'Unmanned aerial vehicles (UAVs) experience sensor processing throttling during extreme thermals, risking trajectory collapse.',
    proposedSolution: 'A dual-stage neural network dynamically balances optical flow compute latency against hardware thermal limits (F1) using closed-loop execution scaling (F2).',
    expectedTechnicalEffect: 'Eliminates thermal throttling crashes and maintains 60 FPS spatial point-cloud processing.',
    status: 'SUBMITTED',
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'proj_preset_4',
    ownerId: 'usr_demo_101',
    ownerName: 'Dr. Alex Vance',
    title: 'Multimodal Transformer Fusion for Real-Time Pathology Anomaly Detection',
    domain: 'Healthcare AI & Medical Imaging',
    description: 'Cross-attention fusion of spatial MRI slices & genomic biomarkers.',
    technicalProblem: 'High false-positive rates in early-stage oncology screening due to isolated analysis of medical imaging without real-time genomic biomarker alignment.',
    proposedSolution: 'A dual-stream multimodal transformer architecture (F1) fuses high-resolution 3D MRI voxel slices with real-time liquid biopsy genomic sequence streams (F2). A spatial-cross-attention module (F3) computes voxel-level tumor probability heatmaps.',
    expectedTechnicalEffect: 'Improves early oncology detection sensitivity by 29% while reducing diagnostic latency from 48 hours to under 3 minutes.',
    status: 'NEEDS_REVISION',
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'proj_preset_5',
    ownerId: 'usr_demo_101',
    ownerName: 'Dr. Alex Vance',
    title: 'Decentralized Peer-to-Peer Microgrid Battery Degradation Balancing',
    domain: 'Clean Energy & Smart Grid Control',
    description: 'State-of-Health electrochemistry tracking & decentralized smart contracts.',
    technicalProblem: 'Local solar microgrids experience accelerated battery degradation due to uncoordinated peer-to-peer discharge spikes during peak grid demand.',
    proposedSolution: 'Edge micro-inverter controllers execute decentralized consensus (F1) based on real-time State-of-Health (SoH) electrochemical impedance models (F2). Dynamic smart contracts balance local discharge rates (F3) to equalize degradation rates across battery packs.',
    expectedTechnicalEffect: 'Extends overall microgrid energy storage lifespan by 3.5 years and reduces localized degradation variance by 52%.',
    status: 'SUBMITTED',
    currentVersionNumber: 1,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'proj_preset_6',
    ownerId: 'usr_demo_101',
    ownerName: 'Dr. Alex Vance',
    title: 'Edge Point-Cloud Compression for Autonomous Vehicle Spatial Tracking',
    domain: 'Autonomous Vehicles & Computer Vision',
    description: 'Spatiotemporal octree compression & low-latency bounding box tracking.',
    technicalProblem: '3D LiDAR point-cloud data streams overwhelm vehicle CAN-bus bandwidth, causing 120ms transmission delays in obstacle detection.',
    proposedSolution: 'A hardware-accelerated octree compression encoder (F1) prunes redundant point-cloud data in real-time. A spatiotemporal Kalman-Transformer filter (F2) reconstructs bounding boxes (F3) directly at the vehicle ECU.',
    expectedTechnicalEffect: 'Reduces point-cloud data volume by 78% while maintaining sub-10ms bounding-box spatial tracking accuracy.',
    status: 'APPROVED_FOR_DRAFTING',
    currentVersionNumber: 2,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export const DEFAULT_PRESET_REPORTS: NoveltyBenchmarkReport[] = [
  // Preset 1 Report
  {
    id: 'REP-NOVELTY-PRESET-1',
    innovationProjectId: 'proj_preset_1',
    noveltyRunId: 'run_preset_1',
    ideaTitle: 'IoT Autonomous Agriculture Telemetry & Predictive Shelf-Life Network',
    priorArtConcern: 'LOW',
    overallNoveltyScore: 84,
    priorArtOverlapRisk: 'LOW',
    reviewReadinessScore: 92,
    directOverlapCount: 0,
    partialOverlapCount: 2,
    potentiallyDistinctiveCount: 2,
    insufficientEvidenceCount: 0,
    patentCandidatesReviewed: 6,
    academicCandidatesReviewed: 5,
    extractedComponents: [
      {
        id: 'comp_p1_1',
        innovationProjectId: 'proj_preset_1',
        featureCode: 'F1',
        name: 'Multi-Spectral Edge Telemetry Node',
        term: 'Multi-Spectral Edge Telemetry Node',
        category: 'COMPONENT',
        description: 'Physical sensor node configured to capture spectral reflectance and ethylene concentration in agricultural transport containers.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.88,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p1_2',
        innovationProjectId: 'proj_preset_1',
        featureCode: 'F2',
        name: 'Convolutional Produce Degradation Model',
        term: 'Convolutional Produce Degradation Model',
        category: 'PROCESS',
        description: 'Edge neural network predicting shelf-life decay curves based on thermal and gas concentration time-series.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.85,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p1_3',
        innovationProjectId: 'proj_preset_1',
        featureCode: 'F3',
        name: 'Dynamic Dispatch Priority Engine',
        term: 'Dynamic Dispatch Priority Engine',
        category: 'FUNCTION',
        description: 'Logistics routing module automatically re-ordering transport queues based on predicted shelf-life metrics.',
        importance: 'SUPPORTING',
        overlapStatus: 'PARTIAL_OVERLAP',
        overlapConfidence: 0.72,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p1_4',
        innovationProjectId: 'proj_preset_1',
        featureCode: 'F4',
        name: 'Transport Shelf-Life Extension Apparatus',
        term: 'Transport Shelf-Life Extension Apparatus',
        category: 'TECHNICAL_EFFECT',
        description: 'Physical apparatus limitation reducing transit produce waste by 38% through real-time route adjustment.',
        importance: 'SUPPORTING',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.90,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    componentRelationships: [
      {
        id: 'rel_p1_1',
        fromComponentId: 'comp_p1_1',
        toComponentId: 'comp_p1_2',
        fromTerm: 'Multi-Spectral Edge Telemetry Node',
        toTerm: 'Convolutional Produce Degradation Model',
        relationshipType: 'feeds data to',
        description: 'Spectral telemetry streams directly into the degradation model.',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE'
      },
      {
        id: 'rel_p1_2',
        fromComponentId: 'comp_p1_2',
        toComponentId: 'comp_p1_3',
        fromTerm: 'Convolutional Produce Degradation Model',
        toTerm: 'Dynamic Dispatch Priority Engine',
        relationshipType: 'dynamically modulates',
        description: 'Predicted shelf-life vectors update dispatch ranking in real-time.',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE'
      }
    ],
    topMatchedPatents: [],
    topMatchedPapers: [],
    recommendations: [
      {
        id: 'rec_p1_1',
        innovationProjectId: 'proj_preset_1',
        title: 'Hardware Optical Filter Limitation for Ethylene Absorption',
        description: 'Bind the spectral sensor to optical bandpass filters matching 10.6 micron ethylene absorption lines.',
        relatedComponents: ['Multi-Spectral Edge Telemetry Node'],
        priorArtGap: 'Prior art uses broadband sensors prone to humidity interference.',
        supportingEvidence: [],
        confidence: 0.91,
        status: 'ACCEPTED',
        createdAt: new Date().toISOString(),
        draftClaimClause: 'wherein the multi-spectral node comprises an infrared bandpass filter tuned to 10.6 micrometers for ethylene gas detection.',
        officeActionResponseRationale: 'Demonstrates non-obvious hardware limitation overcoming Section 103 obviousness.',
        predictedImpact: { noveltyGain: 20, obviousnessReduction: 32, ftoClearanceGain: 25 }
      }
    ],
    statutoryEligibility: {
      status: 'PASS',
      sectionRef: 'Section 3(k) (India) / 35 U.S.C. § 101 (US)',
      reason: 'Physical apparatus limitation and sensor hardware coupling confirmed.',
      recommendations: ['Maintain physical sensor and telemetry bus limitations in claim 1.']
    },
    multimodalSchematics: { diagramCount: 2, schematicMatches: [] },
    tsmObviousnessRisk: { score: 28, level: 'LOW', combinedReferences: [] },
    searchScopeHealth: {
      patentSources: ['USPTO Master Registry', 'Workspace Patent Repository'],
      academicSources: ['OpenAlex Research Graph'],
      patentStatus: 'SUCCESS',
      academicStatus: 'SUCCESS',
      queriesUsed: ['agricultural produce telemetry ethylene shelf-life']
    },
    createdAt: new Date().toISOString()
  },

  // Preset 2 Report
  {
    id: 'REP-NOVELTY-PRESET-2',
    innovationProjectId: 'proj_preset_2',
    noveltyRunId: 'run_preset_2',
    ideaTitle: 'Quantum-Resistant Edge Sensor Telemetry Encryption System',
    priorArtConcern: 'LOW',
    overallNoveltyScore: 88,
    priorArtOverlapRisk: 'LOW',
    reviewReadinessScore: 85,
    directOverlapCount: 0,
    partialOverlapCount: 1,
    potentiallyDistinctiveCount: 3,
    insufficientEvidenceCount: 0,
    patentCandidatesReviewed: 6,
    academicCandidatesReviewed: 4,
    extractedComponents: [
      {
        id: 'comp_p2_1',
        innovationProjectId: 'proj_preset_2',
        featureCode: 'F1',
        name: 'Hardware Lattice-Based Key Generator',
        term: 'Hardware Lattice-Based Key Generator',
        category: 'COMPONENT',
        description: 'Physical Cryptographic Hardware Module executing Kyber/Dilithium lattice key exchange on microcontroller registers.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.92,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p2_2',
        innovationProjectId: 'proj_preset_2',
        featureCode: 'F2',
        name: 'Zero-Knowledge Telemetry Attestation',
        term: 'Zero-Knowledge Telemetry Attestation',
        category: 'PROCESS',
        description: 'Sub-15ms ZKP pipeline validating telemetry packet provenance without exposing private keys.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.89,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p2_3',
        innovationProjectId: 'proj_preset_2',
        featureCode: 'F3',
        name: 'Encrypted MQTT Telemetry Broker',
        term: 'Encrypted MQTT Telemetry Broker',
        category: 'FUNCTION',
        description: 'Low-overhead broker routing lattice-ciphertext over resource-constrained industrial telemetry channels.',
        importance: 'SUPPORTING',
        overlapStatus: 'PARTIAL_OVERLAP',
        overlapConfidence: 0.70,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    componentRelationships: [
      {
        id: 'rel_p2_1',
        fromComponentId: 'comp_p2_1',
        toComponentId: 'comp_p2_2',
        fromTerm: 'Hardware Lattice-Based Key Generator',
        toTerm: 'Zero-Knowledge Telemetry Attestation',
        relationshipType: 'couples to',
        description: 'Hardware lattice keys generate cryptographic attestation proofs.',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE'
      }
    ],
    topMatchedPatents: [],
    topMatchedPapers: [],
    recommendations: [],
    statutoryEligibility: {
      status: 'PASS',
      sectionRef: 'Section 3(k) (India) / 35 U.S.C. § 101 (US)',
      reason: 'Physical HSM hardware module limitation satisfies statutory apparatus criteria.',
      recommendations: ['Keep physical cryptographic register limitations in independent claim 1.']
    },
    multimodalSchematics: { diagramCount: 2, schematicMatches: [] },
    tsmObviousnessRisk: { score: 24, level: 'LOW', combinedReferences: [] },
    searchScopeHealth: {
      patentSources: ['USPTO Master Registry', 'Workspace Patent Repository'],
      academicSources: ['OpenAlex Research Graph'],
      patentStatus: 'SUCCESS',
      academicStatus: 'SUCCESS',
      queriesUsed: ['post-quantum lattice encryption IoT microcontroller']
    },
    createdAt: new Date().toISOString()
  },

  // Preset 3 Report (UAV Avionics)
  {
    id: 'REP-NOVELTY-PRESET-3',
    innovationProjectId: 'proj_preset_3',
    noveltyRunId: 'run_preset_3',
    ideaTitle: 'AI Dynamic Latency Throttling for Autonomous Edge UAV Navigation',
    priorArtConcern: 'LOW',
    overallNoveltyScore: 86,
    priorArtOverlapRisk: 'LOW',
    reviewReadinessScore: 88,
    directOverlapCount: 0,
    partialOverlapCount: 2,
    potentiallyDistinctiveCount: 2,
    insufficientEvidenceCount: 0,
    patentCandidatesReviewed: 6,
    academicCandidatesReviewed: 4,
    extractedComponents: [
      {
        id: 'comp_p3_1',
        innovationProjectId: 'proj_preset_3',
        featureCode: 'F1',
        name: 'Dynamic Thermal Profiling Engine',
        term: 'Dynamic Thermal Profiling Engine',
        category: 'COMPONENT',
        description: 'Continuous thermocouple telemetry ingestion module operating on edge GPU core clusters.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.88,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p3_2',
        innovationProjectId: 'proj_preset_3',
        featureCode: 'F2',
        name: 'Closed-Loop Execution Latency Scaler',
        term: 'Closed-Loop Execution Latency Scaler',
        category: 'PROCESS',
        description: 'Dynamic neural network quantization and layer-skipping controller that modulates inference frequency.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.85,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p3_3',
        innovationProjectId: 'proj_preset_3',
        featureCode: 'F3',
        name: 'Optical Flow Point-Cloud Fusion Pipeline',
        term: 'Optical Flow Point-Cloud Fusion Pipeline',
        category: 'FUNCTION',
        description: 'Dual-stream spatial perception fusion pipeline aligning LiDAR point-clouds with monocular optical flow.',
        importance: 'SUPPORTING',
        overlapStatus: 'PARTIAL_OVERLAP',
        overlapConfidence: 0.76,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p3_4',
        innovationProjectId: 'proj_preset_3',
        featureCode: 'F4',
        name: 'Sub-15ms Hardware Latency Governor',
        term: 'Sub-15ms Hardware Latency Governor',
        category: 'TECHNICAL_EFFECT',
        description: 'Physical apparatus limitation guaranteeing continuous real-time navigation guidance under extreme thermal throttling.',
        importance: 'SUPPORTING',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.90,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    componentRelationships: [
      {
        id: 'rel_p3_1',
        fromComponentId: 'comp_p3_1',
        toComponentId: 'comp_p3_2',
        fromTerm: 'Dynamic Thermal Profiling Engine',
        toTerm: 'Closed-Loop Execution Latency Scaler',
        relationshipType: 'dynamically modulates',
        description: 'Dynamic Thermal Profiling Engine output matrices calibrate Closed-Loop Execution Latency Scaler thresholds.',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE'
      },
      {
        id: 'rel_p3_2',
        fromComponentId: 'comp_p3_2',
        toComponentId: 'comp_p3_3',
        fromTerm: 'Closed-Loop Execution Latency Scaler',
        toTerm: 'Optical Flow Point-Cloud Fusion Pipeline',
        relationshipType: 'controls throughput of',
        description: 'Closed-Loop Execution Latency Scaler dynamically balances optical flow compute latency against hardware thermal limits.',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE'
      }
    ],
    topMatchedPatents: [],
    topMatchedPapers: [],
    recommendations: [
      {
        id: 'rec_p3_1',
        innovationProjectId: 'proj_preset_3',
        title: 'Hardware-Enforced Asynchronous Thermal Throttling Loop',
        description: 'Recast claim limitations to physically bind the thermal profiling engine to dedicated hardware interrupt registers on the edge GPU.',
        relatedComponents: ['Dynamic Thermal Profiling Engine', 'Closed-Loop Execution Latency Scaler'],
        priorArtGap: 'Prior art documents solely discuss software-level task queues without hardware interrupt-level dynamic model quantization.',
        supportingEvidence: [],
        confidence: 0.88,
        status: 'SUGGESTED',
        createdAt: new Date().toISOString(),
        draftClaimClause: 'wherein the hardware governor executes an interrupt service routine that dynamically scales neural precision within a 15-millisecond thermal update cycle.',
        officeActionResponseRationale: 'Overcomes Section 103 obviousness by establishing that hardware interrupt-bound quantization yields unexpected latency preservation.',
        predictedImpact: { noveltyGain: 22, obviousnessReduction: 35, ftoClearanceGain: 28 }
      }
    ],
    statutoryEligibility: {
      status: 'PASS',
      sectionRef: 'Section 3(k) (India) / 35 U.S.C. § 101 (US)',
      reason: 'Apparatus and physical computing architecture limitations identified in technical disclosure.',
      recommendations: ['Bind algorithmic processes to physical edge transceivers and hardware memory buffers.']
    },
    multimodalSchematics: { diagramCount: 3, schematicMatches: [] },
    tsmObviousnessRisk: { score: 32, level: 'LOW', combinedReferences: [] },
    searchScopeHealth: {
      patentSources: ['USPTO Master Registry', 'Workspace Patent Repository'],
      academicSources: ['OpenAlex Research Graph', 'Semantic Scholar Graph'],
      patentStatus: 'SUCCESS',
      academicStatus: 'SUCCESS',
      queriesUsed: ['UAV autonomous navigation thermal latency scaling']
    },
    createdAt: new Date().toISOString()
  },

  // Preset 4 Report
  {
    id: 'REP-NOVELTY-PRESET-4',
    innovationProjectId: 'proj_preset_4',
    noveltyRunId: 'run_preset_4',
    ideaTitle: 'Multimodal Transformer Fusion for Real-Time Pathology Anomaly Detection',
    priorArtConcern: 'MODERATE',
    overallNoveltyScore: 72,
    priorArtOverlapRisk: 'MODERATE',
    reviewReadinessScore: 76,
    directOverlapCount: 1,
    partialOverlapCount: 2,
    potentiallyDistinctiveCount: 1,
    insufficientEvidenceCount: 0,
    patentCandidatesReviewed: 6,
    academicCandidatesReviewed: 6,
    extractedComponents: [
      {
        id: 'comp_p4_1',
        innovationProjectId: 'proj_preset_4',
        featureCode: 'F1',
        name: 'Dual-Stream Multimodal Transformer',
        term: 'Dual-Stream Multimodal Transformer',
        category: 'PROCESS',
        description: 'Neural architecture fusing 3D MRI voxel slices with liquid biopsy sequence streams.',
        importance: 'CORE',
        overlapStatus: 'PARTIAL_OVERLAP',
        overlapConfidence: 0.78,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p4_2',
        innovationProjectId: 'proj_preset_4',
        featureCode: 'F2',
        name: 'Spatial-Cross-Attention Alignment Unit',
        term: 'Spatial-Cross-Attention Alignment Unit',
        category: 'COMPONENT',
        description: 'Hardware cross-attention tensor accelerator computing voxel-level tumor probability heatmaps.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.86,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    componentRelationships: [],
    topMatchedPatents: [],
    topMatchedPapers: [],
    recommendations: [
      {
        id: 'rec_p4_1',
        innovationProjectId: 'proj_preset_4',
        title: 'Direct Liquid Biopsy Microfluidic Sensor Interface Limitation',
        description: 'Couple the transformer input layers directly to a physical lab-on-a-chip microfluidic sensor reading cell-free DNA.',
        relatedComponents: ['Dual-Stream Multimodal Transformer'],
        priorArtGap: 'Prior art treats multimodal inputs as pre-recorded static datasets rather than physical streaming microfluidic outputs.',
        supportingEvidence: [],
        confidence: 0.89,
        status: 'SUGGESTED',
        createdAt: new Date().toISOString(),
        draftClaimClause: 'wherein the system comprises a physical microfluidic flow cell coupled directly to an optical spectrometer.',
        officeActionResponseRationale: 'Overcomes Section 101 abstract idea rejection by binding AI to physical lab apparatus.',
        predictedImpact: { noveltyGain: 24, obviousnessReduction: 30, ftoClearanceGain: 28 }
      }
    ],
    statutoryEligibility: {
      status: 'WARNING',
      sectionRef: 'Section 3(k) (India) / 35 U.S.C. § 101 (US)',
      reason: 'Algorithmic transformer process without physical lab-on-a-chip sensor limitations risks Alice Step 1 rejection.',
      recommendations: ['Recite physical microfluidic sensor limitations in independent apparatus claim.']
    },
    multimodalSchematics: { diagramCount: 2, schematicMatches: [] },
    tsmObviousnessRisk: { score: 58, level: 'MODERATE', combinedReferences: [] },
    searchScopeHealth: {
      patentSources: ['USPTO Master Registry'],
      academicSources: ['OpenAlex Research Graph'],
      patentStatus: 'SUCCESS',
      academicStatus: 'SUCCESS',
      queriesUsed: ['multimodal transformer pathology MRI genomic liquid biopsy']
    },
    createdAt: new Date().toISOString()
  },

  // Preset 5 Report
  {
    id: 'REP-NOVELTY-PRESET-5',
    innovationProjectId: 'proj_preset_5',
    noveltyRunId: 'run_preset_5',
    ideaTitle: 'Decentralized Peer-to-Peer Microgrid Battery Degradation Balancing',
    priorArtConcern: 'LOW',
    overallNoveltyScore: 86,
    priorArtOverlapRisk: 'LOW',
    reviewReadinessScore: 84,
    directOverlapCount: 0,
    partialOverlapCount: 2,
    potentiallyDistinctiveCount: 2,
    insufficientEvidenceCount: 0,
    patentCandidatesReviewed: 6,
    academicCandidatesReviewed: 4,
    extractedComponents: [
      {
        id: 'comp_p5_1',
        innovationProjectId: 'proj_preset_5',
        featureCode: 'F1',
        name: 'Electrochemical Impedance Sensor Node',
        term: 'Electrochemical Impedance Sensor Node',
        category: 'COMPONENT',
        description: 'Physical hardware module embedded in inverter measuring Nyquist plot impedance in real-time.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.90,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p5_2',
        innovationProjectId: 'proj_preset_5',
        featureCode: 'F2',
        name: 'Decentralized State-of-Health Dispatch Protocol',
        term: 'Decentralized State-of-Health Dispatch Protocol',
        category: 'PROCESS',
        description: 'Consensus engine distributing power discharge demands to balance battery degradation curves.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.85,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    componentRelationships: [],
    topMatchedPatents: [],
    topMatchedPapers: [],
    recommendations: [],
    statutoryEligibility: {
      status: 'PASS',
      sectionRef: 'Section 3(k) (India) / 35 U.S.C. § 101 (US)',
      reason: 'Physical microgrid inverter and battery cell limitation present.',
      recommendations: ['Maintain physical inverter circuit limitations in claims.']
    },
    multimodalSchematics: { diagramCount: 2, schematicMatches: [] },
    tsmObviousnessRisk: { score: 30, level: 'LOW', combinedReferences: [] },
    searchScopeHealth: {
      patentSources: ['USPTO Master Registry'],
      academicSources: ['OpenAlex Research Graph'],
      patentStatus: 'SUCCESS',
      academicStatus: 'SUCCESS',
      queriesUsed: ['microgrid battery degradation electrochemical impedance P2P']
    },
    createdAt: new Date().toISOString()
  },

  // Preset 6 Report
  {
    id: 'REP-NOVELTY-PRESET-6',
    innovationProjectId: 'proj_preset_6',
    noveltyRunId: 'run_preset_6',
    ideaTitle: 'Edge Point-Cloud Compression for Autonomous Vehicle Spatial Tracking',
    priorArtConcern: 'LOW',
    overallNoveltyScore: 91,
    priorArtOverlapRisk: 'LOW',
    reviewReadinessScore: 94,
    directOverlapCount: 0,
    partialOverlapCount: 1,
    potentiallyDistinctiveCount: 3,
    insufficientEvidenceCount: 0,
    patentCandidatesReviewed: 6,
    academicCandidatesReviewed: 5,
    extractedComponents: [
      {
        id: 'comp_p6_1',
        innovationProjectId: 'proj_preset_6',
        featureCode: 'F1',
        name: 'Hardware-Accelerated Octree Pruning Engine',
        term: 'Hardware-Accelerated Octree Pruning Engine',
        category: 'COMPONENT',
        description: 'FPGA/ASIC execution unit pruning spatial point-cloud redundancy directly on vehicle LiDAR sensor bus.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.94,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp_p6_2',
        innovationProjectId: 'proj_preset_6',
        featureCode: 'F2',
        name: 'Spatiotemporal Kalman-Transformer Bounding Box Filter',
        term: 'Spatiotemporal Kalman-Transformer Bounding Box Filter',
        category: 'PROCESS',
        description: 'Low-latency bounding-box reconstruction pipeline executing directly within vehicle ECU cache.',
        importance: 'CORE',
        overlapStatus: 'POTENTIALLY_DISTINCTIVE',
        overlapConfidence: 0.90,
        matchedPriorArt: [],
        supportingEvidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    componentRelationships: [],
    topMatchedPatents: [],
    topMatchedPapers: [],
    recommendations: [],
    statutoryEligibility: {
      status: 'PASS',
      sectionRef: 'Section 3(k) (India) / 35 U.S.C. § 101 (US)',
      reason: 'Physical vehicle ECU and LiDAR sensor hardware apparatus limitations recite patentable subject matter.',
      recommendations: ['Keep vehicle CAN-bus interface in claim limitations.']
    },
    multimodalSchematics: { diagramCount: 3, schematicMatches: [] },
    tsmObviousnessRisk: { score: 22, level: 'LOW', combinedReferences: [] },
    searchScopeHealth: {
      patentSources: ['USPTO Master Registry'],
      academicSources: ['OpenAlex Research Graph'],
      patentStatus: 'SUCCESS',
      academicStatus: 'SUCCESS',
      queriesUsed: ['LiDAR point cloud compression octree autonomous vehicle']
    },
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_PRESET_SUBMISSIONS: PatentReviewSubmission[] = [
  {
    id: 'sub_preset_1',
    innovationProjectId: 'proj_preset_1',
    submittedBy: 'usr_demo_101',
    submittedByName: 'Dr. Alex Vance',
    status: 'APPROVED_FOR_DRAFTING',
    priorArtConcern: 'LOW',
    versionNumber: 2,
    submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'sub_preset_2',
    innovationProjectId: 'proj_preset_2',
    submittedBy: 'usr_demo_101',
    submittedByName: 'Dr. Alex Vance',
    status: 'UNDER_REVIEW',
    priorArtConcern: 'LOW',
    versionNumber: 1,
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'sub_preset_3',
    innovationProjectId: 'proj_preset_3',
    submittedBy: 'usr_demo_101',
    submittedByName: 'Dr. Alex Vance',
    status: 'SUBMITTED',
    priorArtConcern: 'LOW',
    versionNumber: 1,
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'sub_preset_4',
    innovationProjectId: 'proj_preset_4',
    submittedBy: 'usr_demo_101',
    submittedByName: 'Dr. Alex Vance',
    status: 'NEEDS_REVISION',
    priorArtConcern: 'MODERATE',
    versionNumber: 1,
    submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'sub_preset_5',
    innovationProjectId: 'proj_preset_5',
    submittedBy: 'usr_demo_101',
    submittedByName: 'Dr. Alex Vance',
    status: 'SUBMITTED',
    priorArtConcern: 'LOW',
    versionNumber: 1,
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'sub_preset_6',
    innovationProjectId: 'proj_preset_6',
    submittedBy: 'usr_demo_101',
    submittedByName: 'Dr. Alex Vance',
    status: 'APPROVED_FOR_DRAFTING',
    priorArtConcern: 'LOW',
    versionNumber: 2,
    submittedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export const DEFAULT_PRESET_COMMENTS: ReviewComment[] = [
  {
    id: 'comm_p3_1',
    submissionId: 'sub_preset_3',
    authorId: 'usr_demo_101',
    authorName: 'Dr. Alex Vance',
    comment: 'The thermal profiling interrupt limitation is clearly novel over standard autopilot systems. Recommend proceeding to provisional filing upon final claim wording review.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];
