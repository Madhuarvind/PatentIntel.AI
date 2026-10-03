const tokens = text => (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
export function rankPassages(query, passages) {
  const terms = [...new Set(tokens(query))];
  if (!terms.length || !passages.length) return [];
  const corpus = passages.map(p => tokens(p.text));
  const average = corpus.reduce((sum, p) => sum + p.length, 0) / corpus.length || 1;
  const frequencies = new Map(terms.map(term => [term, corpus.filter(p => p.includes(term)).length]));
  return passages.map((passage, index) => {
    const words = corpus[index]; let score = 0;
    for (const term of terms) {
      const tf = words.filter(word => word === term).length;
      if (!tf) continue;
      const df = frequencies.get(term);
      const idf = Math.log(1 + (corpus.length - df + 0.5) / (df + 0.5));
      score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * words.length / average));
    }
    return { ...passage, score, matchedTerms: terms.filter(term => words.includes(term)) };
  }).filter(p => p.score > 0).sort((a, b) => b.score - a.score || a.sourceId.localeCompare(b.sourceId) || a.index - b.index);
}
export const METHOD = 'BM25 (k1=1.2, b=0.75; Unicode tokens; raw relevance, not a probability)';
export function analyzeFeatures(features, sources) {
  const passages = sources.flatMap(source => source.passages.map((passage, index) => ({ ...passage, sourceId: source.id, sourceTitle: source.title, sourceKind: source.kind,
    identifier: source.identifier, url: source.url, provenance: source.provenance, index })));
  return features.map(feature => { const matches = rankPassages(feature.text, passages).slice(0, 5); return { feature, matches, status: matches.length ? 'RELATED_PASSAGES' : 'INSUFFICIENT_EVIDENCE' }; });
}
