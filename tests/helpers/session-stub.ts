/**
 * A receptionist session for suites that must drive `"use server"` modules.
 *
 * WHY THIS EXISTS: `getCurrentUser` reads the session cookie through
 * `next/headers`, which is only reachable inside a request scope, and the
 * Node 26 test runner cannot mock an ESM namespace export whose properties
 * tsx exposed as getters (`mock.method` validates through the property
 * descriptor and fails). The alternative that works in-process is redirecting
 * the specifier: `lib/dispatch/__tests__/tier.test.ts` points
 * `@/lib/auth/user` here with `module.registerHooks`, so the real action
 * modules resolve this session instead of the cookie reader.
 *
 * Type checking is unaffected: TypeScript resolves the real
 * `@/lib/auth/user` for types, and only the runtime specifier is redirected.
 * Keep the exported surface in step with that module.
 */

export const CURRENT_USER = {
  id: 4242,
  name: "Fixture Receptionist",
  email: "receptionist-4242@fixture.test",
  phone: null,
  role: "receptionist",
  status: "active",
  onDuty: false,
  clinicOnDuty: false,
  homeVisitOnDuty: false,
  profilePhotoPath: null,
  signaturePath: null,
  notificationPreferences: null,
  doctorId: null,
  qualification: null,
  specialization: null,
  registrationNumber: null,
  salutation: null,
  trialEndsAt: null,
  createdAt: null,
};

/** The receptionist session every dispatch guard must refuse. */
export async function getCurrentUser(): Promise<typeof CURRENT_USER | null> {
  return CURRENT_USER;
}

/** A receptionist holding no module permissions. */
export async function getUserPermissions(): Promise<Set<string>> {
  return new Set<string>();
}

/** A receptionist holds no individual permission. */
export async function hasPermission(): Promise<boolean> {
  return false;
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
