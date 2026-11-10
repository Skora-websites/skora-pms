/**
 * Razorpay staging pre-check (audit 4-table item 6 / V6 follow-up).
 *
 * Automates every part of the staging check that does not need a browser:
 *
 *  --config   keys are set, and the key id looks like a TEST key
 *             (rzp_test_...). The live test must run against test keys only.
 *  --order    creates a real Rs.1 (100 paise) order via the app's OWN
 *             createRazorpayOrder helper - proves the keys, the network
 *             path and the exact request shape checkout will send.
 *  --url U    fetches U/pricing and asserts the production CSP carries the
 *             Razorpay allowlist (frame-src + connect-src). V6 shipped this
 *             behind an isDev flag, so the URL must be a PRODUCTION build
 *             (staging host, or `npm run build && npm run start` locally).
 *
 * The BROWSER step (the actual acceptance: one Rs.1 test payment through the
 * Checkout modal) is described in docs/staging-razorpay-runbook.md. Nothing
 * here fakes a payment or signs a synthetic webhook - fulfillment has to be
 * proven for real.
 *
 * Usage:
 *   npx tsx scripts/razorpay-staging-check.ts --config --order --url http://localhost:3000
 */

import "dotenv/config";

async function checkConfig(): Promise<boolean> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  if (!keyId || !keySecret) {
    console.error(
      "FAIL [config]: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set.\n" +
        "  Paste the TEST keys from https://dashboard.razorpay.com/app/keys into .env, then retry."
    );
    return false;
  }
  if (!keyId.includes("test")) {
    console.error(
      `FAIL [config]: the key id does not look like a test key (starts "${keyId.slice(0, 9)}...").\n` +
        "  The staging drill must run against TEST keys - never live ones."
    );
    return false;
  }
  console.log("PASS [config]: test keys are set; checkout UI will render.");
  return true;
}

async function checkOrder(): Promise<boolean> {
  const { createRazorpayOrder } = await import("../lib/packages/razorpay");
  try {
    const order = await createRazorpayOrder({
      amount: 100, // Rs.1 in paise - the acceptance amount
      receipt: `staging_check_${Date.now()}`,
      notes: { source: "staging-prefix-check", date: new Date().toISOString() },
    });
    console.log(
      `PASS [order]: Razorpay accepted a Rs.1 order - id ${order.id}, amount ${order.amount} ${order.currency}, status ${order.status}`
    );
    console.log("  Use this order id to cross-check it appears in the Razorpay dashboard (Test mode > Orders).");
    return true;
  } catch (err) {
    console.error(`FAIL [order]: ${(err as Error).message}`);
    return false;
  }
}

async function checkCsp(baseUrl: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/$/, "")}/pricing`, { redirect: "manual" });
  } catch (err) {
    console.error(`FAIL [csp]: cannot reach ${baseUrl}: ${(err as Error).message}`);
    return false;
  }
  const csp = res.headers.get("content-security-policy") ?? "";
  const needs: Array<[string, string]> = [
    ["frame-src", "https://checkout.razorpay.com"],
    ["frame-src", "https://api.razorpay.com"],
    ["connect-src", "https://api.razorpay.com"],
    ["connect-src", "https://lumberjack.razorpay.com"],
  ];
  const missing: string[] = [];
  for (const [directive, entry] of needs) {
    const directiveValue = csp
      .split(";")
      .find((d) => d.trim().startsWith(directive));
    if (!directiveValue || !directiveValue.includes(entry)) {
      missing.push(`${directive} must include ${entry}`);
    }
  }
  if (missing.length > 0) {
    console.error(`FAIL [csp] (HTTP ${res.status}): ${missing.join("; ")}`);
    console.error("  Dev builds intentionally omit these - check a PRODUCTION build (npm run build && npm run start).");
    return false;
  }
  console.log(`PASS [csp]: production CSP at ${baseUrl}/pricing carries the whole Razorpay allowlist (V6).`);
  return true;
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  if (args.size === 0) {
    console.error(
      "No stage selected. Usage:\n" +
        "  npx tsx scripts/razorpay-staging-check.ts --config\n" +
        "  npx tsx scripts/razorpay-staging-check.ts --config --order\n" +
        "  npx tsx scripts/razorpay-staging-check.ts --config --url https://your-staging-host"
    );
    process.exit(2);
  }

  let ok = true;
  if (args.has("--config")) ok = (await checkConfig()) && ok;
  if (args.has("--order")) ok = (await checkOrder()) && ok;
  const urlIdx = process.argv.indexOf("--url");
  if (urlIdx !== -1 && process.argv[urlIdx + 1]) {
    ok = (await checkCsp(process.argv[urlIdx + 1])) && ok;
  }

  if (ok) {
    console.log("\nAll requestable stages passed. Finish the drill per docs/staging-razorpay-runbook.md (the Rs.1 payment in the browser).");
    process.exit(0);
  }
  process.exit(1);
}

void main();
