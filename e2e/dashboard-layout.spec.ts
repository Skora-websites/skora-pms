import { test, expect } from "@playwright/test";

// Layout regression: dashboards must never scroll horizontally at any width,
// and the desktop header must start after the fixed sidebar (not under it).
const WIDTHS = [1920, 1440, 1280, 1024, 768, 390];

test("dashboards have no horizontal overflow at any viewport width", async ({ page }) => {
  test.setTimeout(240_000);
  for (const width of WIDTHS) {
    for (const path of ["/super-admin", "/doctor"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow, `${path} @ ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test("desktop header starts after the sidebar, breadcrumb visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/super-admin", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const rects = await page.evaluate(() => {
    const aside = document.querySelector("aside")!.getBoundingClientRect();
    const header = document.querySelector("header.sticky")!.getBoundingClientRect();
    const breadcrumb = header ? document.querySelector("header.sticky .text-sm span.font-medium") : null;
    const br = breadcrumb?.getBoundingClientRect();
    return { asideRight: aside.right, headerLeft: header.left, breadcrumbLeft: br?.left ?? null };
  });
  expect(rects.headerLeft).toBeGreaterThanOrEqual(rects.asideRight);
  expect(rects.breadcrumbLeft).toBeGreaterThan(rects.asideRight);
});
