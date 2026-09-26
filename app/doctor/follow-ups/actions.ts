"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { followUpReminders, consultations, users } from "@/lib/db/schema";
import { requireDoctorPermission } from "@/lib/auth/server-permissions";
import { ensurePatientOfDoctor } from "@/lib/auth/ownership";
import { auditLog } from "@/lib/security/audit-log";
import { notifyUser } from "@/lib/notifications";
import { todayStr } from "@/lib/utils";

export type FollowUpActionResult = { error: string | null };

const REMINDER_STATUSES = ["pending", "addressed", "cancelled"] as const;
function isReminderStatus(s: string): s is (typeof REMINDER_STATUSES)[number] {
  return (REMINDER_STATUSES as readonly string[]).includes(s);
}

/** Legal transitions for reminder statuses (addressed/cancelled are terminal). */
const REMINDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["addressed", "cancelled"],
  addressed: [],
  cancelled: [],
};

const createReminderSchema = z.object({
  patientId: z.coerce.number().int().positive("Choose a patient."),
  followUpDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid follow-up date."),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

/**
 * Create a follow-up reminder (receptionist/doctor call-list entry).
 * Distinct from consultation follow-ups — this schedules a proactive
 * follow-up for an existing patient without a new consultation.
 */
export async function createFollowUpReminder(
  _prev: FollowUpActionResult,
  formData: FormData
): Promise<FollowUpActionResult> {
  const doctorId = await requireDoctorPermission("follow-up-status-update");
  if (!doctorId) return { error: "You don't have permission to manage follow-ups." };
  const caller = await requireDoctorPermission("follow-up-list");
  if (!caller) return { error: "You don't have permission to manage follow-ups." };

  const parsed = createReminderSchema.safeParse({
    patientId: formData.get("patient_id"),
    followUpDate: formData.get("follow_up_date"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { patientId, followUpDate, note } = parsed.data;

  // Ownership: the patient must belong to this practice (referenceRoleId).
  if (!(await ensurePatientOfDoctor(doctorId, patientId))) {
    return { error: "Patient not found for this practice." };
  }
  if (followUpDate < todayStr()) {
    return { error: "Follow-up date must be today or later." };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, patientId))
    .limit(1);
  if (!user) return { error: "Patient not found." };

  await db.insert(followUpReminders).values({
    doctorId,
    patientId,
    followUpDate,
    note: note || null,
    status: "pending",
    createdBy: caller,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  void auditLog({
    userId: caller,
    action: "follow_up_reminder_created",
    metadata: { doctorId, patientId, followUpDate },
  });
  // Fire-and-forget heads-up to the practice owner.
  if (caller !== doctorId) {
    void notifyUser({
      userId: doctorId,
      title: "Follow-up scheduled",
      message: `A follow-up was scheduled for ${followUpDate}.`,
      type: "info",
      link: "/doctor/follow-ups",
    });
  }

  revalidatePath("/doctor/follow-ups");
  return { error: null };
}

/**
 * Update a consultation follow-up: capture a comment and/or reschedule the
 * follow-up date (which returns it to `pending`), or transition status
 * (addressed / no_follow_up / cancelled). Comment + status together powers
 * the full flow the page previously lacked.
 */
export async function updateFollowUpDetail(
  consultationId: number,
  input: { status?: string; comment?: string; followUpDate?: string }
): Promise<FollowUpActionResult> {
  const doctorId = await requireDoctorPermission("follow-up-status-update");
  if (!doctorId) return { error: "You don't have permission to update follow-ups." };

  const [current] = await db
    .select({ followUpStatus: consultations.followUpStatus })
    .from(consultations)
    .where(and(eq(consultations.id, consultationId), eq(consultations.doctorId, doctorId)))
    .limit(1);
  if (!current) return { error: "Follow-up not found." };

  const from = current.followUpStatus ?? "pending";
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (input.status) {
    const status = input.status;
    const allowed = { pending: ["addressed", "no_follow_up", "rescheduled", "cancelled"], addressed: [], no_follow_up: [], rescheduled: ["pending"], cancelled: [] } as Record<string, string[]>;
    const legal = allowed[from];
    if (!legal || !legal.includes(status)) {
      return { error: `Cannot move this follow-up from "${from}" to "${status}".` };
    }
    update.followUpStatus = status;
  }
  if (typeof input.comment === "string") {
    update.followUpComment = input.comment.trim() || null;
  }
  if (input.followUpDate !== undefined) {
    const date = input.followUpDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { error: "Pick a valid follow-up date." };
    }
    if (date < todayStr()) {
      return { error: "Follow-up date must be today or later." };
    }
    update.followUpDate = date;
    // Rescheduling reactivates the follow-up (legacy behaviour: the patient
    // gets a new pending target date).
    update.followUpStatus = "pending";
  }

  await db
    .update(consultations)
    .set(update)
    .where(and(eq(consultations.id, consultationId), eq(consultations.doctorId, doctorId)));

  void auditLog({
    userId: doctorId,
    action: "follow_up_status_changed",
    metadata: { consultationId, ...input },
  });
  revalidatePath("/doctor/follow-ups");
  return { error: null };
}

/** Update a follow-up reminder's status (addressed/cancelled) — reminder flow. */
export async function updateReminderStatus(
  reminderId: number,
  status: string
): Promise<FollowUpActionResult> {
  const doctorId = await requireDoctorPermission("follow-up-status-update");
  if (!doctorId) return { error: "You don't have permission to update follow-ups." };
  if (!isReminderStatus(status)) return { error: "Invalid status." };

  const [current] = await db
    .select({ status: followUpReminders.status })
    .from(followUpReminders)
    .where(and(eq(followUpReminders.id, reminderId), eq(followUpReminders.doctorId, doctorId)))
    .limit(1);
  if (!current) return { error: "Reminder not found." };

  const from = current.status ?? "pending";
  const legal = REMINDER_TRANSITIONS[from] ?? [];
  if (!legal.includes(status)) {
    return { error: `Cannot move this reminder from "${from}" to "${status}".` };
  }

  await db
    .update(followUpReminders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(followUpReminders.id, reminderId), eq(followUpReminders.doctorId, doctorId)));

  void auditLog({
    userId: doctorId,
    action: "follow_up_reminder_status_changed",
    metadata: { reminderId, from, to: status },
  });
  revalidatePath("/doctor/follow-ups");
  return { error: null };
}
