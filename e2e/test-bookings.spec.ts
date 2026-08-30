import { test, expect } from "@playwright/test";
import { unique, tinyPdf } from "./helpers";

test.describe("P4.2 Test Bookings", () => {
  test("create vendor, create test, book for a patient, upload report via vendor link", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost:3000" });
    await page.goto("/doctor/test-bookings");
    await expect(page.getByRole("heading", { name: /Test Bookings/i }).first()).toBeVisible();

    const vendorName = unique("E2E Vendor");
    const testName = unique("E2E Test");
    const vendorEmail = `${vendorName.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`;

    // ── Add vendor ───────────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Vendors/i }).click();
    await page.getByPlaceholder("Metropolis Labs").fill(vendorName);
    await page.getByPlaceholder("+91 98765 43210").fill("9988776655");
    await page.getByPlaceholder("lab@example.com").fill(vendorEmail);
    await page.getByPlaceholder("Branch address").fill("Test lab, Mumbai");
    await page.getByRole("button", { name: /Add vendor/i }).click();
    // Modal auto-closes on success; reopen to confirm the vendor is listed.
    await page.getByRole("button", { name: /Vendors/i }).click();
    await expect(page.getByText(vendorName)).toBeVisible({ timeout: 15_000 });
    await page.locator(".fixed.inset-0", { hasText: "Lab vendors" }).click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole("button", { name: /Tests/i })).toBeVisible();

    // ── Add test ─────────────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Tests/i }).click();
    await page.getByPlaceholder("Complete Blood Count").fill(testName);
    await page.getByPlaceholder("500").fill("750");
    await page.getByRole("button", { name: /Add test/i }).click();
    // Modal auto-closes on success; reopen to confirm the test is listed.
    await page.getByRole("button", { name: /Tests/i }).click();
    await expect(page.getByText(testName)).toBeVisible({ timeout: 15_000 });
    await page.locator(".fixed.inset-0", { hasText: "Lab tests" }).click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole("button", { name: /New booking/i })).toBeVisible();

    // ── Create booking for patient 3 (PAT8702578) ────────────────────────────
    await page.getByRole("button", { name: /New booking/i }).click();
    const search = page.getByPlaceholder(/Search by mobile number or name/);
    await search.fill("77777");
    await expect(page.locator("button", { hasText: "PAT8702578" }).first()).toBeVisible({ timeout: 10_000 });
    await page.locator("button", { hasText: "PAT8702578" }).first().click();

    await page.getByLabel("Vendor").selectOption({ label: vendorName });
    await page.locator("label", { hasText: testName }).locator('input[type="checkbox"]').check();
    await expect(page.getByText(/Total: ₹750/)).toBeVisible();

    const today = new Date().toISOString().slice(0, 10);
    await page.getByLabel("Booking date").fill(today);
    await page.getByLabel("Payment date").fill(today);
    await page.getByRole("button", { name: /Create booking/i }).click();

    // Booking row appears with the new vendor name
    const row = page.locator("tr", { hasText: vendorName });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText("₹750")).toBeVisible();

    // ── Copy vendor upload link and upload a report ──────────────────────────
    // The copy button label changes to "Copied!" after writeText succeeds.
    await row.getByRole("button", { name: /Copy link/i }).click();
    await expect(row.getByRole("button", { name: /Copied!/i })).toBeVisible({ timeout: 5_000 });
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toContain("/vendor/upload-test/");

    await page.goto(link);
    await expect(page.getByRole("heading", { name: /Upload test report/i })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "report.pdf", mimeType: "application/pdf", buffer: tinyPdf });
    await expect(page.getByText("report.pdf")).toBeVisible();
    await page.getByRole("button", { name: /Upload report/i }).click();
    await expect(page.getByRole("heading", { name: /Report already uploaded/i })).toBeVisible({ timeout: 15_000 });

    // ── Back to doctor: status completed + view report works ─────────────────
    await page.goto("/doctor/test-bookings");
    const completedRow = page.locator("tr", { hasText: vendorName });
    await expect(completedRow).toBeVisible({ timeout: 15_000 });
    await expect(completedRow.getByRole("button", { name: /Copy link/i })).toHaveCount(0);
    const reportLink = await completedRow.getByRole("link", { name: /View report/i }).getAttribute("href");
    expect(reportLink).toContain("/report");
    const res = await page.request.get(reportLink!);
    expect(res.status()).toBe(200);
  });
});