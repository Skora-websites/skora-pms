/* Verify: Receptionist role users now land on /doctor/{first-permitted} and
   have permissions attached. Run: node scripts/tmp-verify-backfill.cjs */
const { chromium } = require("playwright");
const mysql = require("mysql2/promise");

const CHECK = [
  ["amit@gmail.com", "Admin@123"],
  ["ajeet@gmail.com", "Admin@123"],
  ["sadmin@gmail.com", "Admin@123"],
  ["skorasofsdt@gmail.com", "Admin@123"],
];

(async () => {
  const conn = await mysql.createConnection({
    host: "127.0.0.1", port: 3307, user: "root", password: "",
    database: "skoracares_db",
  });
  const [rows] = await conn.query(
    `SELECT u.email, COUNT(mhp.permission_id) AS permCount
     FROM users u
     LEFT JOIN model_has_permissions mhp ON mhp.model_id = u.id
       AND mhp.model_type = 'App\\Models\\User'
     WHERE u.role = 'receptionist'
     GROUP BY u.email`
  );
  for (const r of rows) console.log(r.email, "perms:", r.permCount);
  await conn.end();

  const browser = await chromium.launch();
  let fail = 0;
  for (const [email, pw] of CHECK) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(pw);
    await page.getByRole("button", { name: /Sign in/i }).click();
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      if (!/\/login/.test(page.url())) break;
    }
    await page.waitForTimeout(2500);
    const url = page.url();
    const ok = /\/doctor\/(patients|appointments|billing)/.test(url);
    console.log(`${ok ? "ok  " : "BAD "} ${email} → ${url}`);
    if (!ok) fail++;
    await ctx.close();
  }
  await browser.close();
  console.log(fail === 0 ? "BACKFILL VERIFIED" : `${fail} FAILURES`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
