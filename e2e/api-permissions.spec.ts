// API module-permission regression — the audit's central finding (F-01/F-02/F-19).
//
// F-01: every API route authorized on ROLE alone; module PERMISSION was
// enforced only in the layouts, which a single direct HTTP request bypasses.
// These tests pin the boundary so it cannot silently regress:
//   - a principal holding the role but not the module gets exactly 403
//   - doctor-only panels (SOS dispatch, prescriptions) reject receptionists (F-02)
//   - a patients export writes an audit_logs row (F-19)
//   - admin-tier callers keep their legitimate access (owner bypass, manager grants)
//
// Runs against a live dev server + the seeded DB (E2E_BASE_URL / E2E_DB_*).
import { test, expect } from "@playwright/test";
import mysql from "mysql2/promise";
import { grantDoctorModules, revokeDoctorModules } from "./helpers";
import { ACCOUNTS, SEED_PASSWORD, DB } from "./test-env";

test.describe.configure({ mode: "serial" });
// Config default storage state is the shared seeded doctor session.
test.use({ storageState: "e2e/.auth/doctor.json" });

async function dbConnect() {
  return mysql.createConnection({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password,
    database: DB.database,
  });
}

/** UI login returning a context with the session cookie (like admin-scope). */
async function loginAs(
  browser: import("@playwright/test").Browser,
  email: string,
  homePattern: RegExp
): Promise<import("@playwright/test").BrowserContext> {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL(homePattern, { timeout: 60_000 });
  return ctx;
}

test.beforeAll(async () => {
  // Make the denial deterministic: whatever earlier specs granted directly,
  // the shared doctor must NOT hold `registrations` here (the seeded Doctor
  // role never includes it). Later specs self-grant via grantDoctorModules.
  await revokeDoctorModules(["registrations"]);
});

test("doctor without `registrations` module: patient roster + photo denied (403)", async ({ request }) => {
  const roster = await request.get("/api/doctor/patients/export");
  expect(roster.status()).toBe(403);

  // Same module gates the roster's photos — and must not leak a different
  // status that could act as an oracle for which patient ids exist.
  const photo = await request.get("/api/doctor/patients/3/photo");
  expect(photo.status()).toBe(403);
});

test("receptionist without the module: billing, ledger, staff and doctor-only panels denied", async ({ browser }) => {
  const ctx = await loginAs(browser, ACCOUNTS.receptionist, /\/(receptionist|doctor)(\/|$)/);
  // Receptionist role has 6 modules — no billing, income-expense,
  // roles-permissions, home-visit.
  for (const url of [
    "/api/doctor/income-expense/export",
    "/api/doctor/billing/1/pdf",
    "/api/doctor/staff/attendance",
    "/api/doctor/staff/attendance/report",
    "/api/doctor/home-visits/patient-details/3",
  ]) {
    const res = await ctx.request.get(url);
    expect(res.status(), `receptionist -> ${url}`).toBe(403);
  }
  // F-02 doctor-only panels: receptionist is excluded outright.
  const sos = await ctx.request.get("/api/doctor/sos/status");
  expect(sos.status(), "receptionist -> sos/status (doctor-only panel)").toBe(403);
  const rx = await ctx.request.get("/api/prescriptions/1");
  expect(rx.status(), "receptionist -> prescriptions (doctor-only panel)").toBe(403);
  await ctx.close();
});

test("doctor keeps dashboard-scoped endpoints despite the tightened guards", async ({ request }) => {
  // Content-dependent routes: assert "authenticated and authorized", not a
  // specific payload (a missing consult PDF is 404, never 401/403).
  const consult = await request.get("/api/doctor/consult-pdf");
  expect(consult.status(), "consult-pdf (dashboard module)").not.toBe(401);
  expect(consult.status(), "consult-pdf (dashboard module)").not.toBe(403);

  const times = await request.get("/api/doctor/appointments/booked-times?date=2031-01-01");
  expect(times.status(), "booked-times (appointments module)").toBe(200);

  // medicines/search stays role-only shared reference data.
  const meds = await request.get("/api/medicines/search?q=x");
  expect(meds.status()).toBe(200);
});

test("admin tier retains access: owner bypasses, manager needs the module", async ({ browser }) => {
  // Owner bypasses module permissions by design (requireAdminTier parity).
  const ownerCtx = await loginAs(browser, ACCOUNTS.owner, /\/admin(\/|$)/);
  // Pick any in-scope bill — the assertion is authorization, not payload.
  const conn = await dbConnect();
  let billId = 0;
  try {
    const [rows] = await conn.query(
      `SELECT b.id FROM billings b
       JOIN users d ON d.id = b.doctor_id
       WHERE b.doctor_id = (SELECT id FROM users WHERE email = ?)
         AND b.deleted_at IS NULL
       ORDER BY b.id ASC LIMIT 1`,
      [ACCOUNTS.doctor]
    );
    billId = (rows as { id: number }[])[0]?.id ?? 0;
  } finally {
    await conn.end();
  }
  if (billId > 0) {
    const res = await ownerCtx.request.get(`/api/doctor/billing/${billId}/pdf`);
    expect(res.status(), `owner -> billing/${billId}/pdf (owner bypass)`).toBe(200);
  }
  await ownerCtx.close();

  // Manager holds the module grants the owner assigned them.
  const mgrCtx = await loginAs(browser, ACCOUNTS.manager1, /\/admin(\/|$)/);
  const sugg = await mgrCtx.request.get("/api/doctor/test-bookings/suggestions?q=a");
  expect(sugg.status(), "manager -> test-bookings suggestions").toBe(200);
  await mgrCtx.close();

  // Patient role never reaches doctor endpoints (403, not a redirect).
  const patCtx = await loginAs(browser, ACCOUNTS.patient, /\/patient(\/|$)/);
  const pat = await patCtx.request.get("/api/doctor/patients/export");
  expect(pat.status(), "patient -> patients export").toBe(403);
  await patCtx.close();

  // Anonymous stays 401 (explicit empty storageState — bare newContext()
  // inherits the config's doctor session).
  const anonCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const anon = await anonCtx.request.get("/api/doctor/patients/export");
  expect(anon.status()).toBe(401);
  await anonCtx.close();
});

test("patients export writes an audit_logs row (F-19)", async ({ request }) => {
  // Grant the module, export, then verify the audit trail received the event.
  await grantDoctorModules(["registrations"]);
  const res = await request.get("/api/doctor/patients/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");

  const conn = await dbConnect();
  try {
    const [rows] = await conn.query(
      `SELECT id, action, user_id, metadata FROM audit_logs
       WHERE user_id = (SELECT id FROM users WHERE email = ?)
         AND action = 'pdf_downloaded'
         AND metadata LIKE '%"action":"export"%'
       ORDER BY id DESC LIMIT 1`,
      [ACCOUNTS.doctor]
    );
    const auditRow = (rows as { id: number; metadata: unknown }[])[0];
    expect(auditRow, "patients export produced an audit_logs row").toBeTruthy();
    const meta = auditRow?.metadata as { description?: string } | null;
    expect(meta?.description ?? "").toContain("Patient roster exported");
  } finally {
    await conn.end();
  }
});
