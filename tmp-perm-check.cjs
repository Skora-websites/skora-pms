/* Check permission wiring for tmp receptionist (id from arg) + how doctor perms granted. */
const mysql = require("mysql2/promise");

(async () => {
  const c = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");
  const id = Number(process.argv[2] || 152);
  const [[dp]] = await c.query(
    "SELECT COUNT(*) n FROM model_has_permissions WHERE model_id=? AND model_type='App\\Models\\User'", [id]);
  const [[rr]] = await c.query(
    "SELECT COUNT(*) n FROM model_has_roles WHERE model_id=? AND model_type='App\\Models\\User'", [id]);
  console.log("tmp rec:", { directPerms: dp.n, roles: rr.n });
  // compare: real receptionists
  const [recs] = await c.query(
    "SELECT u.id,u.email,(SELECT COUNT(*) FROM model_has_permissions mp WHERE mp.model_id=u.id AND mp.model_type='App\\Models\\User') perms,(SELECT COUNT(*) FROM model_has_roles mr WHERE mr.model_id=u.id AND mr.model_type='App\\Models\\User') roles FROM users u WHERE u.role='receptionist' LIMIT 5");
  console.log("receptionists:", recs);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
