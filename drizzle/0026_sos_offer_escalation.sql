-- 0026: Offer-timeout radius escalation for SOS dispatch (audit P5).
--
-- WHY: the doctor set offered an emergency request was a snapshot frozen at
-- trigger time. The only thing that could add to it afterwards was the 20s
-- late-joiner sweep, which re-runs discovery at the SAME radius. So a patient
-- in a thin-supply area waited the full request TTL (5 min) even when a doctor
-- at 1.5x the radius would have accepted. Uber's re-dispatch loop solves this
-- by letting an offer set expire and reaching further out; these two columns
-- are the state that loop needs.
--
-- `escalation_round` is the round counter. The advance is a CONDITIONAL
-- UPDATE (`WHERE escalation_round = <expected>`) — the same affectedRows
-- pattern acceptSos uses to claim a request — so two sweeps racing on one
-- request cannot double-escalate it.
--
-- DEFAULT 0 + NOT NULL is deliberate: an existing row is "round 0", which is
-- exactly the pre-P5 behaviour (dispatch at the patient's own radius, no
-- widening). An un-migrated deployment and a migrated one therefore behave
-- identically, and the feature is opt-in-by-migration with no code branch.
--
-- `last_escalated_at` NULL means "round 0, clock started at created_at", so
-- no backfill is needed. Only reads are `COALESCE(last_escalated_at,
-- created_at)` in lib/dispatch/escalation.ts.

ALTER TABLE `sos_requests`
  ADD COLUMN `escalation_round` INT NOT NULL DEFAULT 0 AFTER `radius_km`,
  ADD COLUMN `last_escalated_at` TIMESTAMP NULL DEFAULT NULL AFTER `escalation_round`;

--> statement-breakpoint

-- The cron sweep looks for pending requests that are NOT already at their
-- final round; without this the sweep is a full table scan of sos_requests on
-- a table that is small today but is the emergency hot path.
CREATE INDEX IF NOT EXISTS `sos_requests_escalation_index`
  ON `sos_requests` (`status`, `escalation_round`);
