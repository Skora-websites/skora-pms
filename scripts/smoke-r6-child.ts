/**
 * R6 smoke test, child process (§4 item 7 acceptance: two-instance delivery).
 *
 * Run BY scripts/smoke-r6.ts with REDIS_URL set. Modes:
 *  - sub   : subscribes a fake doctor + a fake patient, prints every event,
 *            then (after a marker line) probes the SHARED rate-limit window.
 *  - pub   : broadcasts to that doctor/patient from THIS process and exhausts
 *            the shared limiter key.
 *
 * Both instances import the same modules; only separate PROCESSES give the
 * multi-instance claim meaning — a second import in-process would share the
 * module registry and prove nothing.
 */

import "dotenv/config";

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode !== "sub" && mode !== "pub") {
    console.error("usage: tsx smoke-r6-child.ts <sub|pub>");
    process.exit(2);
  }

  const { subscribe, subscribePatient, broadcastToMany, broadcastToPatient } = await import(
    "../lib/dispatch/hub"
  );
  const { rateLimit } = await import("../lib/security/rate-limit");

  const DOCTOR_ID = 987654321;
  const PATIENT_ID = 123456789;
  const RL_WINDOW_MS = 60_000;
  const RL_LIMIT = 3;

  const log = (line: string): void => {
    process.stdout.write(`${line}\n`);
  };

  if (mode === "sub") {
    subscribe(DOCTOR_ID, (event) => log(`RECEIVED ${JSON.stringify(event)}`));
    subscribePatient(PATIENT_ID, (event) => log(`RECEIVED ${JSON.stringify(event)}`));
    // Give the publisher time to broadcast and exhaust the shared window, then
    // probe the same key from this instance: refusal here (key exhausted THERE)
    // is the proof the limiter window is shared, not per-process.
    setTimeout(async () => {
      const decision = await rateLimit("r6-smoke-shared", RL_LIMIT, RL_WINDOW_MS);
      log(`RLDECISION allowed=${decision.allowed} retryAfterMs=${decision.retryAfterMs}`);
      process.exit(0);
    }, 2500);
  } else {
    broadcastToMany([DOCTOR_ID], {
      type: "sos:new",
      requestId: 777,
      distanceKm: 3.14,
      complaint: "chest pain",
      patient: "Smoke Patient",
    });
    broadcastToPatient(PATIENT_ID, { type: "sos:status", requestId: 777, status: "accepted" });
    for (let i = 0; i < RL_LIMIT; i++) {
      await rateLimit("r6-smoke-shared", RL_LIMIT, RL_WINDOW_MS);
    }
    log("PUBLISHED");
    process.exit(0);
  }
}

void main();
