import type { PatentDocument, Claim } from '../types';
import { decomposePatentClaim } from './claimDecompositionService';

export type MatchState = 'SUPPORTED' | 'PARTIAL' | 'UNMATCHED' | 'UNASSESSED';

export type TemporalEligibility = 'PUBLISHED_BEFORE_FILING' | 'POTENTIAL_POST_FILING' | 'TEMPORAL_UNVERIFIED';

export interface ClaimTextSpan {
  text: string;
  startOffset?: number;
  endOffset?: number;
}

export interface NumericalDiscrepancy {
  targetNumbers: string[];
  candidateNumbers: string[];
  isMismatch: boolean;
}

export interface ClaimLimitationEvidence {
  limitationId: string;
  elementNumber: number;
  limitationText: string;
  canonicalName: string;
  category?: string;
  targetSpan?: ClaimTextSpan;
  matchState: MatchState;
  candidateExcerpt?: string;
  candidateSpan?: ClaimTextSpan;
  candidateClaimNumber?: number;
  matchingTerms: string[];
  missingTerms: string[];
  numericalDiscrepancy?: NumericalDiscrepancy;
  negationConflict?: boolean;
  explanation: string;
}

export interface TraceableExcerpt {
  limitationId: string;
  candidateClaimNumber?: number;
  excerpt: string;
  matchState: MatchState;
}

export interface SharedClaimEvidenceRecord {
  id: string;
  targetDocumentId: string;
  targetDocumentTitle: string;
  targetPublicationDate?: string;
  targetFilingDate?: string;
  targetProvenance: string;
  targetSourceUrl?: string;
  targetRetrievedAt?: string;
  targetClaimNumber: number;
  targetClaimType: 'independent' | 'dependent';
  targetParentClaimNumber?: number;
  targetClaimText: string;

  candidateDocumentId: string;
  candidateDocumentTitle: string;
  candidatePublicationDate?: string;
  candidateFilingDate?: string;
  candidateProvenance: string;
  candidateSourceUrl?: string;
  candidateRetrievedAt?: string;
  candidateClaimNumber?: number;

  comparisonMethod: 'EXACT_AND_LEXICAL_SPAN_ANALYSIS';
  temporalStatus: TemporalEligibility;
  temporalNote?: string;

  overallState: MatchState;
  totalLimitations: number;
  supportedCount: number;
  partialCount: number;
  unmatchedCount: number;
  unassessedCount: number;

  limitations: ClaimLimitationEvidence[];
  traceableExcerpts: TraceableExcerpt[];

  targetContentHash: string;
  candidateContentHash: string;
  evaluationTimestamp: string;
}

export type ClaimEvidenceResult =
  | { success: true; record: SharedClaimEvidenceRecord }
  | {
      success: false;
      rejectionReason: 'SELF_COMPARISON_REJECTED' | 'TARGET_MISSING_CLAIMS' | 'CANDIDATE_MISSING_CLAIMS' | 'INVALID_ARGUMENTS';
      error: string;
      record?: undefined;
    };

const COMMON_PATENT_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'by', 'at', 'on', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'having', 'have', 'has', 'comprising',
  'comprises', 'comprised', 'including', 'includes', 'included', 'wherein', 'whereby',
  'said', 'such', 'each', 'any', 'all', 'one', 'more', 'first', 'second', 'third', 'plurality',
  'device', 'apparatus', 'system', 'method', 'configured', 'operatively', 'coupled', 'adapted'
]);

export function extractSubstantiveTerms(text: string): string[] {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^a-z0-9\-]/g, ' ').split(/\s+/);
  const terms = new Set<string>();
  for (const w of words) {
    if (w.length > 2 && !COMMON_PATENT_STOPWORDS.has(w) && !/^\d+$/.test(w)) {
      terms.add(w);
    }
  }
  return Array.from(terms);
}

export function extractNumericalTokens(text: string): string[] {
  if (!text) return [];
  const regex = /\b\d+(?:\.\d+)?\s*(?:khz|mhz|ghz|hz|v|kv|mv|ma|a|ms|s|ns|%|nm|um|µm|mm|cm|m|km|rpm|deg|k|c)?\b/gi;
  const matches = text.match(regex);
  return matches ? matches.map(m => m.trim().toLowerCase()) : [];
}

