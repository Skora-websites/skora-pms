"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  appointmentConsultConsents,
  consultations,
  billings,
  doctorClinics,
  doctorSchedules,
  users,
} from "@/lib/db/schema";
import { requireDoctorPermission } from "@/lib/auth/server-permissions";
import { ensurePatientOfDoctor, ensureAppointmentOfDoctor } from "@/lib/auth/ownership";
import { audit } from "@/lib/security/audit-log";
import { notifyUser } from "@/lib/notifications";
import { sendMail } from "@/lib/mail/send";
import { appointmentSchema } from "@/lib/validation";
import { todayStr } from "@/lib/utils";

// ── Shared helpers ────────────────────────────────────────────────────────

export type AppointmentActionResult = { error: string | null };

const CASE_TYPES = ["clinical_visit", "home_visit", "online_visit", "on_call_visit"] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CONSENT_TYPES = ["otp", "consent", "upload", "skipped", "email"];

/** "h:mm AM/PM" or "HH:MM" -> minutes since midnight, or null. */
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

/** "HH:MM" (24h) -> "h:mm AM/PM" matching legacy storage format. */
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

/** Active clinics for the doctor, optionally narrowed to clinicId. */
async function getActiveClinics(doctorId: number, clinicId?: number | null) {
  const conds = [eq(doctorClinics.doctorId, doctorId), eq(doctorClinics.isActive, true)];
  if (clinicId && Number.isInteger(clinicId)) conds.push(eq(doctorClinics.id, clinicId));
  return db.select().from(doctorClinics).where(and(...conds));
}

/** Active schedules for the doctor's clinics on a given weekday. */
async function getSchedulesForDay(doctorId: number, date: string, clinicId?: number | null) {
  const clinics = await getActiveClinics(doctorId, clinicId);
  if (clinics.length === 0) return { clinics, schedules: [] as (typeof doctorSchedules.$inferSelect)[] };
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
  return { clinics, schedules };
}

/** Does the time fall inside the schedule (handles overnight ranges)? */
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

/** Existing non-cancelled appointment at the same doctor/date/time (exclude optional id). */
async function findTimeConflict(doctorId: number, date: string, time: string, excludeId?: number) {
  const conds = [
    eq(appointments.doctorId, doctorId),
    eq(appointments.date, date as never),
    eq(appointments.time, time),
    ne(appointments.status, "cancelled"),
  ];
  if (excludeId && Number.isInteger(excludeId)) conds.push(ne(appointments.id, excludeId));
  const [row] = await db.select({ id: appointments.id }).from(appointments).where(and(...conds)).limit(1);
  return row ?? null;
}

// ── Create ────────────────────────────────────────────────────────────────

