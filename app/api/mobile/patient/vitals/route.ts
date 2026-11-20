import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, appointments, patientVitals } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export interface VitalReadingPayload {
  id: string;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  bloodSugar?: number;
  sugarType?: "fasting" | "post_meal" | "random";
  spo2?: number;
  weight?: number;
  temperature?: number;
  recordedAt: string; // ISO 8601
  notes?: string;
}

/**
 * GET /api/mobile/patient/vitals
 * Returns the authenticated patient's chronological health vitals readings.
 */
export async function GET() {
  const actor = await requirePatientActor();
  if (actor instanceof Response) return actor;

  let vitals: VitalReadingPayload[] = [];

  // 1. Try relational patient_vitals table
  try {
    const tableRows = await db
      .select()
      .from(patientVitals)
      .where(eq(patientVitals.patientId, actor.id))
      .orderBy(desc(patientVitals.recordedAt))
      .limit(100);

    if (tableRows && tableRows.length > 0) {
      vitals = tableRows.map((r) => ({
        id: String(r.id),
        systolic: r.systolicBp ?? undefined,
        diastolic: r.diastolicBp ?? undefined,
        pulse: r.heartRate ?? undefined,
        bloodSugar: r.bloodGlucose ? Number(r.bloodGlucose) : undefined,
        sugarType: (r.glucoseContext as any) || undefined,
        spo2: r.spo2 ?? undefined,
        weight: r.weight ? Number(r.weight) : undefined,
        temperature: r.temperature ? Number(r.temperature) : undefined,
        recordedAt: r.recordedAt ? r.recordedAt.toISOString() : new Date().toISOString(),
        notes: r.notes ?? undefined,
      }));
    }
  } catch {
    // Fallback if table not yet migrated
  }

  // 2. Fallback to notificationPreferences if table had 0 rows
  if (vitals.length === 0) {
    const [row] = await db
      .select({
        notificationPreferences: users.notificationPreferences,
      })
      .from(users)
      .where(eq(users.id, actor.id))
      .limit(1);

    if (!row) {
      return apiError("Patient record not found.", 404);
    }

    const prefs = (row.notificationPreferences ?? {}) as Record<string, unknown>;
    const rawVitals = Array.isArray(prefs.healthVitals) ? prefs.healthVitals : [];

    vitals = rawVitals
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
  }

  // Also fetch most recent appointment with BP or Weight to ensure clinical parity
  const [latestApptWithVitals] = await db
    .select({
      bp: appointments.bp,
      weight: appointments.weight,
      date: appointments.date,
      time: appointments.time,
    })
    .from(appointments)
    .where(eq(appointments.patientId, actor.id))
    .orderBy(desc(appointments.date), desc(appointments.createdAt))
    .limit(1);

  const latest = vitals[0] ?? null;

  return apiOk({
    vitals,
    latest,
    clinicalAppointmentVitals: latestApptWithVitals
      ? {
          bp: latestApptWithVitals.bp,
          weight: latestApptWithVitals.weight ? Number(latestApptWithVitals.weight) : undefined,
          date: latestApptWithVitals.date,
          time: latestApptWithVitals.time,
        }
      : null,
  });
}

/**
 * POST /api/mobile/patient/vitals
 * Records a new physiological vitals entry for the authenticated patient.
 */
