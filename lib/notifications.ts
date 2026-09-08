import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";

/**
 * Fire-and-forget in-app notification creator (P7.5).
 * Failures must never block the calling action.
 */
export async function notifyUser(args: {
  userId: number;
  title: string;
  message?: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}): Promise<void> {
  try {
    // Respect the recipient's in-app notification preferences (F10).
    if (!(await wantsNotification(args.userId, "in_app"))) return;
    await db.insert(notifications).values({
      userId: args.userId,
      title: args.title,
      message: args.message ?? null,
      type: args.type ?? "info",
      link: args.link ?? null,
      read: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

type PrefEvent =
  | "appointment_booking"
  | "appointment_cancellation"
  | "lab_report_ready"
  | "follow_up_reminder";

/**
 * Does the recipient allow this event on this channel? Defaults to true when
 * the user never set preferences (stored shape: app/doctor/settings actions).
 * ponytail: per-user pref fetch per notification — fine at this app's volume;
 * batch/queue senders should cache the pref map.
 */
export async function wantsNotification(
  userId: number,
  channel: "email" | "sms" | "in_app",
  event: PrefEvent = "appointment_booking"
): Promise<boolean> {
  try {
    const [row] = await db
      .select({ prefs: users.notificationPreferences })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const prefs = row?.prefs as Record<string, Record<string, boolean> | undefined> | null;
    const flag = prefs?.[event]?.[channel];
    return flag === undefined ? true : !!flag;
  } catch {
    // Preference lookup failure must not silently kill notifications.
    return true;
  }
}
