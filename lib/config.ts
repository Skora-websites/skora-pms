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
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SkoraCares";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Database (pool tuning; connection string lives in lib/db/index.ts) ───
export const DB_POOL_CONNECTION_LIMIT = num(process.env.DB_POOL_CONNECTION_LIMIT, 10);
export const DB_POOL_QUEUE_LIMIT = num(process.env.DB_POOL_QUEUE_LIMIT, 0);
export const DB_CONNECT_TIMEOUT_MS = num(process.env.DB_CONNECT_TIMEOUT, 10_000);

// ── Sessions ─────────────────────────────────────────────────────────────
/** Session lifetime in seconds (cookie maxAge = JWT expiry). */
export const SESSION_MAX_AGE_S = num(process.env.SESSION_MAX_AGE, 60 * 60 * 24 * 30);

// ── Uploads ──────────────────────────────────────────────────────────────
/** Generic upload cap in bytes (consult PDFs etc.). */
export const MAX_UPLOAD_BYTES = num(process.env.MAX_UPLOAD_SIZE, 10 * 1024 * 1024);
/** Consent files keep the stricter legacy 5 MB cap; overridable. */
export const MAX_CONSENT_FILE_BYTES = num(process.env.MAX_CONSENT_FILE_SIZE, 5 * 1024 * 1024);

// ── Rate limits (sliding window, per key) ────────────────────────────────
export const RATE_LIMIT = {
  /** Failed login attempts per email before lockout. */
  login: num(process.env.RATE_LIMIT_LOGIN, 5),
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
/** WhatsApp gateway endpoint (legacy provider). */
export const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL ?? "https://whatsapp.rajatmarketingss.online/api/create-message";

/** Web-push VAPID identity. */
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@skoracare.com";
