import { NextRequest, NextResponse } from "next/server";
import { like } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/**
 * GET /api/medicines/search?q=para
 *
 * Mirrors legacy `medicines/search` route: searches medicine_masters by name.
 * Returns up to 20 matching medicines for the autocomplete dropdown.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";

  if (!q.trim() || q.trim().length < 2) {
    return NextResponse.json({ medicines: [] });
  }

  const rows = await db
    .select({ id: schema.medicineMasters.id, name: schema.medicineMasters.name })
    .from(schema.medicineMasters)
    .where(like(schema.medicineMasters.name, `%${q.trim()}%`))
    .limit(20);

  return NextResponse.json({ medicines: rows });
}