export function detectNegation(text: string): { hasNegation: boolean; terms: string[] } {
  if (!text) return { hasNegation: false, terms: [] };
  const negationRegex = /\b(?:without|free\s+of|excluding|no|not|neither|nor|except|omitting|absence\s+of|devoid\s+of)\b/gi;
  const matches = text.match(negationRegex);
  return {
    hasNegation: !!(matches && matches.length > 0),
    terms: matches ? matches.map(m => m.toLowerCase()) : []
  };
}

function computeDocumentClaimsHash(claims?: Claim[]): string {
  if (!claims || claims.length === 0) return 'NO_CLAIMS';
  return claims.map(c => `${c.number || 0}:${c.text.trim()}`).join('|');
}

export function checkTemporalEligibility(targetFilingDate?: string, candidatePubOrFilingDate?: string): {
  status: TemporalEligibility;
  note?: string;
} {
  if (!targetFilingDate || !candidatePubOrFilingDate) {
    return {
      status: 'TEMPORAL_UNVERIFIED',
      note: 'Publication or filing date unavailable — prior-art eligibility cannot be verified.'
    };
  }

  const targetDate = new Date(targetFilingDate);
  const candidateDate = new Date(candidatePubOrFilingDate);

  if (![targetFilingDate, candidatePubOrFilingDate].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) || isNaN(targetDate.getTime()) || isNaN(candidateDate.getTime()) || targetDate.toISOString().slice(0, 10) !== targetFilingDate || candidateDate.toISOString().slice(0, 10) !== candidatePubOrFilingDate) {
    return {
      status: 'TEMPORAL_UNVERIFIED',
      note: 'Filing/publication date format is ambiguous — temporal eligibility unverified.'
    };
  }

  if (candidateDate.getTime() >= targetDate.getTime()) {
    return {
      status: 'POTENTIAL_POST_FILING',
      note: `Candidate publication (${candidatePubOrFilingDate}) is on or after target filing (${targetFilingDate}). Legal eligibility is not assessed.`
    };
  }

  return {
    status: 'PUBLISHED_BEFORE_FILING',
    note: `Candidate publication (${candidatePubOrFilingDate}) precedes target filing (${targetFilingDate}). Date order alone does not establish legal eligibility.`
  };
}

function findBestCandidateExcerpt(
  limitationText: string,
  candidateClaims: Claim[],
  candidateAbstract?: string
): {
  bestExcerpt: string;
  candidateClaimNumber?: number;
  matchedTerms: string[];
  missingTerms: string[];
  numericalDiscrepancy: NumericalDiscrepancy;
  negationConflict: boolean;
} {
  const targetTerms = extractSubstantiveTerms(limitationText);
  const targetNumbers = extractNumericalTokens(limitationText);
  const targetNegation = detectNegation(limitationText);

  // Build searchable text candidates (each claim, plus abstract if available)
  const corpus: Array<{ text: string; claimNumber?: number }> = candidateClaims.map(c => ({
    text: c.text,
    claimNumber: c.number
  }));

  if (candidateAbstract && candidateAbstract.trim()) {
    corpus.push({ text: `Abstract: ${candidateAbstract.trim()}`, claimNumber: undefined });
  }

  let bestExcerpt = '';
  let bestClaimNumber: number | undefined = undefined;
  let bestMatchedTerms: string[] = [];
  let bestScore = -1;
  let bestCandidateNumbers: string[] = [];
  let bestNegationConflict = false;

  for (const item of corpus) {
    // Split item text into sentences / phrases
    const sentences = item.text.split(/(?<=[.;])\s+/);
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (!cleanSentence) continue;

      const sentenceTerms = new Set(extractSubstantiveTerms(cleanSentence));
      const matched = targetTerms.filter(t => sentenceTerms.has(t));
      const score = matched.length;

      if (score > bestScore) {
        bestScore = score;
        bestExcerpt = cleanSentence;
        bestClaimNumber = item.claimNumber;
        bestMatchedTerms = matched;
        bestCandidateNumbers = extractNumericalTokens(cleanSentence);

        const candNegation = detectNegation(cleanSentence);
        bestNegationConflict = targetNegation.hasNegation !== candNegation.hasNegation && matched.length > 0;
      }
    }
  }

  const missingTerms = targetTerms.filter(t => !bestMatchedTerms.includes(t));
  let isMismatch = false;
  isMismatch = targetNumbers.some(tn => !bestCandidateNumbers.includes(tn));

  return {
    bestExcerpt: bestScore > 0 ? bestExcerpt : '',
    candidateClaimNumber: bestClaimNumber,
    matchedTerms: bestMatchedTerms,
    missingTerms,
    numericalDiscrepancy: {
      targetNumbers,
      candidateNumbers: bestCandidateNumbers,
      isMismatch
    },
    negationConflict: bestNegationConflict
  };
}

