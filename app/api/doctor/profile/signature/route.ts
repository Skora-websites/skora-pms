import fs from "node:fs/promises";
import path from "node:path";
import { requireApiPermission } from "@/lib/auth/guard";
import { resolveWithinStorage } from "@/lib/utils/uploads";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET() {
  // Matches /doctor/profile → "dashboard" module in DOCTOR_ROUTE_PERMISSIONS.
  const user = await requireApiPermission(["doctor", "receptionist"], "dashboard");
  if (user instanceof Response) return user;
  if (!user.signaturePath) return new Response("Not found", { status: 404 });

  const ext = path.extname(user.signaturePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Not found", { status: 404 });

  const filePath = resolveWithinStorage(user.signaturePath);
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