/**
 * Native push sender for the React Native app (Expo) — the FCM/APNs channel
 * that Web Push cannot reach.
 *
 * The server talks to the Expo push service, which fans out to FCM (Android)
 * and APNs (iOS). No service-account key is needed on this side: Expo owns the
 * provider credentials, so the deployment only needs outbound HTTPS.
 *
 * Conventions mirrored from `./client` (Web Push):
 *   - unconfigured ⇒ no-op (NATIVE_PUSH_ENABLED=0 sends nothing, no request)
 *   - never throws: push must never block the dispatch that called it
 *   - dead tokens are pruned instead of retried forever
 */

import { db } from "@/lib/db";
import { deviceTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EXPO_PUSH_ACCESS_TOKEN, EXPO_PUSH_TIMEOUT_MS, NATIVE_PUSH_ENABLED, NATIVE_PUSH_TTL_S } from "@/lib/config";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo refuses a request carrying more than 100 messages. */
export const EXPO_MAX_MESSAGES_PER_REQUEST = 100;
/** Tokens are opaque provider strings; anything longer is not sendable. */
export const NATIVE_TOKEN_MAX_LENGTH = 512;

/** Same payload shape as the Web Push sender so hub.ts can reuse one object. */
export type NativePushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  critical?: boolean;
};

/** Expo message object (subset of the documented message request format). */
export type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  data: { url: string; tag: string };
  sound: "default";
  priority: "high" | "normal";
  /** iOS only: bypasses Do Not Disturb (needs the critical-alerts entitlement). */
  interruptionLevel?: "critical";
  /** Seconds; set for time-bound alerts so a queued one can't fire much later. */
  ttl?: number;
};

/** Push ticket as returned by Expo, positionally aligned with the request. */
export type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

/** Transport seam — the only part a test replaces. */
export type NativePushDeps = {
  post: (url: string, body: unknown, headers: Record<string, string>) => Promise<{
    status: number;
    body: unknown;
  }>;
};

/**
 * Expo push tokens are opaque strings (`ExponentPushToken[…]` or the bare
 * UUID-shaped token current SDKs return). Only the shape is checked here —
 * anything else (spaces, slashes, an email address pasted by mistake) is
 * refused rather than posted.
 */
export function isNativePushToken(token: string): boolean {
  const value = token.trim();
  if (value.length < 8 || value.length > NATIVE_TOKEN_MAX_LENGTH) return false;
  // chars + optional one bracketed legacy suffix
  return /^[A-Za-z0-9_-]+(\[[A-Za-z0-9_-]+\])?$/.test(value);
}

/** Map the shared push payload onto an Expo message. */
export function toExpoMessage(token: string, payload: NativePushPayload): ExpoMessage {
  const critical = payload.critical === true;
  return {
    to: token.trim(),
    title: payload.title,
    body: payload.body,
    data: { url: payload.url ?? "/", tag: payload.tag ?? "skoracare" },
    sound: "default",
    priority: critical ? "high" : "normal",
    // iOS critical alert + bounded redelivery window for emergencies only.
    ...(critical
      ? { interruptionLevel: "critical" as const, ttl: NATIVE_PUSH_TTL_S }
      : {}),
  };
}

/**
 * Split Expo's ticket array into how many were accepted and which indexes the
 * provider says are dead. A per-message error is not a delivered push, and only
 * `DeviceNotRegistered` means the token should stop being used — a rate limit or
 * a credential problem is transient and the token stays.
 */
export function classifyTickets(tickets: ExpoPushTicket[]): {
  delivered: number;
  staleIndexes: number[];
} {
  let delivered = 0;
  const staleIndexes: number[] = [];
  tickets.forEach((ticket, index) => {
    if (ticket.status === "ok") {
      delivered++;
      return;
    }
    if (ticket.details?.error === "DeviceNotRegistered") staleIndexes.push(index);
  });
  return { delivered, staleIndexes };
}

const expoHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (EXPO_PUSH_ACCESS_TOKEN) headers.authorization = `Bearer ${EXPO_PUSH_ACCESS_TOKEN}`;
  return headers;
};

/**
 * Send one payload to many device tokens. Chunks to Expo's per-request limit,
 * prunes the tokens Expo reports as unregistered, and reports how many messages
 * were accepted (accepted ≠ delivered — that is what receipts are for).
 */
export async function sendNativePushToMessages(
  tokens: string[],
  payload: NativePushPayload,
  deps: NativePushDeps
): Promise<{ delivered: number; staleTokens: string[] }> {
  const recipients = tokens.filter(isNativePushToken);
  if (recipients.length === 0) return { delivered: 0, staleTokens: [] };

  const messages = recipients.map((token) => toExpoMessage(token, payload));
  const staleTokens: string[] = [];
  let delivered = 0;

  for (let start = 0; start < messages.length; start += EXPO_MAX_MESSAGES_PER_REQUEST) {
    const chunk = messages.slice(start, start + EXPO_MAX_MESSAGES_PER_REQUEST);
    const chunkTokens = recipients.slice(start, start + EXPO_MAX_MESSAGES_PER_REQUEST);
    try {
      const response = await deps.post(EXPO_PUSH_URL, chunk, expoHeaders());
      // A whole-request failure (4xx/5xx) says nothing about any single token:
      // nothing was delivered and nothing gets pruned.
      if (response.status < 200 || response.status >= 300) continue;
      const tickets = (response.body as { data?: ExpoPushTicket[] } | null)?.data;
      if (!Array.isArray(tickets)) continue;
      const classified = classifyTickets(tickets);
      delivered += classified.delivered;
      // Tickets are positionally aligned with the messages in this chunk.
      for (const index of classified.staleIndexes) {
        const token = chunkTokens[index];
        if (token) staleTokens.push(token);
      }
    } catch {
      // Network/parse failure: this batch is lost, the dispatch continues.
    }
  }

  return { delivered, staleTokens };
}

/** Prune tokens the provider says are gone, so the next send skips them. */
async function pruneTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  for (const token of tokens) {
    await db.delete(deviceTokens).where(eq(deviceTokens.token, token)).catch(() => {});
  }
}

/**
 * Send to every device token a user has registered. Returns the number of
 * messages accepted. Never throws; push must not block the SOS dispatch.
 */
export async function sendNativePushToUser(
  userId: number,
  payload: NativePushPayload
): Promise<number> {
  if (!NATIVE_PUSH_ENABLED) return 0;
  const rows = await db
    .select({ token: deviceTokens.token })
    .from(deviceTokens)
    .where(eq(deviceTokens.userId, userId))
    .catch(() => [] as { token: string }[]);
  const tokens = rows.map((r) => r.token);
  if (tokens.length === 0) return 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXPO_PUSH_TIMEOUT_MS);
    const result = await sendNativePushToMessages(tokens, payload, {
      post: async (url, body, headers) => {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        return { status: response.status, body: await response.json().catch(() => null) };
      },
    });
    clearTimeout(timeout);
    await pruneTokens(result.staleTokens);
    return result.delivered;
  } catch {
    return 0;
  }
}
