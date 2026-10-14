-- 0016_push_subscription_unique.sql
-- M13: without a unique key on endpoint, two concurrent subscribe calls
-- (or the same browser re-subscribing after a Service Worker update) both
-- pass the check-then-insert guard in lib/push/actions.ts and create two rows
-- for one subscription — every SOS alert is then delivered twice.
-- Idempotent: dedupe first, then add the constraint.
DELETE s1 FROM push_subscriptions s1
JOIN push_subscriptions s2
  ON s1.endpoint = s2.endpoint AND s1.id > s2.id;
--> statement-breakpoint
ALTER TABLE push_subscriptions ADD UNIQUE KEY push_subscriptions_endpoint_unique (endpoint);
