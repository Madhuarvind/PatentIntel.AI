import type { PatentDocument, NormalizedPatent } from '../types';
import type { ParsedPatentResult } from './pdfParser';

/** Preserve extracted and retrieved dates independently; never infer classification. */
export function createPdfWorkspaceDocument(parsed: ParsedPatentResult, retrieved?: NormalizedPatent): PatentDocument {
  const p = retrieved || parsed.patent;
  const claims = retrieved?.claims || parsed.claims;
  return {
    id: retrieved?.id || parsed.patent.id,
    title: p.title, abstract: p.abstract, assignee: p.assignee || '', inventors: p.inventors || [],
    cpcCodes: p.cpc || [], ipc: p.ipc || [],
    filingDate: p.filingDate, priorityDate: p.priorityDate,
    publicationDate: p.publicationDate, issueDate: p.grantDate, grantDate: p.grantDate,
    publicationNumber: p.publicationNumber, kindCode: p.kindCode,
    claims: claims.map(c => ({ number: c.claimNumber, text: c.text, type: c.type,
      isIndependent: c.type === 'independent', elements: [] })),
    source: retrieved ? `PDF upload; metadata from ${retrieved.source}` : 'Uploaded PDF Specification',
    sourceUrl: p.sourceUrl || '', fileHash: parsed.fileHash,
    rawSourceIdentifier: p.displayNumber || p.id, sourceIdentifier: p.publicationNumber || '',
    displayNumber: p.displayNumber || p.id, retrievedAt: p.retrievedAt,
    importQuality: p.importQuality || 'PARTIAL'
  };
}
