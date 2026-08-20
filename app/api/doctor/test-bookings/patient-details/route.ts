import { NextRequest, NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/**
 * Patient details lookup for the test booking form
 * (legacy `getPatientDetails` parity).
 * GET /api/doctor/test-bookings/patient-details?type=registration_id|mobile&value=...
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const type = req.nextUrl.searchParams.get("type");
  const value = (req.nextUrl.searchParams.get("value") ?? "").trim();
  if (!value) return NextResponse.json({ success: false });

  const conds = [eq(users.referenceRoleId, doctorId), eq(users.role, "patient")];
  if (type === "registration_id") conds.push(eq(users.registrationId, value));
  else if (type === "mobile") {
    const phoneCond = or(eq(users.phone, value), eq(users.phone, `0${value}`));
    if (phoneCond) conds.push(phoneCond);
  } else return NextResponse.json({ success: false });

  const [patient] = await db
    .select({
      id: users.id,
      name: users.name,
      registrationId: users.registrationId,
      phone: users.phone,
      email: users.email,
      gender: users.gender,
      dob: users.dob,
    })
    .from(users)
    .where(and(...conds))
    .limit(1);

  if (!patient) return NextResponse.json({ success: false });

  return NextResponse.json({ success: true, patient });
}