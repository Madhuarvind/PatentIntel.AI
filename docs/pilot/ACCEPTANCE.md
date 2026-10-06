# Local acceptance results — 2 October 2026

Status: local workflow demonstrated; hosted pilot is not released. Both workspaces are retained at the user's request. The older platform opens by default; Enterprise Review Pilot opens `#/pilot`. Checks below distinguish automated evidence from browser observations.

## Automated verification

Latest local verification on 3 October: **125 tests pass, 0 failures**, TypeScript passes, production build passes. Vite reports a large-bundle warning (about 1.19 MB main JavaScript before gzip); this is a performance follow-up, not a passing performance audit. Tests use disposable databases and synthetic accounts, not user records.

| Area | Evidence | Scope |
|---|---|---|
| Accounts | auth.test.mjs, auth-client.test.mjs, dev.test.mjs | Registration, duplicates, wrong password, cookies, recovery, expiry, logout, restart, invalid responses and delayed session/profile responses |
| Ownership and roles | pilot.test.mjs | Cross-user denial, assigned-version access, self-approval denial, invitations and verification |
| Documents | documents.test.mjs, pilot.test.mjs | Text PDF/TXT, malformed/empty/oversized/duplicate input, scanned PDF and page limits, authorized download |
| Evidence | pilot.test.mjs and legacy integrity suites | Deterministic BM25, zero matches, exact passages, provider failures, distinct source types, no fabricated score floors |
| Review | pilot.test.mjs | Frozen submissions, revision/resubmission, version-bound comments/decisions, concurrent and stale-operation rejection |
| Reports | pilot-report.test.mjs, pilot-navigation.test.mjs, pilot.test.mjs | Source identifiers/dates/locations, missing evidence, dated history, selected-version routes, immutable JSON snapshots |
| Local durability | pilot.test.mjs, auth.test.mjs, dev.test.mjs | Close/reopen, session persistence, interrupted runs, lock exclusion, database plus document backup restored to a separate environment |
| Cloud table protection | pilot.test.mjs | Migration revokes anon/authenticated grants and enables RLS; accidental SELECT grant still returns no rows |

## Browser observations — 1 October 2026

Chrome against isolated local development origin `http://127.0.0.1:5182`, with separate synthetic researcher, reviewer and administrator accounts:

- Created proposal, saved confirmed features, assigned reviewer and submitted version 2.
- Live backend Crossref search returned 8 references. Imported DOI `10.1364/ofs.2018.tue30` as metadata-only academic evidence. Imported an explicitly synthetic patent fixture with page 4 / section location; BM25 matched F1 and reported missing F2 evidence.
- Reviewer opened only submitted versions, started review, commented on F2 and requested revision.
- Researcher saved version 3, ran a new comparison and resubmitted. Reviewer approved for drafting with a recorded reason.
- Created version 4 as an explicitly synthetic rejection fixture and recorded rejection. Reopened version 2 and observed its original revision comment/decision. Selected version 3 and refreshed; its approval and version-specific report remained intact.
- Report displayed confirmed features, source identifiers, dates, locations, metadata-only limitations and dated review decisions.
- Switching between platform and pilot worked. Cancelling the cross-workspace unsaved-change confirmation preserved the draft and URL; accepting allowed navigation.
- Pilot dashboard at 390 px width had no horizontal overflow; navigation menu opened. Report media styles hid the sidebar at mobile width.
- All 12 older module screens rendered. Header search submitted the entered query to the search screen. These are navigation smoke checks, not certification of every older-module feature.

Local screenshot: ignored `scratch/pilot-approved-report.png`. Synthetic QA data is excluded from Git.

## Outstanding checks and limitations

- Saved-PDF pagination/content inspection remains unverified: the native print dialog prevented further control of its tab. API JSON/report-component tests passed, but do not substitute for inspecting a saved PDF.
- On 2 October, restarted the isolated local server and signed in to the persisted researcher account. Invalid-version links displayed an explicit access/unavailable error. Downloaded proposal-v3.json and inspected its selected version, features, passage/page/section, missing F2 evidence, source dates and approval reason against the displayed report; they matched.
- On 2 October, keyboard navigation across all six pilot pages at 320 px showed no horizontal overflow. Proposal, evidence, review and report detail screens also fit. Fixed route-change focus, Escape-to-close navigation with focus return, and low-contrast platform-link styling. Skip-to-content and labelled editor fields were verified. Full assistive-technology audit, interactive outage/retry scenarios and persistence in a different browser engine remain pending.
- Older modules retain browser-local storage and experimental workflows. These records are not isolated by server account. A visible notice directs private proposals and assigned decisions to the pilot. Legacy AI provider credentials and custom-endpoint controls have now been removed; optional generative AI is disabled. Patent lookup now uses a shared authenticated Node handler in development and the deployment server. Academic calls now run through the authenticated server. The remaining PatentsView keyword request is still restricted by production CSP and remains a deployment gate.
- No Render, Supabase or Resend account is configured. Hosted private storage, delivered email, HTTPS, restart/redeployment, restore and rollback have not been verified. No purchases or deployment were performed.

