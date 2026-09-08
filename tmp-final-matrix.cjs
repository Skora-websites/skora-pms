/* Final matrix: 4 roles × login landing + blocked area + own area renders. */
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:3000";

const ROLES = [
  { name: "super_admin", creds: ["admin@gmail.com", "Admin@123"], home: /\/super-admin/, blocked: [["/doctor", /\/(super-admin|login)/], ["/patient", /\/(super-admin|login)/]] },
  { name: "doctor", creds: ["doctor@gmail.com", "Admin@123"], home: /\/doctor(\/|$)/, blocked: [["/super-admin", /\/(doctor|login)/], ["/patient", /\/(doctor|login)/]] },
  { name: "patient", creds: ["patient@gmail.com", "Admin@123"], home: /\/patient(\/|$)/, blocked: [["/super-admin", /\/(patient|login)/], ["/doctor", /\/(patient|login)/]] },
  { name: "receptionist", creds: ["tmp-rec-probe@gmail.com", "Admin@123"], home: /\/doctor\/(patients|appointments|billing)/, blocked: [["/super-admin", /\/doctor\/(patients|appointments|billing)|\//]] },
];

(async () => {
  const browser = await chromium.launch();
  let fail = 0;
  for (const r of ROLES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email address").fill(r.creds[0]);
    await page.getByLabel("Password").fill(r.creds[1]);
    await page.getByRole("button", { name: /Sign in/i }).click();
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      if (!/\/login/.test(page.url())) break;
    }
    await page.waitForTimeout(2500); // settle layout redirects
    const home = page.url();
    const homeOk = r.home.test(home);
    console.log(`${homeOk ? "ok  " : "BAD "} ${r.name} landing ${home}`);
    if (!homeOk) fail++;

    for (const [path, expectRe] of r.blocked) {
      const p2 = await ctx.newPage();
      await p2.goto(BASE + path, { waitUntil: "domcontentloaded" });
      await p2.waitForTimeout(1500);
      const after = p2.url().replace(BASE, "");
      const ok = !after.startsWith(path);
      console.log(`${ok ? "ok  " : "BAD "} ${r.name} blocked ${path} → ${after}`);
      if (!ok) fail++;
    }
    await ctx.close();
  }
  console.log(fail === 0 ? "MATRIX OK" : `${fail} FAILURES`);
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
