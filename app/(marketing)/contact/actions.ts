"use server";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { authRateLimit } from "@/lib/security/rate-limit";
import { contactSchema } from "@/lib/validation";
import { sendMail } from "@/lib/mail/send";
import { auditLog } from "@/lib/security/audit-log";

export type DemoBookingState = { success: boolean; error: string | null };

export async function bookDemo(
  _prev: DemoBookingState,
  formData: FormData
): Promise<DemoBookingState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const parsed = contactSchema.safeParse({ name, email, phone: phone || undefined, message });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { allowed, retryAfterMs } = authRateLimit.demo(email);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return { success: false, error: `Too many requests. Try again in ${minutes} minute(s).` };
  }

  const now = new Date();
  try {
    const [lead] = await db
      .insert(leads)
      .values({
        name,
        email,
        phone: phone || null,
        message,
        createdAt: now,
        updatedAt: now,
      })
      .$returningId();

    void auditLog({
      action: "demo_booked",
      metadata: { leadId: Number(lead.id), email, name },
    }).catch(() => undefined);

    // Notify the sales inbox in the background — failures must never block
    // the user's "thank you" confirmation.
    void sendMail({
      to: email,
      subject: "Thank you for booking a demo — SkoraCare",
      text: `Hi ${name},\n\nThanks for your interest in SkoraCare. Our team will reach out shortly to schedule your demo.\n\n— SkoraCare`,
    }).then((sent) => {
      void sendMail({
        to: process.env.DEMO_NOTIFY_EMAIL ?? "sales@example.com",
        subject: "New demo booking",
        text: `New demo request:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nMessage: ${message}`,
      }).catch(() => undefined);
      return sent;
    }).catch(() => undefined);
  } catch {
    return { success: false, error: "Could not save your request. Please try again." };
  }

  return { success: true, error: null };
}