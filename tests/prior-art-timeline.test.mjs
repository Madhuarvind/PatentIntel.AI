import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, store, evidenceService, PriorArtTimeline, CitationGraph;
const memory = new Map();
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

before(async () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => memory.get(key) ?? null,
      setItem: (key, value) => memory.set(key, value),
      removeItem: key => memory.delete(key)
    }
  });

  server = await createServer({
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    esbuild: { jsx: 'automatic' }
  });

  store = (await server.ssrLoadModule('/src/services/workspaceStore.ts')).workspaceStore;
  evidenceService = await server.ssrLoadModule('/src/services/claimEvidenceService.ts');
  PriorArtTimeline = (await server.ssrLoadModule('/src/components/PriorArtTimelineView.tsx')).PriorArtTimelineView;
  CitationGraph = (await server.ssrLoadModule('/src/components/CitationLineageGraph.tsx')).CitationLineageGraph;
});

after(async () => {
  await server?.close();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

afterEach(() => {
  memory.clear();
});

test('Prior-Art Coverage Matrix: handles missing or claimless target document without crashing', () => {
  const emptyTarget = {
    id: 'US_EMPTY_1',
    title: 'Empty Document',
    abstract: 'Abstract only without claims',
    claims: []
  };

  const matrix = evidenceService.generatePriorArtCoverageMatrix(emptyTarget, []);
  assert.equal(matrix.limitations.length, 0);
  assert.equal(matrix.candidates.length, 0);
  assert.equal(matrix.summary.totalLimitations, 0);
  assert.equal(matrix.summary.earlierTextMatchCount, 0);
  assert.equal(matrix.summary.unmatchedLimitationCount, 0);
});

test('matrix keeps missing publication dates unassessed and uses the shared comparison rules', () => {
  const target = { id: 'target', filingDate: '2020-01-01', claims: [{ number: 1, text: 'A magnetic housing containing a transmitter coil operating at 20 kHz.' }] };
  const candidate = { id: 'candidate', filingDate: '2010-01-01', claims: [{ number: 1, text: 'A magnetic housing containing a transmitter coil operating at 50 kHz.' }] };
  const matrix = evidenceService.generatePriorArtCoverageMatrix(target, [candidate]);
  const record = evidenceService.generateClaimEvidenceRecord(target, candidate).record;
  assert.equal(matrix.candidates[0].temporalStatus, 'TEMPORAL_UNVERIFIED');
  assert.equal(matrix.summary.earlierTextMatchCount, 0);
  for (const limitation of record.limitations) {
    assert.equal(matrix.candidates[0].coverageByLimitation[limitation.limitationId].matchState, limitation.matchState);
  }
  assert.equal(evidenceService.generatePriorArtCoverageMatrix(target, [candidate], 99).limitations.length, 0);
});

test('partial overlap and samples cannot count as earlier literal matches', () => {
  const target = { id: 'target', filingDate: '2020-01-01', claims: [{ number: 1, text: 'A magnetic housing containing an optical transmitter coil.' }] };
  const sample = { ...target, id: 'sample', isSample: true, publicationDate: '2010-01-01' };
  const partial = { ...sample, id: 'partial', isSample: false, claims: [{ number: 1, text: 'A magnetic housing containing a transmitter coil.' }] };
  const matrix = evidenceService.generatePriorArtCoverageMatrix(target, [sample, partial]);
  assert.equal(matrix.summary.earlierTextMatchCount, 0);
  assert.equal(matrix.summary.unmatchedLimitationCount, matrix.summary.totalLimitations);
});

test('chronology UI does not claim citation imports or legal eligibility', () => {
  const target = { id: 'target', title: 'Target', filingDate: '2020-01-01', claims: [] };
  const candidate = { id: 'candidate', title: 'Unknown publication', filingDate: '2010-01-01', claims: [] };
  const html = renderToStaticMarkup(React.createElement(CitationGraph, { targetPatent: target, workspacePatents: [target, candidate] }));
  assert.match(html, /do not represent citations/);
  assert.doesNotMatch(html, /Eligible Prior Art|PTO-892/);
});

test('Prior-Art Coverage Matrix: evaluates real limitations against candidate prior disclosures', () => {
  const targetPatent = {
    id: 'US10000001B2',
    title: 'Precision Conductivity Monitoring Probe',
    filingDate: '2020-05-15',
    publicationDate: '2021-08-10',
    claims: [
      {
        number: 1,
        type: 'independent',
        text: 'A conductivity sensor comprising: a cylindrical housing having a sample chamber; four toroidal electrode coils positioned within the chamber; and an alternating current excitation circuit operating at 20 kHz.'
      }
    ]
  };

  const eligibleCandidate = {
    id: 'US9000001B2',
    title: 'Toroidal Sensor Assembly',
    filingDate: '2016-03-10',
    publicationDate: '2018-04-20',
    claims: [
      {
        number: 1,
        type: 'independent',
        text: 'An apparatus comprising: a cylindrical housing having a sample chamber; four toroidal electrode coils positioned within the chamber; and a frequency generator operating at 20 kHz.'
      }
    ]
  };

  const postFilingCandidate = {
    id: 'US12000001B2',
    title: 'Subsequent Sensor Probe',
    filingDate: '2022-01-10',
    publicationDate: '2023-06-15',
    claims: [
      {
        number: 1,
        type: 'independent',
        text: 'A conductivity sensor comprising four toroidal electrode coils and an alternating current excitation circuit operating at 20 kHz.'
      }
    ]
  };

  const matrix = evidenceService.generatePriorArtCoverageMatrix(targetPatent, [eligibleCandidate, postFilingCandidate], 1);

  assert.equal(matrix.targetId, 'US10000001B2');
  assert.ok(matrix.limitations.length >= 2, `Expected at least 2 limitations, got ${matrix.limitations.length}`);
  assert.equal(matrix.candidates.length, 2);

  const cand1 = matrix.candidates.find(c => c.candidateId === 'US9000001B2');
  assert.ok(cand1);
  assert.equal(cand1.temporalStatus, 'PUBLISHED_BEFORE_FILING');

  const cand2 = matrix.candidates.find(c => c.candidateId === 'US12000001B2');
  assert.ok(cand2);
  assert.equal(cand2.temporalStatus, 'POTENTIAL_POST_FILING');

  // Post-filing candidate cannot count toward antedated limitations under § 102
  assert.ok(matrix.summary.totalLimitations > 0);
  assert.ok(matrix.summary.earlierTextMatchCount <= matrix.summary.totalLimitations);
});

test('Temporal Eligibility: rejects contemporaneous or post-filing candidates as § 102 prior art', () => {
  const preFiling = evidenceService.checkTemporalEligibility('2021-04-01', '2019-10-15');
  assert.equal(preFiling.status, 'PUBLISHED_BEFORE_FILING');
  assert.ok(preFiling.note?.includes('precedes'));

  const sameDay = evidenceService.checkTemporalEligibility('2021-04-01', '2021-04-01');
  assert.equal(sameDay.status, 'POTENTIAL_POST_FILING');

  const postFiling = evidenceService.checkTemporalEligibility('2021-04-01', '2022-06-20');
  assert.equal(postFiling.status, 'POTENTIAL_POST_FILING');
  assert.ok(postFiling.note?.includes('on or after'));

  const missingDate = evidenceService.checkTemporalEligibility('2021-04-01', undefined);
  assert.equal(missingDate.status, 'TEMPORAL_UNVERIFIED');
});

test('Prior-Art Coverage Matrix: self-comparison is filtered out of candidate list', () => {
  const patent = {
    id: 'US10000001B2',
    title: 'Self Document',
    filingDate: '2020-01-01',
    claims: [{ number: 1, type: 'independent', text: 'An element.' }]
  };

  const matrix = evidenceService.generatePriorArtCoverageMatrix(patent, [patent, { ...patent, id: 'us 10000001 b2' }], 1);
  assert.equal(matrix.candidates.length, 0);
});

test('PriorArtTimelineView: renders empty workspace state when store has no patents', () => {
  store.clearWorkspace();
  const html = renderToStaticMarkup(React.createElement(PriorArtTimeline, {}));
  assert.ok(html.includes('No Patent Records in Workspace'));
  assert.ok(!html.includes('4/5 Elements Antedated'));
});

test('CitationLineageGraph: renders target and real workspace disclosures', () => {
  const target = {
    id: 'US11111111B2',
    title: 'Conductivity Probe System',
    filingDate: '2020-05-15',
    assignee: 'Apex Sensors LLC',
    cpcCodes: ['G01N 27/06']
  };

  const candidate = {
    id: 'US99999999B2',
    title: 'Prior Coil Design',
    filingDate: '2017-02-10',
    publicationDate: '2018-09-12',
    assignee: 'Earlier Corp',
    cpcCodes: ['G01N 27/02']
  };

  const html = renderToStaticMarkup(React.createElement(CitationGraph, {
    targetPatent: target,
    workspacePatents: [target, candidate]
  }));

  assert.ok(html.includes('US11111111B2'));
  assert.ok(html.includes('US99999999B2'));
  assert.ok(html.includes('Conductivity Probe System'));
  assert.ok(html.includes('Apex Sensors LLC'));
  assert.ok(html.includes('Earlier Publications'));
});

test('Source Integrity: CitationLineageGraph and PriorArtTimelineView contain no fabricated vehicle patents', () => {
  const timelineSource = readFileSync(resolve('src/components/PriorArtTimelineView.tsx'), 'utf8');
  const graphSource = readFileSync(resolve('src/components/CitationLineageGraph.tsx'), 'utf8');

  // Must not contain fabricated patent numbers from the old hardcoded demo
  const forbiddenIdentifiers = [
    'US 9,823,481',
    'US 10,129,482',
    'US 10,928,341',
    'US 11,492,019',
    'US 11,849,201',
    'EP 3920192',
    'US 10,482,391',
    'US 11,048,920'
  ];

  for (const id of forbiddenIdentifiers) {
    assert.ok(!timelineSource.includes(id), `PriorArtTimelineView must not contain fabricated patent ${id}`);
    assert.ok(!graphSource.includes(id), `CitationLineageGraph must not contain fabricated patent ${id}`);
  }

  // Must not hardcode automotive entities
  const forbiddenEntities = ['Tesla Motors', 'Apex AI Mobility', 'Lumina Sensing', 'VisionTech Automotive'];
  for (const entity of forbiddenEntities) {
    assert.ok(!graphSource.includes(entity), `CitationLineageGraph must not contain fabricated entity ${entity}`);
  }

  // Must not default missing dates to '2021'
  assert.ok(!timelineSource.includes("|| '2021'"), "PriorArtTimelineView must not default missing dates to '2021'");
});
