import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { emailCheckQuerySchema, nameHintQuerySchema } from "@/lib/validation/integrations";
import { checkEmail, hintName } from "@/lib/integrations/public-apis";

export const runtime = "nodejs";

/** GET /api/integrations/email-check?email=a@b.com — deliverability guard (invalid blocks, risky warns). */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager", "patient"]);
  if (user instanceof Response) return user;
  const parsed = emailCheckQuerySchema.safeParse({
    email: request.nextUrl.searchParams.get("email") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid email" }, { status: 400 });
  }
  try {
    const { data, cached } = await checkEmail(parsed.data.email);
    return NextResponse.json({ ...data, cached });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email check failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** POST /api/integrations/email-check { name, kind } — analytics-only name hint. */
export async function POST(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager"]);
  if (user instanceof Response) return user;
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = nameHintQuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  try {
    const { data, cached } = await hintName(parsed.data.name, parsed.data.kind);
    return NextResponse.json({ ...data, cached, note: "Estimate only — never a clinical fact" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hint failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
