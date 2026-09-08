import { test, expect } from "@playwright/test";
import mysql from "mysql2/promise";

// Business-fix verification (audit round 2):
// F1  — doctor signup grants default module permissions → dashboard reachable
// F2  — pending_consent appointment cancellable; consent row synced to cancelled
// F3  — pending_consent appointment cannot be confirmed (no Confirm button, no
//       consultation/completion entry points while consent outstanding)
// F12 — consent accept/reject syncs appointment status + notifies doctor

const DB = { host: "127.0.0.1", port: 3307, user: "root", password: "", database: "skoracares_db" };

type Row<T> = [T, unknown]; // mysql2 returns [rows, fields]
async function query<T>(sql: string, params: unknown[]): Promise<T[]> {
  const conn = await mysql.createConnection(DB);
  try {
    const [rows] = (await conn.query(sql, params)) as Row<T>;
    return rows as T[];
  } finally {
    await conn.end();
  }
}

test.describe("Business-fix verification", () => {
  test("F1: doctor signup lands on dashboard, not locked out", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto("/signup");
    await page.getByRole("button", { name: /Doctor \/ Clinic/i }).click();

    const suffix = Date.now().toString(36);
    const phone = `9${String(Math.floor(Math.random() * 900000000) + 100000000)}`; // 10 digits
    await page.getByLabel("Full name").fill(`E2E Signup Dr ${suffix}`);
    await page.getByLabel("Email address").fill(`e2e.dr.${suffix}@example.com`);
    await page.getByLabel("Phone").fill(phone);
    await page.getByLabel("Gender").selectOption("male");

    // Send OTP — dev mode echoes it in the message text.
    await page.getByRole("button", { name: /Send OTP/i }).click();
    const otpMsg = page.locator("p", { hasText: /Dev mode — your OTP is (\d{6})/ });
    await expect(otpMsg).toBeVisible({ timeout: 15_000 });
    const otp = (await otpMsg.textContent())!.match(/(\d{6})/)![1];
    await page.locator('input[name="otp"]').fill(otp);

    await page.getByLabel("Password", { exact: true }).fill("Admin@123");
    await page.getByLabel("Confirm password").fill("Admin@123");
    await page.getByRole("button", { name: /Create account/i }).click();

    // New doctor must reach /doctor dashboard — previously locked out (no perms).
    await page.waitForURL(/\/doctor(\/|$)/, { timeout: 30_000 });
    await page.goto("/doctor/appointments");
    await expect(page.getByRole("heading", { name: "Appointments", exact: true })).toBeVisible();
    await ctx.close();
  });

  test("F2/F3: cancel pending_consent appointment + consent row synced, confirm blocked", async ({ page }) => {
    const future = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    const dateStr = future.toISOString().slice(0, 10);
    const minute = String(10 + Math.floor(Math.random() * 49)).padStart(2, "0");
    const timeStr = `11:${minute}`;
    const timeLabel = `11:${minute} AM`;

    await page.goto("/doctor/appointments/book");
    const patientSelect = page.getByLabel("Patient");
    const optionCount = await patientSelect.locator("option").count();
    let chosenIndex = 1;
    for (let i = 1; i < optionCount; i++) {
      const text = (await patientSelect.locator("option").nth(i).innerText()).trim();
      if (!/E2E|QA User|Patient-/.test(text)) {
        chosenIndex = i;
        break;
      }
    }
    const patientLabel = await patientSelect.locator("option").nth(chosenIndex).innerText();
    const patientName = patientLabel.split("·")[0].trim();
    await patientSelect.selectOption({ index: chosenIndex });
    await page.getByLabel("Date").fill(dateStr);
    await page.getByLabel("Time").fill(timeStr);
    await page.getByRole("button", { name: /Show consent form/i }).click();
    await page.getByText("Send Consent Link").click();
    await page.getByRole("button", { name: /Book appointment/i }).click();
    await page.waitForURL(/\/doctor\/appointments(?:\?created=\d+)?$/, { timeout: 30_000 });

    const dateLabel = future.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const row = page
      .locator("tr", { hasText: patientName })
      .filter({ hasText: timeLabel })
      .filter({ hasText: dateLabel })
      .first();

    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText(/pending consent/i)).toBeVisible();

    // F3-UI: pending_consent row exposes no consent-bypassing entry points.
    await expect(row.getByTitle("Confirm")).toHaveCount(0);
    await expect(row.getByTitle("Mark completed")).toHaveCount(0);
    await expect(row.getByTitle("Start consultation")).toHaveCount(0);

    // F2-UI: Cancel button present for pending_consent.
    await row.getByTitle("Cancel").click();
    await expect(row.getByText("cancelled", { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test("F12: patient accepts consent → appointment confirmed + doctor notified", async ({ page }) => {
    const future = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    const dateStr = future.toISOString().slice(0, 10);
    const minute = String(10 + (Date.now() % 49)).padStart(2, "0"); // varies across retries
    const timeStr = `11:${minute}`;
    const timeLabel = `11:${minute} AM`;

    await page.goto("/doctor/appointments/book");
    const patientSelect = page.getByLabel("Patient");
    const optionCount = await patientSelect.locator("option").count();
    let chosenIndex = 1;
    for (let i = 1; i < optionCount; i++) {
      const text = (await patientSelect.locator("option").nth(i).innerText()).trim();
      if (!/E2E|QA User|Patient-/.test(text)) {
        chosenIndex = i;
        break;
      }
    }
    const patientLabel = await patientSelect.locator("option").nth(chosenIndex).innerText();
    const patientName = patientLabel.split("·")[0].trim();
    await patientSelect.selectOption({ index: chosenIndex });
    await page.getByLabel("Date").fill(dateStr);
    await page.getByLabel("Time").fill(timeStr);
    await page.getByRole("button", { name: /Show consent form/i }).click();
    await page.getByText("Send Consent Link").click();
    await page.getByRole("button", { name: /Book appointment/i }).click();
    await page.waitForURL(/\/doctor\/appointments(?:\?created=\d+)?$/, { timeout: 30_000 });

    const dateLabel = future.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const row = page
      .locator("tr", { hasText: patientName })
      .filter({ hasText: timeLabel })
      .filter({ hasText: dateLabel })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // ── Fetch slug + appointment id from DB ──
    const rows = await query<{ slug: string; appointment_id: number; consent_status: string }>(
      `SELECT c.slug, c.appointment_id, c.status AS consent_status
       FROM appointment_consult_consents c
       JOIN appointments a ON a.id = c.appointment_id
       WHERE a.doctor_id = 2 AND a.date = ? AND a.time = ?
       ORDER BY c.id DESC LIMIT 1`,
      [dateStr, timeLabel]
    );
    expect(rows.length, "consent row created at booking").toBe(1);
    const { slug } = rows[0];
    expect(rows[0].consent_status).toBe("pending_consent");

    // ── Patient opens consent link and accepts ──
    const ctx = page.context();
    const patientPage = await ctx.newPage();
    await patientPage.goto(`/my-consent/${slug}`);
    await expect(patientPage.getByRole("heading", { name: /Consultation consent/i })).toBeVisible();
    await patientPage.getByRole("button", { name: /I Consent/i }).click();
    await expect(patientPage.getByText("Consent accepted")).toBeVisible({ timeout: 15_000 });
    await patientPage.close();

    // ── Appointment row flips to confirmed (reload — doctor page was open
    //    before the patient decided on another tab) ──
    await page.reload();
    const row2 = page
      .locator("tr", { hasText: patientName })
      .filter({ hasText: timeLabel })
      .filter({ hasText: dateLabel })
      .first();
    await expect(row2).toBeVisible({ timeout: 15_000 });
    await expect(row2.getByText(/confirmed/i).first()).toBeVisible({ timeout: 15_000 });

    // ── Doctor notification exists (fire-and-forget insert — poll) ──
    let notified = 0;
    for (let i = 0; i < 10 && !notified; i++) {
      await page.waitForTimeout(1_000);
      const notif = await query<{ id: number }>(
        `SELECT id FROM notifications WHERE user_id = 2 AND title = 'Patient consent received' AND message LIKE ?`,
        [`%#${rows[0].appointment_id}%`]
      );
      notified = notif.length;
    }
    expect(notified, "doctor notified of consent").toBeGreaterThan(0);
  });
});
