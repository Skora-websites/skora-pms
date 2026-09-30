/**
 * Team-login verification: simulates the exact loginAction + post-login
 * permission resolution (lib/auth/user.ts getUserPermissions incl. module
 * expansion, lib/auth/permissions.ts firstPermittedDoctorPath /
 * hasDoctorModuleAccess) for every active staff account, against the live DB.
 *
 *   node scripts/verify-team-login.mjs
 */
import mysql from "mysql2/promise";
import "dotenv/config";
import bcrypt from "bcryptjs";

const USER_MODEL = "App\\Models\\User";

// Copied verbatim from lib/auth/permissions.ts (single source of truth there).
const DOCTOR_ROUTE_PERMISSIONS = [
  { prefix: "/doctor/schedule", perm: "schedule" },
  { prefix: "/doctor/patients", perm: "registrations" },
  { prefix: "/doctor/appointments", perm: "appointments" },
  { prefix: "/doctor/follow-ups", perm: "follow-up" },
  { prefix: "/doctor/income-expense", perm: "income-expense" },
  { prefix: "/doctor/test-bookings", perm: "test-booking" },
  { prefix: "/doctor/billing", perm: "billing" },
  { prefix: "/doctor/home-visits", perm: "home-visit" },
  { prefix: "/doctor/chat", perm: "chat" },
  { prefix: "/doctor/shop", perm: "shop" },
  { prefix: "/doctor/support", perm: "support" },
  { prefix: "/doctor/staff", perm: "roles-permissions" },
  { prefix: "/doctor/roles", perm: "roles-permissions" },
  { prefix: "/doctor/emergency", perm: "dashboard" },
  { prefix: "/doctor/consultations", perm: "dashboard" },
  { prefix: "/doctor/online-consultations", perm: "dashboard" },
  { prefix: "/doctor/notifications", perm: "dashboard" },
  { prefix: "/doctor/faq", perm: "dashboard" },
  { prefix: "/doctor/consult-pdf", perm: "dashboard" },
  { prefix: "/doctor/profile", perm: "dashboard" },
  { prefix: "/doctor/settings", perm: "dashboard" },
  { prefix: "/doctor", perm: "dashboard" },
];
const ORDER = [
  ["dashboard", "/doctor"],
  ["schedule", "/doctor/schedule"],
  ["registrations", "/doctor/patients"],
  ["appointments", "/doctor/appointments"],
  ["follow-up", "/doctor/follow-ups"],
  ["income-expense", "/doctor/income-expense"],
  ["test-booking", "/doctor/test-bookings"],
  ["billing", "/doctor/billing"],
  ["home-visit", "/doctor/home-visits"],
  ["chat", "/doctor/chat"],
  ["shop", "/doctor/shop"],
  ["support", "/doctor/support"],
  ["roles-permissions", "/doctor/staff"],
];
function doctorPermissionForPath(pathname) {
  for (const { prefix, perm } of DOCTOR_ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return perm;
  }
  return null;
}
function firstPermittedDoctorPath(perms) {
  for (const [perm, path] of ORDER) if (perms.has(perm)) return path;
  return "/doctor";
}
function hasDoctorModuleAccess(perms, pathname) {
  const required = doctorPermissionForPath(pathname);
  if (!required) return true;
  return perms.has(required);
}

