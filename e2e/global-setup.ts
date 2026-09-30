import { chromium } from "@playwright/test";
import { BASE_URL, ACCOUNTS, SEED_PASSWORD } from "./test-env";

// Must match playwright.config.ts baseURL (E2E_BASE_URL overrides both).
const BASE_URL_LOCAL_ALIAS = BASE_URL;

export default async function globalSetup() {
  // MariaDB (port 3307) must be up — login queries it. No DB = 500s on every login.
  for (let i = 0; i < 30; i++) {
    try { await fetch(`${BASE_URL_LOCAL_ALIAS}/api/medicines/search?q=x`); break; }
    catch { await new Promise((r) => setTimeout(r, 1000)); }
    if (i === 29) throw new Error(`Dev server at ${BASE_URL} never became reachable`);
  }
  const browser = await chromium.launch();
  const doctorPage = await browser.newPage();
  // Port 3000 may be occupied by another project on this machine — the SkoraCare
  // dev server for E2E defaults to 3100 (must match playwright.config.ts baseURL).
  await doctorPage.goto(`${BASE_URL_LOCAL_ALIAS}/login`);
  await doctorPage.getByLabel("Email address").fill(ACCOUNTS.doctor);
  await doctorPage.getByLabel("Password").fill(SEED_PASSWORD);
  await doctorPage.getByRole("button", { name: /Sign in/i }).click();
  await doctorPage.waitForURL(/\/doctor(\/|$)/, { timeout: 120_000 });
  // Pre-dismiss the post-login permission nudge so its fixed overlay never
  // intercepts clicks in tests (dismissal is localStorage-keyed per browser).
  await doctorPage.evaluate(() => localStorage.setItem("skoracare-perms-dismissed", "1"));
  await doctorPage.context().storageState({ path: "e2e/.auth/doctor.json" });

  const adminPage = await browser.newPage();
  await adminPage.goto(`${BASE_URL_LOCAL_ALIAS}/login`);
  await adminPage.getByLabel("Email address").fill(ACCOUNTS.superAdmin);
  await adminPage.getByLabel("Password").fill(SEED_PASSWORD);
  await adminPage.getByRole("button", { name: /Sign in/i }).click();
  await adminPage.waitForURL(/\/super-admin(\/|$)/, { timeout: 120_000 });
  await adminPage.evaluate(() => localStorage.setItem("skoracare-perms-dismissed", "1"));
  await adminPage.context().storageState({ path: "e2e/.auth/admin.json" });

  // Business owner (admin tier, /admin shell) — requires the Phase 2 seed
  // (ACCOUNTS.owner) and the 0009 business backfill to have run.
  const ownerPage = await browser.newPage();
  await ownerPage.goto(`${BASE_URL_LOCAL_ALIAS}/login`);
  await ownerPage.getByLabel("Email address").fill(ACCOUNTS.owner);
  await ownerPage.getByLabel("Password").fill(SEED_PASSWORD);
  await ownerPage.getByRole("button", { name: /Sign in/i }).click();
  await ownerPage.waitForURL(/\/admin(\/|$)/, { timeout: 120_000 });
  await ownerPage.evaluate(() => localStorage.setItem("skoracare-perms-dismissed", "1"));
  await ownerPage.context().storageState({ path: "e2e/.auth/owner.json" });

  await browser.close();
}