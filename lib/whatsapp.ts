/**
 * WhatsApp messaging helper — mirrors the legacy Laravel
 * `AppointmentController` integration with the WhatsApp API at
 * https://whatsapp.rajatmarketingss.online/api/create-message
 *
 * This is a plain server-side module (NOT "use server") so it can be
 * imported from server actions, API routes, and jobs alike.
 *
 * Credentials come from env vars WHATSAPP_APPKEY / WHATSAPP_AUTHKEY
 * (legacy `config/services.php` reads the same names).
 */

const WHATSAPP_API_URL = "https://whatsapp.rajatmarketingss.online/api/create-message";

/**
 * Normalize an Indian mobile number for the WhatsApp API:
 * - strips non-digits
 * - prepends +91 when missing
 */
export function normalizeMobile(mobile: string | null | undefined): string | null {
  if (!mobile) return null;
  const digits = mobile.replace(/[^0-9]/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return digits.startsWith("+") ? `+${digits}` : `+91${digits}`;
}

/**
 * Send a WhatsApp message via the multipart create-message endpoint.
 * Failures are logged and swallowed so messaging never blocks the
 * caller's primary operation (mirrors legacy try/catch).
 */
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const appkey = process.env.WHATSAPP_APPKEY;
  const authkey = process.env.WHATSAPP_AUTHKEY;
  if (!appkey || !authkey) {
    console.warn("[whatsapp] WHATSAPP_APPKEY / WHATSAPP_AUTHKEY not set; skipping send.");
    return { ok: false, error: "WhatsApp not configured" };
  }

  try {
    const form = new FormData();
    form.append("appkey", appkey);
    form.append("authkey", authkey);
    form.append("to", to);
    form.append("message", message);
    form.append("sandbox", "false");

    const res = await fetch(WHATSAPP_API_URL, { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[whatsapp] HTTP ${res.status}: ${body.slice(0, 300)}`);
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[whatsapp] send failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Appointment-related message builders mirroring the legacy controller.
 */

export function appointmentUpdateMessage(input: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone?: string | null;
  consultationFee?: string | number | null;
}): string {
  const {
    patientName,
    doctorName,
    date,
    time,
    clinicName,
    clinicAddress,
    clinicPhone,
    consultationFee,
  } = input;
  let msg = `Dear ${patientName},\n`;
  msg += `Your appointment with Dr. ${doctorName} has been UPDATED.\n\n`;
  msg += `📅 New Date: ${date}\n`;
  msg += `⏰ New Time: ${time}\n`;
  msg += `🏥 Clinic/Hospital: ${clinicName}\n`;
  msg += `📍 Address: ${clinicAddress}\n`;
  if (clinicPhone) msg += `📞 Contact: ${clinicPhone}\n`;
  if (consultationFee) msg += `💰 Consultation Fee: ₹${Number(consultationFee).toFixed(2)}\n`;
  msg += `\nRegards,\nTeam SkoraCares`;
  return msg;
}

export function appointmentCancelMessage(input: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  clinicName: string;
  clinicAddress: string;
}): string {
  const { patientName, doctorName, date, time, clinicName, clinicAddress } = input;
  return (
    `Dear ${patientName},\n\n` +
    `Your appointment with Dr. ${doctorName} on ${date} at ${time} has been **CANCELLED** by the doctor.\n\n` +
    `If this was unintentional, please contact us immediately.\n\n` +
    `Clinic: ${clinicName}\nAddress: ${clinicAddress}\n\n` +
    `Regards,\nTeam SkoraCares`
  );
}

export function appointmentDeleteMessage(input: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}): string {
  const { patientName, doctorName, date, time } = input;
  return (
    `🗑️ *Appointment Deleted*\n\n` +
    `Dear ${patientName},\n\n` +
    `Your appointment with Dr. ${doctorName} has been deleted from the system.\n\n` +
    `📅 *Date:* ${date}\n` +
    `⏰ *Time:* ${time}\n\n` +
    `If you believe this is a mistake, please contact the clinic.\n\n` +
    `Regards,\nTeam SkoraCares`
  );
}
