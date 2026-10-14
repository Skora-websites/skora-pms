// SOS parity contract — the Uber/Ola/Rapido feature set (arrival, OTP identity
// verification, fare, patient rating) plus the OTP privacy invariant:
// the plaintext code must never be served to the patient's session.
//
// The lifecycle (trigger/accept/arrive/verify/complete/rate) is driven through
// the real UI — those are server actions with no HTTP surface — with DB
// assertions between steps.
//
// Runs against a live dev server + the seeded DB (E2E_BASE_URL / E2E_DB_*).
import { test, expect } from "@playwright/test";
import type { Browser, BrowserContext } from "@playwright/test";
import mysql from "mysql2/promise";
import { ACCOUNTS, SEED_PASSWORD, DB } from "./test-env";

test.describe.configure({ mode: "serial" });

/** Delhi — far from any seeded clinic, so only the doctor's own GPS counts. */
const PATIENT_LAT = 28.6139;
const PATIENT_LNG = 77.209;

async function loginAs(browser: Browser, email: string, homePattern: RegExp): Promise<BrowserContext> {
  const ctx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    permissions: ["geolocation"],
    geolocation: { latitude: PATIENT_LAT, longitude: PATIENT_LNG },
  });
  const page = await ctx.newPage();
  // The post-login permission nudge is a fixed overlay that intercepts clicks;
  // pre-seed its dismissal key (same key e2e/global-setup.ts uses).
  await page.addInitScript(() => localStorage.setItem("skoracare-perms-dismissed", "1"));
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL(homePattern, { timeout: 60_000 });
  return ctx;
}

async function dbConnect() {
  return mysql.createConnection({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password ?? "",
    database: DB.database,
  });
}

type CaseRow = Record<string, unknown>;

async function readCase(conn: mysql.Connection, requestId: number): Promise<CaseRow> {
  const [[row]] = (await conn.query(
    `SELECT patient_otp, distance_km, eta_minutes, arrived_at, otp_verified_at,
            billing_id, rating, rating_note, status
       FROM sos_cases WHERE sos_request_id = ?`,
    [requestId]
  )) as [[CaseRow], unknown];
  return row;
}

