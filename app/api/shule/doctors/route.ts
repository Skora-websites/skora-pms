import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getUserByApiTokenHeader, touchApiToken } from "@/lib/auth/api-token";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/ip";

export const runtime = "nodejs";

/**
 * Shule integration endpoint — doctor name fetching.
 *
 * GET /api/shule/doctors
 *   Headers: Authorization: Bearer <token>   (provisioned via
 *            scripts/provision-api-token.mjs)
 *   Query:   ?search=raj  (optional, filters by name/email/phone)
 *            ?id=14       (optional, single doctor)
 *
 * Response 200:
 * {
 *   "data": [
 *     { "id": 14, "name": "Abhishek kumar", "salutation": null,
 *       "qualification": null, "registration_number": null,
 *       "email": "...", "phone": "...", "status": "active" }
 *   ]
 * }
 *
 * Errors: 401 invalid/missing token · 403 deactivated account · 429 rate limited
 * Only active doctors are listed; no patient or clinical data is exposed.
 */

// Shule polls this endpoint — keep the limit generous but bounded.
const RATE_LIMIT = 120; // requests…
const RATE_WINDOW_MS = 60_000; // …per minute per IP

export async function GET(request: NextRequest) {
  const ip = await getClientIp();
  const { allowed } = rateLimit(`shule-doctors:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const authHeader = request.headers.get("authorization");
  const user = await getUserByApiTokenHeader(authHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  void touchApiToken(authHeader);

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const idRaw = searchParams.get("id")?.trim() ?? "";

  const conds = [eq(users.role, "doctor"), eq(users.status, "active")];
  if (/^\d+$/.test(idRaw)) {
    conds.push(eq(users.id, Number(idRaw)));
  } else if (search) {
    const like = `%${search.replace(/[%_]/g, "\\$&")}%`;
    conds.push(sql`(${users.name} LIKE ${like} OR ${users.email} LIKE ${like} OR ${users.phone} LIKE ${like})`);
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      salutation: users.salutation,
      qualification: users.qualification,
      registrationNumber: users.registrationNumber,
      email: users.email,
      phone: users.phone,
      status: users.status,
    })
    .from(users)
    .where(and(...conds))
    .orderBy(asc(users.name))
    .limit(200);

  return NextResponse.json(
    {
      data: rows.map((d) => ({
        id: d.id,
        name: d.name,
        salutation: d.salutation,
        qualification: d.qualification,
        registration_number: d.registrationNumber,
        email: d.email,
        phone: d.phone,
        status: d.status,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
