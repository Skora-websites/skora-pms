import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/queries/available-slots";
import { requireApiRole } from "@/lib/auth/guard";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/patient/available-slots?doctor_id=N&date=YYYY-MM-DD
 *
 * Returns free time slots for a doctor on a given date:
 *   - slots come from the doctor's active schedule windows (30-min increments)
 *   - booked/cancelled-excluded appointments are removed
 *   - past times are removed for today
 *
 * The slot-building, the holiday advisory and the response shape all live in
 * `getAvailableSlots` (lib/queries/available-slots.ts) so the mobile mirror
 * (`app/api/mobile/patient/available-slots`) cannot drift from this route —
 * the same request must produce the same bookable slots on either client.
 * This handler keeps only the web's own guard, its validation and the bare
 * (non-enveloped) body the web client expects.
 */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const doctorId = Number(searchParams.get("doctor_id"));
  const date = searchParams.get("date") ?? "";

  if (!doctorId || !Number.isInteger(doctorId) || doctorId <= 0) {
    return NextResponse.json({ error: "Invalid doctor" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // The doctor must exist and be a doctor role.
  const [doctor] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "doctor"), eq(schema.users.id, doctorId)))
    .limit(1);
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  return NextResponse.json(await getAvailableSlots(doctorId, date));
}
