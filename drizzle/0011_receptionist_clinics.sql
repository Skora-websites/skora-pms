-- 0011: Receptionist per-clinic assignment (role model G4).
--
-- A receptionist is anchored to a practice-owner doctor (users.doctor_id)
-- but must only operate the clinic(s) the business owner assigns. This table
-- maps receptionist users to doctor_clinics rows; scope checks filter on it.
-- Backfill preserves current behavior: every existing receptionist gets a row
-- for every clinic their anchoring doctor owns or has joined, so nothing
-- changes until an owner edits the assignments.
--
-- Re-runnable: CREATE TABLE IF NOT EXISTS + idempotent backfill.

CREATE TABLE IF NOT EXISTS receptionist_clinics (
  id bigint NOT NULL AUTO_INCREMENT,
  receptionist_id bigint NOT NULL,
  clinic_id bigint NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY receptionist_clinics_pair_unique (receptionist_id, clinic_id),
  KEY receptionist_clinics_clinic_idx (clinic_id),
  CONSTRAINT receptionist_clinics_receptionist_fk FOREIGN KEY (receptionist_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT receptionist_clinics_clinic_fk FOREIGN KEY (clinic_id)
    REFERENCES doctor_clinics (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
--> statement-breakpoint
-- Backfill: receptionist -> every clinic owned by their anchoring doctor.
INSERT IGNORE INTO receptionist_clinics (receptionist_id, clinic_id, is_active)
SELECT r.id, dc.id, 1
FROM users r
JOIN users owner ON owner.id = COALESCE(r.doctor_id, r.reference_role_id)
JOIN doctor_clinics dc ON dc.doctor_id = owner.id
WHERE r.role = 'receptionist'
--> statement-breakpoint
-- Backfill (cont.): clinics the anchoring doctor has joined as a member.
INSERT IGNORE INTO receptionist_clinics (receptionist_id, clinic_id, is_active)
SELECT r.id, cd.clinic_id, 1
FROM users r
JOIN users owner ON owner.id = COALESCE(r.doctor_id, r.reference_role_id)
JOIN clinic_doctors cd ON cd.doctor_id = owner.id AND cd.is_active = 1
WHERE r.role = 'receptionist'
