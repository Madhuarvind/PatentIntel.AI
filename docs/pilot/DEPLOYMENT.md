# Pilot deployment and recovery runbook

Status: configuration prepared; hosted acceptance and delivery have not run. No purchases are authorized. Keep registration private to the research team until the gates below pass.

## Local development

Use Node 24 or later, `npm ci`, then `npm run dev`. Open the exact origin printed by the server (default http://localhost:5173). Frontend and all APIs run in one process. `npm run dev:web` alone is a frontend-only diagnostic command and cannot provide the product workflow.

Copy `.env.example` to `.env` for overrides. Local PostgreSQL-compatible records live in `.data/auth`; document bytes in `.data/documents`; recovery, verification and invitation links in `.data/mail`. These paths are ignored by Git. Use `AUTH_REQUIRE_VERIFICATION=true` to exercise the complete verification journey locally. Open only the intended account's outbox link; these are credentials, not logs to publish.

Stop with Ctrl+C. A second process cannot open the same PGlite directory. Never remove a live lock or `postmaster.pid`. For an incomplete lock, stop all processes referencing the directory, take a copy of the whole directory and inspect ownership before recovery. A valid lock from a dead process is reclaimed automatically. Do not run operator commands against the local database while the app is open.

Register the intended administrator normally. Stop the local application, run `npm run bootstrap-admin -- operator@example.com`, and restart. In hosted mode, run this command on the operator's machine with a secure environment containing the hosted DATABASE_URL; Render free instances do not provide an interactive shell. It only promotes an existing account and verifies that account. Administrator invitations can create reviewers or upgrade existing accounts when they sign in through the matching invitation link.

## Hosted prerequisites and sequence

1. Choose an existing or free Render workspace, Supabase project and Resend account. No billing upgrades. Supply secrets directly in their dashboards or a private local environment, never in a PR, screenshot or chat.
2. In Supabase create a **private** `patentintel-documents` bucket with a 20 MB limit and PDF/plain-text MIME types. No anonymous/public object policies are needed: the Node backend retrieves documents after checking authorization. Service-role credentials stay only in Node.
3. Create a dedicated database role/schema for the app if using a shared Supabase project. Restrict Supabase's exposed Data API schemas so app tables are not publicly exposed; migration 3 revokes grants for PUBLIC and existing anon/authenticated roles and enables RLS on application tables. The Node database role must own these tables. Retest grants after future schema changes. The app uses direct SQL and its existing HttpOnly-session authentication, not Supabase Auth. Verify anonymous REST requests cannot read any app table. Use a PostgreSQL URL with verified TLS (`sslmode=verify-full` and a trusted CA); never disable certificate verification. Use the session pooler for IPv4-only hosts. Keep max pool size 5.
4. Verify a sender domain in Resend and test delivery to two distinct test recipients. Configure RESEND_API_KEY and MAIL_FROM. Cloud registration always requires verification; API configuration alone is not evidence of delivered email. The staging owner must verify delivery before admitting researchers.
5. Create a Render service from `render.yaml` on the reviewed branch. Set APP_ORIGIN to its exact HTTPS origin, DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, MAIL_FROM. Render assigns PORT. Do not add any `VITE_` secrets. Automatic deploys are disabled for this pilot.
6. Deploy one instance. Startup applies additive migrations transactionally, checks database availability, and refuses a public or unavailable document bucket. `/health` checks database connectivity. Do not scale to multiple workers without a distributed analysis lease/migration strategy.
7. Complete registration and bootstrap the initial administrator. Invite a reviewer, create a separate researcher, and execute every hosted acceptance row below before making the pilot available.

Free Render instances sleep after inactivity and lose filesystem changes; no hosted account/document data is stored there. Supabase free projects may pause. These are pilot tradeoffs and are visible as temporary service errors; they are not production availability guarantees. Consult [Render free limits](https://render.com/docs/free), [Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase bucket configuration](https://supabase.com/docs/guides/storage/buckets/creating-buckets), [Supabase pricing](https://supabase.com/pricing), and [Resend API](https://resend.com/docs/api-reference/emails/send-email) before deployment.

## Backup and restore drill

Local: stop the application cleanly, copy the entire PGlite data directory **and** documents directory to a protected backup, retain the application commit and configuration names. Restore copies into new directories, set AUTH_DATA_DIR / DOCUMENT_DATA_DIR to those copies, and start on a separate loopback origin. Compare project/version/comment counts and download/hash each original document. Never test a restore over the only working database.

Hosted: use `pg_dump` with an environment-supplied connection and custom format to back up the app schema. Back up the private bucket objects separately using a trusted operator tool; database backups do not contain file bytes. Record object keys, SHA-256 hashes, schema migration versions and app commit in a protected manifest. Do not put password-bearing connection strings in shell history. During the drill stop writes, restore to a disposable PostgreSQL database and separate private bucket, and launch the same commit with those destinations. Compare counts, review/decision references, report snapshots and downloaded document hashes. Verify another researcher and an unassigned reviewer still get 404. Resume only after the restored environment passes. Provider-managed backups alone do not complete this drill.

Rollback: keep the previous build/commit and a pre-deploy database+object backup. Migrations currently add tables/columns. Revert the application only if that version is compatible with the current schema; otherwise restore into a replacement database and private bucket and switch configuration after verification. A rollback must not erase newly created research records: freeze writes and preserve an export before restoring. Document the drill result and recovery time.

## Hosted release gates (all pending)

- [ ] HTTPS, Secure HttpOnly cookies, CSRF origin rejection, duplicate/wrong-password/expiry/logout.
- [ ] Delivered verification, invitation and password recovery links; token expiry/replay rejected.
- [ ] Two researchers isolated; unassigned reviewer cannot read; author cannot approve self.
- [ ] Typed proposal and TXT/PDF extraction; empty/scanned/malformed/20 MB/100-page cases.
- [ ] Sources distinguish patents/papers and metadata/passages; live Crossref failures visible.
- [ ] Evidence corpus and method reproducible; new versions need new analysis.
- [ ] Submit → under review → needs revision → resubmit → approved for drafting; separate rejection.
- [ ] JSON and printed PDF match selected version, evidence and review history.
- [ ] Mobile/desktop/keyboard; service outage, retry, empty list; no dead navigation.
- [ ] Records survive new browser, database restart and application redeploy; files remain private.
- [ ] Backup restore, migration rerun, rollback and resource-limit checks on the actual host.

Live global patent retrieval, OCR, semantic models, generation, training and simulated benchmark dashboards are outside this release. References can be imported manually with exact passages; Crossref provides live academic metadata/abstracts when available. Do not label the hosted pilot complete while any gate remains unchecked.


## Dual-workspace deployment gate

The retained legacy platform is experimental and browser-local. The patent resolver is now served by the shared authenticated Node handler. Other direct external requests are not covered by the production pilot server/CSP. Verify or migrate these providers before advertising hosted legacy feature parity; do not weaken CSP to hide this gap. The persistent review workflow is available at #/pilot.
