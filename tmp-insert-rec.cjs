/* Insert temp receptionist with doctor's known password hash, for login probe.
   Run: node tmp-insert-rec.cjs — deletes any prior temp row first. */
const mysql = require("mysql2/promise");

(async () => {
  const c = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");
  await c.query("DELETE FROM users WHERE email='tmp-rec-probe@gmail.com'");
  const [[doctor]] = await c.query("SELECT password, id FROM users WHERE email='doctor@gmail.com'");
  const [r] = await c.query(
    "INSERT INTO users (name,email,password,role,status,doctor_id,email_verified_at,created_at,updated_at) VALUES (?,?,?,?,?,?,NOW(),NOW(),NOW())",
    ["Temp Rec Probe", "tmp-rec-probe@gmail.com", doctor.password, "receptionist", "active", doctor.id]
  );
  console.log("inserted id", r.insertId);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
