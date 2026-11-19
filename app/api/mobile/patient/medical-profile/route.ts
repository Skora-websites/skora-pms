import { NextRequest } from "next/server";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, users } from "@/lib/db/schema";
import { apiError, apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/medical-profile
 * Returns the authenticated patient's clinical medical profile:
 * documented drug/food allergies, chronic conditions, blood group, and clinical notes.
 */
export async function GET() {
  const patient = await requirePatientActor();
  if (patient instanceof Response) return patient;

  const [userRow] = await db
    .select({
      allergies: users.allergies,
      gender: users.gender,
      dob: users.dob,
    })
    .from(users)
    .where(eq(users.id, patient.id))
    .limit(1);

  const [latestAppt] = await db
    .select({ bloodGroup: appointments.bloodGroup })
    .from(appointments)
    .where(
      and(
        eq(appointments.patientId, patient.id),
        isNotNull(appointments.bloodGroup)
      )
    )
    .orderBy(desc(appointments.id))
    .limit(1);

  let allergiesList: string[] = [];
  let chronicConditions: string[] = [];
  let bloodGroup: string | null = latestAppt?.bloodGroup ?? null;
  let notes: string | null = null;

  if (userRow?.allergies) {
    try {
      const parsed = JSON.parse(userRow.allergies);
      if (typeof parsed === "object" && parsed !== null) {
        if (Array.isArray(parsed.allergies)) {
          allergiesList = parsed.allergies.map(String);
        }
        if (Array.isArray(parsed.chronicConditions)) {
          chronicConditions = parsed.chronicConditions.map(String);
        }
        if (typeof parsed.bloodGroup === "string" && parsed.bloodGroup) {
          bloodGroup = parsed.bloodGroup;
        }
        if (typeof parsed.notes === "string") {
          notes = parsed.notes;
        }
      }
    } catch {
      // Fallback for plain text stored in allergies column
      allergiesList = userRow.allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return apiOk({
    allergies: allergiesList,
    chronicConditions,
    bloodGroup,
    notes,
    allergiesSummary: allergiesList.length > 0 ? allergiesList.join(", ") : "NKDA",
  });
}

/**
 * POST /api/mobile/patient/medical-profile
 * Updates the patient's drug allergies, chronic co-morbidities, blood group, and intake notes.
 */
export async function POST(request: NextRequest) {
  const patient = await requirePatientActor();
  if (patient instanceof Response) return patient;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", 400);
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  let allergiesList: string[] = [];
  if (Array.isArray(raw.allergies)) {
    allergiesList = raw.allergies.map((a) => String(a).trim()).filter(Boolean);
  } else if (typeof raw.allergies === "string") {
    allergiesList = raw.allergies.split(",").map((s) => s.trim()).filter(Boolean);
  }

  let chronicConditions: string[] = [];
  if (Array.isArray(raw.chronicConditions)) {
    chronicConditions = raw.chronicConditions.map((c) => String(c).trim()).filter(Boolean);
  }

  const bloodGroup = typeof raw.bloodGroup === "string" ? raw.bloodGroup.trim() : null;
  const notes = typeof raw.notes === "string" ? raw.notes.trim() : null;

  const payload = JSON.stringify({
    allergies: allergiesList,
    chronicConditions,
    bloodGroup,
    notes,
    updatedAt: new Date().toISOString(),
  });

  // Update user profile
  await db
    .update(users)
    .set({
      allergies: payload,
      updatedAt: new Date(),
    })
    .where(eq(users.id, patient.id));

  // Sync blood group to any active upcoming appointments
  if (bloodGroup) {
    try {
      await db
        .update(appointments)
        .set({ bloodGroup })
        .where(
          and(
            eq(appointments.patientId, patient.id),
            sql`${appointments.status} NOT IN ('cancelled', 'completed')`
          )
        );
    } catch {
      // Non-critical background sync
    }
  }

  return apiOk({
    success: true,
    allergies: allergiesList,
    chronicConditions,
    bloodGroup,
    notes,
    allergiesSummary: allergiesList.length > 0 ? allergiesList.join(", ") : "NKDA",
  });
}
