/**
 * claimGroundingService.ts
 *
 * Evidence retrieval and grounding classification for generated claim elements.
 * 
 * Pipeline:
 *   Source text → Chunking → Keyword/semantic matching → Support classification
 *
 * Support levels (per spec Section 11):
 *   SUPPORTED           supportScore >= 0.65
 *   PARTIALLY_SUPPORTED supportScore >= 0.30
 *   UNSUPPORTED         supportScore <  0.30
 */

import type { ClaimEvidenceRef, SupportStatus } from '../types';

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

export interface TextChunk {
  index: number;
  section: string;
  text: string;
  sentences: string[];
}

/**
 * Split source text into evidence-sized chunks (paragraph level).
 * Labels each chunk with a human-readable section reference.
 */
export function chunkSourceText(sourceText: string): TextChunk[] {
  // Split on double-newlines first, then on periods for dense paragraphs
  const rawParagraphs = sourceText
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(p => p.length > 20);

  if (rawParagraphs.length === 0) {
    // Fallback: split by sentence groups
    const sentences = sourceText.split(/(?<=[.?!])\s+/);
    const grouped: string[] = [];
    for (let i = 0; i < sentences.length; i += 3) {
      grouped.push(sentences.slice(i, i + 3).join(' '));
    }
    return grouped.map((text, idx) => ({
      index: idx,
      section: `Paragraph ${idx + 1}`,
      text,
      sentences: text.split(/(?<=[.?!])\s+/).filter(Boolean),
    }));
  }

  return rawParagraphs.map((text, idx) => ({
    index: idx,
    section: `Paragraph ${idx + 1}`,
    text,
    sentences: text.split(/(?<=[.?!])\s+/).filter(Boolean),
  }));
}

// ---------------------------------------------------------------------------
// Keyword-based semantic similarity (Jaccard on stems)
// ---------------------------------------------------------------------------

function tokenize(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [])
      .map(w => stem(w))
  );
}

/** Minimal Porter-like stem (prefix reduction for common suffixes) */
function stem(word: string): string {
  return word
    .replace(/(?:ing|tion|tions|ed|er|ers|ment|ments|ity|ies|es|s)$/, '')
    .replace(/(?:ize|ise)$/, 'iz')
    .replace(/(?:able|ible)$/, 'abl');
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  a.forEach(t => { if (b.has(t)) inter++; });
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

// ---------------------------------------------------------------------------
// Evidence Finder
// ---------------------------------------------------------------------------

export interface EvidenceMatch {
  chunk: TextChunk;
  score: number;
  bestSentence: string;
}

/**
 * Find the best-matching evidence chunk for a given claim element text.
 * Returns the top match and its Jaccard similarity score.
 */
export function findBestEvidence(
  elementText: string,
  chunks: TextChunk[]
): EvidenceMatch | null {
  if (chunks.length === 0) return null;

  const elemTokens = tokenize(elementText);
  let best: EvidenceMatch | null = null;

  for (const chunk of chunks) {
    const chunkTokens = tokenize(chunk.text);
    const score = jaccardSimilarity(elemTokens, chunkTokens);

    if (!best || score > best.score) {
      // Find the single sentence with highest overlap
      let bestSentence = chunk.sentences[0] || chunk.text.slice(0, 100);
      let bestSentScore = 0;
      for (const s of chunk.sentences) {
        const st = jaccardSimilarity(elemTokens, tokenize(s));
        if (st > bestSentScore) { bestSentScore = st; bestSentence = s; }
      }
      best = { chunk, score, bestSentence };
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// Support Classification
// ---------------------------------------------------------------------------

export function classifySupport(score: number): SupportStatus {
  if (score >= 0.65) return 'SUPPORTED';
  if (score >= 0.30) return 'PARTIALLY_SUPPORTED';
  return 'UNSUPPORTED';
}

// ---------------------------------------------------------------------------
// Public: Build ClaimEvidenceRef for a claim element
// ---------------------------------------------------------------------------

/**
 * Given a claim element label + description and the source text chunks,
 * returns a complete ClaimEvidenceRef with grounding metadata.
 */
export function groundClaimElement(
  elementLabel: string,
  elementText: string,
  chunks: TextChunk[]
): ClaimEvidenceRef {
  const searchTerm = `${elementLabel} ${elementText}`;
  const match = findBestEvidence(searchTerm, chunks);

  if (!match || match.score === 0) {
    return {
      elementText: elementLabel,
      sourceSection: 'No matching source found',
      paragraphRef: '',
      quote: '',
      supportScore: 0,
      supportStatus: 'UNSUPPORTED',
    };
  }

  return {
    elementText: elementLabel,
    sourceSection: match.chunk.section,
    paragraphRef: `§ ${match.chunk.section}`,
    quote: match.bestSentence.slice(0, 200),
    supportScore: parseFloat(match.score.toFixed(3)),
    supportStatus: classifySupport(match.score),
  };
}

// ---------------------------------------------------------------------------
// Batch grounding
// ---------------------------------------------------------------------------

export function groundAllElements(
  elements: { label: string; text: string }[],
  sourceText: string
): ClaimEvidenceRef[] {
  const chunks = chunkSourceText(sourceText);
  return elements.map(el => groundClaimElement(el.label, el.text, chunks));
}
