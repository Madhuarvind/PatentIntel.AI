/**
 * claimValidationService.ts
 *
 * Post-generation quality validation.  Runs the 8 quality rules from
 * specification Section 31 and returns a structured ClaimQuality report.
 *
 * These are internal model-quality indicators, NOT legal validity scores.
 */

import type { GeneratedClaim, ClaimQuality } from '../types';

// ---------------------------------------------------------------------------
// Rule Checks
// ---------------------------------------------------------------------------

/** Rule 1: At least one claim with text exists */
function checkClaimTextExists(claims: GeneratedClaim[]): boolean {
  return claims.length > 0 && claims.every(c => c.text && c.text.trim().length > 10);
}

/** Rule 2: At least one independent claim exists */
function checkIndependentClaimExists(claims: GeneratedClaim[]): boolean {
  return claims.some(c => c.isIndependent);
}

/** Rule 3: No duplicate claim numbers */
function checkNoDuplicateNumbers(claims: GeneratedClaim[]): boolean {
  const nums = claims.map(c => c.claimNumber);
  return new Set(nums).size === nums.length;
}

/** Rule 4: Dependent claims reference valid existing claim numbers */
function checkDependencyValidity(claims: GeneratedClaim[]): { valid: boolean; errors: string[] } {
  const existingNums = new Set(claims.map(c => c.claimNumber));
  const errors: string[] = [];
  for (const c of claims) {
    if (!c.isIndependent) {
      for (const dep of c.dependsOn) {
        if (!existingNums.has(dep)) {
          errors.push(`Claim ${c.claimNumber} references non-existent Claim ${dep}`);
        }
        if (dep >= c.claimNumber) {
          errors.push(`Claim ${c.claimNumber} references future Claim ${dep} (forward reference)`);
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/** Rule 5: Technical elements are mapped to claims */
function checkElementsAreMapped(claims: GeneratedClaim[]): boolean {
  return claims.filter(c => c.isIndependent).every(c => c.elements && c.elements.length > 0);
}

/** Rule 6: Count unsupported elements across all claims */
function countUnsupportedElements(claims: GeneratedClaim[]): number {
  let count = 0;
  for (const c of claims) {
    for (const el of c.elements || []) {
      if (el.evidence?.supportStatus === 'UNSUPPORTED') count++;
    }
  }
  return count;
}

/** Rule 7: Detect terminology conflicts (same concept referenced by different terms) */
function detectTerminologyConflicts(claims: GeneratedClaim[]): { count: number; examples: string[] } {
  // Build vocabulary per claim set
  const terms: string[] = [];
  for (const c of claims) {
    for (const el of c.elements || []) {
      if (el.label) terms.push(el.label.toLowerCase().trim());
    }
  }

  // Look for pairs that share the same root stem but different surface forms
  // Simple heuristic: flag if two distinct terms are substrings of each other
  const conflicts: string[] = [];
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const a = terms[i], b = terms[j];
      if (a !== b && (a.includes(b.slice(0, 5)) || b.includes(a.slice(0, 5)))) {
        const pair = `"${a}" / "${b}"`;
        if (!conflicts.includes(pair)) conflicts.push(pair);
      }
    }
  }
  return { count: conflicts.length, examples: conflicts.slice(0, 5) };
}

/** Rule 8: Count claims with no evidence reference */
function countClaimsWithoutEvidence(claims: GeneratedClaim[]): number {
  return claims.filter(c => c.elements.every(el => !el.evidence || !el.evidence.paragraphRef)).length;
}

// ---------------------------------------------------------------------------
// Coverage Metrics
// ---------------------------------------------------------------------------

function computeTechnicalCoverage(
  claims: GeneratedClaim[],
  totalTechElements: number
): number {
  if (totalTechElements === 0) return 100;
  const coveredIds = new Set<string>();
  for (const c of claims) {
    for (const el of c.elements || []) {
      coveredIds.add(el.label.toLowerCase());
    }
  }
  return Math.min(100, Math.round((coveredIds.size / totalTechElements) * 100));
}

function computeEvidenceSupport(claims: GeneratedClaim[]): number {
  let total = 0;
  let supported = 0;
  for (const c of claims) {
    for (const el of c.elements || []) {
      total++;
      if (el.evidence?.supportStatus === 'SUPPORTED') supported++;
      else if (el.evidence?.supportStatus === 'PARTIALLY_SUPPORTED') supported += 0.5;
    }
  }
  if (total === 0) return 100;
  return Math.round((supported / total) * 100);
}

// ---------------------------------------------------------------------------
// Public: Validate
// ---------------------------------------------------------------------------

export interface ValidationResult {
  passed: boolean;
  quality: ClaimQuality;
  ruleResults: Record<string, boolean | string | number>;
}

export function validateClaimSet(
  allClaims: GeneratedClaim[],
  totalTechElements = 0
): ValidationResult {
  const depCheck = checkDependencyValidity(allClaims);
  const termCheck = detectTerminologyConflicts(allClaims);
  const unsupported = countUnsupportedElements(allClaims);
  const noEvidence = countClaimsWithoutEvidence(allClaims);

  const warnings: string[] = [];

  if (!checkClaimTextExists(allClaims)) warnings.push('One or more claims have empty or very short text.');
  if (!checkIndependentClaimExists(allClaims)) warnings.push('No independent claim found — at least one is required.');
  if (!checkNoDuplicateNumbers(allClaims)) warnings.push('Duplicate claim numbers detected.');
  if (!depCheck.valid) warnings.push(...depCheck.errors);
  if (!checkElementsAreMapped(allClaims)) warnings.push('Independent claims have no mapped technical elements.');
  if (unsupported > 0) warnings.push(`${unsupported} claim element(s) are UNSUPPORTED — no source evidence found.`);
  if (termCheck.count > 0) warnings.push(`Terminology conflicts detected: ${termCheck.examples.join('; ')}`);
  if (noEvidence > 0) warnings.push(`${noEvidence} claim(s) lack any evidence reference.`);

  const quality: ClaimQuality = {
    technicalCoverage: computeTechnicalCoverage(allClaims, totalTechElements),
    evidenceSupport: computeEvidenceSupport(allClaims),
    unsupportedElements: unsupported,
    dependencyErrors: depCheck.errors.length,
    terminologyConflicts: termCheck.count,
    missingCoreElements: [],
    redundantElements: [],
    warnings,
  };

  return {
    passed: warnings.length === 0,
    quality,
    ruleResults: {
      claimTextExists: checkClaimTextExists(allClaims),
      independentClaimExists: checkIndependentClaimExists(allClaims),
      noDuplicateNumbers: checkNoDuplicateNumbers(allClaims),
      dependenciesValid: depCheck.valid,
      elementsAreMapped: checkElementsAreMapped(allClaims),
      unsupportedElements: unsupported,
      terminologyConflicts: termCheck.count,
      evidenceExists: noEvidence === 0,
    },
  };
}
