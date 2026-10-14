import { NextResponse } from "next/server";
import { cancelSos } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";

export const runtime = "nodejs";

/**
 * POST /api/mobile/sos/[id]/cancel
 *
 * Patient cancels their own active SOS request (owner-only, enforced inside
 * the shared `cancelSos` action).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await cancelSos(requestId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
