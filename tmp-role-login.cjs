/* Verify role-based login: each seeded role must land on its ROLE_HOME,
   wrong-password must fail, cross-role page access must redirect. */
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:3000";

const ROLES = [
  { email: "admin@gmail.com", expect: /\/super-admin(\/|$)/, label: "super_admin" },
  { email: "doctor@gmail.com", expect: /\/doctor(\/|$)/, label: "doctor" },
  { email: "patient@gmail.com", expect: /\/patient(\/|$)/, label: "patient" },
  { email: "receptionist@gmail.com", expect: /\/doctor(\/|$)/, label: "receptionist" },
];

(async () => {
  const browser = await chromium.launch();
  let fail = 0;

  for (const r of ROLES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email address").fill(r.email);
    await page.getByLabel("Password").fill("Admin@123");
    await page.getByRole("button", { name: /Sign in/i }).click();
    let url = "";
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      url = page.url();
      if (!/\/login/.test(url) && url !== BASE + "/") break;
    }
    const ok = r.expect.test(url);
    console.log(`${ok ? "ok  " : "BAD "} login ${r.label} → ${url}`);
    if (!ok) fail++;

    // wrong password must stay on /login with error
    const wpage = await ctx.newPage();
    await wpage.goto(BASE + "/login", { waitUntil: "networkidle" });
    await wpage.getByLabel("Email address").fill(r.email);
    await wpage.getByLabel("Password").fill("WrongPass999");
    await wpage.getByRole("button", { name: /Sign in/i }).click();
    await wpage.waitForTimeout(2500);
    const stayed = /\/login/.test(wpage.url());
    const errVisible = await wpage.getByText(/Invalid email or password/i).count();
    console.log(`${stayed && errVisible > 0 ? "ok  " : "BAD "} bad-password ${r.label} (stayed=${stayed}, errorShown=${errVisible > 0})`);
    if (!(stayed && errVisible > 0)) fail++;

    // cross-role: patient must not see /super-admin or /doctor pages
    if (r.label === "patient") {
      for (const path of ["/super-admin", "/doctor"]) {
        const xpage = await ctx.newPage();
        await xpage.goto(BASE + path, { waitUntil: "domcontentloaded" });
        await xpage.waitForTimeout(1000);
        const after = xpage.url();
        const blocked = !pathMatches(after, path);
        console.log(`${blocked ? "ok  " : "BAD "} patient → ${path} redirected to ${after}`);
        if (!blocked) fail++;
      }
    }
    // cross-role: doctor must not see /super-admin
    if (r.label === "doctor") {
      const xpage = await ctx.newPage();
      await xpage.goto(BASE + "/super-admin", { waitUntil: "domcontentloaded" });
      await xpage.waitForTimeout(1000);
      const after = xpage.url();
      const blocked = !/\/super-admin/.test(after);
      console.log(`${blocked ? "ok  " : "BAD "} doctor → /super-admin redirected to ${after}`);
      if (!blocked) fail++;
    }
    // cross-role: admin(super_admin) must not see /doctor pages
    if (r.label === "super_admin") {
      const xpage = await ctx.newPage();
      await xpage.goto(BASE + "/doctor", { waitUntil: "domcontentloaded" });
      await xpage.waitForTimeout(1000);
      const after = xpage.url();
      const blocked = !/\/doctor(\/|$)/.test(after);
      console.log(`${blocked ? "ok  " : "BAD "} super_admin → /doctor redirected to ${after}`);
      if (!blocked) fail++;
    }
    await ctx.close();
  }
  console.log(fail === 0 ? "ROLE LOGIN OK" : `${fail} FAILURES`);
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });

function pathMatches(url, path) {
  return new RegExp("^" + BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + path + "(/|$)").test(url);
}
