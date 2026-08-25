"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicines } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/user";

export type MedicineActionResult = { error: string | null };

/** Shop module requires the shop-view permission. */
async function requireShopView(userId: number): Promise<boolean> {
  return hasPermission(userId, "shop-view");
}

export async function addMedicine(
  _prev: MedicineActionResult,
  formData: FormData
): Promise<MedicineActionResult> {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  if (!(await requireShopView(user.id))) return { error: "You don't have permission to manage the shop." };

  const name = String(formData.get("name") ?? "").trim();
  const strength = String(formData.get("strength") ?? "").trim() || null;
  const form = String(formData.get("form") ?? "Tablet").trim() || "Tablet";
  const unit = String(formData.get("unit") ?? "mg").trim() || "mg";

  if (!name) return { error: "Medicine name is required." };

  const now = new Date();
  await db.insert(medicines).values({ name, strength, form, unit, createdAt: now, updatedAt: now });

  revalidatePath("/doctor/shop");
  return { error: null };
}

export async function editMedicine(
  _prev: MedicineActionResult,
  formData: FormData
): Promise<MedicineActionResult> {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  if (!(await requireShopView(user.id))) return { error: "You don't have permission to manage the shop." };

  const medicineId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const strength = String(formData.get("strength") ?? "").trim() || null;
  const form = String(formData.get("form") ?? "Tablet").trim() || "Tablet";
  const unit = String(formData.get("unit") ?? "mg").trim() || "mg";

  if (!name) return { error: "Medicine name is required." };
  if (!Number.isInteger(medicineId) || medicineId < 1) return { error: "Invalid medicine ID." };

  const now = new Date();
  await db.update(medicines).set({ name, strength, form, unit, updatedAt: now }).where(eq(medicines.id, medicineId));

  revalidatePath("/doctor/shop");
  return { error: null };
}

export async function deleteMedicine(medicineId: number): Promise<MedicineActionResult> {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  if (!(await requireShopView(user.id))) return { error: "You don't have permission to manage the shop." };

  if (!Number.isInteger(medicineId) || medicineId < 1) return { error: "Invalid medicine ID." };

  await db.delete(medicines).where(eq(medicines.id, medicineId));

  revalidatePath("/doctor/shop");
  return { error: null };
}
