import "dotenv/config";

import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTime, parseTimeToMinutes, toDisplay, weekdayOf } from "../available-slots";

/**
 * The booking slot helpers, shared by the web's
 * `/api/patient/available-slots` and the mobile mirror. They are pure, so
 * the formats the doctor's schedule is actually stored in can be pinned.
 */

test('"h:mm AM/PM" is parsed to minutes since midnight', () => {
  assert.equal(parseTimeToMinutes("9:30 AM"), 9 * 60 + 30);
  assert.equal(parseTimeToMinutes("12:00 AM"), 0);
  assert.equal(parseTimeToMinutes("12:00 PM"), 12 * 60);
  assert.equal(parseTimeToMinutes("11:59 PM"), 23 * 60 + 59);
});

test("24-hour \"HH:MM\" is parsed to minutes since midnight", () => {
  assert.equal(parseTimeToMinutes("00:00"), 0);
  assert.equal(parseTimeToMinutes("14:05"), 14 * 60 + 5);
  assert.equal(parseTimeToMinutes("23:59"), 23 * 60 + 59);
});

test("an unparsable time returns null, never NaN", () => {
  assert.equal(parseTimeToMinutes("noon"), null);
  assert.equal(parseTimeToMinutes("25:00"), null, "an out-of-range hour");
  assert.equal(parseTimeToMinutes("13:60"), null, "an out-of-range minute");
  assert.equal(parseTimeToMinutes(""), null);
});

test("a 13 o'clock in 12-hour form is refused", () => {
  // "13:30 PM" is not a real clock reading.
  assert.equal(parseTimeToMinutes("13:30 PM"), null);
});

test("display times lose their leading zero", () => {
  assert.equal(toDisplay(9 * 60 + 5), "9:05 AM");
  assert.equal(toDisplay(12 * 60), "12:00 PM");
  assert.equal(toDisplay(0), "12:00 AM");
});

test("normalizeTime collapses every stored spelling to one key", () => {
  // A doctor's schedule row may hold any of these; a booked appointment must
  // match it exactly or the slot leaks back into the free list.
  assert.equal(normalizeTime("09:30 AM"), "9:30 AM");
  assert.equal(normalizeTime("9:30 AM"), "9:30 AM");
  assert.equal(normalizeTime("14:05"), "2:05 PM");
  assert.equal(normalizeTime("00:30"), "12:30 AM");
});

test("normalizeTime leaves an unrecognised value untouched", () => {
  assert.equal(normalizeTime("morning"), "morning");
});

test("the round trip through display is stable", () => {
  for (const input of ["9:30 AM", "12:00 PM", "12:00 AM", "11:59 PM"]) {
    const minutes = parseTimeToMinutes(input);
    assert.ok(minutes !== null);
    assert.equal(toDisplay(minutes), input);
  }
});

/**
 * Weekday resolution is UTC, not local (audit R4).
 *
 * `new Date("YYYY-MM-DDT00:00:00")` is a LOCAL-time parse: on a server whose
 * timezone sits behind the clinic's, that instant rolls back to the previous
 * day and the doctor's schedule resolved empty — no error, just no slots.
 * Pinning a known calendar date catches any future reintroduction.
 */
test("weekdayOf resolves a calendar date in UTC, not the server's local time", () => {
  // 2026-11-05 is a Thursday. getUTCDay: 0=Sunday … 4=Thursday.
  assert.equal(weekdayOf("2026-11-05"), 4);
  assert.equal(weekdayOf("2026-01-01"), 4, "a New Year boundary date");
  assert.equal(weekdayOf("2026-02-28"), 6);
  assert.equal(weekdayOf("2026-03-01"), 0, "a non-leap February rolls into Sunday");
  // Every day of one week, so an off-by-one in either direction fails.
  const week = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
  const expected = [1, 2, 3, 4, 5, 6, 0];
  week.forEach((d, i) => assert.equal(weekdayOf(d), expected[i], d));
});

test("weekdayOf surfaces a malformed date as NaN rather than a wrong weekday", () => {
  // Both callers guard the format before this runs (the routes regex-check
  // YYYY-MM-DD); this pins that a bad value still fails visibly — NaN never
  // matches a day-of-week string, so the query returns no rows instead of
  // silently matching the wrong day.
  assert.ok(Number.isNaN(weekdayOf("not-a-date")));
  assert.ok(Number.isNaN(weekdayOf("")));
});
