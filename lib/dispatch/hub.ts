/**
 * Event hub for real-time SOS dispatch.
 *
 * DEFAULT (no REDIS_URL): purely in-process — correct for the documented
 * single-instance deployment.
 *
 * WITH REDIS_URL (audit R6): the registry stays process-local (SSE routes
 * are inherently local), and every broadcast is ALSO published to a shared
 * Redis channel. Each instance receives the message and delivers it to its
 * own listeners — so a broadcast from instance A reaches the doctors whose
 * SSE streams hang off instance B, which is the acceptance criterion of the
 * two-instance smoke test. The publisher marks its own messages and skips
 * them on receipt: local delivery already happened synchronously.
 *
 * Failure semantics: a Redis outage never stops the LOCAL delivery path —
 * the publish is fire-and-forget. "sos:taken"/"sos:cancelled" also have
 * durable in-app + push channels downstream, so a dropped cross-instance
 * event degrades to the notifyUser/push fan-out rather than a silent dead
 * screen (see announceSosToDoctors' callers).
 */

import { randomUUID } from "node:crypto";

import { notifyUser } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/push/client";
import { sendNativePushToUser } from "@/lib/push/native";
import { redisClient } from "@/lib/redis";

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
  /**
   * Live stream count per doctor (audit P2). The SSE route cleans up on abort,
   * but nothing previously BOUND the number of open streams: a client that
   * repeatedly opened and aborted a stream could accumulate connections until
   * the process ran out of file descriptors. A doctor needs one stream, so a
   * second connection evicts the oldest — the browser reconnects anyway.
   */
  streams: Map<number, number>;
  /** Count of listener exceptions swallowed (audit R2) — surfaced, not silent. */
  swallowedListenerErrors: number;
};
const g = globalThis as typeof globalThis & { [HUB_KEY]?: HubRegistry };
const registry: HubRegistry = (g[HUB_KEY] ??= {
  listeners: new Map(),
  patientListeners: new Map(),
  streams: new Map(),
  swallowedListenerErrors: 0,
});
const listeners = registry.listeners;
const patientListeners = registry.patientListeners;
const openStreams = registry.streams;

/** Concurrent SSE streams allowed per doctor. One is enough; two tolerates a reconnect race. */
export const MAX_STREAMS_PER_DOCTOR = 2;

// ── Cross-instance bridge (audit R6) ───────────────────────────────────────

const CHANNEL = "skoracare:sos-hub";
const INSTANCE_ID = randomUUID();

type BridgeMessage = {
  /** Who delivered it remotely — the origin instance skips its own message. */
  from: string;
  /** Either doctorIds (doctor listeners) or patientId (patient trackers). */
  doctorIds?: number[];
  patientId?: number;
  event: SosEvent;
};

let bridgeCommitted = false;

let bridgeSubscribed = false;

function ensureBridge(): void {
  if (bridgeCommitted) return;
  bridgeCommitted = true;
  const client = redisClient();
  if (!client) return;
  const subscriber = client.duplicate();
  subscriber.on("message", (_channel, raw) => {
    try {
      const msg = JSON.parse(raw) as BridgeMessage;
      if (msg.from === INSTANCE_ID) return; // delivered locally already
      if (Array.isArray(msg.doctorIds)) {
        for (const id of msg.doctorIds) deliverToDoctorLocally(id, msg.event);
      } else if (typeof msg.patientId === "number") {
        deliverToPatientLocally(msg.patientId, msg.event);
      }
    } catch {
      registry.swallowedListenerErrors++; // malformed message — surfaced, not silent
    }
  });
  subscriber.subscribe(CHANNEL, (err) => {
    bridgeSubscribed = !err;
    if (err) console.error("[sos-hub] Redis bridge subscribe failed; local-only delivery.");
  });
}

function publishRemote(msg: Omit<BridgeMessage, "from">): void {
  ensureBridge();
  const client = redisClient();
  if (!client) return;
  // Fire-and-forget: local delivery already happened; an outage here must
  // never block a dispatch. Publishing is still tried even if OUR subscribe
  // errored — other instances' channels still exist.
  void client.publish(CHANNEL, JSON.stringify({ ...msg, from: INSTANCE_ID })).catch(() => {});
}

/** Deliver ONLY to this process's listeners (no remote fan-out). */
function deliverToDoctorLocally(doctorId: number, event: SosEvent) {
  const set = listeners.get(doctorId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch {
      registry.swallowedListenerErrors++;
    }
  }
}

/** Deliver ONLY to this process's patient trackers. */
function deliverToPatientLocally(patientId: number, event: SosEvent) {
  patientListeners.get(patientId)?.forEach((l) => {
    try {
      l(event);
    } catch {
      registry.swallowedListenerErrors++;
    }
  });
}

/** Subscribe a doctor to live events. Returns an unsubscribe function. */
export function subscribe(doctorId: number, listener: Listener): () => void {
  ensureBridge();
  // Evict the oldest connection(s) once this doctor is at the cap, so a
  // reconnect storm cannot exhaust the process. The evicted listener's own
  // route handler sees the abort and closes its controller.
  const live = openStreams.get(doctorId) ?? 0;
  if (live >= MAX_STREAMS_PER_DOCTOR) {
    const set = listeners.get(doctorId);
    if (set && set.size > 0) {
      const oldest = set.values().next().value;
      if (oldest) set.delete(oldest);
    }
  } else {
    openStreams.set(doctorId, live + 1);
  }

  let set = listeners.get(doctorId);
  if (!set) {
    set = new Set();
    listeners.set(doctorId, set);
  }
  set.add(listener);
  let counted = true;
  return () => {
    set!.delete(listener);
    if (counted && set!.size === 0) {
      listeners.delete(doctorId);
      const n = openStreams.get(doctorId) ?? 1;
      if (n <= 1) openStreams.delete(doctorId);
      else openStreams.set(doctorId, n - 1);
      counted = false;
    }
  };
}

/** Push an event to one doctor, here AND on every other instance (audit R6). */
export function broadcastToDoctor(doctorId: number, event: SosEvent) {
  // Local first, synchronously: this process's SSE subscribers must get the
  // emergency even mid-Redis-outage. Then fan out cross-instance.
  deliverToDoctorLocally(doctorId, event);
  publishRemote({ doctorIds: [doctorId], event });
}

/**
 * Push an event to many doctors. ONE remote publish (not one per doctor):
 * announcements routinely target the whole discovery candidate set, and the
 * message already carries the full id list.
 */
export function broadcastToMany(doctorIds: number[], event: SosEvent) {
  if (doctorIds.length === 0) return;
  for (const id of doctorIds) deliverToDoctorLocally(id, event);
  publishRemote({ doctorIds, event });
}

/** Subscribe a patient's live tracker. Returns an unsubscribe function. */
export function subscribePatient(patientId: number, listener: Listener): () => void {
  ensureBridge(); // needed to RECEIVE cross-instance broadcasts on this process
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

/** Push a status nudge to one patient's open trackers, here AND cross-instance. */
export function broadcastToPatient(patientId: number, event: SosEvent) {
  deliverToPatientLocally(patientId, event);
  publishRemote({ patientId, event });
}

/**
 * Listener exceptions swallowed since this process started (audit R2).
 *
 * Non-zero and rising means a subscriber throws on every event — a bug that
 * the swallow-and-continue policy would otherwise hide completely. Exposed so
 * a debug route or a metric scrape can see it.
 */
export function swallowedListenerErrors(): number {
  return registry.swallowedListenerErrors;
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
