import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, parse, normalize, route, risk, search, api, store, Modal;
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const memory = new Map();
const fixture = (id = 'US12345678B2', body = '') => `
  <link href="https://patents.google.com/patent/${id}/en" rel="canonical">
  <meta content="Optical &amp; sensor system" name="DC.title">
  ${body}`;
const json = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

before(async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key)
  } });
  server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom',
    esbuild: { jsx: 'automatic' } });
  parse = (await server.ssrLoadModule('/src/services/patentHtmlParser.ts')).parseGooglePatentsHtmlServer;
  normalize = await server.ssrLoadModule('/src/services/patentNormalizer.ts');
  route = (await server.ssrLoadModule('/src/services/sourceRouter.ts')).isPatentIdentifier;
  risk = (await server.ssrLoadModule('/src/services/invalidityCalculator.ts')).computeInvalidityRisk;
  search = (await server.ssrLoadModule('/src/services/priorArtSearch.ts')).searchPriorArt;
  api = await server.ssrLoadModule('/src/services/usptoApi.ts');
  store = (await server.ssrLoadModule('/src/services/workspaceStore.ts')).workspaceStore;
  Modal = (await server.ssrLoadModule('/src/components/InvalidityCalculatorModal.tsx')).InvalidityCalculatorModal;
});
afterEach(() => { globalThis.fetch = originalFetch; });
after(async () => {
  await server?.close();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

test('access-denied and title-only HTML never become patent records', () => {
  assert.equal(parse('<title>Access denied</title>', 'US12345678B2'), null);
  assert.equal(parse('<meta name="DC.title" content="Not a patent">', 'US12345678B2'), null);
});

test('mismatched, conflicting, and hostile-host identities are rejected', () => {
  assert.equal(parse(fixture('US87654321B2'), 'US12345678B2'), null);
  assert.equal(parse(fixture('US12345678B2', '<meta itemprop="publicationNumber" content="US87654321B2">'), 'US12345678B2'), null);
  assert.equal(parse(fixture().replace('patents.google.com', 'evil.test'), 'US12345678B2'), null);
  assert.equal(parse(fixture('US12345678B1'), 'US12345678B2'), null);
});

test('sparse verified HTML preserves unknown fields and partial quality', () => {
  const patent = parse(fixture(), 'US12345678B2');
  assert.equal(patent.title, 'Optical & sensor system');
  assert.deepEqual(patent.claims, []);
  assert.deepEqual(patent.cpc, []);
  assert.deepEqual(patent.inventors, []);
  assert.deepEqual(patent.assignees, []);
  assert.equal(patent.abstract, '');
  assert.equal(patent.filingDate, undefined);
  assert.equal(patent.grantDate, undefined);
  assert.equal(patent.importQuality, 'PARTIAL');
});

test('nested claim text is retained once, with no synthetic claims', () => {
  const patent = parse(fixture('US12345678B2', `
    <div class="claim-text">1. A sensor comprising:<div class="claim-text">an optical receiver;</div>and a processor.</div>
    <div class="claim-text">2. The sensor of claim 1 with a lens.</div>
    <div class="claim-text">unnumbered fragment</div>`), 'US12345678B2');
  assert.equal(patent.claims.length, 2);
  assert.equal(patent.claims[0].text, '1. A sensor comprising: an optical receiver; and a processor.');
});

test('source dates retain their distinct meanings; generic dates and codes are not guessed', () => {
  const patent = parse(fixture('US12345678B2', `
    <meta itemprop="filingDate" content="2020-02-01">
    <meta itemprop="publicationDate" content="2022-03-01">
    <meta name="DC.date" content="1999-01-01">
    <meta itemprop="Code" content="G06F 17/00">`), 'US12345678B2');
  assert.equal(patent.filingDate, '2020-02-01');
  assert.equal(patent.publicationDate, '2022-03-01');
  assert.equal(patent.priorityDate, undefined);
  assert.equal(patent.grantDate, undefined);
  assert.deepEqual(patent.cpc, []);
});

test('publication formatting, Indian identifiers, and absent kind codes retain identity', () => {
  assert.equal(normalize.normalizePatentNumber('US2025/0292675A1').normalizedInput, 'US20250292675A1');
  assert.equal(normalize.normalizePatentNumber('IN202241012345A').normalizedInput, 'IN202241012345A');
  assert.equal(normalize.normalizePatentNumber('12345678').normalizedInput, 'US12345678');
  assert.equal(route('US2025/0292675A1'), true);
  assert.equal(route('IN202241012345A'), true);
  assert.equal(route('sensor 12345678 broken'), false);
  assert.throws(() => normalize.normalizePatentNumber('US12345678anything'));
  assert.equal(normalize.validatePatentIdentity('US12345678', 'US12345678B1'), true);
  assert.throws(() => normalize.validatePatentIdentity('US12345678B2', 'US12345678B1'));
});

test('paper search retains DOI and authors and never manufactures patent fields', async () => {
  globalThis.fetch = async url => String(url).includes('openalex.org') ? json({ results: [{
    id: 'https://openalex.org/W1234567', display_name: 'Quuxphoton retrieval',
    publication_year: 2020, publication_date: '2020-05-01', doi: 'https://doi.org/10.1234/example',
    authorships: [{ author: { display_name: 'Research Author' } }],
    primary_location: { source: { display_name: 'Research Journal' } }, type: 'article'
  }] }) : json({ patents: [], data: [], message: { items: [] } });
  const result = await search('quuxphoton');
  assert.equal(result.patents.length, 0);
  assert.equal(result.papers.length, 1);
  assert.equal(result.papers[0].doi, '10.1234/example');
  assert.deepEqual(result.papers[0].authors, ['Research Author']);
  for (const field of ['patentNumber', 'claimsCount', 'cpcClass', 'priorityDate', 'similarityScore']) {
    assert.equal(field in result.papers[0], false);
  }
});

test('identifier search imports sparse source data without downstream fabrication or academic calls', async () => {
  const calls = [];
  globalThis.fetch = async url => {
    calls.push(String(url));
    assert.ok(String(url).startsWith('/api/patents/resolve'));
    return json({ success: true, documentType: 'PATENT', patent: parse(fixture(), 'US12345678B2') });
  };
  const result = await search('US12345678B2');
  assert.equal(result.papers.length, 0);
  assert.equal(result.patents.length, 1);
  assert.equal(calls.length, 1);
  assert.equal(result.patents[0].claimsCount, 0);
  assert.equal(result.patents[0].cpcClass, '');
  assert.equal(result.patents[0].publicationDate, '');
  const saved = store.findPatent('US12345678B2');
  assert.deepEqual(saved.claims, []);
  assert.deepEqual(saved.cpcCodes, []);
  assert.equal(saved.importQuality, 'PARTIAL');
  assert.equal(saved.source, 'Google Patents');
  // A second lookup must retain incompleteness when served from cache.
  const cached = await api.fetchPatentByNumberWithProgressState('US12345678B2');
  assert.equal(cached.patent.importQuality, 'PARTIAL');
  assert.equal(cached.patent.applicationNumber, undefined);
});

test('failed patent identifier lookups cannot fall back to academic sources', async () => {
  const calls = [];
  globalThis.fetch = async url => { calls.push(String(url)); return new Response('', { status: 404 }); };
  const result = await search('US2025/0292675A1');
  assert.deepEqual(result.patents, []);
  assert.deepEqual(result.papers, []);
  assert.ok(result.warnings.length > 0);
  assert.ok(calls.length > 0);
  assert.equal(calls.some(url => /openalex|crossref|semanticscholar/.test(url)), false);
});

test('PatentsView skips missing IDs and retains absent kind, priority, classification and claims', async () => {
  globalThis.fetch = async () => json({ patents: [
    { patent_title: 'Quuxpatent missing identifier' },
    { patent_number: '12349999', patent_title: 'Quuxpatent sensor', patent_date: '2020-01-01' }
  ] });
  const results = await api.searchLiveUsptoPatents('quuxpatent');
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'US12349999');
  assert.equal(results[0].claimsCount, 0);
  assert.equal(results[0].priorityDate, '');
  assert.equal(results[0].cpcClass, '');
  assert.equal(results[0].similarityScore, undefined);
});

test('empty query makes no external requests', async () => {
  globalThis.fetch = () => { throw new Error('Unexpected network request'); };
  assert.deepEqual(await search(' '), { patents: [], papers: [] });
});

test('missing elements are unassessed, not synthetic 80% risk', () => {
  const result = risk('US12345678B2');
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.totalElementsCount, 0);
  assert.equal(result.exactCoveragePercent, null);
  assert.equal(result.overallInvalidityScore, null);
});

