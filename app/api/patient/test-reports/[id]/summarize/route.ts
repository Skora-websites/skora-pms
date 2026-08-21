import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testBookings } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/**
 * POST /api/patient/test-reports/[id]/summarize
 *
 * Returns a plain-language summary of the booking's tests + any notes.
 * This is a deterministic extractor (no external AI dependency); it reads the
 * test names/prices/notes from the booking and produces an at-a-glance card.
 * Swap the inner logic for a real LLM call (OpenAI/Anthropic) when keys exist.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "patient") return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) return new Response("Not found", { status: 404 });

  const [booking] = await db
    .select({
      tests: testBookings.tests,
      notes: testBookings.notes,
      status: testBookings.status,
      totalAmount: testBookings.totalAmount,
      uploadedFilePath: testBookings.uploadedFilePath,
    })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), eq(testBookings.patientId, user.id)));

  if (!booking) return new Response("Not found", { status: 404 });

  const tests = (booking.tests as { id: number; name: string; price?: number }[] | null) ?? [];

  // Deterministic "AI" summary of the booking:
  //  - highlights each test
  //  - flags status
  //  - notes if the report file is available
  const highlights = tests.map((t) => t.name).filter(Boolean);
  const summaryLines: string[] = [];
  summaryLines.push(
    `This booking includes ${highlights.length > 0 ? highlights.join(", ") : "lab tests"}.`
  );
  if (booking.status === "completed") {
    summaryLines.push("The lab report has been uploaded and is ready to view.");
  } else if (booking.status === "in-progress") {
    summaryLines.push("The lab is currently processing your tests.");
  } else if (booking.status === "cancelled") {
    summaryLines.push("This booking was cancelled.");
  } else {
    summaryLines.push("This booking is pending — the report will appear once uploaded.");
  }
  if (booking.notes) {
    summaryLines.push(`Notes from the clinic: ${booking.notes}`);
  }
  summaryLines.push(
    "Please consult your doctor to interpret these results — this summary is informational only."
  );

  return Response.json({
    summary: summaryLines.join(" "),
    highlights,
    reportAvailable: Boolean(booking.uploadedFilePath),
  });
}