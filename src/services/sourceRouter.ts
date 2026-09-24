import { normalizePatentNumber } from './patentNormalizer';

/**
 * PatentIntel.AI - Dual Pipeline Source Router & Classifier
 * Strictly separates Patent Resolution (USPTO/Google Patents) from Academic Research (OpenAlex/IEEE).
 * MANDATORY RULE: A Patent Identifier MUST NEVER fall back to an Academic Search Engine.
 */

export type SearchDomain = 'PATENT' | 'ACADEMIC' | 'ALL';

export type SearchClassification = 'PATENT_IDENTIFIER' | 'PATENT_KEYWORD' | 'NATURAL_LANGUAGE_ACADEMIC';

export interface RouteDecision {
  input: string;
  classification: SearchClassification;
  targetDomain: SearchDomain;
  isPatentId: boolean;
  normalizedId?: string;
}

/**
 * Validates whether an input string is a structural patent publication number or patent identifier
 * Examples: US11650869B2, US11940634B2, US10255577B1, EP3400000A1, WO2021000000A1, 11650869, US 11,650,869 B2
 */
export function isPatentIdentifier(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  try {
    normalizePatentNumber(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Source Router logic executing mandatory domain classification (Rule #3 & #20)
 */
export function resolveSearchDomain(input: string, userSelectedMode: SearchDomain = 'ALL'): RouteDecision {
  const trimmed = input.trim();
  const isPatentId = isPatentIdentifier(trimmed);
  const normalizedId = isPatentId ? normalizePatentNumber(trimmed).normalizedInput : undefined;

  let classification: SearchClassification;
  let targetDomain: SearchDomain;

  if (isPatentId) {
    classification = 'PATENT_IDENTIFIER';
    targetDomain = 'PATENT'; // FORCE PATENT ROUTE FOR PATENT IDENTIFIERS (Rule #4 & #5)
  } else if (userSelectedMode === 'ACADEMIC') {
    classification = 'NATURAL_LANGUAGE_ACADEMIC';
    targetDomain = 'ACADEMIC';
  } else if (userSelectedMode === 'PATENT') {
    classification = 'PATENT_KEYWORD';
    targetDomain = 'PATENT';
  } else {
    classification = 'PATENT_KEYWORD';
    targetDomain = 'ALL';
  }

  // Mandatory Logging (Rule #42)
  console.log(`[ROUTER] Input: "${trimmed}"`);
  console.log(`[CLASSIFIER] Type: ${classification}`);
  console.log(`[ROUTER] Destination: ${targetDomain}`);
  if (isPatentId) {
    console.log(`[OPENALEX] NOT CALLED (Isolated Patent Identifier Route)`);
  }

  return {
    input: trimmed,
    classification,
    targetDomain,
    isPatentId,
    normalizedId: normalizedId ? (/^\d/.test(normalizedId) ? `US${normalizedId}` : normalizedId) : undefined
  };
}
