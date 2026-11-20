import { NextRequest } from "next/server";
import { and, desc, eq, inArray, isNull, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions, expenseTypes } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";
import { todayStr } from "@/lib/utils";

export const runtime = "nodejs";

export type ClinicExpenseItem = {
  id: number;
  amount: number;
  date: string;
  categoryName: string;
  paymentMethod: string;
  description: string | null;
  referenceNumber: string | null;
  createdBy: string;
  status: string;
};

export type ClinicExpenseCategory = {
  id: number;
  name: string;
};

export type ClinicExpensesSummary = {
  totalMonth: number;
  totalToday: number;
  count: number;
};

export type ClinicExpensesResponse = {
  summary: ClinicExpensesSummary;
  categories: ClinicExpenseCategory[];
  expenses: ClinicExpenseItem[];
};

const DEFAULT_CATEGORIES = [
  "Medical & Surgical Supplies",
  "Clinic Utilities & Power",
  "Cleaning & Sanitation",
  "Petty Cash & Refreshments",
  "Equipment & Maintenance",
  "Printing & Stationery",
  "Staff & Contractor Expense",
  "Other Operational Expense",
];

/**
 * GET /api/mobile/admin/expenses
 * Lists clinic expenses (transactions type = 2) with summary metrics and categories.
 */
export async function GET(req: NextRequest) {
  const user = await requireApiRole(["admin", "manager", "doctor", "receptionist", "super_admin", "super-admin"]);
  if (user instanceof Response) return user;

  const doctorId = user.role === "doctor" ? user.id : (user.doctorId ?? user.id);
  const today = todayStr();
  const currentMonthPrefix = today.slice(0, 7); // "YYYY-MM"

  // 1. Fetch user/doctor expense categories
  const categoriesRaw = await db
    .select({ id: expenseTypes.id, name: expenseTypes.name })
    .from(expenseTypes)
    .where(and(eq(expenseTypes.userId, doctorId), isNull(expenseTypes.deletedAt)))
    .orderBy(expenseTypes.name);

  const categoryMap = new Map<number, string>(
    categoriesRaw.map((c) => [c.id, c.name])
  );

  // 2. Fetch expense transactions
  const expenseRows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, doctorId),
        eq(transactions.type, 2), // 2 = Expense
        isNull(transactions.deletedAt)
      )
    )
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(100);

  let totalMonth = 0;
  let totalToday = 0;

  const items: ClinicExpenseItem[] = expenseRows.map((tx) => {
    const amt = parseFloat(tx.amount ?? "0");
    const txDate = tx.date;

    if (txDate.startsWith(currentMonthPrefix)) {
      totalMonth += amt;
    }
    if (txDate === today) {
      totalToday += amt;
    }

    const categoryName = tx.expenseTypeId
      ? categoryMap.get(tx.expenseTypeId) ?? "General Expense"
      : "General Expense";

    return {
      id: tx.id,
      amount: amt,
      date: txDate,
      categoryName,
      paymentMethod: tx.paymentMethod ?? "cash",
      description: tx.description ?? null,
      referenceNumber: tx.referenceNumber ?? null,
      createdBy: tx.createdBy,
      status: tx.status ?? "approved",
    };
  });

  const response: ClinicExpensesResponse = {
    summary: {
      totalMonth: Math.round(totalMonth * 100) / 100,
      totalToday: Math.round(totalToday * 100) / 100,
      count: items.length,
    },
    categories:
      categoriesRaw.length > 0
        ? categoriesRaw
        : DEFAULT_CATEGORIES.map((name, idx) => ({ id: idx + 1, name })),
    expenses: items,
  };

  return apiOk(response);
}

/**
 * POST /api/mobile/admin/expenses
 * Log a new clinic expense transaction.
 * Body: {
 *   amount: number,
 *   categoryName: string,
 *   paymentMethod: "cash" | "upi" | "card" | "netbanking",
 *   description: string,
 *   referenceNumber?: string,
 *   date?: string
 * }
 */
export async function POST(req: NextRequest) {
  const user = await requireApiRole(["admin", "manager", "doctor", "receptionist", "super_admin", "super-admin"]);
  if (user instanceof Response) return user;

  const doctorId = user.role === "doctor" ? user.id : (user.doctorId ?? user.id);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const amountNum = parseFloat(String(body?.amount ?? 0));
  if (isNaN(amountNum) || amountNum <= 0) {
    return apiError("Valid non-zero amount is required.", 400);
  }

  const categoryName = String(body?.categoryName ?? "General Expense").trim();
  const paymentMethod = String(body?.paymentMethod ?? "cash").toLowerCase();
  const description = String(body?.description ?? "").trim();
  const referenceNumber = body?.referenceNumber
    ? String(body.referenceNumber).trim()
    : null;
  const dateStr = body?.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
    ? body.date
    : todayStr();

  const now = new Date();

  // Find or create category in expense_types
  let categoryId: number | null = null;
  const [existingCat] = await db
    .select({ id: expenseTypes.id })
    .from(expenseTypes)
    .where(
      and(
        eq(expenseTypes.userId, doctorId),
        eq(expenseTypes.name, categoryName),
        isNull(expenseTypes.deletedAt)
      )
    )
    .limit(1);

  if (existingCat) {
    categoryId = existingCat.id;
  } else {
    const [insertedCat] = await db.insert(expenseTypes).values({
      name: categoryName,
      userId: doctorId,
      createdAt: now,
      updatedAt: now,
    });
    categoryId = Number(insertedCat.insertId);
  }

  // Insert expense transaction
  const [insertTx] = await db.insert(transactions).values({
    userId: doctorId,
    type: 2, // 2 = Expense
    expenseTypeId: categoryId,
    amount: amountNum.toFixed(2),
    date: dateStr as never,
    status: "approved",
    paymentMethod,
    description: description || null,
    referenceNumber,
    createdBy: user.name,
    createdAt: now,
    updatedAt: now,
  });

  const createdId = Number(insertTx.insertId);

  const createdItem: ClinicExpenseItem = {
    id: createdId,
    amount: amountNum,
    date: dateStr,
    categoryName,
    paymentMethod,
    description: description || null,
    referenceNumber,
    createdBy: user.name,
    status: "approved",
  };

  return apiOk(createdItem, { status: 201 });
}
