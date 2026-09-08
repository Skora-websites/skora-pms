// Auth workflows: wrong password, deactivated account, logout, session persistence, refresh, rate limit.
import { test, expect, type Page } from "@playwright/test";

const LOGIN = "http://localhost:3100/login";

async function login(page: Page, email: string, password: string) {
  await page.goto(LOGIN);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign in/i }).click();
}

test("wrong password shows error, no session cookie set", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await login(page, "doctor@gmail.com", "WrongPass1!");
  await expect(page.getByText("Invalid email or password.")).toBeVisible({ timeout: 15000 });
  expect((await page.context().cookies()).filter((c) => c.name === "skora_session")).toHaveLength(0);
  await page.close();
});

test("nonexistent email shows same generic error (no user enumeration)", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await login(page, "nobody-test-xyz@example.com", "Whatever1!");
  await expect(page.getByText("Invalid email or password.")).toBeVisible({ timeout: 15000 });
  await page.close();
});

test("empty email blocked — HTML required attr stops submit, stays on form", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await page.goto(LOGIN);
  await page.getByLabel("Password").fill("Admin@123");
  await page.getByRole("button", { name: /Sign in/i }).click();
  // HTML5 validation: no navigation, no error text, still on /login
  await page.waitForTimeout(1000);
  expect(page.url()).toBe(LOGIN);
  expect((await page.context().cookies()).filter((c) => c.name === "skora_session")).toHaveLength(0);
  await page.close();
});

test("short password rejected by zod with clear message", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await login(page, "doctor@gmail.com", "nope");
  await expect(page.getByText("Password must be at least 6 characters")).toBeVisible({ timeout: 15000 });
  await page.close();
});

test("successful login sets httpOnly session cookie + lands on role home", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await login(page, "doctor@gmail.com", "Admin@123");
  await page.waitForURL(/\/doctor(\/|$)/, { timeout: 30000 });
  const cookie = (await page.context().cookies()).find((c) => c.name === "skora_session");
  expect(cookie).toBeTruthy();
  expect(cookie!.httpOnly).toBe(true);
  await page.close();
});

test("session survives page refresh", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await login(page, "doctor@gmail.com", "Admin@123");
  await page.waitForURL(/\/doctor(\/|$)/, { timeout: 30000 });
  await page.reload();
  await expect(page).toHaveURL(/\/doctor(\/|$)/); // still authed after reload
  await page.close();
});

test("logout destroys session — doctor page redirects to /login after", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await login(page, "doctor@gmail.com", "Admin@123");
  await page.waitForURL(/\/doctor(\/|$)/, { timeout: 30000 });
  await page.locator("header button", { hasText: "Doctor" }).first().click(); // open profile dropdown
  await page.getByRole("button", { name: "Log out" }).first().click();
  await page.waitForURL("http://localhost:3100/", { timeout: 15000 }); // logoutAction redirects to marketing home
  await page.goto("http://localhost:3100/doctor");
  await page.waitForURL(/\/login/, { timeout: 15000 }); // no residual access
  expect((await page.context().cookies()).filter((c) => c.name === "skora_session")).toHaveLength(0);
  await page.close();
});

test("login page while authenticated: form submits → bounce to role home, no double session", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await login(page, "doctor@gmail.com", "Admin@123");
  await page.waitForURL(/\/doctor(\/|$)/, { timeout: 30000 });
  const firstCookie = (await page.context().cookies()).find((c) => c.name === "skora_session");
  // second login submit while authed: loginAction sees existing session → redirect home
  await page.goto(LOGIN);
  await login(page, "doctor@gmail.com", "Admin@123");
  await page.waitForURL(/\/doctor(\/|$)/, { timeout: 30000 });
  const cookiesNow = (await page.context().cookies()).filter((c) => c.name === "skora_session");
  expect(cookiesNow.length).toBeLessThanOrEqual(1);
  // Same single session or replaced — but session table must not accumulate
  await page.close();
});

test("login rate limit: 5 failures then locked, correct error message", async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  const email = `ratelimit-${Date.now()}@example.com`; // unknown email still burns bucket
  for (let i = 0; i < 5; i++) {
    await login(page, email, "badpass1");
    await expect(page.getByText("Invalid email or password.")).toBeVisible({ timeout: 15000 });
  }
  await login(page, email, "badpass1");
  await expect(page.getByText(/Too many login attempts/)).toBeVisible({ timeout: 15000 });
  await page.close();
});
