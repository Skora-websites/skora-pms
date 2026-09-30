/**
 * Live verification: log in as each seeded role via the UI session flow and
 * probe every dashboard route for the expected status. Uses the dev server
 * (E2E_BASE_URL, default :3000) and the direct DB config for root-session
 * probes (super-admin/users listing) that need extra cookies.
 */
import { BASE_URL as BASE, DB, ACCOUNTS, SEED_PASSWORD } from "./env.mjs";

import { chromium } from "@playwright/test";
import mysql from "mysql2/promise";

const ROUTES = {
  doctor: [
    "/doctor",
    "/doctor/appointments",
    "/doctor/appointments/book",
    "/doctor/patients",
    "/doctor/patients/new",
    "/doctor/consultations",
    "/doctor/billing",
    "/doctor/income-expense",
    "/doctor/schedule",
    "/doctor/follow-ups",
    "/doctor/test-bookings",
    "/doctor/home-visits",
    "/doctor/chat",
    "/doctor/notifications",
    "/doctor/roles",
    "/doctor/staff",
    "/doctor/shop",
    "/doctor/support",
    "/doctor/settings",
    "/doctor/profile",
    "/doctor/faq",
    "/doctor/emergency",
    "/doctor/online-consultations",
    "/doctor/consult-pdf",
  ],
  patient: [
    "/patient",
    "/patient/appointments",
    "/patient/appointments/book",
    "/patient/find-doctor",
    "/patient/prescriptions",
    "/patient/records",
    "/patient/test-reports",
    "/patient/bills",
    "/patient/emergency",
  ],
  superadmin: [
    "/super-admin",
    "/super-admin/doctors",
    "/super-admin/clinics",
    "/super-admin/users",
    "/super-admin/businesses",
    "/super-admin/masters",
    "/super-admin/blogs",
    "/super-admin/support",
    "/super-admin/payments",
    "/super-admin/audit-logs",
    "/super-admin/landing",
    "/super-admin/email-setup",
    "/super-admin/settings",
  ],
  admin: [
    "/admin",
    "/admin/appointments",
    "/admin/patients",
    "/admin/schedule",
    "/admin/staff",
    "/admin/billing",
    "/admin/income-expense",
    "/admin/test-bookings",
    "/admin/follow-ups",
    "/admin/clinics",
    "/admin/managers",
    "/admin/settings",
  ],
};

// Post-login home pathname per tier (matched as an exact URL prefix).
const HOME_ROUTES = {
  doctor: { email: ACCOUNTS.doctor, home: "/doctor" },
  patient: { email: ACCOUNTS.patient, home: "/patient" },
  superadmin: { email: ACCOUNTS.superAdmin, home: "/super-admin" },
  admin: { email: ACCOUNTS.owner, home: "/admin" },
};

async function login(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  return { ctx, page };
}
async function main() {
  const browser = await chromium.launch();

  // ── Owner + both managers (admin tier) via UI login ──────────────────
  for (const [tier, routes] of Object.entries(ROUTES)) {
    const { email, home } = HOME_ROUTES[tier];
    const { ctx, page } = await login(browser, email);
    // waitUntil "commit": we only need the redirect target — the route
    // probes below use ctx.request and don't depend on the page's load event
    // (which is flaky under dev HMR).
    await page.waitForURL((u) => u.pathname === HOME_ROUTES[tier].home, { timeout: 60_000, waitUntil: "commit" });
    process.stdout.write(`\n=== ${tier} (${email}) ===\n`);
    let ok = 0, fail = [];
    for (const r of routes) {
      const res = await ctx.request.get(`${BASE}${r}`, { maxRedirects: 0 });
      const good = res.status() === 200;
      if (good) ok++; else fail.push(`${r}→${res.status()}`);
      console.log(`  ${good ? "✓" : "✗"} ${res.status()} ${r}`);
    }
    console.log(`  ${ok}/${routes.length} OK${fail.length ? " — FAILURES: " + fail.join(", ") : ""}`);
    await ctx.close();
  }

  // ── Managers: scoped access checks (unauthenticated request flow) ────
  // Managers log in like owners; owner-only routes must redirect to /admin.
  for (const [name, email] of [["manager1", ACCOUNTS.manager1], ["manager2", ACCOUNTS.manager2]]) {
    const { ctx, page } = await login(browser, email);
    await page.waitForURL((u) => u.pathname === "/admin", { timeout: 60_000, waitUntil: "commit" });
    const res = await ctx.request.get(`${BASE}/admin/managers`, { maxRedirects: 0 });
    console.log(`  ${res.status() >= 300 && res.status() < 400 ? "✓" : "✗"} manager ${name} → /admin/managers = ${res.status()} ${res.headers().location ?? ""}`);
    await ctx.close();
  }

  await browser.close();

  // ── DB evidence: seeded accounts + business tenancy rows ─────────────
  const conn = await mysql.createConnection(DB);
  const [users] = await conn.query(
    "SELECT email, role, status FROM users WHERE email IN (?,?,?,?,?,?,?) ORDER BY FIELD(role,'super_admin','admin','manager','doctor','patient')",
    [ACCOUNTS.superAdmin, ACCOUNTS.owner, ACCOUNTS.manager1, ACCOUNTS.manager2, ACCOUNTS.doctor, ACCOUNTS.receptionist, ACCOUNTS.patient]
  );
  console.log("\n=== Seeded accounts (DB evidence) ===");
  for (const u of users) console.log(`  ${u.role.padEnd(12)} ${u.email.padEnd(24)} ${u.status}`);
  const [biz] = await conn.query("SELECT (SELECT COUNT(*) FROM businesses) b, (SELECT COUNT(*) FROM business_clinics) bc, (SELECT COUNT(*) FROM clinic_managers) cm");
  console.log(`  businesses=${biz[0].b} business_clinics=${biz[0].bc} clinic_managers=${biz[0].cm}`);
  await conn.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
