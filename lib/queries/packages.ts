/**
 * Practice plan reads — joins the pure entitlement rules in
 * lib/packages/entitlements.ts to the doctor row that carries the plan.
 *
 * `users.package_id` is the ONLY place a plan is stored; it is written by
 * payment fulfillment (lib/packages/fulfillment.ts). NULL = trial/legacy =
 * full access. Seats are counted from `users.doctor_id`, which is how staff
 * rows link to their practice owner (app/doctor/staff/actions.ts).
 */

import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { packagePayments, users } from "@/lib/db/schema";
import {
  resolveEntitlements,
  type Entitlements,
} from "@/lib/packages/entitlements";
import { isTrialExpired } from "@/lib/auth/trial";

/** Plan id of the practice owner (NULL while they are on trial). */
async function getPracticePackageId(doctorId: number): Promise<string | null> {
  const [row] = await db
    .select({ packageId: users.packageId })
    .from(users)
    .where(eq(users.id, doctorId))
    .limit(1);
  return row?.packageId ?? null;
}

/** Staff accounts already linked to the practice — the seat count. */
export async function countPracticeStaff(doctorId: number): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(users)
    .where(
      and(
        inArray(users.role, ["receptionist", "manager"]),
        or(eq(users.doctorId, doctorId), eq(users.referenceRoleId, doctorId))
      )
    );
  return Number(row?.n ?? 0);
}

/**
 * Entitlements of the PRACTICE — a plan belongs to the practice, not to the
 * person acting, so it resolves from the anchor doctor's row. For a doctor
 * owner that row is their own; for a staff caller it is their practice owner,
 * which is exactly whose plan limits what the practice may do.
 */
export async function getPracticeEntitlements(doctorId: number): Promise<Entitlements> {
  return resolveEntitlements({ role: "doctor", packageId: await getPracticePackageId(doctorId) });
}

type PracticePlanSummary = {
  entitlements: Entitlements;
  /** Practice owner's access expiry — the same value the layout guard reads. */
  accessUntil: Date | null;
  accessExpired: boolean;
  staffSeatsUsed: number;
  payments: {
    id: number;
    packageName: string;
    period: string;
    amount: number;
    status: string;
    accessUntil: Date | null;
    createdAt: Date | null;
  }[];
};

/** Everything the doctor settings "Plan" card renders. */
export async function getPracticePlanSummary(
  viewer: { id: number; role: string },
  doctorId: number
): Promise<PracticePlanSummary> {
  const [planRow, staffCount, payments] = await Promise.all([
    db
      .select({ packageId: users.packageId, trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(eq(users.id, doctorId))
      .limit(1)
      .then((rows) => rows[0]),
    countPracticeStaff(doctorId),
    db
      .select({
        id: packagePayments.id,
        packageName: packagePayments.packageName,
        period: packagePayments.period,
        amount: packagePayments.amount,
        status: packagePayments.status,
        accessUntil: packagePayments.accessUntil,
        createdAt: packagePayments.createdAt,
      })
      .from(packagePayments)
      .where(eq(packagePayments.userId, viewer.role === "doctor" ? viewer.id : doctorId))
      .orderBy(desc(packagePayments.createdAt))
      .limit(10),
  ]);

  const owner = { role: "doctor", packageId: planRow?.packageId ?? null };
  const accessUntil = planRow?.trialEndsAt ?? null;
  return {
    entitlements: resolveEntitlements(owner),
    accessUntil,
    accessExpired: isTrialExpired({ role: "doctor", trialEndsAt: accessUntil }),
    staffSeatsUsed: staffCount,
    payments,
  };
}
