/**
 * In-memory event hub for real-time SOS dispatch.
 *
 * Single-instance only. For multi-instance deployments, replace this with a
 * Redis pub/sub (same API shape) — documented upgrade path.
 */

import { notifyUser } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/push/client";
import { sendNativePushToUser } from "@/lib/push/native";

export type SosEvent =
  | {
      type: "sos:new";
      requestId: number;
      distanceKm: number;
      complaint: string | null;
      patient: string;
    }
  | { type: "sos:taken"; requestId: number }
  | { type: "sos:cancelled"; requestId: number }
  /** Patient-side nudge: "re-fetch your request status now". */
  | { type: "sos:status"; requestId: number; status: string };

type Listener = (event: SosEvent) => void;

/**
 * The listener registry MUST be a cross-bundle singleton. Next.js can load
 * this module once per server bundle (route handlers vs. server actions are
 * separate module graphs in dev), and a plain module-level Map would then be
 * duplicated — broadcasts from triggerSos would never reach SSE subscribers.
 * Storing it on globalThis guarantees one registry per server process.
 */
const HUB_KEY = "__skoracare_sos_hub__";
type HubRegistry = {
  listeners: Map<number, Set<Listener>>;
  /** Patient trackers keyed by patient id — separate namespace, same shape. */
  patientListeners: Map<number, Set<Listener>>;
};
const g = globalThis as typeof globalThis & { [HUB_KEY]?: HubRegistry };
const registry: HubRegistry = (g[HUB_KEY] ??= { listeners: new Map(), patientListeners: new Map() });
const listeners = registry.listeners;
const patientListeners = registry.patientListeners;

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

/** Subscribe a patient's live tracker. Returns an unsubscribe function. */
export function subscribePatient(patientId: number, listener: Listener): () => void {
  let set = patientListeners.get(patientId);
  if (!set) {
    set = new Set();
    patientListeners.set(patientId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) patientListeners.delete(patientId);
  };
}

/** Push a status nudge to one patient's open trackers. */
export function broadcastToPatient(patientId: number, event: SosEvent) {
  patientListeners.get(patientId)?.forEach((l) => l(event));
}

/**
 * The push payload shared by the Web Push and native-push channels.
 *
 * One object, derived once: the copy and the `critical` flag cannot drift
 * between the channel a browser panel receives and the one the mobile app
 * receives. The native channel (FCM/APNs) reads the same fields, so an
 * emergency means high priority + critical alert on iOS for both.
 */
export function sosAnnouncementPushPayload(info: {
  requestId: number;
  distanceKm: number;
  complaint: string | null;
  patient: string;
}): {
  title: string;
  body: string;
  url: string;
  tag: string;
  critical: boolean;
} {
  return {
    title: "🚨 Emergency request nearby",
    body: `${info.patient} needs urgent help${info.complaint ? ` (${info.complaint})` : ""}.`,
    url: "/doctor/emergency",
    tag: "sos-new",
    // Emergency dispatch: persistent notification + double-buzz (see sw.js
    // `push` handler — requireInteraction + vibrate are gated on this), and
    // high priority + iOS critical alert for native delivery.
    critical: true,
  };
}

/**
 * Announce a pending SOS to a set of doctors: live SSE event, in-app
 * notification, Web Push, and native push. Shared by the initial broadcast
 * (triggerSos) and the late-joiner sweep (discovery) so the copy can't drift.
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
  const push = sosAnnouncementPushPayload(info);
  for (const doctorId of doctorIds) {
    void notifyUser({
      userId: doctorId,
      title: push.title,
      message: push.body,
      type: "error",
      link: "/doctor/emergency",
    });
    void sendPushToUser(doctorId, push);
    // Native app: FCM/APNs, the channel that reaches a phone in a pocket.
    // No-op when no device tokens exist or native push is switched off.
    void sendNativePushToUser(doctorId, push);
  }
}
