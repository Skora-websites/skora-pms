"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  billings,
  billingTypes,
  transactions,
  consultations,
  consultationMedications,
  supportTickets,
  supportTicketMessages,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import {
  ensurePatientOfDoctor,
  ensureAppointmentOfDoctor,
  ensureBillingTypeOfDoctor,
  ensureIncomeTypeOfUser,
  ensureExpenseTypeOfUser,
  ensureTicketOwner,
} from "@/lib/auth/ownership";
import { audit } from "@/lib/security/audit-log";
import { generateBillNumber } from "@/lib/utils";
import { billSchema, supportTicketReplySchema } from "@/lib/validation";

async function getDoctorId(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
}

type ActionResult = { error: string | null };

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const APPOINTMENT_STATUSES = ["pending", "pending_consent", "confirmed", "completed", "cancelled"];
const FOLLOW_UP_STATUSES = ["pending", "addressed", "no_follow_up", "rescheduled", "cancelled"];
const PAYMENT_METHODS = ["upi", "cash", "card", "netbanking"];

export async function updateAppointmentStatus(appointmentId: number, status: string) {
  if (!APPOINTMENT_STATUSES.includes(status)) return;
  const doctorId = await getDoctorId();
  // Business state machine: only the confirm transition (-> confirmed) is a
  // generic status change. Complete/cancel have dedicated validated actions;
  // reversal (completed/pending etc.) must not be possible via this action.
  const [current] = await db
    .select({ status: appointments.status })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.doctorId, doctorId)));
  if (!current) return;
  if (status === "confirmed") {
    if (!["pending", "pending_consent"].includes(current.status)) return;
  } else {
    // Any other status is not a valid generic transition — no-op.
    return;
  }
  await db
    .update(appointments)
    .set({ status: status as never, updatedAt: new Date() })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.doctorId, doctorId)));

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");
}

// ── Billing ──────────────────────────────────────────────────────────────

export async function createBill(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  const now = new Date();
  const patientId = Number(formData.get("patient_id"));
  const billingTypeId = Number(formData.get("billing_type_id"));
  const amount = String(formData.get("amount") ?? "0");
  const paymentMethod = String(formData.get("payment_method") ?? "cash");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  // Zod validation
  const parsed = billSchema.safeParse({
    patientId: String(formData.get("patient_id") ?? "0"),
    billingTypeId: String(formData.get("billing_type_id") ?? "0"),
    amount: String(formData.get("amount") ?? "0"),
    description: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!patientId || !billingTypeId) return { error: "Patient and billing type are required." };
  if (!Number.isInteger(patientId) || !Number.isInteger(billingTypeId)) {
    return { error: "Invalid patient or billing type." };
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) return { error: "Invalid payment method." };

  if (!(await ensurePatientOfDoctor(doctorId, patientId))) {
    return { error: "Patient not found for this doctor." };
  }
  if (!(await ensureBillingTypeOfDoctor(billingTypeId, doctorId))) {
    return { error: "Billing type not found." };
  }

  const billNumber = generateBillNumber();
  const [billResult] = await db.insert(billings).values({
    billNumber,
    patientId,
    doctorId,
    billingTypeId,
    totalAmount: amount,
    receivedAmount: amount,
    pendingAmount: "0",
    paymentMethod: paymentMethod as never,
    status: "paid",
    notes,
    billDate: now.toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
  });
  const billingId = Number(billResult.insertId);

  // Generate the income transaction automatically (as the legacy app does)
  const [billingType] = await db
    .select({ name: billingTypes.name })
    .from(billingTypes)
    .where(eq(billingTypes.id, billingTypeId));

  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, doctorId));
  await db.insert(transactions).values({
    userId: doctorId,
    type: 1,
    billingId,
    amount,
    date: now.toISOString().slice(0, 10),
    status: "approved",
    description: `Bill ${billNumber}${billingType ? ` — ${billingType.name}` : ""}${notes ? ` (${notes})` : ""}`,
    paymentMethod,
    createdBy: user?.name ?? "System",
    createdAt: now,
    updatedAt: now,
  });

  void audit.billCreated(doctorId, { billingId, billNumber, patientId, billingTypeId, amount, paymentMethod });
  void audit.transactionCreated(doctorId, { billingId, amount });

  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");
  return { error: null };
}

// ── Transactions ─────────────────────────────────────────────────────────

const TX_FILE_DIR = path.join(process.cwd(), "storage", "uploads", "transactions");

