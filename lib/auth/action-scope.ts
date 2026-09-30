import "server-only";

/**
 * Unified write scope for shared clinic-ops server actions.
 *
 * The doctor dashboard's write actions (appointments, patients, billing,
 * ledger, test bookings, follow-ups) historically admitted only
 * doctor/receptionist sessions — admin-tier users were redirected away, which
 * kept the Business Owner panel read-only. This module generalizes the guard
 * so the SAME actions serve all four staff tiers with tier-appropriate
 * permission checks and data scoping, without duplicating business logic:
 *
 *   doctor        → strict single-doctor scope (own records only)
 *   receptionist  → practice-wide scope anchored on the practice owner
 *   admin (owner) → business-wide scope (all scoped clinics' doctors);
 *                   module permissions bypassed (requireAdminTier parity)
 *   manager       → business-wide scope, gated on the SAME action-level
 *                   permission names the doctor/receptionist roles use
 *                   (e.g. "billing-create", "appointments-edit")
 *
 * The anchor doctor id is where NEW records attach (patients'
 * reference_role_id, bills' doctor_id, transactions' user_id, …) so the
 * business's clinical/financial records stay owned by a real doctor account
 * and remain visible to that doctor's own dashboard.
 */

import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  billings,
  billingTypes,
  consultations,
  expenseTypes,
  followUpReminders,
  incomeTypes,
  tests,
  testBookings,
  transactions,
  users,
  vendors,
} from "@/lib/db/schema";
import { getCurrentUser, hasPermission, homePathForRole } from "./user";
import { resolvePracticeDoctorId } from "@/lib/queries/doctor";
import { getPracticeDoctorIds } from "@/lib/queries/clinic";
import { getBusinessScope } from "./scope";

export type ActionScope = {
  /** Acting user id — used for audit attribution. */
  callerId: number;
  callerRole: string;
  /**
   * Doctor id that NEW records anchor to (the practice owner for staff
   * tiers, the first scoped doctor for the admin tier, self for doctors).
   */
  anchorDoctorId: number;
  /** Every doctor id whose records this caller may read AND write. */
  doctorIds: number[];
  /**
   * Strict mode (doctor role): writes may only target the caller's own
   * records — a doctor must never retarget a booking to a peer.
   */
  strict: boolean;
};

/**
 * Guard for shared write actions. Returns null when the caller lacks the
 * permission (callers short-circuit with a user-facing error, matching the
 * requireDoctorPermission contract); redirects when unauthenticated or when
 * the role can't hold a dashboard at all.
 */
export async function requireWriteScope(permission: string): Promise<ActionScope | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "doctor" || user.role === "receptionist") {
    if (!(await hasPermission(user.id, permission))) return null;
    const anchor = resolvePracticeDoctorId(user);
    const doctorIds =
      user.role === "receptionist" ? await getPracticeDoctorIds(anchor) : [user.id];
    return {
      callerId: user.id,
      callerRole: user.role,
      anchorDoctorId: anchor,
      doctorIds,
      strict: user.role === "doctor",
    };
  }

  if (user.role === "admin" || user.role === "manager") {
    // Owners bypass module permission checks (requireAdminTier parity);
    // managers must hold the same action-level permission the staff roles use.
    if (user.role === "manager" && !(await hasPermission(user.id, permission))) return null;
    const scope = await getBusinessScope();
    if (scope.doctorIds.length === 0) return null;
    return {
      callerId: user.id,
      callerRole: user.role,
      anchorDoctorId: scope.doctorIds[0],
      doctorIds: scope.doctorIds,
      strict: false,
    };
  }

  redirect(homePathForRole(user.role));
}

/** True when the caller's panel lives under /admin (owner + manager tiers). */
export function isAdminTierRole(role: string): boolean {
  return role === "admin" || role === "manager";
}

// ── Scope-aware ownership checks ────────────────────────────────────────
// Drop-in replacements for lib/auth/ownership.ts's single-doctor checks:
// they accept every doctor in the caller's write scope instead of exactly one.

export async function ensureAppointmentInScope(appointmentId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), inArray(appointments.doctorId, scope.doctorIds)));
  return !!row;
}

export async function ensurePatientInScope(patientId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, patientId),
        eq(users.role, "patient"),
        inArray(users.referenceRoleId, scope.doctorIds)
      )
    );
  return !!row;
}

export async function ensureBillingTypeInScope(billingTypeId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: billingTypes.id })
    .from(billingTypes)
    .where(and(eq(billingTypes.id, billingTypeId), inArray(billingTypes.doctorId, scope.doctorIds)));
  return !!row;
}

export async function ensureIncomeTypeInScope(typeId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: incomeTypes.id })
    .from(incomeTypes)
    .where(and(eq(incomeTypes.id, typeId), inArray(incomeTypes.userId, scope.doctorIds)));
  return !!row;
}

export async function ensureExpenseTypeInScope(typeId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: expenseTypes.id })
    .from(expenseTypes)
    .where(and(eq(expenseTypes.id, typeId), inArray(expenseTypes.userId, scope.doctorIds)));
  return !!row;
}

export async function ensureVendorInScope(vendorId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), inArray(vendors.doctorId, scope.doctorIds)));
  return !!row;
}

export async function ensureTestInScope(testId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: tests.id })
    .from(tests)
    .where(and(eq(tests.id, testId), inArray(tests.doctorId, scope.doctorIds)));
  return !!row;
}

export async function ensureTestBookingInScope(bookingId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: testBookings.id })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), inArray(testBookings.doctorId, scope.doctorIds)));
  return !!row;
}

export async function ensureBillInScope(billId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: billings.id })
    .from(billings)
    .where(and(eq(billings.id, billId), inArray(billings.doctorId, scope.doctorIds)));
  return !!row;
}

export async function ensureTransactionInScope(txId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.id, txId), inArray(transactions.userId, scope.doctorIds)));
  return !!row;
}

export async function ensureConsultationInScope(consultationId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(and(eq(consultations.id, consultationId), inArray(consultations.doctorId, scope.doctorIds)));
  return !!row;
}

export async function ensureFollowUpReminderInScope(reminderId: number, scope: ActionScope): Promise<boolean> {
  const [row] = await db
    .select({ id: followUpReminders.id })
    .from(followUpReminders)
    .where(and(eq(followUpReminders.id, reminderId), inArray(followUpReminders.doctorId, scope.doctorIds)));
  return !!row;
}
