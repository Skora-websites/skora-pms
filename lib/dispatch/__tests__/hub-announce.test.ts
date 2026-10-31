/**
 * Announcement copy for the SOS fan-out.
 *
 * `announceSosToDoctors` pushes the same alert to four channels (SSE, in-app,
 * Web Push, native push). The copy used to be assembled inline for each push
 * channel, so a change to one silently desynced the others — a doctor on the
 * app could see different words than the doctor in the browser for the same
 * emergency. These tests pin the single payload object every push channel now
 * derives from, and the emergency flags native delivery depends on.
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import { toExpoMessage } from "../../../lib/push/native";
import { sosAnnouncementPushPayload } from "../hub";

const info = {
  requestId: 42,
  distanceKm: 1.8,
  complaint: "chest pain",
  patient: "Ramesh Kumar",
};

test("the alert copy carries the patient and their complaint", () => {
  const payload = sosAnnouncementPushPayload(info);

  assert.equal(payload.title, "🚨 Emergency request nearby");
  assert.equal(payload.body, "Ramesh Kumar needs urgent help (chest pain).");
  assert.equal(payload.url, "/doctor/emergency");
  assert.equal(payload.tag, "sos-new");
});

test("a complaint-less alert still reads as an emergency", () => {
  const payload = sosAnnouncementPushPayload({ ...info, complaint: null });

  assert.equal(payload.body, "Ramesh Kumar needs urgent help.");
});

test("the emergency flag every channel keys on is set", () => {
  const payload = sosAnnouncementPushPayload(info);

  assert.equal(payload.critical, true, "SOS alerts must bypass Do Not Disturb and re-alert");
});

test("native delivery honours the same emergency flag as Web Push", () => {
  const payload = sosAnnouncementPushPayload(info);
  const message = toExpoMessage("ExponentPushToken[hub0001]", payload);

  assert.equal(message.priority, "high");
  assert.equal(message.interruptionLevel, "critical");
  assert.deepEqual(message.data, { url: "/doctor/emergency", tag: "sos-new" });
});