export function generateClaimEvidenceRecord(
  targetDoc: PatentDocument,
  candidateDoc: PatentDocument,
  options?: {
    targetClaimNumber?: number;
    candidateClaimNumber?: number;
  }
): ClaimEvidenceResult {
  if (!targetDoc || !candidateDoc) {
    return {
      success: false,
      rejectionReason: 'INVALID_ARGUMENTS',
      error: 'Target and candidate patent documents must be provided.'
    };
  }

  // Reject Self-Comparison
  const normTarget = (targetDoc.id || '').trim().toUpperCase().replace(/[\s\-\.,]/g, '');
  const normCandidate = (candidateDoc.id || '').trim().toUpperCase().replace(/[\s\-\.,]/g, '');

  if (normTarget && normCandidate && normTarget === normCandidate) {
    return {
      success: false,
      rejectionReason: 'SELF_COMPARISON_REJECTED',
      error: `Self-comparison rejected: Target document (${targetDoc.id}) and candidate prior art (${candidateDoc.id}) are the same patent.`
    };
  }

  // Reject Missing Claims
  const targetClaims = targetDoc.claims || [];
  if (targetClaims.length === 0) {
    return {
      success: false,
      rejectionReason: 'TARGET_MISSING_CLAIMS',
      error: `Target patent ${targetDoc.id} has no claims to map.`
    };
  }

  const candidateClaims = candidateDoc.claims || [];
  if (candidateClaims.length === 0) {
    return {
      success: false,
      rejectionReason: 'CANDIDATE_MISSING_CLAIMS',
      error: `Candidate patent ${candidateDoc.id} has no claims to map.`
    };
  }

  // Select Target Claim
  const requestedClaimNum = options?.targetClaimNumber || 1;
  const targetClaim = options?.targetClaimNumber === undefined ? targetClaims[0] : targetClaims.find(c => c.number === requestedClaimNum);
  if (!targetClaim?.text?.trim()) return { success: false, rejectionReason: 'INVALID_ARGUMENTS', error: 'Selected target claim is missing or empty.' };
  const targetClaimNum = targetClaim.number || requestedClaimNum;

  // Filter candidate claims if a specific one was requested
  let activeCandidateClaims = candidateClaims;
  if (options?.candidateClaimNumber) {
    const specific = candidateClaims.filter(c => c.number === options.candidateClaimNumber);
    if (!specific.length) return { success: false, rejectionReason: 'INVALID_ARGUMENTS', error: 'Selected candidate claim is missing.' };
    activeCandidateClaims = specific;
  }

  // Decompose Target Claim into limitations
  const decomposed = decomposePatentClaim(targetClaim.text, targetClaimNum, targetDoc.cpcCodes);
  const limitations = decomposed.limitations || [];

  // Temporal Eligibility Check
  const candDate = candidateDoc.publicationDate;
  const temporal = checkTemporalEligibility(targetDoc.filingDate, candDate);

  // Evaluate Each Limitation
  let supportedCount = 0;
  let partialCount = 0;
  let unmatchedCount = 0;
  let unassessedCount = 0;

  const limitationEvidences: ClaimLimitationEvidence[] = [];
  const traceableExcerpts: TraceableExcerpt[] = [];

  for (let i = 0; i < limitations.length; i++) {
    const lim = limitations[i];
    const limText = lim.cleanedText || lim.rawText || '';
    const targetTerms = extractSubstantiveTerms(limText);

    if (targetTerms.length === 0) {
      unassessedCount++;
      limitationEvidences.push({
        limitationId: lim.id,
        elementNumber: lim.elementNumber,
        limitationText: limText,
        canonicalName: lim.canonicalName,
        category: lim.category,
        matchState: 'UNASSESSED',
        matchingTerms: [],
        missingTerms: [],
        explanation: 'Limitation contains no substantive technical terms for lexical verification.'
      });
      continue;
    }

    const {
      bestExcerpt,
      candidateClaimNumber,
      matchedTerms,
      missingTerms,
      numericalDiscrepancy,
      negationConflict
    } = findBestCandidateExcerpt(limText, activeCandidateClaims);

    let matchState: MatchState = 'UNMATCHED';
    let explanation = '';

    const ratio = matchedTerms.length / targetTerms.length;

    const literalMatch = !!bestExcerpt && bestExcerpt.toLowerCase().includes(limText.trim().toLowerCase());
    if (literalMatch && !targetDoc.isSample && !candidateDoc.isSample && !numericalDiscrepancy.isMismatch && !negationConflict) {
      matchState = 'SUPPORTED';
      supportedCount++;
      explanation = 'Literal limitation text occurs in the candidate claim. This is a text match only; technical and legal support require review.';
    } else if (bestExcerpt && ratio >= 0.35) {
      matchState = 'PARTIAL';
      partialCount++;
      const reasons: string[] = [];
      if (missingTerms.length > 0) reasons.push(`Missing terms: [${missingTerms.join(', ')}]`);
      if (numericalDiscrepancy.isMismatch) {
        reasons.push(`Numerical parameter discrepancy: target [${numericalDiscrepancy.targetNumbers.join(', ')}] vs candidate [${numericalDiscrepancy.candidateNumbers.join(', ')}]`);
      }
      if (negationConflict) reasons.push('Possible negation contradiction between target limitation and prior art disclosure');
      explanation = `Partial conceptual overlap (${Math.round(ratio * 100)}% terms matched). ${reasons.join('; ')}.`;
    } else {
      matchState = 'UNMATCHED';
      unmatchedCount++;
      explanation = bestExcerpt
        ? `Insufficient lexical overlap (${Math.round(ratio * 100)}% terms). This does not establish absence of disclosure.`
        : 'No matching passage found in the selected candidate claims.';
    }

    limitationEvidences.push({
      limitationId: lim.id,
      elementNumber: lim.elementNumber,
      limitationText: limText,
      canonicalName: lim.canonicalName,
      category: lim.category,
      matchState,
      candidateExcerpt: bestExcerpt || undefined,
      targetSpan: targetClaim.text.includes(limText) ? { text: limText, startOffset: targetClaim.text.indexOf(limText), endOffset: targetClaim.text.indexOf(limText) + limText.length } : undefined,
      candidateSpan: bestExcerpt ? (() => { const text = activeCandidateClaims.find(c => c.number === candidateClaimNumber)?.text || ''; const startOffset = text.indexOf(bestExcerpt); return startOffset >= 0 ? { text: bestExcerpt, startOffset, endOffset: startOffset + bestExcerpt.length } : undefined; })() : undefined,
      candidateClaimNumber,
      matchingTerms: matchedTerms,
      missingTerms,
      numericalDiscrepancy,
      negationConflict,
      explanation
    });

    if (bestExcerpt) {
      traceableExcerpts.push({
        limitationId: lim.id,
        candidateClaimNumber,
        excerpt: bestExcerpt,
        matchState
      });
    }
  }

  const totalLimitations = limitations.length;
  let overallState: MatchState = totalLimitations === 0 ? 'UNASSESSED' : 'UNMATCHED';
  if (supportedCount === totalLimitations && totalLimitations > 0) {
    overallState = 'SUPPORTED';
  } else if (supportedCount > 0 || partialCount > 0) {
    overallState = 'PARTIAL';
  } else if (unassessedCount === totalLimitations && totalLimitations > 0) {
    overallState = 'UNASSESSED';
  }

  const record: SharedClaimEvidenceRecord = {
    id: `ev_${normTarget}_vs_${normCandidate}_c${targetClaimNum}_${Date.now()}`,
    targetDocumentId: targetDoc.id,
    targetDocumentTitle: targetDoc.title || 'Untitled Target Document',
    targetPublicationDate: targetDoc.publicationDate,
    targetFilingDate: targetDoc.filingDate,
    targetProvenance: targetDoc.isSample ? 'Sample record (not verified)' : targetDoc.source || 'Local Workspace (not verified)',
    targetSourceUrl: targetDoc.sourceUrl,
    targetRetrievedAt: targetDoc.retrievedAt,
    targetClaimNumber: targetClaimNum,
    targetClaimType: targetClaim.isIndependent || targetClaim.type === 'independent' ? 'independent' : 'dependent',
    targetParentClaimNumber: (targetClaim as any).parentClaimNumber || (() => {
      const match = (targetClaim.text || '').match(/(?:claim|claims)\s+(\d+)/i);
      return match ? parseInt(match[1], 10) : undefined;
    })(),
    targetClaimText: targetClaim.text,

    candidateDocumentId: candidateDoc.id,
    candidateDocumentTitle: candidateDoc.title || 'Untitled Prior Art Document',
    candidatePublicationDate: candidateDoc.publicationDate,
    candidateFilingDate: candidateDoc.filingDate,
    candidateProvenance: candidateDoc.isSample ? 'Sample record (not verified)' : candidateDoc.source || 'Local Workspace (not verified)',
    candidateSourceUrl: candidateDoc.sourceUrl,
    candidateRetrievedAt: candidateDoc.retrievedAt,
    candidateClaimNumber: options?.candidateClaimNumber,

    comparisonMethod: 'EXACT_AND_LEXICAL_SPAN_ANALYSIS',
    temporalStatus: temporal.status,
    temporalNote: temporal.note,

    overallState,
    totalLimitations,
    supportedCount,
    partialCount,
    unmatchedCount,
    unassessedCount,

    limitations: limitationEvidences,
    traceableExcerpts,

    targetContentHash: computeDocumentClaimsHash(targetClaims),
    candidateContentHash: computeDocumentClaimsHash(candidateClaims),
    evaluationTimestamp: new Date().toISOString()
  };

  return {
    success: true,
    record
  };
}

