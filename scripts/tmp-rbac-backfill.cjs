/* Cleanup probe fixtures + backfill role/perm rows for legacy users.
   Run: node scripts/tmp-rbac-backfill.cjs   (then delete this file) */
const mysql = require("mysql2/promise");

const MODEL_TYPE = "App\\Models\\User"; // placeholder-bound, mysql2 keeps backslashes

(async () => {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3307,
    user: "root",
    password: "",
    database: "skoracares_db",
  });

  // --- 1) remove probe user 152 + its role/perm rows -----------------------
  const [delRoles] = await conn.execute(
    "DELETE FROM model_has_roles WHERE model_id = ? AND model_type = ?",
    [152, MODEL_TYPE]
  );
  const [delPerms] = await conn.execute(
    "DELETE FROM model_has_permissions WHERE model_id = ? AND model_type = ?",
    [152, MODEL_TYPE]
  );
  const [delUser] = await conn.execute(
    "DELETE FROM users WHERE id = ? AND email = ?",
    [152, "tmp-rec-probe@gmail.com"]
  );
  console.log(
    "probe cleanup:",
    delRoles.affectedRows, "role rows,",
    delPerms.affectedRows, "perm rows,",
    delUser.affectedRows, "user"
  );

  // --- 2) inventory: role users missing an attached spatie role ------------
  const [missingRoles] = await conn.query(
    `SELECT u.id, u.email, u.role FROM users u
     LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = ?
     WHERE u.role IN ('doctor','receptionist') AND mhr.model_id IS NULL`,
    [MODEL_TYPE]
  );
  console.log("staff users with no attached role:", missingRoles.length);
  for (const u of missingRoles) console.log("  -", u.id, u.email, u.role);

  // --- 3) inventory: doctors missing direct module perms -------------------
  const [missingPerms] = await conn.query(
    `SELECT u.id, u.email FROM users u
     LEFT JOIN model_has_permissions mhp ON mhp.model_id = u.id AND mhp.model_type = ?
     WHERE u.role = 'doctor' AND mhp.model_id IS NULL`,
    [MODEL_TYPE]
  );
  console.log("doctors with no direct perms:", missingPerms.length);

  if (process.argv.includes("--apply")) {
    // attach Receptionist/Doctor system role by name
    const [roles] = await conn.query(
      "SELECT id, name FROM roles WHERE name IN ('Doctor','Receptionist')"
    );
    const roleId = Object.fromEntries(roles.map((r) => [r.name, r.id]));

    for (const u of missingRoles) {
      const name = u.role === "doctor" ? "Doctor" : "Receptionist";
      if (!roleId[name]) { console.log("  no role row:", name); continue; }
      await conn.execute(
        "INSERT INTO model_has_roles (role_id, model_id, model_type) VALUES (?,?,?)",
        [roleId[name], u.id, MODEL_TYPE]
      );
      console.log("  attached", name, "to", u.email);
    }

    // grant the standard 13 module perms to doctors lacking any
    const [perms] = await conn.query(
      `SELECT id, name FROM permissions
       WHERE name IN ('dashboard','registrations','appointments','billing','follow-ups',
         'income-expense','prescriptions','schedule','staff','test-bookings','faq','support','settings')`
    );
    if (perms.length) {
      for (const u of missingPerms) {
        for (const p of perms) {
          await conn.execute(
            "INSERT INTO model_has_permissions (permission_id, model_id, model_type) VALUES (?,?,?)",
            [p.id, u.id, MODEL_TYPE]
          );
        }
        console.log("  granted", perms.length, "perms to", u.email);
      }
    }
  } else {
    console.log("(dry-run) re-run with --apply to fix");
  }

  await conn.end();
})().catch((e) => { console.error(e); process.exit(1); });
