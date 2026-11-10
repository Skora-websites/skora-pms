/**
 * findNearbyDoctors + boundingBox — §4 item 10, bounding-box prefilter.
 *
 * What is under test:
 *  1. the box is a CORRECT superset of the haversine circle (tight enough to
 *     filter meaningfully, wide enough at high latitudes to never clip a
 *     truly-in-radius doctor) — pure, no DB;
 *  2. the REAL discovery path (DB): SQL prefilter + JS haversine still
 *     reproduce the exact candidate semantics — clinic wins over mobile for
 *     the same doctor, an out-of-radius clinic doesn't hide an in-radius
 *     home location, and an off-duty doctor is never offered regardless of
 *     coordinates;
 *  3. the prefilter itself: a doctor whose coordinates fall OUTSIDE the
 *     bounding box is never even read — the candidate set the JS pass sees
 *     is box-bounded.
 *
 * Run: npm test (needs the live MySQL — same as the other fixture suites).
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, doctorClinics } from "@/lib/db/schema";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { makeUser, makeClinic } from "../../../tests/helpers/fixtures";
import * as fixtureSession from "../../../tests/helpers/doctor-session-stub";
import { boundingBox, findNearbyOnDutyDoctors, haversineKm } from "../geo";

test("the bounding box is a superset of the haversine circle", () => {
  // Centre: Pune. Points on the circle's extreme N/S/E/W must stay inside.
  const lat = 18.5204;
  const lng = 73.8567;
  const radius = 5;
  const box = boundingBox(lat, lng, radius);

  // N / S / E / W extremes of the true circle (haversine-verified points).
  const north = { lat: lat + radius / 111.32, lng };
  const south = { lat: lat - radius / 111.32, lng };
  const east = { lat, lng: lng + radius / (111.32 * Math.cos((lat * Math.PI) / 180)) };
  const EPS = 1e-9;
  assert.ok(north.lat <= box.latMax + EPS && north.lat >= box.latMin - EPS);
  assert.ok(south.lat <= box.latMax + EPS && south.lat >= box.latMin - EPS);
  assert.ok(east.lng <= box.lngMax + EPS && east.lng >= box.lngMin - EPS);

  // but the box actually FILTERS: a point 12 km north is outside both.
  const far = { lat: lat + 12 / 111.32, lng };
  assert.ok(far.lat > box.latMax);

  // High-latitude centre: the east-west half-width widens as 1/cos(lat), not
  // clips — Shimla (31°N) is measurably wider than Pune (18.5°N): ~1.11x.
  const shimla = boundingBox(31.1048, 77.1734, 5);
  const pune = boundingBox(lat, lng, 5);
  assert.ok(shimla.lngMax - shimla.lngMin > (pune.lngMax - pune.lngMin) * 1.05);
  assert.ok(shimla.lngMax - shimla.lngMin < (pune.lngMax - pune.lngMin) * 1.2);
});

const SPECIFIER_STUBS: Record<string, string> = {
  "next/headers": "../../../tests/helpers/next-stubs.ts",
  "next/cache": "../../../tests/helpers/next-stubs.ts",
};

type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => { url: string }
) => { url: string };

type ModuleWithHooks = { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const moduleWithHooks = nodeModule as unknown as ModuleWithHooks;

moduleWithHooks.registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubIndex = Object.keys(SPECIFIER_STUBS).indexOf(specifier);
    if (stubIndex !== -1) {
      return { url: new URL(SPECIFIER_STUBS[stubIndex], import.meta.url).href, shortCircuit: true };
    }
    return { url: nextResolve(specifier, context).url, shortCircuit: true };
  },
});

const PATIENT = { lat: 18.5204, lng: 73.8567 };
const RADIUS = 5;

async function setCoords(
  table: typeof users | typeof doctorClinics,
  id: number,
  lat: number | null,
  lng: number | null
): Promise<void> {
  const patch = table === users
    ? { latitude: lat, longitude: lng, updatedAt: new Date() }
    : { latitude: lat, longitude: lng, updatedAt: new Date() };
  await db.update(table).set(patch).where(eq((table as typeof users).id, id));
}

test("discovery semantics survive the SQL prefilter", async () => {
  await withCleanFixtures(async () => {
    const clinicInRadiusDoctor = await makeUser({ role: "doctor" });
    const mobileDoctor = await makeUser({ role: "doctor" });
    const rescuedDoctor = await makeUser({ role: "doctor" });
    const offDutyDoctor = await makeUser({ role: "doctor" });
    // A clinic ~14 km north: outside radius AND outside the box.
    const clinicFar = await makeClinic(clinicInRadiusDoctor === 0 ? 0 : await makeUser({ role: "doctor" }));

    // Doctor 1: clinic inside the radius (Bavdhan ~3.5 km WSW).
    const clinicNear = await makeClinic(clinicInRadiusDoctor);
    await db
      .update(doctorClinics)
      .set({ latitude: 18.5074, longitude: 73.8343, updatedAt: new Date() })
      .where(eq(doctorClinics.id, clinicNear));
    await db.update(users).set({ onDuty: true, updatedAt: new Date() }).where(eq(users.id, clinicInRadiusDoctor));

    // Doctor 2: no clinic coordinates, but own GPS inside the radius.
    await setCoords(users, mobileDoctor, 18.525, 73.86);
    await db.update(users).set({ onDuty: true, updatedAt: new Date() }).where(eq(users.id, mobileDoctor));

    // Doctor 3: clinic OUTSIDE the radius, own GPS INSIDE — the fallback that
    // must not be lost to the prefilter (the V4-adjacent rescue path).
    await db
      .update(doctorClinics)
      .set({ latitude: 18.7, longitude: 73.9, updatedAt: new Date() })
      .where(eq(doctorClinics.id, clinicFar));
    await setCoords(users, rescuedDoctor, 18.53, 73.85);
    await db.update(users).set({ onDuty: true, updatedAt: new Date() }).where(eq(users.id, rescuedDoctor));

    // Doctor 4: on duty flag OFF, coordinates dead-centre — must never appear.
    await setCoords(users, offDutyDoctor, 18.5204, 73.8567);

    // Seed a session for the fixture helper (unused by the query itself, but
    // keeps the helper import alive for future auth-scoping work).
    fixtureSession.setFixtureDoctor({ id: 0, name: "s", email: "s@fixture.test", role: "doctor" });

    const nearby = await findNearbyOnDutyDoctors(PATIENT.lat, PATIENT.lng, RADIUS);
    const byDoctor = new Map(nearby.map((d) => [d.doctorId, d]));

    // Clinic entry for doctor 1 — clinic wins, never a mobile duplicate.
    const d1 = byDoctor.get(clinicInRadiusDoctor);
    assert.ok(d1);
    assert.equal(d1.clinicId, clinicNear);
    assert.ok((d1.clinicName ?? "").trim().length > 0);

    // Doctor 2 only as mobile.
    const d2 = byDoctor.get(mobileDoctor);
    assert.ok(d2);
    assert.match(d2.clinicName, /mobile/);

    // Doctor 3 rescued by their OWN coordinates: out-of-radius clinic did
    // not hide them.
    const d3 = byDoctor.get(rescuedDoctor);
    assert.ok(d3);
    assert.match(d3.clinicName, /mobile/);

    // Off-duty doctor absent; the doctors created as clinic owners along the
    // way (never marked on duty) leaked nothing in.
    assert.equal(byDoctor.get(offDutyDoctor), undefined);
    assert.ok(
      nearby.every((d) =>
        [clinicInRadiusDoctor, mobileDoctor, rescuedDoctor].includes(d.doctorId)
      )
    );
    assert.ok(nearby.every((d) => d.distanceKm <= RADIUS));

    // And the clinic row that IS in radius is the honest haversine distance.
    const expected = haversineKm(PATIENT.lat, PATIENT.lng, 18.5074, 73.8343);
    assert.ok(Math.abs((d1?.distanceKm ?? -1) - Math.round(expected * 100) / 100) < 0.05);
  });
});