test('zero matches remain zero; percentages stay bounded across match distributions', () => {
  for (let n = 1; n <= 15; n++) for (let exact = 0; exact <= n; exact++) {
    const elements = Array.from({ length: n }, (_, i) => ({ elementId: String(i), text: 'Element',
      matchType: i < exact ? 'exact' : i % 2 ? 'partial' : 'missing' }));
    const result = risk('US12345678B2', elements);
    assert.equal(result.exactMatchesCount, exact);
    assert.equal(result.exactCoveragePercent, Math.round(exact / n * 100));
    assert.ok(result.combinedCoveragePercent >= 0 && result.combinedCoveragePercent <= 100);
    assert.equal(result.sec102RiskScore, null);
    assert.equal(result.sec103RiskScore, null);
  }
  assert.equal(risk('id', [{ elementId: 'e1', text: 'Element', matchType: 'missing' }]).exactCoveragePercent, 0);
});

test('duplicate assessments do not inflate counts and conflicting or invalid inputs are unassessed', () => {
  const element = { elementId: 'e1', text: 'Element', matchType: 'exact' };
  assert.equal(risk('id', [element, element]).totalElementsCount, 1);
  assert.equal(risk('id', [element, { ...element, matchType: 'missing' }]).status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(risk('id', [{ ...element, matchType: 'invented' }]).status, 'INSUFFICIENT_EVIDENCE');
});

test('invalidity UI renders honest empty and coverage states without fabricated citations or export success', () => {
  const empty = renderToStaticMarkup(React.createElement(Modal, { isOpen: true, onClose() {}, patentNumber: 'US12345678B2' }));
  assert.match(empty, /Legal risk: Not assessed/);
  assert.doesNotMatch(empty, /80%|96%|10,482,391|Official Invalidity PDF/);
  const coverage = renderToStaticMarkup(React.createElement(Modal, { isOpen: true, onClose() {}, claimElements: [
    { elementId: 'e1', text: 'Element', matchType: 'missing' }
  ] }));
  assert.match(coverage, /0 \/ 1 \(0%\)/);
  assert.match(coverage, /Legal risk: Not assessed/);
});

test('academic metadata does not invent a year, author, venue, abstract or DOI', async () => {
  globalThis.fetch = async url => {
    if (String(url).includes('openalex.org')) return json({ results: [{ id: 'https://openalex.org/W7654321', display_name: 'Quuxsparse study' }] });
    if (String(url).includes('semanticscholar')) return json({ data: [{ paperId: 'paper123', title: 'Quuxsparse alternate', externalIds: { ArXiv: '2401.00001' } }] });
    return json({ patents: [], message: { items: [] } });
  };
  const result = await search('quuxsparse');
  assert.equal(result.papers.length, 2);
  for (const paper of result.papers) {
    assert.equal(paper.year, '');
    assert.equal(paper.venue, '');
    assert.deepEqual(paper.authors, []);
    assert.equal(paper.doi, '');
  }
  assert.equal(result.papers.find(p => p.source === 'OpenAlex').abstract, '');
});

test('real dev middleware rejects bad pages and returns partial source records', async () => {
  const { get } = await import('node:http');
  const dev = await createServer({ server: { host: '127.0.0.1', port: 0, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] } });
  let html = fixture();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(html); };
  try {
    await dev.listen();
    const port = dev.httpServer.address().port;
    const request = path => new Promise((resolve, reject) => {
      get(`http://127.0.0.1:${port}${path}`, res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
      }).on('error', reject);
    });
    for (const path of ['/api/patents/resolve', '/api/patents/resolve?identifier=arbitrary1234567text']) {
      const result = await request(path);
      assert.equal(result.status, 400);
      assert.equal(result.body.errorCode, 'INVALID_IDENTIFIER');
    }
    assert.equal(calls, 0);
    const valid = await request('/api/patents/resolve?identifier=US12345678B2');
    assert.equal(valid.status, 200);
    assert.equal(valid.body.patent.importQuality, 'PARTIAL');
    assert.deepEqual(valid.body.patent.claims, []);
    for (const badHtml of ['<title>Access denied</title>', fixture('US87654321B2')]) {
      html = badHtml;
      const bad = await request('/api/patents/resolve?identifier=US12345678B2');
      assert.equal(bad.status, 502);
      assert.equal(bad.body.success, false);
    }
  } finally { await dev.close(); }
});

