# Auth + RBAC Security Verification Report

**Codebase:** `skoracare_old` (Next.js 16 App Router, Drizzle ORM, server components + server actions)
**Scope:** Authentication flows (login, signup, OTP, logout, session), middleware (`proxy.ts`), per-role route gating (doctor / patient / super-admin / vendor / receptionist), server-action permission checks, API route auth matrix, cross-role access (IDOR), and supporting security infrastructure (`lib/auth/*`, `lib/security/*`).
**Method:** Full source read of auth libraries, auth pages/actions, layouts, all 39 API routes (auth-marker scan + manual reads of representative routes), permission/action guards, rate limiting, IP resolution, audit logging, token handling, and the e2e auth matrix. Static analysis only; no code modified.
**Role:** Security-focused review (auth + RBAC). Read-only.

---

## 1. Executive Summary

The authentication core is **well-designed and consistently enforced**: JWT sessions are DB-revocable, cookies have correct flags, login/signup are rate-limited and audited, signup roles are whitelisted, every dashboard segment has a layout-level role guard, **37 of 39 API routes carry in-file auth checks** (the 2 exceptions are intentionally public, token/slug-gated), ownership helpers prevent IDOR on the sampled data paths, and an e2e auth matrix runs in CI. Session revocation is unusually thorough (password change, role/status change, staff delete, admin kick all kill sessions).

The main residual risks are **authorization-layer privilege escalation inside the super-admin panel** (an `admin` can mint a `super_admin`), the **absence of any edge/middleware session check** (route protection is a single layout+action layer with no second net), a **production CSP that unconditionally allows `unsafe-inline` scripts**, **per-email-only rate limiting with spoofable IP resolution**, and a **30-day session lifetime with no idle timeout** for a PHI-bearing system.

| Severity | Count | Headline items |
|---|---|---|
| Critical | 0 | — |
| High | 1 | `admin` can create/escalate to `super_admin` via `storeUser`/`updateUser` |
| Medium | 6 | No middleware session check; prod CSP `unsafe-inline`; 30-day sessions, no idle timeout; per-email-only login rate limit + spoofable client IP; receptionist self-permission edit; vendor upload tokens never expire |
| Low | 9 | Fail-open JWT-without-jti path; plaintext/non-constant-time OTP; per-email-only signup limit; fail-open audit logging; non-constant-time vendor token check; `frame-ancestors` missing; no API-token scope model; limiter observability; dev OTP echo risk surface |
| GAP | 4 | No self-service password reset; no 2FA for privileged roles; no Redis-backed limiter for multi-instance prod; e2e auth matrix not auto-derived from routes |

---

## 2. Authentication Flows

### 2.1 Login — `app/(auth)/login/actions.ts`
**PASS.**
- Zod validation (`loginSchema`), email normalized to lowercase.
- Per-email rate limit: 5 attempts / 15 min (`authRateLimit.login`, `lib/security/rate-limit.ts:63`), checked **before** the user lookup.
- Generic error `"Invalid email or password."` for both "no account" and "bad password" (lines 50–59) — **no account enumeration** via the login form. Failure reasons are distinguished only in the audit log (`audit.loginFailed` with `reason: no_account | bad_password | deactivated`).
- bcrypt verification (`verifyPassword`, `lib/auth/password.ts`) — bcryptjs handles Laravel `$2y$` hashes for migrated users. Cost 10 (legacy parity).
- Deactivated accounts rejected at login (line 61) **and** at every request via `getCurrentUser` (`lib/auth/user.ts:73`).
- Session-fixation hygiene: an existing session belonging to a deactivated account is destroyed before a new cookie is issued (lines 69–83); every login mints a fresh jti (`setSessionCookie` → `randomUUID()`).
- Successful login resets the failure counter and writes `audit.login` (lines 85–89).
- Post-login redirect targets are fixed role homes / first-permitted doctor path — **no open-redirect** surface.

