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

/** Preserve explicit kind codes; let the source resolve a missing kind code. */
export function normalizePatentNumber(input: string): NormalizedPatentId {
  const rawInput = input.trim();
  const clean = rawInput.toUpperCase().replace(/[\s.,/-]/g, '');
  const match = clean.match(/^([A-Z]{2})?(\d{6,12})([A-Z]\d?)?$/);
  if (!match || /^0+$/.test(match[2])) throw new Error('Please enter a valid patent publication number.');
  const country = match[1] || 'US';
  let documentNumber = match[2];
  if (country === 'US' && documentNumber.length === 9 && documentNumber.startsWith('0')) {
    documentNumber = documentNumber.replace(/^0+/, '');
  }
  const kindCode = match[3] || '';
  const normalizedInput = `${country}${documentNumber}${kindCode}`;
  const digits = country === 'US' && documentNumber.length === 11
    ? `${documentNumber.slice(0, 4)}/${documentNumber.slice(4)}`
    : documentNumber;
  return { rawInput, normalizedInput, canonical: normalizedInput, country, documentNumber,
    kindCode, displayNumber: `${country} ${digits} ${kindCode}`.trim(), candidates: [normalizedInput] };
}

/** A supplied kind code must match. A missing kind code must not be invented. */
export function validatePatentIdentity(requestedId: string, returnedId: string): boolean {
  const requested = normalizePatentNumber(requestedId);
  const returned = normalizePatentNumber(returnedId);
  if (requested.country !== returned.country || requested.documentNumber !== returned.documentNumber ||
      (requested.kindCode && requested.kindCode !== returned.kindCode)) {
    throw new Error(`Patent identity mismatch: requested ${requested.normalizedInput}, but received ${returned.normalizedInput}. Import aborted for data integrity.`);
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
