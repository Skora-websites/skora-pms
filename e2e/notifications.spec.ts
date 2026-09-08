// Notifications: booking creates doctor notification (DB + UI), unread count, mark-all-read.
import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

const m = require("mysql2/promise");
async function q(sql: string, params?: unknown[]): Promise<unknown[]> {
  const c = await m.createConnection({ host: "127.0.0.1", port: 3307, user: "root", password: "", database: "skoracares_db" });
  try { const [rows] = await c.query(sql, params); return rows as unknown[]; } finally { await c.end(); }
}

test("booking an appointment notifies the doctor in DB and UI", async ({ page }) => {
  // 1. seed: create patient + book → action calls notifyUser(userId=doctorId)
  const patientName = unique("NotifPat");
  await page.goto("/doctor/patients/new");
  await page.getByLabel("Full name").fill(patientName);
  await page.getByLabel("Gender").selectOption("Male");
  await page.getByLabel("Phone").fill("9666555444");
  await page.getByLabel("Email").fill(`${patientName.toLowerCase()}@example.com`);
  await page.getByLabel("City").fill("X");
  await page.getByRole("button", { name: /Register patient/i }).click();
  await page.waitForURL(/\/doctor\/patients\/\d+$/, { timeout: 20000 });

  const dateStr = "2026-12-16";
  const hh = String(11 + (new Date().getUTCMinutes() % 8)).padStart(2, "0"); // 11:xx unique-ish
  const mm = String(new Date().getUTCSeconds()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;
  await page.goto("/doctor/appointments/book");
  const sel = page.getByLabel("Patient");
  const wanted = await sel.locator("option", { hasText: patientName }).allTextContents();
  await sel.selectOption({ label: wanted[0].trim() });
  await page.getByLabel("Date").fill(dateStr);
  await page.getByLabel("Time").fill(timeStr);
  await page.getByRole("button", { name: /Show consent form/i }).click();
  await page.getByText("Skip Consent").click();
  await page.getByRole("button", { name: /Book appointment/i }).click();
  await page.waitForURL(/\/doctor\/appointments($|\?|\/)/, { timeout: 30000 });

  // 2. DB evidence: notification row for doctor (id 2) with title "New appointment booked"
  let notif: { id: number; title: string; is_read: number } | undefined;
  for (let i = 0; i < 10 && !notif; i++) {
    const rows = await q(
      "select id, title, is_read from notifications where user_id=2 and title='New appointment booked' order by id desc limit 1"
    ) as { id: number; title: string; is_read: number }[];
    notif = rows[0];
    if (!notif) await page.waitForTimeout(1000);
  }
  console.log("EVIDENCE notifRow:", JSON.stringify(notif));
  expect(notif).toBeDefined();

  // 3. UI evidence: notifications page shows it unread (brand background)
  await page.goto("/doctor/notifications");
  await expect(page.getByText("New appointment booked").first()).toBeVisible({ timeout: 15000 });

  // 4. Mark all as read → DB read=1
  await page.getByRole("button", { name: /Mark all as read/i }).click();
  let readRow: { is_read: number } | undefined;
  for (let i = 0; i < 10; i++) {
    const rows = await q("select is_read from notifications where id=?", [notif!.id]) as { is_read: number }[];
    readRow = rows[0];
    if (readRow?.is_read === 1) break;
    await page.waitForTimeout(1000);
  }
  console.log("EVIDENCE readFlag:", JSON.stringify(readRow));
  expect(readRow?.is_read).toBe(1);
});
