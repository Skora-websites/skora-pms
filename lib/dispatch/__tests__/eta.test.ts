/**
 * Road-aware ETA with straight-line fallback (audit P6).
 *
 * The contract is DEGRADATION, never failure: an ETA must always be a number,
 * and every broken-provider case must land on the same value the pre-P6 code
 * produced. If this suite ever starts asserting that a failure throws, the
 * patient's countdown has become dependent on a third party — which is the
 * regression the seam exists to prevent.
 *
 * Pure by construction — the provider is injected, never fetched. Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { hasEtaProvider, estimateEtaMinutes, setEtaProvider, straightLineEtaMinutes } from "../eta";

const FROM = { lat: 12.9716, lng: 77.5946 };
const TO = { lat: 13.0, lng: 77.65 };
const STRAIGHT_KM = 8;

const reset = () => setEtaProvider(null);

test("no provider registered by default — degrades to the straight line", async () => {
  reset();
  assert.equal(hasEtaProvider(), false);

  // The exact pre-P6 formula: 8 km / 30 km/h = 16 minutes.
  const estimate = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: STRAIGHT_KM });
  assert.equal(estimate.minutes, 16);
  assert.equal(estimate.basis, "straight-line");
});

test("an unconfigured deployment behaves exactly like the old code", async () => {
  reset();
  // The property the whole P6 design rests on: with no provider, the number
  // the patient sees is bit-identical to what shipped before the feature.
  const before = straightLineEtaMinutes(8);
  const after = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: 8 });
  assert.equal(after.minutes, before);
});

test("a road distance is used when a provider is registered", async () => {
  setEtaProvider(async () => 11.5); // the river detour
  try {
    const estimate = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: STRAIGHT_KM });
    // 11.5 / 30 * 60 = 23 minutes, not the straight line's 16.
    assert.equal(estimate.minutes, 23);
    assert.equal(estimate.basis, "road");
  } finally {
    reset();
  }
});

test("a provider that throws falls back to the straight line", async () => {
  setEtaProvider(async () => {
    throw new Error("map API down");
  });
  try {
    const estimate = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: STRAIGHT_KM });
    assert.equal(estimate.minutes, 16);
    assert.equal(estimate.basis, "straight-line");
  } finally {
    reset();
  }
});

test("a provider that cannot route (null) falls back", async () => {
  setEtaProvider(async () => null);
  try {
    const estimate = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: STRAIGHT_KM });
    assert.equal(estimate.minutes, 16);
    assert.equal(estimate.basis, "straight-line");
  } finally {
    reset();
  }
});

test("nonsensical provider values fall back, never shorten the countdown", async () => {
  // Straight-line is a LOWER bound on road distance, so a "road distance"
  // below the straight line is a broken response — it must not be trusted,
  // because it would promise the patient a shorter wait than physics allows.
  for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY, 4]) {
    setEtaProvider(async () => bad);
    const estimate = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: STRAIGHT_KM });
    assert.equal(
      estimate.minutes,
      16,
      `a provider returning ${String(bad)} must fall back to the straight line`
    );
    assert.equal(estimate.basis, "straight-line");
  }
  reset();
});

test("an absurd detour is rejected rather than believed", async () => {
  // >10x the straight line means a bad response, not a 90 km trip.
  setEtaProvider(async () => 400);
  try {
    const estimate = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: STRAIGHT_KM });
    assert.equal(estimate.minutes, 16);
    assert.equal(estimate.basis, "straight-line");
  } finally {
    reset();
  }
});

test("straightLineEtaMinutes: 1-minute floor and rounding are preserved", () => {
  // The countdown must never read "0 min" for a doctor who is 200 m away.
  assert.equal(straightLineEtaMinutes(0.05), 1);
  assert.equal(straightLineEtaMinutes(0), 1);
  assert.equal(straightLineEtaMinutes(30), 60);
});

test("setEtaProvider(null) restores the straight-line path", async () => {
  setEtaProvider(async () => 40);
  try {
    const roadFirst = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: STRAIGHT_KM });
    assert.equal(roadFirst.basis, "road");
  } finally {
    reset();
  }
  const afterReset = await estimateEtaMinutes({ from: FROM, to: TO, straightLineKm: STRAIGHT_KM });
  assert.equal(afterReset.basis, "straight-line");
});
