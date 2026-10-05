import { test, expect } from "@playwright/test";
import { grantDoctorModules } from "./helpers";

// P3.3 Shop / Medicine Inventory — catalogue CRUD (legacy MasterController
// parity). The catalogue is shared practice data; every doctor/receptionist
// with dashboard access can manage entries and stock.

test.describe("P3.3 Shop / Medicine Inventory", () => {
  test.beforeAll(async () => { await grantDoctorModules(["shop"]); });
  test("catalogue renders with add/edit/delete controls; search works", async ({ page }) => {
    await page.goto("/doctor/shop");
    await expect(page.getByRole("heading", { name: /Medicine Inventory/i }).first()).toBeVisible();

    await expect(page.getByRole("button", { name: /Add medicine/i }).first()).toBeVisible();

    // Search still works on the shared catalogue.
    await page.getByPlaceholder(/Search by name/i).fill("Paracetamol");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/doctor\/shop\?q=/);
  });

  test("medicine CRUD cycle: create → duplicate guard → edit → delete", async ({ page }) => {
    const unique = Date.now() % 1_000_000;
    const name = `E2E Crud Med ${unique}`;
    const renamed = `E2E Crud Med X ${unique}`;

    await page.goto("/doctor/shop");

    // ── Create ────────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Add medicine/i }).first().click();
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Strength").fill("500");
    await page.getByLabel("Form").selectOption("Capsule");
    await page.getByLabel("Unit").selectOption("mg");
    await page.locator("form").getByRole("button", { name: /Add medicine/i }).click();
    await expect(page.locator("h3", { hasText: name }).first()).toBeVisible();

    // ── Duplicate-name guard surfaces in the dialog ──────────────────
    await page.getByRole("button", { name: /Add medicine/i }).first().click();
    await page.getByLabel("Name").fill(name);
    await page.locator("form").getByRole("button", { name: /Add medicine/i }).click();
    await expect(page.getByText("A medicine with this name already exists")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    // ── Edit (rename) ─────────────────────────────────────────────────
    await page
      .locator("div.group", { has: page.locator("h3", { hasText: name }) })
      .getByRole("button", { name: /Edit/i })
      .click();
    await page.getByLabel("Name").fill(renamed);
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.locator("h3", { hasText: renamed }).first()).toBeVisible();

    // ── Delete (confirm dialog) ───────────────────────────────────────
    let confirmMessage = "";
    page.once("dialog", (d) => {
      confirmMessage = d.message();
      void d.accept();
    });
    await page
      .locator("div.group", { has: page.locator("h3", { hasText: renamed }) })
      .getByRole("button", { name: /Delete/i })
      .click();
    await expect(page.locator("h3", { hasText: renamed })).toHaveCount(0);
    expect(confirmMessage).toMatch(/Delete .* from the catalogue/i);
  });
});
