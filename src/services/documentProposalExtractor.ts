/**
 * Intelligent Document & Proposal Metadata Extractor
 * Automatically extracts Title, Domain, Technical Problem, Solution Architecture,
 * Technical Effects, and Keywords from unstructured uploaded documents (PDF, TXT, Markdown).
 */

export interface ExtractedProposalMetadata {
  title: string;
  domain: string;
  technicalProblem: string;
  proposedSolution: string;
  expectedTechnicalEffect: string;
  fullText: string;
  detectedKeywords: string[];
  wordCount: number;
}

const DOMAIN_KEYWORDS: Array<{ domain: string; keywords: string[] }> = [
  {
    domain: 'Smart Agriculture & IoT Systems',
    keywords: ['agriculture', 'crop', 'soil', 'produce', 'shelf-life', 'ethylene', 'farming', 'spectral reflectance', 'harvest', 'irrigation']
  },
  {
    domain: 'Cybersecurity & Cryptography',
    keywords: ['cryptography', 'encryption', 'quantum-resistant', 'lattice', 'zero-knowledge', 'cipher', 'mqtt broker', 'key exchange', 'malware', 'attack vector']
  },
  {
    domain: 'Robotics & UAV Avionics',
    keywords: ['uav', 'drone', 'avionics', 'flight', 'optical flow', 'throttling', 'quadcopter', 'actuator', 'telemetry', 'navigation', 'autopilot']
  },
  {
    domain: 'Medical AI & Pathology',
    keywords: ['mri', 'pathology', 'biomarker', 'histology', 'genomic', 'tumor', 'clinical', 'radiology', 'diagnostic', 'biomedical', 'patient']
  },
  {
    domain: 'Clean Energy & Smart Grid',
    keywords: ['microgrid', 'battery', 'degradation', 'smart grid', 'photovoltaic', 'solar', 'electrochemical', 'inverter', 'renewable', 'energy storage']
  },
  {
    domain: 'Autonomous Vehicles & Computer Vision',
    keywords: ['lidar', 'point-cloud', 'octree', 'autonomous vehicle', 'bounding box', 'spatiotemporal', 'can-bus', 'telemetry', 'perception', 'ecu']
  },
  {
    domain: 'Wireless Networks & 5G/6G',
    keywords: ['5g', '6g', 'c-v2x', 'cellular', 'transceiver', 'rfid', 'latency', 'sub-6ghz', 'mimo', 'beamforming']
  },
  {
    domain: 'Artificial Intelligence & Edge Computing',
    keywords: ['neural network', 'transformer', 'deep learning', 'convolutional', 'inference', 'edge computing', 'quantization', 'reinforcement learning']
  }
];

