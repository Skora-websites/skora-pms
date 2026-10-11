# Superseded SQL files (archived 2026-10-07)

These four files previously lived in `drizzle/` and were **never applied** by
the migration runner (`scripts/migrate.ts` only runs files matching
`/^\d{4}_/`). They are September-era manual remediation scripts that predate
the drizzle-kit pipeline.

**Every object they declare is already provided by the numbered migrations** —
verified by provisioning a scratch database with `npm run db:migrate` and
diffing `information_schema` against the live database (655 columns /
211 indexes / 85 foreign keys, zero drift). See the F-16 section of
`burp-audite.md` for the full reproduction.

| File | Declares | Already provided by |
|---|---|---|
| `audit_logs.sql` | `CREATE TABLE audit_logs` | `0000_fine_the_leader.sql` |
| `push_subscriptions.sql` | `CREATE TABLE push_subscriptions` | `0012_legacy_extras.sql` |
| `sos_dispatch.sql` | `sos_requests`, `sos_offers`, `sos_cases`; `users.on_duty` | `0012_legacy_extras.sql`; `0000_fine_the_leader.sql` |
| `integrity_constraints.sql` | 2 FKs, 6 unique keys, 2 generated columns | `0000_fine_the_leader.sql` (only `appointments_clinic_id_foreign` was unique to it, and it already exists in live databases from the original manual run) |

Do **not** move these back into `drizzle/` or widen the runner's filename
filter: `integrity_constraints.sql` contains non-idempotent
`ALTER TABLE … ADD CONSTRAINT` statements that would fail against any
database that already has them. The runner now warns when a non-numeric
`.sql` file sits in `drizzle/` so stale strays are visible (G-06).
