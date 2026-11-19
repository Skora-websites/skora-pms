import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { sendNativePushToUser } from "@/lib/push/native";

export type NotificationParams = {
  userId: number;
  title: string;
  message: string;
  type?: string;
  link?: string;
  critical?: boolean;
};

/**
 * Unified notification dispatcher.
 * 1. Inserts persistent in-app row in `notifications` table.
 * 2. Fires native push notification to registered devices (Expo Push FCM/APNs).
 * Best-effort and non-blocking: errors in push never fail the caller.
 */
export async function notifyUser(params: {
  userId: number;
  title: string;
  message: string;
  type?: string;
  link?: string;
  critical?: boolean;
}): Promise<void> {
  const { userId, title, message, type = "info", link, critical = false } = params;

  try {
    // 1. In-app notification
    await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      link: link || null,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to insert notification row:", err);
  }

  // 2. Native push notification
  try {
    void sendNativePushToUser(userId, {
      title,
      body: message,
      url: link,
      critical,
    });
  } catch (err) {
    console.error("Failed to send native push notification:", err);
  }
}
