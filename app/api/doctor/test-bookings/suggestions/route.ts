import { NextRequest, NextResponse } from "next/server";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/**
 * Patient mobile / registration suggestions for the test booking form
 * (legacy `getMobileSuggestions` / `getRegistrationSuggestions` parity).
 * GET /api/doctor/test-bookings/suggestions?q=...&type=mobile|registration
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const type = req.nextUrl.searchParams.get("type") ?? "mobile";
  if (!q) return NextResponse.json([]);

  const likeQ = `%${q}%`;
  const conds = [
    eq(users.referenceRoleId, doctorId),
    eq(users.role, "patient"),
    type === "registration"
      ? like(users.registrationId, likeQ)
      : or(like(users.phone, likeQ), like(users.name, likeQ)),
  ];

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      registrationId: users.registrationId,
    })
    .from(users)
    .where(and(...conds))
    .limit(20);

  return NextResponse.json(rows);
}