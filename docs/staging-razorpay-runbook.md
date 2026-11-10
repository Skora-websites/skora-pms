# Razorpay end-to-end staging drill (audit §4 item 6 / V6 follow-up)

**Acceptance:** one live ₹1 TEST order completes through the actual checkout
UI against a production build of this app, and access actually extends.

The code-side parts that can be automated are in
`scripts/razorpay-staging-check.ts` — run that first; it de-risks keys,
network, and the CSP before the browser step matters.

## Prerequisites

1. **Test keys** (`rzp_test_*`) from the Razorpay dashboard:
   <https://dashboard.razorpay.com/app/keys>. In `.env`:
   ```
   RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="..."
   ```
   Never run the drill with live keys. `--config` refuses non-test key ids.
2. A **production build** serving the app — the Razorpay CSP allowlist is
   production-only by design (dev traffic would otherwise be intercepted for
   debugging): locally `npm run build && npm run start`, or the staging box.
3. A **doctor account** (the buyer; `/pricing` and `/trial-expired` render
   live checkout buttons only to doctors). A business owner buys for their
   practice's anchor doctor — fine, but log in as the owner then.

## Stage A — automated pre-check

```bash
npx tsx scripts/razorpay-staging-check.ts --config --order --url http://localhost:3000
```

- `--config` keys set + test-mode
- `--order` the app's own `createRazorpayOrder` creates a real ₹1 (100
  paise) order; the order id should then appear in the Razorpay dashboard
  under **Test mode → Orders**
- `--url …/pricing` asserts the production CSP carries `checkout.razorpay.com`
  and `api.razorpay.com` in `frame-src`, and `api.razorpay.com` +
  `lumberjack.razorpay.com` in `connect-src` — the exact runtime assertion of
  the V6 fix

## Stage B — the ₹1 payment (the acceptance criterion)

1. Log in as the doctor, open `/pricing`.
2. Pick any plan (monthly) — an actual plan price will be charged, not ₹1;
   **for the ₹1 amount, create a temporary test plan** in the Razorpay
   dashboard (Test mode → Plans, ₹1 monthly) or accept the plan price in test
   mode (test money, zero cost). The criterion is a COMPLETED order, not the
   tariff.
3. Click the checkout button; the Razorpay modal opens.

   Pass conditions here: the modal OPENS (V6 — checkout.js injects under
   `'strict-dynamic'` and no console CSP error appears), and the iframe
   renders (V6 `frame-src`).
4. Pay with the test instrument the modal offers (test netbanking / UPI
   "success" flow — no real money).
5. The modal closes → the client POSTs `/api/packages/verify`.
6. **Verify fulfillment for real:**
   - the doctor's panel shows the plan active (guard re-evaluates on
     refresh), and the trial-expired wall is gone if they were expired;
   - SQL: `SELECT status, razorpay_payment_id, access_until FROM
     package_payments ORDER BY id DESC LIMIT 1;` → status `paid`, non-null
     payment id;
   - `users.trial_ends_at` moved out and `users.package_id` is the bought
     package id;
   - an audit-log row with `metadata->event = "package_purchased"`.
7. **Webhook redundancy (separate pass):** in the Razorpay dashboard set the
   webhook URL `<staging origin>/api/packages/webhook` with a secret → put it
   in `RAZORPAY_WEBHOOK_SECRET`. Trigger a second purchase and kill the
   browser tab BEFORE the success callback — the webhook alone must mark the
   row `paid` (this is the path ABDM's async-callback design will reuse;
   see docs/abdm-interop-spike.md step 2 gate).

## What "done" means for the audit

§4 row 6 can be struck the moment step 6's SQL returns `status = paid` on a
production build (and ideally step 7 too). The automated half (Stage A) is
committed here; Stage B needs the staging environment, which is why the row
stays open until then.
