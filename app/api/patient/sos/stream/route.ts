import { requireApiRole } from "@/lib/auth/guard";
import { subscribePatient } from "@/lib/dispatch/hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream for the patient's live SOS tracker.
 *
 * Patient-only; the hub keys listeners by patient id, so one patient's
 * events can never reach another's tab. Frames are lightweight status
 * nudges ("sos:status") — the client refetches
 * /api/patient/sos/status/[id] on receipt, which stays the single source
 * of truth for the tracker. A 15s heartbeat keeps proxies from culling
 * the connection.
 */
export async function GET(request: Request) {
  // Patient-only by role. Ownership of any given request is enforced by the
  // status endpoint this nudges the client toward.
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

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
      const unsubscribe = subscribePatient(user.id, (event) => send(event));

      send({ type: "connected", patientId: user.id });

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
