import { and, desc, eq, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";

/**
 * Booking duplicates finder.
 *
 * Detects an existing non-cancelled appointment for the SAME patient on the
 * SAME date + time — regardless of which doctor it was booked with. The
 * patient identity is matched by (in order of reliability):
 *   1. registered patient id
 *   2. walk-in patient name (case-insensitive)
 *   3. mobile number
 *
 * The exact time-slot conflict (same doctor + date + time, any patient) is
 * checked separately by the booking actions; this catches the duplicate
 * case: the same patient double-booked / double-submitted.
 */
export type DuplicateBookingHit = {
  id: number;
  date: string;
  time: string;
  status: string;
  caseType: string;
  doctorId: number;
  patientId: number | null;
  patientString: string | null;
  mobileNumber: string | null;
};

export async function findDuplicateBooking(opts: {
  patientId?: number | null;
  patientString?: string | null;
  mobileNumber?: string | null;
  date: string;
  time: string;
  /** Appointment to ignore (edit flow — the row being updated itself). */
  excludeId?: number | null;
}): Promise<DuplicateBookingHit | null> {
  const identities: SQL[] = [];
  if (opts.patientId && Number.isInteger(opts.patientId)) {
    identities.push(eq(appointments.patientId, opts.patientId));
  }
  if (opts.patientString) {
    identities.push(
      sql`lower(${appointments.patientString}) = ${opts.patientString.trim().toLowerCase()}`
    );
  }
  if (opts.mobileNumber) {
    identities.push(eq(appointments.mobileNumber, opts.mobileNumber.trim()));
  }
  // No usable identity (e.g. anonymous walk-in with no name) — nothing to match.
  if (identities.length === 0) return null;

  const conds: SQL[] = [
    eq(appointments.date, opts.date as never),
    eq(appointments.time, opts.time),
    ne(appointments.status, "cancelled" as never),
    or(...identities)!,
  ];
  if (opts.excludeId && Number.isInteger(opts.excludeId)) {
    conds.push(ne(appointments.id, opts.excludeId));
  }

  const [row] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      caseType: appointments.caseType,
      doctorId: appointments.doctorId,
      patientId: appointments.patientId,
      patientString: appointments.patientString,
      mobileNumber: appointments.mobileNumber,
    })
    .from(appointments)
    .where(and(...conds))
    .orderBy(desc(appointments.createdAt))
    .limit(1);

  return row ?? null;
}

/** User-facing error message for a duplicate booking hit. */
export function duplicateBookingError(hit: DuplicateBookingHit): string {
  return `Duplicate booking: this patient already has an appointment on ${hit.date} at ${hit.time} (appointment #${hit.id}). Please choose a different time or check the existing booking.`;
}
