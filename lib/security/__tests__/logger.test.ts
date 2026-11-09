import "dotenv/config";

import test from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "../logger";

/**
 * The structured logger's contract (audit R3).
 *
 * Capture console for the duration of the call under test, restoring it
 * immediately after — the assertions then read the captured array. NODE_ENV is
 * forced to "production" because the runner leaves it unset, and the
 * production form (single-line JSON) is the one under test.
 */

/** Run `fn` with console captured; returns the emitted lines. */
function captureConsole<T>(fn: () => T): { result: T; lines: string[] } {
  const lines: string[] = [];
  const push = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  const orig = { error: console.error, log: console.log, warn: console.warn };
  (console as unknown as { error: typeof push }).error = push;
  (console as unknown as { log: typeof push }).log = push;
  (console as unknown as { warn: typeof push }).warn = push;
  try {
    const result = fn();
    return { result, lines };
  } finally {
    console.error = orig.error;
    console.log = orig.log;
    console.warn = orig.warn;
  }
}

/** Run `fn` in production mode, restoring NODE_ENV afterwards. */
function asProduction(fn: () => void): void {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prev;
  }
}

test("a logger emits one single-line JSON record per event", () => {
  asProduction(() => {
    const { lines } = captureConsole(() =>
      createLogger("packages/webhook").error("Fulfillment failed.", { orderId: "order_1" })
    );
    assert.equal(lines.length, 1, "exactly one line per event");
    const record = JSON.parse(lines[0]);
    assert.equal(record.level, "error");
    assert.equal(record.component, "packages/webhook");
    assert.equal(record.msg, "Fulfillment failed.");
    assert.equal(record.orderId, "order_1");
    assert.ok(typeof record.at === "string", "a timestamp is present");
  });
});

test("an Error in context is flattened to a message, not a stack dump", () => {
  asProduction(() => {
    const { lines } = captureConsole(() =>
      createLogger("t").error("db down", { err: new Error("connection refused") })
    );
    assert.equal(lines.length, 1);
    assert.ok(!lines[0].includes("\n"), "the record must stay on one line");
    const record = JSON.parse(lines[0]);
    assert.equal(record.err, "Error: connection refused");
  });
});

test("a circular context still emits a record instead of throwing", () => {
  asProduction(() => {
    const circular: Record<string, unknown> = { orderId: "o1" };
    circular.self = circular;
    const { lines } = captureConsole(() => createLogger("t").error("still logged", circular));
    assert.ok(lines.length >= 1, "the fallback must still emit");
    assert.ok(lines.some((l) => l.includes("still logged")));
  });
});

test("development keeps the human-readable form", () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    const { lines } = captureConsole(() =>
      createLogger("dev").info("started", { port: 3000 })
    );
    assert.equal(lines.length, 1);
    assert.match(lines[0], /^\[dev\] started port=3000$/);
  } finally {
    if (prev === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prev;
  }
});
