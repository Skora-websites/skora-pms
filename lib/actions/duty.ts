"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { auditLog } from "@/lib/security/audit-log";

/**
 * Duty-mode feature: the doctor declares their availability with one toggle.
 *
 *   off    — not on duty (neither clinic nor home visits)
 *   clinic — on duty at the clinic only
 *   home   — on duty for home visits only
 *   both   — on duty at the clinic AND for home visits
 *
 * Stored as two booleans (`clinic_on_duty`, `home_visit_on_duty`) so duty
 * types can be badged independently. The legacy `on_duty` SOS-dispatch flag
 * is intentionally NOT touched by this action.
 */
export type DutyMode = "off" | "clinic" | "home" | "both";
export type DutyActionResult = { error: string | null };

export async function setDutyMode(mode: DutyMode): Promise<DutyActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return { error: "Only doctors can change duty status." };
  }
  // Receptionists/admins act on behalf of their linked doctor.
  const doctorId = user.role === "doctor" ? user.id : (user.doctorId ?? user.id);

  const flags =
    mode === "both"
      ? { clinicOnDuty: true, homeVisitOnDuty: true }
      : mode === "clinic"
        ? { clinicOnDuty: true, homeVisitOnDuty: false }
        : mode === "home"
          ? { clinicOnDuty: false, homeVisitOnDuty: true }
          : { clinicOnDuty: false, homeVisitOnDuty: false };

  await db.update(users).set({ ...flags, updatedAt: new Date() }).where(eq(users.id, doctorId));

  void auditLog({ userId: user.id, action: "duty_mode_changed", metadata: { doctorId, mode } });

  revalidatePath("/doctor");
  revalidatePath("/doctor/schedule");
  return { error: null };
}
