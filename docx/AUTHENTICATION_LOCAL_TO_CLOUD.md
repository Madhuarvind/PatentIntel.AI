# Authentication foundation — 23 September 2026

## Database choice

Use PostgreSQL for cloud hosting. Local development defaults to PGlite, an embedded PostgreSQL build running **inside the Node server**, with durable files in `.data/auth`. It is not a browser database. Setting `DATABASE_URL` switches the same parameterized SQL queries to a PostgreSQL connection pool. Production refuses to start without that URL and an HTTPS `APP_ORIGIN`.

PGlite allows development on this machine without installing Docker or a database daemon. Run only one API process against its data directory. Do not copy that directory to a managed PostgreSQL service: export/import the SQL data through a controlled migration. Local test accounts should normally be discarded at deployment; create production accounts separately. Back up real local data before changes.

References: [PGlite persistent files](https://pglite.dev/docs/filesystems), [node-postgres TLS](https://node-postgres.com/features/ssl), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Run locally

Requires Node 24 or newer.

```sh
npm ci
# Copy .env.example to .env if customizing ports/origin.
npm run api
# In another terminal:
npm run dev
```

Open `http://localhost:5173`. Use that exact host because mutation requests validate the origin. Vite forwards `/api/auth` to port 3001. Set `APP_ORIGIN` to the actual frontend origin if changing ports. The API and Vite must both run. On the current Windows machine the global npm launcher is broken; invoke `C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js` with the bundled Node executable until the system launcher is repaired.

Accounts, password hashes, session hashes, reset-token hashes and rate limits persist server-side. Account emails are normalized to lowercase. Public registration cannot choose elevated roles. Passwords are 15–128 characters, hashed using scrypt (N=131072, r=8, p=1) with random salts. Session tokens are random, stored hashed in the database, and sent in HttpOnly/SameSite=Lax cookies. Production also requires Secure cookies. Ordinary sessions expire after 12 hours; Remember me expires after 30 days. These are absolute expiry limits, not sliding sessions.

Existing browser/demo profiles are not migrated to authenticated accounts. They had no password proof and cannot safely be converted. The demo login bypass is removed. Server session checks on startup/focus and once per minute replace localStorage login checks.

## Password recovery

Locally, without SMTP, reset messages are written to `.data/mail/*.json` for the developer to inspect. They are never returned by the API or committed to Git. This is a local outbox, not a delivered email. Links expire after 30 minutes, can be used once, and successful reset revokes every session and reset token for the account. Set `SMTP_URL` and `MAIL_FROM` to deliver real email. Production without SMTP returns a configuration error for password recovery.

Keep `.data` and `.env` private. Do not upload reset messages, tokens, passwords or connection strings. Delivery failures produce a generic server log without exposing those values.

## Cloud deployment design and gates

Build the included Dockerfile or run `npm run build` followed by `npm start` on a Node host. Configure managed PostgreSQL with certificate-verified TLS, HTTPS ingress, `NODE_ENV=production`, `HOST=0.0.0.0`, `APP_ORIGIN`, `DATABASE_URL`, `SMTP_URL` and `MAIL_FROM`. The Node process serves the built frontend and authentication API from the same origin. `/health` tests database connectivity. Credentials belong in the hosting service's secret store.

This phase is **not authorization for public production launch**. No hosting account or cloud service has been provisioned. The container and managed PostgreSQL path need deployment smoke tests; Docker and PostgreSQL daemons are not installed on this machine. Before public release:

1. Move dashboard/research records out of shared browser storage and enforce ownership on every data API. Signing in currently does not make legacy workspace records private per account; this is the next phase.
2. Deploy and protect the remaining patent/research APIs. The old patent lookup remains development middleware, outside this auth foundation.
3. Verify SMTP delivery and account-recovery operations. Email ownership verification, MFA, administrative roles and account deletion are not implemented in this phase.
4. Configure ingress request limits, HTTPS, backups and restore drills. The app rate-limits by normalized email and direct socket IP in PostgreSQL, ignores forwarding headers, and limits concurrent password hashing. Behind a proxy, IP limits may be shared; configure ingress policy deliberately.
5. Use managed schema migrations as the schema grows. Initial startup creates the version-one authentication tables; it is not a general schema migration system.

## Validation

Run `npm test`, `npm run build`, `npm run lint`. Authentication tests use a real temporary on-disk PGlite database and HTTP server: registration, duplicate email, wrong/unknown credentials, fixed role, hashed secrets, cookie attributes, remember-me, session restoration/expiry/logout, cross-origin rejection, rate limits, recovery expiry/replay, session revocation and process/database restart persistence. PostgreSQL hosting, SMTP delivery and Docker execution remain distinct unverified deployment gates.

The existing experimental IPv4 patent-source fallback is separate work. Authentication adds only the Vite `/api/auth` proxy to the reviewed configuration.

Verified on this machine: all 11 authentication integration tests and all 67 previous regression tests pass (78 total); TypeScript and Vite production build pass. Lint exits successfully with existing warnings; Vite retains a large-bundle warning. Browser checks passed for registration, incorrect-password rejection, valid login, refresh restoration, logout, and the local-outbox recovery notice. Password changes/replay and database restart are verified through the HTTP integration tests. A synthetic `example.test` account remains only in the ignored local QA database. No real emails were sent and no cloud resources were created.
