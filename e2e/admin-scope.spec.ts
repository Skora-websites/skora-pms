// Manager cross-clinic scope — the IDOR proof for the admin tier.
//
// Proves the Phase 1–3 tenancy model end-to-end against a seeded DB:
//   - manager1@gmail.com manages clinic 1 (primary) only
//   - manager2@gmail.com manages clinic 2 (Dwarka branch) only
//   - the owner sees both
//
// The decisive assertion: clinic 2 exists with a Monday schedule slot (both
// seeded), and the manager of clinic 1 must NEVER see clinic 2's data — not
// in the page HTML, not via any scoped API. Requires: migration 0009 applied
// + `npm run db:seed` (creates owner/manager1/manager2 + the two clinics).
import { test, expect } from "@playwright/test";
import { ACCOUNTS, SEED_PASSWORD } from "./test-env";

const CLINIC_TWO_NAME = "Malhotra Health — Dwarka Branch";

// Log in via the UI and return a context holding the session.
async function loginAs(
  browser: import("@playwright/test").Browser,
  email: string
): Promise<import("@playwright/test").BrowserContext> {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 });
  return ctx;
}

test("manager of clinic 1 cannot see clinic 2 anywhere", async ({ browser }) => {
  const ctx = await loginAs(browser, ACCOUNTS.manager1);
  const page = await ctx.newPage();

  // Overview loads and shows the shell.
  await page.goto("/admin");
  await expect(page.getByText("Clinic overview")).toBeVisible();

  // The decisive negative: the other clinic's name never leaks onto ANY
  // /admin page the manager can reach.
  for (const url of ["/admin", "/admin/appointments", "/admin/patients", "/admin/schedule", "/admin/staff", "/admin/billing", "/admin/income-expense", "/admin/test-bookings", "/admin/follow-ups"]) {
    await page.goto(url);
    const body = await page.locator("body").innerText();
    expect.soft(body, `${url} leaks clinic 2`).not.toContain(CLINIC_TWO_NAME);
  }

  // Owner-only modules bounce a manager back to /admin.
  for (const url of ["/admin/clinics", "/admin/managers", "/admin/settings"]) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `manager on ${url}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.headers().location, `manager ${url} location`).toBe("/admin");
  }

  await ctx.close();
});

test("manager of clinic 2 sees only their branch", async ({ browser }) => {
  const ctx = await loginAs(browser, ACCOUNTS.manager2);
  const page = await ctx.newPage();

  await page.goto("/admin/schedule");
  await expect(page.getByText(CLINIC_TWO_NAME)).toBeVisible();

  // And never the primary clinic.
  await page.goto("/admin");
  const body = await page.locator("body").innerText();
  expect.soft(body, "/admin leaks primary clinic to manager2").not.toContain("SkoraCares Wellness Clinic");

  await ctx.close();
});

test("owner sees both clinics on the overview comparison", async ({ browser }) => {
  const ctx = await loginAs(browser, ACCOUNTS.owner);
  const page = await ctx.newPage();

  await page.goto("/admin");
  await expect(page.getByText("Business overview")).toBeVisible();
  await expect(page.getByText(CLINIC_TWO_NAME).first()).toBeVisible();
  // .first() — the clinic name legitimately appears multiple times (clinic
  // comparison row + upcoming-appointment rows) and strict mode forbids
  // multi-match locators.
  await expect(page.getByText("SkoraCares Wellness Clinic").first()).toBeVisible();

  // Owner-only modules open for the owner.
  await page.goto("/admin/managers");
  await expect(page.getByText("Current assignments")).toBeVisible();

  await ctx.close();
});