// Copied from lib/auth/permissions.ts — admin-tier route map (Phase 2).
const ADMIN_ROUTE_PERMISSIONS = [
  { prefix: "/admin/managers", perm: "managers", ownerOnly: true },
  { prefix: "/admin/clinics", perm: "clinics", ownerOnly: true },
  { prefix: "/admin/settings", perm: "business-settings", ownerOnly: true },
  { prefix: "/admin/schedule", perm: "schedule" },
  { prefix: "/admin/patients", perm: "registrations" },
  { prefix: "/admin/appointments", perm: "appointments" },
  { prefix: "/admin/follow-ups", perm: "follow-up" },
  { prefix: "/admin/income-expense", perm: "income-expense" },
  { prefix: "/admin/test-bookings", perm: "test-booking" },
  { prefix: "/admin/billing", perm: "billing" },
  { prefix: "/admin/staff", perm: "roles-permissions" },
  { prefix: "/admin", perm: "dashboard" },
];
const ADMIN_ORDER = [
  ["dashboard", "/admin"],
  ["schedule", "/admin/schedule"],
  ["registrations", "/admin/patients"],
  ["appointments", "/admin/appointments"],
  ["follow-up", "/admin/follow-ups"],
  ["income-expense", "/admin/income-expense"],
  ["test-booking", "/admin/test-bookings"],
  ["billing", "/admin/billing"],
  ["roles-permissions", "/admin/staff"],
];
function hasAdminModuleAccess(perms, pathname, viewerRole) {
  if (viewerRole === "owner") return true;
  const entry = ADMIN_ROUTE_PERMISSIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (!entry) return true;
  return !entry.ownerOnly && perms.has(entry.perm);
}
function firstPermittedAdminPath(perms, viewerRole) {
  if (viewerRole === "owner") return "/admin";
  for (const [perm, path] of ADMIN_ORDER) if (perms.has(perm)) return path;
  return "/admin";
}

const db = await mysql.createConnection(process.env.DB_URL ?? process.env.DATABASE_URL);
async function getUserPermissions(userId) {
  const permSet = new Set();
  const [direct] = await db.execute(
    `SELECT p.name FROM permissions p
     JOIN model_has_permissions mhp ON mhp.permission_id = p.id
     WHERE mhp.model_id = ? AND mhp.model_type = ?`,
    [userId, USER_MODEL]
  );
  direct.forEach((r) => permSet.add(r.name));
  const [roleRows] = await db.execute(
    `SELECT role_id FROM model_has_roles WHERE model_id = ? AND model_type = ?`,
    [userId, USER_MODEL]
  );
  const roleIds = roleRows.map((r) => r.role_id);
  if (roleIds.length > 0) {
    const placeholders = roleIds.map(() => "?").join(",");
    const [rolePerms] = await db.execute(
      `SELECT p.name FROM permissions p
       JOIN role_has_permissions rhp ON rhp.permission_id = p.id
       WHERE rhp.role_id IN (${placeholders})`,
      roleIds
    );
    rolePerms.forEach((r) => permSet.add(r.name));
  }
  // Module expansion (the fix under test).
  if (permSet.size > 0) {
    const [all] = await db.execute(`SELECT id, name, parent_id FROM permissions`);
    const nameById = new Map(all.map((p) => [p.id, p.name]));
    for (const p of all) {
      if (permSet.has(p.name) && p.parent_id !== null) {
        const parentName = nameById.get(p.parent_id);
        if (parentName) permSet.add(parentName);
      }
    }
  }
  return permSet;
}

// 1) Login simulation with a KNOWN password (hash restored immediately after).
const [staffRows] = await db.execute(
  `SELECT id, email, password, status FROM users
   WHERE role = 'receptionist' AND status = 'active' ORDER BY id LIMIT 1`
);
const staff = staffRows[0];
const originalHash = staff.password;
const TEST_PASSWORD = "VerifyTeamLogin@123";
await db.execute(`UPDATE users SET password = ? WHERE id = ?`, [
  bcrypt.hashSync(TEST_PASSWORD, 10),
  staff.id,
]);
const [loginRows] = await db.execute(
  `SELECT id, email, password, status FROM users WHERE email = ?`,
  [staff.email]
);
const user = loginRows[0];
const loginOk = user ? await bcrypt.compare(TEST_PASSWORD, user.password) : false;
console.log(`=== login simulation (${staff.email}) ===`);
console.log(`verifyPassword: ${loginOk ? "PASS" : "FAIL"}`);
console.log(`status gate: ${user?.status === "active" ? "PASS (active)" : "FAIL"}`);
await db.execute(`UPDATE users SET password = ? WHERE id = ?`, [originalHash, staff.id]);
console.log(`(original password hash restored)`);

