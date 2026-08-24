"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorClinics, doctorSchedules } from "@/lib/db/schema";
import { requireDoctorPermission } from "@/lib/auth/server-permissions";
import { audit } from "@/lib/security/audit-log";

export type ScheduleActionResult = { error: string | null };

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const SESSION_TYPES = ["morning", "afternoon", "evening", "night", "full_day"] as const;
const ADDRESS_TYPES = ["manual", "map"] as const;

const DATE_SAFE = /^[a-zA-Z0-9._-]+$/;
const LOGO_DIR = path.join(process.cwd(), "storage", "uploads", "clinic");

function sniffImage(bytes: Buffer): "jpg" | "png" | "webp" | "gif" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  if (
    bytes.length >= 6 &&
    (bytes.subarray(0, 6).toString("latin1") === "GIF87a" ||
      bytes.subarray(0, 6).toString("latin1") === "GIF89a")
  ) {
    return "gif";
  }
  return null;
}

async function saveLogo(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 2 * 1024 * 1024) throw new Error("Clinic logo must be under 2 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(LOGO_DIR, { recursive: true });
  await fs.writeFile(path.join(LOGO_DIR, filename), bytes);
  return `clinic/${filename}`;
}

async function deleteLogo(storedPath: string | null) {
  if (!storedPath) return;
  if (!DATE_SAFE.test(storedPath)) return;
  fs.unlink(path.join(process.cwd(), "storage", "uploads", storedPath)).catch(() => undefined);
}

// ── Clinic CRUD ────────────────────────────────────────────────────────────

