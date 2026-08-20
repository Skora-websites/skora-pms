import { expect } from "@playwright/test";

let counter = 0;

/** Unique suffix so repeated runs never collide with leftover data. */
export function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** Minimal 1-page PDF served as an upload fixture. */
export const tinyPdf = Buffer.from(
  "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n140\n%%EOF"
);

/** Shared assertion so a failed login is never silently swallowed. */
export async function expectSignedIn(page: import("@playwright/test").Page) {
  await expect(page).toHaveURL(/\/doctor(\/|$)/);
}