// Staff permission flow (replaces the deleted one-off tmp-rec-flow.cjs):
// a receptionist with a limited practice role sees ONLY the permitted modules
// in the sidebar, renders permitted pages, and blocked URLs redirect to their
// first permitted page — server-side, before any page code runs.
import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test("staff login: nav filtered by role, blocked modules redirect", async ({ browser }) => {
  // ── As the doctor: create a registrations-only role + staff account ──────
  const doctorCtx = await browser.newContext({ storageState: "e2e/.auth/doctor.json" });
  const doctor = await doctorCtx.newPage();
  const roleName = unique("E2E Staff Flow Role");
  const staffName = unique("E2E Staff Flow");
  const staffEmail = `${unique("staffflow").toLowerCase()}@example.com`;

  await doctor.goto("/doctor/roles");
  await doctor.getByRole("button", { name: /New role/i }).click();
  await doctor.getByLabel("Role name").fill(roleName);
  await doctor.getByRole("checkbox", { name: "registrations" }).check();
  await doctor.getByRole("button", { name: /Create role/i }).click();
  await expect(doctor.locator(".card", { hasText: roleName })).toBeVisible({ timeout: 15_000 });

  await doctor.goto("/doctor/staff");
  await doctor.getByRole("button", { name: /Add staff/i }).click();
  await doctor.getByLabel("Full name").fill(staffName);
  await doctor.getByLabel("Email").fill(staffEmail);
  await doctor.getByLabel("Phone").fill("9876500000");
  await doctor.getByLabel("Password").fill("Test@1234");
  await doctor.getByLabel("Role").selectOption({ label: roleName });
  await doctor.locator("form").getByRole("button", { name: /Add staff/i }).click();
  await expect(doctor.locator(".card.p-5", { hasText: staffName })).toBeVisible({ timeout: 15_000 });
  await doctorCtx.close();

  // ── As the staff user: login with the limited role ───────────────────────
  // Explicit empty storageState — browser.newContext() inherits the config's
  // doctor storageState, which would silently log the staff in as the doctor.
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(staffEmail);
  await page.getByLabel("Password").fill("Test@1234");
  await page.getByRole("button", { name: /Sign in/i }).click();
  // No dashboard perm → lands on first permitted page (registrations).
  await page.waitForURL(/\/doctor\/patients(\/|$|\?)/, { timeout: 120_000 });

  // ── Sidebar shows only permitted modules ─────────────────────────────────
  const navLink = page.locator("aside nav a", { hasText: "Registrations" }).first();
  await expect(navLink).toBeVisible({ timeout: 30_000 });
  const navLabels = await page.locator("aside nav a span").allTextContents();
  const labels = navLabels.map((t) => t.trim()).filter(Boolean);
  expect(labels).toContain("Registrations");
  for (const absent of ["Dashboard", "Income & Expense", "Billing", "Schedule Time", "My Staff"]) {
    expect(labels, `nav must not show ${absent}`).not.toContain(absent);
  }

  // ── Permitted module renders ─────────────────────────────────────────────
  await page.goto("/doctor/patients");
  await expect(page).toHaveURL(/\/doctor\/patients/);

  // ── Blocked modules redirect to first permitted page ────────────────────
  for (const blocked of ["/doctor", "/doctor/income-expense", "/doctor/schedule", "/doctor/staff"]) {
    await page.goto(blocked);
    await page.waitForURL(/\/doctor\/patients/, { timeout: 15_000 });
  }

  await ctx.close();
});
