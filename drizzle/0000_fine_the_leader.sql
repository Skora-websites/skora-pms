CREATE TABLE `appointment_consult_consents` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`appointment_id` bigint,
	`doctor_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`slug` varchar(255) NOT NULL,
	`is_accepted` boolean DEFAULT false,
	`is_rejected` boolean DEFAULT false,
	`rejected_at` timestamp,
	`consent_file` varchar(255),
	`accepted_at` timestamp,
	`status` enum('pending','pending_consent','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `appointment_consult_consents_id` PRIMARY KEY(`id`),
	CONSTRAINT `appointment_consult_consents_appointment_id_unique` UNIQUE(`appointment_id`),
	CONSTRAINT `appointment_consult_consents_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_id` bigint NOT NULL,
	`patient_id` bigint,
	`patient_string` varchar(255),
	`date` date NOT NULL,
	`time` varchar(30) NOT NULL,
	`case_type` enum('clinical_visit','home_visit','online_visit','on_call_visit') NOT NULL DEFAULT 'clinical_visit',
	`blood_group` varchar(255),
	`bp` varchar(255),
	`weight` decimal(5,2),
	`height` decimal(5,2),
	`remarks` text,
	`note` text,
	`consent_type` enum('otp','consent','upload','skipped','email'),
	`consent_value` varchar(255),
	`consent_file` varchar(255),
	`mobile_number` varchar(255),
	`status` enum('pending','pending_consent','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
	`clinic_id` bigint,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint,
	`action` varchar(100) NOT NULL,
	`ip_address` varchar(45),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billing_types` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_id` bigint NOT NULL,
	`name` varchar(255) NOT NULL,
	`default_amount` decimal(10,2) DEFAULT '0',
	`description` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `billing_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`bill_number` varchar(50) NOT NULL,
	`patient_id` bigint NOT NULL,
	`doctor_id` bigint NOT NULL,
	`billing_type_id` bigint NOT NULL,
	`appointment_id` bigint,
	`consultation_id` bigint,
	`total_amount` decimal(12,2) NOT NULL,
	`received_amount` decimal(12,2) DEFAULT '0',
	`pending_amount` decimal(12,2) DEFAULT '0',
	`payment_method` enum('upi','cash','card','netbanking'),
	`payment_details` json,
	`status` enum('pending','partial','paid') DEFAULT 'pending',
	`notes` text,
	`bill_date` date NOT NULL,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `billings_id` PRIMARY KEY(`id`),
	CONSTRAINT `billings_bill_number_unique` UNIQUE(`bill_number`)
);
--> statement-breakpoint
CREATE TABLE `blog_images` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`blog_id` bigint NOT NULL,
	`image` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `blog_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blogs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`category_id` bigint NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`shortcontent` text NOT NULL,
	`content` text NOT NULL,
	`image` varchar(255),
	`status` boolean DEFAULT true,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `blogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogs_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `cache` (
	`key` varchar(255) NOT NULL,
	`value` mediumtext NOT NULL,
	`expiration` int NOT NULL,
	CONSTRAINT `cache_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `cache_locks` (
	`key` varchar(255) NOT NULL,
	`owner` varchar(255) NOT NULL,
	`expiration` int NOT NULL,
	CONSTRAINT `cache_locks_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_rooms` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(255) DEFAULT 'group',
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `chat_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`company_name` varchar(255),
	`company_short_name` varchar(255),
	`company_tagline` varchar(255),
	`company_description` text,
	`light_logo` varchar(255),
	`dark_logo` varchar(255),
	`favicon` varchar(255),
	`company_email1` varchar(255),
	`company_email2` varchar(255),
	`company_mobile1` varchar(255),
	`company_mobile2` varchar(255),
	`company_whatsapp1` varchar(255),
	`company_whatsapp2` varchar(255),
	`facebook` varchar(255),
	`twitter` varchar(255),
	`linkedin` varchar(255),
	`instagram` varchar(255),
	`pintrest` varchar(255),
	`map` varchar(255),
	`company_address1` text,
	`company_address2` text,
	`currency_name` varchar(255),
	`currency_symbol` varchar(255),
	`default_trial_days` int DEFAULT 15,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `company_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultation_diagnoses` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`consultation_id` bigint NOT NULL,
	`diagnosis_name` varchar(255) NOT NULL,
	`note` text,
	`order` int DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `consultation_diagnoses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultation_examinations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`consultation_id` bigint NOT NULL,
	`examination_name` varchar(255) NOT NULL,
	`note` text,
	`order` int DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `consultation_examinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultation_lab_tests` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`consultation_id` bigint NOT NULL,
	`lab_test_name` varchar(255) NOT NULL,
	`note` text,
	`order` int DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `consultation_lab_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultation_medications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`consultation_id` bigint NOT NULL,
	`medicine_name` varchar(255) NOT NULL,
	`dose` varchar(255),
	`frequency` varchar(255),
	`when_to_take` varchar(255),
	`duration` varchar(255),
	`note` text,
	`order` int DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `consultation_medications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultation_prescription_uploads` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`consultation_id` bigint,
	`patient_id` bigint NOT NULL,
	`doctor_id` bigint NOT NULL,
	`file_path` varchar(255) NOT NULL,
	`file_type` varchar(255),
	`notes` text,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `consultation_prescription_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultation_symptoms` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`consultation_id` bigint NOT NULL,
	`symptom` varchar(255) NOT NULL,
	`note` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `consultation_symptoms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`patient_id` bigint NOT NULL,
	`doctor_id` bigint NOT NULL,
	`appointment_id` bigint,
	`consultation_date` timestamp DEFAULT CURRENT_TIMESTAMP,
	`symptoms_note` text,
	`examination_note` text,
	`diagnosis_note` text,
	`lab_note` text,
	`medical_history` text,
	`private_notes` text,
	`medical_records` text,
	`lab_results` text,
	`medications_note` text,
	`additional_info` json,
	`follow_up_date` varchar(255),
	`additional_notes` text,
	`follow_up_status` varchar(255) DEFAULT 'pending',
	`follow_up_comment` text,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `consultations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnoses` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `diagnoses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctor_clinics` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_id` bigint NOT NULL,
	`clinic_name` varchar(255) NOT NULL,
	`address_type` enum('manual','map') DEFAULT 'manual',
	`address` text NOT NULL,
	`latitude` varchar(255),
	`longitude` varchar(255),
	`phone` varchar(255) NOT NULL,
	`consultation_fee` decimal(8,2),
	`clinic_logo` varchar(255),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `doctor_clinics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctor_consult_pdfs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_id` bigint NOT NULL,
	`pdf_path` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `doctor_consult_pdfs_id` PRIMARY KEY(`id`),
	CONSTRAINT `doctor_consult_pdfs_doctor_id_unique` UNIQUE(`doctor_id`)
);
--> statement-breakpoint
CREATE TABLE `doctor_schedules` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_clinic_id` bigint NOT NULL,
	`day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
	`start_time` varchar(255),
	`end_time` varchar(255),
	`slot_duration` int,
	`gap_duration` int,
	`session_type` enum('morning','afternoon','evening','night','full_day') NOT NULL,
	`max_patients` int DEFAULT 10,
	`is_24_hours` boolean DEFAULT false,
	`break_start_time` varchar(255),
	`break_end_time` varchar(255),
	`duration_hours` int DEFAULT 0,
	`duration_minutes` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `doctor_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `examinations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `examinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expense_types` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`user_id` bigint NOT NULL,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `expense_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `failed_jobs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(255) NOT NULL,
	`connection` text NOT NULL,
	`queue` text NOT NULL,
	`payload` longtext NOT NULL,
	`exception` longtext NOT NULL,
	`failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `failed_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `failed_jobs_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`message_id` bigint NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `income_types` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`user_id` bigint NOT NULL,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `income_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_batches` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`total_jobs` int NOT NULL,
	`pending_jobs` int NOT NULL,
	`failed_jobs` int NOT NULL,
	`failed_job_ids` longtext NOT NULL,
	`options` mediumtext,
	`cancelled_at` int,
	`created_at` int NOT NULL,
	`finished_at` int,
	CONSTRAINT `job_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`queue` varchar(255) NOT NULL,
	`payload` longtext NOT NULL,
	`attempts` tinyint NOT NULL,
	`reserved_at` int,
	`available_at` int NOT NULL,
	`created_at` int NOT NULL,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_tests` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `lab_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `landing_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`section_key` varchar(255) NOT NULL,
	`title` varchar(255),
	`description` text,
	`image` varchar(255),
	`icon` varchar(255),
	`badge` varchar(255),
	`link` varchar(255),
	`link_text` varchar(255),
	`price_monthly` decimal(10,2),
	`price_yearly` decimal(10,2),
	`price_original_monthly` decimal(10,2),
	`price_original_yearly` decimal(10,2),
	`features` json,
	`stars` int,
	`order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `landing_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `landing_sections` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(255),
	`subtitle` text,
	`is_active` boolean DEFAULT true,
	`metadata` json,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `landing_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mail_settings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`mailer` varchar(255) DEFAULT 'smtp',
	`host` varchar(255),
	`port` int,
	`username` varchar(255),
	`password` varchar(255),
	`encryption` varchar(255),
	`from_address` varchar(255),
	`from_name` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `mail_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicine_masters` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `medicine_masters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`strength` varchar(255),
	`form` varchar(255) DEFAULT 'Tablet',
	`unit` varchar(255) DEFAULT 'mg',
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `medicines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`chat_room_id` bigint,
	`sender_id` bigint NOT NULL,
	`content` text NOT NULL,
	`doctor_id` bigint,
	`timestamp` timestamp NOT NULL,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_has_permissions` (
	`permission_id` bigint NOT NULL,
	`model_type` varchar(255) NOT NULL,
	`model_id` bigint NOT NULL,
	CONSTRAINT `model_has_permissions_permission_id_model_id_model_type_pk` PRIMARY KEY(`permission_id`,`model_id`,`model_type`)
);
--> statement-breakpoint
CREATE TABLE `model_has_roles` (
	`role_id` bigint NOT NULL,
	`model_type` varchar(255) NOT NULL,
	`model_id` bigint NOT NULL,
	CONSTRAINT `model_has_roles_role_id_model_id_model_type_pk` PRIMARY KEY(`role_id`,`model_id`,`model_type`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`email` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `password_reset_tokens_email` PRIMARY KEY(`email`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`parent_id` bigint,
	`name` varchar(255) NOT NULL,
	`guard_name` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_guard_name_unique` UNIQUE(`name`,`guard_name`)
);
--> statement-breakpoint
CREATE TABLE `personal_access_tokens` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tokenable_type` varchar(255) NOT NULL,
	`tokenable_id` bigint NOT NULL,
	`name` varchar(255) NOT NULL,
	`token` varchar(64) NOT NULL,
	`abilities` text,
	`last_used_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `personal_access_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `personal_access_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `role_has_permissions` (
	`permission_id` bigint NOT NULL,
	`role_id` bigint NOT NULL,
	CONSTRAINT `role_has_permissions_permission_id_role_id_pk` PRIMARY KEY(`permission_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`guard_name` varchar(255) NOT NULL,
	`doctor_id` bigint,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_guard_name_unique` UNIQUE(`name`,`guard_name`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`user_id` bigint,
	`ip_address` varchar(45),
	`user_agent` text,
	`payload` longtext NOT NULL,
	`last_activity` int NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_attendances` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`staff_id` bigint NOT NULL,
	`doctor_id` bigint NOT NULL,
	`date` date NOT NULL,
	`status` varchar(255) NOT NULL,
	`check_in` time,
	`check_out` time,
	`notes` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `staff_attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_attendances_staff_id_date_unique` UNIQUE(`staff_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `support_ticket_messages` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`support_ticket_id` bigint NOT NULL,
	`sender_id` bigint NOT NULL,
	`message` text NOT NULL,
	`attachment_path` varchar(255),
	`attachment_type` varchar(255),
	`is_admin_reply` boolean DEFAULT false,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `support_ticket_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('open','closed') DEFAULT 'open',
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_videos` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`video_type` enum('upload','youtube') DEFAULT 'upload',
	`video_url` varchar(255),
	`video_path` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `support_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `symptoms` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `symptoms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_booking_test` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`test_booking_id` bigint NOT NULL,
	`test_id` bigint NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `test_booking_test_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_bookings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`vendor_id` bigint NOT NULL,
	`booking_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`booking_time` time,
	`tests` json,
	`total_amount` decimal(10,2) DEFAULT '0',
	`payment_method` varchar(255),
	`payment_amount` decimal(10,2) DEFAULT '0',
	`payment_date` date,
	`payment_details` json,
	`status` enum('pending','in-progress','completed','cancelled') DEFAULT 'pending',
	`notes` text,
	`upload_link_token` varchar(255),
	`uploaded_file_path` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `test_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tests` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_id` bigint NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) DEFAULT '0',
	`status` boolean DEFAULT true,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`type` tinyint unsigned NOT NULL,
	`income_type_id` bigint,
	`expense_type_id` bigint,
	`amount` decimal(12,2) NOT NULL,
	`date` date NOT NULL,
	`status` enum('approved','unapproved','pending') DEFAULT 'approved',
	`billing_id` bigint,
	`reference_number` varchar(100),
	`payment_method` varchar(50),
	`description` text,
	`created_by` varchar(150) NOT NULL,
	`file_path` varchar(255),
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_chat_settings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`chat_room_id` bigint NOT NULL,
	`muted` boolean DEFAULT false,
	`last_cleared_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `user_chat_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`reference_role_id` bigint,
	`doctor_id` bigint,
	`name` varchar(255) NOT NULL,
	`qualification` varchar(255),
	`registration_number` varchar(255),
	`registration_id` varchar(255),
	`role` enum('admin','super_admin','doctor','patient','receptionist') NOT NULL DEFAULT 'patient',
	`email` varchar(255),
	`password` varchar(255) NOT NULL,
	`phone` varchar(255),
	`profile_photo_path` varchar(2048),
	`address` varchar(255),
	`gender` varchar(255),
	`referred_by` varchar(200),
	`dob` varchar(50),
	`pincode` int,
	`state` varchar(100),
	`city` varchar(100),
	`street_address` varchar(100),
	`latitude` varchar(255),
	`longitude` varchar(255),
	`status` varchar(255) DEFAULT 'active',
	`email_verified_at` timestamp,
	`remember_token` varchar(100),
	`current_team_id` bigint,
	`two_factor_secret` text,
	`two_factor_recovery_codes` text,
	`two_factor_confirmed_at` timestamp,
	`salutation` varchar(50),
	`aadhaar_no` varchar(12),
	`trial_ends_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_registration_id_unique` UNIQUE(`registration_id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_id` bigint NOT NULL,
	`name` varchar(255) NOT NULL,
	`mobile` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`status` boolean DEFAULT true,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointment_consult_consents` ADD CONSTRAINT `consents_appointment_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_consult_consents` ADD CONSTRAINT `appointment_consult_consents_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_consult_consents` ADD CONSTRAINT `appointment_consult_consents_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billing_types` ADD CONSTRAINT `billing_types_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billings` ADD CONSTRAINT `billings_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billings` ADD CONSTRAINT `billings_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `billings` ADD CONSTRAINT `billings_billing_type_id_billing_types_id_fk` FOREIGN KEY (`billing_type_id`) REFERENCES `billing_types`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_images` ADD CONSTRAINT `blog_images_blog_id_blogs_id_fk` FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blogs` ADD CONSTRAINT `blogs_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultation_diagnoses` ADD CONSTRAINT `consultation_diagnoses_consultation_id_consultations_id_fk` FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultation_examinations` ADD CONSTRAINT `c_examinations_consultation_id_fk` FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultation_lab_tests` ADD CONSTRAINT `consultation_lab_tests_consultation_id_consultations_id_fk` FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultation_medications` ADD CONSTRAINT `consultation_medications_consultation_id_consultations_id_fk` FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultation_prescription_uploads` ADD CONSTRAINT `c_prescription_uploads_consultation_id_fk` FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultation_prescription_uploads` ADD CONSTRAINT `consultation_prescription_uploads_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultation_prescription_uploads` ADD CONSTRAINT `consultation_prescription_uploads_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultation_symptoms` ADD CONSTRAINT `consultation_symptoms_consultation_id_consultations_id_fk` FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctor_clinics` ADD CONSTRAINT `doctor_clinics_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctor_consult_pdfs` ADD CONSTRAINT `doctor_consult_pdfs_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctor_schedules` ADD CONSTRAINT `doctor_schedules_doctor_clinic_id_doctor_clinics_id_fk` FOREIGN KEY (`doctor_clinic_id`) REFERENCES `doctor_clinics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expense_types` ADD CONSTRAINT `expense_types_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `income_types` ADD CONSTRAINT `income_types_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `landing_items` ADD CONSTRAINT `landing_items_section_key_landing_sections_key_fk` FOREIGN KEY (`section_key`) REFERENCES `landing_sections`(`key`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_chat_room_id_chat_rooms_id_fk` FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `model_has_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_parent_id_permissions_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendances` ADD CONSTRAINT `staff_attendances_staff_id_users_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_attendances` ADD CONSTRAINT `staff_attendances_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_ticket_messages` ADD CONSTRAINT `st_messages_ticket_id_fk` FOREIGN KEY (`support_ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_ticket_messages` ADD CONSTRAINT `support_ticket_messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_booking_test` ADD CONSTRAINT `test_booking_test_test_booking_id_test_bookings_id_fk` FOREIGN KEY (`test_booking_id`) REFERENCES `test_bookings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_booking_test` ADD CONSTRAINT `test_booking_test_test_id_tests_id_fk` FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_bookings` ADD CONSTRAINT `test_bookings_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_bookings` ADD CONSTRAINT `test_bookings_patient_id_users_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_bookings` ADD CONSTRAINT `test_bookings_vendor_id_vendors_id_fk` FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tests` ADD CONSTRAINT `tests_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_income_type_id_income_types_id_fk` FOREIGN KEY (`income_type_id`) REFERENCES `income_types`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_expense_type_id_expense_types_id_fk` FOREIGN KEY (`expense_type_id`) REFERENCES `expense_types`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_chat_settings` ADD CONSTRAINT `user_chat_settings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_chat_settings` ADD CONSTRAINT `user_chat_settings_chat_room_id_chat_rooms_id_fk` FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_reference_role_id_users_id_fk` FOREIGN KEY (`reference_role_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_doctor_id_users_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `appointment_consult_consents_doctor_id_foreign` ON `appointment_consult_consents` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `appointment_consult_consents_patient_id_foreign` ON `appointment_consult_consents` (`patient_id`);--> statement-breakpoint
CREATE INDEX `appointments_doctor_id_foreign` ON `appointments` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `appointments_patient_id_foreign` ON `appointments` (`patient_id`);--> statement-breakpoint
CREATE INDEX `appointments_doctor_id_date_index` ON `appointments` (`doctor_id`,`date`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_index` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_index` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_index` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `billing_types_doctor_id_foreign` ON `billing_types` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `idx_bill_doctor_date` ON `billings` (`doctor_id`,`bill_date`);--> statement-breakpoint
CREATE INDEX `idx_bill_patient` ON `billings` (`patient_id`);--> statement-breakpoint
CREATE INDEX `idx_bill_doctor_status` ON `billings` (`doctor_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_bill_appointment` ON `billings` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `blog_images_blog_id_foreign` ON `blog_images` (`blog_id`);--> statement-breakpoint
CREATE INDEX `blogs_category_id_foreign` ON `blogs` (`category_id`);--> statement-breakpoint
CREATE INDEX `consultation_diagnoses_consultation_id_foreign` ON `consultation_diagnoses` (`consultation_id`);--> statement-breakpoint
CREATE INDEX `consultation_examinations_consultation_id_foreign` ON `consultation_examinations` (`consultation_id`);--> statement-breakpoint
CREATE INDEX `consultation_lab_tests_consultation_id_foreign` ON `consultation_lab_tests` (`consultation_id`);--> statement-breakpoint
CREATE INDEX `consultation_medications_consultation_id_foreign` ON `consultation_medications` (`consultation_id`);--> statement-breakpoint
CREATE INDEX `consultation_prescription_uploads_patient_id_doctor_id_index` ON `consultation_prescription_uploads` (`patient_id`,`doctor_id`);--> statement-breakpoint
CREATE INDEX `consultation_prescription_uploads_consultation_id_index` ON `consultation_prescription_uploads` (`consultation_id`);--> statement-breakpoint
CREATE INDEX `consultation_symptoms_consultation_id_foreign` ON `consultation_symptoms` (`consultation_id`);--> statement-breakpoint
CREATE INDEX `consultations_patient_id_doctor_id_index` ON `consultations` (`patient_id`,`doctor_id`);--> statement-breakpoint
CREATE INDEX `consultations_consultation_date_index` ON `consultations` (`consultation_date`);--> statement-breakpoint
CREATE INDEX `consultations_patient_id_foreign` ON `consultations` (`patient_id`);--> statement-breakpoint
CREATE INDEX `consultations_doctor_id_foreign` ON `consultations` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `consultations_appointment_id_foreign` ON `consultations` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `doctor_clinics_doctor_id_is_active_index` ON `doctor_clinics` (`doctor_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `doctor_clinics_address_type_index` ON `doctor_clinics` (`address_type`);--> statement-breakpoint
CREATE INDEX `doctor_clinics_clinic_name_index` ON `doctor_clinics` (`clinic_name`);--> statement-breakpoint
CREATE INDEX `doctor_clinics_is_active_index` ON `doctor_clinics` (`is_active`);--> statement-breakpoint
CREATE INDEX `doctor_schedules_doctor_clinic_id_day_of_week_index` ON `doctor_schedules` (`doctor_clinic_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `doctor_schedules_is_active_index` ON `doctor_schedules` (`is_active`);--> statement-breakpoint
CREATE INDEX `doctor_schedules_session_type_index` ON `doctor_schedules` (`session_type`);--> statement-breakpoint
CREATE INDEX `doctor_schedules_is_24_hours_index` ON `doctor_schedules` (`is_24_hours`);--> statement-breakpoint
CREATE INDEX `doctor_schedules_day_of_week_index` ON `doctor_schedules` (`day_of_week`);--> statement-breakpoint
CREATE INDEX `expense_types_user_id_name_index` ON `expense_types` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `favorites_user_id_foreign` ON `favorites` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorites_message_id_foreign` ON `favorites` (`message_id`);--> statement-breakpoint
CREATE INDEX `income_types_user_id_name_index` ON `income_types` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `jobs_queue_index` ON `jobs` (`queue`);--> statement-breakpoint
CREATE INDEX `landing_items_section_key_foreign` ON `landing_items` (`section_key`);--> statement-breakpoint
CREATE INDEX `messages_chat_room_id_foreign` ON `messages` (`chat_room_id`);--> statement-breakpoint
CREATE INDEX `messages_sender_id_foreign` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `messages_doctor_id_foreign` ON `messages` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `messages_timestamp_index` ON `messages` (`timestamp`);--> statement-breakpoint
CREATE INDEX `model_has_permissions_model_id_model_type_index` ON `model_has_permissions` (`model_id`,`model_type`);--> statement-breakpoint
CREATE INDEX `model_has_roles_model_id_model_type_index` ON `model_has_roles` (`model_id`,`model_type`);--> statement-breakpoint
CREATE INDEX `permissions_parent_id_foreign` ON `permissions` (`parent_id`);--> statement-breakpoint
CREATE INDEX `personal_access_tokens_tokenable_type_tokenable_id_index` ON `personal_access_tokens` (`tokenable_type`,`tokenable_id`);--> statement-breakpoint
CREATE INDEX `personal_access_tokens_expires_at_index` ON `personal_access_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `roles_doctor_id_index` ON `roles` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_last_activity_index` ON `sessions` (`last_activity`);--> statement-breakpoint
CREATE INDEX `staff_attendances_date_index` ON `staff_attendances` (`date`);--> statement-breakpoint
CREATE INDEX `staff_attendances_doctor_id_index` ON `staff_attendances` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `support_ticket_messages_support_ticket_id_index` ON `support_ticket_messages` (`support_ticket_id`);--> statement-breakpoint
CREATE INDEX `support_ticket_messages_sender_id_foreign` ON `support_ticket_messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `support_tickets_user_id_index` ON `support_tickets` (`user_id`);--> statement-breakpoint
CREATE INDEX `support_tickets_status_index` ON `support_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `test_booking_test_test_booking_id_foreign` ON `test_booking_test` (`test_booking_id`);--> statement-breakpoint
CREATE INDEX `test_booking_test_test_id_foreign` ON `test_booking_test` (`test_id`);--> statement-breakpoint
CREATE INDEX `test_bookings_doctor_id_foreign` ON `test_bookings` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `test_bookings_patient_id_foreign` ON `test_bookings` (`patient_id`);--> statement-breakpoint
CREATE INDEX `test_bookings_vendor_id_foreign` ON `test_bookings` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `tests_doctor_id_foreign` ON `tests` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `idx_tx_user_type` ON `transactions` (`user_id`,`type`);--> statement-breakpoint
CREATE INDEX `idx_tx_user_date` ON `transactions` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_tx_user_status` ON `transactions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tx_billing` ON `transactions` (`billing_id`);--> statement-breakpoint
CREATE INDEX `idx_tx_type_status_user` ON `transactions` (`type`,`status`,`user_id`);--> statement-breakpoint
CREATE INDEX `user_chat_settings_user_id_foreign` ON `user_chat_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_chat_settings_chat_room_id_foreign` ON `user_chat_settings` (`chat_room_id`);--> statement-breakpoint
CREATE INDEX `users_reference_role_id_foreign` ON `users` (`reference_role_id`);--> statement-breakpoint
CREATE INDEX `users_doctor_id_foreign` ON `users` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `vendors_doctor_id_foreign` ON `vendors` (`doctor_id`);