/** Magic-byte check — only real PDF/JPEG/PNG files pass (spoofed extensions rejected). */
function sniffFile(bytes: Buffer): "pdf" | "jpg" | "png" | null {
  if (
    (bytes.length >= 5 && bytes.subarray(0, 5).toString("latin1") === "%PDF-") ||
    (bytes.length >= 6 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf &&
      bytes.subarray(3, 8).toString("latin1") === "%PDF-")
  ) {
    return "pdf";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  return null;
}

async function saveTransactionAttachment(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 3 * 1024 * 1024) throw new Error("Attachment must be under 3 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffFile(bytes);
  if (!kind) throw new Error("Only PDF, JPG or PNG attachments are allowed.");
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(TX_FILE_DIR, { recursive: true });
  await fs.writeFile(path.join(TX_FILE_DIR, filename), bytes);
  return `transactions/${filename}`;
}

export async function createTransaction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  const now = new Date();
  const type = Number(formData.get("type"));
  const amount = String(formData.get("amount") ?? "0");
  const date = String(formData.get("date") ?? now.toISOString().slice(0, 10));
  const incomeTypeRaw = String(formData.get("income_type_id") ?? "");
  const expenseTypeRaw = String(formData.get("expense_type_id") ?? "");
  const incomeTypeId = incomeTypeRaw ? Number(incomeTypeRaw) : null;
  const expenseTypeId = expenseTypeRaw ? Number(expenseTypeRaw) : null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const paymentMethod = String(formData.get("payment_method") ?? "").trim() || null;
  const referenceNumber = String(formData.get("reference_number") ?? "").trim() || null;

  if (![1, 2].includes(type)) return { error: "Invalid transaction type." };
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) return { error: "Invalid amount." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date format." };
  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    return { error: "Invalid payment method." };
  }

  if (type === 1) {
    if (!incomeTypeId || !Number.isInteger(incomeTypeId) || !(await ensureIncomeTypeOfUser(incomeTypeId, doctorId))) {
      return { error: "Income category is required." };
    }
  } else {
    if (!expenseTypeId || !Number.isInteger(expenseTypeId) || !(await ensureExpenseTypeOfUser(expenseTypeId, doctorId))) {
      return { error: "Expense category is required." };
    }
  }

  // Optional file attachment (stored outside public/ — PHI-safe)
  const file = formData.get("file") as File | null;
  let filePath: string | null = null;
  if (file && file.size > 0) {
    try {
      filePath = await saveTransactionAttachment(file);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the file." };
    }
  }

  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, doctorId));
  await db.insert(transactions).values({
    userId: doctorId,
    type,
    incomeTypeId: type === 1 ? incomeTypeId : null,
    expenseTypeId: type === 2 ? expenseTypeId : null,
    amount,
    date: date as never,
    status: "approved",
    description,
    paymentMethod,
    referenceNumber,
    filePath,
    createdBy: user?.name ?? "System",
    createdAt: now,
    updatedAt: now,
  });

  void audit.transactionCreated(doctorId, { type, amount, incomeTypeId, expenseTypeId, fileAttached: !!filePath });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

// ── Consultation ─────────────────────────────────────────────────────────

