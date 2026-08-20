import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions, incomeTypes, expenseTypes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { audit } from "@/lib/security/audit-log";
import { getTransactions } from "@/lib/queries/doctor";

export const runtime = "nodejs";

const TYPE_LABELS: Record<number, string> = { 1: "Income", 2: "Expense" };
const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  unapproved: "Unapproved",
  pending: "Pending",
};

/**
 * Excel export of the doctor's transactions.
 *
 * Modes:
 *   GET /api/doctor/income-expense/export              → export all
 *       ?type=income|expense&start_date=...&end_date=...
 *   POST /api/doctor/income-expense/export (ids: [..]) → export selected rows
 *
 * Ownership-scoped via getCurrentUser + getTransactions.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const { rows, incomeTypes: incomeCats, expenseTypes: expenseCats } = await getTransactions(doctorId);

  let filtered = rows;
  if (type === "income") filtered = filtered.filter((r) => r.type === 1);
  else if (type === "expense") filtered = filtered.filter((r) => r.type === 2);
  if (startDate && endDate) {
    filtered = filtered.filter((r) => r.date >= startDate && r.date <= endDate);
  }

  return exportWorkbook(filtered, incomeCats, expenseCats, user.name);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  let ids: number[] = [];
  try {
    const body = await req.json();
    ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isInteger) : [];
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  if (ids.length === 0) return NextResponse.json({ error: "No items selected." }, { status: 400 });

  // Ownership-scoped: only return rows belonging to this user, still non-deleted.
  const rows = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      date: transactions.date,
      status: transactions.status,
      description: transactions.description,
      referenceNumber: transactions.referenceNumber,
      paymentMethod: transactions.paymentMethod,
      incomeTypeId: transactions.incomeTypeId,
      expenseTypeId: transactions.expenseTypeId,
      billingId: transactions.billingId,
      filePath: transactions.filePath,
      incomeType: incomeTypes.name,
      expenseType: expenseTypes.name,
    })
    .from(transactions)
    .leftJoin(incomeTypes, eq(incomeTypes.id, transactions.incomeTypeId))
    .leftJoin(expenseTypes, eq(expenseTypes.id, transactions.expenseTypeId))
    .where(
      and(
        eq(transactions.userId, doctorId),
        isNull(transactions.deletedAt),
        inArray(transactions.id, ids)
      )
    )
    .orderBy(transactions.date);

  void audit.transactionCreated(doctorId, { action: "export" });

  const incomeCats = await db
    .select({ id: incomeTypes.id, name: incomeTypes.name })
    .from(incomeTypes)
    .where(and(eq(incomeTypes.userId, doctorId), isNull(incomeTypes.deletedAt)));
  const expenseCats = await db
    .select({ id: expenseTypes.id, name: expenseTypes.name })
    .from(expenseTypes)
    .where(and(eq(expenseTypes.userId, doctorId), isNull(expenseTypes.deletedAt)));

  return exportWorkbook(rows, incomeCats, expenseCats, user.name);
}

async function exportWorkbook(
  rows: Awaited<ReturnType<typeof getTransactions>>["rows"],
  incomeCats: { id: number; name: string }[],
  expenseCats: { id: number; name: string }[],
  userName: string
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = userName;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Transactions");
  sheet.columns = [
    { header: "S.No", key: "sno", width: 8 },
    { header: "Date", key: "date", width: 14 },
    { header: "Type", key: "type", width: 12 },
    { header: "Category", key: "category", width: 22 },
    { header: "Amount (₹)", key: "amount", width: 15 },
    { header: "Payment", key: "payment", width: 14 },
    { header: "Reference", key: "reference", width: 18 },
    { header: "Status", key: "status", width: 12 },
    { header: "Description", key: "description", width: 40 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  rows.forEach((r, index) => {
    const category = r.incomeType ?? r.expenseType ?? "—";
    sheet.addRow({
      sno: index + 1,
      date: r.date,
      type: TYPE_LABELS[r.type as number] ?? "—",
      category,
      amount: Number(r.amount).toFixed(2),
      payment: r.paymentMethod ?? "—",
      reference: r.referenceNumber ?? "—",
      status: r.status ? (STATUS_LABELS[r.status] ?? r.status) : "—",
      description: r.description ?? "—",
    });
  });

  // Summary block
  const totalAmount = rows.reduce((s, r) => s + Number(r.amount), 0);
  sheet.addRow([]);
  sheet.addRow(["SUMMARY"]);
  sheet.addRow(["Total Records:", rows.length]);
  sheet.addRow(["Total Amount (₹):", totalAmount.toFixed(2)]);
  sheet.addRow(["Generated On:", new Date().toLocaleString()]);
  sheet.addRow(["Generated By:", userName]);

  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="transactions_${dateStr}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}