export async function createAppointment(
  _prev: AppointmentActionResult,
  formData: FormData
): Promise<AppointmentActionResult> {
  const doctorId = await requireDoctorPermission("appointments-create");
  if (!doctorId) return { error: "You don't have permission to book appointments." };
  const now = new Date();

  const patientIdRaw = String(formData.get("patient_id") ?? "").trim();
  const patientString = String(formData.get("patient_string") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const timeRaw = String(formData.get("time") ?? "").trim();
  const caseType = String(formData.get("case_type") ?? "clinical_visit").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "").trim() || null;
  const bp = String(formData.get("bp") ?? "").trim() || null;
  const weightRaw = String(formData.get("weight") ?? "").trim();
  const heightRaw = String(formData.get("height") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim() || null;
  const consentType = String(formData.get("consent_type") ?? "").trim() || null;
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim() || null;

  const parsed = appointmentSchema.safeParse({
    patientId: patientIdRaw || undefined,
    date,
    time: timeRaw,
    caseType,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // ── Business validation (mirrors legacy store) ──
  const today = todayStr(now);
  if (date < today) return { error: "Appointment date must be today or later." };

  const tMin = parseTimeToMinutes(timeRaw);
  if (tMin === null) return { error: "Invalid time." };
  if (date === today && tMin < now.getHours() * 60 + now.getMinutes()) {
    return { error: "Appointment time must be in the future." };
  }

  if (!CASE_TYPES.includes(caseType as never)) return { error: "Invalid case type." };
  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) return { error: "Invalid blood group." };
  if (consentType && !CONSENT_TYPES.includes(consentType)) return { error: "Invalid consent type." };
  if (bp && !/^\d{2,3}\/\d{2,3}$/.test(bp)) return { error: "BP must be like 120/80." };

  const weight = weightRaw ? Number(weightRaw) : null;
  const height = heightRaw ? Number(heightRaw) : null;
  if (weight !== null && (Number.isNaN(weight) || weight < 0 || weight > 500)) {
    return { error: "Invalid weight." };
  }
  if (height !== null && (Number.isNaN(height) || height < 0 || height > 300)) {
    return { error: "Invalid height." };
  }
  const digits = mobileNumber ? mobileNumber.replace(/[^0-9]/g, "") : "";
  if (mobileNumber && (digits.length < 10 || digits.length > 15)) {
    return { error: "Invalid mobile number." };
  }

  let patientId: number | null = null;
  if (patientIdRaw) {
    patientId = Number(patientIdRaw);
    if (!Number.isInteger(patientId) || patientId <= 0) return { error: "Invalid patient." };
    if (!(await ensurePatientOfDoctor(doctorId, patientId))) {
      return { error: "Patient not found for this doctor." };
    }
  }
  if (!patientId && !patientString) return { error: "Select a patient or add a walk-in name." };

  // ── Time-slot conflict (same doctor, date, time; exclude cancelled) ──
  const time = toLegacyTime(timeRaw);
  const conflict = await findTimeConflict(doctorId, date, time);
  if (conflict) return { error: `Time slot ${time} is already booked.` };

  // ── Schedule containment (mirrors legacy store) ──
  const { clinics, schedules } = await getSchedulesForDay(doctorId, date);
  if (clinics.length > 0 && schedules.length > 0) {
    const matching = schedules.find((s) => timeInSchedule(tMin, s));
    if (!matching) {
      return { error: "The selected time is outside the doctor's available schedule for this date." };
    }
  }

  // ── Status derivation (mirrors legacy store) ──
  let status: string = "pending";
  if (consentType === "consent" || consentType === "email") status = "pending_consent";
  else if (consentType === "otp" || consentType === "upload" || consentType === "skipped") status = "confirmed";

  const clinic = clinics[0] ?? null;

  const [inserted] = await db
    .insert(appointments)
    .values({
      doctorId,
      patientId,
      patientString: patientString || null,
      date: date as never,
      time,
      caseType: caseType as never,
      bloodGroup,
      bp,
      weight: weight !== null ? String(weight) : null,
      height: height !== null ? String(height) : null,
      remarks,
      consentType: (consentType as never) ?? null,
      mobileNumber,
      status: status as never,
      clinicId: clinic?.id ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .$returningId();

  const appointmentId = inserted?.id;

  // ── Consent link for consent/email types (mirrors legacy store) ──
  // Legacy requires a registered patient + mobile for consent links.
  let consentLink: string | null = null;
  if ((consentType === "consent" || consentType === "email") && appointmentId && patientId) {
    const slug = crypto.randomUUID();
    await db.insert(appointmentConsultConsents).values({
      appointmentId,
      doctorId,
      patientId,
      slug,
      isAccepted: false,
      isRejected: false,
      status: "pending_consent",
      createdAt: now,
      updatedAt: now,
    });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    consentLink = `${base}/my-consent/${slug}`;
  }

  void audit.appointmentCreated(doctorId, {
    appointmentId,
    patientId: patientId ?? null,
    patientString: patientString || null,
    date,
    time,
    caseType,
    status,
    consentType: consentType ?? null,
    consentLink,
  });

  void notifyUser({
    userId: doctorId,
    title: "New appointment booked",
    message: `${patientString || `Patient #${patientId ?? "—"}`} — ${date} at ${time} (${caseType.replace(/_/g, " ")})`,
    type: "success",
    link: "/doctor/appointments",
  });

  // Confirm the appointment with the patient by email (fire-and-forget).
  if (patientId) {
    void (async () => {
      try {
        const [patient] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, patientId));
        if (!patient?.email) return;
        await sendMail({
          to: patient.email,
          subject: "Appointment booked — SkoraCares",
          text: `Hi ${patient.name},\n\nAn appointment has been booked for you:\nDate: ${date}\nTime: ${time}\nType: ${caseType.replace(/_/g, " ")}\n${consentLink ? `\nConsent link: ${consentLink}\n` : ""}\n— SkoraCares`,
        });
      } catch {
        // Email failure must never block the booking.
      }
    })();
  }

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");

  redirect(`/doctor/appointments?created=${appointmentId ?? ""}`);
}

// ── Update ────────────────────────────────────────────────────────────────

export async function updateAppointment(
  _prev: AppointmentActionResult,
  formData: FormData
): Promise<AppointmentActionResult> {
  const doctorId = await requireDoctorPermission("appointments-edit");
  if (!doctorId) return { error: "You don't have permission to edit appointments." };
  const now = new Date();

  const appointmentIdRaw = String(formData.get("appointment_id") ?? "").trim();
  const patientIdRaw = String(formData.get("patient_id") ?? "").trim();
  const patientString = String(formData.get("patient_string") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const timeRaw = String(formData.get("time") ?? "").trim();
  const caseType = String(formData.get("case_type") ?? "clinical_visit").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "").trim() || null;
  const bp = String(formData.get("bp") ?? "").trim() || null;
  const weightRaw = String(formData.get("weight") ?? "").trim();
  const heightRaw = String(formData.get("height") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim() || null;
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim() || null;

  const appointmentId = Number(appointmentIdRaw);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return { error: "Invalid appointment ID." };
  }

  if (!(await ensureAppointmentOfDoctor(appointmentId, doctorId))) {
    return { error: "Appointment not found." };
  }

  // Business rule: completed and cancelled appointments are immutable —
  // their history must not be rewritten after the fact.
  const [current] = await db
    .select({ status: appointments.status })
    .from(appointments)
    .where(eq(appointments.id, appointmentId));
  if (current?.status === "completed") {
    return { error: "Completed appointments cannot be edited." };
  }
  if (current?.status === "cancelled") {
    return { error: "Cancelled appointments cannot be edited." };
  }

  const parsed = appointmentSchema.safeParse({
    patientId: patientIdRaw || undefined,
    date,
    time: timeRaw,
    caseType,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // ── Business validation ──
  const today = todayStr(now);
  if (date < today) return { error: "Appointment date must be today or later." };

  const tMin = parseTimeToMinutes(timeRaw);
  if (tMin === null) return { error: "Invalid time." };
  if (date === today && tMin <= now.getHours() * 60 + now.getMinutes()) {
    return { error: "Appointment time must be in the future." };
  }

  if (!CASE_TYPES.includes(caseType as never)) return { error: "Invalid case type." };
  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) return { error: "Invalid blood group." };
  if (bp && !/^\d{2,3}\/\d{2,3}$/.test(bp)) return { error: "BP must be like 120/80." };

  const weight = weightRaw ? Number(weightRaw) : null;
  const height = heightRaw ? Number(heightRaw) : null;
  if (weight !== null && (Number.isNaN(weight) || weight < 0 || weight > 500)) {
    return { error: "Invalid weight." };
  }
  if (height !== null && (Number.isNaN(height) || height < 0 || height > 300)) {
    return { error: "Invalid height." };
  }
  const digits = mobileNumber ? mobileNumber.replace(/[^0-9]/g, "") : "";
  if (mobileNumber && (digits.length < 10 || digits.length > 15)) {
    return { error: "Invalid mobile number." };
  }

  let patientId: number | null = null;
  if (patientIdRaw) {
    patientId = Number(patientIdRaw);
    if (!Number.isInteger(patientId) || patientId <= 0) return { error: "Invalid patient." };
    if (!(await ensurePatientOfDoctor(doctorId, patientId))) {
      return { error: "Patient not found for this doctor." };
    }
  }
  if (!patientId && !patientString) return { error: "Select a patient or add a walk-in name." };

  const time = toLegacyTime(timeRaw);
  const conflict = await findTimeConflict(doctorId, date, time, appointmentId);
  if (conflict) return { error: `Time slot ${time} is already booked.` };

  // ── Schedule containment ──
  const { clinics, schedules } = await getSchedulesForDay(doctorId, date);
  if (clinics.length > 0 && schedules.length > 0) {
    const matching = schedules.find((s) => timeInSchedule(tMin, s));
    if (!matching) {
      return { error: "The selected time is outside the doctor's available schedule for this date." };
    }
  }

  const clinic = clinics[0] ?? null;

  await db
    .update(appointments)
    .set({
      patientId,
      patientString: patientString || null,
      date: date as never,
      time,
      caseType: caseType as never,
      bloodGroup,
      bp,
      weight: weight !== null ? String(weight) : null,
      height: height !== null ? String(height) : null,
      remarks,
      mobileNumber,
      clinicId: clinic?.id ?? null,
      updatedAt: now,
    })
    .where(eq(appointments.id, appointmentId));

  void audit.appointmentUpdated(doctorId, {
    appointmentId,
    patientId,
    patientString: patientString || null,
    date,
    time,
    caseType,
  });

  void notifyUser({
    userId: doctorId,
    title: "Appointment updated",
    message: `${patientString || `Patient #${patientId ?? "—"}`} — ${date} at ${time}`,
    type: "info",
    link: "/doctor/appointments",
  });

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");

  redirect("/doctor/appointments?updated=true");
}

// ── Cancel ────────────────────────────────────────────────────────────────

export async function cancelAppointment(appointmentId: number): Promise<AppointmentActionResult> {
  const doctorId = await requireDoctorPermission("appointments-cancel");
  if (!doctorId) return { error: "You don't have permission to cancel appointments." };
  const now = new Date();

  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return { error: "Invalid appointment ID." };
  }

  if (!(await ensureAppointmentOfDoctor(appointmentId, doctorId))) {
    return { error: "Appointment not found." };
  }

  // Fetch the appointment for validation
  const [appt] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      patientId: appointments.patientId,
      patientString: appointments.patientString,
      mobileNumber: appointments.mobileNumber,
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentId));

  if (!appt) return { error: "Appointment not found." };

  // Compare using parseTimeToMinutes instead of new Date(legacy time format)
  const today = todayStr(now);
  const apptMinutes = parseTimeToMinutes(appt.time);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (appt.date < today || (appt.date === today && apptMinutes !== null && apptMinutes <= nowMinutes)) {
    return { error: "Cannot cancel past appointments." };
  }

  if (appt.status === "cancelled") return { error: "Appointment is already cancelled." };
  if (!["confirmed", "pending"].includes(appt.status)) {
    return { error: "Only confirmed and pending appointments can be cancelled." };
  }

  await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: now })
    .where(eq(appointments.id, appointmentId));

  void audit.appointmentCancelled(doctorId, {
    appointmentId,
    patientId: appt.patientId,
    patientString: appt.patientString,
    date: appt.date,
    time: appt.time,
  });

  void notifyUser({
    userId: doctorId,
    title: "Appointment cancelled",
    message: `${appt.patientString || `Patient #${appt.patientId ?? "—"}`} — ${appt.date} at ${appt.time}`,
    type: "warning",
    link: "/doctor/appointments",
  });

  // Notify the patient their appointment was cancelled (in-app + email).
  const cancelledPatientId = appt.patientId;
  if (cancelledPatientId) {
    void (async () => {
      try {
        const [patient] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, cancelledPatientId));
        if (patient) {
          await notifyUser({
            userId: cancelledPatientId,
            title: "Appointment cancelled",
            message: `Your appointment on ${appt.date} at ${appt.time} was cancelled.`,
            type: "warning",
            link: "/patient/appointments",
          });
          if (patient.email) {
            await sendMail({
              to: patient.email,
              subject: "Appointment cancelled — SkoraCares",
              text: `Hi ${patient.name},\n\nYour appointment on ${appt.date} at ${appt.time} has been cancelled by the clinic.\n\n— SkoraCares`,
            });
          }
        }
      } catch {
        // Notification failure must never block cancellation.
      }
    })();
  }

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");

  return { error: null };
}

