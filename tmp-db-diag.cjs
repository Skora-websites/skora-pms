/* Raw dump: model_has_roles for 152 + model_type hex check. */
const mysql = require("mysql2/promise");
(async () => {
  const c = await mysql.createConnection("mysql://root@127.0.0.1:3307/skoracares_db");
  const [r] = await c.query("SELECT role_id, model_id, HEX(model_type) hex, model_type FROM model_has_roles WHERE model_id=152");
  console.log(JSON.stringify(r, null, 1));
  const [s] = await c.query("SELECT COUNT(*) n FROM model_has_roles");
  console.log("total rows:", s[0].n);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