/** Poll the case row until `predicate` holds — the writes are the contract. */
async function waitForCase(
  conn: mysql.Connection,
  requestId: number,
  predicate: (row: CaseRow) => boolean,
  timeoutMs = 20_000
): Promise<CaseRow> {
  const deadline = Date.now() + timeoutMs;
  let last: CaseRow | null = null;
  for (;;) {
    const row = await readCase(conn, requestId);
    last = row ?? null;
    if (row && predicate(row)) return row;
    if (Date.now() > deadline) {
      throw new Error(
        `Timed out waiting for case ${requestId}; last state: ${JSON.stringify(last ?? "no sos_cases row")}`
      );
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

test("SOS parity: OTP hash, arrival, identity, fare bill and patient rating", async ({ browser }) => {
  const conn = await dbConnect();
  let requestId = 0;
  let doctorId = 0;
  let patientId = 0;
  let patientCtx: BrowserContext | null = null;
  let doctorCtx: BrowserContext | null = null;

  try {
    // ── Arrange: an isolated patient (own rate-limit key, no prior requests)
    // plus a doctor on duty at the patient's coordinates ──
    const [[doctor]] = (await conn.query("SELECT id FROM users WHERE email = ? AND role = 'doctor'", [
      ACCOUNTS.doctor,
    ])) as [[{ id: number }], unknown];
    const [[seedPatient]] = (await conn.query(
      "SELECT id, password, name, phone FROM users WHERE email = ? AND role = 'patient'",
      [ACCOUNTS.patient]
    )) as [[{ id: number; password: string; name: string; phone: string | null }], unknown];
    doctorId = doctor.id;

    // Clone the seeded patient's credentials under a unique email so this run
    // cannot collide with (or inherit the SOS throttle of) any other run.
    const patientEmail = `sosparity-${Date.now().toString(36)}@example.com`;
    const [inserted] = (await conn.query(
      `INSERT INTO users (name, email, password, role, status, phone, gender, created_at, updated_at)
       VALUES (?, ?, ?, 'patient', 'active', ?, 'Other', NOW(), NOW())`,
      ["SOS Parity Patient", patientEmail, seedPatient.password, seedPatient.phone ?? "9000000000"]
    )) as [{ insertId: number }, unknown];
    patientId = inserted.insertId;

    await conn.query("UPDATE users SET on_duty = 1, latitude = ?, longitude = ? WHERE id = ?", [
      PATIENT_LAT,
      PATIENT_LNG,
      doctorId,
    ]);
    await conn.query("DELETE FROM sos_cases WHERE doctor_id = ? AND status = 'open'", [doctorId]);
    await conn.query("DELETE FROM sos_requests WHERE patient_id = ?", [patientId]);

    // ── Patient triggers an SOS through the panel ──
    patientCtx = await loginAs(browser, patientEmail, /\/patient/);
    const patientPage = await patientCtx.newPage();
    patientPage.on("pageerror", (e) => console.log("[pageerror]", e.message));
    await patientPage.goto("/patient/emergency");
    await patientPage.getByRole("button", { name: /Send SOS/i }).click();
    // The tracker REPLACES the idle SOS button, so "button gone" is the
    // provider-independent signal that the request id was accepted.
    const sosButton = patientPage.getByRole("button", { name: /Send SOS/i });
    try {
      await expect(sosButton).toBeHidden({ timeout: 40_000 });
    } catch {
      const t = await patientPage.locator("body").innerText();
      const i = t.indexOf("Emergency help");
      throw new Error(`Tracker never took over. Panel: ${JSON.stringify(t.slice(i, i + 300))}`);
    }

    // The spec's own patient has no other requests (cleared above), so the
    // newest row is the one this click created.
    const [[pending]] = (await conn.query(
      "SELECT id FROM sos_requests WHERE patient_id = ? ORDER BY id DESC LIMIT 1",
      [patientId]
    )) as [[{ id: number }], unknown];
    requestId = pending.id;
    expect(requestId, "no sos_request row was created by the trigger").toBeGreaterThan(0);

    // ── Doctor accepts through the panel ──
    doctorCtx = await loginAs(browser, ACCOUNTS.doctor, /\/doctor/);
    const doctorPage = await doctorCtx.newPage();
    await doctorPage.goto("/doctor/emergency");
    const acceptBtn = doctorPage.getByRole("button", { name: /^Accept$/ });
    await expect(acceptBtn).toBeVisible({ timeout: 30_000 });
    await acceptBtn.click();

    // The case row is written before the UI settles — wait on it.
    let row = await waitForCase(conn, requestId, (r) => typeof r.patient_otp === "string");

    // DB: only the digest is persisted; distance + ETA are populated.
    expect(row.patient_otp).toMatch(/^[0-9a-f]{64}$/);
    expect(Number(row.distance_km)).toBeGreaterThan(0);
    expect(Number(row.eta_minutes)).toBeGreaterThan(0);
    expect(row.arrived_at).toBeNull();
    expect(row.otp_verified_at).toBeNull();

    // The plaintext code is rendered only once the doctor marks arrival.
    await doctorPage.getByRole("button", { name: /I'?ve arrived/i }).click();
    await waitForCase(conn, requestId, (r) => r.arrived_at !== null);
    const otpText = await doctorPage.locator("span.font-mono").first().textContent({ timeout: 20_000 });
    const otp = (otpText ?? "").replace(/\D/g, "");
    expect(otp).toMatch(/^\d{6}$/);

    // ── The patient's view never carries the plaintext code ──
    const statusRes = await patientCtx.request.get(`/api/patient/sos/status/${requestId}`);
    expect(statusRes.status()).toBe(200);
    const body = await statusRes.json();
    expect(Number(body.etaMinutes)).toBeGreaterThan(0);
    // Arrival was already marked above.
    expect(body.arrivedAt).not.toBeNull();
    expect("patientOtp" in body).toBe(false);
    expect(JSON.stringify(body)).not.toContain(otp);

    // The arrival-code input replaces the arrival button once arrived.
    await expect(doctorPage.getByLabel("Patient arrival code")).toBeVisible({ timeout: 20_000 });
    row = await readCase(conn, requestId);
    expect(row.otp_verified_at).toBeNull();

    // The patient is prompted to obtain the code from the doctor, not shown it.
    await expect(patientPage.getByText(/has arrived/i).first()).toBeVisible({ timeout: 20_000 });
    const patientHtml = await patientPage.content();
    expect(patientHtml).not.toContain(otp);

    // ── Wrong code is rejected ──
    await doctorPage.getByLabel("Patient arrival code").fill("000000");
    await doctorPage.getByRole("button", { name: /Verify code/i }).click();
    await expect(doctorPage.getByText(/Incorrect code/i).first()).toBeVisible({ timeout: 20_000 });

    // ── Correct code confirms identity ──
    await doctorPage.getByLabel("Patient arrival code").fill(otp);
    await doctorPage.getByRole("button", { name: /Verify code/i }).click();
    await waitForCase(conn, requestId, (r) => r.otp_verified_at !== null);
    await expect(doctorPage.getByText(/Identity confirmed/i).first()).toBeVisible({ timeout: 20_000 });

    // ── Completion bills base + distance, floored at the minimum ──
    await doctorPage.getByRole("button", { name: /Complete visit/i }).click();
    await waitForCase(conn, requestId, (r) => r.status === "completed");
    row = await readCase(conn, requestId);
    expect(row.billing_id).not.toBeNull();

    const [[bill]] = (await conn.query(
      "SELECT payment_method, status, total_amount, pending_amount FROM billings WHERE id = ?",
      [Number(row.billing_id)]
    )) as [[Record<string, unknown>], unknown];
    expect(bill.payment_method).toBe("cash");
    expect(bill.status).toBe("pending");
    const expectedFare = Math.max(100, 100 + Number(row.distance_km) * 25);
    expect(Number(bill.total_amount)).toBeCloseTo(expectedFare, 2);
    expect(Number(bill.pending_amount)).toBeCloseTo(expectedFare, 2);

    // ── Patient rates once ──
    // A completed request is NOT resumed by getMyActiveRequest (it only returns
    // pending/accepted), so the rating form is reachable in the SAME tracker
    // session that followed the visit — not after a reload.
    await expect(patientPage.getByText(/How was your emergency visit/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await patientPage.getByRole("button", { name: /Rate 5 of 5/i }).click();
    await patientPage.getByRole("button", { name: /Submit rating/i }).click();
    row = await waitForCase(conn, requestId, (r) => r.rating === 5);
    expect(row.rating).toBe(5);

    // One rating per case is enforced server-side (rateSosCase refuses a case
    // whose rating is already set); the UI also drops the form after submit.
  } finally {
    // Restore the doctor's duty/GPS state and drop everything this spec made.
    if (doctorId) await conn.query("UPDATE users SET on_duty = 0 WHERE id = ?", [doctorId]);
    if (requestId) {
      await conn.query("DELETE FROM sos_cases WHERE sos_request_id = ?", [requestId]);
      await conn.query("DELETE FROM sos_requests WHERE id = ?", [requestId]);
    }
    // The cloned patient is disposable; its bills/cases are cascaded by the
    // request deletes above.
    if (patientId) await conn.query("DELETE FROM users WHERE id = ? AND email LIKE 'sosparity-%'", [patientId]);
    await patientCtx?.close();
    await doctorCtx?.close();
    await conn.end();
  }
});
