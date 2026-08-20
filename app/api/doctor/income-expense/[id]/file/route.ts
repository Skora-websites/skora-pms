import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { audit } from "@/lib/security/audit-log";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * Serve a transaction attachment (receipt/invoice).
 *
 * Authenticated + ownership-scoped: only the owning doctor (or their
 * receptionist/admin) can download the file. Files live outside public/.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const { id } = await params;
  const txId = Number(id);
  if (!Number.isInteger(txId)) return new Response("Not found", { status: 404 });

  const [tx] = await db
    .select({ filePath: transactions.filePath, userId: transactions.userId })
    .from(transactions)
    .where(eq(transactions.id, txId));

  if (!tx?.filePath) return new Response("Not found", { status: 404 });

  // Ownership check: the transaction must belong to this doctor.
  if (tx.userId !== doctorId) return new Response("Forbidden", { status: 403 });

  const ext = path.extname(tx.filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  // Defend against path traversal: only serve files within the uploads directory.
  const resolved = path.resolve(STORAGE_DIR, tx.filePath);
  if (!resolved.startsWith(STORAGE_DIR)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const bytes = await fs.readFile(resolved);
    void audit.fileUploaded(user.id, { txId, action: "download" });
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="attachment${ext}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}