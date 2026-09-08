// File uploads: profile photo happy path + oversize + wrong-type + serves via authed API.
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

// Minimal real JPEG (magic bytes FFD8FF + EOI) and real PNG (89PNG + IEND).
const tinyJpg = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);
const tinyPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
]);
const tmp = (name: string, data: Buffer) => {
  const p = path.join("test-results", name);
  fs.mkdirSync("test-results", { recursive: true });
  fs.writeFileSync(p, data);
  return p;
};

test("profile photo: valid JPG uploads, saves to storage+DB, serves via authed route", async ({ page }) => {
  await page.goto("/doctor/profile");
  const file = page.locator('input[name="photo"]');
  await file.setInputFiles(tmp("up-tiny.jpg", tinyJpg));
  // auto-submits on change; the profile page img flips from initials to the photo URL.
  // (visible=false because a second PhotoUpload exists in a hidden tab — attached is enough)
  await expect(page.locator('img[src="/api/doctor/profile/photo"]').first()).toBeAttached({ timeout: 20000 });
  // fetch the route as this authed user: 200 image/jpeg
  const res = await page.evaluate(async () => {
    const r = await fetch("/api/doctor/profile/photo");
    return { status: r.status, type: r.headers.get("content-type") };
  });
  console.log("EVIDENCE photo api:", JSON.stringify(res));
  expect(res.status).toBe(200);
  expect(res.type).toBe("image/jpeg");
});

test("profile photo: non-image (txt) rejected with error, no DB change", async ({ page }) => {
  await page.goto("/doctor/profile");
  const before = await page.evaluate(async () => (await fetch("/api/doctor/profile/photo")).status);
  await page.locator('input[name="photo"]').setInputFiles({
    name: "evil.txt", mimeType: "text/plain", buffer: Buffer.from("not an image"),
  });
  await expect(page.getByText(/Only JPG or PNG images are allowed/i)).toBeVisible({ timeout: 15000 });
  const after = await page.evaluate(async () => (await fetch("/api/doctor/profile/photo")).status);
  expect(after).toBe(before); // untouched
});

test("profile photo: oversize (>2MB) rejected", async ({ page }) => {
  await page.goto("/doctor/profile");
  const big = Buffer.concat([tinyPng, Buffer.alloc(2.5 * 1024 * 1024)]); // > 2MB, PNG magic first
  await page.locator('input[name="photo"]').setInputFiles(tmp("up-big.png", big));
  await expect(page.getByText(/Image must be under 2 MB/i)).toBeVisible({ timeout: 15000 });
});

test("photo route: anon request → 401", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const r = await ctx.request.get("/api/doctor/profile/photo");
  console.log("EVIDENCE anon photo api status:", r.status());
  expect([401, 403]).toContain(r.status()); // route returns 401 directly, no redirect
  await ctx.close();
});
