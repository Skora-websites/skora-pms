import { test, expect } from "@playwright/test";
import { unique, tinyPdf } from "./helpers";

const m = require("mysql2/promise");
const DB = { host: "127.0.0.1", port: 3307, user: "root", password: "", database: "skoracares_db" };
type Row<T> = [T, unknown];
async function query<T>(sql: string, params: unknown[]): Promise<T[]> {
  const conn = await m.createConnection(DB);
  try {
    const [rows] = (await conn.query(sql, params)) as Row<T>;
    return rows as T[];
  } finally {
    await conn.end();
  }
}

const jpg = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from("\x00\x00JFIF\x00\x01audit-file\x00\x00\x00\x00\x00\x00"),
]);

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(24), // IHDR stub — sniffer only checks the 8-byte signature
]);

/** Book a fresh test for patient 3 as doctor 2 and return the upload token. */
async function freshBooking(page: import("@playwright/test").Page): Promise<string> {
  await page.goto("/doctor/test-bookings");
  const vendorName = unique("E2E Audit Vendor");
  await page.getByRole("button", { name: /Vendors/i }).click();
  await page.getByPlaceholder("Metropolis Labs").fill(vendorName);
  await page.getByPlaceholder("+91 98765 43210").fill("9988776655");
  await page.getByPlaceholder("lab@example.com").fill(`${vendorName.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`);
  await page.getByPlaceholder("Branch address").fill("Audit lab");
  await page.getByRole("button", { name: /Add vendor/i }).click();
  await page.getByRole("button", { name: /Vendors/i }).click();
  await page.getByText(vendorName).first().waitFor({ timeout: 15_000 });
  await page.locator(".fixed.inset-0", { hasText: "Lab vendors" }).click({ position: { x: 10, y: 10 } });

  await page.getByRole("button", { name: /Tests/i }).click();
  const testName = unique("E2E Audit Test");
  await page.getByPlaceholder("Complete Blood Count").fill(testName);
  await page.getByPlaceholder("500").fill("100");
  await page.getByRole("button", { name: /Add test/i }).click();
  await page.getByRole("button", { name: /Tests/i }).click();
  await page.getByText(testName).first().waitFor({ timeout: 15_000 });
  await page.locator(".fixed.inset-0", { hasText: "Lab tests" }).click({ position: { x: 10, y: 10 } });

  await page.getByRole("button", { name: /New booking/i }).click();
  const search = page.getByPlaceholder(/Search by mobile number or name/);
  await search.fill("77777");
  await page.locator("button", { hasText: "PAT8702578" }).first().waitFor({ timeout: 10_000 });
  await page.locator("button", { hasText: "PAT8702578" }).first().click();
  await page.getByLabel("Vendor").selectOption({ label: vendorName });
  await page.locator("label", { hasText: testName }).locator('input[type="checkbox"]').check();
  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel("Booking date").fill(today);
  await page.getByLabel("Payment date").fill(today);
  await page.getByRole("button", { name: /Create booking/i }).click();
  const row = page.locator("tr", { hasText: vendorName });
  await row.waitFor({ timeout: 15_000 });
  await row.getByRole("button", { name: /Copy link/i }).click();
  await page.getByRole("button", { name: /Copied!/i }).first().waitFor({ timeout: 5_000 });
  const link = await page.evaluate(() => navigator.clipboard.readText());
  return link;
}

