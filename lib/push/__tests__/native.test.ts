import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyTickets,
  isNativePushToken,
  sendNativePushToMessages,
  toExpoMessage,
  type NativePushPayload,
  type NativePushDeps,
  type ExpoPushTicket,
} from "../native";

const sosPayload: NativePushPayload = {
  title: "🚨 Emergency request nearby",
  body: "Ramesh Kumar needs urgent help (chest pain).",
  url: "/doctor/emergency",
  tag: "sos-new",
  critical: true,
};

const quietPayload: NativePushPayload = {
  title: "Appointment updated",
  body: "Your appointment moved to 11:30.",
  url: "/doctor/schedule",
};

const okTicket = (id: string): ExpoPushTicket => ({ status: "ok", id });

const staleTicket: ExpoPushTicket = {
  status: "error",
  message: "is not a registered push notification recipient",
  details: { error: "DeviceNotRegistered" },
};

const transientTicket: ExpoPushTicket = {
  status: "error",
  message: "rate limited",
  details: { error: "MessageRateExceeded" },
};

/** Stub transport: returns whatever tickets the test wants, records every call. */
const stubPost = (
  tickets: ExpoPushTicket[],
  httpStatus = 200
): NativePushDeps & { calls: Array<{ url: string; messages: unknown[] }> } => {
  const calls: Array<{ url: string; messages: unknown[] }> = [];
  return {
    calls,
    async post(url, body) {
      calls.push({ url, messages: body as unknown[] });
      return { status: httpStatus, body: { data: tickets } };
    },
  };
};

test("an emergency payload becomes a high-priority critical Expo message", () => {
  const message = toExpoMessage("ExponentPushToken[abc123]", sosPayload);

  assert.equal(message.to, "ExponentPushToken[abc123]");
  assert.equal(message.title, sosPayload.title);
  assert.equal(message.body, sosPayload.body);
  assert.deepEqual(message.data, { url: "/doctor/emergency", tag: "sos-new" });
  assert.equal(message.priority, "high");
  assert.equal(message.sound, "default");
  // iOS critical alert — the whole point of the channel for an emergency.
  assert.equal(message.interruptionLevel, "critical");
  // Time-bounded: a queued SOS alert must not fire hours later.
  assert.ok(typeof message.ttl === "number" && message.ttl > 0);
});

test("a non-emergency payload stays at normal priority without a critical alert", () => {
  const message = toExpoMessage("ExponentPushToken[abc123]", quietPayload);

  assert.equal(message.priority, "normal");
  assert.equal(message.interruptionLevel, undefined);
  assert.equal(message.ttl, undefined);
  assert.deepEqual(message.data, { url: "/doctor/schedule", tag: "skoracare" });
});

test("a malformed or oversized device token is never sent", () => {
  assert.equal(isNativePushToken("ExponentPushToken[abc123]"), true);
  // Current SDKs return a bare UUID-shaped token with no bracket wrapper.
  assert.equal(isNativePushToken("ExponentPushTokenAbc123XyZ456"), true);
  assert.equal(isNativePushToken("short"), false);
  assert.equal(isNativePushToken(""), false);
  assert.equal(isNativePushToken(`x${"a".repeat(600)}`), false);
  assert.equal(isNativePushToken("token with spacesxxxxxxxx"), false);
  assert.equal(isNativePushToken("token/slashes/xxxxxxxx"), false);
  assert.equal(isNativePushToken("JustAnEmail@example.com"), false);
});

test("tickets are classified: delivered count plus tokens Expo says are dead", () => {
  const { delivered, staleIndexes } = classifyTickets([okTicket("1"), staleTicket, okTicket("3")]);

  assert.equal(delivered, 2);
  assert.deepEqual(staleIndexes, [1]);
});

test("a transient per-message failure is not treated as a dead device", () => {
  const { delivered, staleIndexes } = classifyTickets([transientTicket]);

  assert.equal(delivered, 0);
  assert.deepEqual(staleIndexes, []);
});

test("a dead token is pruned so the next dispatch skips it", async () => {
  const post = stubPost([staleTicket, okTicket("2")]);

  const result = await sendNativePushToMessages(
    ["ExponentPushToken[dead]", "ExponentPushToken[alive]"],
    sosPayload,
    post
  );

  assert.equal(result.delivered, 1);
  assert.deepEqual(result.staleTokens, ["ExponentPushToken[dead]"]);
});

test("messages are chunked to Expo's 100-per-request limit", async () => {
  const post = stubPost([]);
  const tokens = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[t${i}xxx]`);

  await sendNativePushToMessages(tokens, sosPayload, post);

  assert.equal(post.calls.length, 3);
  assert.deepEqual(
    post.calls.map((c) => c.messages.length),
    [100, 100, 50]
  );
  assert.equal(post.calls[0].url, "https://exp.host/--/api/v2/push/send");
});

test("a failed request reports nothing delivered and never throws", async () => {
  const deps: NativePushDeps = {
    async post() {
      return { status: 500, body: { errors: [{ code: "INTERNAL", message: "boom" }] } };
    },
  };

  const result = await sendNativePushToMessages(["ExponentPushToken[abc123]"], sosPayload, deps);
  assert.equal(result.delivered, 0);
  assert.deepEqual(result.staleTokens, []);
});

test("a network failure resolves to zero delivered", async () => {
  const deps: NativePushDeps = {
    async post() {
      throw new Error("ECONNREFUSED");
    },
  };

  const result = await sendNativePushToMessages(["ExponentPushToken[abc123]"], sosPayload, deps);
  assert.equal(result.delivered, 0);
  assert.deepEqual(result.staleTokens, []);
});

test("no tokens means no request at all", async () => {
  const post = stubPost([]);

  const result = await sendNativePushToMessages([], sosPayload, post);

  assert.equal(result.delivered, 0);
  assert.equal(post.calls.length, 0);
});
