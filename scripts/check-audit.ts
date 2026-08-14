/**
 * Verify audit_logs table contents (dev utility).
 * Run: npx tsx scripts/check-audit.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "mysql://root@127.0.0.1:3306/skoracares_db");
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: url.username,
    password: url.password,
    database: url.pathname.replace(/^\//, ""),
  });

  const [rows] = await conn.query(
    "SELECT id, user_id, action, ip_address, created_at FROM audit_logs ORDER BY id DESC LIMIT 10"
  );
  console.table(rows);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});