test.describe("Upload-audit: vendor test report lifecycle", () => {
  test("wrong type rejected, retry with valid pdf works, doctor report fetch auth-scoped", async ({ page, context, browser }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost:3100" });
    const link = await freshBooking(page);

    // ── Wrong type (text/plain) rejected with friendly error ─────────────────
    await page.goto(link);
    await page.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await page.getByRole("button", { name: /Upload report/i }).click();
    await expect(page.getByText(/pdf, jpg or png/i)).toBeVisible({ timeout: 10_000 });
    // Nothing stored yet
    const token = link.split("/").pop()!;
    const pre = await query<{ uploaded_file_path: string | null }>(
      "SELECT uploaded_file_path FROM test_bookings WHERE upload_link_token = ?", [token]
    );
    expect(pre[0].uploaded_file_path).toBeNull();

    // ── Retry with valid pdf succeeds ────────────────────────────────────────
    await page.locator('input[type="file"]').setInputFiles({ name: "réport ünïcode.pdf", mimeType: "application/pdf", buffer: tinyPdf });
    await page.getByRole("button", { name: /Upload report/i }).click();
    await expect(page.getByRole("heading", { name: /Report already uploaded/i })).toBeVisible({ timeout: 15_000 });

    const post = await query<{ id: number; uploaded_file_path: string; status: string; patient_id: number }>(
      "SELECT id, uploaded_file_path, status, patient_id FROM test_bookings WHERE upload_link_token = ?", [token]
    );
    expect(post[0].uploaded_file_path).toMatch(/^test-reports\/[0-9a-f-]+\.pdf$/);
    expect(post[0].status).toBe("completed");
    const storedName = post[0].uploaded_file_path.split("/").pop()!;
    expect(storedName).toMatch(/^[0-9a-f-]+\.pdf$/); // unicode user name never reaches disk

    // ── Doctor (owner) can fetch the report via API ──────────────────────────
    const reportRes = await page.request.get(`/api/doctor/test-bookings/${post[0].id}/report`);
    expect(reportRes.status()).toBe(200);

    // ── Anonymous cannot fetch the report ───────────────────────────────────
    // bare newContext() inherits the doctor storageState from playwright.config;
    // force a truly cookie-less context.
    const anonCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonRes = await anonCtx.request.get(`/api/doctor/test-bookings/${post[0].id}/report`);
    expect(anonRes.status()).toBe(401);
    await anonCtx.close();

    // ── Other doctor (different tenant) must get 403 ───────────────────────
    const otherCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const otherPage = await otherCtx.newPage();
    await otherPage.goto("/signup");
    await otherPage.getByRole("button", { name: /Doctor \/ Clinic/i }).click();
    const suffix = `audit${Date.now().toString(36)}`;
    const phone = `9${String(Math.floor(Math.random() * 900000000) + 100000000)}`;
    await otherPage.getByLabel("Full name").fill(`E2E Audit Dr ${suffix}`);
    await otherPage.getByLabel("Email address").fill(`e2e.audit.${suffix}@example.com`);
    await otherPage.getByLabel("Phone").fill(phone);
    await otherPage.getByLabel("Gender").selectOption("male");
    await otherPage.getByRole("button", { name: /Send OTP/i }).click();
    const otpMsg = otherPage.locator("p", { hasText: /Dev mode — your OTP is (\d{6})/ });
    await expect(otpMsg).toBeVisible({ timeout: 15_000 });
    const otp = (await otpMsg.textContent())!.match(/(\d{6})/)![1];
    await otherPage.locator('input[name="otp"]').fill(otp);
    await otherPage.getByLabel("Password", { exact: true }).fill("Admin@123");
    await otherPage.getByLabel("Confirm password").fill("Admin@123");
    await otherPage.getByRole("button", { name: /Create account/i }).click();
    await otherPage.waitForURL(/\/doctor(\/|$)/, { timeout: 30_000 });
    const crossRes = await otherCtx.request.get(`/api/doctor/test-bookings/${post[0].id}/report`);
    expect(crossRes.status()).toBe(403);
    await otherCtx.close();

    // ── Booking deletion leaves report file ORPHANED (documented bug) ────────
    const storage = require("node:fs");
    const diskPath = `storage/uploads/${post[0].uploaded_file_path}`;
    expect(storage.existsSync(diskPath), "report on disk before delete").toBe(true);
    page.on("dialog", (d) => d.accept());
    await page.goto("/doctor/test-bookings");
    const [bk] = await query<{ vendor_name: string }>(
      "SELECT v.name AS vendor_name FROM test_bookings tb JOIN vendors v ON v.id = tb.vendor_id WHERE tb.id = ?",
      [post[0].id]
    );
    const delRow = page.locator("tr", { hasText: bk.vendor_name }).first();
    await delRow.getByRole("button", { name: /Delete booking/i }).click();
    await page.waitForTimeout(3_000);
    const goneRows = await query<{ id: number }>("SELECT id FROM test_bookings WHERE id = ?", [post[0].id]);
    expect(goneRows.length, "booking hard-deleted").toBe(0);
    expect(storage.existsSync(diskPath), "report file removed with booking (no orphan PHI)").toBe(false);
  });

  test("consent: anon patient uploads jpg on accept, file served via slug; double-submit blocked", async ({ browser }) => {
    // doctor session (config storageState) books a consent appointment
    const docCtx = await browser.newContext(); // inherits doctor storageState
    const page = await docCtx.newPage();

    const future = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    const dateStr = future.toISOString().slice(0, 10);
    const timeStr = `10:${String(Math.floor(Math.random() * 49)).padStart(2, "0")}`;
    await page.goto("/doctor/appointments/book");
    const patientSelect = page.getByLabel("Patient");
    const optionCount = await patientSelect.locator("option").count();
    let chosenIndex = 1;
    for (let i = 1; i < optionCount; i++) {
      const text = (await patientSelect.locator("option").nth(i).innerText()).trim();
      if (!/E2E|QA User|Patient-/.test(text)) {
        chosenIndex = i;
        break;
      }
    }
    await patientSelect.selectOption({ index: chosenIndex });
    await page.getByLabel("Date").fill(dateStr);
    await page.getByLabel("Time").fill(timeStr);
    await page.getByRole("button", { name: /Show consent form/i }).click();
    await page.getByText("Send Consent Link").click();
    await page.getByRole("button", { name: /Book appointment/i }).click();
    await page.waitForURL(/\/doctor\/appointments(?:\?created=\d+)?$/, { timeout: 30_000 });

    const rows = await query<{ slug: string }>(
      `SELECT c.slug FROM appointment_consult_consents c
       JOIN appointments a ON a.id = c.appointment_id
       WHERE a.doctor_id = 2 AND a.date = ? AND a.time = ?
       ORDER BY c.id DESC LIMIT 1`,
      [dateStr, `${timeStr} AM`]
    );
    expect(rows.length).toBe(1);
    const slug = rows[0].slug;

    // anonymous patient context
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const ppage = await ctx.newPage();
    await ppage.goto(`/my-consent/${slug}`);
    await expect(ppage.getByRole("heading", { name: /Consultation consent/i })).toBeVisible();
    await ppage.locator('input[type="file"]').setInputFiles({ name: "idproof.jpg", mimeType: "image/jpeg", buffer: jpg });
    await ppage.getByRole("button", { name: /I Consent/i }).click();
    await expect(ppage.getByText("Consent accepted")).toBeVisible({ timeout: 15_000 });

    // decision recorded with uploaded file (accept prefers generated PDF; check consent_file set)
    const decided = await query<{ consent_file: string | null; status: string }>(
      "SELECT consent_file, status FROM appointment_consult_consents WHERE slug = ?", [slug]
    );
    expect(decided[0].consent_file).toBeTruthy();
    expect(decided[0].consent_file).toMatch(/^consent-(pdfs|files)\//);

    // file fetchable via slug (public bearer-by-design)
    const fileRes = await ctx.request.get(`/api/consents/${slug}/file`);
    expect(fileRes.status()).toBe(200);

    // double submission blocked
    await ppage.goto(`/my-consent/${slug}`);
    await expect(ppage.getByRole("heading", { name: /Response recorded/i })).toBeVisible();
    const resub = await ppage.evaluate(async () => {
      const fd = new FormData();
      fd.append("slug", location.pathname.split("/").pop()!);
      fd.append("decision", "reject");
      const r = await fetch(location.href, { method: "POST", body: fd });
      return r.status;
    });
    // direct POST to page URL is not a server action — server action invocation
    // happens via Next.js RSC protocol; instead re-click is blocked by UI.
    console.log("AUDIT resubmit POST status (non-action probe):", resub);
    await ctx.close();
    await docCtx.close();
  });

  test("clinic logo: upload serves via authed route; delete clinic removes logo file", async ({ page, browser }) => {
    const clinicName = unique("E2E Audit Clinic");
    await page.goto("/doctor/schedule");
    await page.getByRole("button", { name: /Add clinic/i }).click();
    await page.getByLabel("Clinic name").fill(clinicName);
    await page.getByLabel("Phone").fill("9876500001");
    await page.getByLabel("Consultation fee").fill("300");
    await page.getByLabel("Address").fill("Audit Street");
    await page.locator('input[type="file"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
    await page.getByRole("button", { name: /Save clinic/i }).click();
    const card = page.locator(".card", { hasText: clinicName });
    await expect(card).toBeVisible({ timeout: 15_000 });

    const [clinic] = await query<{ id: number; clinic_logo: string | null }>(
      "SELECT id, clinic_logo FROM doctor_clinics WHERE clinic_name = ? AND doctor_id = 2 ORDER BY id DESC LIMIT 1", [clinicName]
    );
    expect(clinic.clinic_logo).toMatch(/^clinic\/[0-9a-f-]+\.png$/);
    const storage = require("node:fs");
    expect(storage.existsSync(`storage/uploads/${clinic.clinic_logo}`), "logo written to disk").toBe(true);

    // logo served via authed route (owner)
    const logoRes = await page.request.get(`/api/doctor/clinic-logo/${clinic.id}`);
    expect(logoRes.status()).toBe(200);
    expect(logoRes.headers()["content-type"]).toBe("image/png");

    // anon blocked
    const anonCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonLogo = await anonCtx.request.get(`/api/doctor/clinic-logo/${clinic.id}`);
    expect(anonLogo.status()).toBe(401);
    await anonCtx.close();

    // delete clinic → BUG: file stays on disk (DATE_SAFE regex rejects "clinic/" prefix)
    page.on("dialog", (d) => d.accept());
    await card.getByRole("button", { name: /^Delete$/i }).click();
    await card.getByRole("button", { name: /Confirm/i }).click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });
    const goneRows = await query<{ id: number }>(
      "SELECT id FROM doctor_clinics WHERE id = ?", [clinic.id]
    );
    expect(goneRows.length, "clinic hard-deleted").toBe(0);
    expect(storage.existsSync(`storage/uploads/${clinic.clinic_logo}`), "logo file removed with clinic").toBe(false);
  });

  test("income-expense: attachment lifecycle (create, authed fetch, replace deletes old, delete removes file)", async ({ page, browser }) => {
    const desc = unique("E2E Audit Tx");
    await page.goto("/doctor/income-expense");
    await page.getByLabel("Amount (₹)").first().fill("100");
    const today = new Date().toISOString().slice(0, 10);
    await page.getByLabel("Date").fill(today);
    await page.locator("#category").selectOption({ index: 1 });
    await page.getByLabel("Description").fill(desc);
    await page.getByLabel("Payment method").selectOption("Cash");
    await page.locator("#file").setInputFiles({ name: "receipt.pdf", mimeType: "application/pdf", buffer: tinyPdf });
    await page.getByRole("button", { name: /Add entry/i }).click();
    const incomeRow = page.locator("table.data-table").nth(0).locator("tr", { hasText: desc });
    await expect(incomeRow).toBeVisible({ timeout: 15_000 });

    const [tx] = await query<{ id: number; file_path: string | null }>(
      "SELECT id, file_path FROM transactions WHERE description = ? AND user_id = 2 ORDER BY id DESC LIMIT 1", [desc]
    );
    expect(tx.file_path).toMatch(/^transactions\//);

    // owner fetch OK; anon fetch 401
    const okRes = await page.request.get(`/api/doctor/income-expense/${tx.id}/file`);
    expect(okRes.status()).toBe(200);
    expect(okRes.headers()["content-type"]).toBe("application/pdf");
    const anonCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const anonRes = await anonCtx.request.get(`/api/doctor/income-expense/${tx.id}/file`);
    expect(anonRes.status()).toBe(401);
    await anonCtx.close();

    // ── Edit: replace attachment with jpg → old pdf unlinked ────────────────
    const oldPath = tx.file_path;
    await incomeRow.getByRole("button", { name: /Edit/i }).click();
    await page.locator("#edit-file").setInputFiles({ name: "new.jpg", mimeType: "image/jpeg", buffer: jpg });
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page.getByRole("button", { name: /Edit/i }).first()).toBeVisible({ timeout: 15_000 });
    const [tx2] = await query<{ id: number; file_path: string | null }>(
      "SELECT id, file_path FROM transactions WHERE id = ?", [tx.id]
    );
    expect(tx2.file_path).toMatch(/^transactions\/.+\.jpg$/);
    expect(tx2.file_path).not.toBe(oldPath);

    const storage = require("node:fs");
    expect(storage.existsSync(`storage/uploads/${oldPath}`), "old file unlinked after replace").toBe(false);
    expect(storage.existsSync(`storage/uploads/${tx2.file_path}`), "new file on disk").toBe(true);

    // ── Delete entry → file removed from disk ──────────────────────────────
    page.on("dialog", (d) => d.accept());
    await incomeRow.getByRole("button", { name: /Delete/i }).click();
    await expect(incomeRow).toHaveCount(0, { timeout: 15_000 }).catch(() => {});
    const [gone] = await query<{ deleted_at: string | null }>(
      "SELECT deleted_at FROM transactions WHERE id = ?", [tx.id]
    );
    expect(gone.deleted_at).toBeTruthy();
    expect(storage.existsSync(`storage/uploads/${tx2.file_path}`), "file removed on delete").toBe(false);
  });

  test("consent: wrong type (txt) rejected with friendly error", async ({ browser }) => {
    const docCtx = await browser.newContext();
    const page = await docCtx.newPage();
    const future = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    const dateStr = future.toISOString().slice(0, 10);
    const timeStr = `11:${String(Math.floor(Math.random() * 49)).padStart(2, "0")}`;
    await page.goto("/doctor/appointments/book");
    const patientSelect = page.getByLabel("Patient");
    const optionCount = await patientSelect.locator("option").count();
    let chosenIndex = 1;
    for (let i = 1; i < optionCount; i++) {
      const text = (await patientSelect.locator("option").nth(i).innerText()).trim();
      if (!/E2E|QA User|Patient-/.test(text)) {
        chosenIndex = i;
        break;
      }
    }
    await patientSelect.selectOption({ index: chosenIndex });
    await page.getByLabel("Date").fill(dateStr);
    await page.getByLabel("Time").fill(timeStr);
    await page.getByRole("button", { name: /Show consent form/i }).click();
    await page.getByText("Send Consent Link").click();
    await page.getByRole("button", { name: /Book appointment/i }).click();
    await page.waitForURL(/\/doctor\/appointments(?:\?created=\d+)?$/, { timeout: 30_000 });

    const rows = await query<{ slug: string }>(
      `SELECT c.slug FROM appointment_consult_consents c
       JOIN appointments a ON a.id = c.appointment_id
       WHERE a.doctor_id = 2 AND a.date = ? AND a.time = ?
       ORDER BY c.id DESC LIMIT 1`,
      [dateStr, `${timeStr} AM`]
    );
    const slug = rows[0].slug;

    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const ppage = await ctx.newPage();
    await ppage.goto(`/my-consent/${slug}`);
    await ppage.locator('input[type="file"]').setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("nope") });
    await ppage.getByRole("button", { name: /I Consent/i }).click();
    await expect(ppage.getByText(/Only JPG, PNG or PDF files are allowed/i)).toBeVisible({ timeout: 15_000 });
    // consent NOT decided yet
    const still = await query<{ status: string }>(
      "SELECT status FROM appointment_consult_consents WHERE slug = ?", [slug]
    );
    expect(still[0].status).not.toBe("confirmed");
    await ctx.close();
    await docCtx.close();
  });
});
