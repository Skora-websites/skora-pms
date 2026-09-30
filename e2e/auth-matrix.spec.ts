// API + page auth matrix — raw HTTP with explicit storageState (config default leaks doctor session into "anon" request fixture).
import { test, expect } from "@playwright/test";
import { ACCOUNTS, SEED_PASSWORD } from "./test-env";

const PROTECTED_GET = [
  "/api/medicines/search?q=para",
  "/api/doctor/appointments/booked-times?date=2026-01-01",
  "/api/doctors/1/photo",
  "/api/super-admin/file/x.png",
  "/api/patient/test-reports/999999",
  "/api/doctor/sos/status",
  "/api/doctor/income-expense/export",
  "/api/doctor/patients/export",
  "/api/doctor/appointments/export",
  "/api/super-admin/support/export",
  "/api/super-admin/masters/medicines/export",
];

const DOCTOR_PAGES = [
  "/doctor", "/doctor/billing", "/doctor/patients", "/doctor/staff", "/doctor/settings",
];

const ADMIN_PAGES = [
  "/admin", "/admin/appointments", "/admin/patients", "/admin/billing", "/admin/staff",
];

test("anon API requests get 401/403, never 200", async ({ browser }) => {
  // explicit empty storageState — browser.newContext() inherits the config's
  // doctor storageState, which would silently auth our "anon" requests.
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const req = ctx.request;
  for (const url of PROTECTED_GET) {
    const res = await req.get(url, { maxRedirects: 0 });
    // API routes either 401/403 or 307 to /login (guard redirect). Anything else leaks.
    const ok = [401, 403].includes(res.status()) || (res.status() === 307 && res.headers().location === "/login");
    expect.soft(ok, `anon ${url} -> ${res.status()} loc=${res.headers().location}`).toBe(true);
  }
  await ctx.close();
});

test("anon doctor pages redirect to /login", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  for (const url of DOCTOR_PAGES) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `anon ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `anon ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location, `anon ${url} location`).toBe("/login");
  }
  await ctx.close();
});

test("doctor-role user blocked from super-admin pages (server-side redirect)", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: "e2e/.auth/doctor.json" });
  for (const url of ["/super-admin", "/super-admin/users", "/super-admin/masters"]) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `doctor on ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `doctor on ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location).toBe("/doctor");
  }
  await ctx.close();
});

test("super_admin-role user blocked from doctor pages (server-side redirect)", async ({ browser }) => {
  // admin.json stores the seeded super-admin session (see global-setup).
  const ctx = await browser.newContext({ storageState: "e2e/.auth/admin.json" });
  for (const url of DOCTOR_PAGES) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `super_admin on ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `super_admin on ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location).toBe("/super-admin");
  }
  await ctx.close();
});

test("business-owner blocked from doctor + super-admin pages (server-side redirect)", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: "e2e/.auth/owner.json" });
  for (const url of [...DOCTOR_PAGES, "/super-admin", "/super-admin/users"]) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `owner on ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `owner on ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location).toBe("/admin");
  }
  await ctx.close();
});

test("anon admin pages redirect to /login", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  for (const url of ADMIN_PAGES) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `anon ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `anon ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location, `anon ${url} location`).toBe("/login");
  }
  await ctx.close();
});

// Proxy-level gate (proxy.ts runs before layouts render): every dashboard
// prefix must bounce an anonymous request to /login — this is the second net
// behind the per-role layout guards.
test("proxy gate: anon requests to every dashboard prefix redirect to /login", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  for (const url of ["/patient", "/patient/appointments", "/super-admin", "/super-admin/users", "/admin/clinics", "/receptionist", "/receptionist/appointments"]) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `anon ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `anon ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location, `anon ${url} location`).toBe("/login");
  }
  // A forged session cookie must not pass the proxy's JWT verification.
  const forged = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  await forged.addCookies([{ name: "skora_session", value: "forged.token.value", domain: "localhost", path: "/" }]);
  const forgedRes = await forged.request.get("/doctor", { maxRedirects: 0 });
  expect.soft(forgedRes.status(), `forged cookie /doctor -> ${forgedRes.status()}`).toBeGreaterThanOrEqual(300);
  expect.soft(forgedRes.headers().location, "forged cookie location").toBe("/login");
  await forged.close();
  await ctx.close();
});

