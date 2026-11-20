import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { billings } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type DailyReconciliationData = {
  date: string;
  totalInvoiced: number;
  totalCollected: number;
  pendingAmount: number;
  billCount: number;
  paymentBreakdown: {
    cash: number;
    online: number;
    card: number;
    upi: number;
  };
  expectedCash: number;
  status: "open" | "closed";
  closedAt: string | null;
  closedBy: string | null;
  countedCash: number | null;
  variance: number | null;
  closingNotes: string | null;
};

// Global in-process cache of daily cashier drawer settlements
type ShiftClosureRecord = {
  date: string;
  closedAt: string;
  closedBy: string;
  countedCash: number;
  expectedCash: number;
  variance: number;
  notes: string | null;
};

const closureStore = new Map<string, ShiftClosureRecord>();

/**
 * GET /api/mobile/admin/reconciliation — Today's cashier collection totals and drawer status.
 */
export async function GET() {
  const user = await requireApiRole(["admin", "manager", "receptionist", "super_admin", "super-admin"]);
  if (user instanceof Response) return user;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const rows = await db
      .select({
        id: billings.id,
        totalAmount: billings.totalAmount,
        receivedAmount: billings.receivedAmount,
        pendingAmount: billings.pendingAmount,
        paymentMethod: billings.paymentMethod,
        status: billings.status,
      })
      .from(billings)
      .where(
        and(
          eq(billings.billDate, todayStr),
          isNull(billings.deletedAt)
        )
      );

    let totalInvoiced = 0;
    let totalCollected = 0;
    let pendingAmount = 0;
    let cash = 0;
    let online = 0;
    let card = 0;
    let upi = 0;

    for (const r of rows) {
      const inv = Number(r.totalAmount) || 0;
      const rec = Number(r.receivedAmount) || 0;
      const pend = Number(r.pendingAmount) || 0;

      totalInvoiced += inv;
      totalCollected += rec;
      pendingAmount += pend;

      const method = (r.paymentMethod || "").toLowerCase();
      if (method === "cash") {
        cash += rec;
      } else if (method === "card") {
        card += rec;
      } else if (method === "upi") {
        upi += rec;
      } else {
        online += rec;
      }
    }

    const closure = closureStore.get(todayStr);

    const data: DailyReconciliationData = {
      date: todayStr,
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      billCount: rows.length,
      paymentBreakdown: {
        cash: Math.round(cash * 100) / 100,
        online: Math.round(online * 100) / 100,
        card: Math.round(card * 100) / 100,
        upi: Math.round(upi * 100) / 100,
      },
      expectedCash: Math.round(cash * 100) / 100,
      status: closure ? "closed" : "open",
      closedAt: closure ? closure.closedAt : null,
      closedBy: closure ? closure.closedBy : null,
      countedCash: closure ? closure.countedCash : null,
      variance: closure ? closure.variance : null,
      closingNotes: closure ? closure.notes : null,
    };

    return apiOk(data);
  } catch (err: any) {
    console.error("Failed to load daily reconciliation:", err);
    return apiError("Could not calculate daily cashier reconciliation", 500);
  }
}

/**
 * POST /api/mobile/admin/reconciliation — Close and certify the daily cash drawer register.
 */
export async function POST(request: Request) {
  const user = await requireApiRole(["admin", "manager", "receptionist", "super_admin", "super-admin"]);
  if (user instanceof Response) return user;

  try {
    const body = await request.json();
    const { countedCash, notes } = body;

    if (typeof countedCash !== "number" || isNaN(countedCash) || countedCash < 0) {
      return apiError("A valid counted cash amount is required", 400);
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // Compute expected cash from database
    const rows = await db
      .select({
        receivedAmount: billings.receivedAmount,
        paymentMethod: billings.paymentMethod,
      })
      .from(billings)
      .where(
        and(
          eq(billings.billDate, todayStr),
          isNull(billings.deletedAt)
        )
      );

    let expectedCash = 0;
    for (const r of rows) {
      if ((r.paymentMethod || "").toLowerCase() === "cash") {
        expectedCash += Number(r.receivedAmount) || 0;
      }
    }

    expectedCash = Math.round(expectedCash * 100) / 100;
    const roundedCounted = Math.round(countedCash * 100) / 100;
    const variance = Math.round((roundedCounted - expectedCash) * 100) / 100;

    const record: ShiftClosureRecord = {
      date: todayStr,
      closedAt: new Date().toISOString(),
      closedBy: user.name || "Clinic Staff",
      countedCash: roundedCounted,
      expectedCash,
      variance,
      notes: typeof notes === "string" ? notes.trim() : null,
    };

    closureStore.set(todayStr, record);

    return apiOk({
      success: true,
      message: "Daily cashier drawer register certified and closed.",
      settlement: record,
    });
  } catch (err: any) {
    console.error("Failed to close daily cash register:", err);
    return apiError("Could not process cash drawer reconciliation", 500);
  }
}
