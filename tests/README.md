# Source-integrity regression tests

Run with the project's supported Node/Vite environment:

```sh
npm ci
npm test
npm run build
npm run lint
```

The suite uses Node's test runner and Vite's module loader. It needs no external
credentials. Requests to external services are replaced with controlled fixtures;
one test sends actual HTTP requests through the local Vite development middleware.
React server rendering verifies the invalidity modal's output, not browser interaction.

Coverage includes:

- Error pages, missing or mismatched identities, conflicting publication metadata.
- Nested claim text, absent metadata, distinct publication/filing/priority dates.
- Slash-formatted US applications, twelve-digit Indian publications, explicit kind
  mismatches, and source resolution of an unspecified kind code.
- Patent versus academic routing and provider metadata preservation.
- Patent import, workspace persistence, and repeat cache reads.
- Zero matches, missing assessments, duplicate/conflicting elements, and bounded
  descriptive coverage; statutory risk remains unassessed.
- Real development endpoint status codes and JSON output against controlled sources.

## Review boundaries

This is the first patch following the audit at
`cd52e8971c3f822a78f7b54262fd350f912e2b68`. It preserves the React/Vite/localStorage
architecture and uses the existing academic search pipeline. No new runtime
packages or credentials are required.

The HTML parser is deliberately conservative. It requires an explicit source
publication number or a Google Patents canonical URL and a metadata title. It
extracts only numbered outer claim-text blocks and explicit supported metadata.
It leaves fields it cannot reliably extract empty and always labels an HTML
import PARTIAL. This can reduce metadata/claim coverage for unsupported page
layouts. Real, lawfully obtained provider fixtures should be added before
expanding supported layouts; no live extraction-accuracy claim is made here.

The invalidity modal's fixed references, invented probability scores, and export
success alert have been replaced by an unassessed state. Supplied element labels
can produce descriptive coverage only. No current caller supplies verified
reference mappings, so the application currently shows the unassessed state.
The service contract has changed: statutory score fields are null and descriptive
coverage uses separate fields. No legal probabilities or findings are inferred.

Existing local records are retained. This patch neither verifies seeded records
nor retroactively repairs previous fabricated imports. A later provenance and
migration design is needed; do not treat old cached data as verified evidence.

Remaining audit findings include the production resolver deployment gap,
provider authentication/rate-limit/timeout behavior, placeholder BM25/SBERT
ranking, PDF fallback fabrication, unsupported evidence mapping, browser-side
credentials, report HTML injection, and AI accuracy/benchmark gaps. The separate
workspace search tab and downstream claim-mapping views are not validated by
these tests. Live API success, responsive layout, keyboard interaction, and
cross-browser behavior still require testing. A passing build and fixture suite
are not evidence of production readiness or retrieval accuracy.