// ── Complete ──────────────────────────────────────────────────────────────

export async function completeAppointment(appointmentId: number): Promise<AppointmentActionResult> {
  const doctorId = await requireDoctorPermission("appointments-complete");
  if (!doctorId) return { error: "You don't have permission to complete appointments." };
  const now = new Date();

  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return { error: "Invalid appointment ID." };
  }

  if (!(await ensureAppointmentOfDoctor(appointmentId, doctorId))) {
    return { error: "Appointment not found." };
  }

  const [appt] = await db
    .select({ id: appointments.id, status: appointments.status, patientId: appointments.patientId })
    .from(appointments)
    .where(eq(appointments.id, appointmentId));

  if (!appt) return { error: "Appointment not found." };
  if (appt.status === "completed") return { error: "Appointment is already completed." };
  if (appt.status === "cancelled") return { error: "Cannot complete cancelled appointments." };
  if (!["confirmed", "pending"].includes(appt.status)) {
    return { error: "Only confirmed or pending appointments can be marked completed." };
  }

  await db
    .update(appointments)
    .set({ status: "completed", updatedAt: now })
    .where(eq(appointments.id, appointmentId));

  void audit.appointmentUpdated(doctorId, {
    appointmentId,
    status: "completed",
  });

  // Notify the patient their visit is complete (in-app + email), fire-and-forget.
  const completedPatientId = appt.patientId;
  if (completedPatientId) {
    void (async () => {
      try {
        const [patient] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, completedPatientId));
        if (patient) {
          await notifyUser({
            userId: completedPatientId,
            title: "Visit completed",
            message: "Your appointment has been completed. Your records are available.",
            type: "success",
            link: "/patient/records",
          });
          if (patient.email) {
            await sendMail({
              to: patient.email,
              subject: "Your visit is complete — SkoraCares",
              text: `Hi ${patient.name},\n\nYour appointment has been marked complete. You can view your health records and prescriptions from your dashboard.\n\n— SkoraCares`,
            });
          }
        }
      } catch {
        // Notification failure must never block completion.
      }
    })();
  }

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");

  return { error: null };
}

