# PatentIntel.AI — research platform and proposal review pilot

A research-team workspace for proposals, source-backed lexical comparisons, assigned review, revision and version-specific reports. Navy, ivory and mint interface with Researcher, Reviewer and Administrator roles.

## Run locally

Use Node 24+, then:

```sh
npm ci
npm run dev
```

Open the exact localhost URL printed in the terminal. One process serves the React interface and all authentication/workspace APIs. PGlite keeps accounts and research records in `.data/auth`; private files live in `.data/documents`. Stop the process cleanly before backups or operator commands. Do not run two processes against the same database. See `.env.example` for configuration.

Register normally. For the initial administrator, stop the app and run `npm run bootstrap-admin -- your-email@example.com`, then restart. Administrators invite reviewers and assign proposals. Verification and recovery links go to the local outbox; enable `AUTH_REQUIRE_VERIFICATION=true` for the complete local verification flow.

## Working journey

Register → sign in → create proposal → save confirmed technical features → import sources → run BM25 comparison → submit to assigned reviewer → comment/request revision → save and compare new version → resubmit → decide → print PDF or export JSON.

The server enforces ownership and assigned-version access. A submission freezes its version and analysis snapshot. New versions preserve documents and need a new comparison. Reports contain exact source passages and version-bound review history. Browser-only historical proposal text is imported only after explicit selection in Settings. Demonstration data is not seeded into real projects.

## Evidence boundaries

BM25 is lexical retrieval, not SBERT or a novelty/patentability probability. Live Crossref searches return papers and available publisher abstracts; patent references can be imported manually into a separate collection. Global live patent search is not configured. Unavailable providers, absent passages and unmatched features are reported explicitly. AI generation is disabled; no paid model is needed for the review journey.

The original 12-module platform remains the default entry point. Open **Enterprise Review Pilot** in its sidebar for the persistent proposal workflow (`#/pilot`); the pilot includes a return link. Legacy modules remain experimental and use browser-local records that can be shared across accounts on the same device. Their retention does not imply server ownership, complete functionality or cloud durability. Use the pilot for private proposals and assigned review. Historical IEEE research drafts are marked unverified; do not cite their reported scores as measured results.

## Design, validation and hosting

- [Requirements, permissions, ER and architecture diagrams](docs/pilot/DESIGN.md)
- [Research claim verification](docs/pilot/RESEARCH_VERIFICATION.md)
- [Deployment, backups and rollback](docs/pilot/DEPLOYMENT.md)
- [Acceptance evidence and remaining gates](docs/pilot/ACCEPTANCE.md)

`npm test` runs automated checks; `npm run build` type-checks and builds the frontend. Tests use disposable databases and synthetic accounts. Run the complete two-user hosted journey before calling the pilot released.

A Render blueprint is prepared for one Node service, external Supabase PostgreSQL/private storage and Resend HTTPS mail. Hosted deployment requires project credentials, a verified sender and the acceptance/restore drill. No hosted completion or production readiness is claimed. No purchases are necessary to run the local application.
