import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P2.1 Patient Registration", () => {
  test("register a patient, view details, edit, then delete", async ({ page }) => {
    const patientName = unique("E2E Patient");
    const patientPhone = `98765${String(Date.now()).slice(-5)}`;
    const patientEmail = `${patientName.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`;
    const city = "Mumbai";

    // ── Navigate to patients list ───────────────────────────────────────────
    await page.goto("/doctor/patients");
    await expect(page.getByRole("heading", { name: /Patient registrations/i }).first()).toBeVisible();

    // ── Register new patient ────────────────────────────────────────────────
    await page.getByRole("link", { name: /Register/i }).click();
    await page.waitForURL("/doctor/patients/new");
    await expect(page.getByRole("heading", { name: /Register a patient/i })).toBeVisible();

    await page.getByLabel("Full name").fill(patientName);
    await page.getByLabel("Gender").selectOption("Male");
    await page.getByLabel("Phone").fill(patientPhone);
    await page.getByLabel("Email").fill(patientEmail);
    await page.getByLabel("City").fill(city);
    await page.getByRole("button", { name: /Register patient/i }).click();

    // On success, redirects to list; find the patient card.
    await page.waitForURL("/doctor/patients");
    const card = page.locator(".card", { hasText: patientName });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toContainText(patientPhone.slice(0, 5));

    // ── View patient details ────────────────────────────────────────────────
    await card.click();
    await page.waitForURL(/\/doctor\/patients\/\d+$/);
    await expect(page.getByRole("heading", { name: patientName })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(patientPhone)).toBeVisible();
    await expect(page.getByText(city)).toBeVisible();

    // ── Edit patient ────────────────────────────────────────────────────────
    const renamed = `${patientName} Updated`;
    await page.getByRole("link", { name: /Edit/i }).click();
    await page.waitForURL(/\/edit$/);
    await page.getByLabel("Full name").clear();
    await page.getByLabel("Full name").fill(renamed);
    await page.getByRole("button", { name: /Save changes/i }).click();

    // Redirects back to detail page — verify name changed.
    // The redirect goes to /doctor/patients/{id} (not /edit).
    await expect(page.getByRole("heading", { name: renamed })).toBeVisible({ timeout: 15_000 });

    // ── Delete patient ──────────────────────────────────────────────────────
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Delete patient");
      dialog.accept();
    });
    await page.getByRole("button", { name: /Delete/i }).click();

    // After delete, redirects to /doctor/patients — verify the patient is gone.
    await page.waitForURL("/doctor/patients");
    await expect(page.locator(".card", { hasText: renamed })).toHaveCount(0, { timeout: 15_000 });
  });
});