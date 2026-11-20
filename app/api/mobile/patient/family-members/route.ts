import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, patientFamilyMembers } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type FamilyRelationship = "Spouse" | "Child" | "Parent" | "Sibling" | "Other";
export type FamilyGender = "male" | "female" | "other";

export interface FamilyMemberPayload {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  gender: FamilyGender;
  dob?: string;
  bloodGroup?: string;
  allergies?: string;
}

/**
 * GET /api/mobile/patient/family-members
 * Returns the authenticated patient's saved family dependents.
 */
export async function GET() {
  const actor = await requirePatientActor();
  if (actor instanceof Response) return actor;

  let familyMembers: FamilyMemberPayload[] = [];

  // 1. Try relational patient_family_members table
  try {
    const tableRows = await db
      .select()
      .from(patientFamilyMembers)
      .where(eq(patientFamilyMembers.patientId, actor.id));

    if (tableRows && tableRows.length > 0) {
      familyMembers = tableRows.map((r) => ({
        id: String(r.id),
        name: r.fullName,
        relationship: (["Spouse", "Child", "Parent", "Sibling", "Other"].includes(r.relationship)
          ? r.relationship
          : "Other") as FamilyRelationship,
        gender: (["male", "female", "other"].includes(String(r.gender).toLowerCase())
          ? r.gender?.toLowerCase()
          : "other") as FamilyGender,
        dob: r.dob ?? undefined,
        bloodGroup: r.bloodGroup ?? undefined,
        allergies: r.allergies ?? undefined,
      }));
    }
  } catch {
    // Fallback if table not yet migrated
  }

  // 2. Fallback to notificationPreferences
  if (familyMembers.length === 0) {
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
    const rawMembers = Array.isArray(prefs.familyMembers) ? prefs.familyMembers : [];

    familyMembers = rawMembers
      .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
      .map((m) => ({
        id: String(m.id || Math.random().toString(36).substring(2, 9)),
        name: String(m.name || "").trim(),
        relationship: (["Spouse", "Child", "Parent", "Sibling", "Other"].includes(String(m.relationship))
          ? m.relationship
          : "Other") as FamilyRelationship,
        gender: (["male", "female", "other"].includes(String(m.gender))
          ? m.gender
          : "other") as FamilyGender,
        dob: m.dob ? String(m.dob).trim() : undefined,
        bloodGroup: m.bloodGroup ? String(m.bloodGroup).trim() : undefined,
        allergies: m.allergies ? String(m.allergies).trim() : undefined,
      }))
      .filter((m) => m.name.length > 0);
  }

  return apiOk({ familyMembers });
}

/**
 * POST /api/mobile/patient/family-members
 * Saves the authenticated patient's family dependents (up to 8 members).
 * Body: { familyMembers: FamilyMemberPayload[] }
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
  if (!Array.isArray(raw.familyMembers)) {
    return apiError("familyMembers must be an array.", 400);
  }

  if (raw.familyMembers.length > 8) {
    return apiError("You can register up to 8 family members.", 400);
  }

  const sanitized: FamilyMemberPayload[] = [];
  for (const item of raw.familyMembers) {
    if (typeof item !== "object" || item === null) continue;
    const m = item as Record<string, unknown>;
    const name = String(m.name || "").trim();
    const relRaw = String(m.relationship || "Other").trim();
    const relationship: FamilyRelationship = ["Spouse", "Child", "Parent", "Sibling", "Other"].includes(relRaw)
      ? (relRaw as FamilyRelationship)
      : "Other";
    const genderRaw = String(m.gender || "other").toLowerCase().trim();
    const gender: FamilyGender = ["male", "female", "other"].includes(genderRaw)
      ? (genderRaw as FamilyGender)
      : "other";
    const dob = m.dob ? String(m.dob).trim() : undefined;
    const bloodGroup = m.bloodGroup ? String(m.bloodGroup).trim() : undefined;
    const allergies = m.allergies ? String(m.allergies).trim() : undefined;
    const id = String(m.id || Math.random().toString(36).substring(2, 9));

    if (!name || name.length > 60) {
      return apiError("Each family member must have a valid name (up to 60 characters).", 400);
    }

    sanitized.push({
      id,
      name,
      relationship,
      gender,
      dob,
      bloodGroup,
      allergies,
    });
  }

  // Sync with relational patient_family_members table
  try {
    // Clear and re-insert for full sync
    await db.delete(patientFamilyMembers).where(eq(patientFamilyMembers.patientId, actor.id));
    for (const mem of sanitized) {
      await db.insert(patientFamilyMembers).values({
        patientId: actor.id,
        fullName: mem.name,
        relationship: mem.relationship,
        gender: mem.gender,
        dob: mem.dob,
        bloodGroup: mem.bloodGroup,
        allergies: mem.allergies,
      });
    }
  } catch {
    // Graceful fallback to user JSON
  }

  // Fetch current notification preferences
  const [row] = await db
    .select({
      notificationPreferences: users.notificationPreferences,
    })
    .from(users)
    .where(eq(users.id, actor.id))
    .limit(1);

  const currentPrefs = (row?.notificationPreferences ?? {}) as Record<string, unknown>;
  const updatedPrefs = {
    ...currentPrefs,
    familyMembers: sanitized,
  };

  await db
    .update(users)
    .set({
      notificationPreferences: updatedPrefs,
      updatedAt: new Date(),
    })
    .where(eq(users.id, actor.id));

  return apiOk({ familyMembers: sanitized, message: "Family members updated successfully." });
}
