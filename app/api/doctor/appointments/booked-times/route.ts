import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/user";
import { isPracticeDoctor } from "@/lib/queries/clinic";
import { getBusinessScope } from "@/lib/auth/scope";

export const runtime = "nodejs";

/**
 * GET /api/doctor/appointments/booked-times?date=YYYY-MM-DD&clinic_id=N&doctor_id=N&exclude_id=N
 *
 * Mirrors legacy AppointmentController@getBookedTimes:
 *  - returns all non-cancelled appointment times for the doctor on the given date
 *  - returns active DoctorSchedule rows for the weekday (optionally filtered by clinic)
 *  - `doctor_id` lets staff (receptionist / admin-tier) query an in-scope
 *    doctor's slots (validated against the caller's scope — no cross-scope probing)
 *  - `exclude_id` lets the edit form ignore the appointment being edited
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdminTier = user.role === "admin" || user.role === "manager";
  if (!["doctor", "receptionist"].includes(user.role) && !isAdminTier) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Admin tier: resolve the practice/business scope (in-scope doctor ids);
  // doctor/receptionist keep the practice-anchor semantics.
  const scopeDoctorIds = isAdminTier ? (await getBusinessScope()).doctorIds : null;
  const resolvedDoctorId =
    user.role === "receptionist" ? (user.doctorId ?? user.id) : isAdminTier ? (scopeDoctorIds?.[0] ?? user.id) : user.id;

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date") ?? "";
  const clinicIdRaw = searchParams.get("clinic_id");
  const doctorIdRaw = searchParams.get("doctor_id");
  const excludeIdRaw = searchParams.get("exclude_id");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  let doctorId = resolvedDoctorId;
  if (doctorIdRaw) {
    const requested = Number(doctorIdRaw);
    if (!Number.isInteger(requested) || requested <= 0) {
      return NextResponse.json({ error: "Invalid doctor_id" }, { status: 400 });
    }
    const inScope = isAdminTier
      ? (scopeDoctorIds?.includes(requested) ?? false)
      : requested === resolvedDoctorId || (await isPracticeDoctor(resolvedDoctorId, requested));
    if (!inScope) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    doctorId = requested;
  }

  const clinicId = clinicIdRaw ? Number(clinicIdRaw) : null;
  const excludeId = excludeIdRaw ? Number(excludeIdRaw) : null;

  // Booked times — exclude cancelled appointments, and optionally the row being edited.
  const bookedConds = [eq(schema.appointments.doctorId, doctorId), eq(schema.appointments.date, date)];
  bookedConds.push(ne(schema.appointments.status, "cancelled"));
  if (excludeId && Number.isInteger(excludeId)) {
    bookedConds.push(ne(schema.appointments.id, excludeId));
  }
  const bookedRows = await db
    .select({ time: schema.appointments.time })
    .from(schema.appointments)
    .where(and(...bookedConds));
  const bookedTimes = bookedRows.map((r) => r.time);

  // Active schedules for the weekday (legacy uses the lowercase weekday name).
  const dayOfWeek = new Date(`${date}T00:00:00`)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  // Clinics the doctor practices at — owned or joined (per-doctor schedules
  // live on shared clinics, so membership must count here).
  const clinicIdConds = [
    or(
      eq(schema.doctorClinics.doctorId, doctorId),
      inArray(
        schema.doctorClinics.id,
        db
          .select({ id: schema.clinicDoctors.clinicId })
          .from(schema.clinicDoctors)
          .where(
            and(eq(schema.clinicDoctors.doctorId, doctorId), eq(schema.clinicDoctors.isActive, true))
          )
      )
    ),
    eq(schema.doctorClinics.isActive, true),
  ];
  if (clinicId && Number.isInteger(clinicId)) {
    clinicIdConds.push(eq(schema.doctorClinics.id, clinicId));
  }
  const clinics = await db
    .select({ id: schema.doctorClinics.id })
    .from(schema.doctorClinics)
    .where(and(...clinicIdConds));

  let schedules: (typeof schema.doctorSchedules.$inferSelect)[] = [];
  if (clinics.length > 0) {
    schedules = await db
      .select()
      .from(schema.doctorSchedules)
      .where(
        and(
          eq(schema.doctorSchedules.doctorId, doctorId),
          eq(schema.doctorSchedules.dayOfWeek, dayOfWeek as never),
          eq(schema.doctorSchedules.isActive, true),
          inArray(
            schema.doctorSchedules.doctorClinicId,
            clinics.map((c) => c.id)
          )
        )
      );
  }

  return NextResponse.json({ booked_times: bookedTimes, schedules });
}
