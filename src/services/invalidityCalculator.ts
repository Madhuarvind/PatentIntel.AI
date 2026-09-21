/** Element coverage is descriptive; it cannot establish statutory invalidity. */
export interface AssessedClaimElement {
  elementId: string;
  text: string;
  matchType: 'exact' | 'partial' | 'missing';
}

export interface InvalidityAssessment {
  targetPatentNumber: string;
  status: 'INSUFFICIENT_EVIDENCE' | 'COVERAGE_ONLY';
  totalElementsCount: number;
  exactMatchesCount: number;
  partialMatchesCount: number;
  exactCoveragePercent: number | null;
  combinedCoveragePercent: number | null;
  // Deliberately unset: match labels alone cannot justify legal probabilities.
  sec102RiskScore: null;
  sec103RiskScore: null;
  overallInvalidityScore: null;
  expectedUsptoAction: string;
  legalSummary: string;
}

export function computeInvalidityRisk(
  targetPatentNumber = '',
  claimElements: AssessedClaimElement[] = []
): InvalidityAssessment {
  // Reject conflicting duplicates instead of counting them toward coverage.
  const elements = new Map<string, AssessedClaimElement>();
  let invalid = false;
  for (const element of claimElements) {
    if (!element?.elementId?.trim() || !element.text?.trim() ||
        !['exact', 'partial', 'missing'].includes(element.matchType)) {
      invalid = true;
      break;
    }
    const key = element.elementId.trim();
    const previous = elements.get(key);
    if (previous && (previous.text !== element.text || previous.matchType !== element.matchType)) {
      invalid = true;
      break;
    }
    elements.set(key, element);
  }
  const valid = !invalid && elements.size > 0;
  const total = valid ? elements.size : 0;
  const exact = valid ? [...elements.values()].filter(e => e.matchType === 'exact').length : 0;
  const partial = valid ? [...elements.values()].filter(e => e.matchType === 'partial').length : 0;
  return {
    targetPatentNumber,
    status: valid ? 'COVERAGE_ONLY' : 'INSUFFICIENT_EVIDENCE',
    totalElementsCount: total,
    exactMatchesCount: exact,
    partialMatchesCount: partial,
    exactCoveragePercent: valid ? Math.round(exact / total * 100) : null,
    combinedCoveragePercent: valid ? Math.round((exact + partial) / total * 100) : null,
    sec102RiskScore: null, sec103RiskScore: null, overallInvalidityScore: null,
    expectedUsptoAction: 'Not assessed',
    legalSummary: valid
      ? 'Coverage summarizes supplied match labels only. Source passages, dates, claim construction, and legal review are required before assessing novelty or obviousness.'
      : 'No complete, consistent element assessment is available. Patent invalidity and examiner action cannot be inferred.'
  };
}
