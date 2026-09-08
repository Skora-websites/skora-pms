import { test, expect } from "@playwright/test";

test.describe("P2.2 Appointments", () => {
  test("book an appointment, cancel it, then delete it", async ({ page }) => {
    // Pick a future date far enough to avoid conflicts with seeded appointments.
    // Use today+7 at a unique off-grid minute (inside the 09:00-14:00 morning
    // schedule). The minute is randomized per run so reruns and Playwright
    // retries never collide with each other or with seeded appointments.
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dateStr = future.toISOString().slice(0, 10);
    const minute = String(10 + Math.floor(Math.random() * 49)).padStart(2, "0"); // 10-58
    const timeStr = `10:${minute}`;
    const timeLabel = `10:${minute} AM`;

    // ── Navigate to booking form ────────────────────────────────────────────
    await page.goto("/doctor/appointments/book");
    await expect(page.getByRole("heading", { name: /Book appointment/i })).toBeVisible();

    // ── Fill the booking form ───────────────────────────────────────────────
    // Leftover E2E/QA patients sort alphabetically first, so pick the first
    // option whose label is NOT a test artifact. Fall back to index 1.
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
    // Use "Skip Consent" to get status = confirmed
    await page.getByRole("button", { name: /Show consent form/i }).click();
    await page.getByText("Skip Consent").click();

    // Submit
    await page.getByRole("button", { name: /Book appointment/i }).click();

    // On success, redirects to /doctor/appointments (possibly with ?created=X).
    // Be specific — /doctor/appointments/book also matches a loose /doctor/appointments/ regex.
    await page.waitForURL(/\/doctor\/appointments(?:\?created=\d+)?$/, { timeout: 30_000 });

    // Find the row containing the patient name + time. The date filter uses
    // the computed dateStr so reruns on different days still match. Locators
    // re-resolve on every action, so no status filter here (it would stop
    // matching after the cancel step flips the status).
    const dateLabel = future.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const row = page
      .locator("tr", { hasText: patientName })
      .filter({ hasText: timeLabel })
      .filter({ hasText: dateLabel })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.locator("td").nth(3)).toContainText("clinical visit", { ignoreCase: true });
    await expect(row.getByText(/confirmed|cancelled/).first()).toBeVisible();

    // ── Cancel the appointment ──────────────────────────────────────────────
    await row.getByTitle("Cancel").click();
    // After cancel, the status badge text is lowercase "cancelled" (CSS
    // capitalize only changes the visual rendering, not the DOM text).
    await expect(row.getByText("cancelled", { exact: true })).toBeVisible({ timeout: 10_000 });
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