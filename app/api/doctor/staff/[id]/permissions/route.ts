import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { permissions, modelHasPermissions, users } from "@/lib/db/schema";
import { requireApiPermission } from "@/lib/auth/guard";

export const runtime = "nodejs";

const USER_MODEL = "App\\Models\\User";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Module permission matches the /doctor/staff and /doctor/roles pages
  // (`roles-permissions`, audit F-01).
  const user = await requireApiPermission(["doctor", "receptionist"], "roles-permissions");
  if (user instanceof Response) return user;
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const { id } = await params;
  const staffId = Number(id);
  if (!Number.isInteger(staffId)) return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });

  // F-06: match EITHER link column (defence-in-depth; createStaff writes both).
  const [staff] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, staffId),
        or(eq(users.referenceRoleId, doctorId), eq(users.doctorId, doctorId)),
        eq(users.role, "receptionist")
      )
    );
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const rows = await db
    .select({ name: permissions.name })
    .from(permissions)
    .innerJoin(modelHasPermissions, eq(modelHasPermissions.permissionId, permissions.id))
    .where(and(eq(modelHasPermissions.modelId, staffId), eq(modelHasPermissions.modelType, USER_MODEL)));

  return NextResponse.json({ user_permissions: rows.map((r) => r.name) });
}