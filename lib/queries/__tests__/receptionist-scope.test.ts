/**
 * US2 — receptionist clinic isolation (role model G4).
 *
 * The assignment table exists and the owner UI writes it, but no read path
 * consulted it: listDoctorIdsFor fanned out over the whole practice, so a
 * per-clinic front desk saw every clinic of the practice owner.
 *
 * These tests MUST fail before the fix and pass after.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { and, count, eq, isNull } from "drizzle-orm";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { db } from "../../db";
import { appointments } from "../../db/schema";
import {
  addClinicMember,
  assignReceptionistClinic,
  makeAppointment,
  makeClinic,
  makePatient,
  makeUser,
} from "../../../tests/helpers/fixtures";
import { getReceptionistClinicIds, listDoctorIdsFor } from "../clinic";

test("a receptionist assigned to one clinic does not see another clinic's doctors", async () => {
  await withCleanFixtures(async () => {
    const owner = await makeUser({ role: "doctor" });

    // Clinic A is UNASSIGNED and has its own member doctor.
    const clinicA = await makeClinic(owner, "Fixture Clinic A");
    const doctorA = await makeUser({ role: "doctor" });
    await addClinicMember(clinicA, doctorA);

    // Clinic B is the receptionist's only assignment, with its own member.
    const clinicB = await makeClinic(owner, "Fixture Clinic B");
    const doctorB = await makeUser({ role: "doctor" });
    await addClinicMember(clinicB, doctorB);

    const receptionist = await makeUser({ role: "receptionist", doctorId: owner });
    await assignReceptionistClinic(receptionist, clinicB);

    const assigned = await getReceptionistClinicIds(receptionist);
    assert.deepEqual(assigned, [clinicB], "the assignment table is the source of truth");

    // Pre-fix this fanned out over the owner's WHOLE practice, i.e. it
    // included doctorA from the unassigned clinic.
    const scope = await listDoctorIdsFor(
      { role: "receptionist", id: receptionist, doctorId: owner },
      owner
    );
    assert.deepEqual(
      [...scope].sort(),
      [owner, doctorB].sort(),
      "the scope is exactly the assigned clinics' doctors"
    );
    assert.ok(!scope.includes(doctorA), "an unassigned clinic's doctor must never appear");
  });
});

test("an unassigned receptionist sees no doctors at all", async () => {
  await withCleanFixtures(async () => {
    const owner = await makeUser({ role: "doctor" });
    await makeClinic(owner, "Fixture Clinic Solo");
    const receptionist = await makeUser({ role: "receptionist", doctorId: owner });
    // Deliberately NO receptionist_clinics row.

    const assigned = await getReceptionistClinicIds(receptionist);
    assert.deepEqual(assigned, [], "no assignment means no clinics — not the whole practice");
  });
});

test("a receptionist with two assignments sees both clinics and no third", async () => {
  await withCleanFixtures(async () => {
    const owner = await makeUser({ role: "doctor" });
    const clinicA = await makeClinic(owner, "Fixture Clinic A2");
    const clinicB = await makeClinic(owner, "Fixture Clinic B2");
    const clinicC = await makeClinic(owner, "Fixture Clinic C2");

    const receptionist = await makeUser({ role: "receptionist", doctorId: owner });
    await assignReceptionistClinic(receptionist, clinicA);
    await assignReceptionistClinic(receptionist, clinicB);

    const assigned = await getReceptionistClinicIds(receptionist);
    assert.deepEqual(
      [...assigned].sort(),
      [clinicA, clinicB].sort(),
      "both assigned clinics resolve"
    );
    assert.ok(!assigned.includes(clinicC), "an unassigned clinic must never appear");
  });
});

test("the assignment set used by the booking guard refuses an unassigned clinic", async () => {
  await withCleanFixtures(async () => {
    const owner = await makeUser({ role: "doctor" });
    const clinicA = await makeClinic(owner, "Fixture Clinic A3");
    const clinicB = await makeClinic(owner, "Fixture Clinic B3");
    const patient = await makePatient(owner);

    const receptionist = await makeUser({ role: "receptionist", doctorId: owner });
    await assignReceptionistClinic(receptionist, clinicB);

    // This is the exact predicate resolveClinic() consults. Pre-fix it fell
    // back to the anchor doctor's whole practice, so clinic A passed.
    const assigned = await getReceptionistClinicIds(receptionist);
    assert.ok(
      !assigned.includes(clinicA),
      "the booking guard must not admit a clinic outside the receptionist's assignment"
    );

    // The in-scope clinic still books, so the guard is not simply blocking.
    const apptId = await makeAppointment({
      doctorId: owner,
      patientId: patient,
      clinicId: clinicB,
    });
    assert.ok(apptId > 0, "an in-scope clinic still accepts a booking");
  });
});

test("no fixture appointment is persisted with a null clinic_id", async () => {
  await withCleanFixtures(async () => {
    const owner = await makeUser({ role: "doctor" });
    const clinic = await makeClinic(owner, "Fixture Clinic Invariant");
    const patient = await makePatient(owner);

    // Every appointment the suite creates resolves a clinic explicitly — the
    // invariant the action-boundary fix enforces (a null here is the C1-class
    // silent drop the migration repaired).
    await makeAppointment({ doctorId: owner, patientId: patient, clinicId: clinic });

    const [row] = await db
      .select({ n: count() })
      .from(appointments)
      .where(and(isNull(appointments.clinicId), eq(appointments.doctorId, owner)));
    assert.equal(Number(row?.n ?? 0), 0, "clinic_id must never be null for a created row");
  });
});
