/* Trace redirect chain for receptionist login: log every navigation. */
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("response", (r) => {
    const loc = r.headers()["location"];
    if (loc) console.log("REDIRECT", r.status(), r.request().url, "→", loc);
  });
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) console.log("nav", f.url()); });

  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill("tmp-rec-probe@gmail.com");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForTimeout(6000);
  console.log("FINAL:", page.url());
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
