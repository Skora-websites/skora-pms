const mysql = require("mysql2/promise");
(async () => {
  const conn = await mysql.createConnection({
    host: "127.0.0.1", port: 3307, user: "root", password: "",
    database: "skoracares_db",
  });
  const [rows] = await conn.query(
    "SELECT id, email, role, status FROM users WHERE email IN ('ajeet@gmail.com','skorasofsdt@gmail.com')"
  );
  console.log(rows);
  await conn.end();
})().catch((e) => { console.error(e); process.exit(1); });
