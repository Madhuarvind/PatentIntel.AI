import type { Patent, PatentClaim } from '../types';
import { normalizePatentNumber, parseClaimDependency } from './patentNormalizer';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export interface PdfPageData {
  pageNumber: number;
  text: string;
}

export interface ParsedPatentResult {
  patent: Patent;
  claims: PatentClaim[];
  pages: PdfPageData[];
  fileHash: string;
  identitySource: 'first_page_header' | 'document_metadata' | 'barcode' | 'ocr' | 'hash_generated';
  identityConfidence: number;
  isTextLayerAvailable: boolean;
  artifactRatio: number;
}

/**
 * Generates a SHA-256 hash for the uploaded file bytes to guarantee file-specific uniqueness.
 */
export async function calculateFileHash(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Deterministic fallback hash based on file parameters
    const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '');
    return `hash_${file.size}_${file.lastModified}_${safeName}`;
  }
}

/**
 * PDF Internal Metadata & Object Syntax Artifact Leakage Detection
 */
export function detectPdfArtifactLeakage(text: string): {
  isArtifactLeaked: boolean;
  artifactRatio: number;
} {
  if (!text) return { isArtifactLeaked: true, artifactRatio: 1.0 };

  const pdfInternalTokens = [
    '/Type', '/Catalog', '/Pages', '/Parent', '/Dest', '/XYZ',
    '/Annots', '/Resources', '/MediaBox', '/Contents', '/Font',
    'null null', 'obj', 'endobj', 'xref', 'trailer', 'FlateDecode'
  ];

  let matches = 0;
  pdfInternalTokens.forEach(token => {
    const regex = new RegExp(token.replace('/', '\\/'), 'gi');
    const m = text.match(regex);
    if (m) matches += m.length;
  });

  const words = text.trim().split(/\s+/).length;
  const artifactRatio = words > 0 ? matches / words : 1.0;

  const isArtifactLeaked = artifactRatio > 0.03 || 
                          /^\s*\(Page\s+\d+[^)]*\)\s*\/(?:Parent|Dest|Catalog|Type)/i.test(text) ||
                          /\/(?:Parent|Dest|Catalog|XYZ)\s+\d+/i.test(text);

  return {
    isArtifactLeaked,
    artifactRatio
  };
}

/**
 * Extract Page-by-Page Text Content Layer using PDF.js
 */
export async function extractPdfTextPageByPage(file: File): Promise<{
  pages: PdfPageData[];
  fullText: string;
  isTextLayerAvailable: boolean;
}> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;

    const pages: PdfPageData[] = [];
    let fullText = '';

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
        .filter(Boolean);

      const pageText = pageStrings.join('').replace(/[^\S\n]+/g, ' ').trim();
      pages.push({
        pageNumber: i,
        text: pageText
      });

      fullText += `\n--- Page ${i} ---\n` + pageText;
    }

    const isTextLayerAvailable = pages.some(page => page.text.trim().length > 0);
    await loadingTask.destroy();
    return {
      pages,
      fullText,
      isTextLayerAvailable
    };
  } catch (e) {
    console.warn('PDF.js text layer extraction warning:', e);
    throw new Error('Unable to read this PDF. Upload a valid PDF with selectable text.');
  }
}

/**
 * Extracts explicit first-page patent number from header
 */
export function extractPatentNumberFromFirstPage(text: string): {
  rawExtracted: string;
  canonical: string;
  publicationNumber: string;
  patentNumber: string;
  country: string;
  kindCode: string;
  displayNumber: string;
  source: 'first_page_header' | 'document_metadata' | 'barcode' | 'ocr';
  confidence: number;
} | null {
  if (!text) return null;

  // 1. Priority 1: Label-aware first-page header extraction: "(10) Patent No.: US 11,594,127 B1"
  const headerMatch = text.match(/\((?:10)\)?\s*(?:Patent\s+No\.?|Pat\.\s+No\.?|Pub\.\s+No\.?):\s*(US\s*[\d\s,\.]{7,12}\s*[A-Z]\d?)/i) ||
                      text.match(/(?:Patent\s+No\.?|Pat\.\s+No\.?|Pub\.\s+No\.?):\s*(US\s*[\d\s,\.]{7,12}\s*[A-Z]\d?)/i) ||
                      text.match(/United\s+States\s+Patent\s+([\w\s,\.]{7,15})/i);

  if (headerMatch) {
    const rawMatch = headerMatch[1].trim();
    const clean = rawMatch.replace(/[\s\.,]/g, '').toUpperCase();
    
    if (clean.length <= 15 && /^US\d{7,10}[A-Z]\d?$/.test(clean)) {
      const norm = normalizePatentNumber(rawMatch);
      return {
        rawExtracted: rawMatch,
        canonical: norm.canonical,
        publicationNumber: norm.canonical,
        patentNumber: norm.documentNumber,
        country: norm.country,
        kindCode: norm.kindCode,
        displayNumber: norm.displayNumber,
        source: 'first_page_header',
        confidence: 0.99
      };
    }
  }

  // 2. Priority 2: Document header pattern matching "US 11,594,127 B1" or "US11594127B1"
  const numMatch = text.match(/US\s*\d{2}[\s,]*\d{3}[\s,]*\d{3}\s*[A-Z]\d?/i) ||
                  text.match(/US\d{7,10}[A-Z]\d?/i);

  if (numMatch) {
    const rawMatch = numMatch[0].trim();
    const clean = rawMatch.replace(/[\s\.,]/g, '').toUpperCase();
    if (clean.length <= 15) {
      const norm = normalizePatentNumber(rawMatch);
      return {
        rawExtracted: rawMatch,
        canonical: norm.canonical,
        publicationNumber: norm.canonical,
        patentNumber: norm.documentNumber,
        country: norm.country,
        kindCode: norm.kindCode,
        displayNumber: norm.displayNumber,
        source: 'document_metadata',
        confidence: 0.90
      };
    }
  }

  return null;
}

