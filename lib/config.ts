/**
 * Central runtime configuration — every tunable in one place, all sourced
 * from environment variables with safe development defaults. Nothing else
 * in the codebase should hardcode these values.
 *
 * Documented in full in `.env.example`.
 */

/** Number-like env with fallback. */
function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ── App identity ─────────────────────────────────────────────────────────
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Multi-instance deployment (audit V1/V2) ───────────────────────────────
/**
 * Optional Redis connection string. When set, rate-limit windows and the SOS
 * dispatch event hub are meant to be shared across instances rather than being
 * per-process — without it, running two Node processes multiplies every limit
 * by instance count and silently drops emergency broadcasts that crossed a
 * process boundary.
 *
 * Left undefined, the app runs single-instance by design: the limiter and the
 * hub are in-memory, which is correct for one process on one aaPanel box. The
 * requirement is documented in docs/planning/DEPLOY_AND_MOBILE_PLAN.md §1.8.
 */
export const REDIS_URL = process.env.REDIS_URL?.trim() || undefined;

/** True when a shared backend is configured. */
export const IS_MULTI_INSTANCE_READY = Boolean(REDIS_URL);

// ── Database (pool tuning; connection string lives in lib/db/index.ts) ───
export const DB_POOL_CONNECTION_LIMIT = num(process.env.DB_POOL_CONNECTION_LIMIT, 10);
export const DB_POOL_QUEUE_LIMIT = num(process.env.DB_POOL_QUEUE_LIMIT, 0);
export const DB_CONNECT_TIMEOUT_MS = num(process.env.DB_CONNECT_TIMEOUT, 10_000);

// ── Sessions ─────────────────────────────────────────────────────────────
/**
 * Optional dedicated key for secret encryption at rest.
 *
 * When unset, the encryption key is derived from AUTH_SECRET via HKDF with a
 * purpose label (see lib/security/crypto.ts) — session signing and at-rest
 * confidentiality then use two DISTINCT keys even though only one secret is
 * configured, so rotating AUTH_SECRET to kill sessions no longer silently
 * orphans every encrypted value.
 */
export const SECRETS_ENCRYPTION_KEY = process.env.SECRETS_ENCRYPTION_KEY?.trim() || undefined;
/** Session lifetime in seconds (cookie maxAge = JWT expiry). */
export const SESSION_MAX_AGE_S = num(process.env.SESSION_MAX_AGE, 60 * 60 * 24 * 30);
/** Idle timeout in seconds (audit F-10): a session unused this long is
 *  revoked on its next use, so a stolen/abandoned cookie can't ride the
 *  full 30-day absolute lifetime. 0 disables the idle check. */
export const SESSION_IDLE_TIMEOUT_S = num(process.env.SESSION_IDLE_TIMEOUT, 60 * 60 * 24 * 7);
/** Minimum seconds between `last_activity` writes — activity refresh is
 *  throttled so ordinary browsing doesn't hit the sessions table on every
 *  request (audit F-10). */
export const SESSION_ACTIVITY_REFRESH_S = num(process.env.SESSION_ACTIVITY_REFRESH, 300);

// ── Uploads ──────────────────────────────────────────────────────────────
/** Generic upload cap in bytes (consult PDFs etc.). */
export const MAX_UPLOAD_BYTES = num(process.env.MAX_UPLOAD_SIZE, 10 * 1024 * 1024);
/** Consent files keep the stricter legacy 5 MB cap; overridable. */
export const MAX_CONSENT_FILE_BYTES = num(process.env.MAX_CONSENT_FILE_SIZE, 5 * 1024 * 1024);
// Per-kind caps (audit F-25): nine upload sites hardcoded byte counts,
// bypassing this module — so tuning MAX_UPLOAD_SIZE in the environment
// changed nothing on those paths. Messages at every site are DERIVED from
// the value so a raised limit never ships with a stale "under 5 MB" string.
export const MEGABYTE = 1024 * 1024;
/** Images: profile/patient photos, clinic logos, signature. */
export const MAX_IMAGE_BYTES = num(process.env.MAX_IMAGE_SIZE, 2 * MEGABYTE);
/** Small attachments: transaction/expense receipts. */
export const MAX_ATTACHMENT_BYTES = num(process.env.MAX_ATTACHMENT_SIZE, 3 * MEGABYTE);
/** Vendor lab reports. */
export const MAX_REPORT_BYTES = num(process.env.MAX_REPORT_SIZE, 5 * MEGABYTE);
/** Owned-media videos (support tutorials). */
export const MAX_VIDEO_BYTES = num(process.env.MAX_VIDEO_SIZE, 200 * MEGABYTE);
/** Master-data spreadsheet imports (Excel/CSV). */
export const MAX_IMPORT_BYTES = num(process.env.MAX_IMPORT_SIZE, 5 * MEGABYTE);
/** Brand assets (light/dark logo, favicon) — smaller than photos. */
export const MAX_BRAND_BYTES = num(process.env.MAX_BRAND_SIZE, 1 * MEGABYTE);

