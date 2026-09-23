# Timeline review — updated 23 September 2026

The Timeline changes remove fixed patent fixtures and build the date network and claim matrix from workspace records. This review also corrected claims that date order or word overlap establishes legal eligibility or novelty.

- Candidate chronology uses valid publication dates against the target filing date. Missing publication dates stay unassessed; filing and grant dates do not stand in for publication.
- Graph edges express date/classification comparisons only, not citations or patent-family relationships. Removed the unsupported claim that examiner citation ledgers are parsed.
- The coverage matrix reuses Mapping/Evidence rules. Partial overlap and sample records cannot count as earlier literal matches. No absence-of-novelty or proof-of-novelty conclusion is generated.
- Invalid selected claims produce an empty matrix. Duplicate/self candidates are excluded. All compared candidates are shown instead of hiding columns used by summary counts.
- Timeline-to-Mapping navigation preserves the selected document pair. Sample records are labeled in the date cards.

Validation: 67 automated tests pass across five suites, including 10 Timeline tests. Added checks for missing publication dates, shared comparison semantics, invalid claim selection, samples/partial matches and honest graph descriptions. TypeScript, production build and lint are checked for the published snapshot. Lint and bundle-size warnings remain. Interactive browser and download verification for Mapping/Timeline remain outstanding.

Limitations: comparisons are lexical review aids, not semantic or legal determinations. Parent claim expansion, actual citation/family imports, production API hosting, successful live patent retrieval and later audit modules remain unresolved. The separate IPv4 API fallback edit in vite.config.ts was not included in this reviewed checkpoint; it needs bounded redirect/response handling and dedicated verification before publication.
