-- 0013: Trim the system Doctor role to the clinical-core template (D3,
-- ROLE_MODEL_PLAN.md). The seed used to grant the Doctor role every
-- permission, which neutralized the 5-perm default applied at doctor
-- creation (signup / super-admin / clinic staff): getUserPermissions unions
-- role + direct grants, so every doctor inherited the full 13-module set
-- through the role regardless of their direct grants.
--
-- This narrows only the SYSTEM Doctor role (roles.doctor_id IS NULL);
-- per-clinic custom roles and users' direct grants (what the super-admin
-- permissions dialog edits) are untouched. Re-runnable: the DELETE removes
-- exactly what the INSERT restores, and INSERT IGNORE dedupes the PK.

DELETE rhp FROM role_has_permissions rhp
  JOIN roles r ON r.id = rhp.role_id
  WHERE r.name = 'Doctor' AND r.doctor_id IS NULL
    AND rhp.permission_id NOT IN (
      SELECT p.id FROM permissions p
      WHERE p.name IN (
        'dashboard', 'dashboard-view',
        'appointments',
        'appointments-list', 'appointments-create', 'appointments-edit',
        'appointments-delete', 'appointments-cancel', 'appointments-complete',
        'schedule',
        'schedule-list', 'schedule-create', 'schedule-edit', 'schedule-delete',
        'follow-up', 'follow-up-list', 'follow-up-status-update',
        'support', 'support-view'
      )
    );

--> statement-breakpoint

INSERT IGNORE INTO role_has_permissions (permission_id, role_id)
  SELECT p.id, r.id FROM permissions p
  CROSS JOIN roles r
  WHERE r.name = 'Doctor' AND r.doctor_id IS NULL
    AND p.name IN (
      'dashboard', 'dashboard-view',
      'appointments',
      'appointments-list', 'appointments-create', 'appointments-edit',
      'appointments-delete', 'appointments-cancel', 'appointments-complete',
      'schedule',
      'schedule-list', 'schedule-create', 'schedule-edit', 'schedule-delete',
      'follow-up', 'follow-up-list', 'follow-up-status-update',
      'support', 'support-view'
    );
