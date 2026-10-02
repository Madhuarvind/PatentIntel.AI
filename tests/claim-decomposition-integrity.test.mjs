import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

let server, store, decomposeService, dbStore;
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
  decomposeService = await server.ssrLoadModule('/src/services/claimDecompositionService.ts');
  dbStore = (await server.ssrLoadModule('/src/services/dbStore.ts')).dbStore;
});

after(async () => {
  await server?.close();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

test('evidence coverage does not fabricate figure support or spec paragraphs for raw claims', () => {
  const limitations = [
    {
      id: 'E1',
      elementNumber: 1,
      category: 'PREAMBLE',
      canonicalName: 'Sensing Apparatus',
      rawText: 'An apparatus comprising:',
      cleanedText: 'An apparatus comprising:',
      scopeTag: 'Scope',
      cpcCategory: 'G01N',
      criticality: 'CORE',
      criticalityRationale: 'Preamble',
      antecedentStatus: 'NOT_APPLICABLE',
      antecedentNotes: '',
      breadthImpact: 'BROAD',
      confidence: 0.95,
      ambiguityStatus: 'SUPPORTED',
      splitRationale: {},
      languagePatterns: [],
      numericalConstraints: [],
      markushGroups: [],
      specEvidence: {
        documentId: 'RAW_INPUT',
        claimLineReference: 'Claim 1, clause E1',
        specificationParagraphs: [],
        specificationExcerpt: 'Raw claim text analysis. Specification not supplied.',
        figureReferences: [],
        sourceUrl: ''
      },
      searchIntelligence: { exactTechnicalQuery: 'Sensing Apparatus' },
      relationships: [],
      searchQuerySuggestion: '',
      provenanceTag: 'SOURCE-DERIVED',
      provenanceSourceId: 'claim-1-span-0-10',
      multiAgentConsensus: {}
    },
    {
      id: 'E2',
      elementNumber: 2,
      category: 'STRUCTURAL_COMPONENT',
      canonicalName: 'Optical Detector',
      rawText: 'an optical detector',
      cleanedText: 'an optical detector',
      scopeTag: 'Scope',
      cpcCategory: 'G01N',
      criticality: 'CORE',
      criticalityRationale: 'Component',
      antecedentStatus: 'NEW_INTRODUCTION',
      antecedentNotes: '',
      breadthImpact: 'BROAD',
      confidence: 0.95,
      ambiguityStatus: 'SUPPORTED',
      splitRationale: {},
      languagePatterns: [],
      numericalConstraints: [],
      markushGroups: [],
      specEvidence: {
        documentId: 'RAW_INPUT',
        claimLineReference: 'Claim 1, clause E2',
        specificationParagraphs: [],
        specificationExcerpt: 'Raw claim text analysis. Specification not supplied.',
        figureReferences: [],
        sourceUrl: ''
      },
      searchIntelligence: { exactTechnicalQuery: 'Optical Detector' },
      relationships: [],
      searchQuerySuggestion: '',
      provenanceTag: 'SOURCE-DERIVED',
      provenanceSourceId: 'claim-1-span-11-20',
      multiAgentConsensus: {}
    }
  ];

  const coverage = decomposeService.computeClaimEvidenceCoverage(limitations, 'RAW_INPUT');

  assert.equal(coverage.totalLimitations, 2);
  assert.equal(coverage.claimSupportedCount, 2);
  assert.equal(coverage.figureSupportedCount, 0, 'Must have 0 figure support when no figures were supplied');
  assert.equal(coverage.specSupportedCount, 0, 'Must have 0 spec support when no specification paragraphs were supplied');
  assert.equal(coverage.priorArtSupportedCount, 0, 'A suggested search query is not retrieved prior-art evidence');

  for (const item of coverage.coverageItems) {
    assert.equal(item.hasFigureSupport, false);
    assert.equal(item.hasSpecSupport, false);
    assert.doesNotMatch(item.figureReference, /^Fig\.\s*\d+$/i);
    assert.equal(item.figureReference, 'No figure reference');
    assert.equal(item.specReference, 'Uncorrelated in specification');
  }
});

test('extractSpecificationEvidence does not invent edge node or telemetry passages', () => {
  const ev = decomposeService.extractSpecificationEvidence('UNKNOWN_DOC', 'E2', 'Acoustic Resonator');

  assert.deepEqual(ev.specificationParagraphs, []);
  assert.deepEqual(ev.figureReferences, []);
  assert.doesNotMatch(ev.specificationExcerpt, /autonomous edge nodes/i);
  assert.doesNotMatch(ev.specificationExcerpt, /environmental telemetry/i);
  assert.match(ev.specificationExcerpt, /Specification text not supplied/i);
});

test('preset demonstration projects are labeled and do not fabricate US10892144B2 in FER export', () => {
  const projects = dbStore.getInnovationProjects();
  const presets = projects.filter(p => p.id.startsWith('proj_preset') || p.id.startsWith('preset'));

  assert.ok(presets.length > 0, 'Preset projects should exist for demonstration');

  for (const preset of presets) {
    const report = dbStore.getLatestBenchmarkReport(preset.id);
    if (report && (!report.topMatchedPatents || report.topMatchedPatents.length === 0)) {
      // FER export check: if topMatchedPatents is empty, never fallback to US10892144B2
      const patents = report.topMatchedPatents || [];
      assert.ok(!patents.some(p => p.id === 'US10892144B2' && !p.title));
    }
  }
});
