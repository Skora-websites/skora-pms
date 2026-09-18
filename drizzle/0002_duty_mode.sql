-- "I'm on duty" duty-mode feature: the doctor declares availability as
--   At clinic / Home visits / Both / Off duty
-- stored as two independent booleans (clinic + home visit) so future UI can
-- badge each duty type separately. `on_duty` (SOS emergency dispatch) remains
-- a separate, unrelated toggle.
ALTER TABLE `users`
  ADD COLUMN `clinic_on_duty` BOOLEAN NOT NULL DEFAULT FALSE AFTER `on_duty`,
  ADD COLUMN `home_visit_on_duty` BOOLEAN NOT NULL DEFAULT FALSE AFTER `clinic_on_duty`;