// Security headers ship on every response (proxy responsibility).
test("proxy sets security headers on page responses", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const res = await ctx.request.get("/login");
  expect(res.status()).toBe(200);
  for (const header of ["x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "content-security-policy"]) {
    expect.soft(res.headers()[header], `header ${header}`).toBeTruthy();
  }
  await ctx.close();
});

test("doctor-role user blocked from admin tier pages (server-side redirect)", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: "e2e/.auth/doctor.json" });
  for (const url of ADMIN_PAGES) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `doctor on ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `doctor on ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location).toBe("/doctor");
  }
  await ctx.close();
});

test("patient-role user blocked from admin tier pages (server-side redirect)", async ({ browser }) => {
  // Global setup stores the doctor session under doctor.json; the patient
  // session file is produced by the same login flow on demand here.
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(ACCOUNTS.patient);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL(/\/patient(\/|$)/, { timeout: 60_000 });

  for (const url of ADMIN_PAGES) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `patient on ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `patient on ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location).toBe("/patient");
  }
  await ctx.close();
});

// Regression (audit NV-1): the /api/super-admin route handlers used to admit
// the "admin" (business-owner) role from a stale ["super_admin","admin"] list,
// exposing platform-wide reads (support-ticket export) to a tenant principal.
// The pages were fixed long before the APIs were — assert the API gates too.
const SUPER_ADMIN_APIS = [
  "/api/super-admin/support/export",
  "/api/super-admin/masters/medicines/export",
  "/api/super-admin/file/x.png",
];

test("business-owner role gets 403 on every super-admin API (role-list regression)", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: "e2e/.auth/owner.json" });
  for (const url of SUPER_ADMIN_APIS) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    // Exactly 403: the authenticated tenant must be forbidden outright —
    // not 200 (the old bug), not a login redirect.
    expect(res.status(), `owner on ${url} -> ${res.status()}`).toBe(403);
  }
  await ctx.close();
});

test("super_admin role still passes super-admin API gates (positive control)", async ({ browser }) => {
  // admin.json stores the seeded super-admin session. The platform operator
  // must NOT be locked out by the fix: exports return 200; the file route
  // passes the gate and reaches its own path validation (404 for a bad path).
  const ctx = await browser.newContext({ storageState: "e2e/.auth/admin.json" });
  const support = await ctx.request.get("/api/super-admin/support/export", { maxRedirects: 0 });
  expect(support.status(), "super_admin support export").toBe(200);
  const masters = await ctx.request.get("/api/super-admin/masters/medicines/export", { maxRedirects: 0 });
  expect(masters.status(), "super_admin masters export").toBe(200);
  const file = await ctx.request.get("/api/super-admin/file/x.png", { maxRedirects: 0 });
  expect(file.status(), "super_admin file route passes role gate").toBe(404);
  await ctx.close();
});

test("manager-role user is admitted to /admin and bounced from owner-only modules", async ({ browser }) => {
  // Manager session: log in on the fly (seed data assigns manager1 to the
  // primary clinic with the full clinic-ops module set).
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(ACCOUNTS.manager1);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 });

  // Admitted to the shell and shared ops pages.
  const okHome = await ctx.request.get("/admin", { maxRedirects: 0 });
  expect.soft(okHome.status(), `manager /admin -> ${okHome.status()}`).toBe(200);
  const okAppts = await ctx.request.get("/admin/appointments", { maxRedirects: 0 });
  expect.soft(okAppts.status(), `manager /admin/appointments -> ${okAppts.status()}`).toBe(200);

  // Owner-only modules must redirect (back to /admin, not leak data).
  for (const url of ["/admin/clinics", "/admin/managers", "/admin/settings"]) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `manager on ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `manager on ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location).toBe("/admin");
  }
  await ctx.close();
});
