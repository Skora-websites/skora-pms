/**
 * Quick DB connectivity check (dev utility).
 *   npx tsx scripts/check-db.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  // Connect without a database to list databases.
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.slice(1);
  url.pathname = "";

  const c = await mysql.createConnection(url.toString());
  const [dbs] = await c.query("SHOW DATABASES");
  console.log("Databases:", JSON.stringify(dbs));
  console.log("Configured DB:", dbName);

  // Try connecting to candidate DBs and list their tables.
  for (const candidate of ["skoracares_db", "demo-9_skoracares"]) {
    try {
      const c2 = await mysql.createConnection({
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username || "root"),
        password: url.password ? decodeURIComponent(url.password) : "",
        database: candidate,
      });
      const [tables] = await c2.query("SHOW TABLES");
      const names = (tables as { Tables_in_: string }[]).map((t) => Object.values(t)[0]);
      console.log(`\n${candidate} (${names.length} tables):`);
      console.log(names.slice(0, 30).join(", "));

      // Check for audit_logs
      const [audit] = await c2.query("SHOW TABLES LIKE 'audit_logs'");
      console.log(`audit_logs exists:`, (audit as unknown[]).length > 0);

      // Check for sessions table
      const [sessions] = await c2.query("SHOW TABLES LIKE 'sessions'");
      console.log(`sessions  exists:`, (sessions as unknown[]).length > 0);

      await c2.end();
    } catch (e) {
      console.log(`\n${candidate}: ERROR ${(e as Error).message}`);
    }
  }

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
