import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, appointments } from "@/lib/db/schema";
import {
  apiError,
  apiOk,
  requireDoctorModule,
} from "@/app/api/mobile/_helpers";
import type { VitalReadingPayload } from "@/app/api/mobile/patient/vitals/route";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/patients/[id]/vitals
 * Returns the specified patient's health vitals timeline for clinical consultation.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const doctor = await requireDoctorModule("patients");
  if (doctor instanceof Response) return doctor;

  const { id } = await params;
  const patientId = Number(id);
  if (!Number.isInteger(patientId) || patientId <= 0) {
    return apiError("Invalid patient id.", 400);
  }

  const [patient] = await db
    .select({
      id: users.id,
      name: users.name,
      notificationPreferences: users.notificationPreferences,
    })
    .from(users)
    .where(eq(users.id, patientId))
    .limit(1);

  if (!patient) {
    return apiError("Patient not found.", 404);
  }

  const prefs = (patient.notificationPreferences ?? {}) as Record<string, unknown>;
  const rawVitals = Array.isArray(prefs.healthVitals) ? prefs.healthVitals : [];

  const vitals: VitalReadingPayload[] = rawVitals
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      id: String(v.id || Math.random().toString(36).substring(2, 9)),
      systolic: typeof v.systolic === "number" ? v.systolic : undefined,
      diastolic: typeof v.diastolic === "number" ? v.diastolic : undefined,
      pulse: typeof v.pulse === "number" ? v.pulse : undefined,
      bloodSugar: typeof v.bloodSugar === "number" ? v.bloodSugar : undefined,
      sugarType: (["fasting", "post_meal", "random"].includes(String(v.sugarType))
        ? v.sugarType
        : undefined) as "fasting" | "post_meal" | "random" | undefined,
      spo2: typeof v.spo2 === "number" ? v.spo2 : undefined,
      weight: typeof v.weight === "number" ? v.weight : undefined,
      temperature: typeof v.temperature === "number" ? v.temperature : undefined,
      recordedAt: String(v.recordedAt || new Date().toISOString()),
      notes: v.notes ? String(v.notes).trim() : undefined,
    }))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  // Also query recent clinic appointments for recorded BP/weight
  const recentApptVitals = await db
    .select({
      id: appointments.id,
      bp: appointments.bp,
      weight: appointments.weight,
      date: appointments.date,
      time: appointments.time,
      remarks: appointments.remarks,
    })
    .from(appointments)
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.date))
    .limit(5);

  return apiOk({
    patientId,
    patientName: patient.name,
    vitals,
    latest: vitals[0] ?? null,
    clinicAppointments: recentApptVitals,
  });
}
