import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk } from "../../_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/notifications — in-app notifications for the caller patient.
 */
export async function GET() {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  const rows = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      message: notifications.message,
      type: notifications.type,
      link: notifications.link,
      read: notifications.read,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return apiOk(rows);
}
