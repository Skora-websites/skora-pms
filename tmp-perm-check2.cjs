/* Do system roles (Doctor/Receptionist) carry role_has_permissions in DB? */
const mysql = require("mysql2/promise");

(async () => {
  const c = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");
  const [roles] = await c.query(
    "SELECT r.id,r.name,r.doctor_id,(SELECT COUNT(*) FROM role_has_permissions rp WHERE rp.role_id=r.id) permCount FROM roles r WHERE r.doctor_id IS NULL");
  console.log("system roles:", roles);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
