import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const doctorId = Number(id);
  if (!doctorId || !Number.isInteger(doctorId)) {
    return new Response("Invalid doctor ID", { status: 400 });
  }

  const [doctor] = await db
    .select({ profilePhotoPath: users.profilePhotoPath })
    .from(users)
    .where(eq(users.id, doctorId))
    .limit(1);
  if (!doctor?.profilePhotoPath) return new Response("Not found", { status: 404 });

  const ext = path.extname(doctor.profilePhotoPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Not found", { status: 404 });

  const filePath = path.resolve(STORAGE_DIR, doctor.profilePhotoPath);
  if (!filePath.startsWith(STORAGE_DIR)) return new Response("Forbidden", { status: 403 });

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