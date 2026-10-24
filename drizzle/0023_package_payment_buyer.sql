-- 0023: Record WHICH account actually paid for a package.
--
-- A plan belongs to a practice, and a practice is anchored at a doctor:
-- fulfillment writes `users.package_id` / `users.trial_ends_at` on the
-- credited doctor's row, so `package_payments.user_id` is the credited user.
--
-- A business owner (the `admin` tier) now buys for their practice's anchor
-- doctor from their own panel, so payer ≠ credited user. Without this column
-- the only record of who paid is the Razorpay order note, the super-admin
-- payments panel shows the wrong person, and fulfillment's audit entry
-- attributes the purchase to the credited doctor rather than the payer.
--
-- NULL = a row created before this migration; every new row records the
-- actual payer (the doctor themself, or the business owner who bought it).

ALTER TABLE package_payments ADD COLUMN buyer_id BIGINT NULL DEFAULT NULL AFTER user_id;
