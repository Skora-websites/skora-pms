const mysql = require("mysql2/promise");
(async () => {
  const c = await mysql.createConnection({ host: "127.0.0.1", port: 3307, user: "root", password: "", database: "skoracares_db" });
  const [r] = await c.query("select r.name as role, count(*) as n from users u join model_has_roles m on m.model_id = u.id join roles r on r.id = m.role_id group by r.name order by n desc");
  console.log(JSON.stringify(r));
  await c.end();
})().catch(e => { console.log("ERR", e.message); process.exit(1); });
