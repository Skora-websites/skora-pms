/**
 * US5 — duty status and SOS dispatch read ONE column.
 *
 * Audit H5/R4: the header pill was computed from `clinic_on_duty` /
 * `home_visit_on_duty`, a pair nothing ever wrote, so the pill could never
 * leave "Offline" while its tooltip advertised a toggle that did not exist.
 * The SOS broadcast already filtered on `users.on_duty`. Both now read
 * `users.on_duty`: the layout feeds dutyModeOf(user.onDuty) into the header and
 * setDoctorOnDuty writes that same column.
 *
 * SC-007 requires the pill to follow the column and the broadcast to exclude an
 * off-duty doctor. Rather than asserting the two read "the same column" by
 * source inspection, these tests flip the one column and watch both consumers
 * move: the duty input the header renders, and the doctor set the broadcast
 * offers.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { makeClinic, makeUser } from "../../../tests/helpers/fixtures";
import { db } from "@/lib/db";
import { doctorClinics, users } from "@/lib/db/schema";
import { findNearbyOnDutyDoctors } from "../geo";
import { dutyModeOf } from "@/lib/utils";

/** Patient location — the coordinates triggerSos submits. */
const PATIENT_LAT = 12.9716;
const PATIENT_LNG = 77.5946;
const RADIUS_KM = 20;

/** A doctor who is on duty at a clinic inside the dispatch radius. */
async function makeDispatchedDoctor(options: {
  onDuty: boolean;
  clinicCoords?: { latitude: string; longitude: string } | null;
  doctorCoords?: { latitude: string; longitude: string } | null;
}) {
  const doctorId = await makeUser({ role: "doctor" });
  const clinicId = await makeClinic(doctorId);
  if (options.clinicCoords) {
    await db
      .update(doctorClinics)
      .set(options.clinicCoords)
      .where(eq(doctorClinics.id, clinicId));
  }
  await db
    .update(users)
    .set({
      onDuty: options.onDuty,
      latitude: options.doctorCoords?.latitude ?? null,
      longitude: options.doctorCoords?.longitude ?? null,
    })
    .where(eq(users.id, doctorId));
  return { doctorId, clinicId };
}

/** The stored duty flag, i.e. exactly what the header's duty input receives. */
async function storedOnDuty(doctorId: number): Promise<boolean | null> {
  const [row] = await db
    .select({ onDuty: users.onDuty })
    .from(users)
    .where(eq(users.id, doctorId))
    .limit(1);
  return row?.onDuty ?? null;
}

test("the duty input the header renders follows the writable column", () => {
  // dutyModeOf is the header's input (app/doctor/layout.tsx passes
  // dutyModeOf(user.onDuty)); it must react to the only column anything writes.
  assert.equal(dutyModeOf(true), "on");
  assert.equal(dutyModeOf(false), "off");
  assert.equal(dutyModeOf(null), "off");
  assert.equal(dutyModeOf(undefined), "off");
});

test("an on-duty doctor inside the radius is offered, and flipping the column off removes them", async () => {
  await withCleanFixtures(async () => {
    const { doctorId } = await makeDispatchedDoctor({
      onDuty: true,
      clinicCoords: { latitude: "12.9716", longitude: "77.5946" },
    });

    const onDutyOffers = await findNearbyOnDutyDoctors(PATIENT_LAT, PATIENT_LNG, RADIUS_KM);
    assert.equal(
      onDutyOffers.some((d) => d.doctorId === doctorId),
      true,
      "an on-duty doctor at the patient's clinic must be offered"
    );

    await db.update(users).set({ onDuty: false }).where(eq(users.id, doctorId));
    assert.equal(dutyModeOf(await storedOnDuty(doctorId)), "off");

    const offDutyOffers = await findNearbyOnDutyDoctors(PATIENT_LAT, PATIENT_LNG, RADIUS_KM);
    assert.equal(
      offDutyOffers.some((d) => d.doctorId === doctorId),
      false,
      "an off-duty doctor must be absent from the broadcast (SC-007)"
    );
  });
});

test("the broadcast and the pill flip together on the same column", async () => {
  await withCleanFixtures(async () => {
    const { doctorId } = await makeDispatchedDoctor({
      onDuty: false,
      clinicCoords: { latitude: "12.9716", longitude: "77.5946" },
    });

    // Off duty: the pill renders Offline and the broadcast offers nobody.
    assert.equal(dutyModeOf(await storedOnDuty(doctorId)), "off");
    const offDutyOffers = await findNearbyOnDutyDoctors(PATIENT_LAT, PATIENT_LNG, RADIUS_KM);
    assert.equal(offDutyOffers.length, 0);

    await db.update(users).set({ onDuty: true }).where(eq(users.id, doctorId));

    // On duty: the pill renders Online and the broadcast offers the doctor.
    // Both moved because both read users.on_duty.
    assert.equal(dutyModeOf(await storedOnDuty(doctorId)), "on");
    const onDutyOffers = await findNearbyOnDutyDoctors(PATIENT_LAT, PATIENT_LNG, RADIUS_KM);
    assert.equal(
      onDutyOffers.some((d) => d.doctorId === doctorId),
      true,
      "the broadcast must offer the same doctor the pill now shows Online"
    );
  });
});

test("an off-duty doctor with a clinic inside the radius is still excluded", async () => {
  await withCleanFixtures(async () => {
    const { doctorId } = await makeDispatchedDoctor({
      onDuty: false,
      clinicCoords: { latitude: "12.9716", longitude: "77.5946" },
    });

    const offers = await findNearbyOnDutyDoctors(PATIENT_LAT, PATIENT_LNG, RADIUS_KM);
    assert.equal(
      offers.some((d) => d.doctorId === doctorId),
      false,
      "a clinic inside the radius must not override the off-duty flag"
    );
  });
});

test("a doctor beyond the radius is excluded even while on duty", async () => {
  await withCleanFixtures(async () => {
    // ~250 km from the patient — outside the 20 km dispatch radius.
    const { doctorId } = await makeDispatchedDoctor({
      onDuty: true,
      clinicCoords: { latitude: "14.1672", longitude: "76.3842" },
    });

    const offers = await findNearbyOnDutyDoctors(PATIENT_LAT, PATIENT_LNG, RADIUS_KM);
    assert.equal(offers.some((d) => d.doctorId === doctorId), false);
  });
});

test("an on-duty doctor with no clinic coordinates is dispatched on their own GPS", async () => {
  await withCleanFixtures(async () => {
    const { doctorId } = await makeDispatchedDoctor({
      onDuty: true,
      clinicCoords: null,
      doctorCoords: { latitude: "12.9800", longitude: "77.6000" },
    });

    const offers = await findNearbyOnDutyDoctors(PATIENT_LAT, PATIENT_LNG, RADIUS_KM);
    const entry = offers.find((d) => d.doctorId === doctorId);
    assert.ok(entry, "the doctor-GPS fallback must still offer the doctor");
    assert.equal(entry.clinicId, null, "a mobile entry carries no clinic");
    assert.ok(entry.distanceKm >= 0, "the entry carries the computed distance");
  });
});