### 2.2 Signup — `app/(auth)/signup/actions.ts` + `otp-actions.ts`
**PASS** (with low-severity notes below).
- **Role whitelist enforced server-side:** `if (!["patient","doctor"].includes(role)) return { error: "Invalid account type." }` (lines 85–87). A client cannot self-assign `super_admin`/`admin`/`receptionist` at signup.
- **Mandatory OTP verification** (`verifySignupOtp`): 6-digit `crypto.randomInt` OTP, 10-minute TTL, single-use, previous unused OTPs invalidated per email (`otp-actions.ts:32–42`). `emailVerifiedAt` is set at creation — the OTP *is* the email-verification step.
- Rate limits: 3 signups/hour per email and 3 OTP sends/hour per email (`authRateLimit.signup`).
- Duplicate email handled pre-check + `isDupKey` race fallback (lines 115–118, 144–149); user + system role + default doctor permissions created **in one transaction** (`createUser`, lines 31–69).
- Doctor trial window computed from server-side `companySettings` (lines 121–129) — not client-controllable.
- OTP is echoed to the client **only when `NODE_ENV !== "production"`** (`otp-actions.ts:53–54`) — correct gate (see Low-2 for residual risk surface).
- Password minimum length enforced by `signupSchema` (`lib/validation/index.ts`); bcrypt cost 10.

### 2.3 Logout — `lib/actions/auth.ts`
**PASS.** Reads the current jti, **deletes the server-side session row** (revocation, not just cookie deletion), deletes the cookie, and writes `audit.logout`. Stale tokens are handled (`destroySession` clears the cookie even on invalid tokens).

### 2.4 Session management — `lib/auth/session.ts`
**PASS** (with Medium-3 lifetime note).
- HS256 JWT signed with `AUTH_SECRET` (fails hard if unset — `getSecret()` lines 19–23). Local `.env` secret is 56 chars and **git-ignored / untracked** (verified via `git check-ignore` + `git ls-files`); `.env.example` carries only a placeholder with rotation instructions.
- Cookie flags: `httpOnly: true`, `secure` in production, `sameSite: "lax"`, `path: "/"`, `maxAge` 30 days (lines 121–127). CSRF exposure is correspondingly limited; Next.js server actions add built-in origin checks.
- **Server-side revocation is real:** every login persists a `sessions` row keyed by jti; `getSessionUserId` re-checks the row on every request (lines 101–109). Revocation is wired into all the right places:
  - password change (self): `revokeOtherSessionsForUser` — `app/doctor/profile/actions.ts:167–169`
  - staff credential reset / staff delete: `revokeAllSessionsForUser` — `app/doctor/staff/actions.ts:138, 169`
  - admin user edit (password/role/status change): `app/super-admin/actions.ts:438–441`
  - admin deactivate: `app/super-admin/actions.ts:469`
  - deactivated users additionally blocked per-request by `getCurrentUser` (`lib/auth/user.ts:69–73`) — closes the "already logged in" gap.
- Revocation persistence failures are swallowed on write (availability) but the check is **fail-closed** at verification time (missing row → null session).

---

## 3. Middleware / Proxy — `proxy.ts`

**PASS (function as designed) + ISSUE Medium-1 (no auth enforcement at the edge).**
- Sets security headers on every matched response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic denied, geolocation self), HSTS (prod only, 1-year + preload + subdomains), and a CSP.
- Exposes `x-pathname` to server components so the doctor layout can permission-gate before data fetches — sound design.
- `/receptionist/*` is rewritten onto `/doctor/*`; no auth is attempted in the rewrite (correctly delegated to the layout guard).
- Matcher excludes only `_next/static`, `_next/image`, favicon/apple-touch/screenshot assets — all pages and API routes are covered by the header pass.

---

## 4. Per-Role Route Gating

Static scan of every `page.tsx`: **all unguarded pages are intentionally public** (`(auth)/login`, `(auth)/signup`, `(marketing)/**`, `vendor/upload-test/[token]`). Every dashboard page is covered by a segment layout guard, and dynamic `[id]` pages additionally call `notFound()` for foreign records.

