/* Cross-role API + page guard matrix, live. */
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:3000";

const MATRIX = [
  { name: "anon", storageState: { cookies: [], origins: [] } },
  { name: "patient", creds: ["patient@gmail.com", "Admin@123"] },
  { name: "doctor", creds: ["doctor@gmail.com", "Admin@123"] },
  { name: "admin", creds: ["admin@gmail.com", "Admin@123"] },
];

const APIS = ["/api/doctor/appointments/export", "/api/doctor/patients/export", "/api/super-admin/support/export"];

(async () => {
  const browser = await chromium.launch();
  for (const m of MATRIX) {
    const ctx = await browser.newContext({ storageState: m.storageState, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    if (m.creds) {
      await page.goto(BASE + "/login", { waitUntil: "networkidle" });
      await page.getByLabel("Email address").fill(m.creds[0]);
      await page.getByLabel("Password").fill(m.creds[1]);
      await page.getByRole("button", { name: /Sign in/i }).click();
      for (let i = 0; i < 60 && /\/login/.test(page.url()); i++) await page.waitForTimeout(500);
    }
    for (const api of APIS) {
      const res = await page.request.get(BASE + api);
      const ok = res.status() === 401 || res.status() === 403 || res.status() >= 300 && res.status() < 400; // redirect guard
      console.log(`${ok ? "ok  " : "BAD "} ${m.name} → ${api} = ${res.status()}`);
    }
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
