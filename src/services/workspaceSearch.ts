import type { PatentDocument } from '../types';

export function tokenizeSearch(text: string): string[] {
  return [...new Set(text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [])];
}

/** Query-term coverage, not a semantic similarity or patentability score. */
export function searchWorkspace(patents: PatentDocument[], query: string, includeSamples = false) {
  const terms = tokenizeSearch(query.trim());
  if (!terms.length) return [];
  const identifier = query.toUpperCase().replace(/[\s,./-]/g, '');
  return patents.filter(p => includeSamples || !p.isSample).map(patent => {
    const words = new Set(tokenizeSearch([
      patent.id, patent.displayNumber, patent.title, patent.abstract, patent.assignee,
      ...(patent.cpcCodes || patent.cpc || []), ...(patent.claims || []).map(c => c.text)
    ].filter(Boolean).join(' ')));
    const exactIdentifier = [patent.id, patent.publicationNumber, patent.sourceIdentifier]
      .some(id => id?.toUpperCase().replace(/[\s,./-]/g, '') === identifier);
    const matchedTerms = exactIdentifier ? terms : terms.filter(term => words.has(term));
    return { patent, matchedTerms, totalTerms: terms.length,
      score: Math.round(100 * matchedTerms.length / terms.length) };
  }).filter(result => result.matchedTerms.length > 0)
    .sort((a, b) => b.score - a.score || a.patent.id.localeCompare(b.patent.id));
}
