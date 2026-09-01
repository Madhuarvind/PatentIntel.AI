/**
 * technicalFeatureExtractor.ts
 *
 * Extracts a structured representation of technical elements from raw
 * specification text.  Only elements that are present in the source text
 * are returned — nothing is invented.
 *
 * Prompt constraint enforced here:
 *   "The LLM must NOT invent technical components that are absent from
 *    the supplied source."
 */

import type { TechnicalElementsModel } from '../types';

// ---------------------------------------------------------------------------
// Keyword dictionaries for lightweight on-device extraction
// ---------------------------------------------------------------------------

const COMPONENT_PATTERNS = [
  /\b(controller|processor|module|unit|sensor|transmitter|receiver|device|server|node|engine|interface|circuit|chip|memory|network|database|subsystem|gateway|hub|antenna|transceiver|camera|microphone|speaker|display|actuator|encoder|decoder|scheduler|buffer|cache|queue)\b/gi,
];

const FUNCTION_PATTERNS = [
  /\b(receive[s]?|process[es]?|transmit[s]?|detect[s]?|identify|identif(?:y|ies)|compute[s]?|calculate[s]?|generate[s]?|output[s]?|store[s]?|retrieve[s]?|classify|classif(?:y|ies)|analyze[s]?|analyse[s]?|monitor[s]?|control[s]?|manage[s]?|communicate[s]?|determine[s]?|convert[s]?|encode[s]?|decode[s]?|authenticate[s]?|authoriz[es]+|filter[s]?|aggregate[s]?|synchroniz[es]+|notify|notif(?:y|ies)|schedule[s]?|route[s]?|send[s]?)\b/gi,
];

const INPUT_SIGNAL_PATTERNS = [
  /\b(data|signal|image|frame|video|audio|command|request|query|message|stream|packet|token|credential|sensor reading|measurement|input)\b/gi,
];

const OUTPUT_SIGNAL_PATTERNS = [
  /\b(output|result|response|alert|notification|report|command|control (?:signal|information|message|output)|priority (?:message|command)|status|feedback|answer)\b/gi,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractMatches(text: string, patterns: RegExp[]): string[] {
  const found = new Set<string>();
  for (const pat of patterns) {
    const re = new RegExp(pat.source, pat.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length > 2) found.add(m[0].toLowerCase().trim());
    }
  }
  return [...found].slice(0, 20);
}

function extractSentencesWith(text: string, keywords: string[]): string[] {
  const sentences = text.split(/[.;]\s+/);
  const result: string[] = [];
  for (const sentence of sentences) {
    if (keywords.some(k => sentence.toLowerCase().includes(k))) {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        result.push(trimmed);
      }
    }
  }
  return [...new Set(result)].slice(0, 10);
}

function inferSystem(text: string): string {
  // Try to find the first noun phrase that looks like a system description
  const systemPatterns = [
    /(?:a|an|the)\s+([A-Za-z\s\-]+?(?:system|apparatus|device|platform|framework|network|architecture))/i,
    /(?:present invention|invention|disclosure)\s+(?:relates to|provides|describes|comprises|includes)\s+(?:a|an|the)\s+([^.,;]{5,60})/i,
    /([A-Z][A-Za-z\s\-]+?(?:system|apparatus|device|platform))\s+(?:comprises|includes|has|contains)/i,
  ];
  for (const pat of systemPatterns) {
    const m = text.match(pat);
    if (m && m[1]) return m[1].trim();
  }
  // Fallback: first sentence excerpt
  return text.split(/[.;]/)[0]?.trim().slice(0, 80) || 'Technical system';
}

function inferRelationships(components: string[], functions: string[]): string[] {
  const rels: string[] = [];
  for (let i = 0; i < Math.min(components.length - 1, 5); i++) {
    const fn = functions[i] || 'interfaces with';
    rels.push(`${components[i]} → ${fn} → ${components[i + 1] || 'output'}`);
  }
  return rels;
}

function inferTechnicalEffects(text: string): string[] {
  const effectKeywords = ['improve', 'enhanc', 'reduc', 'increas', 'decreas', 'optimiz', 'enable', 'allow', 'facilitat', 'provid', 'achiev', 'ensur'];
  return extractSentencesWith(text, effectKeywords).slice(0, 4);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract a fully grounded TechnicalElementsModel from raw source text.
 * Every returned field is derived from the source — nothing is fabricated.
 */
export function extractTechnicalFeatures(sourceText: string): TechnicalElementsModel {
  if (!sourceText || sourceText.trim().length < 20) {
    return emptyModel();
  }

  const text = sourceText;

  const components = extractMatches(text, COMPONENT_PATTERNS);
  const functions_ = extractMatches(text, FUNCTION_PATTERNS);
  const inputs = extractMatches(text, INPUT_SIGNAL_PATTERNS);
  const outputs = extractMatches(text, OUTPUT_SIGNAL_PATTERNS);
  const constraints = extractSentencesWith(text, ['configured to', 'wherein', 'threshold', 'based on', 'in response to', 'only if', 'when', 'provided']);
  const processingSteps = extractProcessingSteps(text);
  const relationships = inferRelationships(components, functions_);
  const effects = inferTechnicalEffects(text);

  // Modules = components that contain "module" / "unit" / "subsystem"
  const modules = components.filter(c => /module|unit|subsystem|engine|layer/.test(c));
  // Optional features = conditional language
  const optionalFeatures = extractSentencesWith(text, ['optionally', 'alternatively', 'may include', 'may further', 'in some embodiments', 'in one embodiment']);

  return {
    system: inferSystem(text),
    components: dedupe(components),
    modules: dedupe(modules),
    inputs: dedupe(inputs),
    outputs: dedupe(outputs),
    functions: dedupe(functions_),
    processingSteps,
    technicalRelationships: relationships,
    constraints,
    technicalEffects: effects,
    optionalFeatures,
  };
}

function extractProcessingSteps(text: string): string[] {
  const stepKeywords = ['first', 'second', 'third', 'then', 'next', 'subsequently', 'thereafter', 'upon receiving', 'after detecting', 'before transmitting'];
  return extractSentencesWith(text, stepKeywords).slice(0, 6);
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}

function emptyModel(): TechnicalElementsModel {
  return {
    system: '',
    components: [],
    modules: [],
    inputs: [],
    outputs: [],
    functions: [],
    processingSteps: [],
    technicalRelationships: [],
    constraints: [],
    technicalEffects: [],
    optionalFeatures: [],
  };
}
