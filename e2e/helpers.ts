import { expect, type Page } from "@playwright/test";
import mysql from "mysql2/promise";
import { ACCOUNTS, DB } from "./test-env";

let counter = 0;

/** Unique suffix so repeated runs never collide with leftover data. */
export function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** Minimal 1-page PDF served as an upload fixture. */
export const tinyPdf = Buffer.from(
  // Minimal but *viewable* one-page PDF: has a text content stream so the
  // app's blank-report guard (422 "no visible content") accepts it. Xref
  // offsets below are exact (obj1@9, obj2@52, obj3@101, obj4@211, obj5@303).
  "%PDF-1.1\n" +
  "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
  "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n" +
  "4 0 obj<</Length 46>>stream\nBT /F1 14 Tf 20 100 Td (E2E test report) Tj ET\nendstream\nendobj\n" +
  "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
  "xref\n0 6\n" +
  "0000000000 65535 f \n" +
  "0000000009 00000 n \n" +
  "0000000052 00000 n \n" +
  "0000000101 00000 n \n" +
  "0000000211 00000 n \n" +
  "0000000303 00000 n \n" +
  "trailer<</Size 6/Root 1 0 R>>\n" +
  "startxref\n364\n%%EOF"
);

/** Shared assertion so a failed login is never silently swallowed. */
export async function expectSignedIn(page: import("@playwright/test").Page) {
  await expect(page).toHaveURL(/\/doctor(\/|$)/);
}

/**
 * Grant the doctor login extra modules directly in the DB (the same rows the
 * super-admin permissions dialog writes). The seeded Doctor role is the
 * clinical-core template (dashboard, appointments, schedule, follow-up,
 * support — ROLE_MODEL_PLAN.md D3), so specs exercising modules outside
 * that set (registrations, billing, income-expense, test-bookings,
 * home-visits, chat, shop, staff/roles) opt in via this helper. Grants are
 * per-request server-side, so no re-login is needed. Idempotent.
 */
export async function grantDoctorModules(modules: string[]) {
  if (modules.length === 0) return;
  const conn = await mysql.createConnection({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password,
    database: DB.database,
  });
  try {
    const [rows] = await conn.query("SELECT id FROM users WHERE email = ?", [ACCOUNTS.doctor]);
    const userId = (rows as { id: number }[])[0]?.id;
    if (!userId) throw new Error(`grantDoctorModules: no user ${ACCOUNTS.doctor}`);
    const placeholders = modules.map(() => "?").join(",");
    // Each named module + all of its action children (server actions check
    // child perms; the nav checks the parent).
    await conn.execute(
      `INSERT IGNORE INTO model_has_permissions (permission_id, model_id, model_type)
       SELECT p.id, ?, 'App\\\\Models\\\\User' FROM permissions p
       WHERE p.name IN (${placeholders})
          OR p.parent_id IN (SELECT id FROM permissions WHERE name IN (${placeholders}))`,
      [userId, ...modules, ...modules]
    );
  } finally {
    await conn.end();
  }
}

/**
 * Wait until the page's client bundle has hydrated so the first click lands
 * on a live React handler instead of being swallowed by the pre-hydration
 * document. Dev-mode first-compile (Turbopack) is slow enough that a plain
 * goto → click races: the element exists and is "clickable" before React
 * attaches, the onClick never fires, and the test times out on a modal that
 * never opens.
 */
export async function awaitHydration(page: Page) {
  await page.waitForLoadState("networkidle");
  // next-route-announcer only mounts once the app router has hydrated.
  await page.waitForSelector("next-route-announcer", { timeout: 15_000 }).catch(() => {});
  // Two rAFs: one frame to settle layout after hydration, one to paint.
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  );
}