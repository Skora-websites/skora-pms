import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  appointments,
  billingTypes,
  incomeTypes,
  expenseTypes,
  supportTickets,
} from "@/lib/db/schema";

/**
 * Verify that a patient belongs to the given doctor.
 *
 * Patients are linked to their doctor via `reference_role_id` (legacy
 * Laravel convention) — `doctor_id` is NULL for patient rows. Check both
 * so both data shapes work.
 */
export async function ensurePatientOfDoctor(
  doctorId: number,
  patientId: number
): Promise<boolean> {
  const [patient] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, patientId),
        eq(users.referenceRoleId, doctorId),
        eq(users.role, "patient")
      )
    );
  return !!patient;
}

/**
 * Verify that an appointment belongs to the given doctor.
 */
export async function ensureAppointmentOfDoctor(
  appointmentId: number,
  doctorId: number
): Promise<boolean> {
  const [appt] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(eq(appointments.id, appointmentId), eq(appointments.doctorId, doctorId))
    );
  return !!appt;
}

/**
 * Verify that a billing type belongs to the given doctor.
 */
export async function ensureBillingTypeOfDoctor(
  billingTypeId: number,
  doctorId: number
): Promise<boolean> {
  const [bt] = await db
    .select({ id: billingTypes.id })
    .from(billingTypes)
    .where(
      and(eq(billingTypes.id, billingTypeId), eq(billingTypes.doctorId, doctorId))
    );
  return !!bt;
}

/**
 * Verify that an income type belongs to the given user.
 */
export async function ensureIncomeTypeOfUser(
  typeId: number,
  userId: number
): Promise<boolean> {
  const [row] = await db
    .select({ id: incomeTypes.id })
    .from(incomeTypes)
    .where(and(eq(incomeTypes.id, typeId), eq(incomeTypes.userId, userId)));
  return !!row;
}

/**
 * Verify that an expense type belongs to the given user.
 */
export async function ensureExpenseTypeOfUser(
  typeId: number,
  userId: number
): Promise<boolean> {
  const [row] = await db
    .select({ id: expenseTypes.id })
    .from(expenseTypes)
    .where(and(eq(expenseTypes.id, typeId), eq(expenseTypes.userId, userId)));
  return !!row;
}

/**
 * Verify that a support ticket belongs to the given user.
 */
export async function ensureTicketOwner(
  ticketId: number,
  userId: number
): Promise<boolean> {
  const [ticket] = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(
      and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, userId))
    );
  return !!ticket;
}