/** Human-readable MB figure for upload-cap messages ("under 2 MB"). */
export function mbLabel(bytes: number): number {
  return Math.max(1, Math.round(bytes / MEGABYTE));
}

// ── Rate limits (sliding window, per key) ────────────────────────────────
export const RATE_LIMIT = {
  /** Failed login attempts per email before lockout. */
  login: num(process.env.RATE_LIMIT_LOGIN, 5),
  /** Login attempts per client IP per window — bounds distributed
   *  credential stuffing against one known account, which the per-email
   *  key alone cannot see (audit F-07). */
  loginIp: num(process.env.RATE_LIMIT_LOGIN_IP, 20),
  /** Login window in ms (also the lockout duration). */
  loginWindowMs: num(process.env.RATE_LIMIT_LOGIN_WINDOW_MINUTES, 15) * 60_000,
  /** Signups per email per hour. */
  signup: num(process.env.RATE_LIMIT_SIGNUP, 3),
  /**
   * Authenticated request budget for the `/api/mobile/**` namespace (audit V5).
   *
   * The auth actions above are throttled, but the ~70 mobile read routes were
   * not — a valid token could hammer `available-slots`, `doctors` or `records`
   * and only the database would stop it. Keyed on the resolved USER id rather
   * than the IP, since mobile clients share NAT.
   */
  mobileApi: num(process.env.RATE_LIMIT_MOBILE_API, 300),
  mobileApiWindowMs: num(process.env.RATE_LIMIT_MOBILE_API_WINDOW_MINUTES, 1) * 60_000,
  /** Signup OTP verification attempts per email per 10-minute OTP window. */
  otpVerify: num(process.env.RATE_LIMIT_OTP_VERIFY, 10),
  /** Consent submissions per slug per hour. */
  consent: num(process.env.RATE_LIMIT_CONSENT, 10),
  /** Unauthenticated vendor lab-report uploads per client IP per hour (audit V5). */
  vendorUploadIp: num(process.env.RATE_LIMIT_VENDOR_UPLOAD_IP, 20),
  /** Guard-level per-user API budget (audit V12) — requests per minute per resolved user. */
  apiGuard: num(process.env.RATE_LIMIT_API_GUARD, 300),
  apiGuardWindowMs: num(process.env.RATE_LIMIT_API_GUARD_WINDOW_MINUTES, 1) * 60_000,
  /** Demo requests per email per hour. */
  demo: num(process.env.RATE_LIMIT_DEMO, 5),
  /** Chat polls per user per minute. */
  chatPoll: num(process.env.RATE_LIMIT_CHAT_POLL, 30),
  /** SOS requests per user per minute (legacy: 1). */
  emergency: num(process.env.RATE_LIMIT_EMERGENCY, 1),
} as const;

// ── Messaging / integrations ─────────────────────────────────────────────
// NOTE (audit F-27): the dead lib/whatsapp.ts gateway client and its
// WHATSAPP_API_URL export were removed — nothing imported the module and the
// hardcoded third-party endpoint shipped unmaintained. The "Send OTP
// (WhatsApp)" label in the booking form is a UI option without a gateway
// behind it — a product decision, not a code path.

