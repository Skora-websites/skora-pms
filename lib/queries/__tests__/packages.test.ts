/**
 * Business-wide plan reads + the owner tier's anchor convention.
 *
 * A plan lives on a doctor row, so an owner's panel must resolve WHICH
 * practice's plan it shows: the practice anchor doctor — the same
 * `scope.doctorIds[0]` anchor requireWriteScope uses and the owner's
 * checkout credits. Seats, by contrast, are a property of the whole
 * business, and must count staff attached to ANY of the owner's doctors.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { db } from "../../db";
import { packagePayments, users } from "../../db/schema";
import {
  linkBusinessClinic,
  makeBusiness,
  makeClinic,
  makeUser,
} from "../../../tests/helpers/fixtures";
import {
  countPracticeStaff,
  getBusinessPlanSummary,
  getPracticePlanSummary,
} from "../packages";
import { seatLimitReached, seatLimitMessage } from "../../packages/entitlements";
import { eq } from "drizzle-orm";

/** Put a doctor on a package with a future expiry. */
async function putDoctorOnPlan(doctorId: number, packageId: string) {
  await db
    .update(users)
    .set({ packageId, trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    .where(eq(users.id, doctorId));
}

test("a business owner's seat count spans every doctor of the business, not just the anchor", async () => {
  await withCleanFixtures(async () => {
    const d1 = await makeUser({ role: "doctor" });
    const d2 = await makeUser({ role: "doctor" });
    await makeUser({ role: "receptionist", doctorId: d1 });
    await makeUser({ role: "receptionist", referenceRoleId: d1 });
    const d2Staff = await makeUser({ role: "receptionist", doctorId: d2 });

    assert.equal(await countPracticeStaff(d1), 2, "one practice's own seats");
    assert.equal(await countPracticeStaff(d2), 1, "the other practice's own seats");
    assert.equal(
      await countPracticeStaff([d1, d2]),
      3,
      "the business counts staff across both practices"
    );

    await putDoctorOnPlan(d1, "package-1");
    const owner = await makeUser({ role: "admin" });
    const summary = await getBusinessPlanSummary({ id: owner, role: "admin" }, [d1, d2]);
    assert.equal(summary.staffSeatsUsed, 3);
    assert.equal(summary.entitlements.packageId, "package-1", "the anchor doctor's plan");
    assert.equal(
      seatLimitReached(summary.entitlements, summary.staffSeatsUsed),
      true,
      "Package 1 seats 1, the business uses 3"
    );
    assert.match(seatLimitMessage(summary.entitlements), /includes 1 staff account and all are in use/);
    void d2Staff;
  });
});

test("the anchor practice's plan is what the owner sees — a peer doctor's plan does not override it", async () => {
  await withCleanFixtures(async () => {
    const anchor = await makeUser({ role: "doctor" }); // no plan: trial/legacy
    const peer = await makeUser({ role: "doctor" });
    await putDoctorOnPlan(peer, "package-3");
    await makeUser({ role: "receptionist", doctorId: peer });

    const owner = await makeUser({ role: "admin" });
    const summary = await getBusinessPlanSummary({ id: owner, role: "admin" }, [anchor, peer]);

    // The anchor's row carries the plan; a peer doctor's purchase must not
    // silently restrict or unlock the practice the owner is shown.
    assert.equal(summary.entitlements.packageId, null, "the anchor doctor is on trial");
    assert.equal(summary.entitlements.staffSeats, null, "trial is unrestricted");
    assert.equal(summary.staffSeatsUsed, 1, "seats still count the whole business");
    assert.equal(summary.accessExpired, false);
  });
});

test("business-wide seats are counted, but the plan summary never reads another practice's expiry", async () => {
  await withCleanFixtures(async () => {
    const d1 = await makeUser({ role: "doctor" });
    const d2 = await makeUser({ role: "doctor" });

    // d2's access has already ended.
    await db
      .update(users)
      .set({ packageId: "package-2", trialEndsAt: new Date(Date.now() - 60 * 1000) })
      .where(eq(users.id, d2));

    const business = await makeBusiness(d1, "Fixture Business For Plan");
    const clinic = await makeClinic(d1, "Fixture Clinic For Plan");
    await linkBusinessClinic(business, clinic);
    await makeUser({ role: "receptionist", doctorId: d1 });

    const owner = await makeUser({ role: "admin" });
    const summary = await getBusinessPlanSummary({ id: owner, role: "admin" }, [d1, d2]);

    // d2's expiry is d2's practice's access boundary, not the owner's anchor.
    assert.equal(summary.accessExpired, false, "the anchor doctor's access decides");
    assert.equal(summary.entitlements.staffSeats, null, "the anchor is on trial");
    assert.equal(summary.staffSeatsUsed, 1);
  });
});

test("a doctor's own panel still reads their practice, sealed to their own seats", async () => {
  await withCleanFixtures(async () => {
    const me = await makeUser({ role: "doctor" });
    const peer = await makeUser({ role: "doctor" });
    await makeUser({ role: "receptionist", doctorId: me });
    await makeUser({ role: "receptionist", doctorId: peer });
    await putDoctorOnPlan(me, "package-1");

    // A payment credited to this doctor.
    await db.insert(packagePayments).values({
      userId: me,
      packageId: "package-1",
      packageName: "Package 1",
      period: "monthly",
      amount: 79900,
      status: "paid",
      razorpayOrderId: `order_fixture_${me}`,
      accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const summary = await getPracticePlanSummary({ id: me, role: "doctor" }, me);
    assert.equal(summary.staffSeatsUsed, 1, "only the caller's own practice's staff — not the peer's");
    assert.equal(summary.entitlements.packageId, "package-1");
    assert.equal(
      seatLimitReached(summary.entitlements, summary.staffSeatsUsed),
      true,
      "Package 1 seats 1 and it is filled"
    );
    assert.equal(summary.payments.length, 1, "the doctor's own payment history");
    assert.equal(summary.accessExpired, false);
  });
});