## Release gates

The hosted pilot is complete only after the deployment checklist and two-user hosted journey pass, including exports, email delivery, private uploads, persistence, backup restoration and rollback. Do not infer production readiness from a build or sidebar smoke check.

## Interface follow-up — 2 October

Navigation and report tests pass (3 targeted checks), with browser checks for the focus changes. The previous full-suite baseline remains 110 passing tests. Native saved-PDF inspection still requires a supported print-dialog interaction or an operator-saved PDF; it is not inferred from the report DOM.

## Patent lookup deployment parity — 2 October

Shared `/api/patents/resolve` now runs in the Node deployment server and before legacy Vite middleware during normal development. It requires a session, fixes the upstream host, rejects redirects, bounds response time/size and concurrent lookups, and refuses mismatched source identity. The client reports expired sessions explicitly. Six targeted server/development tests pass; TypeScript and production build pass. A live isolated handler probe returned HTTP 200 for US10000000B2, “Coherent LADAR using intra-pixel quadrature detection”, with 20 parsed claims. This probe used a synthetic authentication adapter; real session middleware ordering is separately covered by the development integration test. It does not certify hosted availability or complete source coverage.

## Academic deployment compatibility — 3 October 2026

Authenticated POST /api/academic/search, /api/academic/authors and /api/academic/author-works are shared by the development and Node deployment servers. Provider hosts are fixed, redirects refused, requests time/size/concurrency bounded, DOI identity checked, and malformed identities rejected. Author publications use their selected provider ID rather than unrelated name-search fallbacks. Provider failures are distinct from empty responses and partial results retain warnings.

Legacy settings no longer accept browser credentials or custom endpoints. Startup strips old provider keys from the legacy settings record when browser storage is writable. Optional generative AI remains disabled; existing experimental local heuristics remain labelled. Original experiment code is archived outside the frontend import graph.

Browser: the built Node application on isolated port 5183 returned 45 papers from OpenAlex/Crossref for the literature modal's default query, with an explicit Semantic Scholar outage warning. Stopping the isolated QA server produced a retryable error; after server replacement/restart the search worked. Signing out in a second tab caused the original tab's retry to show the session-expired message and clear results. Settings displayed disabled AI without credential fields. Screenshots are retained in ignored scratch/academic-live-results.png and scratch/compat-settings.png.

Limitations: no hosted cloud deployment has occurred (pending operator configuration of Render, Supabase, and Resend). Natural 12-hour session expiry and alternative browser-engine testing remain open.

Final checks for this stage: 125/125 tests pass, TypeScript and production build pass. The large-bundle warning remains.

## PatentsView backend compatibility & server migration — 3 October 2026

Authenticated GET `/api/patents/search?query=...` is now routed through the shared Node server (`server/patent-search.mjs`) in both development and production. The direct browser request to `api.patentsview.org` has been retired. The implementation:
- Validates query lengths (1–500 characters) and requires an authenticated session.
- Upstream requests are sent to `https://search.patentsview.org/api/v1/patent/` with `X-Api-Key` kept strictly on the server.
- When `PATENTSVIEW_API_KEY` is unset on the server, returns HTTP 503 `SOURCE_NOT_CONFIGURED` with an honest message directing the user to publication number lookup; no synthetic records are returned.
- Bounded concurrency (max 4), response size (2 MB limit), and timeout (12s).
- All 3 targeted tests in `tests/patent-search.test.mjs` pass.

## Saved report PDF inspection — 3 October 2026

A separate task produced scratch/inspected-report.pdf (SHA-256 afb3f5ed6361572f6de4fd79f4db114fba4020def4a859fe95d8443ece8cbfb3). Independent Poppler rendering and visual inspection confirmed four A4 pages, but did not pass final acceptance: feature/source headings split across pages, and the fixture's match fields use source_id/passage instead of the application's sourceId/text fields, leaving an evidence match blank. The fixture includes invented example reviewer/legal statements and must not be treated as research evidence or a real saved review.

Retained the print visibility/overflow fixes and added heading/evidence-card break protection. Final pagination needs a fresh PDF exported from the actual selected saved proposal version and comparison with its JSON. The existing synthetic PDF does not close that gate. No new browser PDF was generated in this verification pass.

## Other-task browser observations — 3 October 2026 (retained record)

