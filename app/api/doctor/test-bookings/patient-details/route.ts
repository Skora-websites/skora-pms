import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { getBusinessScope } from "@/lib/auth/scope";

export const runtime = "nodejs";

/**
 * Patient details lookup for the test booking form
 * (legacy `getPatientDetails` parity).
 * GET /api/doctor/test-bookings/patient-details?type=registration_id|mobile&value=...
 * Admin-tier callers look up across their whole business scope.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdminTier = user.role === "admin" || user.role === "manager";
  if (!["doctor", "receptionist"].includes(user.role) && !isAdminTier) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ownerIds = isAdminTier
    ? (await getBusinessScope()).doctorIds
    : [user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id];

  const type = req.nextUrl.searchParams.get("type");
  const value = (req.nextUrl.searchParams.get("value") ?? "").trim();
  if (!value) return NextResponse.json({ success: false });

  const conds = [inArray(users.referenceRoleId, ownerIds.length ? ownerIds : [-1]), eq(users.role, "patient")];
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