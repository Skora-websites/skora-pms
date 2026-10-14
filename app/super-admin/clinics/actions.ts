"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { users, doctorClinics, doctorSchedules } from "@/lib/db/schema";
import { MAX_IMAGE_BYTES } from "@/lib/config";

import { audit } from "@/lib/security/audit-log";

import { saveUploadedImage, deleteStoredUpload } from "@/lib/uploads/media";

/** Shared super-admin guard + result type (previously in the one big actions.ts). */
export type AdminActionResult = { error: string | null };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

// ── Clinic CRUD ─────────────────────────────────────────────────────────────

const ADDRESS_TYPES = ["manual", "map"] as const;

async function getClinicFormData(formData: FormData) {
  const doctorId = Number(formData.get("doctor_id"));
  const clinicName = String(formData.get("clinic_name") ?? "").trim();
  const addressType = String(formData.get("address_type") ?? "manual");
  const address = String(formData.get("address") ?? "").trim();
  const latitude = String(formData.get("latitude") ?? "").trim() || null;
  const longitude = String(formData.get("longitude") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const consultationFee = String(formData.get("consultation_fee") ?? "").trim();
  const isActive = formData.get("is_active") === "1" || formData.get("is_active") === "on";
  return { doctorId, clinicName, addressType, address, latitude, longitude, phone, consultationFee, isActive };
}

function validateClinicForm(f: Awaited<ReturnType<typeof getClinicFormData>>): string | null {
  if (!Number.isInteger(f.doctorId) || f.doctorId <= 0) return { error: "Select the owning doctor." }.error;
  if (!f.clinicName) return "Clinic name is required.";
  if (f.clinicName.length > 255) return "Clinic name must be at most 255 characters.";
  if (!(ADDRESS_TYPES as readonly string[]).includes(f.addressType)) return "Invalid address type.";
  if (f.addressType === "manual" && !f.address) return "Address is required for manual address.";
  if (f.addressType === "map" && (!f.latitude || !f.longitude)) {
    return "Latitude and longitude are required for map address.";
  }
  if (!f.phone) return "Phone is required.";
  if (f.phone.length > 20) return "Phone must be at most 20 characters.";
  const feeNum = Number(f.consultationFee);
  if (!f.consultationFee || !Number.isFinite(feeNum) || feeNum < 0) {
    return "Consultation fee must be a valid non-negative amount.";
  }
  return null;
}

export async function storeClinic(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const f = await getClinicFormData(formData);
  const invalid = validateClinicForm(f);
  if (invalid) return { error: invalid };

  const [doctor] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, f.doctorId), eq(users.role, "doctor")));
  if (!doctor) return { error: "Select the owning doctor." };

  let logoPath: string | null = null;
  const logo = formData.get("clinic_logo") as File | null;
  if (logo && logo.size > 0) {
    try {
      logoPath = await saveUploadedImage(logo, "clinic");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the logo." };
    }
  }

  const [created] = await db
    .insert(doctorClinics)
    .values({
      doctorId: f.doctorId,
      clinicName: f.clinicName,
      addressType: f.addressType as never,
      address: f.addressType === "map" && !f.address ? `Map Location: ${f.latitude}, ${f.longitude}` : f.address,
      latitude: f.latitude,
      longitude: f.longitude,
      phone: f.phone,
      consultationFee: Number(f.consultationFee).toFixed(2),
      clinicLogo: logoPath,
      isActive: f.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.fileUploaded(admin.id, { action: "clinic_created", clinicId: Number(created.id), doctorId: f.doctorId });

  revalidatePath("/super-admin/clinics");
  return { error: null };
}

export async function updateClinic(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const clinicId = Number(formData.get("id"));
  if (!Number.isInteger(clinicId)) return { error: "Invalid clinic ID." };
  const f = await getClinicFormData(formData);
  const invalid = validateClinicForm(f);
  if (invalid) return { error: invalid };

  const [existing] = await db
    .select({ id: doctorClinics.id, clinicLogo: doctorClinics.clinicLogo })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId));
  if (!existing) return { error: "Clinic not found." };

  const [doctor] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, f.doctorId), eq(users.role, "doctor")));
  if (!doctor) return { error: "Select the owning doctor." };

  let logoPath = existing.clinicLogo;
  const logo = formData.get("clinic_logo") as File | null;
  if (logo && logo.size > 0) {
    try {
      logoPath = await saveUploadedImage(logo, "clinic");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the logo." };
    }
  }

  await db
    .update(doctorClinics)
    .set({
      doctorId: f.doctorId,
      clinicName: f.clinicName,
      addressType: f.addressType as never,
      address: f.addressType === "map" && !f.address ? `Map Location: ${f.latitude}, ${f.longitude}` : f.address,
      latitude: f.latitude,
      longitude: f.longitude,
      phone: f.phone,
      consultationFee: Number(f.consultationFee).toFixed(2),
      clinicLogo: logoPath,
      isActive: f.isActive,
      updatedAt: new Date(),
    })
    .where(eq(doctorClinics.id, clinicId));

  if (logoPath !== existing.clinicLogo) await deleteStoredUpload(existing.clinicLogo);

  void audit.fileUploaded(admin.id, { action: "clinic_updated", clinicId, doctorId: f.doctorId });

  revalidatePath("/super-admin/clinics");
  return { error: null };
}

export async function deleteClinic(clinicId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(clinicId)) return { error: "Invalid clinic ID." };

  const [existing] = await db
    .select({ id: doctorClinics.id, clinicLogo: doctorClinics.clinicLogo })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId));
  if (!existing) return { error: "Clinic not found." };

  // Deactivate dependent schedules + delete clinic in one transaction;
  // appointments.clinic_id is FK ON DELETE SET NULL (Phase 2 migration),
  // so their rows survive with clinic_id nulled.
  await db.transaction(async (tx) => {
    await tx
      .update(doctorSchedules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(doctorSchedules.doctorClinicId, clinicId));
    await tx.delete(doctorClinics).where(eq(doctorClinics.id, clinicId));
  });
  await deleteStoredUpload(existing.clinicLogo);

  void audit.fileUploaded(admin.id, { action: "clinic_deleted", clinicId });

  revalidatePath("/super-admin/clinics");
  return { error: null };
}
