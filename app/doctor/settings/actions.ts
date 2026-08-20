"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export type SettingsState = { error: string | null; success?: boolean };

const DEFAULT_PREFS = {
  appointment_booking: { email: true, sms: true, in_app: true },
  appointment_cancellation: { email: true, sms: true, in_app: true },
  lab_report_ready: { email: true, sms: true, in_app: true },
  follow_up_reminder: { email: true, sms: true, in_app: true },
};

export type NotificationPrefs = typeof DEFAULT_PREFS;

export async function updateNotificationPreferences(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const prefs: NotificationPrefs = { ...DEFAULT_PREFS };

  // Unchecked checkboxes are NOT submitted — so iterate every known event/channel
  // pair and read the value directly (absent => off).
  for (const event of Object.keys(DEFAULT_PREFS) as (keyof NotificationPrefs)[]) {
    for (const channel of ["email", "sms", "in_app"] as const) {
      const key = `${event}_${channel}`;
      const channels = prefs[event] as Record<string, boolean>;
      channels[channel] = formData.get(key) === "on";
    }
  }

  await db
    .update(users)
    .set({
      notificationPreferences: prefs,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/doctor/settings");
  return { error: null, success: true };
}

export async function getNotificationPreferences(): Promise<NotificationPrefs | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const [row] = await db
    .select({ prefs: users.notificationPreferences })
    .from(users)
    .where(eq(users.id, user.id));
  if (!row || !row.prefs) return DEFAULT_PREFS;
  // Merge with defaults to handle missing keys
  const merged = { ...DEFAULT_PREFS };
  const prefs = row.prefs as Partial<NotificationPrefs>;
  for (const event of Object.keys(DEFAULT_PREFS) as (keyof NotificationPrefs)[]) {
    if (prefs[event]) {
      merged[event] = { ...merged[event], ...prefs[event] };
    }
  }
  return merged;
}