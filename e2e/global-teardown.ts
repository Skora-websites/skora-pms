import mysql from "mysql2/promise";
import { ACCOUNTS, DB } from "./test-env";

/**
 * Restore shared fixtures the suite mutated while running.
 *
 * Specs opt the shared seeded doctor into extra modules via
 * grantDoctorModules(), which writes direct `model_has_permissions` rows for
 * ACCOUNTS.doctor. The Doctor role's 19 role-level grants are untouched, so
 * revoking the direct rows after the run restores the seeded effective
 * permission set (5 modules, 19 perms) — the fixture state the Phase 1
 * security assertions depend on (audit §12.1).
 *
 * The super-admin permission-dialog test no longer targets the shared
 * doctor at all (it creates its own), but this teardown also covers that
 * path in case a future spec saves grants against the shared account.
 */
export default async function globalTeardown() {
  const conn = await mysql.createConnection({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password,
    database: DB.database,
  });
  try {
    const [rows] = await conn.query("SELECT id FROM users WHERE email = ?", [
      ACCOUNTS.doctor,
    ]);
    const userId = (rows as { id: number }[])[0]?.id;
    if (userId) {
      await conn.execute("DELETE FROM model_has_permissions WHERE model_id = ?", [
        userId,
      ]);
    }
  } finally {
    await conn.end();
  }
}
