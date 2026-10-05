import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { symptoms, examinations, diagnoses, labTests, medicines } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { sanitizeSpreadsheetCell } from "@/lib/utils";

export const runtime = "nodejs";

const TABLES = {
  symptoms,
  examinations,
  diagnoses,
  "lab-tests": labTests,
  medicines,
} as const;

type Kind = keyof typeof TABLES;

const HEADERS: Record<Kind, string[]> = {
  symptoms: ["name"],
  examinations: ["name"],
  diagnoses: ["name"],
  "lab-tests": ["name"],
  medicines: ["name", "strength", "form", "unit"],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) {
  // Platform-operator only: "admin" is the business owner (a tenant principal).
  // API routes answer 401/403 outright — never redirect (307 hides the denial).
  const user = await requireApiRole(["super_admin"]);
  if (user instanceof Response) return user;

  const { kind } = await params;
  const table = TABLES[kind as Kind];
  if (!table) return new Response("Not found", { status: 404 });

  const rows = await db.select().from(table).orderBy(asc(table.name));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(kind);
  const headers = HEADERS[kind as Kind];
  sheet.addRow(headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1)));
  for (const row of rows) {
    sheet.addRow(
      headers.map((h) => {
        const value = (row as unknown as Record<string, unknown>)[h];
        return sanitizeSpreadsheetCell(value == null ? "" : String(value));
      })
    );
  }
  sheet.columns.forEach((col) => {
    col.width = 24;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${kind}.xlsx"`,
    },
  });
}