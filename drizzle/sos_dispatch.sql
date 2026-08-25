-- ─────────────────────────────────────────────────────────────────────
-- Migration: SOS Emergency Dispatch System tables
-- Apply:
--   mysql -u root -p skoracare < drizzle/sos_dispatch.sql
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `sos_requests` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `status` enum('pending','accepted','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
  `latitude` varchar(255) NOT NULL,
  `longitude` varchar(255) NOT NULL,
  `radius_km` int NOT NULL DEFAULT 10,
  `complaint` varchar(500) DEFAULT NULL,
  `patient_notes` text,
  `accepted_by` bigint unsigned DEFAULT NULL,
  `accepted_at` timestamp NULL,
  `cancelled_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL,
  CONSTRAINT `sos_requests_id` PRIMARY KEY(`id`),
  CONSTRAINT `sos_requests_patient_foreign` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_requests_accepted_by_foreign` FOREIGN KEY (`accepted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `sos_requests_status_index` ON `sos_requests` (`status`);
CREATE INDEX `sos_requests_patient_id_index` ON `sos_requests` (`patient_id`);

CREATE TABLE IF NOT EXISTS `sos_offers` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `sos_request_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `clinic_id` bigint unsigned DEFAULT NULL,
  `distance_km` decimal(8,2) DEFAULT NULL,
  `status` enum('broadcast','accepted','declined','expired') NOT NULL DEFAULT 'broadcast',
  `responded_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `sos_offers_id` PRIMARY KEY(`id`),
  CONSTRAINT `sos_offers_request_foreign` FOREIGN KEY (`sos_request_id`) REFERENCES `sos_requests`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_offers_doctor_foreign` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_offers_clinic_foreign` FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `sos_offers_request_doctor_unique` (`sos_request_id`, `doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `sos_offers_doctor_id_index` ON `sos_offers` (`doctor_id`);
CREATE INDEX `sos_offers_status_index` ON `sos_offers` (`status`);

CREATE TABLE IF NOT EXISTS `sos_cases` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `sos_request_id` bigint unsigned NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `clinic_id` bigint unsigned DEFAULT NULL,
  `accepted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `patient_symptoms` text,
  `notes` text,
  `status` enum('open','completed','cancelled') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL,
  CONSTRAINT `sos_cases_id` PRIMARY KEY(`id`),
  CONSTRAINT `sos_cases_request_foreign` FOREIGN KEY (`sos_request_id`) REFERENCES `sos_requests`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_cases_patient_foreign` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_cases_doctor_foreign` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `sos_cases_clinic_foreign` FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `sos_cases_doctor_id_index` ON `sos_cases` (`doctor_id`);
CREATE INDEX `sos_cases_patient_id_index` ON `sos_cases` (`patient_id`);

ALTER TABLE `users` ADD COLUMN `on_duty` boolean DEFAULT false AFTER `status`;
CREATE INDEX `users_on_duty_index` ON `users` (`on_duty`);
