"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions, incomeTypes, expenseTypes } from "@/lib/db/schema";
import { requireDoctorPermission } from "@/lib/auth/server-permissions";
import {
  ensureIncomeTypeOfUser,
  ensureExpenseTypeOfUser,
} from "@/lib/auth/ownership";
import { audit } from "@/lib/security/audit-log";

type ActionResult = { error: string | null };

const TX_STATUSES = ["approved", "unapproved", "pending"] as const;
const PAYMENT_METHODS = ["upi", "cash", "card", "netbanking"];

// Transaction attachments are stored outside public/ (PHI-safe); served via
// an authenticated route (`app/api/doctor/income-expense/[id]/file/route.ts`).
const TX_FILE_DIR = path.join(process.cwd(), "storage", "uploads", "transactions");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

async function saveAttachment(file: File): Promise<string | null> {
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

async function deleteAttachment(storedPath: string | null) {
  if (!storedPath) return;
  const absolute = path.join(process.cwd(), "storage", "uploads", storedPath);
  fs.unlink(absolute).catch(() => undefined);
}

// ── Transaction CRUD ───────────────────────────────────────────────────────

export async function updateTransaction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-edit");
  if (!doctorId) return { error: "You don't have permission to edit transactions." };
  const now = new Date();
  const txId = Number(formData.get("id"));
  const type = Number(formData.get("type"));
  const amount = String(formData.get("amount") ?? "0");
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "approved");
  const paymentMethod = String(formData.get("payment_method") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const referenceNumber = String(formData.get("reference_number") ?? "").trim() || null;
  const incomeTypeRaw = String(formData.get("income_type_id") ?? "");
  const expenseTypeRaw = String(formData.get("expense_type_id") ?? "");
  const incomeTypeId = incomeTypeRaw ? Number(incomeTypeRaw) : null;
  const expenseTypeId = expenseTypeRaw ? Number(expenseTypeRaw) : null;

  if (!txId || !Number.isInteger(txId)) return { error: "Invalid transaction ID." };
  if (![1, 2].includes(type)) return { error: "Invalid transaction type." };
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) return { error: "Invalid amount." };
  if (!DATE_RE.test(date)) return { error: "Invalid date format." };
  if (!(TX_STATUSES as readonly string[]).includes(status)) return { error: "Invalid status." };
  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    return { error: "Invalid payment method." };
  }

  // Ownership-scoped fetch
  const [existing] = await db
    .select({
      id: transactions.id,
      billingId: transactions.billingId,
      filePath: transactions.filePath,
    })
    .from(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, doctorId)));
  if (!existing) return { error: "Transaction not found." };

  // Billing-linked transactions are read-only — edit the bill instead.
  if (existing.billingId) {
    return {
      error: "This entry was auto-generated from a bill. Edit the bill to change it.",
    };
  }

  if (type === 1) {
    if (!incomeTypeId || !(await ensureIncomeTypeOfUser(incomeTypeId, doctorId))) {
      return { error: "Income category is required." };
    }
  } else {
    if (!expenseTypeId || !(await ensureExpenseTypeOfUser(expenseTypeId, doctorId))) {
      return { error: "Expense category is required." };
    }
  }

  // Optional file replacement
  const file = formData.get("file") as File | null;
  let newFilePath: string | null = null;
  if (file && file.size > 0) {
    try {
      newFilePath = await saveAttachment(file);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the file." };
    }
  }

  await db
    .update(transactions)
    .set({
      type,
      incomeTypeId: type === 1 ? incomeTypeId : null,
      expenseTypeId: type === 2 ? expenseTypeId : null,
      amount,
      date: date as never,
      status: status as never,
      paymentMethod,
      description,
      referenceNumber,
      filePath: newFilePath ?? existing.filePath,
      updatedAt: now,
    })
    .where(eq(transactions.id, txId));

  if (newFilePath) await deleteAttachment(existing.filePath);

  void audit.transactionUpdated(doctorId, { txId, type, amount, date, status });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function deleteTransaction(txId: number): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-delete");
  if (!doctorId) return { error: "You don't have permission to delete transactions." };
  if (!txId || !Number.isInteger(txId)) return { error: "Invalid transaction ID." };

  const [existing] = await db
    .select({ id: transactions.id, billingId: transactions.billingId, filePath: transactions.filePath })
    .from(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, doctorId)));
  if (!existing) return { error: "Transaction not found." };

  // Prevent deleting auto-created billing income (delete the bill instead) — legacy parity.
  if (existing.billingId) {
    return {
      error: "This income was auto-generated from a bill. Delete the bill to remove it.",
    };
  }

  await db
    .update(transactions)
    .set({ deletedAt: new Date() })
    .where(eq(transactions.id, txId));

  await deleteAttachment(existing.filePath);

  void audit.transactionDeleted(doctorId, { txId });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function updateTransactionStatus(
  txId: number,
  status: string
): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-approve");
  if (!doctorId) return { error: "You don't have permission to approve transactions." };
  if (!txId || !Number.isInteger(txId)) return { error: "Invalid transaction ID." };
  if (!(TX_STATUSES as readonly string[]).includes(status)) return { error: "Invalid status." };

  const [existing] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, doctorId)));
  if (!existing) return { error: "Transaction not found." };

  await db
    .update(transactions)
    .set({ status: status as never, updatedAt: new Date() })
    .where(eq(transactions.id, txId));

  void audit.transactionStatusChanged(doctorId, { txId, status });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

