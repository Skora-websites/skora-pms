import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { API_STAFF_TIERS, resolveApiTokenHeader, touchApiToken } from "@/lib/auth/api-token";
import { resolveVisibleDoctorIds } from "@/lib/auth/integration-scope";
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
 * Errors: 401 invalid/missing token · 403 non-staff tier or deactivated
 *         account · 404 unknown doctor id · 429 rate limited
 * Only active doctors are listed; no patient or clinical data is exposed, and
 * only those inside the token holder's own scope (their business, their
 * assigned clinics, or their practice) — never every tenant.
 */

// Shule polls this endpoint — keep the limit generous but bounded.
const RATE_LIMIT = 120; // requests…
const RATE_WINDOW_MS = 60_000; // …per minute per IP

export async function GET(request: NextRequest) {
  // Per-client bucket (audit F-07): key on the real IP when attributable,
  // otherwise on the bearer-token fingerprint — never on the shared
  // "unknown" constant, which would collapse every integrator into one
  // 120-req/min bucket one abusive client could exhaust.
  const ip = await getClientIp();
  const authHeader = request.headers.get("authorization");
  const clientKey =
    ip !== "unknown" ? `ip:${ip}` : `token:${authHeader ? authHeader.slice(-16) : "anonymous"}`;
  const { allowed } = rateLimit(`shule-doctors:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // A valid token whose owner account is gone/deactivated is a refusal (403),
  // not an authentication failure (401) — the documented contract (FR-018).
  const resolution = await resolveApiTokenHeader(authHeader);
  if (resolution.kind === "deactivated") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (resolution.kind !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = resolution.user;

  // Tokens are per-user, so the holder's tier is the second gate: only staff
  // operate a clinic directory. A patient token must not enumerate
  // practitioners — names, emails, phones and registration numbers included
  // (audit H4 / FR-017).
  if (!API_STAFF_TIERS.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  void touchApiToken(authHeader);

  const visibleDoctorIds = await resolveVisibleDoctorIds(user);

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const idRaw = searchParams.get("id")?.trim() ?? "";

  const conds = [eq(users.role, "doctor"), eq(users.status, "active")];
  // The tenant filter. There is no business_id on `users`, so the holder's
  // scope resolves to concrete doctor ids first and is applied here: an empty
  // scope matches NOTHING, never silently falling back to the global table.
  conds.push(visibleDoctorIds.length > 0 ? inArray(users.id, visibleDoctorIds) : sql`false`);

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

  // An explicit ?id= that resolved to nothing inside the caller's scope is
  // reported as "not found" rather than an empty list — the caller asked about
  // one doctor, and reporting absence both inside and outside the tenant
  // would confirm which ids exist elsewhere (audit edge case: ?id= for a
  // doctor outside the caller's tenant).
  if (rows.length === 0 && /^\d+$/.test(idRaw)) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

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
