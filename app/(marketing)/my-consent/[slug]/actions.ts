"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentConsultConsents } from "@/lib/db/schema";

export type ConsentState = { error: string | null };

export async function respondConsent(
  _prev: ConsentState,
  formData: FormData
): Promise<ConsentState> {
  const slug = String(formData.get("slug") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!slug || !["accept", "reject"].includes(decision)) {
    return { error: "Invalid request." };
  }

  const [row] = await db
    .select({ id: appointmentConsultConsents.id })
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.slug, slug));

  if (!row) return { error: "Consent record not found." };

  const now = new Date();
  await db
    .update(appointmentConsultConsents)
    .set(
      decision === "accept"
        ? {
            isAccepted: true,
            isRejected: false,
            acceptedAt: now,
            rejectedAt: null,
            status: "confirmed",
            updatedAt: now,
          }
        : {
            isRejected: true,
            isAccepted: false,
            rejectedAt: now,
            acceptedAt: null,
            status: "cancelled",
            updatedAt: now,
          }
    )
    .where(eq(appointmentConsultConsents.id, row.id));

  revalidatePath(`/my-consent/${slug}`);
  return { error: null };
}
