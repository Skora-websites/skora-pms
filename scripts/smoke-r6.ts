/**
 * R6 smoke test, orchestrator (audit §4 item 7 acceptance criterion).
 *
 * "Two-instance smoke test: broadcast reaches all subscribers."
 *
 * Spawns two REAL child processes sharing one Redis:
 *   A ("sub") - subscribes its listeners, then probes the shared limiter key.
 *   B ("pub") - broadcasts and exhausts that key.
 *
 * PASS requires BOTH:
 *  1. A received the sos:new and sos:status events B broadcast (cross-instance
 *     hub bridge works);
 *  2. A's limiter probe came back REFUSED on a key B exhausted (shared window
 *     works - the old per-process limiter would have allowed it).
 *
 * Usage: REDIS_URL must be set (or already in .env) and redis-server running.
 *   npx tsx --conditions react-server scripts/smoke-r6.ts
 */

import "dotenv/config";

import { spawn } from "node:child_process";

const REDIS_URL = process.env.REDIS_URL?.trim();
if (!REDIS_URL) {
  console.error("FAIL: REDIS_URL is not set. Point it at the local redis-server and retry.");
  process.exit(1);
}

const CHILD = "scripts/smoke-r6-child.ts";

function run(mode: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["node_modules/tsx/dist/cli.mjs", "--conditions", "react-server", CHILD, mode],
      { env: { ...process.env, REDIS_URL }, shell: false }
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d: Buffer) => (out += String(d)));
    child.stderr.on("data", (d: Buffer) => (err += String(d)));
    child.on("exit", (code) => {
      if (code === 0) resolve(out.split(/\r?\n/).filter(Boolean));
      else reject(new Error(`child ${mode} exited ${code}:\n${err}`));
    });
  });
}

async function main(): Promise<void> {
  const subPromise = run("sub");
  // Let A get its bridge subscribed BEFORE B publishes; the assertion window in
  // A (2.5 s) is what bounds this sleep, so B's broadcasts land inside it.
  await new Promise((r) => setTimeout(r, 1500));
  await run("pub");
  const subLines = await subPromise;

  const received = subLines
    .filter((l) => l.startsWith("RECEIVED "))
    .map((l) => l.slice("RECEIVED ".length));
  const rlLine = subLines.find((l) => l.startsWith("RLDECISION "));

  const sosNew = received.some((l) => l.includes('"type":"sos:new"') && l.includes(":777"));
  const sosStatus = received.some((l) => l.includes('"type":"sos:status"') && l.includes(":777"));
  const refused = Boolean(rlLine?.includes("allowed=false"));

  console.log(`events received cross-instance: ${received.length}`);
  for (const line of received) console.log(`  ${line}`);
  console.log(rlLine ?? "RLDECISION missing");

  if (sosNew && sosStatus && refused) {
    console.log("\nPASS: broadcast crossed process boundary AND the limiter window is shared.");
    process.exit(0);
  }
  console.error("\nFAIL: see expectations in scripts/smoke-r6.ts header.");
  process.exit(1);
}

void main();
