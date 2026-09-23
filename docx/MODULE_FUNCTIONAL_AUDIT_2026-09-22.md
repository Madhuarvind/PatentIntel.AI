# PatentIntel.AI module audit — 22 September 2026

## Conclusion and scope

The application is a working prototype with substantial functional and evidence-integrity gaps. All 12 sidebar destinations opened in the local browser, but several screens present demonstration data or heuristic calculations as measured analysis. It is not ready to treat its outputs as verified patent assessments.

This pass combined source inspection, browser smoke checks, selected workflow execution, automated regressions, TypeScript compilation, and a production build. It is not exhaustive acceptance certification of every control, language, document format, provider, or review transition. Unexecuted scenarios are explicitly retained below.

Baseline: branch `feature/claim-decomposition-engine`, commit `8a47063`. The earlier source-integrity remediation already exists in commit `cb05b8d`; the attached older patch was not reapplied. No push, PR, or main-branch change was made during this audit.

## Verification results

- 28 automated tests passed: the existing 20 and 8 new module regressions.
- TypeScript compilation and Vite production build passed. The approximately 1.63 MB JavaScript bundle still triggers the build's chunk-size warning.
- Oxlint exited successfully with warnings; this is not a warning-free codebase. Logs are `module-audit-tests.log` and `module-audit-lint.log` in the project root.
- Browser: demo login and all sidebar destinations opened. Workspace details, claim decomposition, mapping, timeline, evidence, benchmark, settings, innovation list, and review queue were inspected.
- Live keyword search displayed 15 Crossref academic records separately from 10 locally sourced patent records. Local patent results explicitly said they were not live verified. This does not validate the truth of the local seed data.
- A fresh `US10000000B2` lookup finished with zero results and an honest no-results/source-unavailable message. Successful live patent retrieval is still unverified.
- Synthesizer's built-in traffic-control example completed and displayed three candidates, six claims per candidate, grounding information, and unsupported-claim warnings.
- Translator failure reproduced with the conductivity-sensor claim: English was detected as German and rewritten into unrelated prose. After the fix, the browser detected English and preserved the original text exactly.
- Translation export now builds TXT/JSON content and invokes a Blob download. The browser displayed “download started,” but the browser automation download event timed out. File payloads are tested; successful delivery to the user's download directory is not certified.
- Paid/provider-authenticated LLM calls, PDF upload/OCR, production hosting, role authorization, and full review lifecycle were not verified end to end.

## Module-by-module findings

