import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { chartQuerySchema, qrQuerySchema } from "@/lib/validation/integrations";
import { quickChartUrl, qrPngBytes } from "@/lib/integrations/public-apis";

export const runtime = "nodejs";

/** GET /api/integrations/qr?text=…&size=220 — QR PNG for consent/vendor/bill links. Graceful omit on failure. */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager"]);
  if (user instanceof Response) return user;
  const params = request.nextUrl.searchParams;
  // Chart mode: ?mode=chart&kind=bar&labels=a,b&values=1,2&title=T
  if (params.get("mode") === "chart") {
    const parsed = chartQuerySchema.safeParse({
      kind: params.get("kind") ?? "bar",
      title: params.get("title") ?? "Clinic stats",
      labels: params.get("labels") ?? "",
      values: params.get("values") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid chart" }, { status: 400 });
    }
    try {
      const labels = parsed.data.labels.split(",").map((s) => s.trim()).filter(Boolean);
      const values = parsed.data.values.split(",").map((s) => Number(s.trim()));
      if (values.some((v) => !Number.isFinite(v))) {
        return NextResponse.json({ error: "Values must be numbers" }, { status: 400 });
      }
      if (labels.length !== values.length) {
        return NextResponse.json({ error: "Labels and values count must match" }, { status: 400 });
      }
      if (labels.length > 31) {
        return NextResponse.json({ error: "Too many points (max 31)" }, { status: 400 });
      }
      const url = quickChartUrl(parsed.data.kind, labels, values, parsed.data.title);
      return NextResponse.json({ url, attribution: "quickchart.io" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chart failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }
  const parsed = qrQuerySchema.safeParse({
    text: params.get("text") ?? "",
    size: params.get("size") ?? "220",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid QR input" }, { status: 400 });
  }
  try {
    const { data, cached, source } = await qrPngBytes(parsed.data.text, parsed.data.size);
    return new NextResponse(Buffer.from(data), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=7776000, immutable",
        "X-QR-Cached": cached ? "1" : "0",
        "X-QR-Source": source,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "QR generation failed";
    // Callers (PDF render) must omit the QR rather than fail the document.
    return NextResponse.json({ error: message, omit: true }, { status: 502 });
  }
}
