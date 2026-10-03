import type { PatentDocument, Claim } from '../types.ts';

function plainText(value: string): string {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (entity, code: string) => {
      const value = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (_, name: string) =>
      ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[name.toLowerCase()] || '')
    .replace(/\s+/g, ' ').trim();
}

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(m => [m[1].toLowerCase(), m[2] ?? m[3]]));
}

/** No kind code or country is inferred from a source document. */
function publicationId(value: string): string | null {
  const clean = value.toUpperCase().replace(/[\s.,/-]/g, '');
  return /^[A-Z]{2}\d{6,12}[A-Z]\d?$/.test(clean) ? clean : null;
}

/**
 * Conservative Google Patents adapter shared by the dev proxy and client fallback.
 * Reject pages without a source publication identity. Never manufacture missing fields.
 * HTML is a partial import: extracting some claims does not prove completeness.
 */
export function parseGooglePatentsHtmlServer(html: string, requestedId: string): PatentDocument | null {
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(m => attributes(m[0]));
  const values = (field: string) => tags.filter(a =>
    a.name?.toLowerCase() === field.toLowerCase() || a.itemprop?.toLowerCase() === field.toLowerCase())
    .map(a => plainText(a.content || '')).filter(Boolean);
  const first = (...fields: string[]) => fields.flatMap(values)[0] || '';

  const identities = values('publicationNumber').map(publicationId).filter((id): id is string => !!id);
  for (const tag of tags.filter(a => a.rel?.toLowerCase() === 'canonical')) {
    try {
      const url = new URL(tag.href);
      if (url.protocol === 'https:' && url.hostname === 'patents.google.com') {
        const id = publicationId(url.pathname.match(/^\/patent\/([^/]+)(?:\/|$)/)?.[1] || '');
        if (id) identities.push(id);
      }
    } catch { /* Invalid canonical URLs cannot establish identity. */ }
  }
  const uniqueIds = [...new Set(identities)];
  if (uniqueIds.length !== 1) return null;
  const id = uniqueIds[0];
  const requested = requestedId.toUpperCase().replace(/[\s.,/-]/g, '');
  const withCountry = /^\d/.test(requested) ? `US${requested}` : requested;
  if (id !== withCountry && id.replace(/[A-Z]\d?$/, '') !== withCountry) return null;
  const title = first('DC.title', 'title');
  if (!title) return null;

  const contributors = (scheme: string) => tags.filter(a =>
    a.name?.toLowerCase() === 'dc.contributor' && a.scheme?.toLowerCase() === scheme)
    .map(a => plainText(a.content || '')).filter(Boolean);
  const inventors = [...new Set([...values('inventor'), ...contributors('inventor')])];
  const assignees = [...new Set([...values('assigneeCurrent'), ...values('assigneeOriginal'), ...contributors('assignee')])];
  const date = (field: string) => /^\d{4}-\d{2}-\d{2}$/.test(first(field)) ? first(field) : undefined;

  // Track nested div depth: nested claim-text blocks belong to the outer claim.
  const claims: Claim[] = [];
  let depth = 0;
  let start = -1;
  for (const match of html.matchAll(/<\/?div\b[^>]*>/gi)) {
    const closing = /^<\//.test(match[0]);
    if (start >= 0) {
      depth += closing ? -1 : 1;
      if (depth === 0) {
        const text = plainText(html.slice(start, match.index));
        const number = text.match(/^(\d+)\s*[.)]\s*/);
        // Unnumbered or duplicate fragments cannot safely become separate claims.
        if (number && !claims.some(c => c.claimNumber === Number(number[1]))) {
          claims.push({ claimNumber: Number(number[1]), text, elements: [] });
        }
        start = -1;
      }
    } else if (!closing && attributes(match[0]).class?.split(/\s+/).includes('claim-text')) {
      start = match.index + match[0].length;
      depth = 1;
    }
  }

  const kindCode = id.match(/([A-Z]\d?)$/)![1];
  return {
    id, publicationNumber: id, patentNumber: id, country: id.slice(0, 2), kindCode,
    documentType: 'PATENT', title, abstract: first('DC.description', 'abstract'),
    inventors, assignees, assignee: assignees[0],
    filingDate: date('filingDate'), publicationDate: date('publicationDate'),
    priorityDate: date('priorityDate'),
    grantDate: date('grantDate'),
    cpc: [...new Set(values('cpc').filter(code => /^[A-HY]\d{2}[A-Z]\s*\d+\/\d+$/.test(code)))],
    ipc: [], claims, claimsCount: claims.length,
    source: 'Google Patents', sourceUrl: `https://patents.google.com/patent/${id}/en`,
    retrievedAt: new Date().toISOString(), importQuality: 'PARTIAL'
  };
}
