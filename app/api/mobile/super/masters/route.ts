import { NextRequest } from "next/server";
import { getMasterCounts, getMasterData, type MasterKind } from "@/lib/queries/super-admin";
import { apiError, apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/** The exact set the masters page iterates. */
const KINDS: MasterKind[] = ["symptoms", "examinations", "diagnoses", "lab-tests", "medicines"];

/**
 * GET /api/mobile/super/masters?kind= — the platform master data, either the
 * per-kind counts plus every list (no `kind`) or one kind's rows.
 *
 * Wraps `getMasterCounts` (super-admin.ts:290) and `getMasterData`
 * (super-admin.ts:319) exactly as `app/super-admin/masters/page.tsx:20` fans
 * them out over `KINDS`. An unknown `kind` is a validation failure, not a
 * silent empty list. Import and export stay on the existing byte routes
 * (`GET /api/super-admin/masters/[kind]/export`).
 */
export async function GET(request: NextRequest) {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const kind = request.nextUrl.searchParams.get("kind");
  if (kind !== null && !KINDS.includes(kind as MasterKind)) {
    return apiError("Invalid master kind", 400);
  }

  if (kind) {
    const rows = await getMasterData(kind as MasterKind);
    return apiOk({ kind, rows });
  }

  const [counts, ...lists] = await Promise.all([
    getMasterCounts(),
    ...KINDS.map((k) => getMasterData(k)),
  ]);

  return apiOk({
    counts,
    data: {
      symptoms: lists[0],
      examinations: lists[1],
      diagnoses: lists[2],
      "lab-tests": lists[3],
      medicines: lists[4],
    },
  });
}
