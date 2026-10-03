import { fail } from './http.mjs';
const clean = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
export function crossrefRecord(item) {
  if (!item.DOI || !item.title?.[0]) return null;
  const abstract = clean(item.abstract).slice(0, 12000);
  return { kind: 'PAPER', identifier: item.DOI, title: clean(item.title[0]), url: `https://doi.org/${encodeURI(item.DOI)}`,
    publicationDate: (item.published?.['date-parts']?.[0] || []).join('-'),
    passages: abstract ? [{ text: abstract, section: 'Publisher-supplied abstract' }] : [], provenance: 'Crossref metadata; not full text' };
}
export async function searchCrossref(query, fetcher = fetch) {
  try {
    const response = await fetcher(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10`, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'PatentIntel-Pilot/1.0' } });
    if (!response.ok) throw Error();
    const data = await response.json();
    if (!Array.isArray(data.message?.items)) throw Error();
    return { provider: 'Crossref', status: 'AVAILABLE', records: data.message.items.map(crossrefRecord).filter(Boolean) };
  } catch { return { provider: 'Crossref', status: 'UNAVAILABLE', records: [], message: 'Academic source unavailable. Retry or import a reference manually.' }; }
}
export async function importCrossref(doi, fetcher = fetch) {
  if (typeof doi !== 'string' || doi.length > 250 || !/^10\.\d{4,9}\/.+/.test(doi)) throw fail(400, 'A valid DOI is required.');
  const response = await fetcher(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw fail(503, 'Crossref could not supply that reference.');
  const record = crossrefRecord((await response.json()).message || {});
  if (!record || record.identifier.toLowerCase() !== doi.toLowerCase()) throw fail(503, 'The source identifier could not be confirmed.');
  return record;
}
