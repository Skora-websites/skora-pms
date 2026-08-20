import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P4.4 Roles & Permissions", () => {
  test("create role with permissions, edit it, then delete it", async ({ page }) => {
    await page.goto("/doctor/roles");
    await expect(page.getByRole("heading", { name: /Roles & permissions/i }).first()).toBeVisible();

    const roleName = unique("E2E Role");

    // ── Create role ───────────────────────────────────────────────────────────
    await page.getByRole("button", { name: /New role/i }).click();
    await page.getByLabel("Role name").fill(roleName);

    // Toggle the "schedule" module header — selects all its permission chips.
    const scheduleModule = page.getByRole("checkbox", { name: "schedule" });
    await scheduleModule.check();
    await expect(page.getByRole("button", { name: "list", exact: true }).first()).toHaveClass(/bg-brand-700/);

    await page.getByRole("button", { name: /Create role/i }).click();

    const card = page.locator(".card", { hasText: roleName });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText(/permissions? assigned/i)).toBeVisible();

    // ── Edit role ────────────────────────────────────────────────────────────
    const newName = `${roleName}-renamed`;
    const oldNameExact = new RegExp(`^${roleName}$`);
    await card.getByRole("button", { name: "Edit role" }).click();
    await page.getByLabel("Role name").fill(newName);
    await page.getByRole("button", { name: /Save role/i }).click();
    await expect(page.locator(".card h3", { hasText: newName })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".card h3", { hasText: oldNameExact })).toHaveCount(0);

    // ── Delete role (two clicks: arm + confirm) ──────────────────────────────
    const renamedCard = page.locator(".card", { hasText: newName });
    await renamedCard.getByRole("button", { name: "Delete role" }).click();
    await renamedCard.getByRole("button", { name: "Click again to confirm" }).click();
    await expect(renamedCard).toHaveCount(0, { timeout: 15_000 });
  });
});