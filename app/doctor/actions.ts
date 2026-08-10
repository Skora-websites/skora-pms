"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

async function getDoctorId(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
}

type ActionResult = { error: string | null };

// ── Appointments ─────────────────────────────────────────────────────────

export async function createAppointment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  const now = new Date();
  const patientIdRaw = String(formData.get("patient_id") ?? "");
  const patientString = String(formData.get("patient_string") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const caseType = String(formData.get("case_type") ?? "clinical_visit");

  if (!date || !time) return { error: "Date and time are required." };

  await db.insert(appointments).values({
    doctorId,
    patientId: patientIdRaw ? Number(patientIdRaw) : null,
    patientString: patientString || null,
    date: date as never,
    time,
    caseType: caseType as never,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");
  return { error: null };
}

const APPOINTMENT_STATUSES = ["pending", "pending_consent", "confirmed", "completed", "cancelled"];

export async function updateAppointmentStatus(appointmentId: number, status: string) {
  if (!APPOINTMENT_STATUSES.includes(status)) return;
  const doctorId = await getDoctorId();
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

  if (!patientId || !billingTypeId) return { error: "Patient and billing type are required." };

  const billNumber = `INV-${Date.now().toString().slice(-6)}`;
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

  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");
  return { error: null };
}

// ── Transactions ─────────────────────────────────────────────────────────

export async function createTransaction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  const now = new Date();
  const type = Number(formData.get("type"));
  const amount = String(formData.get("amount") ?? "0");
  const date = String(formData.get("date") ?? now.toISOString().slice(0, 10));
  const incomeTypeId = formData.get("income_type_id") ? Number(formData.get("income_type_id")) : null;
  const expenseTypeId = formData.get("expense_type_id") ? Number(formData.get("expense_type_id")) : null;
  const description = String(formData.get("description") ?? "").trim() || null;

  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, doctorId));
  await db.insert(transactions).values({
    userId: doctorId,
    type,
    incomeTypeId,
    expenseTypeId,
    amount,
    date: date as never,
    status: "approved",
    description,
    createdBy: user?.name ?? "System",
    createdAt: now,
    updatedAt: now,
  });

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

  if (!patientId) return { error: "Patient is required.", consultationId: null };

  const [existing] = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(eq(consultations.appointmentId, appointmentId));

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

  // Mark appointment completed
  await db
    .update(appointments)
    .set({ status: "completed", updatedAt: now })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.doctorId, doctorId)));

  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");
  return { error: null, consultationId };
}

type TicketAction = { error: string | null };

export async function updateFollowUpStatus(consultationId: number, status: string) {
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

  if (!subject || !message) return { error: "Subject and message are required." };

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

  revalidatePath("/doctor/support");
  return { error: null };
}

export async function replySupportTicket(ticketId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Message is required." };

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