test('an unspecified kind resolves to the actual source kind without changing the document number', async () => {
  globalThis.fetch = async () => json({ success: true, documentType: 'PATENT',
    patent: parse(fixture('US12347777B1'), 'US12347777') });
  const result = await api.fetchPatentByNumberWithProgressState('12347777');
  assert.equal(result.success, true);
  assert.equal(result.patent.publicationNumber, 'US12347777B1');
  assert.equal(result.patent.kindCode, 'B1');
});

test('a backend identity mismatch is rejected before workspace storage', async () => {
  globalThis.fetch = async () => json({ success: true, documentType: 'PATENT',
    patent: parse(fixture('US12346666B1'), 'US12346666B1') });
  const result = await api.fetchPatentByNumberWithProgressState('US12346666B2');
  assert.equal(result.success, false);
  assert.equal(store.findPatent('US12346666B1'), undefined);
  assert.equal(store.findPatent('US12346666B2'), undefined);
});

test('workspaceStore computes dynamic portfolio metrics without synthetic scores', () => {
  store.resetToDefault();
  const metrics = store.getMetrics();
  assert.ok(metrics.totalPatents >= 3);
  assert.ok(metrics.totalClaims > 0);
  assert.ok(metrics.totalElements > 0);
  assert.equal(metrics.independentClaims + metrics.dependentClaims, metrics.totalClaims);
  assert.ok(Array.isArray(metrics.cpcDistribution));
  assert.ok(metrics.cpcDistribution.length > 0);
  assert.ok(metrics.cpcDistribution.some(c => c.code === 'G08G'));
  assert.ok(typeof metrics.avgClaimsPerPatent === 'number');
  assert.ok(typeof metrics.avgElementsPerClaim === 'number');

  const initialPatents = store.getPatents();
  store.setActivePatent(initialPatents[1].id);
  assert.equal(store.getActivePatent()?.id, initialPatents[1].id);
});
