import type { Patent, NormalizedPatent, PatentDocument, PatentClaim, ImportProgressState, ImportStatus, ImportErrorCode, ImportTimings, PatentImportResult } from '../types';
import { normalizePatentNumber, validatePatentIdentity } from './patentNormalizer';
import { workspaceStore } from './workspaceStore';
import { resolveSearchDomain } from './sourceRouter';
import { resolvePatentViaBackend } from './patentBackend';

export interface ImportProgressStep {
  step: number;
  label: string;
  completed: boolean;
}

/**
 * Single Canonical URL Resolver for Patent Specifications & Official Records.
 * Safely strips formatting characters (commas, spaces, dots, dashes) from publication numbers
 * to construct valid Google Patents / USPTO external URLs without 404 errors.
 */
export function getPatentSourceUrl(patent: any): string {
  if (!patent) return 'https://patents.google.com';

  // If explicit valid URL exists without commas/formatting bugs, use it
  if (patent.sourceUrl && typeof patent.sourceUrl === 'string' && !patent.sourceUrl.includes(',') && patent.sourceUrl.startsWith('http')) {
    return patent.sourceUrl;
  }

  // Extract raw ID from publicationNumber, patentNumber, displayNumber, or id
  const rawId = patent.publicationNumber || patent.patentNumber || patent.displayNumber || patent.id || '';
  
  // Clean identifier: remove spaces, commas, dots, hyphens
  let cleanId = String(rawId).replace(/[\s\.,\-]/g, '').toUpperCase();

  if (!cleanId) return 'https://patents.google.com';

  // Ensure country prefix exists
  if (/^\d/.test(cleanId)) {
    cleanId = `US${cleanId}`;
  }

  // If cleanId has explicit kind code (e.g. US10255577B1, US11594127B1, EP3400000A1, WO2021000000A1), construct URL directly
  // Google Patents natively redirects raw numbers like US10255577 to its actual registered kind code
  return `https://patents.google.com/patent/${cleanId}/en`;
}

/**
 * In-memory Cache for imported patent specifications (indexed by canonical publication ID)
 */
const PATENT_CACHE = new Map<string, NormalizedPatent>();

/**
 * Official USPTO Master Patent Registry (Exact Verified Source Records)
 */
/**
 * Custom Error Class for Patent Import Operations
 */
export class PatentImportError extends Error {
  code: ImportErrorCode;
  suggestedAction?: string;

  constructor(code: ImportErrorCode, message: string, suggestedAction?: string) {
    super(message);
    this.name = 'PatentImportError';
    this.code = code;
    this.suggestedAction = suggestedAction;
  }
}

/**
 * Helper to emit structured real-time progress state
 */
function emitState(
  onProgressState: ((state: ImportProgressState) => void) | undefined,
  requestId: string,
  status: ImportStatus,
  progress: number,
  stepNumber: number,
  message: string,
  startTime: number,
  detail?: string,
  errorInfo?: { code: ImportErrorCode; message: string; suggestedAction?: string }
) {
  if (!onProgressState) return;
  const elapsedSeconds = parseFloat(((performance.now() - startTime) / 1000).toFixed(1));
  onProgressState({
    requestId,
    status,
    progress,
    stepNumber,
    message,
    detail,
    elapsedSeconds,
    error: errorInfo
  });
}

/**
 * Main Real-Time Patent Fetch Service with Explicit State Machine, Hard Timeout & Cancellation
 */
