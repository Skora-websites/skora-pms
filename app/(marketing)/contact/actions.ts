"use server";

export type DemoBookingState = { success: boolean; error: string | null };

export async function bookDemo(
  _prev: DemoBookingState,
  formData: FormData
): Promise<DemoBookingState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !email || !phone) {
    return { success: false, error: "Please fill in your name, email and phone number." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // TODO: persist lead + send notification email (mail provider integration).
  // For now the request is acknowledged and forwarded via your preferred channel.
  console.info("[demo-booking]", { name, email, phone, clinic: formData.get("clinic"), message: formData.get("message") });

  return { success: true, error: null };
}