| Area | Guard | Evidence |
|---|---|---|
| `/doctor/**` + `/receptionist/**` | `requireRole(["doctor","receptionist","admin"])` + trial lockout for doctors + **server-side module-permission gate** (`hasDoctorModuleAccess`) that redirects before page queries run, in both URL spaces, with redirect-loop protection | `app/doctor/layout.tsx:22–52` |
| `/patient/**` | `requireRole(["patient"])` at segment root | `app/patient/layout.tsx` (patient review + e2e matrix) |
| `/super-admin/**` | `requireRole(["super_admin","admin"])` | `app/super-admin/layout.tsx:25` |
| Vendor upload | Unauthenticated by design; gated by per-booking `uploadLinkToken` (UUID); cancelled/completed bookings rejected; conditional single-winner update | `app/vendor/upload-test/[token]/actions.ts:49–105` |
| `/trial-expired` | Public page that self-redirects unauthenticated visitors via `getCurrentUser` | `app/(auth)/trial-expired/page.tsx:3–5` |

- Role↔home map is centralized (`ROLE_HOME`, `lib/auth/user.ts:171–181`); wrong-role access redirects to the actor's own home (never leaks target content).
- Cross-role URL access is covered by e2e: anon → 401/403/307-`/login` on 11 protected API endpoints; doctor → redirected from `/super-admin/*`; admin → redirected from `/doctor/*` (`e2e/auth-matrix.spec.ts`).
- Doctor module permissions: single source of truth shared by nav, layout gate, client gate, and server actions (`lib/auth/permissions.ts`, `lib/auth/server-permissions.ts`). Granting any action-level permission implies its parent module (documented expansion, `lib/auth/user.ts:130–148`) — intentional UX rule, not a bypass (it only ever *adds* module visibility, never actions).
- Receptionist URL-space: the doctor layout bounces each role out of the other's prefix before any data fetch (`app/doctor/layout.tsx:35–40`); receptionist data scoping resolves to the practice owner (`user.doctorId ?? user.id`) consistently across pages, actions, and API routes (`lib/auth/server-permissions.ts:90`, `app/api/doctor/appointments/export/route.ts:20`).

---

## 5. Server-Action Permission Checks

**PASS overall.** Every sampled action file is `"use server"` and re-checks auth server-side (never trusting the layout):

- Doctor-side actions: `requireDoctorPermission(perm)` (`lib/auth/server-permissions.ts:81–91`) → redirects unauthenticated to `/login`, wrong roles to home, returns `null` when the specific permission is missing, and resolves the correct acting `doctorId`. Ownership helpers (`ensurePatientOfDoctor`, `ensureAppointmentOfDoctor`, `ensureBillingTypeOfDoctor`, `ensureIncomeTypeOfUser`, `ensureExpenseTypeOfUser`, `ensureTicketOwner` — `lib/auth/ownership.ts`) scope every cross-entity mutation.
- Super-admin actions: local `requireAdmin()` on every action (`app/super-admin/actions.ts:64–69`).
- Chat actions: `authedUser()` + `chat-view`/`chat-send` permission checks + 30/min poll rate limit (`app/doctor/chat/actions.ts:30–55, 76–80`).
- Staff permission management is properly scoped: only receptionists belonging to the acting practice can be edited (`saveStaffPermissions` — `app/doctor/roles/actions.ts:252–280`); read path mirrors the ownership rule (`getUserPermissionNames:226–250`); the staff permissions API route re-checks role and ownership server-side (`app/api/doctor/staff/[id]/permissions/route.ts:11–27`).
- Mutations write audit entries (see Low-4 for the fail-open caveat).

---

## 6. API Route Auth Matrix (39 routes)

Automated scan (`getCurrentUser|requireRole|getUserByApiTokenHeader|verifyRazorpayWebhookSignature` per file) + manual reads:

- **37 / 39 routes carry in-file auth.** Routes without an explicit check (2) are **intentionally public**:
  - `GET /api/consents/[slug]/file` — slug is the bearer token (UUID, 122 bits of entropy — `app/doctor/appointments/actions.ts:350`); path traversal guarded; content-type allowlist; `Cache-Control: private, no-store` (`app/api/consents/[slug]/file/route.ts`).
  - `GET /api/public/file/[...path]` — CMS assets only (`landing`, `blogs`), charset+allowlist guarded, traversal-safe, immutable cache for UUID names (`app/api/public/file/[...path]/route.ts`).
- Sampled role gating (all correct): appointments CSV export (doctor/receptionist/admin, doctorId-scoped — `app/api/doctor/appointments/export/route.ts:16–30`), bill PDF (doctor-scoped, `no-store` — `app/api/doctor/billing/[id]/pdf/route.ts:17–29`), patient photo (ownership-checked, basename-safe — `app/api/doctor/patients/[id]/photo/route.ts:22–46`), patient test report (patient + `patientId = user.id` scoping, traversal-guarded — `app/api/patient/test-reports/[id]/route.ts:29–49`), prescription PDF (role-branched: staff by doctorId, patient by ownership — `app/api/prescriptions/[consultationId]/route.ts:16–39`), medicines search (role-gated), super-admin file server (super_admin/admin + dir allowlist + regex charset + traversal check + SVG no-exec CSP — `app/api/super-admin/file/[...path]/route.ts:34–70`).
- **Bearer-token path (Shule):** `lib/auth/api-token.ts` — Sanctum-parity SHA-256 hashed lookup (unique index hit, no plaintext storage), constant-time re-compare, expiry honored, deactivated accounts rejected, per-IP 120/min rate limit, read-only doctor-directory data, `Cache-Control: no-store`. **PASS.**
- **Razorpay webhook:** HMAC signature verification over the raw body before any parsing/fulfillment (`app/api/packages/webhook/route.ts:12–19`). **PASS** (no replay window, see Low-8).

---

## 7. Cross-Role / IDOR Verification (sampled)

- Patient → doctor data: patient API routes scope strictly by `patientId = user.id` (test reports, SOS status, prescriptions); patient pages fetch via `getPatient*` queries keyed on `user.id`.
- Doctor → patient data: `ensurePatientOfDoctor` matches `referenceRoleId` **and** `role = "patient"` (double-condition, blocks staff-to-staff reads); appointment/billing/ledger ownership helpers pair the entity id with `doctorId`/`userId` in the same WHERE clause.
- Receptionist → practice: resolution `user.doctorId ?? user.id` everywhere, so a receptionist never queries arbitrary doctors.
- Staff permissions: only receptionists with `referenceRoleId = actingDoctorId` are readable/editable (see §5).
- Admin → users: super-admin actions require `super_admin|admin`; non-file mutations audit with actor id (`audit.roleChanged(admin.id, …)`).
- Deactivation/role changes revoke sessions immediately (§2.4) — a demoted or deactivated principal cannot ride an old JWT.

No IDOR path was found in the sampled surface. (Earlier functional reviews found none either; the one related finding — practice-aware *visibility* gaps for receptionists — is a correctness issue, not over-disclosure.)

---

## 8. Findings

### ISSUE · HIGH — `admin` can create and elevate `super_admin` accounts
- `app/super-admin/actions.ts:59` — `VALID_ROLES = ["super_admin","admin","doctor","receptionist","patient"]` is accepted from `formData` in `storeUser` (lines 277–295) with only the `requireAdmin()` role check (which admits `admin`), and `updateUser` (line 330+) accepts the same role set on edit.
- Impact: an `admin` (a lower tier than `super_admin`) can mint a `super_admin` or escalate their own account via edit, then use the full admin surface — the tier boundary between the two admin roles is **not enforced** anywhere (the related parity break — `updateUser` can also deactivate a `super_admin` — was already recorded in `reports/admin-dashboard-review.md`).
- Fix: if `admin.role !== "super_admin"`, reject `role === "super_admin"` targets (create, edit role, status toggle) and forbid editing `super_admin` rows.