export async function createClinic(
  _prev: ScheduleActionResult,
  formData: FormData
): Promise<ScheduleActionResult> {
  const doctorId = await requireDoctorPermission("schedule-create");
  if (!doctorId) return { error: "You don't have permission to create clinics." };
  const clinicName = String(formData.get("clinic_name") ?? "").trim();
  const addressType = String(formData.get("address_type") ?? "manual");
  const address = String(formData.get("address") ?? "").trim();
  const latitude = String(formData.get("latitude") ?? "").trim() || null;
  const longitude = String(formData.get("longitude") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const consultationFee = String(formData.get("consultation_fee") ?? "").trim();

  if (!clinicName) return { error: "Clinic name is required." };
  if (clinicName.length > 255) return { error: "Clinic name must be at most 255 characters." };
  if (!(ADDRESS_TYPES as readonly string[]).includes(addressType)) {
    return { error: "Invalid address type." };
  }
  if (addressType === "manual" && !address) return { error: "Address is required for manual address." };
  if (addressType === "map" && (!latitude || !longitude)) {
    return { error: "Latitude and longitude are required for map address." };
  }
  if (!phone) return { error: "Phone is required." };
  if (phone.length > 20) return { error: "Phone must be at most 20 characters." };
  const feeNum = Number(consultationFee);
  if (!consultationFee || !Number.isFinite(feeNum) || feeNum < 0) {
    return { error: "Consultation fee must be a valid non-negative amount." };
  }

  let logoPath: string | null = null;
  const logo = formData.get("clinic_logo") as File | null;
  if (logo && logo.size > 0) {
    try {
      logoPath = await saveLogo(logo);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the logo." };
    }
  }

  const [clinic] = await db
    .insert(doctorClinics)
    .values({
      doctorId,
      clinicName,
      addressType: addressType as never,
      address: addressType === "map" && !address ? `Map Location: ${latitude}, ${longitude}` : address,
      latitude,
      longitude,
      phone,
      consultationFee: feeNum.toFixed(2),
      clinicLogo: logoPath,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.fileUploaded(doctorId, { action: "clinic_created", clinicId: Number(clinic.id) });

  revalidatePath("/doctor/schedule");
  return { error: null };
}

export async function updateClinic(
  _prev: ScheduleActionResult,
  formData: FormData
): Promise<ScheduleActionResult> {
  const doctorId = await requireDoctorPermission("schedule-edit");
  if (!doctorId) return { error: "You don't have permission to edit clinics." };
  const clinicId = Number(formData.get("id"));
  const clinicName = String(formData.get("clinic_name") ?? "").trim();
  const addressType = String(formData.get("address_type") ?? "manual");
  const address = String(formData.get("address") ?? "").trim();
  const latitude = String(formData.get("latitude") ?? "").trim() || null;
  const longitude = String(formData.get("longitude") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const consultationFee = String(formData.get("consultation_fee") ?? "").trim();

  if (!clinicId || !Number.isInteger(clinicId)) return { error: "Invalid clinic ID." };
  if (!clinicName) return { error: "Clinic name is required." };
  if (!(ADDRESS_TYPES as readonly string[]).includes(addressType)) {
    return { error: "Invalid address type." };
  }
  if (addressType === "manual" && !address) return { error: "Address is required for manual address." };
  if (addressType === "map" && (!latitude || !longitude)) {
    return { error: "Latitude and longitude are required for map address." };
  }
  if (!phone) return { error: "Phone is required." };
  const feeNum = Number(consultationFee);
  if (!Number.isFinite(feeNum) || feeNum < 0) {
    return { error: "Consultation fee must be a valid non-negative amount." };
  }

  const [existing] = await db
    .select({ id: doctorClinics.id, clinicLogo: doctorClinics.clinicLogo })
    .from(doctorClinics)
    .where(and(eq(doctorClinics.id, clinicId), eq(doctorClinics.doctorId, doctorId)));
  if (!existing) return { error: "Clinic not found." };

  let logoPath = existing.clinicLogo;
  const logo = formData.get("clinic_logo") as File | null;
  if (logo && logo.size > 0) {
    try {
      logoPath = await saveLogo(logo);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the logo." };
    }
  }

  await db
    .update(doctorClinics)
    .set({
      clinicName,
      addressType: addressType as never,
      address: addressType === "map" && !address ? `Map Location: ${latitude}, ${longitude}` : address,
      latitude,
      longitude,
      phone,
      consultationFee: feeNum.toFixed(2),
      clinicLogo: logoPath,
      updatedAt: new Date(),
    })
    .where(eq(doctorClinics.id, clinicId));

  if (logoPath !== existing.clinicLogo) await deleteLogo(existing.clinicLogo);

  void audit.fileUploaded(doctorId, { action: "clinic_updated", clinicId });

  revalidatePath("/doctor/schedule");
  return { error: null };
}

export async function deleteClinic(clinicId: number): Promise<ScheduleActionResult> {
  const doctorId = await requireDoctorPermission("schedule-delete");
  if (!doctorId) return { error: "You don't have permission to delete clinics." };
  if (!clinicId || !Number.isInteger(clinicId)) return { error: "Invalid clinic ID." };

  const [existing] = await db
    .select({ id: doctorClinics.id, clinicLogo: doctorClinics.clinicLogo })
    .from(doctorClinics)
    .where(and(eq(doctorClinics.id, clinicId), eq(doctorClinics.doctorId, doctorId)));
  if (!existing) return { error: "Clinic not found." };

  // Legacy parity: deactivate schedules, then delete the clinic.
  await db
    .update(doctorSchedules)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(doctorSchedules.doctorClinicId, clinicId));
  await db.delete(doctorClinics).where(eq(doctorClinics.id, clinicId));

  await deleteLogo(existing.clinicLogo);

  void audit.fileUploaded(doctorId, { action: "clinic_deleted", clinicId });

  revalidatePath("/doctor/schedule");
  return { error: null };
}

// ── Schedule CRUD ──────────────────────────────────────────────────────────

function calculateDuration(startTime: string, endTime: string): { hours: number; minutes: number } {
  const parse = (t: string) => {
    const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return null;
    let h = Number(m[1]);
    const min = Number(m[2]);
    const meridiem = m[3]?.toUpperCase();
    if (meridiem) {
      if (h < 1 || h > 12) return null;
      if (meridiem === "PM" && h !== 12) h += 12;
      if (meridiem === "AM" && h === 12) h = 0;
    } else if (h > 23) {
      return null;
    }
    if (min > 59) return null;
    return h * 60 + min;
  };
  const start = parse(startTime);
  const end = parse(endTime);
  if (start === null || end === null) return { hours: 0, minutes: 0 };
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  return { hours: Math.floor(diff / 60), minutes: diff % 60 };
}

/** Verify the clinic belongs to the doctor. */
async function ensureClinicOfDoctor(clinicId: number, doctorId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: doctorClinics.id })
    .from(doctorClinics)
    .where(and(eq(doctorClinics.id, clinicId), eq(doctorClinics.doctorId, doctorId)));
  return !!row;
}

/** Create/replace weekly slots for a clinic. Mirrors legacy `storeSchedule`. */
export async function saveSchedules(
  _prev: ScheduleActionResult,
  formData: FormData
): Promise<ScheduleActionResult> {
  const doctorId = await requireDoctorPermission("schedule-create");
  if (!doctorId) return { error: "You don't have permission to manage schedules." };
  const clinicId = Number(formData.get("doctor_clinic_id"));
  const is24Hours = formData.get("is_24_hours") === "1" || formData.get("is_24_hours") === "true";
  const days = (formData.get("days") ?? "")
    .toString()
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  const maxPatients = Number(formData.get("max_patients") ?? "10");
  const slotDuration = Number(formData.get("slot_duration") ?? "0");
  const gapDuration = Number(formData.get("gap_duration") ?? "0");
  const sessionTypes = (formData.get("session_types") ?? "")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!clinicId || !Number.isInteger(clinicId)) return { error: "Invalid clinic." };
  if (!(await ensureClinicOfDoctor(clinicId, doctorId))) return { error: "Clinic not found." };
  if (days.length === 0) return { error: "Select at least one day." };
  for (const day of days) {
    if (!(DAYS as readonly string[]).includes(day)) return { error: `Invalid day: ${day}` };
  }
  if (!Number.isInteger(maxPatients) || maxPatients < 1) {
    return { error: "Max patients must be at least 1." };
  }
  if (!Number.isInteger(slotDuration) || slotDuration < 0) {
    return { error: "Slot duration must be 0 or more minutes." };
  }
  if (!Number.isInteger(gapDuration) || gapDuration < 0) {
    return { error: "Gap duration must be 0 or more minutes." };
  }

  for (const day of days) {
    if (is24Hours) {
      const data = {
        doctorClinicId: clinicId,
        dayOfWeek: day as never,
        sessionType: "full_day" as never,
        maxPatients,
        is24Hours: true,
        startTime: null,
        endTime: null,
        durationHours: 24,
        durationMinutes: 0,
        breakStartTime: null,
        breakEndTime: null,
        slotDuration,
        gapDuration,
        isActive: true,
        updatedAt: new Date(),
      };
      const [existing] = await db
        .select({ id: doctorSchedules.id })
        .from(doctorSchedules)
        .where(
          and(
            eq(doctorSchedules.doctorClinicId, clinicId),
            eq(doctorSchedules.dayOfWeek, day as never),
            eq(doctorSchedules.sessionType, "full_day" as never)
          )
        );
      if (existing) {
        await db.update(doctorSchedules).set(data).where(eq(doctorSchedules.id, existing.id));
      } else {
        await db.insert(doctorSchedules).values({ ...data, createdAt: new Date() });
      }
      await db
        .update(doctorSchedules)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(doctorSchedules.doctorClinicId, clinicId),
            eq(doctorSchedules.dayOfWeek, day as never),
            eq(doctorSchedules.sessionType, "full_day" as never),
            eq(doctorSchedules.isActive, true)
          )
        );
    } else {
      if (sessionTypes.length === 0) return { error: "Select at least one session type." };
      for (const sessionType of sessionTypes) {
        if (!(SESSION_TYPES as readonly string[]).includes(sessionType)) {
          return { error: `Invalid session type: ${sessionType}` };
        }
        const startTime = String(formData.get(`${sessionType}_start_time`) ?? "").trim();
        const endTime = String(formData.get(`${sessionType}_end_time`) ?? "").trim();
        if (!startTime || !endTime) continue;
        const duration = calculateDuration(startTime, endTime);
        const data = {
          doctorClinicId: clinicId,
          dayOfWeek: day as never,
          sessionType: sessionType as never,
          maxPatients,
          is24Hours: false,
          startTime,
          endTime,
          durationHours: duration.hours,
          durationMinutes: duration.minutes,
          breakStartTime: null,
          breakEndTime: null,
          slotDuration,
          gapDuration,
          isActive: true,
          updatedAt: new Date(),
        };
        const [existing] = await db
          .select({ id: doctorSchedules.id })
          .from(doctorSchedules)
          .where(
            and(
              eq(doctorSchedules.doctorClinicId, clinicId),
              eq(doctorSchedules.dayOfWeek, day as never),
              eq(doctorSchedules.sessionType, sessionType as never)
            )
          );
        if (existing) {
          await db.update(doctorSchedules).set(data).where(eq(doctorSchedules.id, existing.id));
        } else {
          await db.insert(doctorSchedules).values({ ...data, createdAt: new Date() });
        }
      }
    }
  }

  void audit.fileUploaded(doctorId, { action: "schedule_saved", clinicId, days, is24Hours });

  revalidatePath("/doctor/schedule");
  return { error: null };
}

