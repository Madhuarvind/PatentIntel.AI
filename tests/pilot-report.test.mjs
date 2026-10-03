import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
let server, PilotReport;
before(async () => {
  server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom', esbuild: { jsx: 'automatic' } });
  PilotReport = (await server.ssrLoadModule('/src/components/PilotReport.tsx')).PilotReport;
});
after(async () => { await server?.close(); });
test('print view preserves the JSON snapshot version, source locations, missing evidence and dated review history', () => {
  const when = '2026-10-01T05:00:00.000Z';
  const feature = { id: 'F1', text: 'Unmatched optical feature' };
  const report = { schemaVersion: 1, generatedAt: when, title: 'Saved version title', version: { id: 'v1', number: 1, title: 'Saved version title', proposal: 'Exact version one text', features: [feature], created_at: when },
    analysis: { id: 'run1', status: 'COMPLETED', method: 'BM25', created_at: when, results: [{ feature, matches: [], status: 'INSUFFICIENT_EVIDENCE' }], corpus: [{ id: 'source1', title: 'Original paper', kind: 'PAPER', identifier: '10.1234/example', url: 'https://example.test/source', retrieved_at: when, provenance: 'User-supplied', passages: [{ text: 'Unrelated exact source passage', page: 4, section: 'Methods' }] }, { id: 'metadata', title: 'No text', kind: 'PATENT', identifier: 'QA-001', passages: [], provenance: 'Metadata only' }] },
    reviews: [{ id: 'r1', reviewer_id: 'reviewer', reviewer_name: 'QA Reviewer', status: 'NEEDS_REVISION', created_at: when }], comments: [{ id: 'c1', review_id: 'r1', feature_id: 'F1', author_name: 'QA Reviewer', body: 'Explain the difference', created_at: when }], decisions: [{ id: 'd1', review_id: 'r1', decision: 'NEEDS_REVISION', reason: 'Evidence incomplete', created_at: when }], limitations: ['Not a patentability opinion'] };
  const html = renderToStaticMarkup(React.createElement(PilotReport, { report: JSON.parse(JSON.stringify(report)) }));
  for (const value of ['Saved version title', 'Exact version one text', 'Unmatched optical feature', '10.1234/example', 'Unrelated exact source passage', 'Methods', '2026-10-01 05:00:00 UTC', 'No related passage', 'Metadata only', 'Explain the difference', 'Evidence incomplete', 'Not a patentability opinion']) assert.ok(html.includes(value), value);
  assert.match(html, /Page: 4/);
});
