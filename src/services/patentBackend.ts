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
import { parseGooglePatentsHtmlServer } from './patentHtmlParser';

/**
 * Backend Proxy Service Client (Rule #8, #43, #44)
 * Solves browser CORS restrictions by executing requests through local backend proxy /api/patents/resolve
 */
export async function resolvePatentViaBackend(identifier: string): Promise<PatentResolutionResult> {
  let normalizedId: string;
  try {
    normalizedId = normalizePatentNumber(identifier).normalizedInput;
  } catch {
    return { success: false, documentType: 'PATENT', errorCode: 'INVALID_IDENTIFIER', message: 'Invalid patent publication number' };
  }

  console.log(`[PATENT BACKEND SERVICE] Request started for identifier: ${normalizedId}`);

  try {
    const res = await fetch(`/api/patents/resolve?identifier=${encodeURIComponent(normalizedId)}`);
    if (res.ok) {
      const data: PatentResolutionResult = await res.json();
      if (data && data.success && data.patent) {
        console.log(`[PATENT BACKEND SERVICE] Successfully resolved: ${normalizedId} -> "${data.patent.title}"`);
        return data;
      }
    }
  } catch (err) {
    console.warn(`[PATENT BACKEND SERVICE] /api/patents/resolve API endpoint offline, attempting direct server fetch:`, err);
  }

  // Fallback to Direct Server-Side Fetch if running in Vite dev environment or Node
  try {
    const targetUrl = `https://patents.google.com/patent/${normalizedId}/en`;
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (res.ok) {
      const html = await res.text();
      const parsed = parseGooglePatentsHtmlServer(html, normalizedId);
      if (parsed && parsed.title) {
        return {
          success: true,
          documentType: 'PATENT',
          patent: parsed
        };
      }
    }

    return {
      success: false,
      documentType: 'PATENT',
      errorCode: 'PATENT_NOT_FOUND',
      message: `Patent record "${identifier}" (${normalizedId}) was not found in official patent registries.`
    };
  } catch (err: any) {
    return {
      success: false,
      documentType: 'PATENT',
      errorCode: 'SOURCE_UNAVAILABLE',
      message: `Patent source currently unavailable for ${identifier}: ${err.message}`
    };
  }
}