export function isEvidenceRecordStale(
  record: SharedClaimEvidenceRecord,
  currentTarget?: PatentDocument,
  currentCandidate?: PatentDocument
): boolean {
  if (!currentTarget || !currentCandidate) return true;
  const currentTargetHash = computeDocumentClaimsHash(currentTarget.claims);
  const currentCandidateHash = computeDocumentClaimsHash(currentCandidate.claims);

  return (
    record.targetDocumentId !== currentTarget.id || record.candidateDocumentId !== currentCandidate.id ||
    record.targetFilingDate !== currentTarget.filingDate || record.candidatePublicationDate !== currentCandidate.publicationDate ||
    record.targetContentHash !== currentTargetHash ||
    record.candidateContentHash !== currentCandidateHash
  );
}

export function exportClaimEvidenceMarkdown(record: SharedClaimEvidenceRecord): string {
  const lines: string[] = [
    `# Claim Evidence Comparison Record`,
    `Draft lexical comparison. Text matches are not verified technical support or legal conclusions. Dependent-claim parent limitations are not expanded.`,
    ``,
    `- **Record ID:** \`${record.id}\``,
    `- **Evaluated At:** ${record.evaluationTimestamp}`,
    `- **Comparison Method:** ${record.comparisonMethod}`,
    `- **Overall Status:** ${record.overallState} (${record.supportedCount}/${record.totalLimitations} limitations supported)`,
    ``,
    `## Documents Compared`,
    `- **Target Document:** ${record.targetDocumentId} — "${record.targetDocumentTitle}"`,
    `  - Filing Date: ${record.targetFilingDate || 'Unavailable'}`,
    `  - Source: ${record.targetProvenance}`,
    `  - Claim Evaluated: Claim ${record.targetClaimNumber} (${record.targetClaimType})`,
    `- **Candidate Prior Art:** ${record.candidateDocumentId} — "${record.candidateDocumentTitle}"`,
    `  - Publication/Filing Date: ${record.candidatePublicationDate || record.candidateFilingDate || 'Unavailable'}`,
    `  - Source: ${record.candidateProvenance}`,
    `  - Temporal Eligibility: ${record.temporalStatus} — ${record.temporalNote || ''}`,
    ``,
    `## Element-by-Element Evidence Ledger`,
    ``
  ];

  for (const lim of record.limitations) {
    lines.push(`### Limitation ${lim.limitationId} [${lim.matchState}]`);
    lines.push(`**Target Limitation:** ${lim.limitationText}`);
    if (lim.candidateExcerpt) {
      lines.push(`**Candidate Excerpt${lim.candidateClaimNumber ? ` (Claim ${lim.candidateClaimNumber})` : ''}:**`);
      lines.push(`> "${lim.candidateExcerpt}"`);
    } else {
      lines.push(`**Candidate Disclosure:** No lexical match found in selected claims; human review required.`);
    }
    lines.push(`**Analysis:** ${lim.explanation}`);
    if (lim.matchingTerms.length > 0) {
      lines.push(`- Matched Terms: \`${lim.matchingTerms.join('`, `')}\``);
    }
    if (lim.missingTerms.length > 0) {
      lines.push(`- Missing Terms: \`${lim.missingTerms.join('`, `')}\``);
    }
    if (lim.numericalDiscrepancy?.isMismatch) {
      lines.push(`- Numerical Discrepancy: Target=[${lim.numericalDiscrepancy.targetNumbers.join(', ')}] vs Candidate=[${lim.numericalDiscrepancy.candidateNumbers.join(', ')}]`);
    }
    if (lim.negationConflict) {
      lines.push(`- Negation Conflict: Potential contradiction detected in negation terms.`);
    }
    lines.push(``);
  }

  return lines.join('\n');
}

