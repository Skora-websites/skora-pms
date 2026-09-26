"use server";

// The medicines catalogue is shared practice-wide master data (no per-doctor
// ownership column). Catalogue CRUD lives in lib/actions/inventory.ts
// (createMedicine/updateMedicine/deleteMedicine — legacy MasterController
// parity) alongside the stock actions; super-admin Masters (kind "medicines")
// manages the same table from the platform side.

export type MedicineActionResult = { error: string | null };
