import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // e2e/probes.spec.ts is a standalone diagnostic script (not a Playwright
  // test) — it runs as a top-level IIFE with hardcoded URLs and would kill
  // the suite with an unhandled rejection. Run it manually instead.
  testIgnore: "**/probes.spec.ts",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    // Port 3000 is occupied by another project on this machine — SkoraCare
    // dev server for E2E runs on 3100 (see e2e/global-setup.ts).
    baseURL: "http://localhost:3100",
    storageState: "e2e/.auth/doctor.json",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en-IN",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});