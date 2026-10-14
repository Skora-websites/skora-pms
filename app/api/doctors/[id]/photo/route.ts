import fs from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { resolveWithinStorage } from "@/lib/utils/uploads";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "patient", "super_admin"]);
  if (user instanceof Response) return user;

  const { id } = await params;
  const doctorId = Number(id);
  if (!doctorId || !Number.isInteger(doctorId)) {
    return new Response("Invalid doctor ID", { status: 400 });
  }

  // Target constraint (audit F-12): the route previously accepted ANY user
  // id — patients included — letting any authenticated account enumerate the
  // user-id space and pull non-doctor profile photos. The booking UI only
  // ever renders DOCTOR photos here, so the target is constrained to the
  // doctor role while staying readable by every signed-in tier.
  const [doctor] = await db
    .select({ profilePhotoPath: users.profilePhotoPath })
    .from(users)
    .where(and(eq(users.id, doctorId), eq(users.role, "doctor")))
    .limit(1);
  if (!doctor?.profilePhotoPath) return new Response("Not found", { status: 404 });

  const ext = path.extname(doctor.profilePhotoPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Not found", { status: 404 });

  const filePath = resolveWithinStorage(doctor.profilePhotoPath);
  if (!filePath) return new Response("Forbidden", { status: 403 });

  try {
    const bytes = await fs.readFile(filePath);
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}