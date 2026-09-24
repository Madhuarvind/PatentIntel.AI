import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, store, evidenceService, ClaimMapping, AIEvidence;
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
    configFile: false, optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    esbuild: { jsx: 'automatic' }
  });

  store = (await server.ssrLoadModule('/src/services/workspaceStore.ts')).workspaceStore;
  evidenceService = await server.ssrLoadModule('/src/services/claimEvidenceService.ts');
  ClaimMapping = (await server.ssrLoadModule('/src/components/ClaimMappingView.tsx')).ClaimMappingView;
  AIEvidence = (await server.ssrLoadModule('/src/components/AIEvidenceView.tsx')).AIEvidenceView;
});

after(async () => {
  await server?.close();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

afterEach(() => {
  memory.clear();
});

const sampleTarget = {
  id: 'US11111111B2',
  title: 'Inductive sensor system',
  filingDate: '2020-05-15',
  issueDate: '2022-01-10',
  cpcCodes: ['G01R 27/02'],
  source: 'USPTO',
  claims: [
    {
      number: 1,
      text: '1. An inductive conductivity sensor comprising: a magnetic housing; and a transmitter coil operating at 20 kHz without an external amplifier.',
      isIndependent: true,
      type: 'independent',
      elements: []
    },
    {
      number: 2,
      text: '2. The inductive conductivity sensor of claim 1, further comprising a temperature compensation circuit.',
      isIndependent: false,
      type: 'dependent',
      elements: []
    }
  ]
};

const samplePriorArt = {
  id: 'US22222222B2',
  title: 'Electromagnetic measurement probe',
  filingDate: '2018-03-10',
  issueDate: '2019-11-20',
  publicationDate: '2019-11-20',
  cpcCodes: ['G01R 27/02'],
  source: 'USPTO',
  abstract: 'An electromagnetic probe with high-frequency oscillator coils.',
  claims: [
    {
      number: 1,
      text: '1. A measurement probe comprising a magnetic housing and a transmitter coil operating at 20 kHz.',
      isIndependent: true,
      type: 'independent',
      elements: []
    }
  ]
};

test('invalid selected claims are rejected rather than silently comparing different claims', () => {
  for (const options of [{ targetClaimNumber: 99 }, { candidateClaimNumber: 99 }]) {
    assert.equal(evidenceService.generateClaimEvidenceRecord(sampleTarget, samplePriorArt, options).success, false);
  }
});

test('missing numeric constraints and same-day or invalid dates cannot imply verified support', () => {
  const target = { ...sampleTarget, claims: [{ number: 1, text: 'A transmitter operating at 20 kHz and 5 V.', elements: [] }] };
  const candidate = { ...samplePriorArt, publicationDate: undefined, claims: [{ number: 1, text: 'A transmitter operating at 20 kHz.', elements: [] }] };
  const result = evidenceService.generateClaimEvidenceRecord(target, candidate);
  assert.equal(result.record.temporalStatus, 'TEMPORAL_UNVERIFIED');
  assert.equal(result.record.supportedCount, 0);
  assert.ok(result.record.limitations.some(l => l.numericalDiscrepancy?.isMismatch));
  assert.equal(evidenceService.checkTemporalEligibility('2020-01-01', '2020-01-01').status, 'POTENTIAL_POST_FILING');
  assert.equal(evidenceService.checkTemporalEligibility('2020-02-30', '2019-01-01').status, 'TEMPORAL_UNVERIFIED');
});

test('excerpts point to exact candidate claim spans and removed documents invalidate evidence', () => {
  const { record } = evidenceService.generateClaimEvidenceRecord(sampleTarget, samplePriorArt);
  assert.ok(record.limitations.some(l => l.candidateSpan));
  for (const lim of record.limitations.filter(l => l.candidateSpan)) {
    const claim = samplePriorArt.claims.find(c => c.number === lim.candidateClaimNumber);
    assert.equal(claim.text.slice(lim.candidateSpan.startOffset, lim.candidateSpan.endOffset), lim.candidateExcerpt);
  }
  assert.equal(evidenceService.isEvidenceRecordStale(record, sampleTarget, undefined), true);
});

test('sample documents never yield supported matches and comparison scope survives handoff', () => {
  const candidate = { ...sampleTarget, id: 'sample-other', isSample: true };
  assert.equal(evidenceService.generateClaimEvidenceRecord(sampleTarget, candidate).record.supportedCount, 0);
  store.setComparisonPair(sampleTarget.id, samplePriorArt.id, 2, 1);
  assert.deepEqual(store.getComparisonPair(), { targetId: sampleTarget.id, candidateId: samplePriorArt.id, targetClaimNumber: 2, candidateClaimNumber: 1 });
});

test('self-comparison is strictly rejected with no fabricated scores', () => {
  const result = evidenceService.generateClaimEvidenceRecord(sampleTarget, sampleTarget);
  assert.equal(result.success, false);
  assert.equal(result.rejectionReason, 'SELF_COMPARISON_REJECTED');
  assert.match(result.error, /Self-comparison rejected/);
  assert.equal(result.record, undefined);
});

test('missing-claim inputs are rejected with explicit reason', () => {
  const noClaimsDoc = { id: 'US33333333B2', title: 'Empty claims', claims: [] };
  const targetResult = evidenceService.generateClaimEvidenceRecord(noClaimsDoc, samplePriorArt);
  assert.equal(targetResult.success, false);
  assert.equal(targetResult.rejectionReason, 'TARGET_MISSING_CLAIMS');

  const candidateResult = evidenceService.generateClaimEvidenceRecord(sampleTarget, noClaimsDoc);
  assert.equal(candidateResult.success, false);
  assert.equal(candidateResult.rejectionReason, 'CANDIDATE_MISSING_CLAIMS');
});

test('numbers and numerical discrepancies are accurately detected and affect match state', () => {
  // Candidate with conflicting frequency (50 kHz vs target 20 kHz)
  const conflictingNumbersPriorArt = {
    id: 'US44444444B2',
    title: 'High-frequency probe',
    filingDate: '2017-01-01',
    publicationDate: '2018-01-01',
    claims: [
      {
        number: 1,
        text: '1. A probe comprising a magnetic housing and a transmitter coil operating at 50 kHz.',
        isIndependent: true,
        elements: []
      }
    ]
  };

  const result = evidenceService.generateClaimEvidenceRecord(sampleTarget, conflictingNumbersPriorArt);
  assert.equal(result.success, true);
  const coilLimitation = result.record.limitations.find(l => l.limitationText.includes('20 kHz') || l.limitationText.includes('transmitter'));
  assert.ok(coilLimitation, 'Coil limitation should be extracted');
  assert.ok(coilLimitation.numericalDiscrepancy.isMismatch, 'Numerical discrepancy should be flagged');
  assert.notEqual(coilLimitation.matchState, 'SUPPORTED', 'Discrepant numerical limitation must not be marked SUPPORTED');
});

test('negation conflict is detected when target excludes an element but prior art includes it', () => {
  const priorArtWithAmplifier = {
    id: 'US55555555B2',
    title: 'Amplified sensor',
    filingDate: '2016-01-01',
    publicationDate: '2017-01-01',
    claims: [
      {
        number: 1,
        text: '1. A sensor comprising a magnetic housing, a transmitter coil operating at 20 kHz, and an external amplifier.',
        isIndependent: true,
        elements: []
      }
    ]
  };

  const result = evidenceService.generateClaimEvidenceRecord(sampleTarget, priorArtWithAmplifier);
  assert.equal(result.success, true);
  const lim = result.record.limitations.find(l => l.limitationText.includes('amplifier'));
  assert.ok(lim);
  assert.ok(lim.negationConflict, 'Negation conflict should be detected');
});

test('dependent claim comparison preserves claim number and parent context', () => {
  const result = evidenceService.generateClaimEvidenceRecord(sampleTarget, samplePriorArt, { targetClaimNumber: 2 });
  assert.equal(result.success, true);
  assert.equal(result.record.targetClaimNumber, 2);
  assert.equal(result.record.targetClaimType, 'dependent');
  assert.equal(result.record.targetParentClaimNumber, 1);
});

test('temporal eligibility flags prior art correctly: eligible, post-filing, or unverified', () => {
  // 1. Candidate published before target filing -> PUBLISHED_BEFORE_FILING
  const eligible = evidenceService.checkTemporalEligibility('2021-06-01', '2019-05-01');
  assert.equal(eligible.status, 'PUBLISHED_BEFORE_FILING');

  // 2. Candidate published after target filing -> POTENTIAL_POST_FILING
  const postFiling = evidenceService.checkTemporalEligibility('2020-01-01', '2023-01-01');
  assert.equal(postFiling.status, 'POTENTIAL_POST_FILING');
  assert.match(postFiling.note, /Legal eligibility is not assessed/);

  // 3. Missing date -> TEMPORAL_UNVERIFIED
  const unverified = evidenceService.checkTemporalEligibility('2021-06-01', undefined);
  assert.equal(unverified.status, 'TEMPORAL_UNVERIFIED');
});

test('stale evidence detection flags modified document claims', () => {
  const result = evidenceService.generateClaimEvidenceRecord(sampleTarget, samplePriorArt);
  assert.equal(result.success, true);

  // Unmodified -> not stale
  assert.equal(evidenceService.isEvidenceRecordStale(result.record, sampleTarget, samplePriorArt), false);

  // Target edited -> stale
  const modifiedTarget = {
    ...sampleTarget,
    claims: [{ number: 1, text: '1. A modified claim text.' }]
  };
  assert.equal(evidenceService.isEvidenceRecordStale(result.record, modifiedTarget, samplePriorArt), true);
});

test('evidence exports correspond 100% to evidence record with no fabricated citations', () => {
  const result = evidenceService.generateClaimEvidenceRecord(sampleTarget, samplePriorArt);
  assert.equal(result.success, true);

  const md = evidenceService.exportClaimEvidenceMarkdown(result.record);
  assert.match(md, new RegExp(sampleTarget.id));
  assert.match(md, new RegExp(samplePriorArt.id));
  assert.match(md, /Element-by-Element Evidence Ledger/);
  assert.doesNotMatch(md, /88\.4%|SBERT Multi-Vector/);

  const jsonStr = evidenceService.exportClaimEvidenceJson(result.record);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.targetDocumentId, sampleTarget.id);
  assert.equal(parsed.candidateDocumentId, samplePriorArt.id);
  assert.equal(parsed.totalLimitations, result.record.totalLimitations);
  assert.equal(parsed.supportedCount, result.record.supportedCount);
});

test('ClaimMappingView renders self-comparison rejection honestly without hardcoded 88.4%', () => {
  const getPatents = store.getPatents;
  const getComparisonPair = store.getComparisonPair;
  try {
    store.getPatents = () => [sampleTarget];
    store.getComparisonPair = () => ({ targetId: sampleTarget.id, candidateId: sampleTarget.id });

    const html = renderToStaticMarkup(React.createElement(ClaimMapping, { onNavigate: () => {} }));
    assert.match(html, /Self-comparison rejected/);
    assert.doesNotMatch(html, /88\.4%/);
    assert.doesNotMatch(html, /4\/5 Elements Matched/);
  } finally {
    store.getPatents = getPatents;
    store.getComparisonPair = getComparisonPair;
  }
});

test('AIEvidenceView renders traceable excerpts and no artificial score floors', () => {
  const getPatents = store.getPatents;
  const getComparisonPair = store.getComparisonPair;
  try {
    store.getPatents = () => [sampleTarget, samplePriorArt];
    store.getComparisonPair = () => ({ targetId: sampleTarget.id, candidateId: samplePriorArt.id });

    const html = renderToStaticMarkup(React.createElement(AIEvidence));
    assert.match(html, /Draft Evidence Ledger/);
    assert.match(html, /Traceable Excerpts/);
    assert.doesNotMatch(html, /Total Infringement Risk/);
    assert.doesNotMatch(html, /88\.4/);
  } finally {
    store.getPatents = getPatents;
    store.getComparisonPair = getComparisonPair;
  }
});
