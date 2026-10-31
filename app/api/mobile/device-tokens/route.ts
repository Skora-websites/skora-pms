import { z } from "zod";
import { requireApiRole } from "@/lib/auth/guard";
import type { CurrentUser, UserRole } from "@/lib/auth/user";
import { registerDeviceToken, unregisterDeviceToken } from "@/lib/push/device-tokens";
import { apiError, apiOk } from "../_helpers";

export const runtime = "nodejs";

/**
 * Device registration for native push (React Native app).
 *
 * POST   /api/mobile/device-tokens   { token, platform }  → register this device
 * DELETE /api/mobile/device-tokens   { token }             → drop it on sign-out
 *
 * Every role may register: the same phone number can sign in as a patient on
 * one install and as staff on another, and both need SOS alerts. The role list
 * mirrors `UserRole` so a new role can't be silently excluded from native push.
 *
 * The token is validated by lib/push/device-tokens (provider-token shape), and
 * DELETE is scoped to the caller: the token identifies a device, never the
 * account entitled to unregister it.
 */
const APP_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "manager",
  "doctor",
  "receptionist",
  "patient",
];

const deviceTokenSchema = z.object({
  token: z.string().trim().min(1).max(512),
  platform: z.enum(["ios", "android"]),
});

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

/** The caller, or the 401/403 response to return instead. */
async function requireAppUser(): Promise<CurrentUser | Response> {
  return requireApiRole(APP_ROLES);
}

export async function POST(request: Request) {
  const user = await requireAppUser();
  if (user instanceof Response) return user;

  const body = await readJson(request);
  const parsed = deviceTokenSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid device token.", 400);
  }

  const result = await registerDeviceToken(user.id, parsed.data.token, parsed.data.platform);
  if (!result.ok) return apiError(result.error, 400);

  return apiOk({ registered: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await requireAppUser();
  if (user instanceof Response) return user;

  const body = await readJson(request);
  const parsed = z.object({ token: z.string().trim().min(1).max(512) }).safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid device token.", 400);
  }

  await unregisterDeviceToken(user.id, parsed.data.token);
  return apiOk({ unregistered: true });
}
