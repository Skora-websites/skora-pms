/* Replicate getUserPermissions for user 152 exactly as the app queries it. */
const mysql = require("mysql2/promise");

(async () => {
  const c = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");
  const [rows] = await c.query(
    "SELECT p.name FROM permissions p JOIN model_has_permissions mp ON mp.permission_id=p.id WHERE mp.model_id=152 AND mp.model_type='App\\Models\\User'");
  console.log("direct perms:", rows.map((r) => r.name).join(", ") || "(none)");
  const [roleRows] = await c.query(
    "SELECT role_id FROM model_has_roles WHERE model_id=152 AND model_type='App\\Models\\User'");
  console.log("role links:", JSON.stringify(roleRows));
  for (const r of roleRows) {
    const [rp] = await c.query(
      "SELECT p.name FROM role_has_permissions rhp JOIN permissions p ON p.id=rhp.permission_id WHERE rhp.role_id=?", [r.role_id]);
    console.log("role", r.role_id, "perms:", rp.map((p) => p.name).join(", "));
  }
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
