// Grab the rendered error text after a doctor login attempt.
import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3100/login");
  await page.getByLabel("Email address").fill("doctor@gmail.com");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForTimeout(8000);
  const err = await page.locator("[role='alert'], .text-red-600, .text-red-500, p.text-sm").allInnerTexts().catch(() => []);
  console.log("ALERTS:", JSON.stringify(err));
  const body = await page.locator("body").innerText();
  console.log("BODY(400):", body.slice(0, 400));
  await browser.close();
  process.exit(0);
})();
