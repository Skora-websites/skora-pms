import { test, expect } from "@playwright/test";

test.describe("P3.3 Shop / Medicine Inventory (read-only)", () => {
  test("catalogue renders read-only — no add/edit/delete controls", async ({ page }) => {
    await page.goto("/doctor/shop");
    await expect(page.getByRole("heading", { name: /Medicine Inventory/i }).first()).toBeVisible();

    // Legacy parity: the shared catalogue is super-admin master data.
    await expect(page.getByRole("button", { name: /Add medicine/i })).toHaveCount(0);
    await expect(page.locator('[title="Edit medicine"]')).toHaveCount(0);
    await expect(page.locator('[title="Delete medicine"]')).toHaveCount(0);

    // Search still works on the shared catalogue.
    await page.getByPlaceholder(/Search by name/i).fill("Paracetamol");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/doctor\/shop\?q=/);
  });
});
