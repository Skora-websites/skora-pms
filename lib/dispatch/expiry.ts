import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosOffers, sosRequests } from "@/lib/db/schema";
import { SOS_TTL_MIN } from "./geo";

/**
 * Expire a stale pending SOS request inline (business-TTL enforcement).
 *
 * Called on read paths (patient status poll) and before claiming
 * (doctor accept) so stale requests can never be accepted and patients
 * never wait past the TTL. Guarded on `status = 'pending'` — a concurrent
 * cancel/accept always wins over the expiry.
 *
 * Returns true if this call flipped the request to expired.
 */
export async function expireStalePendingRequest(requestId: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - SOS_TTL_MIN * 60_000);
  const claimed = await db
    .update(sosRequests)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(sosRequests.id, requestId), eq(sosRequests.status, "pending"), lt(sosRequests.createdAt, cutoff)));
  if (claimed[0].affectedRows !== 1) return false;
  await db
    .update(sosOffers)
    .set({ status: "expired", respondedAt: new Date() })
    .where(and(eq(sosOffers.sosRequestId, requestId), eq(sosOffers.status, "broadcast")));
  return true;
}

/**
 * Expire every stale pending request — the cron sweep.
 *
 * `expireStalePendingRequest` needs somebody to be looking at the request. A
 * patient who closed the tab, killed the app, or lost signal leaves a pending
 * request no read path ever touches: doctors stay on duty with an open offer
 * for a request nobody can answer. The sweep drives the same TTL rule over the
 * whole table so those requests end and their offers close.
 *
 * Returns how many requests this call flipped to expired. Capped at 500 per
 * pass — a cron running every minute drains any remainder, and the cap keeps a
 * single request off a giant transaction.
 */
export async function expireStalePendingRequests(): Promise<number> {
  const cutoff = new Date(Date.now() - SOS_TTL_MIN * 60_000);
  // Ids first: offers close per request, keyed on the request, so the sweep
  // reuses the single-request rule rather than racing a bulk UPDATE/DELETE.
  const stale = await db
    .select({ id: sosRequests.id })
    .from(sosRequests)
    .where(and(eq(sosRequests.status, "pending"), lt(sosRequests.createdAt, cutoff)))
    .limit(500);

  let expired = 0;
  for (const row of stale) {
    if (await expireStalePendingRequest(row.id)) expired++;
  }
  return expired;
}
