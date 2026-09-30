/**
 * One-off diagnostic: reproduce the income-expense attachment-replacement
 * edit flow and dump what the edit form actually submits.
 *   node scripts/debug-edit-tx.mjs
 */
import { chromium } from "@playwright/test";
import mysql from "mysql2/promise";
import { BASE_URL, ACCOUNTS, SEED_PASSWORD } from "./env.mjs";

const BASE = BASE_URL;

const jpg = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from("\x00\x00JFIF\x00\x01audit-file\x00\x00\x00\x00\x00\x00"),
]);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Track server-action responses for the updateTransaction endpoint.
page.on("response", async (res) => {
  if (res.request().method() === "POST" && (await res.text()).includes("error")) {
    console.log("[server-action POST]", res.status(), (await res.text()).slice(0, 300));
  }
});

await page.goto(`${BASE}/login`);
await page.getByLabel("Email address").fill(ACCOUNTS.doctor);
await page.getByLabel("Password").fill(SEED_PASSWORD);
await page.getByRole("button", { name: /Sign in/i }).click();
await page.waitForURL(/\/doctor(\/|$)/, { timeout: 60_000 });

await page.goto(`${BASE}/doctor/income-expense`);
// Pick any existing E2E Audit Tx row (created by earlier failed runs) — or skip.
const descRow = page.locator("table.data-table").nth(0).locator("tr", { hasText: "E2E Audit Tx" }).first();
if ((await descRow.count()) === 0) {
  console.log("No E2E Audit Tx row found — create one first in the UI.");
  await browser.close();
  process.exit(0);
}

const conn = await mysql.createConnection(process.env.DB_URL);
const [before] = await conn.execute(
  "SELECT id, file_path FROM transactions WHERE description LIKE 'E2E Audit Tx%' ORDER BY id DESC LIMIT 1"
);
const tx = before[0];
console.log("before:", JSON.stringify(tx));

await descRow.getByRole("button", { name: /Edit/i }).click();
await page.locator("#edit-file").setInputFiles({ name: "new.jpg", mimeType: "image/jpeg", buffer: jpg });
await page.getByRole("button", { name: /Save changes/i }).click();
await page.waitForTimeout(6000);

// Modal still open? Dump any visible inline error.
const modalError = await page.locator("text=/Only PDF|Could not|required|Invalid|error/i").count();
console.log("modal error text count:", modalError);
const modalOpen = await page.locator('text="Edit entry"').count();
console.log("edit modal still open:", modalOpen);

const [after] = await conn.execute("SELECT id, file_path FROM transactions WHERE id = ?", [tx.id]);
console.log("after:", JSON.stringify(after[0]));

await conn.end();
await browser.close();
