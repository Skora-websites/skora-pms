import { NextRequest } from "next/server";
import { getUsers, getUsersCount } from "@/lib/queries/super-admin";
import { apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/users — every user on the platform, paginated.
 *
 * Wraps `getUsers` and `getUsersCount` (lib/queries/super-admin.ts:248/:276)
 * with the same `PAGE_SIZE = 25`, `?role=`, `?q=` and `?page=` convention
 * `app/super-admin/users/page.tsx:12,27-30` uses. `role` is a FILTER (the
 * helper ignores `"all"`), never a scope — the super-admin tier spans every
 * role by design.
 *
 * Guard: `requireRole(["super_admin"])` on the page, so the equivalent
 * `requireApiRole(["super_admin"])`.
 */
export async function GET(request: NextRequest) {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const role = searchParams.get("role") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const currentPage = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const PAGE_SIZE = 25;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    getUsers(role, q, { limit: PAGE_SIZE, offset }),
    getUsersCount(role, q),
  ]);

  return apiOk({
    rows,
    total,
    page: currentPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
