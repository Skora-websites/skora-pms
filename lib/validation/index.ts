/**
 * Zod validation schemas for common input patterns.
 *
 * Every server action that accepts user input should validate against
 * the appropriate schema before processing the data.  This ensures
 * type safety at the boundary and produces user-friendly error messages.
 *
 * Usage:
 *   import { contactSchema } from "@/lib/validation";
 *   const parsed = contactSchema.parse(formData);      // throws on bad input
 *   const safe = contactSchema.safeParse(formData);     // { success, data, error }
 */

import { z } from "zod";

// ── Helpers ─────────────────────────────────────────────────────────

/** A string that is not empty after trimming. */
const nonEmpty = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`);

/** A valid email address (zod v4 top-level API). */
const email = () =>
  z
    .email("Enter a valid email address")
    .trim()
    .max(255, "Email must be at most 255 characters");

/** A valid phone number (international format, optional). */
const phone = () =>
  z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-().]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""));

/** A URL-safe slug (alphanumeric, hyphens, underscores). */
const slug = () =>
  z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid slug format");

// ── Domain schemas ──────────────────────────────────────────────────

/** Contact / demo-booking form. */
export const contactSchema = z.object({
  name: nonEmpty("Name").max(100, "Name must be at most 100 characters"),
  email: email(),
  phone: phone(),
  clinic: z.string().trim().max(255, "Clinic must be at most 255 characters").optional(),
  message: nonEmpty("Message").max(2000, "Message must be at most 2000 characters"),
});

/** Login form. */
export const loginSchema = z.object({
  email: email(),
  password: nonEmpty("Password").min(6, "Password must be at least 6 characters"),
});

/** Signup form. */
export const signupSchema = z.object({
  name: nonEmpty("Name").max(100, "Name must be at most 100 characters"),
  email: email(),
  phone: phone(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

/** Patient consent decision. */
export const consentSchema = z.object({
  slug: slug(),
  decision: z.enum(["accept", "reject"], {
    message: "Decision must be 'accept' or 'reject'",
  }),
});

/** Appointment creation / update. */
export const appointmentSchema = z.object({
  patientId: z.coerce.number().int().positive("Patient is required").optional(),
  doctorId: z.coerce.number().int().positive().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM format"),
  caseType: z.enum(
    ["clinical_visit", "home_visit", "online_visit", "on_call_visit"],
    { message: "Invalid case type" }
  ),
  status: z
    .enum(["pending", "pending_consent", "confirmed", "completed", "cancelled"])
    .optional(),
  notes: z.string().max(2000).optional().default(""),
});

/** Bill creation. */
export const billSchema = z.object({
  patientId: z.coerce.number().int().positive("Patient is required"),
  billingTypeId: z.coerce.number().int().positive("Billing type is required"),
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(999_999_999, "Amount too large"),
  description: z.string().max(2000).optional().default(""),
  status: z.enum(["pending", "paid", "cancelled", "refunded"]).optional(),
});

/** Support ticket reply. */
export const supportTicketReplySchema = z.object({
  ticketId: z.coerce.number().int().positive("Ticket is required"),
  message: nonEmpty("Message").max(5000, "Message too long"),
});

/** Patient registration (create + update). Mirrors legacy `DoctordashboardController@store`. */
export const patientSchema = z.object({
  referredBy: z.string().trim().max(255, "Referred by must be at most 255 characters").optional(),
  name: nonEmpty("Name").max(255, "Name must be at most 255 characters"),
  email: email().optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"], { message: "Select a valid gender" }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-().]{10,15}$/, "Enter a valid phone number (10–15 digits)")
    .max(20, "Phone must be at most 20 characters"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(255, "Address must be at most 255 characters").optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().max(100, "City must be at most 100 characters").optional(),
  state: z.string().trim().max(100, "State must be at most 100 characters").optional(),
  streetAddress: z.string().trim().max(100, "Street address must be at most 100 characters").optional(),
  salutation: z.string().trim().max(20, "Salutation must be at most 20 characters").optional(),
  aadhaarNo: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits")
    .optional()
    .or(z.literal("")),
});

// NOTE (audit F-26): six schemas that were defined but referenced nowhere
// were removed — transactionSchema, followUpSchema, patientFilterSchema,
// profileSchema, chatMessageSchema (which described a different action
// signature than sendChatMessage accepts) and paginationSchema (the query
// layer hand-rolls pageBounds). If a schema here gains no consumer, delete
// it rather than leaving aspirational coverage.
// New schemas for clinic forms live in lib/validation/clinic.ts (F-22);