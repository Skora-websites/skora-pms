"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { isAllowedPushEndpoint } from "@/lib/push/endpoint";

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
  // The server later POSTs to this URL (SSRF risk) — only allow well-known
  // web-push service hosts, never arbitrary internal targets.
  if (!isAllowedPushEndpoint(endpoint)) {
    return { error: "Unsupported push service." };
  }
  // Idempotent: if already subscribed, keep one row. The check-then-insert is
  // racy, so the insert also treats a duplicate-key error as success — the
  // unique index on endpoint (drizzle/0016) is the real guard.
  const existing = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);
  if (existing.length === 0) {
    try {
      await db.insert(pushSubscriptions).values({
        userId: user.id,
        endpoint,
        auth,
        p256dh,
        createdAt: new Date(),
      });
    } catch (err) {
      // ER_DUP_ENTRY (1062): a concurrent subscribe created the row first.
      // mysql2 surfaces the code as `code` (string) or `errno` (number).
      const code = err && typeof err === "object" && "code" in err ? err.code : undefined;
      const errno = err && typeof err === "object" && "errno" in err ? err.errno : undefined;
      if (code !== "ER_DUP_ENTRY" && errno !== 1062) throw err;
    }
  }
  return { error: null, ok: true };
}

/** Remove a subscription (e.g. when the user revokes permission). */
export async function unsubscribeFromPush(endpoint: string): Promise<PushActionResult> {
  await requireUser();
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
  return { error: null, ok: true };
}