### ISSUE · MEDIUM-1 — No session check in middleware; route protection is a single layer
- `proxy.ts` sets headers only. All page protection lives in layout guards and all mutation protection in actions. This works today (verified §4/§5), but any future route added outside a guarded segment — or a layout refactor — is silently public, and API routes must each remember their own check (all 39 currently do).
- Fix: add a cheap JWT-verify (and optionally a sessions-row existence check) in `proxy.ts` for `/doctor`, `/receptionist`, `/patient`, `/super-admin` prefixes → redirect to `/login`; keep layout/action checks as defense-in-depth.

### ISSUE · MEDIUM-2 — Production CSP allows `unsafe-inline` scripts unconditionally
- `proxy.ts:26–28` — the dev-only additions are gated, but `'unsafe-inline'` is appended in **both** dev and prod for `script-src`. XSS payload execution is not blocked by the CSP; combined with the amount of rich text/HTML the CMS surfaces render, this weakens the last line of defense. The in-code comment says nonces are planned for prod.
- Fix: nonce- or hash-based `script-src` in production (Next supports nonce propagation through the proxy).

### ISSUE · MEDIUM-3 — 30-day sessions, no idle timeout, `lastActivity` never enforced
- `lib/auth/session.ts:17` — 30-day absolute lifetime for a system carrying PHI; the `sessions.lastActivity` column is written but never checked, so there is no inactivity reaper or idle re-auth.
- Fix: shorten the lifetime (or add a sliding/idle check against `lastActivity`) for `super_admin`/`admin` at minimum.

### ISSUE · MEDIUM-4 — Rate limiting is per-email only (login/signup) and client IP is spoofable by default
- `app/(auth)/login/actions.ts:33` — throttling keys on the **attacker-supplied email**, never on IP: distributed password spraying across many accounts is unthrottled; the per-email cap can also be weaponized to lock a victim out (5 tries / 15 min per email).
- `lib/security/ip.ts:29–37` — when `TRUSTED_PROXY_HEADER` is unset, `x-forwarded-for` / `x-real-ip` are trusted by default, so **every IP-keyed limit** (Shule 120/min, SOS 1/min, consent, demo) is bypassable by header spoofing when the app is exposed without a proxy that overwrites these headers.
- Fix: add a per-IP layer to auth limits; default-deny forwarded headers unless `TRUSTED_PROXY_HEADER` is explicitly configured.

### ISSUE · MEDIUM-5 — Receptionist holding `roles-edit` can edit their own permissions
- `app/doctor/roles/actions.ts:252–280` — `saveStaffPermissions` verifies the target is a receptionist owned by the acting practice, but the target may be the **acting receptionist's own id** (they also match `referenceRoleId = owner`). A receptionist granted the roles-permissions module + `roles-edit` can self-grant any permission in the catalog — self-escalation within the practice.
- Fix: reject `staffId === current user id`, and require the caller to be the practice owner doctor for permission edits.

### ISSUE · MEDIUM-6 — Vendor upload tokens never expire and cannot be proactively disabled
- `app/vendor/upload-test/[token]/actions.ts:59–71` — validity is "token exists + booking pending + no report yet"; there is no `expiresAt`/`disabled` column, so a link shared over email/WhatsApp remains upload-valid for the booking's lifetime (the page copy claims "expired" behavior that doesn't exist; also flagged in the admin review).
- Fix: add expiry at token creation and a revoke/regenerate flag; check it in the action.

### ISSUE · LOW-1 — JWT without a `jti` bypasses server-side revocation (fail-open path)
- `lib/auth/session.ts:102–110` — if a token has no `jti` claim, `getSessionUserId` returns the userId without the sessions-row check. Current code always sets a jti, so this is reachable only via hand-minted/legacy tokens signed with the current secret. Tighten to `if (!jti) return null`.

