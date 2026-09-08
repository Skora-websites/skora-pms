import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P3.1 Billing", () => {
  test("add billing type, create bill, print PDF, edit bill, then delete", async ({ page }) => {
    const billingTypeName = unique("E2E Billing Type");
    const defaultAmount = "250";
    // Unique amounts per run so leftover bills from failed runs can never
    // collide with this run's row assertions (₹500 create / ₹300 edit).
    const createAmount = String(400 + (Date.now() % 90)); // 400-489
    const editAmount = String(300 + (Date.now() % 90)); // 300-389
    const createAmountStr = `₹${createAmount}.00`;
    const editAmountStr = `₹${editAmount}.00`;

    // ── Navigate to billing page ────────────────────────────────────────────
    await page.goto("/doctor/billing");
    await expect(page.getByRole("heading", { name: /Billing/i }).first()).toBeVisible();

    // ── Add billing type ────────────────────────────────────────────────────
    // The BillingTypesManager renders a card with heading "Billing types".
    // Target the card BY ITS HEADING — the bill form card also contains the
    // text "Billing type" (its select label) so a plain hasText filter can
    // match the wrong card.
    const billingTypesSection = page
      .locator(".card", { has: page.getByRole("heading", { name: "Billing types" }) })
      .first();
    await billingTypesSection.getByLabel("Name").fill(billingTypeName);
    await billingTypesSection.getByLabel("Default amount (₹)").fill(defaultAmount);
    await billingTypesSection.getByRole("button", { name: /Add billing type/i }).click();
    await expect(billingTypesSection.getByText(billingTypeName)).toBeVisible({ timeout: 10_000 });

    // ── Create bill ─────────────────────────────────────────────────────────
    // Pick first non-test-artifact patient (leftover E2E/QA patients sort first).
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
    // Scope the rest of the form fields to the "Generate new bill" card —
    // the Billing types card also has "Amount (₹)"-style labels.
    const billForm = page
      .locator(".card", { has: page.getByRole("heading", { name: "Generate new bill" }) })
      .first();
    // Billing type select: "{name} · ₹{amount}" — match by substring is unreliable in types,
    // select the newly created type by index (it's the last option).
    await billForm.getByLabel("Billing type").selectOption({ index: await billForm.getByLabel("Billing type").locator("option").count() - 1 });
    await billForm.getByLabel("Amount (₹)").fill(createAmount);
    await billForm.getByLabel("Payment method").selectOption("UPI");
    await billForm.getByRole("button", { name: /Generate bill/i }).click();

    // The bill row appears in the table. Multiple bills may exist for this
    // patient from earlier runs — match the row whose total is exactly the
    // unique amount we just billed, then assert on the total cell.
    const row = page
      .locator("table.data-table tr", { hasText: patientName })
      .filter({ has: page.locator("td.font-semibold", { hasText: createAmountStr }) })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    // Cell 4 = total amount. Total and received both render the
    // same string, so assert on the cell position instead of text.
    await expect(row.locator("td").nth(3)).toHaveText(createAmountStr);

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
    await modal.getByLabel("Total amount (₹)").fill(editAmount);
    await modal.getByRole("button", { name: /Update bill/i }).click();

    // Verify the updated amount appears. The original row locator filtered on
    // the create amount which no longer matches after the edit — re-locate by
    // the NEW total (locators re-resolve on every assertion).
    const editedRow = page
      .locator("table.data-table tr", { hasText: patientName })
      .filter({ has: page.locator("td.font-semibold", { hasText: editAmountStr }) })
      .first();
    await expect(editedRow.locator("td").nth(3)).toHaveText(editAmountStr, { timeout: 10_000 });
    // ── Delete bill ─────────────────────────────────────────────────────────
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Delete this bill permanently?");
      dialog.accept();
    });
    await editedRow.getByTitle("Delete").click();
    await expect(editedRow).toHaveCount(0, { timeout: 15_000 });
  });
});