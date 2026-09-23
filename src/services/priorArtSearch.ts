import type { Patent, RealtimeAcademicPaper } from '../types';
import { searchLiveUsptoPatents } from './usptoApi';
import { searchRealtimeAcademicPapers } from './academicApi';
import { isPatentIdentifier } from './sourceRouter';

/** Separate result collections make it impossible to import a paper as a patent. */
export interface PriorArtSearchResults {
  patents: Patent[];
  papers: RealtimeAcademicPaper[];
  warnings?: string[];
}

export async function searchPriorArt(query: string): Promise<PriorArtSearchResults> {
  const input = query.trim();
  if (!input) return { patents: [], papers: [] };
  if (isPatentIdentifier(input)) {
    try { return { patents: await searchLiveUsptoPatents(input, true), papers: [] }; }
    catch (error) { return { patents: [], papers: [], warnings: [error instanceof Error ? error.message : 'Patent source unavailable.'] }; }
  }
  const [patents, academic] = await Promise.allSettled([
    searchLiveUsptoPatents(input, true), searchRealtimeAcademicPapers(input)
  ]);
  const warnings: string[] = [];
  if (patents.status === 'rejected') warnings.push('Patent source unavailable; academic results may still be available.');
  if (academic.status === 'rejected') warnings.push('Academic sources unavailable; patent results may still be available.');
  if (academic.status === 'fulfilled') warnings.push(...(academic.value.warnings || []));
  return { patents: patents.status === 'fulfilled' ? patents.value : [],
    papers: academic.status === 'fulfilled' ? academic.value.papers : [],
    ...(warnings.length ? { warnings } : {}) };
}
