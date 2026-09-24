import { normalizePatentNumber } from './patentNormalizer';
import type { PatentDocument } from '../types';
export interface PatentResolutionResult {
  success: boolean;
  documentType: 'PATENT';
  patent?: PatentDocument;
  errorCode?: 'PATENT_NOT_FOUND' | 'SOURCE_UNAVAILABLE' | 'INVALID_IDENTIFIER' | 'RATE_LIMITED' | 'SOURCE_TIMEOUT';
  message?: string;
}
export { parseGooglePatentsHtmlServer } from './patentHtmlParser';

export async function resolvePatentViaBackend(identifier: string, signal?: AbortSignal): Promise<PatentResolutionResult> {
  let normalizedId: string;
  try { normalizedId = normalizePatentNumber(identifier).normalizedInput; }
  catch { return { success: false, documentType: 'PATENT', errorCode: 'INVALID_IDENTIFIER', message: 'Invalid patent publication number' }; }
  try {
    const response = await fetch(`/api/patents/resolve?identifier=${encodeURIComponent(normalizedId)}`, { signal });
    const data = await response.json();
    if (response.ok && data?.success && data.documentType === 'PATENT' && data.patent) return data;
    return { success: false, documentType: 'PATENT',
      errorCode: response.status === 404 && data?.errorCode === 'PATENT_NOT_FOUND' ? 'PATENT_NOT_FOUND' : 'SOURCE_UNAVAILABLE',
      message: response.status === 404 && data?.errorCode === 'PATENT_NOT_FOUND' ? 'No patent record was found for this identifier.' : 'Patent source unavailable. Try again later.' };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { success: false, documentType: 'PATENT', errorCode: 'SOURCE_UNAVAILABLE', message: 'Patent source unavailable or returned an invalid response.' };
  }
}
