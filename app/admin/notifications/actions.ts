"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { getBusinessScope } from "@/lib/auth/scope";

export type AdminNotifRow = {
  id: number;
  title: string;
  message: string | null;
  type: string | null;
  link: string | null;
  read: boolean | null;
  createdAt: Date;
};

/**
 * Notifications addressed to any doctor in the viewer's business. The doctor
 * dashboard keys its feed on `notifications.userId` = the acting doctor, so an
 * owner sees the union across the practices they own — never another
 * business's rows.
 */
export async function getAdminNotifications(): Promise<AdminNotifRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  if (user.role !== "admin" && user.role !== "manager") return [];

  const { doctorIds } = await getBusinessScope();
  if (doctorIds.length === 0) return [];

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
    .where(inArray(notifications.userId, doctorIds))
    .orderBy(desc(notifications.createdAt));

  const seen = new Map<number, AdminNotifRow>();
  for (const row of rows) if (!seen.has(row.id)) seen.set(row.id, row);
  return [...seen.values()];
}

/** Mark one row read. Scoped to the caller's business, so a foreign id no-ops. */
export async function markAdminNotificationRead(id: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "manager")) return;

  const { doctorIds } = await getBusinessScope();
  if (doctorIds.length === 0) return;

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), inArray(notifications.userId, doctorIds)));

  revalidatePath("/admin/notifications");
}

/** Unread count for the shared header bell on the /admin shell. */
export async function getAdminUnreadCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "manager")) return 0;

  const { doctorIds } = await getBusinessScope();
  if (doctorIds.length === 0) return 0;

  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(inArray(notifications.userId, doctorIds), eq(notifications.read, false)));
  return rows.length;
}
