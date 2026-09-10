/**
 * In-memory event hub for real-time SOS dispatch.
 *
 * Single-instance only. For multi-instance deployments, replace this with a
 * Redis pub/sub (same API shape) — documented upgrade path.
 */

import { notifyUser } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/push/client";

export type SosEvent =
  | {
      type: "sos:new";
      requestId: number;
      distanceKm: number;
      complaint: string | null;
      patient: string;
    }
  | { type: "sos:taken"; requestId: number }
  | { type: "sos:cancelled"; requestId: number };

type Listener = (event: SosEvent) => void;

/**
 * The listener registry MUST be a cross-bundle singleton. Next.js can load
 * this module once per server bundle (route handlers vs. server actions are
 * separate module graphs in dev), and a plain module-level Map would then be
 * duplicated — broadcasts from triggerSos would never reach SSE subscribers.
 * Storing it on globalThis guarantees one registry per server process.
 */
const HUB_KEY = "__skoracare_sos_hub__";
type HubRegistry = { listeners: Map<number, Set<Listener>> };
const g = globalThis as typeof globalThis & { [HUB_KEY]?: HubRegistry };
const registry: HubRegistry = (g[HUB_KEY] ??= { listeners: new Map() });
const listeners = registry.listeners;

/** Subscribe a doctor to live events. Returns an unsubscribe function. */
export function subscribe(doctorId: number, listener: Listener): () => void {
  let set = listeners.get(doctorId);
  if (!set) {
    set = new Set();
    listeners.set(doctorId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(doctorId);
  };
}

export function broadcastToDoctor(doctorId: number, event: SosEvent) {
  const set = listeners.get(doctorId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch {
      // A listener error must never break the dispatch.
    }
  }
}

export function broadcastToMany(doctorIds: number[], event: SosEvent) {
  for (const id of doctorIds) broadcastToDoctor(id, event);
}

/**
 * Announce a pending SOS to a set of doctors: live SSE event, in-app
 * notification, and Web Push. Shared by the initial broadcast (triggerSos)
 * and the late-joiner sweep (discovery) so the copy can't drift.
 */
export async function announceSosToDoctors(
  doctorIds: number[],
  info: { requestId: number; distanceKm: number; complaint: string | null; patient: string }
): Promise<void> {
  if (doctorIds.length === 0) return;
  broadcastToMany(
    doctorIds,
    {
      type: "sos:new",
      requestId: info.requestId,
      distanceKm: info.distanceKm,
      complaint: info.complaint,
      patient: info.patient,
    }
  );
  const body = `${info.patient} needs urgent help${info.complaint ? ` (${info.complaint})` : ""}.`;
  for (const doctorId of doctorIds) {
    void notifyUser({
      userId: doctorId,
      title: "🚨 Emergency request nearby",
      message: body,
      type: "error",
      link: "/doctor/emergency",
    });
    void sendPushToUser(doctorId, {
      title: "🚨 Emergency request nearby",
      body,
      url: "/doctor/emergency",
      tag: "sos-new",
    });
  }
}
