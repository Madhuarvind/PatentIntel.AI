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
 * Uses containment scoring and exact phrase matching to accurately reflect
 * whether the element is disclosed in the specification.
 */
export function findBestEvidence(
  elementText: string,
  chunks: TextChunk[]
): EvidenceMatch | null {
  if (chunks.length === 0 || !elementText.trim()) return null;

  const cleanElem = elementText.toLowerCase().trim();
  const elemTokens = tokenize(cleanElem);
  let best: EvidenceMatch | null = null;

  for (const chunk of chunks) {
    const chunkLower = chunk.text.toLowerCase();

    // 1. Check each sentence in the chunk for exact phrase or high token containment
    for (const s of chunk.sentences) {
      const sLower = s.toLowerCase();
      let sentScore = 0;

      // Exact substring match in sentence
      if (cleanElem.length > 2 && sLower.includes(cleanElem)) {
        sentScore = 1.0;
      } else if (elemTokens.size > 0) {
        const sTokens = tokenize(sLower);
        let inter = 0;
        elemTokens.forEach(t => { if (sTokens.has(t)) inter++; });
        const containment = inter / elemTokens.size;
        const jaccard = jaccardSimilarity(elemTokens, sTokens);
        // Weighted blend: 85% containment + 15% jaccard context
        sentScore = Math.min(1.0, containment * 0.85 + jaccard * 0.15);
      }

      if (!best || sentScore > best.score) {
        best = { chunk, score: sentScore, bestSentence: s };
      }
    }

    // 2. Also check whole chunk if individual sentences were split or dense
    if (!best || best.score < 0.65) {
      let chunkScore = 0;
      if (cleanElem.length > 2 && chunkLower.includes(cleanElem)) {
        chunkScore = 0.95;
      } else if (elemTokens.size > 0) {
        const chunkTokens = tokenize(chunkLower);
        let inter = 0;
        elemTokens.forEach(t => { if (chunkTokens.has(t)) inter++; });
        chunkScore = (inter / elemTokens.size) * 0.9;
      }

      if (!best || chunkScore > best.score) {
        const bestSentence = chunk.sentences[0] || chunk.text.slice(0, 100);
        best = { chunk, score: chunkScore, bestSentence };
      }
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
  // Use elementText if substantive; fallback to elementLabel
  const targetText = (elementText && elementText.trim().length > 2) ? elementText.trim() : elementLabel.trim();
  const match = findBestEvidence(targetText, chunks);

  if (!match || match.score < 0.15) {
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
