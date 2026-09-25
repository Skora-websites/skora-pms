/**
 * Web-push endpoint allowlist.
 *
 * subscribeToPush stores a client-supplied endpoint URL and the server later
 * POSTs a VAPID-signed payload to it (lib/push/client.ts). Without a host
 * allowlist, a logged-in user could store an internal URL (cloud metadata
 * service, admin panel, internal API) and use push dispatch as an SSRF probe.
 * Legitimate web-push services are few and well-known, so endpoints are
 * allowlisted by host — enforced at subscribe time AND again before every
 * outbound request (rows stored before this control existed must not ship).
 *
 * Additional hosts (e.g. a self-hosted push server) can be added via the
 * PUSH_ALLOWED_ENDPOINT_HOSTS env var (comma-separated).
 */

/** Well-known public web-push services. */
const DEFAULT_ALLOWED_HOSTS = new Set([
  "fcm.googleapis.com", // Chrome / Android (FCM)
  "updates.push.services.mozilla.com", // Firefox autopush
  "web.push.apple.com", // Safari / Apple web push
]);

/** Operator-curated extras (PUSH_ALLOWED_ENDPOINT_HOSTS), lowercased. */
const EXTRA_ALLOWED_HOSTS = new Set(
  (process.env.PUSH_ALLOWED_ENDPOINT_HOSTS?.split(",") ?? [])
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
);

/**
 * True when the endpoint URL is a web-push endpoint the server is allowed to
 * dereference. Rejects non-http(s) schemes, credentials in the URL, and any
 * host outside the allowlist — which rules out attacker-chosen internal and
 * link-local targets (127.0.0.1, 169.254.169.254, RFC1918, ...).
 */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return false;

  const envAllowed = EXTRA_ALLOWED_HOSTS.has(host);
  // Windows WNS uses regional hosts (wns2-*.notify.windows.com) that cannot
  // be enumerated as a fixed set.
  const defaultAllowed =
    DEFAULT_ALLOWED_HOSTS.has(host) ||
    (!envAllowed && host.endsWith(".notify.windows.com"));
  if (!envAllowed && !defaultAllowed) return false;

  // Built-in services never use non-standard ports; env-added hosts (e.g. a
  // self-hosted push server on :8080) may.
  if (!envAllowed && url.port && url.port !== "443" && url.port !== "80") {
    return false;
  }
  return true;
}
