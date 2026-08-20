import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P3.1 Billing", () => {
  test("add billing type, create bill, print PDF, edit bill, then delete", async ({ page }) => {
    const billingTypeName = unique("E2E Billing Type");
    const defaultAmount = "250";

    // Use the seeded patient "Rohit Malhotra" (mobile 9876501234).
    const patientName = "Rohit Malhotra";

    // ── Navigate to billing page ────────────────────────────────────────────
    await page.goto("/doctor/billing");
    await expect(page.getByRole("heading", { name: /Billing/i }).first()).toBeVisible();

    // ── Add billing type ────────────────────────────────────────────────────
    // The BillingTypesManager is within a card with heading "Billing types".
    const billingTypesSection = page.locator("h2", { hasText: "Billing types" }).locator("..");
    await billingTypesSection.getByPlaceholder("e.g. Consultation fee").fill(billingTypeName);
    await billingTypesSection.getByPlaceholder("0").fill(defaultAmount);
    await billingTypesSection.getByRole("button", { name: /Add billing type/i }).click();
    await expect(billingTypesSection.getByText(billingTypeName)).toBeVisible({ timeout: 10_000 });

    // ── Create bill ─────────────────────────────────────────────────────────
    // Patient select: "Rohit Malhotra · 9876501234"
    await page.getByLabel("Patient").selectOption({ index: 1 });
    // Billing type select: "{name} · ₹{amount}" — match by substring is unreliable in types,
    // select the newly created type by index (it's the last option).
    await page.getByLabel("Billing type").selectOption({ index: await page.getByLabel("Billing type").locator("option").count() - 1 });
    await page.getByLabel("Amount (₹)").fill("500");
    await page.getByLabel("Payment method").selectOption("UPI");
    await page.getByRole("button", { name: /Generate bill/i }).click();

    // The bill row appears in the table; pick the first match for this patient.
    const row = page.locator("table.data-table tr", { hasText: patientName }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText("₹500")).toBeVisible();

    // ── Print bill PDF ──────────────────────────────────────────────────────
    const pdfLink = row.locator('a[title="Print bill PDF"]');
    await expect(pdfLink).toBeVisible();
    const href = await pdfLink.getAttribute("href");
    expect(href).toContain("/api/doctor/billing/");
    expect(href).toContain("/pdf");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");

    // ── Edit bill ───────────────────────────────────────────────────────────
    await row.getByTitle("Edit bill").click();
    await expect(page.getByRole("heading", { name: /Edit bill/i })).toBeVisible();
    // "Total amount (₹)" is only in the edit modal — unique field.
    const modal = page.locator(".fixed.inset-0.z-50", { has: page.getByRole("heading", { name: "Edit bill" }) });
    await modal.getByLabel("Total amount (₹)").clear();
    await modal.getByLabel("Total amount (₹)").fill("300");
    await modal.getByRole("button", { name: /Update bill/i }).click();

    // Verify the updated amount appears in the (re-located) row
    await expect(row.getByText("₹300")).toBeVisible({ timeout: 10_000 });

    // ── Delete bill ─────────────────────────────────────────────────────────
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Delete this bill permanently?");
      dialog.accept();
    });
    await row.getByTitle("Delete").click();
    await expect(row).toHaveCount(0, { timeout: 15_000 });
  });
});