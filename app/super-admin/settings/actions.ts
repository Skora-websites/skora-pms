"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { mailSettings, companySettings } from "@/lib/db/schema";
import { MAX_IMAGE_BYTES, MAX_BRAND_BYTES } from "@/lib/config";

import { audit } from "@/lib/security/audit-log";
import { encryptSecret } from "@/lib/security/crypto";

import { sendMail } from "@/lib/mail/send";

import { saveUploadedImage, deleteStoredUpload } from "@/lib/uploads/media";

/** Shared super-admin guard + result type (previously in the one big actions.ts). */
export type AdminActionResult = { error: string | null };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

// ── Settings (mail + company) ───────────────────────────────────────────────

export async function saveMailSettings(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const host = String(formData.get("host") ?? "").trim();
  const portRaw = String(formData.get("port") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const encryption = String(formData.get("encryption") ?? "").trim();
  const fromAddress = String(formData.get("from_address") ?? "").trim();
  const fromName = String(formData.get("from_name") ?? "").trim();

  if (!host) return { error: "SMTP host is required." };
  const port = Number(portRaw);
  if (!portRaw || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { error: "Port must be a valid number between 1 and 65535." };
  }
  if (fromAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
    return { error: "From address must be a valid email." };
  }

  const [existing] = await db.select().from(mailSettings).limit(1);
  const values = {
    mailer: "smtp",
    host,
    port,
    username: username || null,
    password: password ? encryptSecret(password) : existing?.password ?? null,
    encryption: encryption || null,
    fromAddress: fromAddress || null,
    fromName: fromName || null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(mailSettings).set(values).where(eq(mailSettings.id, existing.id));
  } else {
    await db.insert(mailSettings).values({ ...values, createdAt: new Date() });
  }

  void audit.settingsUpdated(admin.id, { action: "mail_settings_saved" });

  revalidatePath("/super-admin/email-setup");
  return { error: null };
}

/** Send a test email using the saved SMTP config to verify it works. */
export async function testMailSettings(): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const [mail] = await db.select().from(mailSettings).limit(1);
  if (!mail?.host) return { error: "Save SMTP settings first, then send a test email." };

  const to = admin.email;
  if (!to) return { error: "Your account has no email address to send the test to." };

  try {
    await sendMail({
      to,
      subject: "SkoraCares — SMTP test successful",
      text: `Hi ${admin.name},\n\nThis is a test email from the SkoraCares platform. Your SMTP configuration is working correctly.\n\n— SkoraCares`,
    });
  } catch (err) {
    console.error("SMTP test failed:", err);
    return { error: `SMTP test failed: ${err instanceof Error ? err.message : "unknown error"}` };
  }

  void audit.settingsUpdated(admin.id, { action: "mail_settings_test" });
  return { error: null };
}

export async function saveCompanySettings(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const trialDays = Number(text("default_trial_days"));
  if (!text("default_trial_days") || !Number.isInteger(trialDays) || trialDays < 1 || trialDays > 365) {
    return { error: "Trial days must be a whole number between 1 and 365." };
  }

  const [existing] = await db.select().from(companySettings).limit(1);

  const uploads: Record<"light_logo" | "dark_logo" | "favicon", string | null> = {
    light_logo: existing?.lightLogo ?? null,
    dark_logo: existing?.darkLogo ?? null,
    favicon: existing?.favicon ?? null,
  };
  const subdirs: Record<keyof typeof uploads, string> = {
    light_logo: "company",
    dark_logo: "company",
    favicon: "company",
  };
  for (const key of ["light_logo", "dark_logo", "favicon"] as const) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        uploads[key] = await saveUploadedImage(file, subdirs[key], MAX_BRAND_BYTES);
      } catch (err) {
        return { error: err instanceof Error ? err.message : `Could not save the ${key} file.` };
      }
    }
  }

  const values = {
    companyName: text("company_name") || null,
    companyShortName: text("company_short_name") || null,
    companyTagline: text("company_tagline") || null,
    companyDescription: text("company_description") || null,
    lightLogo: uploads.light_logo,
    darkLogo: uploads.dark_logo,
    favicon: uploads.favicon,
    companyEmail1: text("company_email1") || null,
    companyEmail2: text("company_email2") || null,
    companyMobile1: text("company_mobile1") || null,
    companyMobile2: text("company_mobile2") || null,
    companyWhatsapp1: text("company_whatsapp1") || null,
    companyWhatsapp2: text("company_whatsapp2") || null,
    facebook: text("facebook") || null,
    twitter: text("twitter") || null,
    linkedin: text("linkedin") || null,
    instagram: text("instagram") || null,
    pintrest: text("pintrest") || null,
    map: text("map") || null,
    companyAddress1: text("company_address1") || null,
    companyAddress2: text("company_address2") || null,
    currencyName: text("currency_name") || null,
    currencySymbol: text("currency_symbol") || null,
    defaultTrialDays: trialDays,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(companySettings).set(values).where(eq(companySettings.id, existing.id));
    if (uploads.light_logo !== existing.lightLogo) await deleteStoredUpload(existing.lightLogo);
    if (uploads.dark_logo !== existing.darkLogo) await deleteStoredUpload(existing.darkLogo);
    if (uploads.favicon !== existing.favicon) await deleteStoredUpload(existing.favicon);
  } else {
    await db.insert(companySettings).values({ ...values, createdAt: new Date() });
  }

  void audit.settingsUpdated(admin.id, { action: "company_settings_saved" });

  revalidatePath("/super-admin/settings");
  return { error: null };
}
