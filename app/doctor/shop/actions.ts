"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { medicines } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/guard";

export type MedicineActionResult = { error: string | null };

export async function addMedicine(
  _prev: MedicineActionResult,
  formData: FormData
): Promise<MedicineActionResult> {
  await requireRole(["doctor", "receptionist", "admin"]);

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
