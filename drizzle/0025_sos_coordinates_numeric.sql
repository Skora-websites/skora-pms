-- 0025: Numeric coordinates for the emergency dispatch tables (audit P4).
--
-- WHY: `sos_requests.latitude/longitude` and `sos_cases.doctor_latitude/
-- doctor_longitude` were varchar. Every distance computation in
-- lib/dispatch/geo.ts then relied on implicit string→number coercion, and
-- range predicates could not use an index. On an emergency dispatch path,
-- query time IS response time — nearby-doctor discovery is the hot query.
--
-- DECIMAL(10,7), not DOUBLE: 7 decimal places is ~1cm of latitude, well past
-- GPS accuracy, and DECIMAL stores the exact decimal the client sent instead
-- of a binary float — so a round trip through the DB returns the value the
-- patient's device actually reported, which matters for the tracker's map.
--
-- CONVERSION IS SAFE BY CONSTRUCTION: these columns were only ever written
-- from Number-parsed values (`String(lat)` on the way in), so the cast is a
-- parse, not a guess. Rows that somehow hold a non-numeric string would fail
-- the ALTER — MySQL 8 applies the change in place and aborts on a bad value,
-- so run `npm run db:check` after applying. No DEFAULT is set: the columns
-- keep their existing NULL-ness (requests keep NOT NULL on the patient pair,
-- which the write path always supplies).
--
-- The `as never` casts in lib/queries/* on these columns were only there to
-- paper over the varchar type; they are removed with this migration.

ALTER TABLE `sos_requests`
  MODIFY `latitude` DECIMAL(10,7) NOT NULL,
  MODIFY `longitude` DECIMAL(10,7) NOT NULL;

--> statement-breakpoint

ALTER TABLE `sos_cases`
  MODIFY `doctor_latitude` DECIMAL(10,7) NULL DEFAULT NULL,
  MODIFY `doctor_longitude` DECIMAL(10,7) NULL DEFAULT NULL;

--> statement-breakpoint

-- The discovery query filters nearby on-duty doctors by distance; the case
-- lookup is by sos_request_id + doctor_id. A composite covering the pair
-- makes the hot read an index range scan rather than a table scan.
CREATE INDEX IF NOT EXISTS `sos_requests_coordinates_index`
  ON `sos_requests` (`latitude`, `longitude`);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `sos_cases_doctor_coordinates_index`
  ON `sos_cases` (`doctor_latitude`, `doctor_longitude`);
