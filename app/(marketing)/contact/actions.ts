"use server";

import { authRateLimit } from "@/lib/security/rate-limit";
import { contactSchema } from "@/lib/validation";

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

  // TODO: persist lead + send notification email (mail provider integration).
  console.info("[demo-booking]", { name, email, phone, message });

  return { success: true, error: null };
}
