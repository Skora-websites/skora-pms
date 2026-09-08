/* Receptionist settle check: wait past all redirects for FINAL url. */
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill("tmp-rec-probe@gmail.com");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForTimeout(5000); // let all server redirects settle
  console.log("FINAL url:", page.url());
  await page.screenshot({ path: "tmp-shot-rec.png" });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
