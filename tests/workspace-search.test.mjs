import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

let server, rank, parse, convert, store, api, search;
const memory = new Map();
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
before(async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key)
  }});
  server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  rank = (await server.ssrLoadModule('/src/services/workspaceSearch.ts')).searchWorkspace;
  parse = (await server.ssrLoadModule('/src/services/pdfParser.ts')).parsePatentFromTextLayer;
  convert = (await server.ssrLoadModule('/src/services/pdfWorkspaceImport.ts')).createPdfWorkspaceDocument;
  store = (await server.ssrLoadModule('/src/services/workspaceStore.ts')).workspaceStore;
  api = await server.ssrLoadModule('/src/services/usptoApi.ts');
  search = (await server.ssrLoadModule('/src/services/priorArtSearch.ts')).searchPriorArt;
});
afterEach(() => { globalThis.fetch = originalFetch; });
after(async () => {
  await server?.close();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});
const document = { id: 'US12345001B2', title: 'Optical sensor', abstract: 'A housing.', claims: [{ number: 1, text: 'A transmitter operating at 20 kHz.' }] };
const parseText = (text, name = 'notes.pdf') => parse(text, text, [{ pageNumber: 1, text }], name, 'abcdef1234567890', true);

test('fresh workspace is empty and opt-in samples do not overwrite imported records', () => {
  assert.equal(store.getPatents().length, 0);
  store.addPatent(document);
  store.resetToDefault();
  assert.deepEqual(store.findPatent(document.id), document);
  assert.equal(store.getPatents().filter(p => p.isSample).length, 3);
  store.resetToDefault();
  assert.equal(store.getPatents().length, 4);
});

test('empty, punctuation-only, substring-only, and unrelated queries return no candidates', () => {
  for (const query of ['', ' ', '!!!', 'sen', 'volcano']) assert.deepEqual(rank([document], query), []);
});

test('ranking searches claims and deduplicates terms without a score floor', () => {
  const result = rank([document], 'transmitter transmitter volcano');
  assert.equal(result.length, 1);
  assert.equal(result[0].score, 50);
  assert.deepEqual(result[0].matchedTerms, ['transmitter']);
  assert.equal(rank([document], '20 kHz')[0].score, 100);
});

test('formatted exact identifiers work and samples require explicit opt-in', () => {
  assert.equal(rank([document], 'US 12,345,001 B2')[0].score, 100);
  assert.deepEqual(rank([{ ...document, isSample: true }], 'sensor'), []);
  assert.equal(rank([{ ...document, isSample: true }], 'sensor', true).length, 1);
});

test('rank order follows actual term coverage and preserves unavailable metadata', () => {
  const stronger = { ...document, id: 'US12345002B2', abstract: 'A housing and valve.' };
  const results = rank([document, stronger], 'sensor valve');
  assert.deepEqual(results.map(r => r.patent.id), [stronger.id, document.id]);
  assert.deepEqual(results.map(r => r.score), [100, 50]);
  assert.equal(results[0].patent.priorityDate, undefined);
  assert.equal(results[0].patent.cpcCodes, undefined);
});

test('PDF prose and a patent-looking filename cannot manufacture claims or patent identity', () => {
  const p = parseText('This is a technical note about optical sensors. A housing contains a circuit.', 'US99999999B2.pdf');
  assert.deepEqual(p.claims, []);
  assert.equal(p.patent.publicationNumber, '');
  assert.equal(p.patent.kindCode, '');
  assert.equal(p.patent.country, '');
  assert.equal(p.patent.abstract, '');
  assert.deepEqual(p.patent.cpc, []);
  assert.deepEqual(p.patent.inventors, []);
  assert.equal(p.patent.similarityScore, undefined);
  assert.equal(p.patent.importQuality, 'PARTIAL');
});

test('numbered background paragraphs are not claims; numbered claim sections are retained', () => {
  assert.deepEqual(parseText('Background\n1. A long background explanation about optical sensors.').claims, []);
  const parsed = parseText('Claims\n1. A sensor comprising a housing.\n2. The sensor of claim 1, comprising a coil.');
  assert.equal(parsed.claims.length, 2);
  assert.equal(parsed.claims[0].text, '1. A sensor comprising a housing.');
  assert.equal(parsed.claims[1].type, 'dependent');
});

