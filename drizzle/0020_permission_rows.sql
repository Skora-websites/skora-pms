-- 0020: Permission rows for the two admin routes whose gate names did not exist.
--
-- lib/auth/permissions.ts maps /admin/consultations -> "consultations" and
-- /admin/online-consultations -> "online-consultations", but neither name was
-- ever inserted, so both routes could only ever be reached through the owner
-- role bypass — a manager could never be granted them and the nav entry could
-- never light up.
--
-- Children follow the catalogue's existing shape (parent + <parent>-view/
-- create/edit/delete), matching home-visit and chat.
--
-- The rows are attached to the SYSTEM Doctor and Receptionist roles
-- (roles.doctor_id IS NULL) so an already-seeded database gains them without a
-- reseed. scripts/seed.ts carries the same module names for fresh installs.
-- Fully re-runnable: every insert is guarded.
--> statement-breakpoint
-- Parent rows.
INSERT INTO permissions (name, guard_name, parent_id, created_at, updated_at)
SELECT 'consultations', 'web', NULL, NOW(), NOW()
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'consultations');
--> statement-breakpoint
INSERT INTO permissions (name, guard_name, parent_id, created_at, updated_at)
SELECT 'online-consultations', 'web', NULL, NOW(), NOW()
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'online-consultations');
--> statement-breakpoint
-- Child rows, parented dynamically so this does not hard-code ids.
INSERT INTO permissions (name, guard_name, parent_id, created_at, updated_at)
SELECT CONCAT(p.name, '-', c.suffix), 'web', p.id, NOW(), NOW()
  FROM permissions p
  JOIN (SELECT 'view' AS suffix
        UNION ALL SELECT 'create'
        UNION ALL SELECT 'edit'
        UNION ALL SELECT 'delete') c
 WHERE p.name IN ('consultations', 'online-consultations')
   AND NOT EXISTS (
     SELECT 1 FROM permissions existing
      WHERE existing.name = CONCAT(p.name, '-', c.suffix));
--> statement-breakpoint
-- Role grants for the system Doctor and Receptionist roles.
INSERT INTO role_has_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM roles r
  JOIN permissions p ON p.name IN ('consultations', 'online-consultations')
 WHERE r.doctor_id IS NULL
   AND r.name IN ('Doctor', 'Receptionist')
   AND NOT EXISTS (
     SELECT 1 FROM role_has_permissions rhp
      WHERE rhp.role_id = r.id AND rhp.permission_id = p.id);
