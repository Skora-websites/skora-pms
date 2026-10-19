import { NextRequest, NextResponse } from "next/server";
import { like } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireApiRole } from "@/lib/auth/guard";

export const runtime = "nodejs";

/**
 * GET /api/medicines/search?q=para
 *
 * Searches the `medicines` master catalog (same table the super-admin
 * masters CRUD manages) by name. Returns up to 20 matching medicines
 * for the consultation-form autocomplete dropdown.
 */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist"]);
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";

  if (!q.trim() || q.trim().length < 2) {
    return NextResponse.json({ medicines: [] });
  }

  const rows = await db
    .select({ id: schema.medicines.id, name: schema.medicines.name })
    .from(schema.medicines)
    .where(like(schema.medicines.name, `%${q.trim()}%`))
    .limit(20);

  return NextResponse.json({ medicines: rows });
}