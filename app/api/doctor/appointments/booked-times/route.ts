import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/**
 * GET /api/doctor/appointments/booked-times?date=YYYY-MM-DD&clinic_id=N&exclude_id=N
 *
 * Mirrors legacy AppointmentController@getBookedTimes:
 *  - returns all non-cancelled appointment times for the doctor on the given date
 *  - returns active DoctorSchedule rows for the weekday (optionally filtered by clinic)
 *  - `exclude_id` lets the edit form ignore the appointment being edited
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date") ?? "";
  const clinicIdRaw = searchParams.get("clinic_id");
  const excludeIdRaw = searchParams.get("exclude_id");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
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

  const clinicConds = [eq(schema.doctorClinics.doctorId, doctorId), eq(schema.doctorClinics.isActive, true)];
  if (clinicId && Number.isInteger(clinicId)) {
    clinicConds.push(eq(schema.doctorClinics.id, clinicId));
  }
  const clinics = await db
    .select({ id: schema.doctorClinics.id })
    .from(schema.doctorClinics)
    .where(and(...clinicConds));

  let schedules: typeof schema.doctorSchedules.$inferSelect[] = [];
  if (clinics.length > 0) {
    schedules = await db
      .select()
      .from(schema.doctorSchedules)
      .where(
        and(
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
