-- 0019: Doctors must never create appointments (product boundary).
-- Reception, managers and owners book on a doctor's behalf; the patient
-- self-booking flow is a separate, unaffected path.
--
-- Two layers:
--   1. Revoke the 'appointments-create' grant from the SYSTEM Doctor role
--      (roles.doctor_id IS NULL), so requireWriteScope no longer admits
--      doctors. Per-clinic custom roles and users' direct grants (what the
--      super-admin permissions dialog edits) are untouched — those owners
--      opted in explicitly.
--   2. create-appointment in app/doctor/appointments/actions.ts also
--      hard-rejects callerRole === "doctor", so this migration is
--      defense-in-depth, not the only gate. Re-runnable.
DELETE rhp FROM role_has_permissions rhp
  JOIN roles r ON r.id = rhp.role_id
  JOIN permissions p ON p.id = rhp.permission_id
  WHERE r.name = 'Doctor' AND r.doctor_id IS NULL
    AND p.name = 'appointments-create';
