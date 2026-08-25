import { getCurrentUser } from "@/lib/auth/user";
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
  const user = await getCurrentUser();
  if (!user || !["doctor", "receptionist", "admin"].includes(user.role)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

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
