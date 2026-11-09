/**
 * A DOCTOR session for suites that must drive `"use server"` modules through
 * `requireWriteScope` — the doctor-shaped sibling of `session-stub.ts`
 * (which returns a receptionist and holds no permissions).
 *
 * Same constraints as the receptionist stub: `getCurrentUser` reads a cookie
 * through `next/headers`, unreachable outside a request scope, so suites
 * redirect `@/lib/auth/user` here via `module.registerHooks`.
 *
 * `CURRENT_USER` is MUTABLE: the suite assigns its fixture doctor's row
 * (as a `CurrentUser`) before invoking the actions, so the real
 * `hasPermission` → `getUserPermissions` path runs against the DB with the
 * fixture user's id. Only the session *reader* is stubbed; authorization
 * itself is real.
 *
 * Type checking is unaffected: TypeScript resolves the real `@/lib/auth/user`
 * for types; only the runtime specifier is redirected.
 */

import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { modelHasPermissions, permissions } from "@/lib/db/schema";

const USER_MODEL = "App\\Models\\User";

/**
 * The fixture doctor is carried on `globalThis`, NOT on a module-level
 * variable: the suite imports this file statically while the action modules
 * reach it through the resolve hook, and tsx can load the same file as two
 * module records — a module-level variable would be set on one instance and
 * read as null from the other. `globalThis` is shared across every instance
 * in the process.
 */
export function setFixtureDoctor(user: {
  id: number;
  name: string;
  email: string;
  role: string;
}) {
  (globalThis as Record<string, unknown>).__skoraFixtureDoctor = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: null,
    role: user.role,
    status: "active",
    doctorId: null,
    trialEndsAt: null,
  };
}

export async function getCurrentUser() {
  return (globalThis as Record<string, unknown>).__skoraFixtureDoctor ?? null;
}

/** REAL permission lookup for the fixture user — the DB grant must exist. */
export async function getUserPermissions(userId: number): Promise<Set<string>> {
  const rows = await db
    .select({ name: permissions.name })
    .from(permissions)
    .innerJoin(modelHasPermissions, eq(modelHasPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(modelHasPermissions.modelId, userId),
        eq(modelHasPermissions.modelType, USER_MODEL)
      )
    );
  return new Set(rows.map((r) => r.name));
}

export async function hasPermission(userId: number, permission: string) {
  const perms = await getUserPermissions(userId);
  return perms.has(permission);
}

export const ROLE_HOME: Record<string, string> = {
  doctor: "/doctor",
  receptionist: "/receptionist",
  patient: "/patient",
  admin: "/admin",
  manager: "/admin",
  super_admin: "/super-admin",
};

export const isTrialExpired = (): boolean => false;

export function homePathForRole(role: string): string {
  return ROLE_HOME[role] ?? "/";
}
