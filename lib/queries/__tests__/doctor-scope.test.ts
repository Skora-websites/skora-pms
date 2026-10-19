/**
 * US1 — doctor data isolation.
 *
 * C1 (CRITICAL): getHomeVisitPatientDetail accepted a `doctorId` and ignored
 * it, so any doctor could read any patient's appointment history including
 * `note` (clinical free text). The peer test MUST fail before the fix.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { withCleanFixtures } from "../../../tests/helpers/db";
import {
  addClinicMember,
  makeAppointment,
  makeClinic,
  makePatient,
  makeUser,
} from "../../../tests/helpers/fixtures";
import { listDoctorIdsFor } from "../clinic";
import { getHomeVisitPatientDetail } from "../doctor";

test("a member doctor's scope excludes the practice owner and every peer", async () => {
  await withCleanFixtures(async () => {
    const owner = await makeUser({ role: "doctor", name: "Owner Doctor" });
    const member = await makeUser({ role: "doctor", name: "Member Doctor" });
    const clinicId = await makeClinic(owner);
    await addClinicMember(clinicId, member);
    const patientId = await makePatient(owner);

    // D4: a member doctor resolves to their own id only.
    const scope = await listDoctorIdsFor({ role: "doctor", id: member, doctorId: null }, member);
    assert.deepEqual(scope, [member], "a member doctor must resolve to their own id only");

    // The owner is a practice-wide viewer.
    const ownerScope = await listDoctorIdsFor(
      { role: "doctor", id: owner, doctorId: null },
      owner
    );
    assert.ok(
      ownerScope.includes(owner) && ownerScope.includes(member),
      "the practice owner sees the whole practice"
    );

    const apptId = await makeAppointment({ doctorId: owner, patientId, clinicId });
    assert.ok(apptId > 0);
  });
});

test("getHomeVisitPatientDetail leaks a peer's appointment rows for a shared patient", async () => {
  await withCleanFixtures(async () => {
    // Patient P is attached to doctor A (users.reference_role_id = A), which
    // is the predicate getHomeVisitPatientDetail uses to admit the caller.
    // Doctor B is an active member of the same clinic and also has an
    // appointment for P. The appointment query filters on patient_id ONLY, so
    // B's row — including its `note` — is returned to A's caller.
    const doctorA = await makeUser({ role: "doctor" });
    const doctorB = await makeUser({ role: "doctor" });
    const clinicId = await makeClinic(doctorA);
    await addClinicMember(clinicId, doctorB);
    const patient = await makePatient(doctorA);

    await makeAppointment({
      doctorId: doctorA,
      patientId: patient,
      clinicId,
      note: "A's own note",
    });
    await makeAppointment({
      doctorId: doctorB,
      patientId: patient,
      clinicId,
      note: "B's peer note that must not leak",
    });

    const result = await getHomeVisitPatientDetail([doctorA], patient);
    const notes = (result?.appointments ?? []).map((a) => a.note);
    assert.ok(
      !notes.includes("B's peer note that must not leak"),
      "the caller must not see a peer doctor's appointment note"
    );
    assert.deepEqual(
      notes,
      ["A's own note"],
      "only the acting doctor's own row may be returned"
    );
  });
});

test("getHomeVisitPatientDetail returns the caller's own patient rows", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    const clinicId = await makeClinic(doctorId);
    const patientId = await makePatient(doctorId);
    await makeAppointment({ doctorId, patientId, clinicId, note: "own note" });

    const own = await getHomeVisitPatientDetail([doctorId], patientId);
    assert.equal(own?.appointments.length, 1, "the acting doctor still sees their own rows");
  });
});