export async function POST(request: Request) {
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  const actor = await requirePatientActor();
  if (actor instanceof Response) return actor;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  const systolic = typeof raw.systolic === "number" && !isNaN(raw.systolic) ? Math.round(raw.systolic) : undefined;
  const diastolic = typeof raw.diastolic === "number" && !isNaN(raw.diastolic) ? Math.round(raw.diastolic) : undefined;
  const pulse = typeof raw.pulse === "number" && !isNaN(raw.pulse) ? Math.round(raw.pulse) : undefined;
  const bloodSugar = typeof raw.bloodSugar === "number" && !isNaN(raw.bloodSugar) ? Math.round(raw.bloodSugar) : undefined;
  const sugarType = ["fasting", "post_meal", "random"].includes(String(raw.sugarType))
    ? (raw.sugarType as "fasting" | "post_meal" | "random")
    : undefined;
  const spo2 = typeof raw.spo2 === "number" && !isNaN(raw.spo2) ? Math.round(raw.spo2) : undefined;
  const weight = typeof raw.weight === "number" && !isNaN(raw.weight) ? Number(raw.weight.toFixed(1)) : undefined;
  const temperature = typeof raw.temperature === "number" && !isNaN(raw.temperature) ? Number(raw.temperature.toFixed(1)) : undefined;
  const notes = raw.notes ? String(raw.notes).trim().slice(0, 250) : undefined;
  const recordedAt = raw.recordedAt ? String(raw.recordedAt).trim() : new Date().toISOString();

  // Validate that at least one metric is provided
  if (
    systolic === undefined &&
    diastolic === undefined &&
    pulse === undefined &&
    bloodSugar === undefined &&
    spo2 === undefined &&
    weight === undefined &&
    temperature === undefined
  ) {
    return apiError("Please provide at least one vitals metric (Blood Pressure, Sugar, Pulse, SpO2, or Weight).", 400);
  }

  // Bounds checks
  if (systolic !== undefined && (systolic < 50 || systolic > 280)) {
    return apiError("Systolic BP must be between 50 and 280 mmHg.", 400);
  }
  if (diastolic !== undefined && (diastolic < 30 || diastolic > 180)) {
    return apiError("Diastolic BP must be between 30 and 180 mmHg.", 400);
  }
  if (pulse !== undefined && (pulse < 30 || pulse > 240)) {
    return apiError("Pulse must be between 30 and 240 BPM.", 400);
  }
  if (bloodSugar !== undefined && (bloodSugar < 20 || bloodSugar > 700)) {
    return apiError("Blood glucose must be between 20 and 700 mg/dL.", 400);
  }
  if (spo2 !== undefined && (spo2 < 50 || spo2 > 100)) {
    return apiError("Oxygen saturation (SpO2) must be between 50% and 100%.", 400);
  }
  if (weight !== undefined && (weight < 1 || weight > 400)) {
    return apiError("Weight must be between 1 and 400 kg.", 400);
  }
  if (temperature !== undefined && (temperature < 90 || temperature > 110)) {
    return apiError("Temperature must be between 90°F and 110°F.", 400);
  }

  const newReading: VitalReadingPayload = {
    id: String(raw.id || Math.random().toString(36).substring(2, 9)),
    systolic,
    diastolic,
    pulse,
    bloodSugar,
    sugarType,
    spo2,
    weight,
    temperature,
    recordedAt,
    notes,
  };

  // Fetch current notification preferences
  const [row] = await db
    .select({
      notificationPreferences: users.notificationPreferences,
    })
    .from(users)
    .where(eq(users.id, actor.id))
    .limit(1);

  const currentPrefs = (row?.notificationPreferences ?? {}) as Record<string, unknown>;
  const existingVitals = Array.isArray(currentPrefs.healthVitals) ? currentPrefs.healthVitals : [];

  // Insert into relational patient_vitals table
  try {
    await db.insert(patientVitals).values({
      patientId: actor.id,
      systolicBp: systolic,
      diastolicBp: diastolic,
      heartRate: pulse,
      bloodGlucose: bloodSugar !== undefined ? String(bloodSugar) : null,
      glucoseContext: sugarType,
      spo2,
      weight: weight !== undefined ? String(weight) : null,
      temperature: temperature !== undefined ? String(temperature) : null,
      recordedAt: new Date(recordedAt),
      notes,
    });
  } catch {
    // Graceful fallback to user JSON
  }

  // Prepend and cap at last 100 readings in user preferences for backwards compatibility
  const updatedVitals = [newReading, ...existingVitals].slice(0, 100);

  const updatedPrefs = {
    ...currentPrefs,
    healthVitals: updatedVitals,
  };

  await db
    .update(users)
    .set({
      notificationPreferences: updatedPrefs,
      updatedAt: new Date(),
    })
    .where(eq(users.id, actor.id));

  return apiOk({
    reading: newReading,
    vitals: updatedVitals,
    message: "Health vitals recorded successfully.",
  });
}
