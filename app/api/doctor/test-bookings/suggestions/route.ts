import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireApiPermission } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";

export const runtime = "nodejs";

/**
 * Patient mobile / registration suggestions for the test booking form
 * (legacy `getMobileSuggestions` / `getRegistrationSuggestions` parity).
 * GET /api/doctor/test-bookings/suggestions?q=...&type=mobile|registration
 * Admin-tier callers search across their whole business scope.
 */
export async function GET(req: NextRequest) {
  // Module permission matches the /doctor/test-bookings page (audit F-01);
  // admin tier keeps its business-scope branch, owner bypasses.
  const user = await requireApiPermission(
    ["doctor", "receptionist", "admin", "manager"],
    "test-booking"
  );
  if (user instanceof Response) return user;
  const isAdminTier = user.role === "admin" || user.role === "manager";
  const ownerIds = isAdminTier
    ? (await getBusinessScope()).doctorIds
    : [user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id];

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const type = req.nextUrl.searchParams.get("type") ?? "mobile";
  if (!q) return NextResponse.json([]);

  const likeQ = `%${q}%`;
  const conds = [
    inArray(users.referenceRoleId, ownerIds.length ? ownerIds : [-1]),
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