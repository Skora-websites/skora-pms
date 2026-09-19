-- Receptionist panel restricted to: Schedule, Registration, Appointment,
-- Test, Follow-up (+ Dashboard so they can land on /doctor).
--   1. System "Receptionist" role (doctor_id NULL) gets exactly these modules
--      (parents + their children).
--   2. Existing receptionist users' direct grants (model_has_permissions) are
--      trimmed to the same set — they keep whatever their role grants, but
--      direct over-grants (e.g. full copies of the owner's permissions) go.

-- The allowed set: parents 1, 9, 14, 19, 38, 58 and their children.
DELETE mhp FROM model_has_permissions mhp
JOIN users u ON u.id = mhp.model_id AND mhp.model_type = 'App\\Models\\User'
LEFT JOIN permissions p ON p.id = mhp.permission_id
  AND (p.id IN (1, 9, 14, 19, 38, 58) OR p.parent_id IN (1, 9, 14, 19, 38, 58))
WHERE u.role = 'receptionist' AND p.id IS NULL;

DELETE rhp FROM role_has_permissions rhp
JOIN roles r ON r.id = rhp.role_id AND r.doctor_id IS NULL AND r.name = 'Receptionist'
LEFT JOIN permissions p ON p.id = rhp.permission_id
  AND (p.id IN (1, 9, 14, 19, 38, 58) OR p.parent_id IN (1, 9, 14, 19, 38, 58))
WHERE p.id IS NULL;

INSERT IGNORE INTO role_has_permissions (permission_id, role_id)
SELECT p.id, 3 FROM permissions p
WHERE (p.id IN (1, 9, 14, 19, 38, 58) OR p.parent_id IN (1, 9, 14, 19, 38, 58));