/** Update a single weekly slot. Mirrors legacy `updateSchedule`. */
export async function updateSchedule(
  _prev: ScheduleActionResult,
  formData: FormData
): Promise<ScheduleActionResult> {
  const doctorId = await requireDoctorPermission("schedule-edit");
  if (!doctorId) return { error: "You don't have permission to edit schedules." };
  const scheduleId = Number(formData.get("id"));
  const startTime = String(formData.get("start_time") ?? "").trim() || null;
  const endTime = String(formData.get("end_time") ?? "").trim() || null;
  const sessionType = String(formData.get("session_type") ?? "");
  const maxPatients = Number(formData.get("max_patients") ?? "10");
  const is24Hours = formData.get("is_24_hours") === "1" || formData.get("is_24_hours") === "true";
  const slotDuration = Number(formData.get("slot_duration") ?? "0");
  const gapDuration = Number(formData.get("gap_duration") ?? "0");

  if (!scheduleId || !Number.isInteger(scheduleId)) return { error: "Invalid schedule ID." };
  if (!(SESSION_TYPES as readonly string[]).includes(sessionType)) {
    return { error: "Invalid session type." };
  }
  if (!Number.isInteger(maxPatients) || maxPatients < 1) {
    return { error: "Max patients must be at least 1." };
  }

  // Ownership via clinic join.
  const [rows] = await db
    .select({ id: doctorSchedules.id, doctorClinicId: doctorSchedules.doctorClinicId })
    .from(doctorSchedules)
    .innerJoin(doctorClinics, eq(doctorClinics.id, doctorSchedules.doctorClinicId))
    .where(
      and(eq(doctorSchedules.id, scheduleId), eq(doctorClinics.doctorId, doctorId))
    );
  if (!rows) return { error: "Schedule not found." };

  const duration = !is24Hours && startTime && endTime ? calculateDuration(startTime, endTime) : { hours: 0, minutes: 0 };

  await db
    .update(doctorSchedules)
    .set({
      sessionType: sessionType as never,
      maxPatients,
      is24Hours,
      durationHours: duration.hours,
      durationMinutes: duration.minutes,
      slotDuration,
      gapDuration,
      startTime: is24Hours ? null : startTime,
      endTime: is24Hours ? null : endTime,
      updatedAt: new Date(),
    })
    .where(eq(doctorSchedules.id, scheduleId));

  void audit.fileUploaded(doctorId, { action: "schedule_updated", scheduleId });

  revalidatePath("/doctor/schedule");
  return { error: null };
}

/** Soft-delete a weekly slot. Mirrors legacy `destroySchedule`. */
export async function deleteSchedule(scheduleId: number): Promise<ScheduleActionResult> {
  const doctorId = await requireDoctorPermission("schedule-delete");
  if (!doctorId) return { error: "You don't have permission to delete schedules." };
  if (!scheduleId || !Number.isInteger(scheduleId)) return { error: "Invalid schedule ID." };

  const [rows] = await db
    .select({ id: doctorSchedules.id })
    .from(doctorSchedules)
    .innerJoin(doctorClinics, eq(doctorClinics.id, doctorSchedules.doctorClinicId))
    .where(
      and(eq(doctorSchedules.id, scheduleId), eq(doctorClinics.doctorId, doctorId))
    );
  if (!rows) return { error: "Schedule not found." };

  await db
    .update(doctorSchedules)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(doctorSchedules.id, scheduleId));

  void audit.fileUploaded(doctorId, { action: "schedule_deleted", scheduleId });

  revalidatePath("/doctor/schedule");
  return { error: null };
}