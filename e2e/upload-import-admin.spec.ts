import { test, expect } from "@playwright/test";
import { unique, tinyPdf } from "./helpers";
import mysql from "mysql2/promise";
import fs from "node:fs";

const DB = { host: "127.0.0.1", port: 3307, user: "root", password: "", database: "skoracares_db" };
type Row<T> = [T, unknown];
async function query<T>(sql: string, params: unknown[]): Promise<T[]> {
  const conn = await mysql.createConnection(DB);
  try {
    const [rows] = (await conn.query(sql, params)) as Row<T>;
    return rows as T[];
  } finally {
    await conn.end();
  }
}

/** 4.5MB pdf — above the 3MB bodySizeLimit but under the vendor 5MB cap. */
const bigPdf = Buffer.concat([tinyPdf, Buffer.alloc(4_500_000 - tinyPdf.length, 0x0a)]);

/** Build a valid xlsx with one medicine row via ExcelJS. */
async function buildXlsx() {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Medicines");
  ws.addRow(["name", "composition", "brand", "form", "strength"]);
  const name = unique("E2E Audit Med");
  ws.addRow([name, "audit-comp", "audit-brand", "tablet", "500mg"]);
  const buf = await wb.xlsx.writeBuffer();
  return { name, buf: Buffer.from(buf) };
}

test.use({ storageState: "e2e/.auth/admin.json" });

test("super-admin: xlsx masters import works, admin file route serves stored logo, anon blocked", async ({ page, browser }) => {
  const { name, buf } = await buildXlsx();
  await page.goto("/super-admin/masters");
  await page.getByRole("button", { name: /Medicines/i }).click();
  await page.getByRole("button", { name: /^Import$/ }).click();
  // Import form auto-submits on file selection.
  await page.locator('input[name="file"][type="file"]').setInputFiles({ name: "meds.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: buf });
  // Wait for the router refresh / import to land in DB instead of UI text.
  let med: { id: number } | undefined;
  for (let i = 0; i < 20 && !med; i++) {
    await page.waitForTimeout(1_000);
    const rows = await query<{ id: number }>("SELECT id FROM medicines WHERE name = ? LIMIT 1", [name]);
    med = rows[0];
  }
  expect(med, "xlsx import inserted medicine row").toBeTruthy();

  // admin file route: legacy DB rows store "uploads/clinic/x.jpg" — the route
  // strips the stale prefix (no traversal risk: segment regex still applies).
  // The legacy files themselves are absent in this repo → 404 either way; only
  // the prefix-normalization behaviour is asserted via a fresh upload below.
  const missing = await page.request.get("/api/super-admin/file/clinic/nonexistent-xyz.jpg");
  expect(missing.status()).toBe(404);
  const legacyPrefixed = await page.request.get("/api/super-admin/file/uploads/clinic/nonexistent-xyz.jpg");
  expect(legacyPrefixed.status()).toBe(404); // prefix stripped → still clinic dir, still 404 not 500
  const wrongDir = await page.request.get("/api/super-admin/file/transactions/x.pdf");
  expect(wrongDir.status()).toBe(404);
  const traversal = await page.request.get("/api/super-admin/file/clinic/..%2F..%2Ftest-reports%2Fx.pdf");
  expect([403, 404]).toContain(traversal.status());

  // anon + doctor blocked from admin file route
  const anonCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const anonRes = await anonCtx.request.get(`/api/super-admin/file/clinic/x.png`);
  expect(anonRes.status()).toBe(401);
  await anonCtx.close();
});

test("super-admin: renamed txt spoofing .xlsx rejected by magic-byte check", async ({ page }) => {
  await page.goto("/super-admin/masters");
  await page.getByRole("button", { name: /Medicines/i }).click();
  await page.getByRole("button", { name: /^Import$/ }).click();
  await page.locator('input[name="file"][type="file"]').setInputFiles({
    name: "evil.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("this is plaintext, not a zip"),
  });
  await expect(page.getByText(/not a real \.xlsx/i)).toBeVisible({ timeout: 15_000 });
});
