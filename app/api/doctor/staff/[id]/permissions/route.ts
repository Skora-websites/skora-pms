import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { permissions, modelHasPermissions, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

const USER_MODEL = "App\\Models\\User";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const { id } = await params;
  const staffId = Number(id);
  if (!Number.isInteger(staffId)) return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });

  const [staff] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, staffId), eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")));
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const rows = await db
    .select({ name: permissions.name })
    .from(permissions)
    .innerJoin(modelHasPermissions, eq(modelHasPermissions.permissionId, permissions.id))
    .where(and(eq(modelHasPermissions.modelId, staffId), eq(modelHasPermissions.modelType, USER_MODEL)));

  return NextResponse.json({ user_permissions: rows.map((r) => r.name) });
}