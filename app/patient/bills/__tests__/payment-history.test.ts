/**
 * `getPatientPaymentHistory` — the patient-facing payment timeline
 * (audit roadmap P3, "payment history" half).
 *
 * The REAL query module is driven directly (no session stub needed — the
 * query takes patientId). What is under test:
 *
 *  1. scoping: a patient sees only payment events on THEIR bills (the
 *     transaction's userId is the owning doctor, so the join must go through
 *     billings.patientId);
 *  2. visibility filter: unapproved bookkeeping rows and soft-deleted bills
 *     are excluded;
 *  3. expense-side ledger rows (type 2) never leak into the patient view.
 *
 * Run: npm test (needs the live MySQL — same as the other fixture suites).
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { billings, billingTypes, transactions } from "@/lib/db/schema";
import { withCleanFixtures } from "../../../../tests/helpers/db";
import { makeUser } from "../../../../tests/helpers/fixtures";
import { getPatientPaymentHistory } from "@/lib/queries/patient";

let billTypeSeq = 0;

/** A minimal billing type owned by `doctorId` (billingTypeId is NOT NULL). */
async function makeBillingType(doctorId: number): Promise<number> {
  const [r] = await db
    .insert(billingTypes)
    .values({ doctorId, name: `Fixture type ${process.pid}-${++billTypeSeq}` })
    .$returningId();
  return Number(r.id);
}

interface BillOpts {
  doctorId: number;
  patientId: number;
  billNumber: string;
  deleted?: boolean;
}

async function makeBill(opts: BillOpts): Promise<number> {
  const billingTypeId = await makeBillingType(opts.doctorId);
  const [r] = await db
    .insert(billings)
    .values({
      billNumber: opts.billNumber,
      patientId: opts.patientId,
      doctorId: opts.doctorId,
      billingTypeId,
      totalAmount: "1000",
      receivedAmount: "500",
      pendingAmount: "500",
      status: "partial" as never,
      billDate: new Date().toLocaleDateString("en-CA"),
      deletedAt: opts.deleted ? new Date() : null,
    })
    .$returningId();
  return Number(r.id);
}

interface TxOpts {
  doctorId: number;
  billingId: number;
  amount: string;
  status?: "approved" | "unapproved" | "pending";
  type?: number;
}

async function makePayment(opts: TxOpts): Promise<number> {
  const [r] = await db
    .insert(transactions)
    .values({
      userId: opts.doctorId,
      type: (opts.type ?? 1) as never,
      billingId: opts.billingId,
      amount: opts.amount,
      date: new Date().toLocaleDateString("en-CA"),
      status: opts.status ?? "approved",
      paymentMethod: "upi",
      description: `Bill payment ${opts.billingId}`,
      createdBy: "System",
    })
    .$returningId();
  return Number(r.id);
}

test("payment history is scoped to the patient's bills and filters internal rows", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    const patientA = await makeUser({ role: "patient" });
    const patientB = await makeUser({ role: "patient" });

    // Patient A: one live bill with an approved payment.
    const billA = await makeBill({ doctorId, patientId: patientA, billNumber: "PAY-A-1" });
    const visiblePaymentId = await makePayment({ doctorId, billingId: billA, amount: "500" });

    // Patient A: an unapproved bookkeeping row on the same bill — internal.
    await makePayment({ doctorId, billingId: billA, amount: "75", status: "unapproved" });

    // Patient A: an EXPENSE-side ledger row (type 2) on the same bill — must
    // never surface as a "payment".
    await makePayment({ doctorId, billingId: billA, amount: "30", type: 2 });

    // Patient A: a soft-deleted bill with a payment — the bill is gone, the
    // payment must not outlive it in the patient view.
    const deletedBill = await makeBill({
      doctorId,
      patientId: patientA,
      billNumber: "PAY-A-DEL",
      deleted: true,
    });
    await makePayment({ doctorId, billingId: deletedBill, amount: "200" });

    // Patient B: their own payment — must not appear in A's history.
    const billB = await makeBill({ doctorId, patientId: patientB, billNumber: "PAY-B-1" });
    await makePayment({ doctorId, billingId: billB, amount: "900" });

    const history = await getPatientPaymentHistory(patientA);
    assert.equal(history.length, 1);
    assert.equal(history[0].id, visiblePaymentId);
    assert.equal(history[0].billNumber, "PAY-A-1");
    assert.equal(history[0].paymentMethod, "upi");
  });
});
