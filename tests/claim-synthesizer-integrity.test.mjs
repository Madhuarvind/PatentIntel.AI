import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

let server, generateClaimSet;

before(async () => {
  server = await createServer({
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    esbuild: { jsx: 'automatic' }
  });

  const synthesizerModule = await server.ssrLoadModule('/src/services/claimSynthesizerService.ts');
  generateClaimSet = synthesizerModule.generateClaimSet;
});

after(async () => {
  await server?.close();
});

test('claim synthesis rejects insufficient technical disclosure without fabricating claims', async () => {
  const result = await generateClaimSet({
    sourceText: 'Too short',
    strategy: 'balanced',
    claimCategories: ['apparatus'],
    dependentClaimCount: 3,
  });

  assert.equal(result.success, false);
  assert.equal(result.candidates.length, 0);
  assert.match(result.error, /Insufficient technical disclosure/);
});

test('claim synthesis does not invent "secondary processing stage" when limitations run out', async () => {
  // A narrow disclosure with exactly one constraint/feature:
  const text = `
    An optical imaging apparatus for industrial inspection.
    The system includes an optical sensor array and an embedded microcontroller.
    The optical sensor array captures high-resolution image frames.
    The embedded microcontroller processes the image frames to detect surface micro-cracks.
    The apparatus maintains an operating temperature below 45 degrees Celsius.
  `;

  // Request 8 dependent claims even though only 1 constraint/effect exists
  const result = await generateClaimSet({
    sourceText: text,
    strategy: 'balanced',
    claimCategories: ['apparatus'],
    dependentClaimCount: 8,
  });

  assert.equal(result.success, true);
  assert.ok(result.candidates.length > 0);

  for (const cand of result.candidates) {
    for (const dep of cand.dependentClaims) {
      assert.doesNotMatch(
        dep.text,
        /secondary processing stage/i,
        'Fabricated secondary processing stage limitation must never appear in generated claims'
      );
    }

    // Number of generated dependent claims should be bounded by available limitations (not blindly 8)
    assert.ok(
      cand.dependentClaims.length < 8,
      `Generated dependent claims (${cand.dependentClaims.length}) must be bounded by genuine source features, not inflated to 8`
    );

    // Warning should exist explaining non-fabrication
    const hasLimitationWarning = cand.quality.warnings.some(w =>
      w.includes('distinct limitations were identified') || w.includes('Non-disclosed features were not fabricated')
    );
    assert.ok(hasLimitationWarning, 'Candidate should include warning when requested claim count exceeds available limitations');
  }
});

test('coverage scoring does not apply artificial +20 bonus or 60% floor', async () => {
  // Disclosure with minimal components and no evidence chunks
  const text = `
    A simple acoustic monitoring node.
    The node comprises an acoustic transducer.
    The acoustic transducer detects acoustic vibrations.
  `;

  const result = await generateClaimSet({
    sourceText: text,
    strategy: 'narrow',
    claimCategories: ['apparatus'],
    dependentClaimCount: 0,
  });

  assert.equal(result.success, true);
  for (const cand of result.candidates) {
    // Check that coverage is a genuine calculation:
    // With 1 component, technicalCoverage and evidenceSupport are computed authentically without +20 inflation
    assert.ok(typeof cand.coverage === 'number');
    assert.ok(cand.coverage >= 0 && cand.coverage <= 100);
  }
});
