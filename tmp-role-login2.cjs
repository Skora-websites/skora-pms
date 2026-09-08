/* Receptionist role login probe (tmp account): land on /doctor, block /super-admin. */
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
  let url = "";
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    url = page.url();
    if (!/\/login/.test(url)) break;
  }
  const okLogin = /\/doctor(\/|$)/.test(url);
  console.log(`${okLogin ? "ok  " : "BAD "} receptionist login → ${url}`);

  const xpage = await ctx.newPage();
  await xpage.goto(BASE + "/super-admin", { waitUntil: "domcontentloaded" });
  await xpage.waitForTimeout(1000);
  const after = xpage.url();
  const blocked = !/\/super-admin/.test(after);
  console.log(`${blocked ? "ok  " : "BAD "} receptionist → /super-admin redirected to ${after}`);
  console.log(okLogin && blocked ? "RECEPTIONIST OK" : "RECEPTIONIST FAIL");
  await browser.close();
  process.exit(okLogin && blocked ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
