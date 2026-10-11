// Schema-consistency check against the live database (node scripts/check-db-schema.mjs).
// Guards the two schema-hygiene findings that had no automated net (G-06, G-07):
//   1. every .sql file in drizzle/ is a real migration — no silently inert strays (F-16)
//   2. one table collation across the schema, no per-column divergence (F-17)
// Exit code 1 on any violation, so it can run in CI.
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import mysql from "mysql2/promise";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "drizzle");
// Deliberate binary-collation columns (JSON blobs compared byte-wise) — the
// only allowed divergence from the schema default.
const ALLOWED_COLUMN_COLLATIONS = new Set(["utf8mb4_uca1400_ai_ci", "utf8mb4_bin"]);

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`✗ ${msg}`);
};

// ── 1. Migration-runner integrity ────────────────────────────────────
const sqlFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
const strays = sqlFiles.filter((f) => !/^\d{4}_/.test(f));
if (strays.length > 0) {
  fail(
    `${strays.length} non-migration .sql file(s) in drizzle/ are never applied by scripts/migrate.ts: ${strays.join(", ")}` +
      ` — archive them (docs/archive/drizzle-superseded/README.md) or name them NNNN_*.sql`
  );
} else {
  console.log("✓ every .sql in drizzle/ is a numbered migration");
}

// ── 2. Collation uniformity ─────────────────────────────────────────
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const conn = await mysql.createConnection(url);

const [tables] = await conn.query(
  `SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`
);
const wrongTables = tables.filter((t) => t.TABLE_COLLATION !== "utf8mb4_uca1400_ai_ci");
if (wrongTables.length > 0) {
  fail(
    `${wrongTables.length} table(s) off the default collation utf8mb4_uca1400_ai_ci: ` +
      wrongTables.map((t) => `${t.TABLE_NAME} (${t.TABLE_COLLATION})`).join(", ")
  );
} else {
  console.log(`✓ all ${tables.length} tables on utf8mb4_uca1400_ai_ci`);
}

const [columns] = await conn.query(
  `SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND COLLATION_NAME IS NOT NULL`
);
const wrongCols = columns.filter((c) => !ALLOWED_COLUMN_COLLATIONS.has(c.COLLATION_NAME));
if (wrongCols.length > 0) {
  fail(
    `${wrongCols.length} column(s) with an unexpected collation: ` +
      wrongCols.map((c) => `${c.TABLE_NAME}.${c.COLUMN_NAME} (${c.COLLATION_NAME})`).join(", ")
  );
} else {
  console.log(`✓ no column-level collation divergence (utf8mb4_bin allowed as deliberate)`);
}

// ── 3. Staff link-column integrity (F-06) ───────────────────────────
// A receptionist row must carry a link in at least one of the two link
// columns, or every staff read path (which filters reference_role_id)
// silently drops it. A CHECK constraint can't enforce this on MariaDB —
// both columns are self-referencing FKs and MariaDB rejects CHECK
// expressions over FK columns — so it's asserted here instead.
const [orphanStaff] = await conn.query(
  `SELECT id, email FROM users
   WHERE role = 'receptionist' AND reference_role_id IS NULL AND doctor_id IS NULL`
);
if (orphanStaff.length > 0) {
  fail(
    `${orphanStaff.length} receptionist row(s) with BOTH link columns NULL (invisible to all staff queries): ` +
      orphanStaff.map((r) => `#${r.id} ${r.email}`).join(", ")
  );
} else {
  console.log("✓ every receptionist row has a staff link (reference_role_id or doctor_id)");
}

await conn.end();

if (failures > 0) {
  console.error(`check-db-schema: ${failures} failure(s)`);
  process.exit(1);
}
console.log("check-db-schema: all checks passed");
