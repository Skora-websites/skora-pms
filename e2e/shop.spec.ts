import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P3.3 Shop / Medicine Inventory", () => {
  test("add a medicine, edit it, then delete it", async ({ page }) => {
    const medicineName = unique("E2E Med");
    const renamed = `${medicineName} Renamed`;

    // ── Navigate to shop page ───────────────────────────────────────────────
    await page.goto("/doctor/shop");
    await expect(page.getByRole("heading", { name: /Medicine Inventory/i }).first()).toBeVisible();

    // ── Add medicine ────────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Add medicine/i }).click();
    await page.locator("#med-name").fill(medicineName);
    await page.locator("#med-strength").fill("500");
    // Form defaults to "Tablet" / "mg" — keep defaults
    await page.getByRole("button", { name: /Add to catalogue/i }).click();

    // Card appears with the medicine name
    const card = page.locator(".card", { hasText: medicineName });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.locator("h3")).toContainText(medicineName);
    await expect(card).toContainText("500 mg");

    // ── Edit medicine ───────────────────────────────────────────────────────
    await card.getByTitle("Edit medicine").click();
    await page.locator("#med-name-edit").clear();
    await page.locator("#med-name-edit").fill(renamed);
    await page.getByRole("button", { name: /Save changes/i }).click();

    const renamedCard = page.locator(".card", { hasText: renamed });
    await expect(renamedCard).toBeVisible({ timeout: 10_000 });
    await expect(renamedCard.locator("h3")).toContainText(renamed);

    // ── Delete medicine (two-click confirm) ─────────────────────────────────
    await renamedCard.getByTitle("Delete medicine").click();
    await renamedCard.getByTitle("Click again to confirm").click();
    await expect(renamedCard).toHaveCount(0, { timeout: 15_000 });
  });
});