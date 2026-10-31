import "server-only";

import { NextResponse } from "next/server";
import { hasAdminModuleAccess } from "@/lib/auth/permissions";
import {
  requireApiDoctorOnly,
  requireApiPermission,
  requireApiRole,
} from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import type { BusinessScope } from "@/lib/auth/scope";
import { getUserPermissions } from "@/lib/auth/user";
import type { CurrentUser } from "@/lib/auth/user";
import { resolvePracticeDoctorId } from "@/lib/queries/doctor";
import { listDoctorIdsFor } from "@/lib/queries/clinic";

/**
 * Shared plumbing for the `/api/mobile/**` namespace.
 *
 * The namespace is ADDITIVE: it never changes a business rule, a guard or a
 * payload. Every function here delegates to an existing helper in
 * `lib/auth/*` or `lib/queries/*` — there is no second implementation of
 * authorization, scoping or pagination in this file.
 *
 * Envelope: success is `200 { "data": … }`, failure is
 * `{ "error": "<message>" }` with a meaningful status — the contract's
 * single shape for every new route.
 */

/** `200 { "data": … }` — the success shape for every new read route. */
export function apiOk(data: unknown, init?: { status?: number }) {
  return NextResponse.json({ data }, { status: init?.status ?? 200 });
}

/** `{ "error": "<message>" }` with a meaningful status. */
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Maps a `NEXT_REDIRECT` throw raised by an existing action's guard to the
 * JSON envelope. Route handlers must never use the `redirect()` guards — the
 * digest surfaces here instead. Returns `null` for anything else so real
 * errors still bubble to the framework.
 */
export function redirectError(err: unknown): Response | null {
  if (typeof err !== "object" || err === null || !("digest" in err)) return null;
  const { digest } = err;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT")) return null;
  if (digest.split(";").includes("/login")) {
    return new Response("Unauthorized", { status: 401 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Read a `?page=` value with the same clamping the doctor pages apply
 * (`app/doctor/appointments/page.tsx`), so the app can page exactly like the
 * web surface. The page size is not caller-settable — the query layer keeps
 * its own `DEFAULT_PAGE_SIZE` (lib/queries/doctor.ts).
 */
export function parsePage(search: { get(k: string): string | null }): number {
  return Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1);
}

// ── Role actors ─────────────────────────────────────────────────────────────
// Each actor delegates to the existing API guard for that tier. No role is
// ever read from the request body, query string or header.

/** Patient: the tier that may only read its own records. */
export function requirePatientActor(): Promise<CurrentUser | Response> {
  return requireApiRole(["patient"]);
}

/**
 * Doctor-only areas (`DOCTOR_ONLY_PATHS`) — emergency history, consultations,
 * online consultations. Delegates to the existing doctor-only API guard,
 * which rejects every role that is not `doctor` and therefore never resolves
 * a receptionist to a linked practice owner.
 */
export function requireDoctorActor(): Promise<CurrentUser | Response> {
  return requireApiDoctorOnly(["doctor"]);
}

/**
 * Doctor-dashboard area gated by the module permission its page requires
 * (`DOCTOR_ROUTE_PERMISSIONS`).
 *
 * Role list mirrors the doctor pages themselves (`requireRole(["doctor",
 * "receptionist"])`) rather than the wider `/api/doctor/**` handlers: the
 * admin tier lives on `/api/mobile/admin/**` and resolves its scope through
 * `getBusinessScope()`. Admitting `admin`/`manager` here would feed
 * `resolvePracticeDoctorId` a USER id (not a doctor id) and silently return
 * another practice's rows.
 */
export function requireDoctorModule(
  permission: string
): Promise<CurrentUser | Response> {
  return requireApiPermission(["doctor", "receptionist"], permission);
}

export type AdminActor = {
  user: CurrentUser;
  viewerRole: "owner" | "manager";
  scope: BusinessScope;
};

/**
 * Admin tier (business owner + clinic manager) for a `/admin/...` path.
 *
 * Mirrors `requireAdminTier(pathname)` (lib/auth/guard.ts:89): owners bypass
 * module permissions, managers must hold the module, and `ownerOnly` entries
 * always fail for a manager. Roles outside the admin tier get 401/403 from
 * the existing API guard. `getBusinessScope()` supplies the scope — never a
 * caller-supplied clinic, business or doctor id.
 */
export async function requireAdminActor(
  adminPath: string
): Promise<AdminActor | Response> {
  const user = await requireApiRole(["admin", "manager"]);
  if (user instanceof Response) return user;
  const viewerRole = user.role === "admin" ? ("owner" as const) : ("manager" as const);
  if (viewerRole === "manager") {
    const perms = await getUserPermissions(user.id);
    if (!hasAdminModuleAccess(perms, adminPath, viewerRole)) {
      return apiError("Forbidden", 403);
    }
  }
  const scope = await getBusinessScope();
  return { user, viewerRole, scope };
}

/** Platform super-admin — strict, no tier flexibility. */
export function requireSuperAdminActor(): Promise<CurrentUser | Response> {
  return requireApiRole(["super_admin"]);
}

// ── Scope resolution ────────────────────────────────────────────────────────

/**
 * Resolve the doctor-id read scope for a doctor-dashboard caller.
 *
 * Delegates to the existing helpers the doctor pages use
 * (`resolvePracticeDoctorId` + `listDoctorIdsFor`), so a clinic owner sees
 * the practice, a receptionist sees the assigned clinics and a member doctor
 * sees strictly their own id.
 */
export async function resolveDoctorScope(
  user: CurrentUser
): Promise<number[]> {
  const doctorId = resolvePracticeDoctorId(user);
  return listDoctorIdsFor(user, doctorId);
}

/** Practice-anchor doctor id (never derived from a client-supplied value). */
export function anchorDoctorId(user: CurrentUser): number {
  return resolvePracticeDoctorId(user);
}