// ── Free public APIs (no-key, public-apis/public-apis) ─────────────────
// All calls are server-side only (Route Handler / server action), never with
// PHI in the URL. Each domain has a kill-switch + TTL so a flaky upstream
// degrades to current behavior instead of blocking booking/billing.
export const PUBLIC_API_ENABLED = process.env.PUBLIC_API_ENABLED !== "0";
export const PUBLIC_API_TIMEOUT_MS = num(process.env.PUBLIC_API_TIMEOUT_MS, 8000);
export const PUBLIC_API_CONTACT = process.env.PUBLIC_API_CONTACT ?? "admin@skoracare.com";
export const PUBLIC_API_GEO_ENABLED = process.env.PUBLIC_API_GEO_ENABLED !== "0";
export const PUBLIC_API_HOLIDAY_ENABLED = process.env.PUBLIC_API_HOLIDAY_ENABLED !== "0";
export const PUBLIC_API_WEATHER_ENABLED = process.env.PUBLIC_API_WEATHER_ENABLED !== "0";
export const PUBLIC_API_VALIDATION_ENABLED = process.env.PUBLIC_API_VALIDATION_ENABLED !== "0";
export const PUBLIC_API_QR_ENABLED = process.env.PUBLIC_API_QR_ENABLED !== "0";
export const PUBLIC_API_REFERENCE_ENABLED = process.env.PUBLIC_API_REFERENCE_ENABLED !== "0";
/** Default Indian state code for holiday lookup (DL = Delhi). */
export const HOLIDAY_STATE_DEFAULT = process.env.HOLIDAY_STATE_DEFAULT ?? "DL";

// ── Indian clinical data (consultation form) ─────────────────────────────
// India-only clinical reference. Default provider reads a committed snapshot
// (no keys, works offline — see lib/integrations/india/README notes and
// scripts/import-india-datasets.mjs for the refresh path). Set
// INDIA_API_BASE_URL (+ optional INDIA_API_KEY) to proxy the SAME search
// surface to a live India provider (NAMASTE/FHIR gateway, data.gov.in
// mirror…) instead — same response shape, no UI change.
export const INDIA_API_ENABLED = process.env.INDIA_API_ENABLED !== "0";
export const INDIA_API_BASE_URL = process.env.INDIA_API_BASE_URL?.trim() || null;
export const INDIA_API_KEY = process.env.INDIA_API_KEY?.trim() || null;
export const INDIA_API_TIMEOUT_MS = num(process.env.INDIA_API_TIMEOUT_MS, 8000);

// ── SOS emergency dispatch ──────────────────────────────────────────────
/** Pending SOS requests expire after this many minutes (business TTL).
 *  Client-safe: the patient booking copy and the doctor offer countdown
 *  both need it without touching the server-only geo/db modules. */
export const SOS_TTL_MIN = num(process.env.SOS_TTL_MIN, 5);

/**
 * Offer timeout (minutes) — how long a broadcast offer stands before the
 * dispatch widens its search (audit P5: Uber/Ola re-dispatch loop).
 *
 * This is a DIFFERENT clock from SOS_TTL_MIN, and that separation is the
 * feature. The request TTL is the outer bound on a patient's wait; the offer
 * TTL governs how quickly the system concludes "nobody within this radius
 * wants this" and reaches further out. Before this existed, a patient in a
 * thin-supply area waited the full request TTL even though a doctor at 1.5x
 * the radius could have served them — the offer set was a snapshot frozen at
 * trigger time, and only the 20s late-joiner sweep (which re-runs the SAME
 * radius) could add to it. 0 disables the escalation entirely, restoring the
 * old behaviour.
 */
export const SOS_OFFER_TTL_MIN = num(process.env.SOS_OFFER_TTL_MIN, 1);

/**
 * Radius multiplier per escalation round, and the hard ceiling. Each round
 * re-discovers at `currentRadius * multiplier`, capped at SOS_ESCALATION_MAX
 * — a widening ring that stops rather than dispatching the whole continent.
 * The patient's submitted `radius_km` (schema-capped at 50) is round 1, so
 * these are multipliers/ceilings, not absolute radii.
 */