export async function fetchPatentByNumberWithProgressState(
  patentInput: string,
  onProgressState?: (state: ImportProgressState) => void,
  abortSignal?: AbortSignal,
  timeoutMs: number = 30000
): Promise<PatentImportResult> {
  const startTime = performance.now();
  const requestId = `PATENT-IMPORT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  let validationMs = 0;
  let sourceMs = 0;
  let metadataMs = 0;
  let claimsMs = 0;
  let normalizationMs = 0;
  let databaseMs = 0;

  // Setup hard timeout controller linked to optional abortSignal
  const internalController = new AbortController();
  const timeoutId = setTimeout(() => {
    internalController.abort();
  }, timeoutMs);

  const cancel = () => internalController.abort();
  abortSignal?.addEventListener('abort', cancel, { once: true });
  if (abortSignal?.aborted) cancel();
  const checkAborted = () => {
    if (abortSignal?.aborted || internalController.signal.aborted) {
      throw new PatentImportError(
        abortSignal?.aborted ? 'CANCELLED' : 'SOURCE_TIMEOUT',
        abortSignal?.aborted
          ? 'Patent import operation was cancelled by user.'
          : `Patent data source did not respond within ${Math.round(timeoutMs / 1000)} seconds.`,
        abortSignal?.aborted ? 'Click Fetch to restart.' : 'Please check your internet connection or click Try Again.'
      );
    }
  };

  try {
    console.log(`[${requestId}] Starting patent import flow for input: "${patentInput}"`);

    // ==========================================
    // STEP 1: VALIDATION (0 - 10%)
    // ==========================================
    const valStart = performance.now();
    emitState(onProgressState, requestId, 'validating', 10, 1, 'Validating patent identifier & canonical candidates...', startTime);

    if (!patentInput || !patentInput.trim()) {
      throw new PatentImportError('INVALID_PATENT_ID', 'Patent number input cannot be empty.', 'Enter a valid USPTO patent identifier e.g. US11954112B2');
    }

    // Explicit check for invalid patent numbers (e.g. US0000000000B2 or 0000000)
    const cleanDigits = patentInput.replace(/[^0-9]/g, '');
    if (cleanDigits.length > 0 && /^0+$/.test(cleanDigits)) {
      throw new PatentImportError('PATENT_NOT_FOUND', `Patent number "${patentInput}" was not found in official patent registries.`, 'Verify the patent number on USPTO or Google Patents.');
    }

    const normalizedId = normalizePatentNumber(patentInput);
    const { rawInput, normalizedInput, country, documentNumber, displayNumber } = normalizedId;
    validationMs = performance.now() - valStart;

    console.log(`[${requestId}] Step 1 Complete (Validation: ${validationMs.toFixed(1)}ms). Normalized ID: ${normalizedInput}`);

    // ==========================================
    // STEP 2: CONNECTING TO REGISTRY (10 - 30%)
    // ==========================================
    const connStart = performance.now();
    emitState(onProgressState, requestId, 'connecting', 25, 2, 'Connecting to official patent data registry...', startTime, `Targeting: ${displayNumber}`);

    checkAborted();

    let rawMetadata: any = null;
    let resolvedId = normalizedInput;

    // Check Local Cache First (Requirement 23 & 24)
    const cachedPatent = PATENT_CACHE.get(normalizedInput);
    if (cachedPatent) {
      console.log(`[${requestId}] Local Cache Match! Returning cached patent ${normalizedInput} immediately.`);
      const pubNum = cachedPatent.publicationNumber;
      const pubDate = cachedPatent.publicationDate;
      const cpcList = cachedPatent.cpc || (cachedPatent as PatentDocument).cpcCodes || [];
      const claimsArr = cachedPatent.claims || [];

      rawMetadata = {
        publicationNumber: pubNum || normalizedInput,
        patentNumber: cachedPatent.id || normalizedInput,
        title: cachedPatent.title,
        abstract: cachedPatent.abstract,
        inventors: cachedPatent.inventors,
        assignees: cachedPatent.assignees || (cachedPatent.assignee ? [cachedPatent.assignee] : []),
        filingDate: cachedPatent.filingDate,
        publicationDate: pubDate,
        grantDate: cachedPatent.grantDate,
        cpc: cpcList,
        source: cachedPatent.source,
        importQuality: cachedPatent.importQuality || 'PARTIAL',
        priorityDate: cachedPatent.priorityDate,
        claims: claimsArr.map((c: any) => ({
          claimNumber: c.claimNumber || c.number,
          text: c.text,
          type: c.type,
          dependsOn: c.dependsOn || []
        }))
      };
      resolvedId = cachedPatent.id;
    }

    // 2nd Priority Check: Backend Server Proxy Endpoint (Bypasses Browser CORS Restrictions)
    if (!rawMetadata) {
      console.log(`[${requestId}] Querying Patent Backend Proxy Endpoint for: ${normalizedInput}`);
      try {
        const backendRes = await resolvePatentViaBackend(normalizedInput, internalController.signal);
        if (!backendRes.success) {
          throw new PatentImportError(backendRes.errorCode === 'PATENT_NOT_FOUND' ? 'PATENT_NOT_FOUND' : 'SOURCE_UNAVAILABLE', backendRes.message || 'Patent source unavailable.', 'Try again later.');
        }
        if (backendRes.patent) {
          const p = backendRes.patent;
          rawMetadata = {
            publicationNumber: p.publicationNumber || p.id || normalizedInput,
            patentNumber: p.patentNumber || p.id || normalizedInput,
            title: p.title,
            abstract: p.abstract,
            inventors: p.inventors || [],
            assignees: p.assignees || (p.assignee ? [p.assignee] : []),
            filingDate: p.filingDate,
            publicationDate: p.publicationDate || p.issueDate,
            grantDate: p.grantDate,
            cpc: p.cpcCodes || p.cpc || [],
            claims: p.claims || [],
            source: p.source || 'Google Patents',
            importQuality: p.importQuality,
            priorityDate: p.priorityDate
          };
          resolvedId = normalizedInput;
          console.log(`[${requestId}] Backend Proxy Match: ${normalizedInput} -> "${rawMetadata.title}"`);
        }
      } catch (err: any) {
        throw err;
      }
    }

    sourceMs = performance.now() - connStart;

    if (!rawMetadata || !rawMetadata.title) {
      throw new PatentImportError('PATENT_NOT_FOUND', `Patent record "${patentInput}" (${normalizedInput}) was not found in official patent registries.`, 'Please verify the patent number formatting (e.g. US11954112B2 or US11594127B1).');
    }

    checkAborted();

    // ==========================================
    // STEP 3: PARSE METADATA (30 - 50%)
    // ==========================================
    const metaStart = performance.now();
    emitState(onProgressState, requestId, 'fetching_metadata', 45, 3, 'Parsing official metadata & bibliographic fields...', startTime, `Title: "${rawMetadata.title.substring(0, 45)}..."`);

    // Verify exact returned record identity (Requirement 25)
    const returnedId = rawMetadata.publicationNumber || rawMetadata.patentNumber || resolvedId;
    validatePatentIdentity(normalizedInput, returnedId);
    resolvedId = returnedId;
    const resolvedIdentity = normalizePatentNumber(returnedId);
    metadataMs = performance.now() - metaStart;

    checkAborted();

    // ==========================================
    // STEP 4: PARSE CLAIMS (50 - 70%)
    // ==========================================
    const claimsStart = performance.now();
    emitState(onProgressState, requestId, 'fetching_claims', 65, 4, 'Extracting claims specification & dependencies...', startTime);

    const rawClaims: PatentClaim[] = rawMetadata.claims || [];
    claimsMs = performance.now() - claimsStart;

    checkAborted();

    // ==========================================
    // STEP 5: NORMALIZE STRUCTURE (70 - 85%)
    // ==========================================
    const normStart = performance.now();
    emitState(onProgressState, requestId, 'normalizing', 80, 5, 'Normalizing patent specification data structure...', startTime);

    const normalizedPatent: NormalizedPatent = {
      id: resolvedId,
      patentNumber: resolvedId,
      publicationNumber: resolvedId,
      applicationNumber: rawMetadata.applicationNumber,
      country: country || 'US',
      documentNumber,
      kindCode: resolvedIdentity.kindCode,
      displayNumber: resolvedIdentity.displayNumber,
      rawSourceIdentifier: rawInput,
      sourceIdentifier: resolvedId,
      documentType: 'PATENT',
      title: rawMetadata.title,
      abstract: rawMetadata.abstract || '',
      description: rawMetadata.description || '',
      claims: rawClaims,
      claimsCount: rawClaims.length,
      inventors: rawMetadata.inventors && rawMetadata.inventors.length > 0 ? rawMetadata.inventors : [],
      applicants: rawMetadata.assignees || [],
      assignees: rawMetadata.assignees && rawMetadata.assignees.length > 0 ? rawMetadata.assignees : [],
      assignee: (rawMetadata.assignees && rawMetadata.assignees[0]) || '',
      priorityDate: rawMetadata.priorityDate,
      filingDate: rawMetadata.filingDate,
      publicationDate: rawMetadata.publicationDate,
      grantDate: rawMetadata.grantDate,
      cpc: rawMetadata.cpc && rawMetadata.cpc.length > 0 ? rawMetadata.cpc : [],
      ipc: rawMetadata.ipc || [],
      source: rawMetadata.source || 'Local registry (not live verified)',
      sourceUrl: `https://patents.google.com/patent/${resolvedId}/en`,
      retrievedAt: new Date().toISOString(),
      importQuality: rawMetadata.importQuality || 'PARTIAL'
    };
    normalizationMs = performance.now() - normStart;

    checkAborted();

    // ==========================================
    // STEP 6: SAVE TO DATABASE (85 - 95%)
    // ==========================================
    const dbStart = performance.now();
    emitState(onProgressState, requestId, 'saving', 95, 6, 'Saving normalized patent record to workspace database...', startTime);

    // Save to workspace store & memory cache
    workspaceStore.addNormalizedPatent(normalizedPatent);
    PATENT_CACHE.set(normalizedInput, normalizedPatent);
    PATENT_CACHE.set(resolvedId, normalizedPatent);

    databaseMs = performance.now() - dbStart;

    // ==========================================
    // STEP 7: COMPLETE (100%)
    // ==========================================
    const totalMs = performance.now() - startTime;
    const timings: ImportTimings = {
      validationMs: Math.round(validationMs),
      sourceMs: Math.round(sourceMs),
      metadataMs: Math.round(metadataMs),
      claimsMs: Math.round(claimsMs),
      normalizationMs: Math.round(normalizationMs),
      databaseMs: Math.round(databaseMs),
      totalMs: Math.round(totalMs)
    };

    emitState(onProgressState, requestId, 'completed', 100, 7, 'Patent import completed successfully!', startTime);

    console.log(`[${requestId}] IMPORT COMPLETED IN ${totalMs.toFixed(1)}ms! Timings: Validation=${timings.validationMs}ms, Source=${timings.sourceMs}ms, Meta=${timings.metadataMs}ms, Claims=${timings.claimsMs}ms, DB=${timings.databaseMs}ms`);

    return {
      success: true,
      requestId,
      status: 'completed',
      patent: normalizedPatent,
      timings
    };

  } catch (err: any) {
    const totalMs = performance.now() - startTime;
    const isAbort = err.name === 'AbortError' || err.code === 'CANCELLED' || abortSignal?.aborted;
    const errorCode: ImportErrorCode = internalController.signal.aborted
      ? (abortSignal?.aborted ? 'CANCELLED' : 'SOURCE_TIMEOUT')
      : (err instanceof PatentImportError ? err.code : (isAbort ? 'CANCELLED' : 'SOURCE_UNAVAILABLE'));
    const errorMessage = err.message || 'An unexpected error occurred during patent fetching.';

    const status: ImportStatus = errorCode === 'CANCELLED' ? 'cancelled' : errorCode === 'SOURCE_TIMEOUT' ? 'timeout' : 'failed';

    emitState(onProgressState, requestId, status, 0, 0, errorMessage, startTime, undefined, {
      code: errorCode,
      message: errorMessage,
      suggestedAction: err.suggestedAction || 'Please check the patent identifier or try again.'
    });

    console.error(`[${requestId}] IMPORT FAILED (${errorCode}) after ${totalMs.toFixed(1)}ms: ${errorMessage}`);

    return {
      success: false,
      requestId,
      status,
      error: {
        code: errorCode,
        message: errorMessage
      }
    };
  } finally {
    clearTimeout(timeoutId);
    abortSignal?.removeEventListener('abort', cancel);
  }
}

