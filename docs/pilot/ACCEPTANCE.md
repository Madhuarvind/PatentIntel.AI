# Local acceptance results — 2 October 2026

Status: local workflow demonstrated; hosted pilot is not released. Both workspaces are retained at the user's request. The older platform opens by default; Enterprise Review Pilot opens `#/pilot`. Checks below distinguish automated evidence from browser observations.

## Automated verification

Final verification on 2 October: **110 tests pass, 0 failures**, TypeScript passes, production build passes. Vite reports a large-bundle warning (about 1.19 MB main JavaScript before gzip); this is a performance follow-up, not a passing performance audit. Tests use disposable databases and synthetic accounts, not user records.

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
- Older modules retain browser-local storage and experimental workflows. These records are not isolated by server account. A visible notice directs private proposals and assigned decisions to the pilot. Legacy provider/AI settings are not the pilot's server-only architecture; do not enter private provider secrets there. Patent lookup now uses a shared authenticated Node handler in development and the deployment server. Other legacy external browser calls remain restricted by production CSP; their hosted-provider parity is still a deployment gate.
- No Render, Supabase or Resend account is configured. Hosted private storage, delivered email, HTTPS, restart/redeployment, restore and rollback have not been verified. No purchases or deployment were performed.

## Release gates

The hosted pilot is complete only after the deployment checklist and two-user hosted journey pass, including exports, email delivery, private uploads, persistence, backup restoration and rollback. Do not infer production readiness from a build or sidebar smoke check.

## Interface follow-up — 2 October

Navigation and report tests pass (3 targeted checks), with browser checks for the focus changes. The previous full-suite baseline remains 110 passing tests. Native saved-PDF inspection still requires a supported print-dialog interaction or an operator-saved PDF; it is not inferred from the report DOM.

## Patent lookup deployment parity — 2 October

Shared `/api/patents/resolve` now runs in the Node deployment server and before legacy Vite middleware during normal development. It requires a session, fixes the upstream host, rejects redirects, bounds response time/size and concurrent lookups, and refuses mismatched source identity. The client reports expired sessions explicitly. Six targeted server/development tests pass; TypeScript and production build pass. A live isolated handler probe returned HTTP 200 for US10000000B2, “Coherent LADAR using intra-pixel quadrature detection”, with 20 parsed claims. This probe used a synthetic authentication adapter; real session middleware ordering is separately covered by the development integration test. It does not certify hosted availability or complete source coverage.