### ISSUE · LOW-2 — OTP: plaintext storage, non-constant-time compare, dev echo
- `app/(auth)/signup/otp-actions.ts:35, 58–75` — OTP is stored in plaintext and compared via SQL equality (a timing side channel is not realistically exploitable through a DB query, but hashing + `timingSafeEqual` is the norm for short codes). The dev echo (`devOtp`) is correctly env-gated — ensure no staging/production box ever runs with `NODE_ENV !== "production"`.

### ISSUE · LOW-3 — Signup rate limit is per-email only
- `app/(auth)/signup/actions.ts:109` — bulk account creation from one IP (rotating emails) is unthrottled; combine with Medium-4's IP work.

### ISSUE · LOW-4 — Audit logging fails open
- `lib/security/audit-log.ts` (header note) — if the `audit_logs` table is missing, inserts are **silently skipped**. During a botched migration the app would run with zero audit trail and no signal. Log the failure loudly at minimum.

### ISSUE · LOW-5 — Non-constant-time vendor token comparison (dead check)
- `app/vendor/upload-test/[token]/actions.ts:61–62` — the `!== token` re-compare after the DB `eq` lookup is redundant (the query is the check) and string-compare based; harmless today, but remove or replace with a constant-time helper for clarity.

### ISSUE · LOW-6 — No `frame-ancestors` directive
- `proxy.ts:20–50` — `X-Frame-Options: DENY` is set (sufficient for modern browsers), but the CSP omits `frame-ancestors 'none'`; add it for completeness.

### ISSUE · LOW-7 — API tokens carry no scopes
- `lib/auth/api-token.ts` — any personal-access token for a user grants full access to every bearer-authenticated endpoint (currently only the read-only `/api/shule/doctors`; safe now, but the first write-capable integration endpoint will inherit blanket trust). Consider a token name/scope check when more consumers arrive.

### ISSUE · LOW-8 — Razorpay webhook has no replay window
- `app/api/packages/webhook/route.ts` — signature-only verification; Razorpay timestamps aren't checked. Fulfillment is idempotent by `order_id`, so impact is minimal.

### ISSUE · LOW-9 — Rate limiter has zero observability
- `lib/security/rate-limit.ts` — in-memory buckets are invisible (no metrics/diagnostics); a brute-force campaign or misbehaving limiter would be undetectable until audit-log review.

### GAP · MEDIUM — No self-service password reset / recovery
- Login and signup are complete, but there is no "forgot password" flow anywhere in `app/(auth)/**` (only staff/admin-initiated resets). Users who lose access require manual intervention; the SMTP config comment ("consent, password reset, etc.") anticipates it. Implement a signed-token reset flow with session revocation on completion.

### GAP · LOW — No MFA for privileged roles
- `super_admin`/`admin` rely on password + 30-day session. TOTP for the two admin roles would materially reduce account-takeover blast radius (their actions touch all PHI in the instance).

### GAP · LOW — In-memory limiter is not multi-instance safe
- Documented in-code (`lib/security/rate-limit.ts:4–6`); a Redis-backed implementation is required before horizontal scaling, or limits silently become per-instance (effectively multiplied).

### GAP · LOW — e2e auth matrix is a point-in-time list
- `e2e/auth-matrix.spec.ts` covers 11 API endpoints + 5 doctor pages; new protected routes must be added by hand. Consider deriving the list from the filesystem (all `route.ts` + dashboard prefixes) so new unguarded routes fail CI automatically.

---

## 9. Explicit PASS List (verified, no action needed)

