import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P3.2 Income & Expense", () => {
  test("add categories, create income and expense entries, edit, update status, then delete", async ({ page }) => {
    const incomeCatName = unique("E2E Income Cat");
    const expenseCatName = unique("E2E Expense Cat");
    const incomeDesc = unique("E2E Income entry");
    const expenseDesc = unique("E2E Expense entry");

    // ── Navigate to income-expense page ─────────────────────────────────────
    await page.goto("/doctor/income-expense");
    await expect(page.getByRole("heading", { name: /Income & Expense/i }).first()).toBeVisible();

    // ── Add income category ─────────────────────────────────────────────────
    // The CategoryManager is always visible as a card with heading "Categories".
    const catManager = page.locator(".card").filter({ has: page.getByRole("heading", { name: "Categories" }) });
    // "Income" tab is default.
    await catManager.getByLabel("New income category").fill(incomeCatName);
    await catManager.getByRole("button", { name: /Add income category/i }).click();
    await expect(catManager.getByText(incomeCatName)).toBeVisible({ timeout: 10_000 });

    // ── Add expense category ────────────────────────────────────────────────
    await catManager.getByRole("button", { name: "Expense", exact: true }).click();
    await catManager.getByLabel("New expense category").fill(expenseCatName);
    await catManager.getByRole("button", { name: /Add expense category/i }).click();
    await expect(catManager.getByText(expenseCatName)).toBeVisible({ timeout: 10_000 });

    // ── Add income entry ────────────────────────────────────────────────────
    // Type toggle: "Income" is default in the TransactionForm
    await page.getByLabel("Amount (₹)").fill("1500");
    const today = new Date().toISOString().slice(0, 10);
    await page.getByLabel("Date").fill(today);
    await page.locator("#category").selectOption({ label: incomeCatName });
    await page.getByLabel("Description").fill(incomeDesc);
    await page.getByLabel("Payment method").selectOption("Cash");
    await page.getByRole("button", { name: /Add entry/i }).click();

    // Verify row in "Recent income" table (first data-table on the page)
    const incomeRow = page.locator("table.data-table").nth(0).locator("tr", { hasText: incomeDesc });
    await expect(incomeRow).toBeVisible({ timeout: 15_000 });
    await expect(incomeRow.getByText("₹1,500")).toBeVisible();

    // ── Add expense entry ───────────────────────────────────────────────────
    // Click the "Expense" toggle in the TransactionForm (first "Expense" button in the page)
    await page.getByRole("button", { name: "Expense", exact: true }).first().click();
    await page.getByLabel("Amount (₹)").fill("800");
    await page.getByLabel("Date").fill(today);
    // Category select options have switched to expense categories
    await page.locator("#category").selectOption({ label: expenseCatName });
    await page.getByLabel("Description").fill(expenseDesc);
    await page.getByLabel("Payment method").selectOption("UPI");
    await page.getByRole("button", { name: /Add entry/i }).click();

    // Verify row in "Recent expenses" table (second data-table on the page)
    const expenseRow = page.locator("table.data-table").nth(1).locator("tr", { hasText: expenseDesc });
    await expect(expenseRow).toBeVisible({ timeout: 15_000 });
    await expect(expenseRow.getByText("₹800")).toBeVisible();

    // ── Edit income entry ───────────────────────────────────────────────────
    await incomeRow.getByTitle("Edit").click();
    await expect(page.getByRole("heading", { name: /Edit entry/i })).toBeVisible();
    await page.locator("#edit-amount").clear();
    await page.locator("#edit-amount").fill("2000");
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(incomeRow.getByText("₹2,000")).toBeVisible({ timeout: 10_000 });

    // ── Update status on income entry ───────────────────────────────────────
    await incomeRow.locator('select[title="Update status"]').selectOption("pending");
    // Verify the status changed (the select shows "Pending")
    await expect(incomeRow.locator('select[title="Update status"]')).toHaveValue("pending");

    // ── Delete expense entry ────────────────────────────────────────────────
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Delete this transaction permanently?");
      dialog.accept();
    });
    await expenseRow.getByTitle("Delete").click();
    await expect(expenseRow).toHaveCount(0, { timeout: 15_000 });

    // Cleanup: delete the income entry too
    // Check if the income row is still visible (it should be)
    if (await incomeRow.isVisible()) {
      page.once("dialog", (dialog) => {
        expect(dialog.message()).toContain("Delete this transaction permanently?");
        dialog.accept();
      });
      await incomeRow.getByTitle("Delete").click();
      await expect(incomeRow).toHaveCount(0, { timeout: 15_000 });
    }
  });
});