Executed end-to-end browser acceptance checks on isolated origin `http://127.0.0.1:5182` using Chrome:
- Authenticated as `researcher@example.test` with `Local browser QA passphrase 2026`.
- Verified Pilot dashboard hero banner, active proposal counts, and navigation tabs.
- Created proposal `"Optical Fiber Acoustic Sensing for Pipeline Integrity"`.
- Entered proposal text in editor, observed real-time unsaved changes state, and saved new version.
- Verified cross-surface bidirectional navigation:
  - Header link `"← Open Patent Platform (12 Modules)"` navigated cleanly to `/#/dashboard` displaying the 12-module intelligence platform.
  - Sidebar link `"Enterprise Review Pilot"` navigated back to `/#/pilot` dashboard.
- All actions recorded and verified with 0 errors.

## Independently verified draft recovery and remaining prerequisites — 3 October 2026

On isolated port 5183, created a synthetic proposal, typed unsaved text, cancelled cross-workspace navigation and verified both route and text remained. Expired only the synthetic researcher's database session in the isolated QA database, restarted the server, and attempted save: the app displayed session expiry. Signing in as the same researcher restored the exact unsaved text; saving created version 2. This is a controlled expiry test, not a natural twelve-hour wait. Screenshot: scratch/draft-expiry-restored.png.

Browser file upload was blocked by the Chrome extension's missing Allow access to file URLs permission. Private-upload browser acceptance remains pending; existing document API tests pass. No new saved proposal PDF was available. Hosted verification remains pending Render/Supabase/Resend configuration and verified sender. PatentsView protocol tests pass, but live keyword retrieval requires PATENTSVIEW_API_KEY and is not claimed as verified.

After reviewing print changes: four affected report/patent tests pass; TypeScript and production build pass. Full suite baseline is 125 passing tests. Browser-control reconnection failed during the upload retry, so that gate remains open.


## Shared UI verification — 5–6 October 2026

Shared `src/theme.css` supplies the single ivory/navy/mint palette, Inter body and Outfit heading fonts, control radii, shadows and focus treatment. The legacy dark-mode toggle is removed. Legacy page colours and graph opacity composition now use the shared palette; mobile navigation is compact with accessible names. Print foreground colour was corrected after reviewing the colour migration. APIs, ownership and version semantics were not changed.

Observed on the isolated built Node application at http://127.0.0.1:5184:
- All 12 original-platform routes and all six pilot routes opened at 1440, 768 and 320 px. Document width matched the viewport. This is route/layout smoke coverage, not certification of every nested experimental tool or dialog. Screenshots exposed sidebar crowding and claim-page clipping; responsive fixes were applied. A complete post-fix visual audit of every populated dialog remains open.
- Synthetic researcher registration through the API returned 201. Browser sign-in, sign-out, proposal creation and saving version 2 succeeded. The proposal and selected-version report remained available after the QA server restarted on 6 October.
- Mobile pilot navigation closed on Escape and returned focus to Toggle navigation.
- Downloaded proposal-v2.json matched version ID 10d0eff0-ce3d-4015-a02c-d92b5b067067, its proposal text and two confirmed features. This version has no analysis or review; those empty states were displayed honestly. No actual saved PDF was supplied, so PDF pagination remains unverified.
- Chrome extension upload was blocked by its file-URL permission. The supported in-app-browser chooser subsequently uploaded scratch/private-acceptance.txt successfully on 6 October. The UI displayed the matching extracted passage and a private Download original link. HTTP checks of that uploaded document returned 200 and 105 bytes for the owner, 404 for a separate researcher, and 401 when signed out. This closes the local TXT browser-upload gate; it does not verify every PDF upload variation or hosted storage.
- Screenshot evidence remains in ignored scratch/theme-platform-dashboard.jpg, theme-pilot-report.jpg, theme-mobile-settings.jpg and theme-private-upload.jpg. These contain only synthetic QA data.

Validation: the full suite completed with 125 passes and zero failures (scratch/theme-tests-final.log). After the print/foreground correction, 12 report/navigation/module tests passed serially (scratch/theme-followup-tests.log), and TypeScript plus the production build passed. An initial parallel targeted run collided on a test-server port and was stopped before the successful serial rerun. The large-bundle warning remains.

The current workspace contains a newer authentication redesign and development-script edit from separate work. They are preserved and excluded from this checkpoint; only the shared authentication colour-token edits are staged. The latest working-tree build includes those unstaged edits, so it is not an exact-commit CI result. The earlier browser authentication screenshots predate that redesign. The unrelated Vite change and research Markdown document are preserved.

Remaining: actual saved selected-version PDF inspection; repeat the full administrator/researcher/reviewer browser lifecycle on the final UI; complete populated-dialog/accessibility/contrast and alternate-browser checks. Existing backend lifecycle tests and previous browser evidence remain valid historical evidence, not a claim that the complete workflow was repeated in this UI pass. Legacy experimental screens still contain demonstration metrics/model wording requiring a separate integrity audit. PatentsView live-key testing remains pending. Deployment is paused by user request.