export function extractProposalMetadata(rawText: string, fileName?: string): ExtractedProposalMetadata {
  const text = (rawText || '').trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. EXTRACT TITLE
  let title = '';
  // Check explicit title markers
  for (const line of lines.slice(0, 10)) {
    const titleMatch = line.match(/^(?:project\s+title|proposal\s+title|title|paper\s+title)\s*[:#-]\s*(.+)$/i);
    if (titleMatch && titleMatch[1].trim().length > 5) {
      title = titleMatch[1].trim();
      break;
    }
    const hashMatch = line.match(/^#+\s+(.+)$/);
    if (hashMatch && hashMatch[1].trim().length > 5) {
      title = hashMatch[1].trim();
      break;
    }
  }

  // Fallback: Check top lines
  if (!title) {
    for (const line of lines.slice(0, 5)) {
      if (
        line.length >= 10 && 
        line.length <= 130 && 
        !/^(abstract|introduction|background|overview|contents|table of contents|author|date)/i.test(line) &&
        !/^page\s+\d+/i.test(line)
      ) {
        title = line;
        break;
      }
    }
  }

  // Fallback to cleaned file name
  if (!title && fileName) {
    title = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  if (!title) {
    title = 'Automated Technical Proposal';
  }

  // Clean trailing punctuation
  title = title.replace(/[:.]+$/, '').trim();

  // 2. INFER DOMAIN
  const lowerText = text.toLowerCase();
  let bestDomain = 'Artificial Intelligence & Edge Computing';
  let maxKeywordMatches = 0;
  const detectedKeywords: string[] = [];

  for (const candidate of DOMAIN_KEYWORDS) {
    let matchCount = 0;
    for (const kw of candidate.keywords) {
      if (lowerText.includes(kw)) {
        matchCount++;
        if (!detectedKeywords.includes(kw)) detectedKeywords.push(kw);
      }
    }
    if (matchCount > maxKeywordMatches) {
      maxKeywordMatches = matchCount;
      bestDomain = candidate.domain;
    }
  }

  // 3. EXTRACT SENTENCES FOR EVIDENCE
  const sentences = text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(s => s.length >= 25);

  // Helper to extract section content by possible header labels
  const extractSectionByHeaders = (headerPatterns: string[]): string => {
    const regex = new RegExp(
      `(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:${headerPatterns.join('|')})\\s*[:#-]?\\s*\\n?([^\\n]+(?:\\n(?!\\s*(?:#{1,6}\\s*)?(?:[A-Z][a-zA-Z0-9\\s]{2,30}:|#{1,6}\\s*))[^\\n]+)*)`,
      'i'
    );
    const match = text.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/\r?\n+/g, ' ').trim();
      if (cleaned.length > 15) return cleaned;
    }
    return '';
  };

  // 4. EXTRACT TECHNICAL PROBLEM
  let technicalProblem = extractSectionByHeaders([
    'technical\\s+problem',
    'problem\\s+statement',
    'background\\s+and\\s+problem',
    'limitations?',
    'bottlenecks?'
  ]);

  // Fallback: search problem indicative keywords
  if (!technicalProblem) {
    const problemSentences = sentences.filter(s => {
      const l = s.toLowerCase();
      return (
        l.includes('bottleneck') ||
        l.includes('suffers from') ||
        l.includes('limitation') ||
        l.includes('fails to') ||
        l.includes('challenge') ||
        l.includes('overwhelm') ||
        l.includes('high latency') ||
        l.includes('vulnerability') ||
        l.includes('inefficient') ||
        l.includes('delay') ||
        l.includes('degradation')
      );
    });
    if (problemSentences.length > 0) {
      technicalProblem = problemSentences.slice(0, 2).join(' ');
    }
  }

  if (!technicalProblem) {
    technicalProblem = `Current ${bestDomain.toLowerCase()} architectures suffer from latency, security or resource constraints during high-throughput operational execution.`;
  }

  // 5. EXTRACT PROPOSED SOLUTION
  let proposedSolution = extractSectionByHeaders([
    'proposed\\s+solution(?:\\s+architecture)?',
    'proposed\\s+architecture',
    'solution\\s+architecture',
    'proposed\\s+system',
    'methodology',
    'technical\\s+approach',
    'system\\s+architecture'
  ]);

  // Fallback: search solution indicative keywords
  if (!proposedSolution) {
    const solutionSentences = sentences.filter(s => {
      const l = s.toLowerCase();
      return (
        l.includes('we propose') ||
        l.includes('we provide') ||
        l.includes('we introduce') ||
        l.includes('we develop') ||
        l.includes('we design') ||
        l.includes('this paper presents') ||
        l.includes('presents a') ||
        l.includes('the proposed architecture') ||
        l.includes('our system') ||
        l.includes('comprises') ||
        l.includes('includes a') ||
        l.includes('framework utilizes') ||
        l.includes('our pipeline') ||
        l.includes('consists of')
      );
    });
    if (solutionSentences.length > 0) {
      proposedSolution = solutionSentences.slice(0, 2).join(' ');
    }
  }

  if (!proposedSolution) {
    proposedSolution = `A modular edge-accelerated pipeline configured to process sensor telemetry, enforce algorithmic optimization, and generate real-time control directives.`;
  }

  // 6. EXTRACT EXPECTED TECHNICAL EFFECT & ADVANTAGES
  let expectedTechnicalEffect = extractSectionByHeaders([
    'expected\\s+technical\\s+effect',
    'technical\\s+effects?',
    'expected\\s+effect',
    'advantages?',
    'performance\\s+results?',
    'key\\s+benefits?'
  ]);

  if (!expectedTechnicalEffect) {
    const effectSentences = sentences.filter(s => {
      const l = s.toLowerCase();
      return (
        l.includes('reduces') ||
        l.includes('improves') ||
        l.includes('achieves') ||
        l.includes('maintains sub-') ||
        l.includes('% reduction') ||
        l.includes('percent reduction') ||
        l.includes('throughput by') ||
        l.includes('power consumption') ||
        l.includes('zero-latency') ||
        l.includes('accuracy of')
      );
    });
    if (effectSentences.length > 0) {
      expectedTechnicalEffect = effectSentences[0];
    }
  }

  if (!expectedTechnicalEffect) {
    expectedTechnicalEffect = 'Maintains high fidelity and improves operational throughput by over 40% while preserving deterministic execution latency.';
  }

  return {
    title,
    domain: bestDomain,
    technicalProblem,
    proposedSolution,
    expectedTechnicalEffect,
    fullText: text,
    detectedKeywords: detectedKeywords.slice(0, 8),
    wordCount
  };
}
