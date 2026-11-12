-- 0028: Feature enhancements - Appointments, e-Prescriptions, Patient Portal, Billing
-- Additive changes to support richer scheduling, prescription lifecycle, refill requests,
-- invoice line items/insurance fields, and secure patient messaging.

ALTER TABLE `appointments`
  MODIFY `status` enum('pending','pending_consent','confirmed','checked_in','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
  ADD COLUMN `reason` text NULL AFTER `status`,
  ADD COLUMN `intake_notes` text NULL AFTER `reason`,
  ADD COLUMN `checked_in_at` timestamp NULL AFTER `intake_notes`,
  ADD COLUMN `no_show_at` timestamp NULL AFTER `checked_in_at`,
  ADD COLUMN `reminder_sent_at` timestamp NULL AFTER `no_show_at`;

--> statement-breakpoint

ALTER TABLE `users`
  ADD COLUMN `allergies` text NULL AFTER `referred_by`;

--> statement-breakpoint

ALTER TABLE `consultations`
  ADD COLUMN `prescription_status` enum('draft','signed','issued','cancelled','amended') NOT NULL DEFAULT 'draft' AFTER `follow_up_comment`,
  ADD COLUMN `signed_at` timestamp NULL AFTER `prescription_status`,
  ADD COLUMN `signed_by_doctor_id` bigint NULL AFTER `signed_at`,
  ADD COLUMN `issued_at` timestamp NULL AFTER `signed_by_doctor_id`,
  ADD COLUMN `prescription_cancelled_at` timestamp NULL AFTER `issued_at`,
  ADD COLUMN `cancellation_reason` text NULL AFTER `prescription_cancelled_at`;

--> statement-breakpoint

ALTER TABLE `consultation_medications`
  ADD COLUMN `refills` int DEFAULT 0 AFTER `note`;

--> statement-breakpoint

ALTER TABLE `billings`
  MODIFY `status` enum('pending','partial','paid','refunded') DEFAULT 'pending',
  ADD COLUMN `insurance_provider` varchar(255) NULL AFTER `notes`,
  ADD COLUMN `policy_number` varchar(100) NULL AFTER `insurance_provider`,
  ADD COLUMN `member_id` varchar(100) NULL AFTER `policy_number`,
  ADD COLUMN `claim_status` enum('not_submitted','submitted','accepted','denied','paid') NOT NULL DEFAULT 'not_submitted' AFTER `member_id`,
  ADD COLUMN `claim_reference` varchar(100) NULL AFTER `claim_status`,
  ADD COLUMN `diagnosis_codes` text NULL AFTER `claim_reference`,
  ADD COLUMN `procedure_codes` text NULL AFTER `diagnosis_codes`,
  ADD COLUMN `discount_amount` decimal(12,2) DEFAULT '0' AFTER `procedure_codes`,
  ADD COLUMN `tax_amount` decimal(12,2) DEFAULT '0' AFTER `discount_amount`,
  ADD COLUMN `refunded_amount` decimal(12,2) DEFAULT '0' AFTER `tax_amount`;

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `prescription_refill_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint NOT NULL,
  `patient_id` bigint NOT NULL,
  `doctor_id` bigint NOT NULL,
  `medication_name` varchar(255) NULL,
  `quantity` int DEFAULT 1,
  `note` text NULL,
  `status` enum('pending','approved','rejected','fulfilled') NOT NULL DEFAULT 'pending',
  `resolved_at` timestamp NULL,
  `resolved_by` bigint NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`id`),
  KEY `prr_consultation_id_index` (`consultation_id`),
  KEY `prr_patient_id_index` (`patient_id`),
  KEY `prr_doctor_id_index` (`doctor_id`),
  KEY `prr_status_index` (`status`),
  CONSTRAINT `prr_consultation_fk` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `prr_patient_fk` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `prr_doctor_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `billing_line_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `billing_id` bigint NOT NULL,
  `description` varchar(255) NOT NULL,
  `code` varchar(50) NULL,
  `quantity` int NOT NULL DEFAULT 1,
  `unit_price` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `bli_billing_id_index` (`billing_id`),
  CONSTRAINT `bli_billing_fk` FOREIGN KEY (`billing_id`) REFERENCES `billings` (`id`) ON DELETE CASCADE
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `patient_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `patient_id` bigint NOT NULL,
  `doctor_id` bigint NOT NULL,
  `sender_role` enum('patient','doctor','staff') NOT NULL,
  `sender_id` bigint NOT NULL,
  `subject` varchar(255) NULL,
  `body` text NOT NULL,
  `read_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pm_patient_doctor_index` (`patient_id`,`doctor_id`),
  KEY `pm_created_at_index` (`created_at`),
  CONSTRAINT `pm_patient_fk` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pm_doctor_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pm_sender_fk` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
