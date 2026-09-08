import { test, expect } from "@playwright/test";
import { tinyPdf } from "./helpers";

/** 4.5MB pdf — above the 3MB bodySizeLimit but under the vendor 10MB cap. */
const bigPdf = Buffer.concat([tinyPdf, Buffer.alloc(4_500_000 - tinyPdf.length, 0x0a)]);

test("consult-pdf: 4.5MB upload accepted (bodySizeLimit 200mb > 10mb action cap)", async ({ page }) => {
  await page.goto("/doctor/consult-pdf");
  await page.locator('input[type="file"]').setInputFiles({ name: "big.pdf", mimeType: "application/pdf", buffer: bigPdf });
  await page.getByRole("button", { name: /Upload PDF/i }).click();
  // 4.5MB is under the friendly 10MB action cap → the file must land. Assert
  // via the API (server-rendered card text is ambiguous in dev streaming).
  let ok = false;
  for (let i = 0; i < 30 && !ok; i++) {
    await page.waitForTimeout(1_000);
    const res = await page.request.get("/api/doctor/consult-pdf");
    if (res.status() === 200) ok = true;
  }
  expect(ok, "4.5MB consult PDF served after upload").toBe(true);
});
