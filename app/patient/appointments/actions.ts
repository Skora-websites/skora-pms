"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, doctorClinics, doctorSchedules, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { audit } from "@/lib/security/audit-log";

export type PatientBookingState = { error: string | null };

function parseTimeToMinutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
  } else {
    if (h > 23) return null;
  }
  if (min > 59) return null;
  return h * 60 + min;
}

function toLegacyTime(time: string): string {
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time;
  let h = Number(m[1]);
  const min = m[2];
  const meridiem = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${min} ${meridiem}`;
}

function weekdayName(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
}

function timeInSchedule(timeMin: number, schedule: typeof doctorSchedules.$inferSelect): boolean {
  if (schedule.is24Hours) return true;
  const start = parseTimeToMinutes(schedule.startTime ?? "");
  const end = parseTimeToMinutes(schedule.endTime ?? "");
  if (start === null || end === null) return false;
  let endAdj = end;
  if (end < start) endAdj = end + 24 * 60;
  let t = timeMin;
  if (end < start && t < start) t += 24 * 60;
  return t >= start && t <= endAdj;
}

export async function createPatientAppointment(
  _prev: PatientBookingState,
  formData: FormData
): Promise<PatientBookingState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "patient") return { error: "Only patients can book appointments." };

  const doctorId = Number(formData.get("doctor_id"));
  const date = String(formData.get("date") ?? "").trim();
  const timeRaw = String(formData.get("time") ?? "").trim();
  const caseType = String(formData.get("case_type") ?? "clinical_visit").trim();

  if (!doctorId || !Number.isInteger(doctorId) || doctorId <= 0) {
    return { error: "Please choose a doctor." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." };
  if (!/^\d{2}:\d{2}$/.test(timeRaw)) return { error: "Invalid time." };
  if (!["clinical_visit", "home_visit"].includes(caseType)) return { error: "Invalid visit type." };

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tMin = parseTimeToMinutes(timeRaw);
  if (tMin === null) return { error: "Invalid time." };
  if (date === today && tMin < now.getHours() * 60 + now.getMinutes()) {
    return { error: "Appointment time must be in the future." };
  }

  // Doctor must exist and be a doctor role.
  const [doctor] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "doctor"), eq(users.id, doctorId)))
    .limit(1);
  if (!doctor) return { error: "Doctor not found." };

  // Verify the doctor has an active clinic + schedule for this weekday.
  const clinics = await db
    .select({ id: doctorClinics.id })
    .from(doctorClinics)
    .where(and(eq(doctorClinics.doctorId, doctorId), eq(doctorClinics.isActive, true)));
  if (clinics.length === 0) return { error: "This doctor has no active clinic." };

  const schedules = await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.dayOfWeek, weekdayName(date) as never),
        eq(doctorSchedules.isActive, true),
        inArray(
          doctorSchedules.doctorClinicId,
          clinics.map((c) => c.id)
        )
      )
    );
  if (schedules.length === 0) {
    return { error: "The doctor is not available on this day. Please choose another date." };
  }
  const matching = schedules.find((s) => timeInSchedule(tMin, s));
  if (!matching) {
    return { error: "The selected time is outside the doctor's available schedule." };
  }

  // Time-slot conflict check (exclude cancelled).
  const time = toLegacyTime(timeRaw);
  const [conflict] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.date, date as never),
        eq(appointments.time, time),
        ne(appointments.status, "cancelled")
      )
    )
    .limit(1);
  if (conflict) return { error: `Time slot ${time} is already booked.` };

  await db.insert(appointments).values({
    doctorId,
    patientId: user.id,
    date: date as never,
    time,
    caseType: caseType as never,
    status: "confirmed" as never,
    consentType: "skipped",
    createdAt: now,
    updatedAt: now,
  });

  void audit.appointmentCreated(user.id, {
    source: "patient_self_service",
    doctorId,
    date,
    time,
    patientId: user.id,
  });

  revalidatePath("/patient");
  revalidatePath("/patient/appointments");
  redirect("/patient/appointments?created=1");
}

/** Patient cancels one of their own upcoming appointments. */
export async function cancelPatientAppointment(appointmentId: number): Promise<PatientBookingState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "patient") return { error: "Only patients can cancel appointments." };
  if (!appointmentId || !Number.isInteger(appointmentId)) return { error: "Invalid appointment ID." };

  const [appt] = await db
    .select({ id: appointments.id, status: appointments.status, date: appointments.date, doctorId: appointments.doctorId })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.patientId, user.id)));
  if (!appt) return { error: "Appointment not found." };
  if (appt.status === "cancelled") return { error: "Appointment is already cancelled." };
  if (appt.status === "completed") return { error: "Completed appointments cannot be cancelled." };

  await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));

  void audit.appointmentCancelled(user.id, { appointmentId, doctorId: appt.doctorId, source: "patient_cancelled" });

  revalidatePath("/patient");
  revalidatePath("/patient/appointments");
  return { error: null };
}