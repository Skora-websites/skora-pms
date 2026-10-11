-- 0014_normalize_collations.sql
-- F-17 (audit): seven tables were created with `COLLATE=utf8mb4_unicode_ci`
-- (0011_receptionist_clinics.sql, 0012_legacy_extras.sql) while the
-- drizzle-kit-generated tables inherit the database default
-- utf8mb4_uca1400_ai_ci. MariaDB refuses string-to-string comparisons across
-- the two families (ER_CANT_AGGREGATE_2COLLATIONS), so any future join or
-- WHERE comparing text columns across this split throws at runtime.
--
-- CONVERT TO rewrites every text column to the target collation, which also
-- repairs the column-level overrides inside these tables (notifications,
-- package_payments, push_subscriptions, sos_* all had mixed column
-- collations). Deliberate utf8mb4_bin columns elsewhere in the schema
-- (audit_logs.metadata, billings.payment_details, consultations.additional_info,
-- users.notification_preferences) are NOT touched — those live in tables
-- already on the default collation and their binary collation is intentional.
--
-- Idempotent: re-running CONVERT TO on an already-converted table is a no-op
-- rewrite. All seven tables were empty or near-empty when this shipped.
-- Apply: npm run db:migrate  (tracks this file in migration_log)

ALTER TABLE notifications        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint
ALTER TABLE package_payments     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint
ALTER TABLE push_subscriptions   CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint
ALTER TABLE receptionist_clinics CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint
ALTER TABLE sos_cases            CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint
ALTER TABLE sos_offers           CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint
ALTER TABLE sos_requests         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
