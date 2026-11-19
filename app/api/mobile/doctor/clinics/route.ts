import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorClinics, clinicDoctors, appointments } from "@/lib/db/schema";
import { apiOk, requireDoctorActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/clinics
 * Returns list of clinics associated with the authenticated doctor,
 * along with today's appointment and queue statistics per clinic.
 */
export async function GET() {
  const doctor = await requireDoctorActor();
  if (doctor instanceof Response) return doctor;

  // 1. Find all clinic IDs where doctor is primary owner or affiliated doctor
  const ownedClinics = await db
    .select({
      id: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
      phone: doctorClinics.phone,
      consultationFee: doctorClinics.consultationFee,
      latitude: doctorClinics.latitude,
      longitude: doctorClinics.longitude,
      clinicLogo: doctorClinics.clinicLogo,
      isActive: doctorClinics.isActive,
      isPrimary: sql<boolean>`true`.as("is_primary"),
    })
    .from(doctorClinics)
    .where(
      and(
        eq(doctorClinics.doctorId, doctor.id),
        eq(doctorClinics.isActive, true)
      )
    );

  const affiliatedClinics = await db
    .select({
      id: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
      phone: doctorClinics.phone,
      consultationFee: doctorClinics.consultationFee,
      latitude: doctorClinics.latitude,
      longitude: doctorClinics.longitude,
      clinicLogo: doctorClinics.clinicLogo,
      isActive: doctorClinics.isActive,
      isPrimary: sql<boolean>`false`.as("is_primary"),
    })
    .from(clinicDoctors)
    .innerJoin(doctorClinics, eq(clinicDoctors.clinicId, doctorClinics.id))
    .where(
      and(
        eq(clinicDoctors.doctorId, doctor.id),
        eq(clinicDoctors.isActive, true),
        eq(doctorClinics.isActive, true)
      )
    );

  // Combine and deduplicate
  const clinicMap = new Map<number, (typeof ownedClinics)[number]>();
  for (const c of ownedClinics) {
    clinicMap.set(c.id, c);
  }
  for (const c of affiliatedClinics) {
    if (!clinicMap.has(c.id)) {
      clinicMap.set(c.id, c);
    }
  }

  const clinics = Array.from(clinicMap.values());
  if (clinics.length === 0) {
    return apiOk([]);
  }

  const clinicIds = clinics.map((c) => c.id);
  const today = new Date().toISOString().slice(0, 10);

  // 2. Fetch today's appointment and queue counts per clinic for this doctor
  const todayAppts = await db
    .select({
      clinicId: appointments.clinicId,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctor.id),
        eq(appointments.date, today as never),
        inArray(appointments.clinicId, clinicIds)
      )
    );

  const todayCountsByClinic = new Map<number, { appointments: number; queue: number }>();
  for (const cId of clinicIds) {
    todayCountsByClinic.set(cId, { appointments: 0, queue: 0 });
  }

  for (const appt of todayAppts) {
    if (appt.clinicId && todayCountsByClinic.has(appt.clinicId)) {
      const counts = todayCountsByClinic.get(appt.clinicId)!;
      if (appt.status !== "cancelled") {
        counts.appointments += 1;
      }
      if (appt.status === "confirmed" || appt.status === "checked_in") {
        counts.queue += 1;
      }
    }
  }

  const payload = clinics.map((c) => {
    const counts = todayCountsByClinic.get(c.id) ?? { appointments: 0, queue: 0 };
    return {
      id: c.id,
      clinicName: c.clinicName,
      address: c.address,
      phone: c.phone,
      consultationFee: c.consultationFee,
      latitude: c.latitude ? Number(c.latitude) : null,
      longitude: c.longitude ? Number(c.longitude) : null,
      clinicLogo: c.clinicLogo,
      isPrimary: c.isPrimary,
      todayAppointments: counts.appointments,
      activeQueue: counts.queue,
    };
  });

  return apiOk(payload);
}
