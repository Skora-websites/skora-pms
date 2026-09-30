/**
 * Minimal SQL migration runner — applies `drizzle/*.sql` in filename order,
 * tracking applied files in a `migration_log` table (created on demand).
 *
 *   npx tsx scripts/migrate.ts            # apply pending migrations
 *   npx tsx scripts/migrate.ts --status   # list applied / pending
 *
 * Idempotent: each file runs at most once, recorded by filename. Files are
 * NOT wrapped in a transaction (MySQL DDL is non-transactional anyway), so a
 * partially-applied file must be fixed by hand — each file is written to be
 * re-runnable where safe.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "drizzle");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  const statusOnly = process.argv.includes("--status");

  await conn.execute(
    `CREATE TABLE IF NOT EXISTS migration_log (
       id INT UNSIGNED NOT NULL AUTO_INCREMENT,
       filename VARCHAR(255) NOT NULL,
       applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       UNIQUE KEY migration_log_filename_unique (filename)
     )`
  );

  const [appliedRows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT filename FROM migration_log ORDER BY id`
  );
  const applied = new Set(appliedRows.map((r) => r.filename as string));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql") && /^\d{4}_/.test(f))
    .sort();

  const pending = files.filter((f) => !applied.has(f));

  if (statusOnly) {
    console.log("Applied:");
    for (const f of files.filter((f) => applied.has(f))) console.log(`  ✓ ${f}`);
    console.log("Pending:");
    for (const f of pending) console.log(`  • ${f}`);
    await conn.end();
    return;
  }

  if (pending.length === 0) {
    console.log("No pending migrations.");
    await conn.end();
    return;
  }

  for (const file of pending) {
    const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    // drizzle-kit files separate statements with `--> statement-breakpoint`
    // comments; hand-written files are plain SQL. Strip the markers and run
    // statement-by-statement so a failure pinpoints the exact statement.
    const statements = raw
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    process.stdout.write(`Applying ${file} (${statements.length} stmts) … `);
    try {
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      await conn.execute(`INSERT INTO migration_log (filename) VALUES (?)`, [file]);
      console.log("done");
    } catch (err) {
      console.log("FAILED");
      console.error(err instanceof Error ? err.message : err);
      console.error(`\nStopped at ${file}. Fix and re-run (the file must be made re-runnable).`);
      await conn.end();
      process.exit(1);
    }
  }

  const [after] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM migration_log`
  );
  console.log(`\nAll migrations applied (${Number((after[0] as { n: number }).n)} tracked).`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
