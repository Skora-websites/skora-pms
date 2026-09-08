// Active smoke test: every route, every role. Evidence-based.
import { test, expect } from "@playwright/test";

const DOCTOR_ROUTES = [
  "/", "/login",
  "/doctor", "/doctor/appointments", "/doctor/appointments/book", "/doctor/billing",
  "/doctor/chat", "/doctor/consultations", "/doctor/consult-pdf", "/doctor/emergency",
  "/doctor/faq", "/doctor/follow-ups", "/doctor/home-visits", "/doctor/income-expense",
  "/doctor/notifications", "/doctor/online-consultations", "/doctor/patients",
  "/doctor/patients/new", "/doctor/profile", "/doctor/roles", "/doctor/schedule",
  "/doctor/settings", "/doctor/shop", "/doctor/staff", "/doctor/support",
  "/doctor/test-bookings",
];

const ADMIN_ROUTES = [
  "/super-admin", "/super-admin/audit-logs", "/super-admin/blogs", "/super-admin/clinics",
  "/super-admin/doctors", "/super-admin/email-setup", "/super-admin/landing", "/super-admin/masters",
  "/super-admin/settings", "/super-admin/support", "/super-admin/users",
];

const PUBLIC_ROUTES = [
  "/", "/about", "/blog", "/contact", "/privacy-policy", "/terms-conditions",
  "/refund-policy", "/cancellation-policy", "/login", "/signup",
];

test.setTimeout(300_000);

test("smoke: public routes render 200", async ({ request }) => {
  for (const r of PUBLIC_ROUTES) {
    const res = await request.get(r);
    expect.soft(res.status(), `public ${r}`).toBeLessThan(400);
  }
});

test("smoke: doctor dashboard + all pages render (network-error-free)", async ({ page }) => {
  const errors: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400) errors.push(`${res.status()} ${res.url()}`);
  });
  for (const r of DOCTOR_ROUTES) {
    const res = await page.goto(r, { waitUntil: "domcontentloaded" });
    expect.soft(res?.status(), `doctor ${r}`).toBeLessThan(500);
    await expect.soft(page.locator("body")).toBeVisible();
  }
  expect(errors, errors.join("\n")).toEqual([]);
});

test("smoke: admin dashboard + all pages render (network-error-free)", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: "e2e/.auth/admin.json" });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("response", (res) => { if (res.status() >= 400) errors.push(`${res.status()} ${res.url()}`); });
  for (const r of ADMIN_ROUTES) {
    const res = await page.goto(r, { waitUntil: "domcontentloaded" });
    expect.soft(res?.status(), `admin ${r}`).toBeLessThan(500);
    await expect.soft(page.locator("body")).toBeVisible();
  }
  expect(errors, errors.join("\n")).toEqual([]);
  await ctx.close();
});

test("smoke: API endpoints reachable + auth-guarded", async ({ browser }) => {
  const authed = await browser.newContext({ storageState: "e2e/.auth/doctor.json" });
  for (const r of ["/api/medicines/search?q=para", "/api/doctor/appointments/booked-times"]) {
    const res = await authed.request.get(r);
    expect.soft(res.status(), `authed api ${r}`).toBeLessThan(500);
  }
  await authed.close();

  const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } }); // explicit anon — newContext() inherits config storageState
  const res = await anon.request.get("/api/medicines/search?q=para");
  expect.soft([302, 303, 307, 401, 403], `anon medicines status=${res.status()}`).toContain(res.status());
  const res2 = await anon.request.get("/api/doctor/appointments/booked-times");
  expect.soft([302, 303, 307, 401, 403], `anon booked-times status=${res2.status()}`).toContain(res2.status());
  await anon.close();
});
