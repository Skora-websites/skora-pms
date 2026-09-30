-- Multi-tier dashboard hierarchy (Phase 1):
--   super_admin → admin (business owner) → manager (clinic) → team → patient
--   1. `businesses` — owned by an admin (owner) user
--   2. `business_clinics` — links a business to its doctor_clinics rows
--      (a clinic belongs to exactly one business → unique clinic_id)
--   3. `clinic_managers` — manager assignments per clinic
--   4. users.role enum extended with 'manager'
--   5. Backfill: each doctor with clinics gets their own business so existing
--      practices keep working unchanged (additive migration).

CREATE TABLE `businesses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(255) NULL,
  `address` TEXT NULL,
  `logo` VARCHAR(255) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `businesses_slug_unique`(`slug`),
  INDEX `businesses_owner_id_index`(`owner_id`),
  CONSTRAINT `businesses_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

--> statement-breakpoint

CREATE TABLE `business_clinics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `business_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `is_primary` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `business_clinics_clinic_unique`(`clinic_id`),
  INDEX `business_clinics_business_id_index`(`business_id`),
  CONSTRAINT `business_clinics_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  CONSTRAINT `business_clinics_clinic_id_foreign` FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE CASCADE
);

--> statement-breakpoint

CREATE TABLE `clinic_managers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `business_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `clinic_managers_clinic_user_unique`(`clinic_id`, `user_id`),
  INDEX `clinic_managers_user_id_index`(`user_id`),
  INDEX `clinic_managers_business_id_index`(`business_id`),
  CONSTRAINT `clinic_managers_business_id_foreign` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
  CONSTRAINT `clinic_managers_clinic_id_foreign` FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE CASCADE,
  CONSTRAINT `clinic_managers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

--> statement-breakpoint

-- Extend the role enum with 'manager'. Existing rows keep their values —
-- MySQL maps enum values positionally, so appending at the end is safe.
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM(
    'admin',
    'super_admin',
    'doctor',
    'patient',
    'receptionist',
    'manager'
  ) NOT NULL DEFAULT 'patient';

--> statement-breakpoint

-- Backfill: every doctor that owns clinics becomes the owner of a business
-- carrying those clinics. Doctors without clinics (rare) get a bare business
-- so owner dashboards always resolve. Existing admin-role users (none in
-- seed data) are left untouched — they onboard via the UI later.
INSERT INTO `businesses` (`owner_id`, `name`, `slug`, `is_active`, `created_at`, `updated_at`)
SELECT
  u.`id`,
  CONCAT(u.`name`, '''s Practice'),
  CONCAT('biz-', u.`id`),
  TRUE,
  NOW(),
  NOW()
FROM `users` u
WHERE u.`role` = 'doctor'
  AND NOT EXISTS (SELECT 1 FROM `businesses` b WHERE b.`owner_id` = u.`id`);

--> statement-breakpoint

INSERT INTO `business_clinics` (`business_id`, `clinic_id`, `is_primary`, `created_at`, `updated_at`)
SELECT
  b.`id`,
  dc.`id`,
  FALSE,
  NOW(),
  NOW()
FROM `doctor_clinics` dc
JOIN `users` u ON u.`id` = dc.`doctor_id` AND u.`role` = 'doctor'
JOIN `businesses` b ON b.`owner_id` = u.`id`
WHERE NOT EXISTS (
  SELECT 1 FROM `business_clinics` bc WHERE bc.`clinic_id` = dc.`id`
);

--> statement-breakpoint

-- Make the first-linked clinic of each business the primary one.
UPDATE `business_clinics` bc
JOIN (
  SELECT MIN(`id`) AS `first_id`, `business_id`
  FROM `business_clinics`
  GROUP BY `business_id`
) firsts ON firsts.`first_id` = bc.`id`
SET bc.`is_primary` = TRUE;
