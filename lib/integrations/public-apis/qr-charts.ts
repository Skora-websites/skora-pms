import "server-only";
import { PUBLIC_API_QR_ENABLED } from "@/lib/config";
import { assertPublicApiEnabled } from "./client";
import { cached, cacheKey } from "./cache";

/**
 * QR PNG bytes for consent slugs, vendor upload links, bill IDs.
 * Server-side only; callers embed as data: URLs in @react-pdf/renderer PDFs
 * (CSP img-src already allows data:). goqr.me primary, solsigs fallback.
 */
export async function qrPngBytes(text: string, size = 220): Promise<{ data: Uint8Array; cached: boolean; source: string }> {
  assertPublicApiEnabled(PUBLIC_API_QR_ENABLED);
  const clean = text.trim().slice(0, 500);
  if (clean.length < 1) throw new Error("QR text required");
  const px = Math.min(500, Math.max(120, Math.floor(size)));
  const key = cacheKey(["qr", `${px}`, clean.slice(0, 200)]);
  const hit = await cached<{ b64: string; source: string }>(key, 90 * 24 * 3600, async () => {
    const urls = [
      `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(clean)}`,
      `https://solsigs.com/qrapi/qr?size=${px}&data=${encodeURIComponent(clean)}`,
    ];
    let lastErr: unknown = null;
    for (const [i, url] of urls.entries()) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`upstream ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.length < 100) throw new Error("empty image");
        return { b64: Buffer.from(buf).toString("base64"), source: i === 0 ? "goqr" : "solsigs" };
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("QR generation failed");
  });
  return { data: new Uint8Array(Buffer.from(hit.data.b64, "base64")), cached: hit.cached, source: hit.data.source };
}

/** Build a QuickChart URL for export images (caller fetches/embeds). */
export function quickChartUrl(kind: "bar" | "line" | "pie", labels: string[], values: number[], title: string): string {
  assertPublicApiEnabled(PUBLIC_API_QR_ENABLED);
  if (labels.length !== values.length || labels.length === 0) throw new Error("Labels/values mismatch");
  if (labels.length > 31) throw new Error("Too many points (max 31)");
  const config = {
    type: kind,
    data: { labels: labels.slice(0, 31), datasets: [{ label: title.slice(0, 80), data: values.slice(0, 31) }] },
    options: { title: { display: true, text: title.slice(0, 80) } },
  };
  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&format=png&width=700&height=360`;
}
