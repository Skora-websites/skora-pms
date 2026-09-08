// Form failure paths: validation, duplicate submission, DB evidence.
import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test("patient form: missing required fields → inline errors, no DB row", async ({ page }) => {
  const before = await countPatients();
  await page.goto("/doctor/patients/new");
  // submit empty form (HTML required may block; bypass via JS to hit server action)
  await page.evaluate(() => {
    const form = document.querySelector("form");
    form?.querySelectorAll("input,select,textarea").forEach((el) => {
      (el as HTMLInputElement).required = false; // strip required to force server-side path
      if (el instanceof HTMLInputElement) el.setCustomValidity("");
    });
  });
  await page.getByRole("button", { name: /Register patient/i }).click();
  // server action must reject empty name — either inline error or redirect with error param
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/\/doctor\/patients(\/new)?/);
  const after = await countPatients();
  expect(after).toBe(before); // no row created
});

test("patient form: invalid email format rejected", async ({ page }) => {
  const name = unique("BadEmail");
  await page.goto("/doctor/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Gender").selectOption("Male");
  await page.getByLabel("Phone").fill("9812345678");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("City").fill("X");
  await page.getByRole("button", { name: /Register patient/i }).click();
  await page.waitForTimeout(3000);
  // must not create a patient with a broken email: search for the name in list
  await page.goto(`/doctor/patients?q=${encodeURIComponent(name)}`);
  await expect(page.getByText("No patients found")).toBeVisible({ timeout: 15000 });
});

test("patient form: rapid double-click submit creates exactly one row", async ({ page }) => {
  const name = unique("DupPat");
  const email = `${name.toLowerCase()}@example.com`;
  await page.goto("/doctor/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Gender").selectOption("Male");
  await page.getByLabel("Phone").fill("9888777666");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("City").fill("DupCity");
  const btn = page.getByRole("button", { name: /Register patient/i });
  // double click — two submits race
  await btn.dblclick();
  await page.waitForURL(/\/doctor\/patients\/\d+$/, { timeout: 20000 });
  const rows = await countPatientsByEmail(email);
  expect(rows).toBe(1); // duplicate submit must not create two patients
});

test("appointment booking: duplicate submit creates exactly one appointment", async ({ page }) => {
  const patientName = unique("DupApptPat");
  await page.goto("/doctor/patients/new");
  await page.getByLabel("Full name").fill(patientName);
  await page.getByLabel("Gender").selectOption("Male");
  await page.getByLabel("Phone").fill("9777666555");
  await page.getByLabel("Email").fill(`${patientName.toLowerCase()}@example.com`);
  await page.getByLabel("City").fill("X");
  await page.getByRole("button", { name: /Register patient/i }).click();
  await page.waitForURL(/\/doctor\/patients\/\d+$/, { timeout: 20000 });
  const patientId = Number(page.url().split("/").pop());

  // booking form (route is /book; selectors copied from e2e/appointments.spec.ts)
  await page.goto("/doctor/appointments/book");
  const sel = page.getByLabel("Patient");
  // options are "Name · id" — pick ours by exact name prefix
  const wanted = await sel.locator(`option`, { hasText: patientName }).allTextContents();
  expect(wanted.length).toBeGreaterThan(0);
  await sel.selectOption({ label: wanted[0].trim() });
  // unique slot per run — first run's booking would otherwise conflict
  // ("Time slot already booked") for every subsequent retry
  const dateStr = "2026-12-15";
  const minute = String(new Date().getUTCMinutes()).padStart(2, "0").padStart(2, "0");
  const timeStr = `10:${minute}`;
  await page.getByLabel("Date").fill(dateStr);
  await page.getByLabel("Time").fill(timeStr);
  await page.getByRole("button", { name: /Show consent form/i }).click();
  await page.getByText("Skip Consent").click();
  const btn = page.getByRole("button", { name: /Book appointment/i });
  await btn.dblclick();
  await page.waitForURL(/\/doctor\/appointments($|\?|\/)/, { timeout: 30000 });
  const apptTime12h = to12h(timeStr);
  // eventual-consistency: poll DB up to 10s until the row is visible
  let rows = 0;
  for (let i = 0; i < 10 && rows === 0; i++) {
    rows = await countAppointmentsFor(patientId, apptTime12h);
    if (rows === 0) await page.waitForTimeout(1000);
  }
  console.log("EVIDENCE patientId=" + patientId + " slot=" + apptTime12h + " appointmentRows=" + rows);
  expect(rows).toBe(1); // exactly one row — double submit must not duplicate
});

function to12h(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const meridiem = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${meridiem}`;
}

// ── DB helpers via direct mysql2 queries (dev DB) ─────────────────────────
const m = require("mysql2/promise");
async function q(sql: string, params?: unknown[]): Promise<unknown[]> {
  const c = await m.createConnection({ host: "127.0.0.1", port: 3307, user: "root", password: "", database: "skoracares_db" });
  try { const [rows] = await c.query(sql, params); return rows as unknown[]; } finally { await c.end(); }
}
async function countPatients(): Promise<number> {
  const r = await q("select count(*) n from users where role='patient'") as { n: number }[];
  return r[0].n;
}
async function countPatientsByEmail(email: string): Promise<number> {
  const r = await q("select count(*) n from users where role='patient' and email=?", [email]) as { n: number }[];
  return r[0].n;
}
async function countAppointmentsFor(patientId: number, when: string): Promise<number> {
  // time stored as "10:30 AM" varchar; patient is unique to this test so patient_id alone scopes it
  const r = await q("select count(*) n from appointments where patient_id=? and time=?", [patientId, when]) as { n: number }[];
  return r[0].n;
}