/**
 * Backward compatible progress wrapper for existing UI components expecting (step: number, label: string)
 */
export async function fetchPatentByNumberWithProgress(
  patentInput: string,
  onProgress?: (step: number, label: string) => void,
  abortSignal?: AbortSignal
): Promise<NormalizedPatent> {
  const result = await fetchPatentByNumberWithProgressState(
    patentInput,
    (state) => {
      if (onProgress && state.stepNumber > 0) {
        onProgress(state.stepNumber, state.message);
      }
    },
    abortSignal
  );

  if (!result.success || !result.patent) {
    throw new Error(result.error?.message || 'Patent fetch failed.');
  }

  return result.patent;
}

/**
 * Fast Google Patents fetcher with AbortSignal & per-request timeout
 */
/**
 * Real-Time USPTO PatentsView API Fetcher
 */
async function fetchUsptoPatentsViewApi(query: string, timeoutMs: number = 4000, strict = false): Promise<Patent[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const qObj = JSON.stringify({ _text_any: { patent_title: query } });
    const fObj = JSON.stringify(["patent_number", "patent_title", "patent_abstract", "patent_date", "assignee_organization", "inventor_first_name", "inventor_last_name"]);
    const url = `https://api.patentsview.org/patents/query?q=${encodeURIComponent(qObj)}&f=${encodeURIComponent(fObj)}&o=${encodeURIComponent(JSON.stringify({ per_page: 10 }))}`;

    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Patent source unavailable (HTTP ${res.status}).`);
    const data = await res.json();
    if (!data || !Array.isArray(data.patents)) throw new Error('Patent source returned an invalid response.');

    return data.patents.flatMap((p: any): Patent[] => {
      const rawNum = String(p.patent_number || '').toUpperCase();
      if (!/^(US)?\d{6,12}([A-Z]\d?)?$/.test(rawNum) || typeof p.patent_title !== 'string' || !p.patent_title.trim()) return [];
      // PatentsView can omit kind codes. Keep them absent rather than guessing B2.
      const canonicalId = rawNum.startsWith('US') ? rawNum : `US${rawNum}`;
      const inventors = Array.isArray(p.inventors) ? p.inventors.map((inv: any) =>
        `${inv.inventor_first_name || ''} ${inv.inventor_last_name || ''}`.trim()).filter(Boolean) : [];
      return [{
        id: canonicalId, patentNumber: canonicalId, documentType: 'PATENT',
        title: p.patent_title, assignee: p.assignees?.[0]?.assignee_organization || '', inventors,
        publicationDate: p.patent_date || '', priorityDate: '', cpcClass: '',
        abstract: p.patent_abstract || '', claimsCount: 0,
        source: 'PatentsView', importQuality: 'PARTIAL',
        sourceUrl: getPatentSourceUrl({ publicationNumber: canonicalId })
      }];
    });
  } catch (e) {
    if (strict) throw e;
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Multi-Source Live Patent & Prior-Art Search Engine
 * Returns only patents; academic sources are handled by priorArtSearch.
 */
export async function searchLiveUsptoPatents(query: string, strict = false): Promise<Patent[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const routeDecision = resolveSearchDomain(trimmed);

  console.log(`[DYNAMIC LIVE USPTO SEARCH ENGINE] Querying real-time network endpoints for: "${query}"`);

  // 1. If query is a Patent Identifier (Rule #5 & #20)
  if (routeDecision.isPatentId) {
    try {
      const result = await fetchPatentByNumberWithProgressState(trimmed);
      if (!result.success && strict) throw new Error(result.error?.message || 'Patent source unavailable.');
      if (result.success && result.patent) {
        const p = result.patent;
        return [{
          id: p.id,
          patentNumber: p.displayNumber || p.id,
          title: p.title,
          assignee: p.assignee || (p.assignees && p.assignees[0]) || '',
          inventors: p.inventors || [],
          publicationDate: p.publicationDate || '',
          priorityDate: p.priorityDate || '',
          cpcClass: p.cpc?.[0] || '',
          abstract: p.abstract,
          claimsCount: p.claims ? p.claims.length : 0,
          source: p.source,
          parsedClaims: p.claims,
          sourceUrl: getPatentSourceUrl(p)
        }];
      }
    } catch (e) {
      if (strict) throw e;
      console.warn('[SearchEngine] Patent identifier lookup failed or not found:', e);
    }
    // MANDATORY RULE: Patent identifier MUST NEVER fall back to OpenAlex! Return empty or error.
    return [];
  }

  // Bundled examples and workspace records are never merged into source results.
  return fetchUsptoPatentsViewApi(trimmed, 4000, strict);
}

export async function fetchPatentByNumber(patentNumber: string): Promise<Patent | null> {
  try {
    const norm = await fetchPatentByNumberWithProgress(patentNumber);
    return {
      id: norm.id,
      patentNumber: norm.patentNumber,
      title: norm.title,
      assignee: norm.assignee || '',
      inventors: norm.inventors,
      publicationDate: norm.publicationDate || '',
      priorityDate: norm.priorityDate || '',
      cpcClass: norm.cpc[0] || '',
      abstract: norm.abstract,
      claimsCount: norm.claimsCount,
      source: norm.source,
      parsedClaims: norm.claims,
      sourceUrl: norm.sourceUrl
    };
  } catch (err) {
    return null;
  }
}
