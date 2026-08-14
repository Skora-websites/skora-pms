"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentConsultConsents } from "@/lib/db/schema";
import { authRateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit-log";
import { consentSchema } from "@/lib/validation";

export type ConsentState = { error: string | null };

export async function respondConsent(
  _prev: ConsentState,
  formData: FormData
): Promise<ConsentState> {
  const slug = String(formData.get("slug") ?? "");
  const decision = String(formData.get("decision") ?? "");

  const parsed = consentSchema.safeParse({ slug, decision });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const { allowed, retryAfterMs } = authRateLimit.consent(slug);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return { error: `Too many attempts. Try again in ${minutes} minute(s).` };
  }

  const [row] = await db
    .select({ id: appointmentConsultConsents.id, doctorId: appointmentConsultConsents.doctorId })
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.slug, slug));

  if (!row) {
    await audit.consentRevoked({ slug, decision, reason: "not_found" });
    return { error: "Consent record not found." };
  }

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

  if (decision === "accept") {
    await audit.consentGiven({ slug, consentId: row.id, doctorId: row.doctorId });
  } else {
    await audit.consentRevoked({ slug, consentId: row.id, doctorId: row.doctorId });
  }

  revalidatePath(`/my-consent/${slug}`);
  return { error: null };
}
