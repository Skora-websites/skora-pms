"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export type PushActionResult = { error: string | null; ok?: boolean };

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Save a browser PushSubscription for the logged-in user.
 * Called from the PWA when the user opts in to notifications.
 */
export async function subscribeToPush(
  endpoint: string,
  auth: string,
  p256dh: string
): Promise<PushActionResult> {
  const user = await requireUser();
  if (!endpoint || !auth || !p256dh) return { error: "Invalid subscription." };
  if (!endpoint.startsWith("https://") && !endpoint.startsWith("http://")) {
    return { error: "Invalid endpoint." };
  }
  // Idempotent: if already subscribed, keep one row.
  const existing = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(pushSubscriptions).values({
      userId: user.id,
      endpoint,
      auth,
      p256dh,
      createdAt: new Date(),
    });
  }
  return { error: null, ok: true };
}

/** Remove a subscription (e.g. when the user revokes permission). */
export async function unsubscribeFromPush(endpoint: string): Promise<PushActionResult> {
  const user = await requireUser();
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
  return { error: null, ok: true };
}
