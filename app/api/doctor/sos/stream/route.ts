import { requireApiDoctorOnly } from "@/lib/auth/guard";
import { resolveDoctorId } from "@/lib/dispatch/geo";
import { subscribe } from "@/lib/dispatch/hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream for the doctor emergency panel.
 *
 * Only authenticated doctors can connect. Each doctor gets a live stream of
 * SOS events (new request, taken, cancelled) pushed from the in-memory hub.
 * A 15s heartbeat keeps the connection alive through proxies.
 */
export async function GET(request: Request) {
  // Doctor-only panel (audit F-02): same boundary as /doctor/emergency.
  // The guard rejects BEFORE the stream is constructed, so no orphaned
  // SSE connection is left behind for an unauthorized caller.
  const user = await requireApiDoctorOnly(["doctor", "receptionist"]);
  if (user instanceof Response) return user;
  const doctorId = resolveDoctorId(user);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* connection closed */
        }
      };

      const heartbeat = setInterval(() => send({ type: "ping" }), 15_000);
      const unsubscribe = subscribe(doctorId, (event) => send(event));

      send({ type: "connected", doctorId });

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
