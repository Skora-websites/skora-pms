/* Receptionist role (id=3) permissions — do they include doctor dashboard modules? */
const mysql = require("mysql2/promise");

(async () => {
  const c = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");
  const [perms] = await c.query(
    "SELECT p.name FROM role_has_permissions rp JOIN permissions p ON p.id=rp.permission_id WHERE rp.role_id=3 ORDER BY p.name");
  console.log("Receptionist role perms:", perms.map((p) => p.name).join(", "));
  const [all] = await c.query("SELECT name FROM permissions ORDER BY name");
  console.log("\nall permission names:", all.map((p) => p.name).join(", "));
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
