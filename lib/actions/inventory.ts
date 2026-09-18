"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicines } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { auditLog } from "@/lib/security/audit-log";

export type StockActionResult = { error: string | null };

async function requireInventoryStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return null;
  }
  return user;
}

/**
 * ADD stock for a medicine (e.g. a new delivery): `amount` is added to the
 * current `quantity_available`. Use a negative amount to correct shrinkage.
 */
export async function addMedicineStock(
  medicineId: number,
  amount: number
): Promise<StockActionResult> {
  const user = await requireInventoryStaff();
  if (!user) return { error: "You don't have permission to update medicine stock." };
  if (!Number.isInteger(medicineId) || medicineId <= 0) return { error: "Invalid medicine." };
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount === 0) {
    return { error: "Enter a non-zero whole number." };
  }

  const [medicine] = await db
    .select({ id: medicines.id, name: medicines.name, quantityAvailable: medicines.quantityAvailable })
    .from(medicines)
    .where(eq(medicines.id, medicineId));
  if (!medicine) return { error: "Medicine not found." };

  const next = medicine.quantityAvailable + amount;
  if (next < 0) {
    return { error: `Only ${medicine.quantityAvailable} unit(s) in stock — cannot remove ${Math.abs(amount)}.` };
  }

  await db
    .update(medicines)
    .set({ quantityAvailable: next, updatedAt: new Date() })
    .where(eq(medicines.id, medicineId));

  void auditLog({
    userId: user.id,
    action: "settings_updated",
    metadata: { scope: "medicine_inventory", medicineId, change: amount, newQuantity: next },
  });

  revalidatePath("/doctor/shop");
  return { error: null };
}

/** SET the available quantity outright (stock-take / correction). */
export async function setMedicineQuantity(
  medicineId: number,
  quantity: number
): Promise<StockActionResult> {
  const user = await requireInventoryStaff();
  if (!user) return { error: "You don't have permission to update medicine stock." };
  if (!Number.isInteger(medicineId) || medicineId <= 0) return { error: "Invalid medicine." };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: "Quantity must be 0 or more." };

  await db
    .update(medicines)
    .set({ quantityAvailable: quantity, updatedAt: new Date() })
    .where(eq(medicines.id, medicineId));

  void auditLog({
    userId: user.id,
    action: "settings_updated",
    metadata: { scope: "medicine_inventory", medicineId, newQuantity: quantity },
  });

  revalidatePath("/doctor/shop");
  return { error: null };
}

/** Total units available across the catalogue (for the inventory header). */
export async function getTotalStockUnits(): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${medicines.quantityAvailable}), 0)` })
    .from(medicines);
  return Number(row?.total ?? 0);
}
