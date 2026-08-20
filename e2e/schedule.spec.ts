import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P4.1 Schedule & Clinics", () => {
  test("add a clinic, add weekly schedule, then delete the clinic", async ({ page }) => {
    await page.goto("/doctor/schedule");
    await expect(page.getByRole("heading", { name: /Schedule/i }).first()).toBeVisible();

    const clinicName = unique("E2E Clinic");

    // ── Add clinic ───────────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Add clinic/i }).click();
    await page.getByLabel("Clinic name").fill(clinicName);
    await page.getByLabel("Phone").fill("9876500001");
    await page.getByLabel("Consultation fee").fill("500");
    await page.getByLabel("Address").fill("Test Street, Andheri, Mumbai");
    await page.getByRole("button", { name: /Save clinic/i }).click();

    const card = page.locator(".card", { hasText: clinicName });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText("₹500")).toBeVisible();

    // ── Add weekly schedule ──────────────────────────────────────────────────
    await card.getByRole("button", { name: /New schedule/i }).click();
    await card.getByRole("button", { name: /^monday$/i }).click();
    await card.getByRole("button", { name: /^tuesday$/i }).click();
    await card.locator('input[title="morning start time"]').fill("09:00");
    await card.locator('input[title="morning end time"]').fill("13:00");
    await card.getByRole("button", { name: /Save schedule/i }).click();

    await expect(card.getByText(/09:00/).first()).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText("monday").first()).toBeVisible();

    // ── Delete clinic ────────────────────────────────────────────────────────
    await card.getByRole("button", { name: /^Delete$/i }).click();
    await card.getByRole("button", { name: /Confirm/i }).click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });
  });
});