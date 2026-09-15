import type { 
  ClaimLimitationCategory, 
  ClaimLimitationDetail, 
  DecomposedClaim 
} from '../types';

/**
 * Standard patent transitional phrases and their legal exclusivity scope.
 */
const TRANSITION_PATTERNS = [
  { regex: /\b(comprising|comprises)\b:?/i, text: 'comprising', scope: 'OPEN' as const },
  { regex: /\b(consisting of|consists of)\b:?/i, text: 'consisting of', scope: 'CLOSED' as const },
  { regex: /\b(consisting essentially of|consists essentially of)\b:?/i, text: 'consisting essentially of', scope: 'PARTIALLY_OPEN' as const },
  { regex: /\b(including|includes)\b:?/i, text: 'including', scope: 'OPEN' as const },
  { regex: /\b(composed of)\b:?/i, text: 'composed of', scope: 'CLOSED' as const },
  { regex: /\b(characterized by|characterized in that)\b:?/i, text: 'characterized by', scope: 'OPEN' as const },
  { regex: /\b(wherein)\b:?/i, text: 'wherein', scope: 'OPEN' as const }
];

/**
 * Extracts clean canonical title from a limitation sentence.
 */
function extractCanonicalTitle(text: string): string {
  // Remove leading articles, conjunctions, punctuation
  let cleaned = text
    .replace(/^(\d+\.|\([a-z0-9]+\))\s*/i, '')
    .replace(/^[:;,\s]+/, '')
    .replace(/^(and\s+|further\s+|wherein\s+|also\s+|at\s+least\s+one\s+|a\s+plurality\s+of\s+|a\s+|an\s+|the\s+|said\s+)/i, '')
    .trim();

  // Split at functional connectors to get core noun
  const coreNoun = cleaned.split(/\b(configured to|adapted to|coupled to|operates to|comprising|wherein|connected to|based on|for\s+measuring|to\s+adjust)\b/i)[0].trim();
  
  if (coreNoun.length > 5 && coreNoun.length < 65) {
    // Capitalize words
    return coreNoun
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
      .replace(/\b(Dvfs|C-v2x|Pcie|Ai|Iot|Rfid)\b/g, m => m.toUpperCase());
  }

  // Fallback to first 5 words
  const words = cleaned.split(/\s+/).slice(0, 5).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Intelligently classifies a limitation into standard patent element categories.
 */
function classifyLimitation(text: string, isPreamble: boolean): ClaimLimitationCategory {
  if (isPreamble) return 'PREAMBLE';

  const lower = text.toLowerCase();

  // 1. Operational Constraint
  if (
    lower.includes('real-time') || 
    lower.includes('threshold') || 
    lower.includes('wherein') || 
    lower.includes('exceeds') ||
    lower.includes('predetermined') ||
    lower.includes('within a range') ||
    lower.includes('duty cycle') ||
    lower.includes('temperature measurement')
  ) {
    if (!lower.includes('processor') && !lower.includes('controller') && !lower.includes('sensor')) {
      return 'OPERATIONAL_CONSTRAINT';
    }
  }

  // 2. Data Interface / Telemetry
  if (
    lower.includes('telemetry interface') || 
    lower.includes('transceiver') || 
    lower.includes('bus') || 
    lower.includes('protocol') || 
    lower.includes('communication interface') ||
    lower.includes('sensor arrays')
  ) {
    return 'DATA_INTERFACE';
  }

  // 3. Functional Limitation (processor configured to...)
  if (
    (lower.includes('configured to') || lower.includes('adapted to') || lower.includes('operates to')) &&
    (lower.includes('adjust') || lower.includes('calculate') || lower.includes('forecast') || lower.includes('determine') || lower.includes('generate'))
  ) {
    return 'FUNCTIONAL_LIMITATION';
  }

  // 4. Process Step
  if (
    lower.startsWith('manufacturing') || 
    lower.startsWith('transmitting') || 
    lower.startsWith('receiving') || 
    lower.startsWith('calculating') || 
    lower.startsWith('forming') || 
    lower.startsWith('step of')
  ) {
    return 'PROCESS_STEP';
  }

  // 5. Hardware Component (Default for physical modules, units, devices)
  return 'HARDWARE_COMPONENT';
}

/**
 * Generates an antecedent basis audit for the limitation.
 */
function auditAntecedentBasis(
  rawText: string, 
  previousTerms: Set<string>
): { status: 'VERIFIED' | 'MISSING_ANTECEDENT' | 'NEW_INTRODUCTION' | 'NOT_APPLICABLE'; notes: string } {
  const definiteMatches = rawText.match(/\b(the|said)\s+([a-zA-Z0-9_\-]+(\s+[a-zA-Z0-9_\-]+)?)/gi);
  const indefiniteMatches = rawText.match(/\b(a|an)\s+([a-zA-Z0-9_\-]+(\s+[a-zA-Z0-9_\-]+)?)/gi);

  // If introducing new terms
  if (indefiniteMatches && (!definiteMatches || definiteMatches.length === 0)) {
    indefiniteMatches.forEach(m => {
      const noun = m.replace(/^(a|an)\s+/i, '').toLowerCase().trim();
      previousTerms.add(noun);
    });
    return {
      status: 'NEW_INTRODUCTION',
      notes: `Introduces antecedent basis via indefinite article ("${indefiniteMatches[0]}").`
    };
  }

  // If referencing definite terms
  if (definiteMatches && definiteMatches.length > 0) {
    let missingTerm: string | null = null;
    let verifiedTerm: string | null = null;

    for (const m of definiteMatches) {
      const noun = m.replace(/^(the|said)\s+/i, '').toLowerCase().trim();
      let hasAntecedent = false;
      for (const prev of previousTerms) {
        if (prev.includes(noun) || noun.includes(prev)) {
          hasAntecedent = true;
          break;
        }
      }

      if (hasAntecedent) {
        verifiedTerm = m;
      } else {
        missingTerm = m;
      }
    }

    if (missingTerm) {
      return {
        status: 'MISSING_ANTECEDENT',
        notes: `Potential 35 U.S.C. § 112(b) definiteness issue: "${missingTerm}" lacks explicit antecedent introduction in prior limitations.`
      };
    }

    return {
      status: 'VERIFIED',
      notes: `Antecedent basis verified: "${verifiedTerm || definiteMatches[0]}" properly links to prior claim introduction.`
    };
  }

  return {
    status: 'NOT_APPLICABLE',
    notes: 'No dependent definite articles requiring antecedent basis validation.'
  };
}

/**
 * Generates a targeted search query for the limitation.
 */
function buildLimitationSearchQuery(canonicalName: string, category: ClaimLimitationCategory): string {
  const terms = canonicalName.replace(/[()]/g, '').split(/\s+/).filter(w => w.length > 2);
  if (terms.length <= 1) return `"${canonicalName}"`;
  
  if (category === 'DATA_INTERFACE' || category === 'HARDWARE_COMPONENT') {
    return `("${canonicalName}") AND (interface OR controller OR system)`;
  }
  if (category === 'FUNCTIONAL_LIMITATION') {
    return `("${canonicalName}") AND ("configured to" OR algorithm OR processor)`;
  }
  return `("${canonicalName}")`;
}

/**
 * Decomposes a patent claim string into formal legal segments:
 * 1. Preamble
 * 2. Transitional Phrase
 * 3. Granular Limitations (E1, E2, E3...)
 */
export function decomposePatentClaim(
  claimText: string, 
  claimNumber: number = 1, 
  cpcCodes: string[] = []
): DecomposedClaim {
  const fullText = (claimText || '').trim();
  const cpcFallback = cpcCodes?.[0] || 'G06F 1/3206';

  // 1. Identify transitional phrase
  let transition = TRANSITION_PATTERNS[0];
  let transitionIndex = -1;
  let matchedTransitionText = 'comprising:';

  for (const pat of TRANSITION_PATTERNS) {
    const match = fullText.match(pat.regex);
    if (match && match.index !== undefined) {
      transition = pat;
      transitionIndex = match.index;
      matchedTransitionText = match[0];
      break;
    }
  }

  let rawPreamble = '';
  let rawBody = '';

  if (transitionIndex !== -1) {
    rawPreamble = fullText.slice(0, transitionIndex).trim();
    rawBody = fullText.slice(transitionIndex + matchedTransitionText.length).trim();
  } else {
    // If no explicit transition found, fallback
    const colonIdx = fullText.indexOf(':');
    if (colonIdx !== -1) {
      rawPreamble = fullText.slice(0, colonIdx).trim();
      rawBody = fullText.slice(colonIdx + 1).trim();
    } else {
      rawPreamble = fullText.split(/[,.]/)[0] || `Claim ${claimNumber}`;
      rawBody = fullText.slice(rawPreamble.length).trim();
    }
  }

  // Clean preamble
  const preamble = rawPreamble
    .replace(/^(\d+\.|\([a-z0-9]+\))\s*/i, '')
    .replace(/[,;:]+$/, '')
    .trim();

  // 2. Split body into limitations by semicolon, numbered points, or major conjunctions
  const splitClauses = rawBody
    .split(/;\s*|\n+|\band\s+a\b|\band\s+an\b|\band\s+the\b/i)
    .map(clause => clause.trim())
    .filter(clause => clause.length > 8);

  const limitations: ClaimLimitationDetail[] = [];
  const previousTerms = new Set<string>();

  // Add Preamble as E1 if substantial
  const preambleCanon = extractCanonicalTitle(preamble);
  limitations.push({
    id: 'E1',
    elementNumber: 1,
    category: 'PREAMBLE',
    canonicalName: preambleCanon,
    rawText: preamble,
    cleanedText: preamble,
    scopeTag: 'Preamble / Apparatus Scope',
    cpcCategory: cpcFallback,
    antecedentStatus: 'NOT_APPLICABLE',
    antecedentNotes: 'Claim preamble defining the technological field and target apparatus.',
    breadthImpact: 'BROAD',
    searchQuerySuggestion: `"${preambleCanon}"`
  });

  // Process body clauses into E2, E3, E4...
  splitClauses.forEach((rawClause) => {
    // Clean leading conjunctions and punctuation
    let cleaned = rawClause
      .replace(/^[:;,\s]+/, '')
      .replace(/^(\d+\.|\([a-z0-9]+\))\s*/i, '')
      .replace(/^(and\s+|further\s+|wherein\s+)/i, '')
      .replace(/[:;,\s]+$/, '')
      .trim();

    if (cleaned.length < 6) return;

    const elemNum = limitations.length + 1;
    const elemId = `E${elemNum}`;
    const category = classifyLimitation(cleaned, false);
    const canonicalName = extractCanonicalTitle(cleaned);
    const antecedentAudit = auditAntecedentBasis(cleaned, previousTerms);

    // Calculate breadth impact: more specific constraints = NARROW
    let breadthImpact: 'BROAD' | 'MODERATE' | 'NARROW' = 'MODERATE';
    if (cleaned.length > 80 || cleaned.includes('based on') || cleaned.includes('threshold')) {
      breadthImpact = 'NARROW';
    } else if (cleaned.length < 35) {
      breadthImpact = 'BROAD';
    }

    const searchQuery = buildLimitationSearchQuery(canonicalName, category);

    limitations.push({
      id: elemId,
      elementNumber: elemNum,
      category,
      canonicalName,
      rawText: rawClause,
      cleanedText: cleaned,
      scopeTag: `Scope: ${cpcFallback}`,
      cpcCategory: cpcFallback,
      antecedentStatus: antecedentAudit.status,
      antecedentNotes: antecedentAudit.notes,
      breadthImpact,
      searchQuerySuggestion: searchQuery
    });
  });

  // Calculate Antecedent Health
  const definiteTermsCount = limitations.filter(l => l.antecedentStatus === 'VERIFIED' || l.antecedentStatus === 'MISSING_ANTECEDENT').length;
  const missingCount = limitations.filter(l => l.antecedentStatus === 'MISSING_ANTECEDENT').length;
  const healthScore = definiteTermsCount === 0 ? 100 : Math.round(((definiteTermsCount - missingCount) / definiteTermsCount) * 100);

  // Category counts
  const categoryCounts: Record<string, number> = {};
  limitations.forEach(l => {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
  });

  // Overall breadth score: Fewer limitations = broader claim
  // 1-3 limitations: 85-95% breadth
  // 4-6 limitations: 60-80% breadth
  // 7+ limitations: 30-55% breadth
  const breadthScore = Math.max(25, Math.min(95, 100 - (limitations.length * 8)));

  const isDependent = fullText.toLowerCase().includes('claimed in claim') || 
                      fullText.toLowerCase().includes('of claim') || 
                      fullText.toLowerCase().includes('according to claim');

  return {
    claimNumber,
    claimType: isDependent ? 'dependent' : 'independent',
    dependsOnClaimNumbers: isDependent ? [1] : [],
    fullText,
    preamble,
    transitionalPhrase: transition.text,
    transitionalScope: transition.scope,
    limitations,
    antecedentAudit: {
      totalDefiniteTerms: definiteTermsCount,
      validTerms: definiteTermsCount - missingCount,
      flaggedTerms: limitations.filter(l => l.antecedentStatus === 'MISSING_ANTECEDENT').map(l => l.canonicalName),
      healthScore
    },
    complexityMetrics: {
      totalLimitations: limitations.length,
      breadthScore,
      categoryCounts
    }
  };
}

/**
 * Formats a decomposed claim into a Markdown claim chart.
 */
export function exportClaimChartMarkdown(patentId: string, decomposed: DecomposedClaim): string {
  let md = `# Structural Claim Chart: ${patentId} — Claim ${decomposed.claimNumber}\n\n`;
  md += `**Claim Type:** ${decomposed.claimType.toUpperCase()}\n`;
  md += `**Transitional Scope:** ${decomposed.transitionalPhrase.toUpperCase()} (${decomposed.transitionalScope})\n`;
  md += `**Breadth Score:** ${decomposed.complexityMetrics.breadthScore}% | **Definiteness Health:** ${decomposed.antecedentAudit.healthScore}%\n\n`;
  md += `### Complete Statutory Claim Text\n\n> "${decomposed.fullText}"\n\n`;
  md += `### Decomposed Limitations Matrix\n\n`;
  md += `| Limitation ID | Category | Canonical Element | Exact Limitation Scope | Antecedent Status |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  decomposed.limitations.forEach(l => {
    md += `| **${l.id}** | \`${l.category}\` | **${l.canonicalName}** | ${l.cleanedText.replace(/\|/g, '\\|')} | ${l.antecedentStatus} |\n`;
  });

  md += `\n---\n*Generated by PatentIntel.AI Structural Claim Decomposition Engine*\n`;
  return md;
}

/**
 * Formats a decomposed claim into a CSV string for download.
 */
export function exportClaimChartCSV(patentId: string, decomposed: DecomposedClaim): string {
  const header = ['Patent ID', 'Claim Number', 'Element ID', 'Category', 'Canonical Name', 'Limitation Text', 'Antecedent Status', 'Scope Tag'];
  const rows = decomposed.limitations.map(l => [
    `"${patentId}"`,
    `"${decomposed.claimNumber}"`,
    `"${l.id}"`,
    `"${l.category}"`,
    `"${l.canonicalName.replace(/"/g, '""')}"`,
    `"${l.cleanedText.replace(/"/g, '""')}"`,
    `"${l.antecedentStatus}"`,
    `"${l.scopeTag}"`
  ]);

  return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
}
