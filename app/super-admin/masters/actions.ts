"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { symptoms, examinations, diagnoses, labTests, medicines } from "@/lib/db/schema";
import { MAX_IMPORT_BYTES, mbLabel } from "@/lib/config";

import { audit } from "@/lib/security/audit-log";

/** Shared super-admin guard + result type (previously in the one big actions.ts). */
export type AdminActionResult = { error: string | null };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

// ── Master data CRUD (legacy `MasterController` parity) ─────────────────────

const MASTER_TABLES = {
  symptoms,
  examinations,
  diagnoses,
  "lab-tests": labTests,
  medicines,
} as const;
const MASTER_LABELS: Record<string, string> = {
  symptoms: "symptom",
  examinations: "examination",
  diagnoses: "diagnosis",
  "lab-tests": "lab test",
  medicines: "medicine",
};

function masterTable(kind: string) {
  return MASTER_TABLES[kind as keyof typeof MASTER_TABLES] as unknown as typeof symptoms | undefined;
}

export async function storeMasterItem(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const table = masterTable(kind);
  if (!table) return { error: "Invalid master type." };
  const label = MASTER_LABELS[kind];

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: `The ${label} name is required.` };
  if (name.length > 255) return { error: `The ${label} name must be at most 255 characters.` };

  if (kind === "medicines") {
    const strength = String(formData.get("strength") ?? "").trim() || null;
    const form = String(formData.get("form") ?? "").trim() || "Tablet";
    const unit = String(formData.get("unit") ?? "").trim() || "mg";
    const [dup] = await db
      .select({ id: medicines.id })
      .from(medicines)
      .where(eq(medicines.name, name));
    if (dup) return { error: "A medicine with this name already exists." };
    await db.insert(medicines).values({ name, strength, form, unit, createdAt: new Date(), updatedAt: new Date() });
  } else {
    const [dup] = await db.select({ id: symptoms.id }).from(table).where(eq(table.name, name));
    if (dup) return { error: `A ${label} with this name already exists.` };
    await db.insert(table).values({ name, createdAt: new Date(), updatedAt: new Date() });
  }

  void audit.categoryCreated(admin.id, { action: "master_created", kind, name });

  revalidatePath("/super-admin/masters");
  return { error: null };
}

export async function updateMasterItem(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const table = masterTable(kind);
  if (!table) return { error: "Invalid master type." };
  const label = MASTER_LABELS[kind];
  const itemId = Number(formData.get("id"));
  if (!Number.isInteger(itemId)) return { error: "Invalid ID." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: `The ${label} name is required.` };
  if (name.length > 255) return { error: `The ${label} name must be at most 255 characters.` };

  const [existing] = await db.select().from(table).where(eq(table.id, itemId));
  if (!existing) return { error: "Record not found." };

  const [dup] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.name, name), ne(table.id, itemId)));
  if (dup) return { error: `A ${label} with this name already exists.` };

  if (kind === "medicines") {
    const strength = String(formData.get("strength") ?? "").trim() || null;
    const form = String(formData.get("form") ?? "").trim() || "Tablet";
    const unit = String(formData.get("unit") ?? "").trim() || "mg";
    await db
      .update(medicines)
      .set({ name, strength, form, unit, updatedAt: new Date() })
      .where(eq(medicines.id, itemId));
  } else {
    await db.update(table).set({ name, updatedAt: new Date() }).where(eq(table.id, itemId));
  }

  void audit.categoryUpdated(admin.id, { action: "master_updated", kind, itemId, name });

  revalidatePath("/super-admin/masters");
  return { error: null };
}

export async function deleteMasterItem(kind: string, itemId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const table = masterTable(kind);
  if (!table) return { error: "Invalid master type." };
  if (!Number.isInteger(itemId)) return { error: "Invalid ID." };

  const [existing] = await db.select({ id: table.id }).from(table).where(eq(table.id, itemId));
  if (!existing) return { error: "Record not found." };

  await db.delete(table).where(eq(table.id, itemId));

  void audit.categoryDeleted(admin.id, { action: "master_deleted", kind, itemId });

  revalidatePath("/super-admin/masters");
  return { error: null };
}

export async function importMasterItems(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const table = masterTable(kind);
  if (!table) return { error: "Invalid master type." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Choose a file to import." };
  if (file.size > MAX_IMPORT_BYTES) return { error: `File must be under ${mbLabel(MAX_IMPORT_BYTES)} MB.` };
  const fileName = file.name.toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());

  // Magic-byte check — a renamed .txt/… must never reach the parsers.
  const isZip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07);
  if (fileName.endsWith(".xlsx") && !isZip) return { error: "That file is not a real .xlsx spreadsheet." };
  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
    return { error: "Only .xlsx or .csv files are supported." };
  }

  const rows: { name: string; strength?: string; form?: string; unit?: string }[] = [];
  try {
    if (fileName.endsWith(".xlsx")) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(bytes as never);
      const sheet = workbook.worksheets[0];
      if (!sheet) return { error: "The file has no worksheet." };
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // header
        const cells = (row.values as (string | number | undefined)[]).slice(1);
        const name = String(cells[0] ?? "").trim();
        if (!name) return;
        rows.push({
          name,
          strength: String(cells[1] ?? "").trim() || undefined,
          form: String(cells[2] ?? "").trim() || undefined,
          unit: String(cells[3] ?? "").trim() || undefined,
        });
      });
    } else if (fileName.endsWith(".csv")) {
      const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
      for (const line of text.split(/\r?\n/)) {
        const cells = line.split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1"));
        if (!cells[0] || cells[0].toLowerCase() === "name") continue;
        rows.push({
          name: cells[0],
          strength: cells[1] || undefined,
          form: cells[2] || undefined,
          unit: cells[3] || undefined,
        });
      }
    } else {
      return { error: "Only .xlsx or .csv files are supported." };
    }
  } catch {
    return { error: "Could not read the file. Make sure it is a valid spreadsheet." };
  }

  if (rows.length === 0) return { error: "No rows found in the file." };
  if (rows.length > 1000) return { error: "At most 1000 rows can be imported at once." };

  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    if (r.name.length > 255) {
      skipped++;
      continue;
    }
    const [dup] = await db.select({ id: table.id }).from(table).where(eq(table.name, r.name));
    if (dup) {
      skipped++;
      continue;
    }
    if (kind === "medicines") {
      await db
        .insert(medicines)
        .values({
          name: r.name,
          strength: r.strength ?? null,
          form: r.form || "Tablet",
          unit: r.unit || "mg",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    } else {
      await db.insert(table).values({ name: r.name, createdAt: new Date(), updatedAt: new Date() });
    }
    inserted++;
  }

  void audit.categoryCreated(admin.id, {
    action: "master_imported",
    kind,
    inserted,
    skipped,
    fileName,
  });

  revalidatePath("/super-admin/masters");
  return { error: inserted > 0 ? null : `No new rows imported (${skipped} duplicates/skips).` };
}
