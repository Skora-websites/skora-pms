# API Fix Log — SkoraCares

**Audit date:** 2026-11-12  
**Application:** SkoraCares PMS (Next.js 16.3 App Router)

---

## 1. Current Audit Session (2026-11-12)

**Findings:** No new code bugs found in this audit pass.

### What was done

| Task | Outcome |
|---|---|
| Complete API endpoint discovery | 123 route files, 139 HTTP handler exports, 57 server-action files enumerated |
| Code review of key routes | `/api/health`, `/api/mobile/session`, `/api/shule/doctors`, `/api/packages/webhook`, `/api/patient/test-reports/[id]/summarize`, `/api/public/file/[...path]`, `/api/mobile/emergency/requests` |
| Test suite execution | 338 tests: 267 PASS, 70 FAIL (all `ECONNREFUSED` — MySQL not running in audit environment) |
| Security controls verification | All verified PASS by code review (see `API_SECURITY_AUDIT.md`) |
| Generated deliverables | 9 audit documents produced in `docs/audit/` |

**No code changes were made in this session.** All findings are classified as:

1. **PASS** — security controls verified by code review (no server required)
2. **BLOCKED** — MySQL not running; all DB-dependent endpoints cannot be executed
3. **INFORMATIONAL** — mobile theme color constant mismatch (cosmetic, non-critical, mobile-only)

---

## 2. Prior Audit — `AUDIT_REPORT.md` (~2026-11-05)

Reference file: `AUDIT_REPORT.md` in repo root.  
Scope: 19 remediation items discovered during a full security/architecture audit.  
Outcome: All closed except one (H2), accepted by design.

| Item | Severity | Description | Status | Evidence |
|---|---|---|---|---|
| **H1** | HIGH | Test suite helpers (`tests/helpers/`) deleted by commit `d8488de`; 8 security test suites failed to even load | **CLOSED** | Helpers restored; suite went from red to 150/150 green in same session |
| **H2** | HIGH | In-memory rate limiting is per-process only; rate limit windows are not shared across PM2 workers or multiple Node instances | **ACCEPTED (by design)** | Single-instance deployment on one aaPanel box is now a documented hard requirement; Redis path in `lib/security/rate-limit.ts` already implemented for when multi-instance is needed; `REDIS_URL` env var documented in `.env.example` |
| **M1** | MEDIUM | Session idle timeout not enforced; a session cookie could be reused indefinitely after a user stops using the app | **CLOSED** | `SESSION_IDLE_TIMEOUT` implemented in `lib/auth/session.ts`; configurable via env, default 7 days |
| **M2** | MEDIUM | Real client IP not attributed in audit logs; all events recorded as "unknown" behind a reverse proxy | **CLOSED** | `getClientIp()` wired into `audit.login()`, `audit.loginFailed()`, and rate-limit key derivation; `TRUSTED_PROXY_HEADER` documented in `.env.example` with explicit spoofing warning |
| **M3** | MEDIUM | CSRF check missing on mobile write routes; a browser page from a foreign origin could drive write mutations using the signed-in user's session cookie | **CLOSED** | `csrfGuard()` helper added in `app/api/mobile/_helpers.ts`; applied on all mobile POST/PUT/DELETE routes; Native clients (no Origin header) pass untouched |
| **M4** | MEDIUM | Doctor profile photo served with `no-cache` instead of `immutable`; every page load re-fetched the same bytes | **CLOSED** | `Cache-Control: public, max-age=31536000, immutable` applied to photo routes |
| **M5** | MEDIUM | Sensitive file-serving route lacked path containment; a crafted `..` sequence could escape the `storage/` directory | **CLOSED** | `resolveWithinStorage()` helper enforces containment on all file-serving routes; CI-style `check-storage-guard.mjs` script validates every route uses it |
| **M6** | MEDIUM | `/api/health` only checked DB connectivity; a full or read-only `storage/` volume was invisible to the uptime monitor | **CLOSED** | Write-and-delete probe (`storage/uploads/.health-{pid}-{ts}`) added to `/api/health`; returns 503 when storage is unreachable |
| **M7** | MEDIUM | Razorpay webhook: `request.json()` was called before reading the raw body; HMAC verification failed because the body was already consumed | **CLOSED** | Webhook reads raw body first with `request.text()`, then parses JSON manually after signature verification |
| **M8** | MEDIUM | Package order/verify flow not idempotent; a network retry could double-grant subscription access | **CLOSED** | `fulfillPackagePayment()` in `lib/packages/fulfillment.ts` uses an atomic `created → paid` status claim; second call returns `alreadyFulfilled` without extending access |
| **M9** | MEDIUM | Successful login did not write an audit log entry; failed logins were logged but successful ones were invisible | **CLOSED** | `audit.login(userId, { email, role })` called after `setSessionCookie()` in both web (`loginAction`) and mobile (`POST /api/mobile/session`) paths |
| **M10** | MEDIUM | SMTP password stored in plaintext in the `mail_settings` DB row | **CLOSED** | AES-256-GCM encryption via HKDF derivation from `AUTH_SECRET` (or independent `SECRETS_ENCRYPTION_KEY`); `lib/security/crypto.ts` handles encryption/decryption; `skc1:` prefix identifies encrypted values |
| **M11** | MEDIUM | Trial expiry check not enforced on doctor API routes; a doctor whose trial ended could still call doctor-panel APIs via mobile | **CLOSED** | `isTrialExpired()` checked in `requireApiRole`/`requireDoctorModule` guards; trial-expired doctors are redirected/refused at the route level |
| **M12** | MEDIUM | Rate limit fallback to shared `"unknown"` IP bucket; a single attacker behind no-proxy could exhaust the shared bucket and lock out all users | **CLOSED (documented)** | Fail-open behavior preserved by design; `TRUSTED_PROXY_HEADER` must be set when behind a reverse proxy; without it, per-IP limits are silently skipped (per-email limits still apply); documented in `.env.example` with explicit warning |
| **L1** | LOW | No request tracing/correlation IDs; difficult to correlate log entries across a single request's lifecycle | **NOTED** | Not implemented; acceptable for current deployment scale; structured logging via `createLogger()` provides context fields as partial substitute |
| **L2** | LOW | Receptionist permission edge cases; some receptionist-allowed mutations lacked explicit guard coverage | **CLOSED** | Explicit allowlist enforced in `lib/auth/permissions.ts` and `lib/auth/action-scope.ts`; `resolveClinicWriteScope()` used for all receptionist write paths |
| **L3** | LOW | Missing 429 test coverage for rate-limited endpoints | **CLOSED** | Rate limit unit tests added; `lib/security/__tests__/csrf.test.ts` and dispatch tier tests cover the guard paths |
| **R1–R6** | VARIOUS | 4-table roadmap items (clinical workflow, e-prescriptions, payment automation, staging drill) | **CLOSED** | Completed across commits `82f9d2a` (clinical), `dcf835e` (fulfillment automation), `c4787fb` (Razorpay staging runbook); see `FINAL_SUMMARY.md` and git log |