/**
 * Master Client-Side Patent PDF Importer Pipeline
 */
export async function parsePatentFile(file: File): Promise<ParsedPatentResult> {
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') throw new Error('Upload a PDF file.');
  const fileHash = await calculateFileHash(file);
  const { pages, fullText, isTextLayerAvailable } = await extractPdfTextPageByPage(file);
  const firstPageText = pages.length > 0 ? pages[0].text : fullText;
  
  // Real-time debug output per Requirement 54
  console.log(`[PDF IMPORT] Job ID: job_${Date.now()}`);
  console.log(`[PDF IMPORT] File: ${file.name} (${file.size} bytes, ${file.type})`);
  console.log(`[PDF IMPORT] File Hash: ${fileHash}`);
  console.log(`[PDF IMPORT] Text Extraction Available: ${isTextLayerAvailable}`);
  console.log(`[PDF IMPORT] First Page Text Preview:`, firstPageText.substring(0, 250));

  return parsePatentFromTextLayer(fullText, firstPageText, pages, file.name, fileHash, isTextLayerAvailable);
}

/**
 * Pure Dynamic Patent Parser — Extracts ALL fields strictly from uploaded file content
 */
export function parsePatentFromTextLayer(
  fullText: string,
  firstPageText: string,
  pages: PdfPageData[],
  fileName: string,
  fileHash: string,
  isTextLayerAvailable: boolean
): ParsedPatentResult {
  if (!isTextLayerAvailable || !fullText.trim()) throw new Error('No selectable text was found. OCR is not available; upload a searchable PDF.');
  // 1. Artifact Leakage Check
  const leakage = detectPdfArtifactLeakage(firstPageText);

  // 2. Extract Patent Identity strictly from PDF Text or Filename or SHA-256 Hash
  const headerId = extractPatentNumberFromFirstPage(firstPageText);
  
  let publicationNumber = '';
  let patentNumber = '';
  let country = 'US';
  let kindCode = 'B1';
  let displayNumber = '';
  let identitySource: 'first_page_header' | 'document_metadata' | 'barcode' | 'ocr' | 'hash_generated' = 'first_page_header';
  let identityConfidence = 0.99;

  if (headerId) {
    publicationNumber = headerId.publicationNumber;
    patentNumber = headerId.patentNumber;
    country = headerId.country;
    kindCode = headerId.kindCode;
    displayNumber = headerId.displayNumber;
    identitySource = headerId.source;
    identityConfidence = headerId.confidence;
  } else {
    publicationNumber = '';
    patentNumber = '';
    country = '';
    kindCode = '';
    displayNumber = `PDF: ${fileName}`;
    identitySource = 'hash_generated';
    identityConfidence = 0;
  }

  // 3. Extract Title strictly from PDF text or Clean File Name
  const titleMatch = firstPageText.match(/\((?:54)\)?\s*(?:Title[:\s]*)?([\s\S]*?)(?=\(\d{2}\)|Applicant|Inventors|Assignee|Abstract|Background|Field|$)/i) ||
                     fullText.match(/(?:Title|Invention)[:\s]+([^\n\r]+)/i);

  let title = '';
  if (titleMatch && titleMatch[1].trim().length > 5) {
    const rawT = titleMatch[1].replace(/\s+/g, ' ').trim();
    if (!detectPdfArtifactLeakage(rawT).isArtifactLeaked) {
      title = rawT;
    }
  }

  if (!title) {
    // Clean up filename to serve as title if no PDF title tag found
    const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    title = cleanName.length > 3 ? cleanName : `Uploaded Specification (${displayNumber})`;
  }

  // 4. Extract Assignee / Applicant strictly from PDF text
  const assigneeMatch = firstPageText.match(/\((?:73|71)\)?\s*(?:Assignee|Applicant):\s*([\s\S]*?)(?=\(\d{2}\)|Notice|Field|$)/i) ||
                        fullText.match(/(?:Assignee|Applicant)[:\s]+([^\n\r]+)/i);

  let assignee = '';
  if (assigneeMatch && assigneeMatch[1].trim().length > 2) {
    const rawA = assigneeMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!detectPdfArtifactLeakage(rawA).isArtifactLeaked) {
      assignee = rawA;
    }
  }

  if (!assignee) {
    assignee = '';
  }

  // 5. Extract Inventors strictly from PDF text
  const inventorMatch = firstPageText.match(/\((?:72)\)?\s*Inventors?:\s*([\s\S]*?)(?=\(\d{2}\)|Assignee|Applicant|Notice|$)/i) ||
                        fullText.match(/Inventors?[:\s]+([^\n\r]+)/i);

  let inventors: string[] = [];
  if (inventorMatch && inventorMatch[1].trim().length > 3) {
    const rawInv = inventorMatch[1].replace(/\s+/g, ' ').trim();
    if (!detectPdfArtifactLeakage(rawInv).isArtifactLeaked) {
      inventors = rawInv.split(/;|,|\band\b/i).map(s => s.replace(/\([^)]*\)/g, '').trim()).filter(Boolean);
    }
  }

  if (inventors.length === 0) {
    inventors = [];
  }

  // 6. Extract Date of Patent / Grant Date
  const dateMatch = firstPageText.match(/\((?:45)\)?\s*(?:Date\s+of\s+Patent|Patent\s+Date):\s*([A-Za-z]+\s+\d{1,2},\s*\d{4}|\d{4}-\d{2}-\d{2})/i) ||
                    fullText.match(/Date\s+of\s+Patent[:\s]+([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);

  let grantDate = '';
  if (dateMatch) {
    const dStr = dateMatch[1].trim();
    const parsedD = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dStr) ? `${dStr}T00:00:00Z` : `${dStr} UTC`);
    if (!isNaN(parsedD.getTime())) {
      grantDate = parsedD.toISOString().split('T')[0];
    }
  }

  // 7. Extract Abstract strictly from PDF text
  const abstractMatch = firstPageText.match(/\((?:57)\)?\s*ABSTRACT\s*([\s\S]*?)(?=\(\d{2}\)|Claims|Background|Detailed Description|$)/i) ||
                        fullText.match(/Abstract[:\s]+([\s\S]*?)(?:Claims|Background|Detailed Description|$)/i);

  let abstract = '';
  if (abstractMatch && abstractMatch[1].trim().length > 15) {
    const rawAbs = abstractMatch[1].replace(/\s+/g, ' ').trim();
    if (!detectPdfArtifactLeakage(rawAbs).isArtifactLeaked) {
      abstract = rawAbs;
    }
  }

  // Only numbered text within an explicit claims section is treated as claims.
  const claimsSectionMatch = fullText.match(/(?:what is claimed is|(?:^|\n)\s*claims)\s*:?\s*([\s\S]*)/i);
  const claimsText = claimsSectionMatch?.[1] || '';
  const blocks = claimsText.split(/(?=\b\d+\.\s+)/g);
  const parsedClaims: PatentClaim[] = [];
  for (const block of blocks) {
    const clean = block.replace(/--- Page \d+ ---/g, '').replace(/\s+/g, ' ').trim();
    const number = clean.match(/^(\d+)\.\s+/);
    if (!number || detectPdfArtifactLeakage(clean).isArtifactLeaked) continue;
    const claimNumber = Number(number[1]);
    if (claimNumber < 1 || parsedClaims.some(c => c.claimNumber === claimNumber)) continue;
    const dependency = parseClaimDependency(clean, claimNumber);
    parsedClaims.push({ claimNumber, text: clean, type: dependency.type, dependsOn: dependency.dependsOn });
  }

  // Generate unique internal database ID for this uploaded file
  const internalId = publicationNumber || `pdf_${fileHash}`;

  const patent: Patent = {
    id: internalId,
    patentNumber: patentNumber || publicationNumber,
    publicationNumber,
    country,
    kindCode,
    displayNumber,
    documentType: 'Uploaded Specification PDF',
    title,
    assignee,
    assignees: assignee ? [assignee] : [],
    inventors,
    publicationDate: '',
    grantDate,
    priorityDate: '',
    cpcClass: '',
    cpc: [],
    abstract,
    claimsCount: parsedClaims.length,
    source: 'Uploaded PDF Specification',
    sourceUrl: '',
    fileHash,
    retrievedAt: new Date().toISOString(),
    importQuality: 'PARTIAL'
  };

  console.log(`[PDF IMPORT] PARSING SUCCESS:`);
  console.log(`[PDF IMPORT] Database ID: ${internalId}`);
  console.log(`[PDF IMPORT] Publication Number: ${publicationNumber}`);
  console.log(`[PDF IMPORT] Title: ${title}`);
  console.log(`[PDF IMPORT] Assignee: ${assignee}`);
  console.log(`[PDF IMPORT] Inventors:`, inventors);
  console.log(`[PDF IMPORT] Extracted Claims Count: ${parsedClaims.length}`);

  return {
    patent,
    claims: parsedClaims,
    pages,
    fileHash,
    identitySource,
    identityConfidence,
    isTextLayerAvailable,
    artifactRatio: leakage.artifactRatio
  };
}
