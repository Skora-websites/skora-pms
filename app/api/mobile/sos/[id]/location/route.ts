import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { updateDoctorLocation } from "@/lib/dispatch/actions";

export const runtime = "nodejs";

/**
 * POST /api/mobile/sos/[id]/location
 *
 * Doctor-side live GPS push for the native app. The web panel calls the
 * `updateDoctorLocation` server action; this route exposes it over JSON so a
 * Flutter client can stream fixes while it is en route.
 *
 * Body: { latitude, longitude }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole(["doctor", "receptionist"]);
  if (user instanceof Response) return user;

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  const result = await updateDoctorLocation(requestId, lat, lng);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, etaMinutes: result.etaMinutes ?? null });
}
