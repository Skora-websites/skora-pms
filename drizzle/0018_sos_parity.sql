-- 0018_sos_parity.sql
-- Uber/Ola/Rapido parity fields on the emergency case: live ETA + arrival
-- state, patient-identity OTP, distance for the fare, and a linked bill.
-- All columns are nullable so an in-flight SOS from before this migration
-- keeps working (the UI guards on null).
ALTER TABLE sos_cases
  ADD COLUMN eta_minutes INT NULL,
  ADD COLUMN distance_km DECIMAL(8,2) NULL,
  ADD COLUMN arrived_at TIMESTAMP NULL,
  ADD COLUMN patient_otp VARCHAR(64) NULL,
  ADD COLUMN otp_verified_at TIMESTAMP NULL,
  ADD COLUMN billing_id BIGINT NULL,
  ADD COLUMN rating TINYINT NULL,
  ADD COLUMN rating_note VARCHAR(500) NULL;
--> statement-breakpoint
ALTER TABLE sos_cases ADD CONSTRAINT sos_cases_billing_id_foreign
  FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE sos_cases ADD INDEX sos_cases_arrived_index (arrived_at);
