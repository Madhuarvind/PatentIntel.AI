import type { Patent, RealtimeAcademicPaper } from '../types';
import { searchLiveUsptoPatents } from './usptoApi';
import { searchRealtimeAcademicPapers } from './academicApi';
import { isPatentIdentifier } from './sourceRouter';

/** Separate result collections make it impossible to import a paper as a patent. */
export interface PriorArtSearchResults {
  patents: Patent[];
  papers: RealtimeAcademicPaper[];
}

export async function searchPriorArt(query: string): Promise<PriorArtSearchResults> {
  const input = query.trim();
  if (!input) return { patents: [], papers: [] };
  if (isPatentIdentifier(input)) {
    return { patents: await searchLiveUsptoPatents(input), papers: [] };
  }
  const [patents, academic] = await Promise.all([
    searchLiveUsptoPatents(input), searchRealtimeAcademicPapers(input)
  ]);
  return { patents, papers: academic.papers };
}
