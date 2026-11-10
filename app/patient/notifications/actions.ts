"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export type PatientNotifRow = {
  id: number;
  title: string;
  message: string | null;
  type: string | null;
  link: string | null;
  read: boolean | null;
  createdAt: Date;
};

/**
 * Patient notification centre. Patients DO receive in-app notifications
 * (cancellations, visit completions) — until now there was no surface to read
 * them. Strictly the caller's own rows: notifications.userId IS the patient's
 * user id, so no scope join is needed.
 */
async function requirePatient(): Promise<number | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "patient") return null;
  return user.id;
}

export async function getPatientNotifications(): Promise<PatientNotifRow[]> {
  const patientId = await requirePatient();
  if (!patientId) return [];
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
    .where(eq(notifications.userId, patientId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return rows;
}

/** Mark one row read. Scoped to the caller's own rows, so a foreign id no-ops. */
export async function markPatientNotificationRead(id: number): Promise<void> {
  const patientId = await requirePatient();
  if (!patientId) return;
  await db
    .update(notifications)
    .set({ read: true, updatedAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, patientId)));
  revalidatePath("/patient/notifications");
}

export async function markAllPatientNotificationsRead(): Promise<void> {
  const patientId = await requirePatient();
  if (!patientId) return;
  await db
    .update(notifications)
    .set({ read: true, updatedAt: new Date() })
    .where(and(eq(notifications.userId, patientId), eq(notifications.read, false)));
  revalidatePath("/patient/notifications");
}

/** Unread count for the patient shell's header bell. */
export async function getPatientUnreadCount(): Promise<number> {
  const patientId = await requirePatient();
  if (!patientId) return 0;
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, patientId), eq(notifications.read, false)));
  return rows.length;
}
