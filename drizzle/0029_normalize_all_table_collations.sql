-- 0029_normalize_all_table_collations.sql
-- Unify all database tables onto utf8mb4_uca1400_ai_ci

SET FOREIGN_KEY_CHECKS = 0;
--> statement-breakpoint

ALTER TABLE `landing_items` DROP FOREIGN KEY `landing_items_section_key_landing_sections_key_fk`;
--> statement-breakpoint

ALTER TABLE `appointments` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `appointment_consult_consents` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `audit_logs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `billings` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `billing_line_items` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `billing_types` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `blogs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `blog_images` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `businesses` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `business_clinics` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `cache` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `cache_locks` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `categories` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `chat_rooms` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `clinic_doctors` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `clinic_managers` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `company_settings` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `consultations` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `consultation_diagnoses` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `consultation_examinations` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `consultation_lab_tests` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `consultation_medications` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `consultation_prescription_uploads` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `consultation_symptoms` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `diagnoses` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `doctor_clinics` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `doctor_consult_pdfs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `doctor_schedules` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `examinations` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `expense_types` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `failed_jobs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `favorites` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `follow_up_reminders` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `income_types` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `jobs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `job_batches` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `lab_tests` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `landing_items` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `landing_sections` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `mail_settings` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `medicines` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `medicine_masters` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `messages` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `migration_log` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `model_has_permissions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `model_has_roles` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `password_reset_tokens` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `patient_messages` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `permissions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `personal_access_tokens` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `prescription_refill_requests` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `registration_otps` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `roles` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `role_has_permissions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `sessions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `staff_attendances` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `support_tickets` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `support_ticket_messages` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `support_videos` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `symptoms` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `tests` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `test_bookings` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `test_booking_test` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `transactions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `user_chat_settings` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `vendors` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
--> statement-breakpoint

ALTER TABLE `audit_logs` MODIFY `metadata` json NULL;
--> statement-breakpoint

ALTER TABLE `billings` MODIFY `payment_details` json NULL;
--> statement-breakpoint

ALTER TABLE `consultations` MODIFY `additional_info` json NULL;
--> statement-breakpoint

ALTER TABLE `landing_items` MODIFY `features` json NULL;
--> statement-breakpoint

ALTER TABLE `landing_sections` MODIFY `metadata` json NULL;
--> statement-breakpoint

ALTER TABLE `test_bookings` MODIFY `tests` json NULL;
--> statement-breakpoint

ALTER TABLE `test_bookings` MODIFY `payment_details` json NULL;
--> statement-breakpoint

ALTER TABLE `users` MODIFY `notification_preferences` json NULL;
--> statement-breakpoint

ALTER TABLE `landing_items` ADD CONSTRAINT `landing_items_section_key_landing_sections_key_fk` FOREIGN KEY (`section_key`) REFERENCES `landing_sections` (`key`) ON DELETE CASCADE;
--> statement-breakpoint

SET FOREIGN_KEY_CHECKS = 1;