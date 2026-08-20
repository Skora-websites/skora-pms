import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P4.3 Staff & Attendance", () => {
  test("create a role, add staff with it, mark daily attendance, view monthly report", async ({ page }) => {
    const roleName = unique("E2E Staff Role");
    const staffName = unique("E2E Staff");
    const staffEmail = `${unique("staff")}@example.com`;

    // ── Ensure a practice role exists to assign ──────────────────────────────
    await page.goto("/doctor/roles");
    if ((await page.getByRole("button", { name: /New role/i }).count()) > 0) {
      await page.getByRole("button", { name: /New role/i }).click();
      await page.getByLabel("Role name").fill(roleName);
      await page.getByRole("checkbox", { name: "schedule" }).check();
      await page.getByRole("button", { name: /Create role/i }).click();
      await expect(page.locator(".card", { hasText: roleName })).toBeVisible({ timeout: 15_000 });
    }

    // ── Add staff member ─────────────────────────────────────────────────────
    await page.goto("/doctor/staff");
    await page.getByRole("button", { name: /Add staff/i }).click();
    await page.getByLabel("Full name").fill(staffName);
    await page.getByLabel("Email").fill(staffEmail);
    await page.getByLabel("Phone").fill("9876543210");
    await page.getByLabel("Password").fill("Test@1234");
    await page.getByLabel("Role").selectOption({ label: roleName });
    await page.locator("form").getByRole("button", { name: /Add staff/i }).click();

    const staffCard = page.locator(".card.p-5", { hasText: staffName });
    await expect(staffCard).toBeVisible({ timeout: 15_000 });
    await expect(staffCard.getByText(roleName)).toBeVisible();

    // ── Mark attendance for today ────────────────────────────────────────────
    await page.getByRole("button", { name: /Save attendance/i }).click();
    await expect(page.getByText("Attendance saved.")).toBeVisible({ timeout: 15_000 });

    // ── Monthly report shows the staff member ────────────────────────────────
    await page.getByRole("button", { name: /Monthly report/i }).click();
    const staffRow = page.locator("tr", { hasText: staffName });
    await expect(staffRow).toBeVisible({ timeout: 15_000 });
    await expect(staffRow.getByTitle(/present/).first()).toBeVisible({ timeout: 15_000 });
  });
});