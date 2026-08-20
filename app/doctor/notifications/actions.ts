"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export type NotifState = { error: string | null };

export type NotifRow = {
  id: number;
  title: string;
  message: string | null;
  type: string | null;
  link: string | null;
  read: boolean | null;
  createdAt: Date;
};
async function getDoctorId(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) redirect("/login");
  return user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
}

export async function getNotifications(): Promise<NotifRow[]> {
  const doctorId = await getDoctorId();
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
    .where(eq(notifications.userId, doctorId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return rows as NotifRow[];
}

export async function markAsRead(notificationId: number): Promise<void> {
  const doctorId = await getDoctorId();
  await db
    .update(notifications)
    .set({ read: true, updatedAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, doctorId)));
  revalidatePath("/doctor/notifications");
}

export async function markAllAsRead(): Promise<void> {
  const doctorId = await getDoctorId();
  await db
    .update(notifications)
    .set({ read: true, updatedAt: new Date() })
    .where(and(eq(notifications.userId, doctorId), eq(notifications.read, false)));
  revalidatePath("/doctor/notifications");
}

export async function getUnreadCount(): Promise<number> {
  const doctorId = await getDoctorId();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, doctorId), eq(notifications.read, false)));
  return Number(row?.count ?? 0);
}