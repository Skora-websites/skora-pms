/**
 * In-memory event hub for real-time SOS dispatch.
 *
 * Single-instance only. For multi-instance deployments, replace this with a
 * Redis pub/sub (same API shape) — documented upgrade path.
 */

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

const listeners = new Map<number, Set<Listener>>();

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
