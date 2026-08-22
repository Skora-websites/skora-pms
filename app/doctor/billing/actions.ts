"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { billings, billingTypes, transactions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { ensurePatientOfDoctor, ensureBillingTypeOfDoctor } from "@/lib/auth/ownership";
import { audit } from "@/lib/security/audit-log";
import { billSchema } from "@/lib/validation";

async function getDoctorId(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
}

type ActionResult = { error: string | null };

const PAYMENT_METHODS = ["upi", "cash", "card", "netbanking", "credit"];

// ── Bill CRUD ──────────────────────────────────────────────────────────────

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
  const appointmentId = formData.has("appointment_id")
    ? Number(formData.get("appointment_id"))
    : null;
  const consultationId = formData.has("consultation_id")
    ? Number(formData.get("consultation_id"))
    : null;

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

  const billNumber = `INV-${Date.now().toString().slice(-6)}`;
  // Credit payment: bill is created as PENDING (48h credit), income is only
  // recognized once the doctor marks it collected (see collectCreditPayment).
  const isCredit = paymentMethod === "credit";
  const [billResult] = await db.insert(billings).values({
    billNumber,
    patientId,
    doctorId,
    billingTypeId,
    appointmentId,
    consultationId,
    totalAmount: amount,
    receivedAmount: isCredit ? "0" : amount,
    pendingAmount: isCredit ? amount : "0",
    paymentMethod: paymentMethod as never,
    status: isCredit ? "pending" : "paid",
    notes,
    billDate: now.toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
  });
  const billingId = Number(billResult.insertId);

  if (isCredit) {
    void audit.billCreated(doctorId, { billingId, billNumber, patientId, billingTypeId, amount, paymentMethod: "credit" });
    revalidatePath("/doctor/billing");
    revalidatePath("/doctor/income-expense");
    return { error: null };
  }

  // Auto-create approved income transaction
  const [billingType] = await db
    .select({ name: billingTypes.name })
    .from(billingTypes)
    .where(eq(billingTypes.id, billingTypeId));

  await db.insert(transactions).values({
    userId: doctorId,
    type: 1,
    billingId,
    amount,
    date: now.toISOString().slice(0, 10),
    status: "approved",
    description: `Bill ${billNumber}${billingType ? ` — ${billingType.name}` : ""}${notes ? ` (${notes})` : ""}`,
    paymentMethod,
    createdBy: "System",
    createdAt: now,
    updatedAt: now,
  });

  void audit.billCreated(doctorId, { billingId, billNumber, patientId, billingTypeId, amount, paymentMethod });
  void audit.transactionCreated(doctorId, { billingId, amount });

  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");
  return { error: null };
}

