"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations, prescriptionRefillRequests, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { notifyUser } from "@/lib/notifications";

export type RefillRequestState = { error: string | null; success: boolean };

export async function requestPrescriptionRefill(
  _prev: RefillRequestState,
  formData: FormData
): Promise<RefillRequestState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "patient") return { error: "Only patients can request refills.", success: false };

  const consultationId = Number(formData.get("consultation_id"));
  const medicationName = String(formData.get("medication_name") ?? "").trim() || null;
  const quantity = Number(formData.get("quantity") ?? 1);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!Number.isInteger(consultationId) || consultationId <= 0) {
    return { error: "Invalid prescription.", success: false };
  }

  const [consultation] = await db
    .select({ id: consultations.id, doctorId: consultations.doctorId, patientId: consultations.patientId, prescriptionStatus: consultations.prescriptionStatus })
    .from(consultations)
    .where(and(eq(consultations.id, consultationId), eq(consultations.patientId, user.id)));
  if (!consultation) return { error: "Prescription not found.", success: false };
  if (consultation.prescriptionStatus === "cancelled") {
    return { error: "This prescription is cancelled and cannot be refilled.", success: false };
  }

  await db.insert(prescriptionRefillRequests).values({
    consultationId,
    patientId: user.id,
    doctorId: consultation.doctorId,
    medicationName,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    note,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  void notifyUser({
    userId: consultation.doctorId,
    title: "Prescription refill requested",
    message: `${user.name} requested a refill${medicationName ? ` for ${medicationName}` : ""}.`,
    type: "info",
    link: "/doctor/consultations",
  });

  revalidatePath("/patient/prescriptions");
  revalidatePath("/patient/records");
  return { error: null, success: true };
}