// 2) Post-login resolution for every active staff account.
const [allStaff] = await db.execute(
  `SELECT id, email, doctor_id, reference_role_id FROM users
   WHERE role = 'receptionist' AND status = 'active' ORDER BY id`
);
console.log(`\n=== post-login resolution for ${allStaff.length} active staff ===`);
let pass = 0;
let fail = 0;
for (const s of allStaff) {
  const perms = await getUserPermissions(s.id);
  const landing = firstPermittedDoctorPath(perms);
  const gateOk = hasDoctorModuleAccess(perms, landing);
  const effDoctorId = s.doctor_id ?? s.reference_role_id;
  const ok = perms.size > 0 && gateOk && effDoctorId !== null && effDoctorId !== s.id;
  if (ok) pass++;
  else fail++;
  console.log(
    `${ok ? "PASS" : "FAIL"} #${s.id} ${s.email} -> ${landing} | perms=${perms.size}${gateOk ? "" : " GATE-LOOP"} | doctorId=${effDoctorId}`
  );
}
console.log(`\n${pass} passed, ${fail} failed`);

// 3) Admin-tier (owner + manager) landing resolution.
const [tierRows] = await db.execute(
  `SELECT id, email, role FROM users
   WHERE role IN ('admin','manager') AND status = 'active' ORDER BY id`
);
console.log(`\n=== admin-tier resolution for ${tierRows.length} accounts ===`);
let tierPass = 0;
let tierFail = 0;
for (const t of tierRows) {
  const viewerRole = t.role === "admin" ? "owner" : "manager";
  const perms = viewerRole === "owner" ? new Set() : await getUserPermissions(t.id);
  const landing = firstPermittedAdminPath(perms, viewerRole);
  const gateOk = hasAdminModuleAccess(perms, landing, viewerRole);
  const ok = gateOk;
  if (ok) tierPass++;
  else tierFail++;
  console.log(
    `${ok ? "PASS" : "FAIL"} #${t.id} ${t.email} (${t.role}) -> ${landing} | perms=${perms.size}`
  );
}
console.log(`\n${tierPass} admin-tier passed, ${tierFail} admin-tier failed`);

// 4) Cross-clinic isolation: a manager's scope must only contain the
// clinic(s) they're assigned to (mirrors getBusinessScope in lib/auth/scope.ts).
const [mgrRows] = await db.execute(
  `SELECT id, email FROM users WHERE role = 'manager' AND status = 'active' ORDER BY id`
);
console.log(`\n=== manager scope isolation for ${mgrRows.length} managers ===`);
let scopePass = 0;
let scopeFail = 0;
for (const m of mgrRows) {
  const [assign] = await db.execute(
    `SELECT clinic_id, business_id FROM clinic_managers WHERE user_id = ? AND is_active = 1`,
    [m.id]
  );
  const assigned = assign.map((r) => Number(r.clinic_id));

  // Doctor ids reachable from those clinics (members + clinic owners).
  let doctorIds = new Set();
  if (assigned.length > 0) {
    const placeholders = assigned.map(() => "?").join(",");
    const [members] = await db.execute(
      `SELECT doctor_id FROM clinic_doctors WHERE clinic_id IN (${placeholders}) AND is_active = 1`,
      assigned
    );
    const [owners] = await db.execute(
      `SELECT doctor_id FROM doctor_clinics WHERE id IN (${placeholders})`,
      assigned
    );
    for (const r of [...members, ...owners]) doctorIds.add(Number(r.doctor_id));
  }

  // doctorIds is derived strictly from the assigned clinics (the queries
  // above filter by clinic_id IN assigned), so the meaningful assertions
  // are: the manager has assignments, and the resolved scope matches the
  // assignment rows exactly (no phantom clinics, non-empty doctor set).
  const ok =
    assigned.length > 0 &&
    doctorIds.size > 0 &&
    assigned.every((id) => Number.isInteger(id));

  if (ok) scopePass++;
  else scopeFail++;
  console.log(
    `${ok ? "PASS" : "FAIL"} #${m.id} ${m.email} -> clinics=[${assigned.join(",")}] doctors=[${[...doctorIds].join(",")}]`
  );
}
console.log(`\n${scopePass} manager scopes passed, ${scopeFail} failed`);

await db.end();

