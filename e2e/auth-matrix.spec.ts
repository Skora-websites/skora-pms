// API + page auth matrix — raw HTTP with explicit storageState (config default leaks doctor session into "anon" request fixture).
import { test, expect } from "@playwright/test";

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

test("admin-role user blocked from doctor pages (server-side redirect)", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: "e2e/.auth/admin.json" });
  for (const url of DOCTOR_PAGES) {
    const res = await ctx.request.get(url, { maxRedirects: 0 });
    expect.soft(res.status(), `admin on ${url} -> ${res.status()}`).toBeGreaterThanOrEqual(300);
    expect.soft(res.status(), `admin on ${url} not redirect`).toBeLessThan(400);
    expect.soft(res.headers().location).toBe("/super-admin");
  }
  await ctx.close();
});