export async function saveConsultation(
  _prev: { error: string | null; consultationId: number | null },
  formData: FormData
): Promise<{ error: string | null; consultationId: number | null }> {
  const doctorId = await getDoctorId();
  const now = new Date();
  const appointmentId = Number(formData.get("appointment_id"));
  const patientId = Number(formData.get("patient_id"));
  const symptomsNote = String(formData.get("symptoms_note") ?? "").trim() || null;
  const examinationNote = String(formData.get("examination_note") ?? "").trim() || null;
  const diagnosisNote = String(formData.get("diagnosis_note") ?? "").trim() || null;
  const labNote = String(formData.get("lab_note") ?? "").trim() || null;
  const medicationsNote = String(formData.get("medications_note") ?? "").trim() || null;
  const medicalHistory = String(formData.get("medical_history") ?? "").trim() || null;
  const followUpDate = String(formData.get("follow_up_date") ?? "").trim() || null;

  // Vitals (persisted to the appointment — legacy ConsultationController@store parity)
  const bloodGroup = String(formData.get("blood_group") ?? "").trim() || null;
  const bp = String(formData.get("bp") ?? "").trim() || null;
  const weightRaw = String(formData.get("weight") ?? "").trim();
  const heightRaw = String(formData.get("height") ?? "").trim();

  if (!patientId) return { error: "Patient is required.", consultationId: null };
  if (!Number.isInteger(appointmentId) || !Number.isInteger(patientId)) {
    return { error: "Invalid appointment or patient.", consultationId: null };
  }
  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup))
    return { error: "Invalid blood group.", consultationId: null };
  if (bp && !/^\d{2,3}\/\d{2,3}$/.test(bp)) return { error: "BP must be like 120/80.", consultationId: null };
  const weight = weightRaw ? Number(weightRaw) : null;
  const height = heightRaw ? Number(heightRaw) : null;
  if (weight !== null && (Number.isNaN(weight) || weight < 0 || weight > 500)) {
    return { error: "Invalid weight.", consultationId: null };
  }
  if (height !== null && (Number.isNaN(height) || height < 0 || height > 300)) {
    return { error: "Invalid height.", consultationId: null };
  }

  // Verify the appointment belongs to this doctor
  if (!(await ensureAppointmentOfDoctor(appointmentId, doctorId))) {
    return { error: "Appointment not found.", consultationId: null };
  }

  // Business state machine: a consultation may only be recorded for an
  // appointment that is pending, confirmed, or already completed (edits).
  // Cancelled appointments must not be re-opened, and a consultation must not
  // bypass an outstanding patient consent.
  const [apptStatus] = await db
    .select({ status: appointments.status })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.doctorId, doctorId)));
  if (apptStatus?.status === "cancelled") {
    return { error: "Cancelled appointments cannot be consulted.", consultationId: null };
  }
  if (apptStatus?.status === "pending_consent") {
    return { error: "Patient consent is required before starting this consultation.", consultationId: null };
  }

  // Verify the patient belongs to this doctor
  if (patientId && !(await ensurePatientOfDoctor(doctorId, patientId))) {
    return { error: "Patient not found for this doctor.", consultationId: null };
  }

  const [existing] = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(and(eq(consultations.appointmentId, appointmentId), eq(consultations.doctorId, doctorId)));

  let consultationId: number;
  if (existing) {
    consultationId = existing.id;
    const [current] = await db
      .select({ followUpStatus: consultations.followUpStatus })
      .from(consultations)
      .where(eq(consultations.id, existing.id));
    await db
      .update(consultations)
      .set({
        symptomsNote,
        examinationNote,
        diagnosisNote,
        labNote,
        medicationsNote,
        medicalHistory,
        followUpDate,
        followUpStatus: followUpDate ? "pending" : (current?.followUpStatus ?? "pending"),
        updatedAt: now,
      })
      .where(and(eq(consultations.id, existing.id), eq(consultations.doctorId, doctorId)));
  } else {
    const [result] = await db.insert(consultations).values({
      patientId,
      doctorId,
      appointmentId,
      consultationDate: now,
      symptomsNote,
      examinationNote,
      diagnosisNote,
      labNote,
      medicationsNote,
      medicalHistory,
      followUpDate,
      followUpStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    consultationId = Number(result.insertId);
  }

  // Medications rows (comma separated medicine names, or per-line)
  const medLines = String(formData.get("medications") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (medLines.length > 0) {
    await db.delete(consultationMedications).where(eq(consultationMedications.consultationId, consultationId));
    await db.insert(consultationMedications).values(
      medLines.map((line, i) => ({
        consultationId,
        medicineName: line,
        order: i,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }

  // Persist vitals + mark appointment completed
  await db
    .update(appointments)
    .set({
      bloodGroup,
      bp,
      weight: weight !== null ? String(weight) : null,
      height: height !== null ? String(height) : null,
      status: "completed",
      updatedAt: now,
    })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.doctorId, doctorId)));

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");
  return { error: null, consultationId };
}

type TicketAction = { error: string | null };

export async function updateFollowUpStatus(consultationId: number, status: string) {
  if (!FOLLOW_UP_STATUSES.includes(status)) return;
  const doctorId = await getDoctorId();
  await db
    .update(consultations)
    .set({ followUpStatus: status, updatedAt: new Date() })
    .where(and(eq(consultations.id, consultationId), eq(consultations.doctorId, doctorId)));

  revalidatePath("/doctor/follow-ups");
}

// ── Support ──────────────────────────────────────────────────────────────

export async function createSupportTicket(
  _prev: TicketAction,
  formData: FormData
): Promise<TicketAction> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const parsed = supportTicketReplySchema.safeParse({
    ticketId: 0,
    message,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (!subject) return { error: "Subject is required." };

  const now = new Date();
  const [ticket] = await db.insert(supportTickets).values({
    userId: user.id,
    subject,
    status: "open",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(supportTicketMessages).values({
    supportTicketId: Number(ticket.insertId),
    senderId: user.id,
    message,
    isAdminReply: false,
    createdAt: now,
    updatedAt: now,
  });

  void audit.supportTicketCreated(user.id, { subject });

  revalidatePath("/doctor/support");
  return { error: null };
}

export async function replySupportTicket(ticketId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const message = String(formData.get("message") ?? "").trim();

  const parsed = supportTicketReplySchema.safeParse({
    ticketId,
    message,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Verify the ticket belongs to this user
  if (!(await ensureTicketOwner(ticketId, user.id))) {
    return { error: "Ticket not found." };
  }

  const now = new Date();
  await db.insert(supportTicketMessages).values({
    supportTicketId: ticketId,
    senderId: user.id,
    message,
    isAdminReply: false,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/doctor/support");
  return { error: null };
}