// ── Delete ────────────────────────────────────────────────────────────────

export async function deleteAppointment(appointmentId: number): Promise<AppointmentActionResult> {
  const doctorId = await requireDoctorPermission("appointments-delete");
  if (!doctorId) return { error: "You don't have permission to delete appointments." };
  const now = new Date();

  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return { error: "Invalid appointment ID." };
  }

  if (!(await ensureAppointmentOfDoctor(appointmentId, doctorId))) {
    return { error: "Appointment not found." };
  }

  const [appt] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentId));

  if (!appt) return { error: "Appointment not found." };

  const today = todayStr(now);
  const apptMinutes = parseTimeToMinutes(appt.time);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isFuture =
    appt.date > today || (appt.date === today && apptMinutes !== null && apptMinutes > nowMinutes);
  const canDelete = isFuture
    ? ["pending", "pending_consent", "completed"].includes(appt.status)
    : ["completed", "cancelled"].includes(appt.status);

  if (!canDelete) {
    if (isFuture && appt.status === "confirmed") {
      return { error: "Confirmed appointments cannot be deleted directly. Please cancel first." };
    }
    if (isFuture) {
      return { error: "This appointment cannot be deleted." };
    }
    return { error: "Past appointments must be completed or cancelled before deletion." };
  }

  // Business rule / data integrity: appointments that generated clinical or
  // financial records must be retained. Deleting them would orphan
  // consultations and bills.
  const [linkedConsultation] = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(eq(consultations.appointmentId, appointmentId))
    .limit(1);
  if (linkedConsultation) {
    return { error: "This appointment has a linked consultation. Delete the consultation first or keep the record." };
  }
  const [linkedBill] = await db
    .select({ id: billings.id })
    .from(billings)
    .where(eq(billings.appointmentId, appointmentId))
    .limit(1);
  if (linkedBill) {
    return { error: "This appointment has a linked bill. Delete the bill first or keep the record." };
  }

  // Delete consent records first
  await db
    .delete(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.appointmentId, appointmentId));

  // Hard delete the appointment
  await db.delete(appointments).where(eq(appointments.id, appointmentId));

  void audit.appointmentUpdated(doctorId, {
    appointmentId,
    action: "deleted",
    date: appt.date,
    time: appt.time,
    status: appt.status,
  });

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");

  return { error: null };
}