- Login: rate limit, generic errors, bcrypt, deactivated rejection, audit, no enumeration, no open redirect.
- Signup: server-side role whitelist, mandatory single-use 10-min OTP, transactional creation, dup-email race handling, server-side trial computation.
- Logout: server-side revocation + cookie deletion + audit.
- Session: signed HS256 + DB jti revocation on every request; correct cookie flags; fail-closed verification; revocation wired into password change, role/status change, staff delete, admin kick, deactivation.
- Route gating: every non-public page covered by a segment layout role guard; dynamic ids `notFound()` on foreign records; role↔home redirect map; doctor module-permission gate runs before page queries in both URL spaces.
- Server actions: all re-check auth + permission + ownership server-side; audited mutations.
- API routes: 37/39 in-file auth; 2 public routes are token/slug-gated with traversal + content-type defenses.
- Bearer tokens: hashed at rest, constant-time compare, expiry + status checks, rate-limited read-only endpoint.
- Webhook: HMAC over raw body.
- Secrets: `AUTH_SECRET` present (56 chars), git-ignored and untracked; `.env.example` placeholder only.
- Cross-role/IDOR: no findings in the sampled surface (patient self-scope, doctor ownership helpers, receptionist practice scoping, staff-ownership for permission edits).
- e2e: anon/cross-role matrix exists and asserts 401/403/307 semantics.

---

## 10. Summary

| # | Class | Severity | Finding | Location |
|---|---|---|---|---|
| 1 | ISSUE | HIGH | `admin` can create/elevate `super_admin` | `app/super-admin/actions.ts:59, 277–295, 330+` |
| 2 | ISSUE | MEDIUM | No middleware session check (single protection layer) | `proxy.ts` |
| 3 | ISSUE | MEDIUM | Prod CSP allows `unsafe-inline` scripts | `proxy.ts:26–28` |
| 4 | ISSUE | MEDIUM | 30-day sessions, no idle timeout (`lastActivity` unused) | `lib/auth/session.ts:17` |
| 5 | ISSUE | MEDIUM | Per-email-only auth rate limits + spoofable client IP default | `app/(auth)/login/actions.ts:33`, `lib/security/ip.ts:29–37` |
| 6 | ISSUE | MEDIUM | Receptionist with `roles-edit` can self-edit permissions | `app/doctor/roles/actions.ts:252–280` |
| 7 | ISSUE | MEDIUM | Vendor upload tokens never expire / can't be revoked | `app/vendor/upload-test/[token]/actions.ts` |
| 8 | ISSUE | LOW | JWT without `jti` skips revocation check | `lib/auth/session.ts:102–110` |
| 9 | ISSUE | LOW | OTP plaintext + non-constant-time compare; dev echo surface | `app/(auth)/signup/otp-actions.ts` |
| 10 | ISSUE | LOW | Signup throttled per-email only | `app/(auth)/signup/actions.ts:109` |
| 11 | ISSUE | LOW | Audit logging fails open | `lib/security/audit-log.ts` |
| 12 | ISSUE | LOW | Redundant non-constant-time token check | `app/vendor/upload-test/[token]/actions.ts:62` |
| 13 | ISSUE | LOW | CSP `frame-ancestors` missing | `proxy.ts:20–50` |
| 14 | ISSUE | LOW | API tokens have no scope model | `lib/auth/api-token.ts` |
| 15 | ISSUE | LOW | Webhook replay window absent | `app/api/packages/webhook/route.ts` |
| 16 | ISSUE | LOW | Limiter has no observability | `lib/security/rate-limit.ts` |
| 17 | GAP | MEDIUM | No self-service password reset flow | `app/(auth)/**` |
| 18 | GAP | LOW | No MFA for `super_admin`/`admin` | — |
| 19 | GAP | LOW | In-memory limiter unsafe for multi-instance prod | `lib/security/rate-limit.ts:4–6` |
| 20 | GAP | LOW | e2e auth matrix not auto-derived from routes | `e2e/auth-matrix.spec.ts` |

**Bottom line:** The auth core (login/signup/OTP/logout/session/revocation) and the RBAC enforcement chain (layout guard → server-action guard → ownership check → audit) are consistently and correctly implemented across all four role areas, with a clean API auth matrix and no IDOR findings. Fix the `admin`→`super_admin` escalation first, then add the middleware session check, tighten the production CSP and rate-limit keying, and close the password-reset gap; the remaining items are hardening.