/** Mark a 48h-credit bill as collected — creates the income transaction. */
export async function collectCreditPayment(billId: number): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  if (!billId || !Number.isInteger(billId)) return { error: "Invalid bill ID." };

  const [bill] = await db
    .select({
      id: billings.id,
      doctorId: billings.doctorId,
      totalAmount: billings.totalAmount,
      status: billings.status,
      paymentMethod: billings.paymentMethod,
      billNumber: billings.billNumber,
    })
    .from(billings)
    .where(eq(billings.id, billId));
  if (!bill || bill.doctorId !== doctorId) return { error: "Bill not found." };
  if (bill.status === "paid") return { error: "This bill is already paid." };
  if (bill.paymentMethod !== "credit") return { error: "Only credit bills can be collected this way." };

  const now = new Date();
  const amount = bill.totalAmount;
  await db
    .update(billings)
    .set({ status: "paid", receivedAmount: amount, pendingAmount: "0", updatedAt: now })
    .where(eq(billings.id, billId));

  // Recognize the income now that it's collected.
  await db.insert(transactions).values({
    userId: doctorId,
    type: 1,
    billingId: billId,
    amount,
    date: now.toISOString().slice(0, 10),
    status: "approved",
    description: `Bill ${bill.billNumber} — credit payment collected`,
    paymentMethod: "credit",
    createdBy: "System",
    createdAt: now,
    updatedAt: now,
  });

  void audit.billCreated(doctorId, { billingId: billId, action: "credit_collected", amount, billNumber: bill.billNumber });
  void audit.transactionCreated(doctorId, { billingId: billId, amount });

  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function updateBill(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  const now = new Date();
  const billId = Number(formData.get("bill_id"));
  const patientId = Number(formData.get("patient_id"));
  const billingTypeId = Number(formData.get("billing_type_id"));
  const totalAmount = String(formData.get("total_amount") ?? "0");
  const receivedAmount = String(formData.get("received_amount") ?? "0");
  const paymentMethod = String(formData.get("payment_method") ?? "cash");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!billId || !Number.isInteger(billId)) return { error: "Invalid bill ID." };
  if (!patientId || !billingTypeId) return { error: "Patient and billing type are required." };
  if (!PAYMENT_METHODS.includes(paymentMethod)) return { error: "Invalid payment method." };

  if (!(await ensurePatientOfDoctor(doctorId, patientId))) {
    return { error: "Patient not found for this doctor." };
  }
  if (!(await ensureBillingTypeOfDoctor(billingTypeId, doctorId))) {
    return { error: "Billing type not found." };
  }

  const totalNum = Number(totalAmount);
  const receivedNum = Number(receivedAmount);
  if (!Number.isFinite(totalNum) || totalNum <= 0) return { error: "Invalid total amount." };
  if (!Number.isFinite(receivedNum) || receivedNum < 0) return { error: "Invalid received amount." };

  const pendingAmount = Math.max(0, totalNum - receivedNum);
  const status = pendingAmount <= 0 ? "paid" : receivedNum > 0 ? "partial" : "pending";

  // Ownership-scoped update
  const [existing] = await db
    .select({ id: billings.id, appointmentId: billings.appointmentId })
    .from(billings)
    .where(and(eq(billings.id, billId), eq(billings.doctorId, doctorId)));
  if (!existing) return { error: "Bill not found." };

  await db
    .update(billings)
    .set({
      patientId,
      billingTypeId,
      totalAmount,
      receivedAmount,
      pendingAmount: String(pendingAmount),
      paymentMethod: paymentMethod as never,
      status: status as never,
      notes,
      updatedAt: now,
    })
    .where(eq(billings.id, billId));

  // Sync income transaction (update or create)
  const [tx] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.billingId, billId));

  if (tx) {
    await db
      .update(transactions)
      .set({
        amount: receivedAmount,
        paymentMethod,
        date: now.toISOString().slice(0, 10),
        updatedAt: now,
      })
      .where(eq(transactions.id, tx.id));
  } else if (receivedNum > 0) {
    await db.insert(transactions).values({
      userId: doctorId,
      type: 1,
      billingId: billId,
      amount: receivedAmount,
      date: now.toISOString().slice(0, 10),
      status: "approved",
      description: `Bill update — #${billId}`,
      paymentMethod,
      createdBy: "System",
      createdAt: now,
      updatedAt: now,
    });
  }

  void audit.billCreated(doctorId, { billId, action: "updated", patientId, billingTypeId, totalAmount, receivedAmount });

  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function deleteBill(billId: number): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  if (!billId || !Number.isInteger(billId)) return { error: "Invalid bill ID." };

  const [existing] = await db
    .select({ id: billings.id })
    .from(billings)
    .where(and(eq(billings.id, billId), eq(billings.doctorId, doctorId)));
  if (!existing) return { error: "Bill not found." };

  // Soft-delete linked transaction(s)
  await db
    .update(transactions)
    .set({ deletedAt: new Date() })
    .where(eq(transactions.billingId, billId));

  // Soft-delete bill
  await db
    .update(billings)
    .set({ deletedAt: new Date() })
    .where(eq(billings.id, billId));

  void audit.billCreated(doctorId, { billId, action: "deleted" });

  revalidatePath("/doctor/billing");
  revalidatePath("/doctor/income-expense");
  return { error: null };
}

// ── Billing Types CRUD ─────────────────────────────────────────────────────

export async function createBillingType(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  const name = String(formData.get("name") ?? "").trim();
  const defaultAmount = String(formData.get("default_amount") ?? "0");

  if (!name) return { error: "Billing type name is required." };
  const amountNum = Number(defaultAmount);
  if (!Number.isFinite(amountNum) || amountNum < 0) return { error: "Invalid default amount." };

  await db.insert(billingTypes).values({
    doctorId,
    name,
    defaultAmount: String(amountNum),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/doctor/billing");
  return { error: null };
}

export async function updateBillingType(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const defaultAmount = String(formData.get("default_amount") ?? "0");

  if (!id || !Number.isInteger(id)) return { error: "Invalid billing type ID." };
  if (!name) return { error: "Billing type name is required." };
  const amountNum = Number(defaultAmount);
  if (!Number.isFinite(amountNum) || amountNum < 0) return { error: "Invalid default amount." };

  const [bt] = await db
    .select({ id: billingTypes.id })
    .from(billingTypes)
    .where(and(eq(billingTypes.id, id), eq(billingTypes.doctorId, doctorId)));
  if (!bt) return { error: "Billing type not found." };

  await db
    .update(billingTypes)
    .set({ name, defaultAmount: String(amountNum), updatedAt: new Date() })
    .where(eq(billingTypes.id, id));

  revalidatePath("/doctor/billing");
  return { error: null };
}

export async function deleteBillingType(id: number): Promise<ActionResult> {
  const doctorId = await getDoctorId();
  if (!id || !Number.isInteger(id)) return { error: "Invalid billing type ID." };

  const [bt] = await db
    .select({ id: billingTypes.id })
    .from(billingTypes)
    .where(and(eq(billingTypes.id, id), eq(billingTypes.doctorId, doctorId)));
  if (!bt) return { error: "Billing type not found." };

  // Soft-deactivate
  await db
    .update(billingTypes)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(billingTypes.id, id));

  revalidatePath("/doctor/billing");
  return { error: null };
}