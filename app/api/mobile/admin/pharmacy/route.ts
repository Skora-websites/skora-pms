import { NextRequest } from "next/server";
import { and, eq, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicines } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type PharmacyMedicineItem = {
  id: number;
  name: string;
  strength: string | null;
  form: string | null;
  unit: string | null;
  quantityAvailable: number;
  stockStatus: StockStatus;
};

export type PharmacySummary = {
  totalMedicines: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type PharmacyInventoryResponse = {
  summary: PharmacySummary;
  medicines: PharmacyMedicineItem[];
};

function deriveStockStatus(qty: number): StockStatus {
  if (qty <= 0) return "out_of_stock";
  if (qty < 20) return "low_stock";
  return "in_stock";
}

/**
 * GET /api/mobile/admin/pharmacy
 * Clinic medicine inventory, stock level status, and summary metrics.
 * Query params:
 *   ?search=paracetamol
 *   ?status=all|in_stock|low_stock|out_of_stock
 */
export async function GET(req: NextRequest) {
  const user = await requireApiRole(["admin", "manager", "doctor", "receptionist", "super_admin", "super-admin"]);
  if (user instanceof Response) return user;

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const statusFilter = searchParams.get("status") ?? "all";

  // 1. Fetch all matching medicines
  const conditions = [];
  if (search.length > 0) {
    conditions.push(like(medicines.name, `%${search}%`));
  }

  const query = conditions.length > 0
    ? db.select().from(medicines).where(and(...conditions)).orderBy(medicines.name)
    : db.select().from(medicines).orderBy(medicines.name).limit(200);

  const rows = await query;

  // 2. Compute stock levels and summary
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const allItems: PharmacyMedicineItem[] = rows.map((m) => {
    const qty = m.quantityAvailable ?? 0;
    const stockStatus = deriveStockStatus(qty);

    if (stockStatus === "in_stock") inStockCount++;
    else if (stockStatus === "low_stock") lowStockCount++;
    else outOfStockCount++;

    return {
      id: m.id,
      name: m.name,
      strength: m.strength ?? null,
      form: m.form ?? "Tablet",
      unit: m.unit ?? "mg",
      quantityAvailable: qty,
      stockStatus,
    };
  });

  // 3. Filter by status if requested
  let filteredItems = allItems;
  if (statusFilter === "in_stock") {
    filteredItems = allItems.filter((m) => m.stockStatus === "in_stock");
  } else if (statusFilter === "low_stock") {
    filteredItems = allItems.filter((m) => m.stockStatus === "low_stock");
  } else if (statusFilter === "out_of_stock") {
    filteredItems = allItems.filter((m) => m.stockStatus === "out_of_stock");
  }

  const response: PharmacyInventoryResponse = {
    summary: {
      totalMedicines: allItems.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    },
    medicines: filteredItems,
  };

  return apiOk(response);
}

/**
 * POST /api/mobile/admin/pharmacy
 * Adjust or restock medicine quantity.
 * Body: {
 *   medicineId: number,
 *   adjustment: number, // e.g. +50, +100, -10
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  const user = await requireApiRole(["admin", "manager", "doctor", "receptionist", "super_admin", "super-admin"]);
  if (user instanceof Response) return user;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const medicineId = Number(body?.medicineId);
  const adjustment = Number(body?.adjustment);

  if (!medicineId || isNaN(medicineId)) {
    return apiError("Valid medicineId is required.", 400);
  }

  if (isNaN(adjustment)) {
    return apiError("Valid adjustment number is required.", 400);
  }

  // Fetch current medicine row
  const [existing] = await db
    .select()
    .from(medicines)
    .where(eq(medicines.id, medicineId))
    .limit(1);

  if (!existing) {
    return apiError("Medicine not found.", 404);
  }

  const currentQty = existing.quantityAvailable ?? 0;
  const newQty = Math.max(0, currentQty + adjustment);
  const now = new Date();

  await db
    .update(medicines)
    .set({
      quantityAvailable: newQty,
      updatedAt: now,
    })
    .where(eq(medicines.id, medicineId));

  const stockStatus = deriveStockStatus(newQty);

  const updatedItem: PharmacyMedicineItem = {
    id: existing.id,
    name: existing.name,
    strength: existing.strength ?? null,
    form: existing.form ?? "Tablet",
    unit: existing.unit ?? "mg",
    quantityAvailable: newQty,
    stockStatus,
  };

  return apiOk({
    success: true,
    medicine: updatedItem,
    previousQuantity: currentQty,
    adjustment,
  });
}
