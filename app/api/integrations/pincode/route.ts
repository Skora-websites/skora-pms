import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { pincodeQuerySchema } from "@/lib/validation/integrations";
import { lookupPincode } from "@/lib/integrations/public-apis";
import { PublicApiUpstreamError } from "@/lib/integrations/public-apis/client";

export const runtime = "nodejs";

/** GET /api/integrations/pincode?pincode=110001 — Indian PIN lookup (cached 90d). */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager", "patient"]);
  if (user instanceof Response) return user;
  const parsed = pincodeQuerySchema.safeParse({
    pincode: request.nextUrl.searchParams.get("pincode") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid pincode" }, { status: 400 });
  }
  try {
    const { data, cached } = await lookupPincode(parsed.data.pincode);
    return NextResponse.json({ ...data, cached, attribution: "SearchPincode.in (CC BY 4.0)" });
  } catch (err) {
    if (err instanceof PublicApiUpstreamError && err.status === 404) {
      return NextResponse.json({ error: "PIN not found" }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "PIN lookup failed";
    const status = /disabled/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
