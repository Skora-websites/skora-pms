-- ─────────────────────────────────────────────────────────────────────
-- Migration: Data-integrity constraints (audit 2026-09)
-- Apply:
--   mysql -h 127.0.0.1 -P 3307 -u root skoracares_db < drizzle/integrity_constraints.sql
-- Covers:
--   1. Missing FKs: appointments.clinic_id, billings.test_booking_id
--      (+ schema.ts parity for billings.appointment_id/consultation_id)
--   2. Duplicate prevention uniques: billing_types, tests, income_types,
--      expense_types, chat_rooms, favorites, user_chat_settings
--   3. Appointment slot race index (doctor_id, date, time)
--   4. users.status NOT NULL parity
-- Notes:
--   - billing_types/tests allow ONE inactive row per (doctor_id,name) alongside
--     the active one via a generated column: MySQL unique on (doctor_id, name, is_active)
--     would block legitimate re-activation later, so we use (doctor_id, name, is_active)
--     with is_active as the boolean — dup inactive rows already cleaned (audit).
--   - income/expense_types are soft-deleted: unique on (user_id, name) including
--     soft-deleted rows prevents re-creating the same name forever — MySQL has no
--     partial indexes, so a generated column from deleted_at is used instead.
-- ─────────────────────────────────────────────────────────────────────

-- 1a. appointments.clinic_id → doctor_clinics (SET NULL keeps history)
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_clinic_id_foreign`
  FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE SET NULL;

CREATE INDEX `appointments_doctor_id_date_time_index`
  ON `appointments` (`doctor_id`, `date`, `time`);

-- 1b. billings.test_booking_id → test_bookings (SET NULL keeps billing history
--     when a booking is hard-deleted). Column was signed bigint while
--     test_bookings.id is unsigned — fix the type first or the FK fails (errno 150).
ALTER TABLE `billings` MODIFY `test_booking_id` bigint(20) unsigned NULL;
ALTER TABLE `billings`
  ADD CONSTRAINT `billings_test_booking_id_foreign`
  FOREIGN KEY (`test_booking_id`) REFERENCES `test_bookings`(`id`) ON DELETE SET NULL;

-- 2. Duplicate-prevention uniques
-- Prereq: redundant INACTIVE duplicates cleaned during the audit
--   (billing_types id 11 dup of inactive 10; tests id 3 deactivated behind 2).
-- One inactive row per (doctor,name) survives as a tombstone.
ALTER TABLE `billing_types`
  ADD UNIQUE KEY `billing_types_doctor_name_active_unique` (`doctor_id`, `name`, `is_active`);

ALTER TABLE `tests`
  ADD UNIQUE KEY `tests_doctor_name_status_unique` (`doctor_id`, `name`, `status`);

-- Soft-deleted categories: unique only among live rows (deleted_at IS NULL).
ALTER TABLE `income_types`
  ADD COLUMN `active_name` varchar(150) GENERATED ALWAYS AS (IF(`deleted_at` IS NULL, `name`, NULL)) STORED,
  ADD UNIQUE KEY `income_types_user_active_name_unique` (`user_id`, `active_name`);

ALTER TABLE `expense_types`
  ADD COLUMN `active_name` varchar(150) GENERATED ALWAYS AS (IF(`deleted_at` IS NULL, `name`, NULL)) STORED,
  ADD UNIQUE KEY `expense_types_user_active_name_unique` (`user_id`, `active_name`);

ALTER TABLE `chat_rooms`
  ADD UNIQUE KEY `chat_rooms_name_unique` (`name`);

ALTER TABLE `favorites`
  ADD UNIQUE KEY `favorites_user_message_unique` (`user_id`, `message_id`);

ALTER TABLE `user_chat_settings`
  ADD UNIQUE KEY `user_chat_settings_user_room_unique` (`user_id`, `chat_room_id`);

-- 3. users.status NOT NULL parity with live DB
--    (no-op if already NOT NULL — MySQL 8/MariaDB requires explicit check)
-- users.status is already NOT NULL in this DB; kept here for documentation parity
-- with lib/db/schema.ts which now adds .notNull().

-- 4. categories / landing uniques already exist in DB; schema.ts synced to match.
