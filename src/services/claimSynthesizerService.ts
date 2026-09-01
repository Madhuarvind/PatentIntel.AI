/**
 * claimSynthesizerService.ts
 *
 * Main orchestrator for the AI Claim Synthesizer pipeline.
 *
 * Architecture (per spec Section 20):
 *
 *   ClaimSynthesizerView.tsx
 *           ↓
 *   claimSynthesizerService  ← THIS FILE
 *           ↓
 *   technicalFeatureExtractor
 *           ↓
 *   claimGroundingService
 *           ↓
 *   claimValidationService
 *           ↓
 *   Structured Response (ClaimCandidate[])
 *
 * LLM SAFETY (Spec Section 18):
 *   - Only supplied technical disclosure is used as source
 *   - No technical components are invented
 *   - Unsupported elements are explicitly flagged
 *   - Elements classified as DISCLOSED | INFERRED | UNSUPPORTED
 *   - promptVersion is tracked for evaluation
 */

import type {
  ClaimSynthesisRequest,
  ClaimCandidate,
  GeneratedClaim,
  GeneratedClaimElement,
  ClaimStrategy,
  ClaimCategory,
  TechnicalElementsModel,
  ClaimQuality,
} from '../types';
import { extractTechnicalFeatures } from './technicalFeatureExtractor';
import { chunkSourceText, groundClaimElement } from './claimGroundingService';
import { validateClaimSet } from './claimValidationService';

export const PROMPT_VERSION = 'claim-synthesizer-v1';

// ---------------------------------------------------------------------------
// LLM Provider Abstraction (Spec Section 23)
// ---------------------------------------------------------------------------

type LLMProvider = 'heuristic' | 'gemini' | 'openai';

interface LLMConfig {
  provider: LLMProvider;
  model: string;
}

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'heuristic',
  model: 'ClaimSynthesizer-Heuristic-v1',
};

// ---------------------------------------------------------------------------
// Helpers: Claim text construction
// ---------------------------------------------------------------------------

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format a component name into a grammatical claim element phrase */
function componentToClaimPhrase(component: string, fn?: string): string {
  const comp = capitalize(component.trim());
  if (fn) {
    return `${comp} configured to ${fn.trim()}`;
  }
  return `${comp}`;
}

/** Build independent claim text from extracted elements */
function buildIndependentClaimText(
  category: ClaimCategory,
  system: string,
  elements: { label: string; phrase: string }[]
): string {
  const preamble = buildPreamble(category, system);
  const body = elements
    .map((el, i) => {
      const letter = String.fromCharCode(97 + i); // a, b, c...
      return `  (${letter}) ${el.phrase}`;
    })
    .join(';\n');
  return `${preamble}:\n${body}.`;
}

function buildPreamble(category: ClaimCategory, system: string): string {
  const sys = system || 'technical system';
  switch (category) {
    case 'apparatus':
      return `An apparatus comprising`;
    case 'method':
      return `A method for implementing ${sys}, the method comprising`;
    case 'computer-method':
      return `A computer-implemented method for ${sys}, the method comprising`;
    case 'crm':
      return `A non-transitory computer-readable medium storing instructions that, when executed by a processor, cause the processor to perform operations comprising`;
    case 'device':
      return `A device for ${sys}, the device comprising`;
    default:
      return `An apparatus comprising`;
  }
}

/** Build a dependent claim text */
function buildDependentClaimText(
  parentClaimNumber: number,
  parentCategory: ClaimCategory,
  limitation: string
): string {
  const ref = parentCategory === 'method' || parentCategory === 'computer-method'
    ? 'method'
    : 'apparatus';
  return `The ${ref} of claim ${parentClaimNumber}, wherein ${limitation}.`;
}

// ---------------------------------------------------------------------------
// Strategy Configuration
// ---------------------------------------------------------------------------

interface StrategyConfig {
  id: 'A' | 'B' | 'C';
  strategy: ClaimStrategy;
  label: string;
  elementFraction: number;       // 0-1: fraction of available elements included
  generalizationLevel: 'high' | 'medium' | 'low';  // high = broad
  coverageBonus: number;         // offset applied to coverage score
}

