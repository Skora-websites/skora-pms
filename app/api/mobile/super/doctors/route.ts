import { NextRequest } from "next/server";
import { getDoctors } from "@/lib/queries/super-admin";
import { apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/doctors — the platform doctor directory, searchable
 * with `?q=`.
 *
 * Wraps `getDoctors` (lib/queries/super-admin.ts:171), the helper
 * `app/super-admin/doctors/page.tsx:20` calls with the same optional search
 * string. Guard: `requireApiRole(["super_admin"])`, mirroring the page's
 * `requireRole(["super_admin"])` — strict, no tier flexibility.
 */
export async function GET(request: NextRequest) {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const doctors = await getDoctors(q);
  return apiOk(doctors);
}
