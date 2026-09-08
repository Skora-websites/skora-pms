const m = require("mysql2/promise");
(async () => {
  const c = await m.createConnection({ host: "127.0.0.1", port: 3307, user: "root", password: "", database: "skoracares_db" });
  const [cols] = await c.query("show columns from notifications");
  console.log("COLS", cols.map((x) => x.Field).join(", "));
  const [rows] = await c.query("select * from notifications order by id desc limit 2");
  console.log("SAMPLE", JSON.stringify(rows, null, 1));
  await c.end();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
