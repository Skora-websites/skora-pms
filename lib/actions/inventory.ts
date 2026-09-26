"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicines } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { auditLog } from "@/lib/security/audit-log";

export type StockActionResult = { error: string | null };

async function requireInventoryStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist"].includes(user.role)) {
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

// ── Catalogue CRUD (legacy MasterController parity) ───────────────────────

/** Name is the catalogue's natural key — super-admin masters enforces the same rule. */
async function assertNameFree(name: string, excludeId?: number): Promise<string | null> {
  const [dup] = await db
    .select({ id: medicines.id })
    .from(medicines)
    .where(
      excludeId
        ? and(eq(medicines.name, name), ne(medicines.id, excludeId))
        : eq(medicines.name, name)
    )
    .limit(1);
  return dup ? "A medicine with this name already exists." : null;
}

function parseMedicineForm(formData: FormData): { name: string; strength: string | null; form: string; unit: string } | string {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return "The medicine name is required.";
  if (name.length > 255) return "The medicine name must be at most 255 characters.";
  // Field lengths mirror the schema columns (varchar 255) so the DB never
  // truncates silently.
  const strength = String(formData.get("strength") ?? "").trim() || null;
  if (strength && strength.length > 255) return "Strength must be at most 255 characters.";
  const form = String(formData.get("form") ?? "").trim() || "Tablet";
  if (form.length > 255) return "Form must be at most 255 characters.";
  const unit = String(formData.get("unit") ?? "").trim() || "mg";
  if (unit.length > 255) return "Unit must be at most 255 characters.";
  return { name, strength, form, unit };
}

export async function createMedicine(
  _prev: StockActionResult,
  formData: FormData
): Promise<StockActionResult> {
  const user = await requireInventoryStaff();
  if (!user) return { error: "You don't have permission to manage medicines." };

  const parsed = parseMedicineForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  const dupError = await assertNameFree(parsed.name);
  if (dupError) return { error: dupError };

  await db.insert(medicines).values({ ...parsed, quantityAvailable: 0, createdAt: new Date(), updatedAt: new Date() });

  void auditLog({
    userId: user.id,
    action: "settings_updated",
    metadata: { scope: "medicine_inventory", created: parsed.name },
  });

  revalidatePath("/doctor/shop");
  return { error: null };
}

export async function updateMedicine(
  _prev: StockActionResult,
  formData: FormData
): Promise<StockActionResult> {
  const user = await requireInventoryStaff();
  if (!user) return { error: "You don't have permission to manage medicines." };

  const medicineId = Number(formData.get("medicine_id"));
  if (!Number.isInteger(medicineId) || medicineId <= 0) return { error: "Invalid medicine." };

  const [existing] = await db
    .select({ id: medicines.id, name: medicines.name })
    .from(medicines)
    .where(eq(medicines.id, medicineId))
    .limit(1);
  if (!existing) return { error: "Medicine not found." };

  const parsed = parseMedicineForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  const dupError = await assertNameFree(parsed.name, medicineId);
  if (dupError) return { error: dupError };

  await db
    .update(medicines)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(medicines.id, medicineId));

  void auditLog({
    userId: user.id,
    action: "settings_updated",
    metadata: { scope: "medicine_inventory", medicineId, from: existing.name, to: parsed.name },
  });

  revalidatePath("/doctor/shop");
  return { error: null };
}

export async function deleteMedicine(medicineId: number): Promise<StockActionResult> {
  const user = await requireInventoryStaff();
  if (!user) return { error: "You don't have permission to manage medicines." };
  if (!Number.isInteger(medicineId) || medicineId <= 0) return { error: "Invalid medicine." };

  const [existing] = await db
    .select({ id: medicines.id, name: medicines.name })
    .from(medicines)
    .where(eq(medicines.id, medicineId))
    .limit(1);
  if (!existing) return { error: "Medicine not found." };

  await db.delete(medicines).where(eq(medicines.id, medicineId));

  void auditLog({
    userId: user.id,
    action: "settings_updated",
    metadata: { scope: "medicine_inventory", deleted: existing.name, medicineId },
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
