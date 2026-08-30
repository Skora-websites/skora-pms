import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Web Push sender for PWA background notifications (e.g. SOS emergency
 * dispatch). Uses the `web-push` library + VAPID keys from env.
 *
 * VAPID keys are generated with:
 *   npx web-push generate-vapid-keys --json
 * and stored as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT.
 */
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@skoracare.com";

let configured = false;
if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

/**
 * Send a Web Push notification to a single subscription.
 * Failures are swallowed — push must never block the calling action.
 */
export async function sendPushToSubscription(
  subscription: { endpoint: string; auth: string; p256dh: string },
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<boolean> {
  if (!configured) return false;
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { auth: subscription.auth, p256dh: subscription.p256dh },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/",
        tag: payload.tag ?? "skoracare",
      })
    );
    return true;
  } catch (err) {
    // A 404/410 means the subscription is dead — prune it so we don't
    // retry forever.
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .catch(() => {});
    }
    return false;
  }
}

/**
 * Send a Web Push notification to ALL of a user's saved subscriptions.
 * Returns the number of pushes actually sent.
 */
export async function sendPushToUser(
  userId: number,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<number> {
  if (!configured) return 0;
  const subs = await db
    .select({ endpoint: pushSubscriptions.endpoint, auth: pushSubscriptions.auth, p256dh: pushSubscriptions.p256dh })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  let sent = 0;
  for (const sub of subs) {
    if (await sendPushToSubscription(sub, payload)) sent++;
  }
  return sent;
}