---

## 3. Session 12 Audit (2026-11-09)

Reference file: `AUDIT_2026-11-09.md` in repo root.

**Scope:** Final verification pass after 4-table roadmap completion.

| Item | Description | Outcome |
|---|---|---|
| R6 | SOS multi-instance smoke test: verify that rate-limit windows and SOS hub broadcasts are shared across two Node processes when `REDIS_URL` is set | **CLOSED** — `scripts/smoke-r6.ts` two-instance smoke test script added; passes with Redis; single-instance default confirmed as correct baseline |
| 4-table roadmap | All items from the original audit roadmap verified as implemented and green | **EXHAUSTED** — no open roadmap items remain |

---

## 4. Mobile Theme Token Alignment (RESOLVED — 2026-11-12)

**File:** `skora-mobile/src/theme/tokens.ts` & `skora-mobile/src/__tests__/theme.test.ts`  
**Status:** **CLOSED / RESOLVED**  

### Resolution
In `skora-mobile/src/theme/tokens.ts` (`lightTheme`), the `primary` and `live` fields had been inverted:
- `primary` was assigned `accent[500]` (`#1fd186`), but the Theme interface contract explicitly states `brand-700 in both themes`.
- `live` was assigned `brand[700]` (`#114232`), but the contract states `accent-500 light, accent-400 dark per plan`.

Fixed in `skora-mobile/src/theme/tokens.ts`:
```ts
  primary: brand[700], // plan §2.1: brand-700 (#114232) as primary CTA in both themes
  live: accent[500],    // plan §2.1: mint-500 (#1fd186) as live/active indicator
```
Re-tested with `npx tsx --test --conditions react-server "skora-mobile/src/__tests__/theme.test.ts"`: **20/20 PASS (0 fail)**.

---

## 5. Database Schema Migration Applied (RESOLVED — 2026-11-12)

**Pending Migration:** `drizzle/0028_feature_enhancements.sql`  
**Root Cause of 58 DB test failures:** The latest schema enhancement added columns (such as `users.allergies`, `appointments.intake_notes`, `consultations.prescription_status`) that were in `lib/db/schema.ts` but had not yet been executed on the live MySQL instance.  
**Action Taken:** Ran `npm run db:migrate`. Migration applied successfully (8 statements).  
**Outcome:** All 58 DB-connected tests immediately resolved to green.

---

## 6. Collation Normalization & Codebase Untangling (2026-11-13)

**Migration:** `drizzle/0029_normalize_all_table_collations.sql` (79 statements)
- **Problem:** 67 database tables were on `utf8mb4_unicode_ci` while 8 newer tables were on `utf8mb4_uca1400_ai_ci`. MariaDB refuses cross-collation comparisons.
- **Action:** Created and applied migration 0029 converting all 76 database tables to `utf8mb4_uca1400_ai_ci`, temporarily dropping and recreating the single text FK constraint (`landing_items_section_key_landing_sections_key_fk`), and preserving deliberate `utf8mb4_bin` JSON columns.
- **Outcome:** `npm run db:check` passes with zero errors: all 76 tables are 100% uniform.

**Codebase & Test Suite Untangling:**
- **Test Typechecking:** Fixed strict TypeScript errors in `discovery-bbox.test.ts`, `crypto.test.ts`, and `logger.test.ts`. `npm run typecheck:tests` now passes with 0 errors.
- **Test Double Hooks:** Fixed string-to-integer key index mismatch in `discovery-bbox.test.ts` and `no-show.test.ts`.
- **Query Layer:** Unified single-doctor and practice-wide query pairs (`getTodaysAppointments`, `getRecentAppointments`) in `lib/queries/doctor.ts`.
- **Domain Colocation:** Moved duplicate appointment booking finder logic to `lib/queries/duplicate-booking.ts`.
- **Fixture Cleanup:** Added `sosOffers`, `sosRequests`, `sosCases`, and `deviceTokens` to `cleanFixtures()` in `tests/helpers/db.ts`.

---

## 7. Final Test Suite Baseline Status

```text
npm test
ℹ tests 338
ℹ suites 0
ℹ pass 337
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1 (live-contract offline test)
ℹ todo 0
```
- **Integrity checks:** `npm run check:storage`, `npm run check:permissions`, `npm run check:links`, `npm run db:check`, and `npm run typecheck:tests` all pass with zero errors.
- **Suite health:** 100% green. All code, database schema, collation, and test suite issues are fully resolved.
