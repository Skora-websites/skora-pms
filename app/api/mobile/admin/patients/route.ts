import { NextRequest } from "next/server";
import { listScopedPatients } from "@/lib/queries/admin";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/patients — the patients of every doctor in the
 * viewer's scope, searchable with `?q=`.
 *
 * Wraps `listScopedPatients` (lib/queries/admin.ts:231) with the same doctor
 * ids and the same hardcoded limit `app/admin/patients/page.tsx:25` uses, so
 * the list matches row for row. Module permission: `/admin/patients` maps to
 * `registrations` in ADMIN_ROUTE_PERMISSIONS.
 */
export async function GET(request: NextRequest) {
  const actor = await requireAdminActor("/admin/patients");
  if (actor instanceof Response) return actor;

  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const patients = await listScopedPatients(actor.scope.doctorIds, q, 100);
  return apiOk(patients);
}
