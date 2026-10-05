"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businessClinics,
  clinicDoctors,
  doctorClinics,
  users,
} from "@/lib/db/schema";
import { requireAdminPermission } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { audit } from "@/lib/security/audit-log";
import { isDupKey } from "@/lib/db/dup";

export type ClinicActionResult = { error: string | null };

const ADDRESS_TYPES = ["manual", "map"] as const;

function parseClinicForm(formData: FormData):
  | { error: string }
  | {
      clinicName: string;
      addressType: (typeof ADDRESS_TYPES)[number];
      address: string;
      latitude: string | null;
      longitude: string | null;
      phone: string;
      fee: string;
    } {
  const clinicName = String(formData.get("clinic_name") ?? "").trim();
  const addressTypeRaw = String(formData.get("address_type") ?? "manual");
  const address = String(formData.get("address") ?? "").trim();
  const latitude = String(formData.get("latitude") ?? "").trim() || null;
  const longitude = String(formData.get("longitude") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const fee = String(formData.get("consultation_fee") ?? "").trim();

  if (!clinicName) return { error: "Clinic name is required." };
  if (clinicName.length > 255) return { error: "Clinic name must be at most 255 characters." };
  if (!(ADDRESS_TYPES as readonly string[]).includes(addressTypeRaw)) {
    return { error: "Invalid address type." };
  }
  const addressType = addressTypeRaw as (typeof ADDRESS_TYPES)[number];
  if (addressType === "manual" && !address) return { error: "Address is required for manual address." };
  if (addressType === "map" && (!latitude || !longitude)) {
    return { error: "Latitude and longitude are required for map address." };
  }
  if (!phone) return { error: "Phone is required." };
  if (phone.length > 20) return { error: "Phone must be at most 20 characters." };
  const feeNum = Number(fee);
  if (!fee || !Number.isFinite(feeNum) || feeNum < 0) {
    return { error: "Consultation fee must be a valid non-negative amount." };
  }

  return {
    clinicName,
    addressType,
    // Map locations without a typed address synthesize one (doctor-module parity).
    address: addressType === "map" && !address ? `Map Location: ${latitude}, ${longitude}` : address,
    latitude,
    longitude,
    phone,
    fee: feeNum.toFixed(2),
  };
}

/**
 * Create a clinic under the owner's business. Every clinic row requires an
 * owning doctor (doctor_clinics.doctor_id NOT NULL) — the form offers the
 * doctors active at the business's clinics, pre-filled with the first scoped
 * doctor (the same anchoring requireWriteScope uses for new records).
 * Clinic row + owner membership + business link are written in one
 * transaction so a clinic never exists half-wired.
 */
export async function createClinic(
  _prev: ClinicActionResult,
  formData: FormData
): Promise<ClinicActionResult> {
  const guard = await requireAdminPermission("clinics", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can add clinics." };

  const parsed = parseClinicForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const ownerId = Number(formData.get("doctor_id"));
  if (!Number.isInteger(ownerId) || ownerId <= 0) return { error: "Select the owning doctor." };

  const scope = await getBusinessScope();
  const businessId = scope.businessIds[0];
  if (!businessId) return { error: "No business found for your account." };

  // The owning doctor must already belong to the business (active member of
  // one of its clinics or a clinic owner) — never an arbitrary user id.
  const [doctor] = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(and(eq(users.id, ownerId), eq(users.role, "doctor"), eq(users.status, "active")))
    .limit(1);
  if (!doctor) return { error: "That doctor is not an active account." };
  if (!scope.doctorIds.includes(ownerId)) {
    return { error: "That doctor is not part of your business." };
  }

  try {
    await db.transaction(async (tx) => {
      const [clinic] = await tx
        .insert(doctorClinics)
        .values({
          doctorId: ownerId,
          clinicName: parsed.clinicName,
          addressType: parsed.addressType as never,
          address: parsed.address,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          phone: parsed.phone,
          consultationFee: parsed.fee,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .$returningId();
      const clinicId = Number(clinic.id);

      // The clinic owner always holds a membership row (clinic-module invariant).
      await tx.insert(clinicDoctors).values({
        clinicId,
        doctorId: ownerId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Primary = the business's first clinic; later ones are branches.
      const existing = await tx
        .select({ id: businessClinics.id })
        .from(businessClinics)
        .where(eq(businessClinics.businessId, businessId))
        .limit(1);
      await tx.insert(businessClinics).values({
        businessId,
        clinicId,
        isPrimary: existing.length === 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  } catch (err) {
    if (isDupKey(err)) return { error: "A clinic with these details already exists." };
    return { error: "Could not create the clinic. Please try again." };
  }

  audit.settingsUpdated(guard.user.id, {
    action: "clinic_created",
    clinicName: parsed.clinicName,
    ownerDoctorId: ownerId,
    businessId,
  });

  revalidatePath("/admin/clinics");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  return { error: null };
}

/**
 * Edit a clinic's profile. Ownership = the clinic is inside the owner's
 * business scope; the owning doctor is not changed on edit (doctor-module
 * parity — reassigning ownership is not a profile edit).
 */
export async function updateClinic(
  _prev: ClinicActionResult,
  formData: FormData
): Promise<ClinicActionResult> {
  const guard = await requireAdminPermission("clinics", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can edit clinics." };

  const clinicId = Number(formData.get("id"));
  if (!clinicId || !Number.isInteger(clinicId)) return { error: "Invalid clinic ID." };

  const parsed = parseClinicForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const scope = await getBusinessScope();
  if (!scope.clinicIds.includes(clinicId)) {
    return { error: "That clinic is not part of your business." };
  }

  try {
    await db
      .update(doctorClinics)
      .set({
        clinicName: parsed.clinicName,
        addressType: parsed.addressType as never,
        address: parsed.address,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        phone: parsed.phone,
        consultationFee: parsed.fee,
        updatedAt: new Date(),
      })
      .where(eq(doctorClinics.id, clinicId));
  } catch {
    return { error: "Could not update the clinic. Please try again." };
  }

  audit.settingsUpdated(guard.user.id, { action: "clinic_updated", clinicId });

  revalidatePath("/admin/clinics");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  return { error: null };
}

/**
 * Soft delete (deactivate) / restore. The clinic row, its schedules and its
 * memberships all stay in the database — an inactive clinic simply drops out
 * of patient booking and the active-clinic queries, and can be re-activated
 * later. Reversible by design for a business owner.
 */
export async function setClinicActive(
  _prev: ClinicActionResult,
  formData: FormData
): Promise<ClinicActionResult> {
  const guard = await requireAdminPermission("clinics", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can change clinic status." };

  const clinicId = Number(formData.get("id"));
  const isActive = formData.get("is_active") === "true";
  if (!clinicId || !Number.isInteger(clinicId)) return { error: "Invalid clinic ID." };

  const scope = await getBusinessScope();
  if (!scope.clinicIds.includes(clinicId)) {
    return { error: "That clinic is not part of your business." };
  }

  const [existing] = await db
    .select({ id: doctorClinics.id, isActive: doctorClinics.isActive })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId))
    .limit(1);
  if (!existing) return { error: "Clinic not found." };
  if ((existing.isActive ?? true) === isActive) {
    return { error: isActive ? "Clinic is already active." : "Clinic is already inactive." };
  }

  await db
    .update(doctorClinics)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(doctorClinics.id, clinicId));

  audit.settingsUpdated(guard.user.id, { action: isActive ? "clinic_activated" : "clinic_deactivated", clinicId });

  revalidatePath("/admin/clinics");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  return { error: null };
}

/** Doctor options for the create form: active doctors of the scoped clinics. */
export async function clinicDoctorOptions(): Promise<{ id: number; name: string }[]> {
  const scope = await getBusinessScope();
  if (scope.doctorIds.length === 0) return [];
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.role, "doctor"), inArray(users.id, scope.doctorIds)))
    .orderBy(users.id);
  return rows;
}