export function exportClaimEvidenceJson(record: SharedClaimEvidenceRecord): string {
  return JSON.stringify(record, null, 2);
}

export interface CandidateLimitationCoverage {
  candidateId: string;
  candidateTitle: string;
  filingOrPubDate?: string;
  temporalStatus: TemporalEligibility;
  temporalNote?: string;
  coverageByLimitation: Record<string, {
    matchState: MatchState;
    excerpt?: string;
    candidateClaimNumber?: number;
    explanation: string;
  }>;
}

export interface PriorArtCoverageMatrix {
  targetId: string;
  targetTitle: string;
  targetFilingDate?: string;
  targetClaimNumber: number;
  limitations: Array<{
    id: string;
    elementNumber: number;
    canonicalName: string;
    text: string;
  }>;
  candidates: CandidateLimitationCoverage[];
  summary: {
    totalLimitations: number;
    earlierTextMatchCount: number;
    unmatchedLimitationCount: number;
    unmatchedLimitationIds: string[];
  };
}

export function generatePriorArtCoverageMatrix(
  targetDoc: PatentDocument,
  candidateDocs: PatentDocument[],
  targetClaimNumber = 1
): PriorArtCoverageMatrix {
  const targetClaim = targetDoc?.claims?.find(c => c.number === targetClaimNumber);
  const limitations = targetClaim?.text?.trim()
    ? decomposePatentClaim(targetClaim.text, targetClaimNumber, targetDoc.cpcCodes).limitations.map(lim => ({
        id: lim.id, elementNumber: lim.elementNumber, canonicalName: lim.canonicalName,
        text: lim.cleanedText || lim.rawText || ''
      })) : [];
  const candidates: CandidateLimitationCoverage[] = [];
  if (limitations.length) {
    const seen = new Set<string>();
    const normalize = (id: string) => id.toUpperCase().replace(/[\s.,-]/g, '');
    seen.add(normalize(targetDoc.id));
    for (const candidate of candidateDocs) {
      const id = normalize(candidate.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const result = generateClaimEvidenceRecord(targetDoc, candidate, { targetClaimNumber });
      const temporal = checkTemporalEligibility(targetDoc.filingDate, candidate.publicationDate);
      const coverageByLimitation: CandidateLimitationCoverage['coverageByLimitation'] = {};
      for (const limitation of limitations) {
        const evidence = result.success ? result.record.limitations.find(l => l.limitationId === limitation.id) : undefined;
        coverageByLimitation[limitation.id] = evidence ? {
          matchState: evidence.matchState, excerpt: evidence.candidateExcerpt,
          candidateClaimNumber: evidence.candidateClaimNumber, explanation: evidence.explanation
        } : { matchState: 'UNASSESSED', explanation: 'No assessable claim text is available.' };
      }
      candidates.push({ candidateId: candidate.id, candidateTitle: candidate.title || '',
        filingOrPubDate: candidate.publicationDate, temporalStatus: temporal.status,
        temporalNote: temporal.note, coverageByLimitation });
    }
  }
  const earlierTextMatches = new Set(limitations.filter(lim => candidates.some(candidate =>
    candidate.temporalStatus === 'PUBLISHED_BEFORE_FILING' &&
    candidate.coverageByLimitation[lim.id]?.matchState === 'SUPPORTED'
  )).map(lim => lim.id));
  const unmatchedLimitationIds = limitations.filter(lim => !earlierTextMatches.has(lim.id)).map(lim => lim.id);
  return { targetId: targetDoc?.id || 'UNKNOWN', targetTitle: targetDoc?.title || '',
    targetFilingDate: targetDoc?.filingDate, targetClaimNumber, limitations, candidates,
    summary: { totalLimitations: limitations.length, earlierTextMatchCount: earlierTextMatches.size,
      unmatchedLimitationCount: unmatchedLimitationIds.length, unmatchedLimitationIds }
  };
}