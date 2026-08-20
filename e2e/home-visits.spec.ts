import { test, expect } from "@playwright/test";

test.describe("P4.5 Home Visits — patient details drawer", () => {
  test("opens the patient details drawer from a home visit row", async ({ page }) => {
    await page.goto("/doctor/home-visits");
    await expect(page.getByRole("heading", { name: /Home Visits/i }).first()).toBeVisible();

    const details = page.getByRole("button", { name: /Details/i });
    if ((await details.count()) === 0) {
      test.skip(true, "No home visits exist for this account — drawer cannot be exercised.");
      return;
    }

    await details.first().click();
    const dialog = page.getByRole("dialog", { name: /details/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Patient contact block
    await expect(dialog.getByText("Patient details")).toBeVisible();
    await expect(dialog.getByText(/Phone|Address|Gender|Date of birth/i).first()).toBeVisible();
    // Appointment history section
    await expect(dialog.getByText(/Appointment history/i)).toBeVisible();
    await expect(dialog.getByText(/No appointments yet|Dr\./i).first()).toBeVisible({ timeout: 10_000 });

    // Close via the (unnamed) X button inside the dialog header.
    await dialog.locator("button").first().click();
    await expect(dialog).toHaveCount(0);
  });
});