test('grant date remains grant date through PDF parsing and workspace conversion', () => {
  const parsed = parseText('(10) Patent No.: US 12,345,001 B2\n(45) Date of Patent: Jan 2, 2020\nClaims\n1. A sensor comprising a housing.');
  const doc = convert(parsed);
  assert.equal(doc.issueDate, '2020-01-02');
  assert.equal(doc.publicationDate, '');
  assert.equal(doc.priorityDate, '');
  assert.equal(doc.filingDate, undefined);
  assert.deepEqual(doc.cpcCodes, []);
  assert.equal(doc.source, 'Uploaded PDF Specification');
  assert.equal(doc.importQuality, 'PARTIAL');
});

test('a scanned document fails explicitly without OCR or fabricated text', () => {
  assert.throws(() => parse('', '', [], 'scan.pdf', 'hash', false), /OCR is not available/);
});

test('PDF file hashes and publication IDs prevent duplicate records; removal can be undone', () => {
  const doc = convert(parseText('Claims\n1. A sensor comprising a housing.'));
  store.addPatent(doc);
  store.addPatent({ ...doc });
  assert.equal(store.getPatents().filter(p => p.fileHash === doc.fileHash).length, 1);
  const removed = store.removePatent(doc.id);
  assert.equal(store.findPatent(doc.id), undefined);
  store.restorePatent(removed.removedPatent, removed.index);
  assert.equal(store.findByFileHash(doc.fileHash).id, doc.id);
});

test('source searches never substitute bundled examples or local patents', async () => {
  globalThis.fetch = async () => json({ patents: [] });
  assert.deepEqual(await api.searchLiveUsptoPatents('traffic sensor'), []);
  let calls = 0;
  globalThis.fetch = async () => { calls++; return json({ success: false, errorCode: 'PATENT_NOT_FOUND' }); };
  const result = await api.fetchPatentByNumberWithProgressState('US11594127B1');
  assert.equal(result.success, false);
  assert.ok(calls > 0);
});

test('source outage retains academic results and reports partial failure', async () => {
  globalThis.fetch = async url => String(url).includes('openalex.org') ? json({ results: [{ id: 'https://openalex.org/W1', display_name: 'Optical sensing', authorships: [] }] }) : new Response('', { status: 503 });
  const result = await search('optical sensing');
  assert.equal(result.patents.length, 0);
  assert.equal(result.papers.length, 1);
  assert.ok(result.warnings.some(w => /Patent source unavailable/.test(w)));
  assert.ok(result.warnings.some(w => /CrossRef unavailable/.test(w)));
});

test('successful empty source responses have no outage warnings', async () => {
  globalThis.fetch = async () => json({ patents: [], results: [], data: [], message: { items: [] } });
  assert.deepEqual(await search('no matches'), { patents: [], papers: [] });
});

test('cancellation and hard timeout abort the backend request before any save', async () => {
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  const controller = new AbortController();
  const pending = api.fetchPatentByNumberWithProgressState('US12345003B2', undefined, controller.signal, 1000);
  controller.abort();
  assert.equal((await pending).error.code, 'CANCELLED');
  const timeout = await api.fetchPatentByNumberWithProgressState('US12345004B2', undefined, undefined, 15);
  assert.equal(timeout.error.code, 'SOURCE_TIMEOUT');
  assert.equal(store.findPatent('US12345003B2'), undefined);
  assert.equal(store.findPatent('US12345004B2'), undefined);
});

test('a retrieved record replaces its sample without duplicate IDs', async () => {
  globalThis.fetch = async () => json({ success: true, documentType: 'PATENT', patent: {
    id: 'US11594127B1', publicationNumber: 'US11594127B1', title: 'Actual source fixture', abstract: '',
    source: 'Google Patents', claims: [], cpc: [], importQuality: 'PARTIAL'
  }});
  const result = await api.fetchPatentByNumberWithProgressState('US11594127B1');
  assert.equal(result.success, true);
  assert.equal(store.findPatent('US11594127B1').isSample, undefined);
  assert.equal(store.findPatent('US11594127B1').title, 'Actual source fixture');
  assert.equal(store.getPatents().filter(p => p.id === 'US11594127B1').length, 1);
});
