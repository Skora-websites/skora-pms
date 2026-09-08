/* Attach Receptionist system role (id=3) to tmp rec so probe mirrors a
   real staff-created receptionist (staff flow attaches practice role). */
const mysql = require("mysql2/promise");

(async () => {
  const c = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");
  await c.query(
    "INSERT INTO model_has_roles (role_id, model_id, model_type) VALUES (3, 152, 'App\\Models\\User')");
  console.log("attached role 3 (Receptionist) to user 152");
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