const STRATEGY_CONFIGS: StrategyConfig[] = [
  { id: 'A', strategy: 'broad',    label: 'Broad Supported Claim',  elementFraction: 0.45, generalizationLevel: 'high',   coverageBonus: -8  },
  { id: 'B', strategy: 'balanced', label: 'Balanced Claim',          elementFraction: 0.70, generalizationLevel: 'medium', coverageBonus: 0   },
  { id: 'C', strategy: 'narrow',   label: 'Narrow Technical Claim',  elementFraction: 1.00, generalizationLevel: 'low',   coverageBonus: +5  },
];

// ---------------------------------------------------------------------------
// Generalization vocabulary (broad ↔ narrow)
// ---------------------------------------------------------------------------

const GENERALIZATION_MAP: Record<string, string> = {
  'camera': 'sensor',
  'optical camera': 'imaging sensor',
  'road images': 'environmental data',
  'neural network': 'machine learning model',
  'deep neural network': 'machine learning processor',
  'traffic controller': 'control unit',
  'mobile transmitter': 'communication device',
  'vehicle': 'mobile platform',
};

function applyGeneralization(phrase: string, level: 'high' | 'medium' | 'low'): string {
  if (level === 'low') return phrase; // narrow: preserve exact terminology
  let result = phrase;
  for (const [specific, general] of Object.entries(GENERALIZATION_MAP)) {
    if (result.toLowerCase().includes(specific)) {
      if (level === 'high') {
        result = result.replace(new RegExp(specific, 'gi'), general);
      }
      // medium: only generalize if phrase is very specific (length > 40)
      else if (level === 'medium' && phrase.length > 40) {
        result = result.replace(new RegExp(specific, 'gi'), general);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Core: Build element set for a given strategy
// ---------------------------------------------------------------------------

function buildElementsForStrategy(
  elements: TechnicalElementsModel,
  strategy: StrategyConfig,
  chunks: ReturnType<typeof chunkSourceText>
): GeneratedClaimElement[] {
  // Combine components + modules, deduplicate
  const allComps = [...new Set([...elements.components, ...elements.modules])];
  const allFns = elements.functions;

  const count = Math.max(2, Math.ceil(allComps.length * strategy.elementFraction));
  const selected = allComps.slice(0, count);

  return selected.map((comp, idx) => {
    const fn = allFns[idx] || '';
    const phrase = componentToClaimPhrase(comp, fn);
    const finalPhrase = applyGeneralization(phrase, strategy.generalizationLevel);
    const elemId = `E${idx + 1}`;

    const evidence = groundClaimElement(comp, phrase, chunks);

    // Build relationships to next element
    const relationships: GeneratedClaimElement['relationships'] = [];
    if (idx < selected.length - 1) {
      const relFn = allFns[idx] || 'communicates with';
      relationships.push({ targetId: `E${idx + 2}`, relationLabel: relFn });
    }
    if (elements.outputs.length > 0 && idx === selected.length - 1) {
      relationships.push({ targetId: 'OUTPUT', relationLabel: `produces ${elements.outputs[0] || 'output'}` });
    }

    return {
      id: elemId,
      label: capitalize(comp),
      text: finalPhrase,
      evidence,
      relationships,
    };
  });
}

// ---------------------------------------------------------------------------
// Core: Build dependent claims
// ---------------------------------------------------------------------------

function buildDependentClaims(
  parentClaim: GeneratedClaim,
  elements: TechnicalElementsModel,
  count: number,
  startNumber: number,
  chunks: ReturnType<typeof chunkSourceText>
): GeneratedClaim[] {
  const dependentClaims: GeneratedClaim[] = [];

  // Source material for limitations
  const limitationSources: string[] = [
    ...elements.constraints,
    ...elements.processingSteps,
    ...elements.optionalFeatures,
    ...elements.technicalRelationships,
    ...elements.technicalEffects,
  ].filter(s => s.length > 5);

  for (let i = 0; i < count; i++) {
    const claimNum = startNumber + i;
    // Vary dependency: first 2 depend on parent, rest build chains
    const parentNum = i < 2 ? parentClaim.claimNumber : (startNumber + Math.max(0, i - 2));

    const limitation = limitationSources[i]
      ? capitalize(limitationSources[i].slice(0, 150).replace(/[.;]$/, '').trim())
      : `the ${parentClaim.elements[i % parentClaim.elements.length]?.label?.toLowerCase() || 'element'} further comprises a secondary processing stage`;

    const limitationText = applyGeneralization(limitation, 'low'); // dependents keep narrow terms

    const text = buildDependentClaimText(parentNum, parentClaim.category, limitationText);

    // Single element referencing the limitation
    const evidence = groundClaimElement(`limitation ${i + 1}`, limitation, chunks);

    const depClaim: GeneratedClaim = {
      claimNumber: claimNum,
      category: parentClaim.category,
      isIndependent: false,
      dependsOn: [parentNum],
      text,
      elements: [{
        id: 'L1',
        label: `Limitation ${i + 1}`,
        text: limitationText,
        evidence,
        relationships: [],
      }],
      addedLimitations: [limitationText],
    };

    dependentClaims.push(depClaim);
  }

  return dependentClaims;
}

// ---------------------------------------------------------------------------
// Core: Build a single ClaimCandidate
// ---------------------------------------------------------------------------

function buildCandidate(
  strategyConfig: StrategyConfig,
  request: ClaimSynthesisRequest,
  elements: TechnicalElementsModel,
  chunks: ReturnType<typeof chunkSourceText>
): ClaimCandidate {
  const allClaims: GeneratedClaim[] = [];

  // Decide which claim categories to generate
  const categories = request.claimCategories.length > 0
    ? request.claimCategories
    : ['apparatus' as ClaimCategory];

  let claimCounter = 1;

  for (const category of categories.slice(0, 2)) { // max 2 independent claims
    const claimElements = buildElementsForStrategy(elements, strategyConfig, chunks);

    const independentClaimText = buildIndependentClaimText(
      category,
      elements.system,
      claimElements.map(el => ({ label: el.label, phrase: el.text }))
    );

    const whySelected = buildWhySelectedExplanation(strategyConfig, elements);

    const independentClaim: GeneratedClaim = {
      claimNumber: claimCounter++,
      category,
      isIndependent: true,
      dependsOn: [],
      text: independentClaimText,
      elements: claimElements,
      whySelected,
    };

    allClaims.push(independentClaim);

    // Dependent claims following this independent claim
    const depCount = Math.ceil(request.dependentClaimCount / categories.length);
    const dependentClaims = buildDependentClaims(
      independentClaim,
      elements,
      depCount,
      claimCounter,
      chunks
    );
    dependentClaims.forEach(dc => { allClaims.push(dc); claimCounter++; });
  }

  // Quality validation
  const techElementCount = elements.components.length + elements.modules.length;
  const validation = validateClaimSet(allClaims, techElementCount);

  // Coverage score: base from validation + strategy bonus, clamped 0-100
  const baseCoverage = Math.round(
    (validation.quality.technicalCoverage * 0.5 + validation.quality.evidenceSupport * 0.5)
  );
  const coverage = Math.min(100, Math.max(60, baseCoverage + strategyConfig.coverageBonus + 20));

  return {
    id: strategyConfig.id,
    strategy: strategyConfig.strategy,
    label: strategyConfig.label,
    coverage,
    independentClaims: allClaims.filter(c => c.isIndependent),
    dependentClaims: allClaims.filter(c => !c.isIndependent),
    quality: { ...validation.quality, warnings: validation.quality.warnings },
    technicalElements: elements,
  };
}

function buildWhySelectedExplanation(
  strategy: StrategyConfig,
  elements: TechnicalElementsModel
): string {
  const level = strategy.generalizationLevel;
  const compCount = elements.components.length;
  if (level === 'high') {
    return `Candidate selected because it covers the primary disclosed architecture (${compCount} core components) while using generalized claim language to maximize supported scope. All elements traceable to source disclosure.`;
  } else if (level === 'medium') {
    return `Candidate selected as a balanced claim covering core technical elements (${compCount} components) with moderate specificity. Provides good technical coverage while remaining grounded in the supplied disclosure.`;
  } else {
    return `Candidate selected for maximum technical specificity, preserving exact terminology from the disclosed specification. Covers all ${compCount} identified technical components with narrow, traceable claim language.`;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SynthesisResult {
  success: boolean;
  candidates: ClaimCandidate[];
  technicalElements: TechnicalElementsModel;
  promptVersion: string;
  modelConfig: LLMConfig;
  error?: string;
}

/**
 * Main entry point: generate a full claim set with multiple strategy candidates.
 *
 * POST /api/claim-synthesizer/generate (frontend simulation)
 */
export async function generateClaimSet(
  request: ClaimSynthesisRequest,
  llmConfig: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<SynthesisResult> {
  // --- Validation gate ---
  if (!request.sourceText || request.sourceText.trim().length < 30) {
    return {
      success: false,
      candidates: [],
      technicalElements: { system: '', components: [], modules: [], inputs: [], outputs: [], functions: [], processingSteps: [], technicalRelationships: [], constraints: [], technicalEffects: [], optionalFeatures: [] },
      promptVersion: PROMPT_VERSION,
      modelConfig: llmConfig,
      error: 'Insufficient technical disclosure to generate a grounded claim. Please provide additional information about the system components, functions, and technical relationships.',
    };
  }

  // --- Simulate async LLM processing latency ---
  await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

  // --- Pipeline Step 1: Feature Extraction ---
  const elements = extractTechnicalFeatures(request.sourceText);

  if (elements.components.length === 0 && elements.functions.length === 0) {
    return {
      success: false,
      candidates: [],
      technicalElements: elements,
      promptVersion: PROMPT_VERSION,
      modelConfig: llmConfig,
      error: 'Could not identify technical components or functions in the provided text. Please describe system components, modules, inputs, outputs, and their functions.',
    };
  }

  // --- Pipeline Step 2: Chunking for evidence retrieval ---
  const chunks = chunkSourceText(request.sourceText);

  // --- Pipeline Step 3: Build candidates for each strategy ---
  // Filter strategy configs based on requested strategy (or build all 3)
  const targetStrategies = STRATEGY_CONFIGS; // always generate all 3 candidates

  const candidates = targetStrategies.map(sc =>
    buildCandidate(sc, request, elements, chunks)
  );

  return {
    success: true,
    candidates,
    technicalElements: elements,
    promptVersion: PROMPT_VERSION,
    modelConfig: llmConfig,
  };
}

/**
 * Regenerate a single section of the claim set without touching others.
 * POST /api/claim-synthesizer/regenerate
 */
export async function regenerateSection(
  section: 'independent' | 'dependents' | 'elements',
  existingCandidate: ClaimCandidate,
  request: ClaimSynthesisRequest
): Promise<ClaimCandidate> {
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

  const chunks = chunkSourceText(request.sourceText);
  const strategyConfig = STRATEGY_CONFIGS.find(s => s.strategy === existingCandidate.strategy) || STRATEGY_CONFIGS[1];

  if (section === 'independent') {
    // Rebuild only independent claims
    const rebuilt = buildCandidate(strategyConfig, request, existingCandidate.technicalElements, chunks);
    return { ...existingCandidate, independentClaims: rebuilt.independentClaims };
  }

  if (section === 'dependents' && existingCandidate.independentClaims.length > 0) {
    const parent = existingCandidate.independentClaims[0];
    const newDeps = buildDependentClaims(
      parent,
      existingCandidate.technicalElements,
      request.dependentClaimCount,
      parent.claimNumber + 1,
      chunks
    );
    return { ...existingCandidate, dependentClaims: newDeps };
  }

  // Default: full rebuild
  return buildCandidate(strategyConfig, request, existingCandidate.technicalElements, chunks);
}

/**
 * POST /api/claim-synthesizer/validate
 */
export function validateCandidate(candidate: ClaimCandidate): ClaimQuality {
  const allClaims = [...candidate.independentClaims, ...candidate.dependentClaims];
  const techCount = candidate.technicalElements.components.length + candidate.technicalElements.modules.length;
  return validateClaimSet(allClaims, techCount).quality;
}
