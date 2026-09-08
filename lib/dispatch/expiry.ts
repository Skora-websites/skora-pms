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
