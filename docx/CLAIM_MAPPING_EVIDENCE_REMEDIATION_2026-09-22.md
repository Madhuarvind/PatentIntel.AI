# Claim Mapping and Evidence review — 22 September 2026

The existing draft mapping implementation was reviewed and hardened together with the earlier Workspace/Search remediation. The changes are intended for the existing feature branch and PR #9.

## Changes

- Mapping and Evidence share a record model with document IDs, selected claim scope, source labels, retrieval timestamps/URLs when stored, excerpts, comparison method and date context.
- Reject self-comparison, absent claims and invalid selected claim numbers. Selection no longer silently falls back to another claim. Selected claim numbers persist across Mapping-to-Evidence navigation.
- Removed preset scores and score floors. Whole-token lexical overlap is partial evidence only. The internal SUPPORTED state now requires literal limitation text; the UI calls it a literal text match and expressly requires technical review. Samples cannot receive that state.
- Missing numeric constraints now flag a discrepancy even when another parameter matches. Negation checks remain a coarse lexical heuristic, not proof of contradiction.
- Candidate excerpts include offsets into the original claim. Target offsets are present only when the parser output exists verbatim in the target claim.
- Temporal comparison requires a valid full publication date. Filing/grant dates do not substitute for publication dates. Earlier publication is only date order, not verified legal eligibility; same-day publication does not count as earlier.
- Missing documents, changed document identities, edited claims and changed comparison dates invalidate stored evidence. UI comparisons recompute when workspace documents change.
- Markdown and JSON exports derive from the current comparison record. Markdown clearly identifies draft lexical output and dependent-claim limitations.
- Test servers disable dependency discovery to avoid unnecessary Vite cache writes. The first validation attempt failed because C: was full; generated temporary Vite directories were cleaned. No user datasets were deleted.

## Validation

57 automated tests passed: 20 source-integrity, 8 module-audit, 15 Workspace/Search and 14 Mapping/Evidence tests. This includes static component rendering, invalid selections, missing numeric parameters, exact excerpt offsets, sample handling, comparison-scope persistence and conservative date classification.

TypeScript and production-build validation are run before committing. Oxlint completed with warnings; the production bundle also has a size warning. The current Mapping/Evidence pass has no interactive browser or downloaded-file verification. Earlier Workspace/Search browser results are recorded separately.

## Remaining work

This is a draft lexical review aid, not a semantic entailment or legal-analysis engine. Parent-claim requirements are not expanded; independent multi-reference combinations are not modeled. Numbers, units, relationships and negation require more rigorous interpretation and reviewer confirmation. Unknown provenance remains unknown. Advanced stale detection for all provenance/metadata changes is incomplete.

Live patent retrieval and production API deployment remain unresolved. Timeline, synthesis, innovation/review, authentication and report-generation findings remain in the module audit. The next step is the Timeline module and its date/source model; production readiness requires the remaining acceptance gates, not merely passing these tests.
