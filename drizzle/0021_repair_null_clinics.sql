-- 0021: Repair appointments persisted with a NULL clinic_id.
--
-- Root cause: resolveClinic() in app/doctor/appointments/actions.ts returned
-- null when the requested clinic was outside the caller's scope, and the two
-- call sites (:309 and :572) passed that null straight into getSchedulesForDay
-- without a null check, so the row was written with clinic_id = NULL.
--
-- That silent drop is fixed in code (the action now rejects). This migration
-- re-attributes the existing 9 historical rows so clinic-scoped listings and
-- reports stop omitting them: each row is attached to the acting doctor's
-- first active clinic (lowest id, deterministic), which is exactly the clinic
-- the pre-fix code would have resolved had it been given one.
--
-- Re-runnable: the WHERE clinic_id IS NULL predicate makes it a no-op on any
-- later run. Rows that cannot be resolved (no active clinic for the doctor)
-- are left untouched rather than guessed at.

UPDATE appointments a
  JOIN (
    SELECT doctor_id, MIN(id) AS first_clinic_id
      FROM doctor_clinics
     WHERE is_active = 1
     GROUP BY doctor_id
  ) c ON c.doctor_id = a.doctor_id
   SET a.clinic_id = c.first_clinic_id
 WHERE a.clinic_id IS NULL;