// ── Category CRUD ──────────────────────────────────────────────────────────

export async function createIncomeType(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-create");
  if (!doctorId) return { error: "You don't have permission to add categories." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };
  if (name.length > 150) return { error: "Category name must be at most 150 characters." };

  const [existing] = await db
    .select({ id: incomeTypes.id })
    .from(incomeTypes)
    .where(and(eq(incomeTypes.name, name), eq(incomeTypes.userId, doctorId)));
  if (existing) return { error: "This income category already exists." };

  await db.insert(incomeTypes).values({
    name,
    userId: doctorId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  void audit.categoryCreated(doctorId, { kind: "income", name });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function updateIncomeType(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-edit");
  if (!doctorId) return { error: "You don't have permission to edit categories." };
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !Number.isInteger(id)) return { error: "Invalid category ID." };
  if (!name) return { error: "Category name is required." };
  if (name.length > 150) return { error: "Category name must be at most 150 characters." };

  const [existing] = await db
    .select({ id: incomeTypes.id })
    .from(incomeTypes)
    .where(and(eq(incomeTypes.id, id), eq(incomeTypes.userId, doctorId)));
  if (!existing) return { error: "Income category not found." };

  await db
    .update(incomeTypes)
    .set({ name, updatedAt: new Date() })
    .where(eq(incomeTypes.id, id));

  void audit.categoryUpdated(doctorId, { kind: "income", id, name });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function deleteIncomeType(id: number): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-delete");
  if (!doctorId) return { error: "You don't have permission to delete categories." };
  if (!id || !Number.isInteger(id)) return { error: "Invalid category ID." };

  const [existing] = await db
    .select({ id: incomeTypes.id })
    .from(incomeTypes)
    .where(and(eq(incomeTypes.id, id), eq(incomeTypes.userId, doctorId)));
  if (!existing) return { error: "Income category not found." };

  // Soft-delete so historical transactions keep their category name via join.
  await db
    .update(incomeTypes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(incomeTypes.id, id));

  void audit.categoryDeleted(doctorId, { kind: "income", id });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function createExpenseType(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-create");
  if (!doctorId) return { error: "You don't have permission to add categories." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };
  if (name.length > 150) return { error: "Category name must be at most 150 characters." };

  const [existing] = await db
    .select({ id: expenseTypes.id })
    .from(expenseTypes)
    .where(and(eq(expenseTypes.name, name), eq(expenseTypes.userId, doctorId)));
  if (existing) return { error: "This expense category already exists." };

  await db.insert(expenseTypes).values({
    name,
    userId: doctorId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  void audit.categoryCreated(doctorId, { kind: "expense", name });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function updateExpenseType(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-edit");
  if (!doctorId) return { error: "You don't have permission to edit categories." };
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !Number.isInteger(id)) return { error: "Invalid category ID." };
  if (!name) return { error: "Category name is required." };
  if (name.length > 150) return { error: "Category name must be at most 150 characters." };

  const [existing] = await db
    .select({ id: expenseTypes.id })
    .from(expenseTypes)
    .where(and(eq(expenseTypes.id, id), eq(expenseTypes.userId, doctorId)));
  if (!existing) return { error: "Expense category not found." };

  await db
    .update(expenseTypes)
    .set({ name, updatedAt: new Date() })
    .where(eq(expenseTypes.id, id));

  void audit.categoryUpdated(doctorId, { kind: "expense", id, name });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}

export async function deleteExpenseType(id: number): Promise<ActionResult> {
  const doctorId = await requireDoctorPermission("income-expense-delete");
  if (!doctorId) return { error: "You don't have permission to delete categories." };
  if (!id || !Number.isInteger(id)) return { error: "Invalid category ID." };

  const [existing] = await db
    .select({ id: expenseTypes.id })
    .from(expenseTypes)
    .where(and(eq(expenseTypes.id, id), eq(expenseTypes.userId, doctorId)));
  if (!existing) return { error: "Expense category not found." };

  await db
    .update(expenseTypes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(expenseTypes.id, id));

  void audit.categoryDeleted(doctorId, { kind: "expense", id });

  revalidatePath("/doctor/income-expense");
  return { error: null };
}