/* Full receptionist flow verify: nav shows only permitted modules; blocked
   modules redirect; permitted modules render. */
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 150)); });

  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill("tmp-rec-probe@gmail.com");
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForTimeout(4000);
  console.log("landing:", page.url());

  // nav labels (desktop sidebar) — after full render
  await page.goto(BASE + "/doctor/appointments", { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1500);
  const nav = await page.evaluate(() => {
    const aside = document.querySelector("aside");
    return aside ? [...aside.querySelectorAll("nav a span")].map((s) => s.textContent.trim()).filter(Boolean) : [];
  });
  console.log("nav items:", nav.join(", "));
  const expected = ["Registrations", "Appointments", "Billing"];
  const navOk = expected.every((e) => nav.includes(e)) && !nav.includes("Dashboard") && !nav.includes("Income & Expense");
  console.log(`${navOk ? "ok  " : "BAD "} nav filtered by perms`);

  // permitted modules render
  for (const p of ["/doctor/patients", "/doctor/appointments", "/doctor/billing"]) {
    await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    const url = page.url();
    const ok = url.endsWith(p);
    console.log(`${ok ? "ok  " : "BAD "} ${p} renders (url=${url})`);
  }
  // blocked modules redirect to first permitted
  for (const p of ["/doctor", "/doctor/income-expense", "/doctor/schedule", "/doctor/staff"]) {
    await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const url = page.url();
    const ok = url.endsWith("/doctor/patients");
    console.log(`${ok ? "ok  " : "BAD "} ${p} → ${url}`);
  }
  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
