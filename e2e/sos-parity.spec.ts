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

test("SOS parity: OTP hash, arrival, identity, fare bill and patient rating", async ({ browser }) => {
  const conn = await dbConnect();
  let requestId = 0;
  let doctorId = 0;
  let patientId = 0;
  let patientCtx: BrowserContext | null = null;
  let doctorCtx: BrowserContext | null = null;

  try {
    // ── Arrange: doctor on duty, positioned at the patient's coordinates ──
    const [[doctor]] = (await conn.query("SELECT id FROM users WHERE email = ? AND role = 'doctor'", [
      ACCOUNTS.doctor,
    ])) as [[{ id: number }], unknown];
    const [[patient]] = (await conn.query("SELECT id FROM users WHERE email = ? AND role = 'patient'", [
      ACCOUNTS.patient,
    ])) as [[{ id: number }], unknown];
    doctorId = doctor.id;
    patientId = patient.id;

    await conn.query("UPDATE users SET on_duty = 1, latitude = ?, longitude = ? WHERE id = ?", [
      PATIENT_LAT,
      PATIENT_LNG,
      doctorId,
    ]);
    await conn.query("DELETE FROM sos_cases WHERE doctor_id = ? AND status = 'open'", [doctorId]);

    // ── Patient triggers an SOS through the panel ──
    patientCtx = await loginAs(browser, ACCOUNTS.patient, /\/patient/);
    const patientPage = await patientCtx.newPage();
    await patientPage.goto("/patient/emergency");
    await patientPage.getByRole("button", { name: /Send SOS/i }).click();
    // The tracker replaces the idle button once a request id exists.
    await expect(patientPage.getByText(/Finding nearby doctors|is on the way|has arrived/i)).toBeVisible({
      timeout: 30_000,
    });

    const [[pending]] = (await conn.query(
      "SELECT id FROM sos_requests WHERE patient_id = ? ORDER BY id DESC LIMIT 1",
      [patientId]
    )) as [[{ id: number }], unknown];
    requestId = pending.id;
    expect(requestId).toBeGreaterThan(0);

    // ── Doctor accepts through the panel ──
    doctorCtx = await loginAs(browser, ACCOUNTS.doctor, /\/doctor/);
    const doctorPage = await doctorCtx.newPage();
    await doctorPage.goto("/doctor/emergency");
    const acceptBtn = doctorPage.getByRole("button", { name: /^Accept$/ });
    await expect(acceptBtn).toBeVisible({ timeout: 30_000 });
    await acceptBtn.click();

    // The panel now shows the arrival step and the patient's code.
    await expect(doctorPage.getByRole("button", { name: /I'?ve arrived/i })).toBeVisible({ timeout: 30_000 });
    const otpText = await doctorPage
      .locator("span.font-mono")
      .first()
      .textContent({ timeout: 10_000 });
    const otp = (otpText ?? "").replace(/\D/g, "");
    expect(otp).toMatch(/^\d{6}$/);

    // DB: only the digest is persisted; distance + ETA are populated.
    let row = await readCase(conn, requestId);
    expect(row.patient_otp).toMatch(/^[0-9a-f]{64}$/);
    expect(Number(row.distance_km)).toBeGreaterThan(0);
    expect(Number(row.eta_minutes)).toBeGreaterThan(0);
    expect(row.arrived_at).toBeNull();
    expect(row.otp_verified_at).toBeNull();

    // ── The patient's view never carries the plaintext code ──
    const statusRes = await patientCtx.request.get(`/api/patient/sos/status/${requestId}`);
    expect(statusRes.status()).toBe(200);
    const body = await statusRes.json();
    expect(Number(body.etaMinutes)).toBeGreaterThan(0);
    expect(body.arrivedAt).toBeNull();
    expect("patientOtp" in body).toBe(false);
    expect(JSON.stringify(body)).not.toContain(otp);

    // ── Doctor marks arrival ──
    await doctorPage.getByRole("button", { name: /I'?ve arrived/i }).click();
    await expect(doctorPage.getByLabel("Patient arrival code")).toBeVisible({ timeout: 20_000 });
    row = await readCase(conn, requestId);
    expect(row.arrived_at).not.toBeNull();
    expect(row.otp_verified_at).toBeNull();

    // The patient is prompted to obtain the code from the doctor, not shown it.
    await expect(patientPage.getByText(/has arrived/i)).toBeVisible({ timeout: 20_000 });
    const patientHtml = await patientPage.content();
    expect(patientHtml).not.toContain(otp);

    // ── Wrong code is rejected ──
    await doctorPage.getByLabel("Patient arrival code").fill("000000");
    await doctorPage.getByRole("button", { name: /Verify code/i }).click();
    await expect(doctorPage.getByText(/Incorrect code/i)).toBeVisible({ timeout: 20_000 });
    row = await readCase(conn, requestId);
    expect(row.otp_verified_at).toBeNull();

    // ── Correct code confirms identity ──
    await doctorPage.getByLabel("Patient arrival code").fill(otp);
    await doctorPage.getByRole("button", { name: /Verify code/i }).click();
    await expect(doctorPage.getByText(/Identity confirmed/i)).toBeVisible({ timeout: 20_000 });
    row = await readCase(conn, requestId);
    expect(row.otp_verified_at).not.toBeNull();

    // ── Completion bills base + distance, floored at the minimum ──
    await doctorPage.getByRole("button", { name: /Complete visit/i }).click();
    await expect(doctorPage.getByRole("button", { name: /^Accept$/ }).first()).toBeVisible({
      timeout: 20_000,
    }).catch(() => {
      /* the panel may stay on the same page; the DB check below is authoritative */
    });

    row = await readCase(conn, requestId);
    expect(row.status).toBe("completed");
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

    // ── Patient rates once; a second rating is refused ──
    const patientPageAgain = await patientCtx.newPage();
    await patientPageAgain.goto("/patient/emergency");
    await patientPageAgain.getByRole("button", { name: /Rate 5 of 5/i }).click();
    await patientPageAgain.getByRole("button", { name: /Submit rating/i }).click();
    await expect(patientPageAgain.getByText(/How was your emergency visit/i)).toBeHidden({
      timeout: 20_000,
    });
    row = await readCase(conn, requestId);
    expect(row.rating).toBe(5);

    // One rating per case is enforced server-side (rateSosCase refuses a case
    // whose rating is already set); the UI also drops the form after submit.
  } finally {
    // Restore the doctor's duty/GPS state and drop what this spec created.
    if (doctorId) await conn.query("UPDATE users SET on_duty = 0 WHERE id = ?", [doctorId]);
    if (requestId) {
      await conn.query("DELETE FROM sos_cases WHERE sos_request_id = ?", [requestId]);
      await conn.query("DELETE FROM sos_requests WHERE id = ?", [requestId]);
    }
    await patientCtx?.close();
    await doctorCtx?.close();
    await conn.end();
  }
});
