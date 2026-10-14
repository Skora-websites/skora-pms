import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/health — unauthenticated liveness/readiness probe.
 *
 * The integration-flags route (/api/integrations/health) is session-gated and
 * reports upstream API kill-switches, so it cannot detect a dead database.
 * This one checks the real dependency and returns 503 when it fails, which is
 * what a load balancer or uptime monitor needs.
 *
 * Deliberately leaks only reachability: no version, no row counts, no config.
 */
export async function GET() {
  const startedAt = Date.now();

  let database = "down";
  let detail: string | undefined;
  try {
    // Trivial round-trip that still proves connectivity AND that the pool hand
    // a working connection out.
    await db.execute(sql`SELECT 1`);
    database = "up";
  } catch (err) {
    detail = err instanceof Error ? err.name : "unknown";
  }

  const healthy = database === "up";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: { database },
      ...(detail ? { detail } : {}),
      responseMs: Date.now() - startedAt,
    },
    { status: healthy ? 200 : 503 }
  );
}