| Module | Expected behavior | Evidence and current result | Required next work |
| --- | --- | --- | --- |
| Executive Dashboard | Counts reflect stored records; actions open the selected patent; data provenance is explicit | Browser shows 3 patents and 4 stored claims; existing portfolio regression passes. “Official registries synced” and verification language remain stronger than demonstrated source status. | Test every row's Inspect/Map selection handoff. Derive verification badges from actual source records and timestamps. |
| Patent Workspace | Import IDs/PDFs, preserve identity and unknown metadata, select/filter/remove/undo, recover from cancellation | Library opens and selected claim reaches translator. Existing identity, sparse-record, mismatch, and mocked middleware tests pass. PDF-to-API branch still inserts CPC `G06F 17/00` when absent. Live retrieval did not succeed in the attempted lookup. | Remove remaining PDF-path invented metadata; test real text PDFs, scans, invalid files, duplicates, cancellation, repeated requests, delete/undo and refresh. Bundle the PDF worker instead of relying on an external versioned CDN. |
| Hybrid Search Engine | Relevant ranked results, distinct patent/paper types, controls alter the actual algorithm | Live paper results are separated correctly. Workspace search assigns minimum BM25 60/SBERT 75 scores from substring overlap; empty query gets 0.8 overlap. It supplies invented fallback dates/CPC. `searchMode` does not select a real BM25/SBERT implementation. | Replace workspace ranking with an honestly named lexical scorer or actual measured retrieval; test no-overlap/empty queries, weights, filtering, pagination and selection handoff. Quarantine unverified seed patents. |
| R&D Idea Benchmarker | Proposal → extracted features → evidence → saved version → review submission | List opens with 6 seeded projects and high readiness scores. `dbStore` automatically inserts preset projects/reports/submissions. This pass did not run a new full proposal through review. | Make examples opt-in and visibly labeled; test new/edit/rerun/archive/restore and report invalidation when source text changes. Require source-backed evidence for each overlap. |
| Patent Review Queue | Correct version, reviewer permissions, recorded decisions/comments, recoverable lifecycle | Queue opens with seeded submissions. Persistence is localStorage, not a shared team backend. Auth uses local profile selection without password verification. | Implement server-side identity/roles and version-bound decisions before describing this as a team workflow. Test submit → revise → resubmit → approve and reload. |
| Claim Decomposition | Correct spans, dependency tree, exports, grounded limitations; unknown evidence remains unknown | Claim text, limitations, navigator and source spans render. UI also claims full specification/figure support, consensus, NLI entailment, and named corpus/model runs. `claimDecompositionService.ts` contains heuristic/static evidence and manufactured span fallback positions. | Keep useful text decomposition; separate it from unverified specification/figure/consensus claims. Add adversarial tests for repeated text, absent description, missing drawings, ambiguous dependencies and span bounds. |
| Claim-to-Claim Mapping | Compare selected claims using traceable excerpts; no invented score | Browser shows fixed 88.4% and 4/5 matched. Source cycles `[94,91,88,82,76,70]`, pairs limitations by index, and falls back to fabricated mappings. Only the first claim is compared. | Highest-priority analysis repair: real claim selectors, evidence-backed matches, self-comparison guard, no-data state, explicit matching method. |
| Prior-Art Timeline | Sort real dates; distinguish filing/publication/priority; source-backed family and citation edges | Browser displayed hardcoded vehicle-family data for an ID whose workspace record is a conductivity sensor. Timeline follows array order, defaults missing date to 2021, and labels non-first documents prior disclosures regardless of chronology. Coverage matrix is hardcoded. | Replace graph/matrix with source-backed data or unavailable states; date sorting and temporal eligibility tests; remove fabricated patent relationships. |
| AI Evidence Reasoning | Source-grounded explanation tied to selected patent pair and export | Browser shows 83.9/100 “infringement risk.” Implementation uses keyword overlap plus positive floors, counts claims as elements, replaces zero matches with matches, and uses year gap as citation score. No actual LLM explanation is invoked here. | Replace with a traceable evidence ledger; keep unknowns and zero matches. Bind report exports to that ledger. |
| AI Claim Synthesizer | Draft claims supported by supplied disclosure; warnings constrain quality/readiness | Built-in example runs. Balanced and narrow candidates showed 100% beside two unsupported claims, including an invented “secondary processing stage.” Local fallback produced awkward arrow relationships and omitted the processor from the independent claim. | Prevent unsupported additions; count requested dependents as a maximum when evidence is insufficient; cap readiness when unsupported material remains; test save/edit/regenerate/export/version reload. |
| Evaluation Benchmarks | Compute quality from labeled evaluation runs, not inventory size | **Fixed in this pass:** removed invented precision/recall/MRR/F1, fixed ablation offsets, and the index-generated embedding visualization from this screen. Browser and regression confirm “Not measured” for empty and populated workspaces, alongside actual inventory counts. | Build a versioned evaluation runner with query judgments, ranked result IDs, dataset/model versions and reproducible exports. The old visualizer source still exists but is no longer rendered here. |
| System Settings | Controls persist, affect implemented behavior, and surface save failures | **Fixed in this pass:** disconnected retrieval threshold/vector-index controls disabled and explained; advanced checkboxes disabled and unchecked. Save failure now propagates to a visible error instead of false success. | Provider connectivity test; accurate provider/model labels; validate endpoint configuration; provider-specific key handling. Existing Gemini UI label and requested model disagree. |

## Cross-cutting features

### Translator and translation export

Fixed shared German/English heuristic terms, same-language text preservation, unknown-language fallback, rejection of rule-engine output as translation, and visible translation failure. TXT and JSON export now serialize the active session; unsupported PDF/DOCX choices were removed. Search Similar Patents closes the translator and updates the route to `#/search`.

