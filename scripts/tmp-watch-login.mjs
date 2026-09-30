/**
 * TEMP login watcher (delete after use). Polls every 2s for 5 minutes:
 *  - new audit_logs rows (id > 536)
 *  - new session rows (last_activity > 1790578511)
 * Baselines captured immediately before launch.
 */
import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.E2E_DB_HOST ?? "127.0.0.1",
  port: Number(process.env.E2E_DB_PORT ?? 3306),
  user: process.env.E2E_DB_USER ?? "root",
  password: process.env.E2E_DB_PASSWORD ?? "",
  database: process.env.E2E_DB_NAME ?? "skoracares_db",
  timezone: "Z",
});

const AUDIT_BASELINE = 536;
const SESSION_BASELINE = 1790578511;
console.log(`watching: audit id > ${AUDIT_BASELINE}, sessions epoch > ${SESSION_BASELINE}`);

for (let i = 0; i < 150; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const [audits] = await conn.query(
    "SELECT id, created_at, action, user_id, metadata FROM audit_logs WHERE id > ? ORDER BY id",
    [AUDIT_BASELINE]
  );
  for (const r of audits) {
    console.log(`AUDIT #${r.id} ${(r.created_at?.toISOString?.() ?? r.created_at)} ${r.action} user=${r.user_id} ${JSON.stringify(r.metadata)}`);
  }
  const [sessions] = await conn.query(
    "SELECT id, user_id, last_activity FROM sessions WHERE last_activity > ? ORDER BY last_activity",
    [SESSION_BASELINE]
  );
  for (const r of sessions) {
    console.log(`SESSION epoch=${r.last_activity} user=${r.user_id}`);
  }
}
console.log("watch window ended");
await conn.end();
