import { chromium } from "@playwright/test";

export default async function globalSetup() {
  const browser = await chromium.launch();
  const doctorPage = await browser.newPage();
  await doctorPage.goto("http://localhost:3000/login");
  await doctorPage.getByLabel("Email address").fill("doctor@gmail.com");
  await doctorPage.getByLabel("Password").fill("Admin@123");
  await doctorPage.getByRole("button", { name: /Sign in/i }).click();
  await doctorPage.waitForURL(/\/doctor(\/|$)/, { timeout: 30_000 });
  await doctorPage.context().storageState({ path: "e2e/.auth/doctor.json" });

  const adminPage = await browser.newPage();
  await adminPage.goto("http://localhost:3000/login");
  await adminPage.getByLabel("Email address").fill("admin@gmail.com");
  await adminPage.getByLabel("Password").fill("Admin@123");
  await adminPage.getByRole("button", { name: /Sign in/i }).click();
  await adminPage.waitForURL(/\/super-admin(\/|$)/, { timeout: 30_000 });
  await adminPage.context().storageState({ path: "e2e/.auth/admin.json" });

  await browser.close();
}