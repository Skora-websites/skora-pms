import { chromium } from "@playwright/test";

export default async function globalSetup() {
  // MariaDB (port 3307) must be up — login queries it. No DB = 500s on every login.
  for (let i = 0; i < 30; i++) {
    try { await fetch("http://localhost:3100/api/medicines/search?q=x"); break; }
    catch { await new Promise((r) => setTimeout(r, 1000)); }
    if (i === 29) throw new Error("Dev server on :3100 never became reachable");
  }
  const browser = await chromium.launch();
  const doctorPage = await browser.newPage();
  // Port 3000 is occupied by another project on this machine — the SkoraCare
  // dev server for E2E runs on 3100 (must match playwright.config.ts baseURL).
  await doctorPage.goto("http://localhost:3100/login");
  await doctorPage.getByLabel("Email address").fill("doctor@gmail.com");
  await doctorPage.getByLabel("Password").fill("Admin@123");
  await doctorPage.getByRole("button", { name: /Sign in/i }).click();
  await doctorPage.waitForURL(/\/doctor(\/|$)/, { timeout: 120_000 });
  await doctorPage.context().storageState({ path: "e2e/.auth/doctor.json" });

  const adminPage = await browser.newPage();
  await adminPage.goto("http://localhost:3100/login");
  await adminPage.getByLabel("Email address").fill("admin@gmail.com");
  await adminPage.getByLabel("Password").fill("Admin@123");
  await adminPage.getByRole("button", { name: /Sign in/i }).click();
  await adminPage.waitForURL(/\/super-admin(\/|$)/, { timeout: 120_000 });
  await adminPage.context().storageState({ path: "e2e/.auth/admin.json" });

  await browser.close();
}