Remaining: terminology fallback invents “sensor control module”; unrelated classification codes receive verified labels; quality percentages are not calibrated; stored model attribution is hardcoded; batch uses three sample claims; segment regeneration appends a phrase rather than translating again; family-memory behavior needs verification. These are not fixed by the export changes. Previously saved incorrect translations are not migrated or deleted.

### Authentication, global search, reports and deployment

- **Release blocker:** `AuthScreen.handleLoginSubmit` never verifies the password and registers unknown emails automatically. Password reset only changes UI state. The local profile system must be labeled demo-only or replaced with real authentication.
- `Header.tsx` global search updates input state without a submission/navigation action; its Ctrl-K hint has no corresponding handler in that component.
- `reportExporter.ts` and `ReportExportModal.tsx` produce hardcoded examination content and official-report language. A generated file is not evidence that its contents correspond to the selected patent. Do not release these reports as verified analysis.
- `vite.config.ts` installs the patent proxy through `configureServer` only. The built static frontend does not contain that server endpoint; passing a client build does not validate production API deployment.
- `visionAiService.ts` and `patentFamilyAiService.ts` return fixed sample drawing/FTO results. No call sites were found in `src` during this pass; these are unimplemented capabilities, not verified features.
- Browser localStorage is shared on the origin; it is not cloud synchronization or user-isolated team storage. Provider credentials are currently browser-side configuration.
- Sidebar's unconditional “USPTO Open Data & Semantic Scholar Synced” message was replaced with a local-workspace/source-check-on-request description. Other overclaiming labels remain and need a coordinated content audit.

## Recommended next sequence and acceptance gates

1. **Workspace and source truth:** repair PDF defaults, quarantine demo records, show provenance and missing fields, then prove valid/invalid import, duplicate, cancel and recovery cases with captured fixtures.
2. **Search:** test exact-ID and keyword routing, real zero-overlap cases, provider failure vs no matches, actual ranking mode behavior, and correct selected-record handoff.
3. **Decomposition → mapping → evidence → timeline:** use one shared evidence model. Each supported claim needs a source ID, exact excerpt/span, source date and method. Missing evidence must stay unassessed.
4. **Translation and synthesis:** run a curated language/disclosure suite; no unsupported features, preserved numbers/dependencies, visible provider failure, accurate run attribution and draft-only exports.
5. **Innovation and review:** test the full versioned lifecycle with real authorization and storage boundaries. Keep preset examples out of live review metrics.
6. **Benchmarks and production:** introduce labeled evaluation data, provider integration tests, deployed API smoke tests and end-to-end download checks. Only then make measured quality claims.

For each module, acceptance should cover normal input, empty input, malformed input, missing source data, API failure, repeated/rapid actions, reload/persistence, cross-module handoff, and export content. Track those separately from “screen opens.”

## Distinctive improvements worth building

These are proposals, not implemented features:

- **Evidence passport:** every analytical statement opens its exact source excerpt, retrieval time, document version and validation state.
- **Change impact review:** changing a claim or disclosure marks affected mappings, drafts and review decisions stale instead of silently reusing old results.
- **Reviewer disagreement view:** preserve competing mappings and their supporting excerpts rather than hiding uncertainty inside one score.
- **Reproducible comparison runs:** freeze source IDs, query, ranking configuration and human judgments so reviewers can reproduce a result later.

These capabilities make the existing workflow more trustworthy and distinctive. Additional decorative scores, simulated FTO clearance, and inert settings should not be prioritized.

## Re-running verification

Normal setup: `npm test`, `npm run build`, `npm run lint`.

The system npm launcher on this machine points to a missing npm CLI. This audit used the installed bundled Node executable at `C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe` to run `--test tests/source-integrity.test.mjs tests/module-audit.test.mjs`, `node_modules/typescript/bin/tsc -b`, `node_modules/vite/bin/vite.js build`, and `node_modules/oxlint/bin/oxlint` directly. No global runtime installation was changed.
