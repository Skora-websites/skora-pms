-- 0012: Legacy extras that were previously applied to the old database by
-- hand (non-numbered files) and never tracked by the migration runner.
--
-- Sources:
--   drizzle/push_subscriptions.sql  (PWA Web Push subscriptions)
--   drizzle/sos_dispatch.sql        (SOS Emergency Dispatch tables + on_duty index)
--   drizzle/integrity_constraints.sql (data-integrity FKs/uniques, audit 2026-09)
--
-- All FKs target signed `bigint` ids, matching the drizzle-generated base
-- schema (0000) and later numbered migrations.

-- ── Columns from lib/db/schema.ts missing from 0000 (legacy DB had them) ────
ALTER TABLE `users` ADD COLUMN `signature_path` varchar(2048) NULL;

--> statement-breakpoint

ALTER TABLE `users` ADD COLUMN `notification_preferences` json NULL;

--> statement-breakpoint

ALTER TABLE `blogs` ADD COLUMN `publish_at` timestamp NULL;

--> statement-breakpoint

ALTER TABLE `support_tickets` ADD COLUMN `priority` varchar(20) NULL DEFAULT 'normal';

--> statement-breakpoint

-- ── In-app notifications (P7.5) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `type` varchar(50) DEFAULT 'info',
  `link` varchar(255),
  `is_read` boolean DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`id`),
  INDEX `notifications_user_id_index` (`user_id`),
  INDEX `notifications_read_index` (`is_read`),
  INDEX `notifications_created_at_index` (`created_at`),
  CONSTRAINT `notifications_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--> statement-breakpoint

-- ── Package payment audit trail (Razorpay) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `package_payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `package_id` varchar(50) NOT NULL,
  `package_name` varchar(255) NOT NULL,
  `period` enum('monthly','yearly') NOT NULL,
  `amount` int NOT NULL,
  `status` enum('created','paid','failed') NOT NULL DEFAULT 'created',
  `razorpay_order_id` varchar(100) NOT NULL,
  `razorpay_payment_id` varchar(100) NULL,
  `razorpay_signature` varchar(255) NULL,
  `access_until` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`id`),
  INDEX `package_payments_user_id_index` (`user_id`),
  UNIQUE INDEX `package_payments_order_id_unique` (`razorpay_order_id`),
  CONSTRAINT `package_payments_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--> statement-breakpoint

-- ── PWA Web Push subscriptions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `endpoint` text NOT NULL,
  `auth` varchar(255) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `push_subscriptions_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `push_subscriptions_user_id_index` ON `push_subscriptions` (`user_id`);

--> statement-breakpoint

-- ── SOS Emergency Dispatch ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sos_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `patient_id` bigint NOT NULL,
  `status` enum('pending','accepted','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
  `latitude` varchar(255) NOT NULL,
  `longitude` varchar(255) NOT NULL,
  `radius_km` int NOT NULL DEFAULT 10,
  `complaint` varchar(500) DEFAULT NULL,
  `patient_notes` text,
  `accepted_by` bigint DEFAULT NULL,
  `accepted_at` timestamp NULL,
  `cancelled_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `sos_requests_patient_foreign` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_requests_accepted_by_foreign` FOREIGN KEY (`accepted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sos_requests_status_index` ON `sos_requests` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sos_requests_patient_id_index` ON `sos_requests` (`patient_id`);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `sos_offers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sos_request_id` bigint NOT NULL,
  `doctor_id` bigint NOT NULL,
  `clinic_id` bigint DEFAULT NULL,
  `distance_km` decimal(8,2) DEFAULT NULL,
  `status` enum('broadcast','accepted','declined','expired') NOT NULL DEFAULT 'broadcast',
  `responded_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `sos_offers_request_foreign` FOREIGN KEY (`sos_request_id`) REFERENCES `sos_requests`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_offers_doctor_foreign` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_offers_clinic_foreign` FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `sos_offers_request_doctor_unique` (`sos_request_id`, `doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sos_offers_doctor_id_index` ON `sos_offers` (`doctor_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sos_offers_status_index` ON `sos_offers` (`status`);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `sos_cases` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sos_request_id` bigint NOT NULL,
  `patient_id` bigint NOT NULL,
  `doctor_id` bigint NOT NULL,
  `clinic_id` bigint DEFAULT NULL,
  `accepted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `patient_symptoms` text,
  `notes` text,
  `doctor_latitude` varchar(255) DEFAULT NULL,
  `doctor_longitude` varchar(255) DEFAULT NULL,
  `doctor_last_seen_at` timestamp NULL,
  `status` enum('open','completed','cancelled') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `sos_cases_request_foreign` FOREIGN KEY (`sos_request_id`) REFERENCES `sos_requests`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_cases_patient_foreign` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_cases_doctor_foreign` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_cases_clinic_foreign` FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sos_cases_doctor_id_index` ON `sos_cases` (`doctor_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sos_cases_patient_id_index` ON `sos_cases` (`patient_id`);

--> statement-breakpoint

-- users.on_duty index (SOS dispatch lookup) — column added in 0000.
CREATE INDEX IF NOT EXISTS `users_on_duty_index` ON `users` (`on_duty`);

--> statement-breakpoint

-- ── Data-integrity constraints (audit 2026-09) ──────────────────────────────
-- 1a. appointments.clinic_id → doctor_clinics (SET NULL keeps history)
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_clinic_id_foreign`
  FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `appointments_doctor_id_date_time_index` ON `appointments` (`doctor_id`, `date`, `time`);

--> statement-breakpoint

-- 1b. billings.test_booking_id → test_bookings is added in 0000 (deferred FK
--      block) with the matching signed type.

-- 2. Duplicate-prevention uniques. On a fresh DB these cannot conflict with
--    existing data, so they are safe to apply unconditionally.
ALTER TABLE `billing_types` ADD UNIQUE KEY `billing_types_doctor_name_active_unique` (`doctor_id`, `name`, `is_active`);

--> statement-breakpoint

ALTER TABLE `tests` ADD UNIQUE KEY `tests_doctor_name_status_unique` (`doctor_id`, `name`, `status`);

--> statement-breakpoint

-- Soft-deleted income/expense types: unique only among live rows.
ALTER TABLE `income_types`
  ADD COLUMN `active_name` varchar(150) GENERATED ALWAYS AS (IF(`deleted_at` IS NULL, `name`, NULL)) STORED,
  ADD UNIQUE KEY `income_types_user_active_name_unique` (`user_id`, `active_name`);

--> statement-breakpoint

ALTER TABLE `expense_types`
  ADD COLUMN `active_name` varchar(150) GENERATED ALWAYS AS (IF(`deleted_at` IS NULL, `name`, NULL)) STORED,
  ADD UNIQUE KEY `expense_types_user_active_name_unique` (`user_id`, `active_name`);

--> statement-breakpoint

ALTER TABLE `chat_rooms` ADD UNIQUE KEY `chat_rooms_name_unique` (`name`);

--> statement-breakpoint

ALTER TABLE `favorites` ADD UNIQUE KEY `favorites_user_message_unique` (`user_id`, `message_id`);

--> statement-breakpoint

ALTER TABLE `user_chat_settings` ADD UNIQUE KEY `user_chat_settings_user_room_unique` (`user_id`, `chat_room_id`);
