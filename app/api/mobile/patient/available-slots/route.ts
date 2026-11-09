import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAvailableSlots } from "@/lib/queries/available-slots";
import { apiError, apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/available-slots?doctor_id=N&date=YYYY-MM-DD
 *
 * The mobile mirror of the web's `/api/patient/available-slots`, which a
 * native client cannot call: that tree returns a bare JSON body and sits
 * behind the web's own guard. Both routes now share
 * `getAvailableSlots` (lib/queries/available-slots.ts) so a patient can never
 * see different slots — or book a different one — depending on which client
 * they are holding.
 */
export async function GET(request: Request) {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  const doctorId = Number(url.searchParams.get("doctor_id"));
  const date = url.searchParams.get("date") ?? "";

  if (!doctorId || !Number.isInteger(doctorId) || doctorId <= 0) {
    return apiError("Invalid doctor.", 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError("Invalid date.", 400);
  }

  // The doctor must exist and hold the doctor role.
  const [doctor] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "doctor"), eq(schema.users.id, doctorId)))
    .limit(1);
  if (!doctor) return apiError("Doctor not found.", 404);

  return apiOk(await getAvailableSlots(doctorId, date));
}
