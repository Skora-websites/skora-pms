import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorClinics, doctorSchedules } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, anchorDoctorId, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/schedule/manage — fetches the doctor's clinics and
 * weekly recurring slot configuration.
 */
export async function GET() {
  const user = await requireDoctorModule("schedule");
  if (user instanceof Response) return user;

  const doctorId = anchorDoctorId(user);

  const clinics = await db
    .select({
      id: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
      phone: doctorClinics.phone,
    })
    .from(doctorClinics)
    .where(eq(doctorClinics.doctorId, doctorId));

  const clinicIds = clinics.map((c) => c.id);
  const schedules = clinicIds.length > 0
    ? await db
        .select({
          id: doctorSchedules.id,
          doctorClinicId: doctorSchedules.doctorClinicId,
          dayOfWeek: doctorSchedules.dayOfWeek,
          startTime: doctorSchedules.startTime,
          endTime: doctorSchedules.endTime,
          slotDuration: doctorSchedules.slotDuration,
          gapDuration: doctorSchedules.gapDuration,
        })
        .from(doctorSchedules)
        .where(eq(doctorSchedules.doctorId, doctorId))
    : [];

  return apiOk({
    clinics,
    schedules,
  });
}

/**
 * POST /api/mobile/doctor/schedule/manage — update slot timing for a clinic day.
 */
export async function POST(request: Request) {
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  const user = await requireDoctorModule("schedule");
  if (user instanceof Response) return user;

  const doctorId = anchorDoctorId(user);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input: JSON body required.", 400);
  }

  const raw = (body ?? {}) as {
    scheduleId?: number;
    startTime?: string;
    endTime?: string;
  };

  const scheduleId = Number(raw.scheduleId);
  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    return apiError("Valid scheduleId is required.", 400);
  }

  const startTime = String(raw.startTime ?? "").trim();
  const endTime = String(raw.endTime ?? "").trim();

  await db
    .update(doctorSchedules)
    .set({
      startTime: startTime || null,
      endTime: endTime || null,
      updatedAt: new Date(),
    })
    .where(and(eq(doctorSchedules.id, scheduleId), eq(doctorSchedules.doctorId, doctorId)));

  return apiOk({ success: true, scheduleId, startTime, endTime });
}
