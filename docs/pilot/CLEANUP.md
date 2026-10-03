# Conservative repository cleanup — 3 October 2026

Before cleanup, SHA-256 hashes were recorded for all 134 Markdown/Word files found recursively outside Git internals, including ignored scratch and dependency documents. Every inventoried file was checked byte-for-byte after cleanup, before the intentional acceptance/design updates. Local inventory: scratch/cleanup-document-inventory.json (ignored).

Removed eight generated root logs: auth-lint.log, auth-regressions.log, auth-tests.log, continuation-lint.log, continuation-tests.log, module-audit-lint.log, module-audit-tests.log, phase2-tests.log. Removed unreferenced starter graphics src/assets/react.svg and src/assets/vite.svg after repository reference search. Removed scratch/fix-pilot.py and scratch/fix-pilot.mjs, obsolete duplicate one-time patch scripts whose changes already exist in committed implementation.

Retained all Markdown/Word documents, document figures, presentations, datasets, training scripts, code, tests, configurations, dependencies, databases, uploads, QA launchers, screenshots, verification logs and source snapshots. Other scratch files remain because their disposability was not established. No blanket directory deletion, database reset or Git-history rewrite occurred. The unrelated vite.config.ts change remains excluded.

The former provider client is retained as research/legacy-llmService.ts, outside the application import graph. It is an archived experiment, not an enabled integration. The release client has no provider-network calls or frontend environment-key access.
