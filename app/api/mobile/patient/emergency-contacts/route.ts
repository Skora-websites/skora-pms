import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export interface EmergencyContactPayload {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  notifyOnSos?: boolean;
}

/**
 * GET /api/mobile/patient/emergency-contacts
 * Returns the authenticated patient's saved emergency contacts.
 */
export async function GET() {
  const actor = await requirePatientActor();
  if (actor instanceof Response) return actor;

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
  const rawContacts = Array.isArray(prefs.emergencyContacts) ? prefs.emergencyContacts : [];

  const contacts: EmergencyContactPayload[] = rawContacts
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      id: String(c.id || Math.random().toString(36).substring(2, 9)),
      name: String(c.name || "").trim(),
      relationship: String(c.relationship || "Other").trim(),
      phone: String(c.phone || "").trim(),
      notifyOnSos: c.notifyOnSos !== false,
    }))
    .filter((c) => c.name.length > 0 && c.phone.length > 0);

  return apiOk({ contacts });
}

/**
 * POST /api/mobile/patient/emergency-contacts
 * Saves the authenticated patient's emergency contacts (up to 5 contacts).
 * Body: { contacts: EmergencyContactPayload[] }
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
  if (!Array.isArray(raw.contacts)) {
    return apiError("Contacts must be an array.", 400);
  }

  if (raw.contacts.length > 5) {
    return apiError("You can save at most 5 emergency contacts.", 400);
  }

  const sanitized: EmergencyContactPayload[] = [];
  for (const item of raw.contacts) {
    if (typeof item !== "object" || item === null) continue;
    const c = item as Record<string, unknown>;
    const name = String(c.name || "").trim();
    const phone = String(c.phone || "").trim();
    const relationship = String(c.relationship || "Other").trim();
    const notifyOnSos = c.notifyOnSos !== false;
    const id = String(c.id || Math.random().toString(36).substring(2, 9));

    if (!name || name.length > 60) {
      return apiError("Each contact must have a valid name (up to 60 characters).", 400);
    }
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return apiError(`Invalid phone number for contact '${name}'. Must be 8-15 digits.`, 400);
    }

    sanitized.push({
      id,
      name,
      relationship,
      phone: cleanPhone,
      notifyOnSos,
    });
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
    emergencyContacts: sanitized,
  };

  await db
    .update(users)
    .set({
      notificationPreferences: updatedPrefs,
      updatedAt: new Date(),
    })
    .where(eq(users.id, actor.id));

  return apiOk({ contacts: sanitized, message: "Emergency contacts updated successfully." });
}
