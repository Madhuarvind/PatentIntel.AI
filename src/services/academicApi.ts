import type { RealtimeAcademicPaper, AuthorProfile, AcademicSearchFilters } from '../types';
export const DEFAULT_ACADEMIC_FILTERS: AcademicSearchFilters = {
  mode: 'TOPIC',
  query: '',
  selectedAuthor: null,
  yearFrom: null,
  yearTo: null,
  venue: 'ALL',
  pubType: 'ALL',
  minCitations: 0,
  sortBy: 'relevance',
  sourceFilter: 'ALL',
  page: 1,
  pageSize: 20
};


async function request<T>(operation: string, input: unknown): Promise<T> {
  const response = await fetch('/api/academic/' + operation, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input), signal: AbortSignal.timeout(45000)
  }).catch(() => { throw new Error('Academic service could not be reached. Check your connection and retry.'); });
  const result = await response.json().catch(() => { throw new Error('Academic service returned an invalid response. Retry shortly.'); });
  if (!response.ok) throw new Error(result?.message || 'Academic service unavailable. Retry shortly.');
  if (!result || typeof result !== 'object' || !('result' in result)) throw new Error('Academic service returned an invalid response. Retry shortly.');
  return Array.isArray(result.result) ? Object.assign(result.result, { warnings: result.warnings || [] }) : result.result;
}
export function resolveAuthor(query: string): Promise<AuthorProfile[] & { warnings?: string[] }> { return request('authors', { query }); }
export function fetchAuthorWorks(author: AuthorProfile, filters?: Partial<AcademicSearchFilters>): Promise<RealtimeAcademicPaper[]> {
  return request('author-works', { author, filters });
}
export function searchRealtimeAcademicPapers(filtersOrQuery: string | AcademicSearchFilters): Promise<{
  papers: RealtimeAcademicPaper[]; totalCount: number; sourcesUsed: string[]; resolvedAuthor?: AuthorProfile | null; warnings?: string[];
}> {
  return request('search', { filters: typeof filtersOrQuery === 'string' ? { ...DEFAULT_ACADEMIC_FILTERS, query: filtersOrQuery } : filtersOrQuery });
}
