import { NextRequest } from "next/server";
import { getAuditActions, getAuditLogs } from "@/lib/queries/super-admin";
import { apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/audit-logs?action=&page= — the platform audit trail.
 *
 * Wraps `getAuditLogs` and `getAuditActions` (super-admin.ts:138/:162) with
 * the same `limit = 50` and `offset = (page - 1) * limit` convention
 * `app/super-admin/audit-logs/page.tsx:15-17` uses. `action` is a FILTER
 * passed straight to the helper, which parameterizes it as an `eq` — no
 * caller-supplied value reaches SQL unparameterized.
 */
export async function GET(request: NextRequest) {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action") ?? undefined;
  const currentPage = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = 50;

  const [logs, actions] = await Promise.all([
    getAuditLogs({ limit, offset: (currentPage - 1) * limit, action }),
    getAuditActions(),
  ]);

  return apiOk({ logs, actions, page: currentPage, pageSize: limit });
}
