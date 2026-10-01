-- Follow-up reminders: receptionist/doctor-created follow-up call list entries.
-- Distinct from consultation follow-ups (consultations.follow_up_date set during
-- a consultation) — this table holds reminders created proactively from the
-- Follow-ups page (e.g. receptionist schedules a call for a patient).
CREATE TABLE `follow_up_reminders` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`doctor_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`follow_up_date` date NOT NULL,
	`note` text,
	`status` varchar(255) DEFAULT 'pending',
	`created_by` bigint NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp,
	CONSTRAINT `follow_up_reminders_id` PRIMARY KEY(`id`),
	CONSTRAINT `follow_up_reminders_doctor_id` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `follow_up_reminders_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `follow_up_reminders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	KEY `follow_up_reminders_doctor_id_index` (`doctor_id`),
	KEY `follow_up_reminders_patient_id_index` (`patient_id`),
	KEY `follow_up_reminders_follow_up_date_index` (`follow_up_date`)
);
