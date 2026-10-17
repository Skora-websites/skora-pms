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

// ── Database (pool tuning; connection string lives in lib/db/index.ts) ───
export const DB_POOL_CONNECTION_LIMIT = num(process.env.DB_POOL_CONNECTION_LIMIT, 10);
export const DB_POOL_QUEUE_LIMIT = num(process.env.DB_POOL_QUEUE_LIMIT, 0);
export const DB_CONNECT_TIMEOUT_MS = num(process.env.DB_CONNECT_TIMEOUT, 10_000);

// ── Sessions ─────────────────────────────────────────────────────────────
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
  /** Signup OTP verification attempts per email per 10-minute OTP window. */
  otpVerify: num(process.env.RATE_LIMIT_OTP_VERIFY, 10),
  /** Consent submissions per slug per hour. */
  consent: num(process.env.RATE_LIMIT_CONSENT, 10),
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
export const PUBLIC_API_MEDICINES_ENABLED = process.env.PUBLIC_API_MEDICINES_ENABLED !== "0";
/** Default Indian state code for holiday lookup (DL = Delhi). */
export const HOLIDAY_STATE_DEFAULT = process.env.HOLIDAY_STATE_DEFAULT ?? "DL";

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
