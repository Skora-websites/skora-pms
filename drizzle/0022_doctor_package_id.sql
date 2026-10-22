-- 0022: Record which package a doctor is on.
--
-- Packages previously only priced the access window: a Package 1 doctor and a
-- Package 3 doctor got identical 30 days and identical features, while the
-- pricing page advertises 1/3/5 staff seats, role management and multi-vendor
-- lab tests as differentiators. `users.package_id` stores the purchased plan
-- (set at payment fulfillment, cleared on plan downgrade by super-admin) so
-- lib/packages/entitlements.ts can enforce those limits.
--
-- NULL means "no paid package" — trial, seeded and legacy doctors keep full
-- access ("Full access during your trial" per the marketing page), so this
-- column must default to NULL and never be backfilled.
--
-- Applied once by scripts/migrate.ts (recorded in migration_log), so no
-- IF NOT EXISTS guard is needed for the column itself.

ALTER TABLE users ADD COLUMN package_id VARCHAR(50) NULL DEFAULT NULL AFTER trial_ends_at;
