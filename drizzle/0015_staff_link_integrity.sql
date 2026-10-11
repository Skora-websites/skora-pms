-- 0015_staff_link_integrity.sql
-- F-06 (audit): the schema carries two link columns on `users` — the modern
-- `doctor_id` and the legacy Laravel-spatie `reference_role_id`. createStaff
-- writes both, but rows provisioned outside the UI (the seed wrote
-- doctor_id only) ended up invisible to every staff read path, which
-- filters on reference_role_id. Result: an empty staff roster, dead
-- permission dialogs and 404s on the attendance/permissions endpoints for
-- any practice not provisioned through the UI.
--
-- Backfill: mirror reference_role_id from doctor_id for existing
-- receptionist rows (the smaller change; makes existing data consistent
-- with what createStaff writes).
--
-- The originally planned CHECK constraint guarding the invariant is NOT
-- possible on MariaDB: both link columns are self-referencing foreign keys
-- and MariaDB rejects CHECK expressions over FK columns. The equivalent
-- assertion lives in scripts/check-db-schema.mjs (npm run db:check), which
-- fails CI when a receptionist row carries a NULL in both columns.
--
-- NOTE: the self-escalation guards from F-05 (updateStaff/deleteStaff/
-- saveStaffPermissions) landed BEFORE this backfill — a backfill alone
-- would have activated that path (see burp-audite.md §Phase 3).
--
-- Idempotent: re-running only touches rows still needing the backfill.

UPDATE users
SET reference_role_id = doctor_id
WHERE role = 'receptionist'
  AND reference_role_id IS NULL
  AND doctor_id IS NOT NULL;
