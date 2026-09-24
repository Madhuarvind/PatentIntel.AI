# Workspace and Search remediation — 22 September 2026

This follow-up implements stages 1–2 of the module audit. It is a local working-tree change, not a published release. The earlier source-integrity patch was already present in the repository and was not reapplied.

## Implemented

- New workspaces start empty. Loading examples is explicit and preserves imported records. Known bundled records are labeled samples, excluded from source search and excluded from workspace search unless selected.
- Workspace search measures unique query-term coverage across stored identifiers, titles, abstracts, claims, assignees and classifications. No positive score floor or pretend BM25/SBERT controls remain. Results show matched terms and provenance; unrelated queries return no candidates.
- Removed the bundled patent registry from live retrieval. Source outages and invalid source responses remain failures instead of returning example records. Academic and patent collections remain distinct; surviving providers retain their results during partial outages.
- Identifier requests propagate cancellation and timeout to the backend request. Cancelled requests cannot save late results, and leaving the import screen cancels an in-flight request.
- PDF parsing no longer invents claims, dates, identifiers, assignees or classification codes. Claims require an explicit claims section. Unidentified PDFs keep a local file identity; filenames do not establish patent identity. Grant dates are not copied into publication/priority fields. Missing text/OCR and invalid PDFs fail explicitly.
- PDF.js uses a bundled worker, and imported records preserve extracted text and file hashes. Successful source records can replace same-ID samples. Search navigation selects the intended workspace record for mapping.
- Removed misleading registry-sync and hybrid-search labels from the relevant dashboard/sidebar controls. Workspace cards identify samples and actual providers, and the external-source filter includes Google Patents and PatentsView.

## Validation

43 automated tests passed: 20 source-integrity, 8 prior module-remediation, and 15 Workspace/Search regressions. The latter exercise sample opt-in, real replacement of samples, lexical ranking and empty cases, missing metadata, claim-section parsing, date separation, scanned-document rejection, duplicate/remove/undo storage behavior, partial provider failures, and cancellation/timeouts before persistence.

TypeScript compilation and Vite production build passed. Oxlint exited successfully with warnings; this is not a warning-free lint result. Vite reports a large main bundle. `git diff --check` is also part of the final check.

Browser checks on the local development server:

| Scenario | Observed result |
|---|---|
| Default workspace search with existing samples | Samples excluded; zero candidates |
| Enable samples, search `conductivity sensor` | One labeled sample, 2/2 matched terms, 100/100 term coverage |
| Search `quasarbanana` with samples enabled | Zero candidates |
| Live lookup `US10928341B2` | Source unavailable warning, zero patents; no substituted sample |
| Live keyword search `inductive conductivity sensor` | 38 academic papers from OpenAlex/Crossref, zero patents, explicit patent-source and Semantic Scholar warnings |
| Workspace provenance | Sample marked not verified; missing retrieval timestamp and unassessed quality visible |

## Remaining acceptance gates

- A successful live patent import is **not verified**: the source request failed during the browser check. Keyword patent retrieval was also unavailable. The current PatentsView endpoint/integration needs investigation and a working authenticated provider configuration if required.
- The patent proxy is installed by Vite's development server only. A static build does not provide the production API endpoint. Deployable server routing and deployed smoke tests remain necessary.
- PDF regression tests cover extracted text and conversion logic. Actual browser file upload, binary PDF worker extraction, multi-column layout, encrypted/large files, and OCR require end-to-end fixtures. OCR is not implemented.
- Browser checks did not cover all duplicate/remove/undo, reload and rapid-action flows; automated storage/request tests cover part of those cases.
- Existing non-sample records retain their stored content; this phase cannot retroactively certify their provenance. Academic author/DOI-specific error paths need separate verification.
- Mapping scores, evidence scoring, timeline lineage, synthesis, authentication and report content still have issues documented in the original module audit. None are certified by these 43 tests.

## Next phase: claim mapping and evidence

Use a shared evidence record containing source document ID, exact claim text/span, publication date, retrieval provenance and comparison method. Remove preset similarity and risk numbers. Reject self-comparisons and missing-claim inputs. Show supported, partial, unmatched and unassessed states with traceable excerpts; preserve selected-record handoff. Test numbers/negation, dependent claims, missing dates, source failures, stale results after edits and export correspondence before introducing new scoring features.
