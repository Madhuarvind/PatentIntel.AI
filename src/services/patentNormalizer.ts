export interface NormalizedPatentId {
  rawInput: string;
  normalizedInput: string;
  canonical: string;
  country: string;
  documentNumber: string;
  kindCode: string;
  displayNumber: string;
  candidates: string[];
}

/**
 * Normalizes patent numbers into canonical representations and candidate fallback lists.
 * Handles inputs like:
 * - "US011594127B1" -> normalizedInput: "US11594127B1", displayNumber: "US 11,594,127 B1"
 * - "US 11,594,127 B1" -> normalizedInput: "US11594127B1", displayNumber: "US 11,594,127 B1"
 * - "11594127" -> normalizedInput: "US11594127B2", displayNumber: "US 11,594,127 B2"
 */
export function normalizePatentNumber(input: string): NormalizedPatentId {
  const rawInput = input.trim();
  if (!rawInput) {
    throw new Error('Please enter a valid patent number.');
  }

  const cleanInput = rawInput.toUpperCase().replace(/[\s\-\.,]/g, '');

  // Regex for standard patent identifiers (e.g., US011594127B1, US11594127B1, 11594127)
  const match = cleanInput.match(/^([A-Z]{2})?(\d{6,10})([A-Z]\d?)?$/);

  if (match) {
    const country = match[1] || 'US';
    const rawDigits = match[2];
    const kindCode = match[3] || (country === 'US' ? 'B2' : 'A1');

    // Strip leading zero for US 8-digit utility patents if padded (e.g. 011594127 -> 11594127)
    let documentNumber = rawDigits;
    if (country === 'US' && rawDigits.length === 9 && rawDigits.startsWith('0')) {
      documentNumber = rawDigits.replace(/^0+/, '');
    }

    const normalizedInput = `${country}${documentNumber}${kindCode}`;
    
    // Format display number with thousands separators (e.g. US 11,594,127 B1)
    const formattedDigits = parseInt(documentNumber, 10).toLocaleString('en-US');
    const displayNumber = `${country} ${formattedDigits} ${kindCode}`.trim();

    let candidates: string[] = [
      normalizedInput,
      `${country}${documentNumber}`,
      `${country}${documentNumber}B2`,
      `${country}${documentNumber}B1`,
      `${country}${documentNumber}A1`
    ];

    candidates = Array.from(new Set(candidates));

    return {
      rawInput,
      normalizedInput,
      canonical: normalizedInput,
      country,
      documentNumber,
      kindCode,
      displayNumber,
      candidates
    };
  }

  // Fallback for non-standard formats
  const documentNumber = cleanInput.replace(/[^0-9]/g, '');
  const country = cleanInput.slice(0, 2).match(/^[A-Z]{2}$/) ? cleanInput.slice(0, 2) : 'US';
  const kindCode = 'B2';
  const normalizedInput = `${country}${documentNumber}${kindCode}`;
  
  const formattedDigits = documentNumber ? parseInt(documentNumber, 10).toLocaleString('en-US') : cleanInput;
  const displayNumber = `${country} ${formattedDigits} ${kindCode}`.trim();

  const candidates = Array.from(new Set([
    cleanInput,
    normalizedInput,
    `${country}${documentNumber}`,
    `US${documentNumber}B2`,
    `US${documentNumber}B1`
  ])).filter(Boolean);

  return {
    rawInput,
    normalizedInput,
    canonical: normalizedInput,
    country,
    documentNumber,
    kindCode,
    displayNumber,
    candidates
  };
}

/**
 * Validates that the returned patent record identifier EXACTLY matches the requested patent identifier.
 * Throws an explicit identity mismatch error if they differ.
 */
export function validatePatentIdentity(requestedId: string, returnedId: string): boolean {
  const reqNorm = normalizePatentNumber(requestedId).normalizedInput;
  const retNorm = normalizePatentNumber(returnedId).normalizedInput;

  if (reqNorm !== retNorm) {
    throw new Error(
      `Patent identity mismatch: requested ${reqNorm}, but received ${retNorm}. Import aborted for data integrity.`
    );
  }
  return true;
}

/**
 * Analyzes claim text to detect if independent or dependent, and extracts target dependencies.
 * E.g., "5. The bidirectional interactive traffic-control management system as claimed in claim 1..."
 * -> type: 'dependent', dependsOn: [1]
 */
export function parseClaimDependency(claimText: string, claimNumber: number): { type: 'independent' | 'dependent'; dependsOn: number[] } {
  if (!claimText) return { type: 'independent', dependsOn: [] };

  const depMatch = claimText.match(/as claimed in claim (\d+)/i) ||
                   claimText.match(/according to claim (\d+)/i) ||
                   claimText.match(/of claim (\d+)/i) ||
                   claimText.match(/referring to claim (\d+)/i) ||
                   claimText.match(/in claim (\d+)/i);

  if (depMatch) {
    const targetNum = parseInt(depMatch[1]);
    if (targetNum > 0 && targetNum < claimNumber) {
      return {
        type: 'dependent',
        dependsOn: [targetNum]
      };
    }
  }

  return {
    type: 'independent',
    dependsOn: []
  };
}
