/**
 * Device-token registry for native push (React Native app).
 *
 * One row per device. Registration is idempotent on the token: the same phone
 * re-registering — after a reinstall, or because a second account signed in on
 * it — updates the existing row instead of adding one, so a single SOS never
 * rings twice and the device follows the account that last registered it.
 */

import { db } from "@/lib/db";
import { deviceTokens } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { isNativePushToken } from "./native";

export type DeviceTokenRegistration =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Register (or re-point) a device token for a user. A malformed token is
 * refused rather than stored: an unusable row would only ever fail sends.
 */
export async function registerDeviceToken(
  userId: number,
  token: string,
  platform: string
): Promise<DeviceTokenRegistration> {
  const value = token.trim();
  if (!isNativePushToken(value)) {
    return { ok: false, error: "Invalid device token." };
  }

  await db
    .insert(deviceTokens)
    .values({ userId, token: value, platform: platform.trim() || "unknown" })
    .onDuplicateKeyUpdate({
      set: { userId, platform: platform.trim() || "unknown", updatedAt: new Date() },
    });

  return { ok: true };
}

/**
 * Remove one of the caller's own devices. Scoped by userId + token: the token
 * alone identifies a device, not the account entitled to unregister it, so
 * another user's token is never touched.
 */
export async function unregisterDeviceToken(userId: number, token: string): Promise<void> {
  const value = token.trim();
  await db
    .delete(deviceTokens)
    .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, value)));
}

/** Every device a user has registered — what a send to that user fans out to. */
export async function listDeviceTokens(
  userId: number
): Promise<Array<{ token: string; platform: string }>> {
  return db
    .select({ token: deviceTokens.token, platform: deviceTokens.platform })
    .from(deviceTokens)
    .where(eq(deviceTokens.userId, userId));
}
