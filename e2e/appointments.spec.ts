import { test, expect } from "@playwright/test";

test.describe("P2.2 Appointments", () => {
  test("book an appointment, cancel it, then delete it", async ({ page }) => {
    // Use the seeded patient "Rohit Malhotra" (mobile 9876501234).
    const patientName = "Rohit Malhotra";

    // Pick a future date far enough to avoid conflicts with seeded appointments.
    // Use today+7 at 10:15 AM — this falls within the doctor's morning schedule
    // (Mon-Fri 09:00-14:00, Sat 10:00-13:00) and avoids any existing appointments.
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dateStr = future.toISOString().slice(0, 10);
    const timeStr = "10:15";

    // ── Navigate to booking form ────────────────────────────────────────────
    await page.goto("/doctor/appointments/book");
    await expect(page.getByRole("heading", { name: /Book appointment/i })).toBeVisible();

    // ── Fill the booking form ───────────────────────────────────────────────
    // Patient select shows "Rohit Malhotra · 9876501234"
    await page.getByLabel("Patient").selectOption({ index: 1 });
    await page.getByLabel("Date").fill(dateStr);
    await page.getByLabel("Time").fill(timeStr);
    // Use "Skip Consent" to get status = confirmed
    await page.getByRole("button", { name: /Show consent form/i }).click();
    await page.getByText("Skip Consent").click();

    // Submit
    await page.getByRole("button", { name: /Book appointment/i }).click();

    // On success, redirects to /doctor/appointments?created=X
    await page.waitForURL(/\/doctor\/appointments\?created=/);

    // Find the row containing the patient name + time
    const row = page.locator("tr", { hasText: patientName }).filter({ hasText: "10:15 AM" }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.locator("td").nth(3)).toContainText("clinical visit", { ignoreCase: true });

    // ── Cancel the appointment ──────────────────────────────────────────────
    await row.getByTitle("Cancel").click();
    // After cancel, the status badge displays "Cancelled" (CSS capitalize).
    await expect(row.getByText("Cancelled", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(row.getByTitle("Cancel")).toHaveCount(0);

    // ── Delete the appointment ──────────────────────────────────────────────
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Delete this appointment permanently?");
      dialog.accept();
    });
    await row.getByTitle("Delete").click();
    await expect(row).toHaveCount(0, { timeout: 15_000 });
  });
});