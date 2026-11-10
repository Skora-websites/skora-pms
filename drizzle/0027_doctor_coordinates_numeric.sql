-- 0027: Numeric coordinates for doctor home + clinic locations (audit V4
-- follow-up / §4 table item 10 — bounding-box prefilter for SOS discovery).
--
-- WHY: 0025 made sos_requests/sos_cases numeric, but the discovery scan in
-- lib/dispatch/geo.ts reads two OTHER tables first — `users` (the doctor's
-- own mobile GPS) and `doctor_clinics` (the clinic address picked on the map)
-- — and those were still varchar. Distance math stayed on implicit string
-- coercion and the V4 item stayed half-open: an emergency dispatch still
-- walked EVERY active clinic of EVERY on-duty doctor through JS haversine.
--
-- Same shape as 0025: DECIMAL(10,7), no DEFAULT, NULL-ness preserved (both
-- pairs are nullable today — a doctor/clinic without coordinates is legal
-- and is NOT dropped from consideration, see the geo.ts docstrings).
--
-- CONVERSION IS SAFE BY CONSTRUCTION, same as 0025: these columns were only
-- ever written through Number-parsed values from the map picker or GPS
-- (`String(lat)` on the way in), so the cast is a parse, not a guess. MySQL 8
-- aborts the ALTER on a bad value — run `npm run db:check` after applying.
--
-- BOUNDING-BOX INDEXES: the discovery queries become
--  `on_duty = 1 AND latitude BETWEEN ? AND ? (AND longitude …)`, so a
-- composite (on_duty, latitude, longitude) and the clinic pair index turn
-- the prefilter into an index range scan. `EXPLAIN` before/after is the
-- acceptance criterion (§4 item 10).

ALTER TABLE `users`
  MODIFY `latitude` DECIMAL(10,7) NULL DEFAULT NULL,
  MODIFY `longitude` DECIMAL(10,7) NULL DEFAULT NULL;

--> statement-breakpoint

ALTER TABLE `doctor_clinics`
  MODIFY `latitude` DECIMAL(10,7) NULL DEFAULT NULL,
  MODIFY `longitude` DECIMAL(10,7) NULL DEFAULT NULL;

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `doctors_duty_coordinates_index`
  ON `users` (`on_duty`, `latitude`, `longitude`);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `doctor_clinics_coordinates_index`
  ON `doctor_clinics` (`latitude`, `longitude`);
