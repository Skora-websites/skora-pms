import { NextResponse } from "next/server";
import { triggerSos, type SosActionResult } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";

export const runtime = "nodejs";

/**
 * POST /api/mobile/sos/trigger
 *
 * Native-client entry point for the emergency dispatch flow. The web app
 * invokes `triggerSos` as a server action; a native HTTP client cannot, so
 * this route re-exports the same function over JSON.
 *
 * Body: { latitude, longitude, radiusKm?, complaint?, notes? }
 */
export async function POST(request: Request) {
  const user = await requireApiRole(["patient", "doctor", "receptionist"]);
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const formData = new FormData();
  formData.set("latitude", String(body.latitude ?? ""));
  formData.set("longitude", String(body.longitude ?? ""));
  formData.set("radiusKm", String(body.radiusKm ?? "10"));
  if (typeof body.complaint === "string") formData.set("complaint", body.complaint);
  if (typeof body.notes === "string") formData.set("notes", body.notes);

  // Server actions are invoked with a FormData "previous state" first arg.
  const result: SosActionResult = await triggerSos({ error: null }, formData);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  if (!result.requestId) {
    return NextResponse.json({ error: "Request was not created." }, { status: 400 });
  }
  return NextResponse.json({ requestId: result.requestId });
}
