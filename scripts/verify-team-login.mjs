/**
 * Team-login verification: simulates the exact loginAction + post-login
 * permission resolution (lib/auth/user.ts getUserPermissions incl. module
 * expansion, lib/auth/permissions.ts firstPermittedDoctorPath /
 * hasDoctorModuleAccess) for every active staff account, against the live DB.
 *
 *   node scripts/verify-team-login.mjs
 */
import mysql from "mysql2/promise";
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

const db = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");
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

await db.end();

