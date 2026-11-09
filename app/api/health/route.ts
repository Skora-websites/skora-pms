import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/health — unauthenticated liveness/readiness probe.
 *
 * The integration-flags route (/api/integrations/health) is session-gated and
 * reports upstream API kill-switches, so it cannot detect a dead database.
 * This one checks the real dependencies and returns 503 when any fails, which
 * is what a load balancer or uptime monitor needs.
 *
 * Storage is probed deliberately (audit R5): uploads live outside the DB, and
 * a read-only volume or a full disk breaks patient-photo and lab-report
 * serving while this endpoint stayed green — the failure was invisible to the
 * monitor that was supposed to catch it. Write-and-delete one byte; the probe
 * leaves nothing behind.
 *
 * Deliberately leaks only reachability: no version, no row counts, no config.
 */
export async function GET() {
  const startedAt = Date.now();

  let database = "down";
  let storage = "down";
  let detail: string | undefined;
  try {
    // Trivial round-trip that still proves connectivity AND that the pool hand
    // a working connection out.
    await db.execute(sql`SELECT 1`);
    database = "up";
  } catch (err) {
    detail = err instanceof Error ? err.name : "unknown";
  }

  try {
    const dir = path.join(process.cwd(), "storage", "uploads");
    const probe = path.join(dir, `.health-${process.pid}-${Date.now()}`);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(probe, "1");
    await fs.unlink(probe);
    storage = "up";
  } catch (err) {
    detail = detail ?? (err instanceof Error ? err.name : "unknown");
  }

  const healthy = database === "up" && storage === "up";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: { database, storage },
      ...(detail ? { detail } : {}),
      responseMs: Date.now() - startedAt,
    },
    { status: healthy ? 200 : 503 }
  );
}
