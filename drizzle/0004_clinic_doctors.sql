-- Multi-doctor clinics: a clinic can have several doctors practicing at it.
--   1. clinic_doctors join table (the clinic OWNER gets a row too, so
--      "doctors of a clinic" is one query with no implicit-owner special case)
--   2. doctor_schedules.doctor_id — per-doctor schedules on a shared clinic
--      (legacy rows backfilled to the clinic owner)

CREATE TABLE `clinic_doctors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `doctor_id` BIGINT UNSIGNED NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `clinic_doctors_clinic_doctor_unique`(`clinic_id`, `doctor_id`),
  INDEX `clinic_doctors_doctor_id_index`(`doctor_id`),
  CONSTRAINT `clinic_doctors_clinic_id_foreign` FOREIGN KEY (`clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE CASCADE,
  CONSTRAINT `clinic_doctors_doctor_id_foreign` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Backfill: every existing clinic's owner becomes its first member.
INSERT INTO `clinic_doctors` (`clinic_id`, `doctor_id`, `is_active`, `created_at`)
SELECT `id`, `doctor_id`, TRUE, NOW() FROM `doctor_clinics`;

-- Add nullable first, backfill, then enforce NOT NULL + FK (a NOT NULL column
-- would default to 0 and violate the FK before the backfill runs).
ALTER TABLE `doctor_schedules`
  ADD COLUMN `doctor_id` BIGINT UNSIGNED NULL AFTER `doctor_clinic_id`;

-- Backfill: legacy schedule slots belonged to the clinic owner.
UPDATE `doctor_schedules` `ds`
  JOIN `doctor_clinics` `dc` ON `dc`.`id` = `ds`.`doctor_clinic_id`
  SET `ds`.`doctor_id` = `dc`.`doctor_id`;

ALTER TABLE `doctor_schedules`
  MODIFY COLUMN `doctor_id` BIGINT UNSIGNED NOT NULL,
  ADD INDEX `doctor_schedules_doctor_id_index`(`doctor_id`),
  ADD CONSTRAINT `doctor_schedules_doctor_id_foreign` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;