export const SOS_ESCALATION_FACTOR = num(process.env.SOS_ESCALATION_FACTOR, 1.5);
export const SOS_ESCALATION_MAX_KM = num(process.env.SOS_ESCALATION_MAX_KM, 50);
/** Highest escalation round index we will run (round 0 is the initial broadcast). */
export const SOS_MAX_ESCALATION_ROUND = num(process.env.SOS_MAX_ESCALATION_ROUND, 2);

/** Shared cap for road/ETA speed lookups, mirroring the public-API pattern. */
export const SOS_ETA_SPEED_KMH = num(process.env.SOS_ETA_SPEED_KMH, 30);

/**
 * Minimum seconds between accepted doctor location pings for one case
 * (audit P7).
 *
 * A GPS-driven client that pings as fast as it likes turns the emergency hot
 * path into an unthrottled write stream: every ping rewrites a sos_cases row,
 * and the patient's tracker re-fetches on each ETA change. Uber caps its
 * driver location stream at roughly one update per 4 seconds for the same
 * reason — the cadence is a *sampling* compromise between smooth tracking and
 * a write path that survives a fleet of phones.
 *
 * Pings arriving faster than this are ACCEPTED but COALESCED: the endpoint
 * returns the currently stored ETA rather than a 429. A client that respects
 * the cadence sees no difference; one that does not gets the last known ETA
 * instead of hammering the database. 0 disables the throttle.
 */
export const SOS_LOCATION_PING_INTERVAL_S = num(process.env.SOS_LOCATION_PING_INTERVAL_S, 4);

// ── SOS emergency dispatch fare ─────────────────────────────────────────
// Base + per-km, floored at a minimum. Per-minute is priced but not charged
// yet: trip duration is not tracked, so completion bills distance + base only.
export const SOS_FARE = {
  baseFare: num(process.env.SOS_FARE_BASE, 100),
  perKm: num(process.env.SOS_FARE_PER_KM, 25),
  perMinute: num(process.env.SOS_FARE_PER_MINUTE, 2),
  minFare: num(process.env.SOS_FARE_MIN, 100),
  currency: "INR",
} as const;

/** Estimated dispatch fare for a distance — same math the bill settles with. */
export function estimateSosFare(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return SOS_FARE.minFare;
  return Math.max(SOS_FARE.minFare, SOS_FARE.baseFare + distanceKm * SOS_FARE.perKm);
}

// ── Mobile application ──────────────────────────────────────────────────
// The Emergency dispatch feature (Uber-style patient booking + doctor
// alerts) is native-app-only: browsers — desktop or installed PWA — see a
// "download our app" notice instead. Point these at the real store listings
// when they ship; until then the CTA lands on the marketing site.
export const APP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL?.trim() || "/";
export const APP_DOWNLOAD_LABEL = process.env.NEXT_PUBLIC_APP_DOWNLOAD_LABEL?.trim() || "Download the app";

// ── Native push (Expo push service → FCM/APNs) ──────────────────────────
// Web Push reaches browsers only; the native app needs FCM/APNs. The server
// talks to the Expo push service (no service-account key to sign with), which
// fans out to FCM/APNs. Kill switch mirrors the public-API pattern: 0 disables
// it instantly and every send degrades to the Web Push channel alone.
export const NATIVE_PUSH_ENABLED = process.env.NATIVE_PUSH_ENABLED !== "0";
export const EXPO_PUSH_TIMEOUT_MS = num(process.env.EXPO_PUSH_TIMEOUT_MS, 8000);
/** Optional Expo access token — required once push security is enabled in the
 *  EAS dashboard (otherwise leaked tokens could impersonate this server). */
export const EXPO_PUSH_ACCESS_TOKEN = process.env.EXPO_PUSH_ACCESS_TOKEN?.trim() || null;
/** Redelivery window for emergency alerts: a queued SOS notification must
 *  never fire hours later. Non-emergency sends keep the provider default. */
export const NATIVE_PUSH_TTL_S = num(process.env.NATIVE_PUSH_TTL_S, 600);
