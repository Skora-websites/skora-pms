import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

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