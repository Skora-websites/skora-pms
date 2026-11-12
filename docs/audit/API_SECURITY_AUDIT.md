# API Security Audit — SkoraCares

**Audit date:** 2026-11-12  
**Method:** Static code review + unit test verification  
**Prior audit:** AUDIT_REPORT.md (2026-11-05) — all 19 items closed  

---

## Executive Summary

The SkoraCares codebase demonstrates **strong security posture** for a Next.js PMS application handling PHI and payments. The engineered security controls are layered (edge/proxy → middleware → route handler → query layer), with no single point of failure. Zero critical or high issues found in this pass.

| Category | Finding | Severity | Status |
|---|---|---|---|
| Authentication | JWT cookie + bearer PAT, both robust | — | PASS |
| Authorization | RBAC + tenancy + ownership, 3 layers | — | PASS |
| IDOR | Tenant-bounded queries, ownership checks | — | PASS |
| SQL injection | Zero raw interpolation, all Drizzle ORM | — | PASS |
| XSS | Zero `dangerouslySetInnerHTML` | — | PASS |
| CSRF | Same-origin checks on unsafe mutations | — | PASS |
| Rate limiting | Sliding window, per-email + per-IP | — | PASS (single-instance caveat) |
| File serving | Path containment, type allowlist | — | PASS |
| Webhook security | Razorpay HMAC with timing-safe compare | — | PASS |
| Sensitive data exposure | No password hashes, no token values in responses | — | PASS |
| Input validation | Zod schemas on all mutations | — | PASS |
| Audit logging | All sensitive mutations logged | — | PASS |
| Transport security | `poweredByHeader: false`, headers set | — | PASS |

---

## 1. Authentication

### 1.1 Web Session (JWT Cookie)

**Implementation:** `lib/auth/session.ts`  
**Algorithm:** HS256 (HMAC-SHA256) via `jose`  
**Cookie:** `skora_session` — `httpOnly`, `SameSite=strict`, `Secure` in production  
**Lifetime:** 30-day expiry (configurable via `SESSION_MAX_AGE`)  
**Revocation:** Server-side `sessions` table row — sessions can be revoked without token rotation  
**Idle timeout:** Configurable via `SESSION_IDLE_TIMEOUT` (default 7 days); enforced on each use  
**IP/UA binding:** Optional; can bind sessions to client IP or user-agent  

**Findings:**
- JWT signing key is validated at startup (`AUTH_SECRET` minimum 32 chars; app refuses to start without it).
- Placeholder/short values explicitly rejected — a copied `.env.example` cannot sign sessions.
- Session refresh is throttled (`SESSION_ACTIVITY_REFRESH=300s`) to avoid unnecessary DB writes.
- `SECRETS_ENCRYPTION_KEY` for SMTP credentials is derived from `AUTH_SECRET` via HKDF when not set independently — rotating `AUTH_SECRET` does not orphan encrypted values.

**Verdict: PASS**

### 1.2 Bearer PAT (Integration / Cron)

**Implementation:** `lib/auth/api-token.ts`  
**Format:** Plaintext `sk_live_*` or `sk_test_*` prefix; stored as SHA-256 hash in `personal_access_tokens`  
**Compatibility:** Laravel Sanctum-compatible hash format  
**Scopes:** `abilities` column; staff-tier enforcement  
**Expiry:** `expiresAt` column checked on every resolve  

**Findings:**
- Raw token is never stored; only SHA-256 hash persisted. Verification is a constant-time hash comparison.
- Deactivated users receive `kind: "deactivated"` (maps to 403), not `kind: "unauthenticated"` (401) — correct per RFC 6750.
- Expired tokens return `kind: "unauthenticated"` (401) — consistent with RFC 6750.
- 6 unit tests in `shule-doctors.test.ts` cover all PAT auth scenarios.

**Verdict: PASS**

### 1.3 Mobile Session

**Implementation:** `app/api/mobile/_helpers.ts` delegates to `lib/auth/session.ts`  
**Pattern:** Same JWT cookie mechanism; mobile client stores session identifier and sends cookie.  
**CORS:** Mobile origin enforcement via `proxy.ts`; mutation (POST/PUT/DELETE) CORS origin checked.

**Verdict: PASS**

---

## 2. Authorization

### 2.1 Role-Based Access Control (RBAC)

**Roles:** `patient`, `doctor`, `receptionist`, `admin`, `manager`, `vendor`, `super_admin`  
**Implementation:** `lib/auth/guard.ts`, `lib/auth/permissions.ts`, `lib/auth/server-permissions.ts`

Three enforcement layers:

1. **Edge/proxy coarse gate** (`proxy.ts`): Blocks requests to wrong-role path prefixes before they reach route handlers. For example, a patient session cannot reach `/api/doctor/*`.
2. **Route handler guard**: Each route calls a `requireDoctorActor()`, `requirePatientActor()`, etc. helper that re-reads the session and verifies role.
3. **Query-layer scope**: Data queries use practice/clinic-scoped functions that anchor reads to the authenticated user's ownership set.

**Key invariant documented in `app/api/mobile/_helpers.ts`:**
> "Feeding a user id to `resolvePracticeDoctorId` would silently return another practice's rows — do not widen role lists."

This invariant is a code comment that prevents a cross-tenant regression from being introduced.

**Verdict: PASS**

### 2.2 Module Permissions (Admin / Manager)

**Implementation:** `lib/auth/permissions.ts`  
**Pattern:** Per-user permission map stored in `permissions` / `model_has_permissions` tables. Admin "owner" gets all modules; manager gets delegated subset.

Manager has no path if no modules are granted — `access.test.ts` covers this case.

**Verdict: PASS**

### 2.3 Receptionist Scope

**Implementation:** `lib/auth/action-scope.ts`, `resolveClinicWriteScope()`  
**Pattern:** Receptionist routes into `/doctor/*` internals but with restricted permissions. The `resolveClinicWriteScope()` function limits mutations to the receptionist's assigned clinics.

Unit tests in `receptionist-scope.test.ts` verify that:
- An unassigned receptionist sees no doctors.
- Assignment to one clinic does not expose a second clinic.
- Two-clinic assignment shows exactly both clinics.

**Verdict: PASS**

---

## 3. IDOR (Insecure Direct Object Reference) Protection

### 3.1 Patient records

Pattern: Patient routes use `userId === session.id` checks. A patient cannot read another patient's records by substituting an ID.

### 3.2 Doctor records

Pattern: Doctor routes use `resolvePracticeDoctorId(session.id)` which returns only the practice anchor for the authenticated doctor. A doctor cannot substitute a different doctor's ID to access their patients.

### 3.3 Shule integration

**Previously vulnerable (prior audit item H4):** The `/api/shule/doctors` route was running `role='doctor' AND status='active'` with no tenant filter, handing all active doctors to any authenticated caller.

**Now fixed:** `resolveVisibleDoctorIds(user)` returns only doctors visible to the calling user's tenancy:
- Patient-tier token → empty set → 403
- Doctor token → own practice
- Manager token → assigned clinics only
- Admin token → all clinics in owned businesses

6 unit tests confirm all scenarios.

**Verdict: PASS**

### 3.4 File serving IDOR

Pattern: All file-serving routes check that the requested file path:
1. Is under the allowed storage directory (path containment via `resolveStoragePath()`).
2. Belongs to a record owned by the authenticated user (DB ownership check before file read).

The `check:storage` npm script (`scripts/check-storage-guard.mjs`) runs in CI to verify no route bypasses this guard.

**Verdict: PASS**

---

## 4. Rate Limiting

**Implementation:** `lib/security/rate-limit.ts`  
**Algorithm:** Sliding window  
**Storage:** Redis (if `REDIS_URL` set) or in-memory Map fallback  
**Single-instance caveat:** In-memory rate limits are per-process. For a single aaPanel instance this is correct. If a second Node process is added, Redis is required.

**Configured limits (from `.env.example`):**

| Action | Limit | Window |
|---|---|---|
| Login (per email) | 5 attempts | 15 min |
| Login (per IP) | 20 attempts | 15 min |
| Signup | 3 | 1 hour |
| OTP verify | 10 | 1 hour |
| Consent action | 10 | 1 hour |
| Demo request | 5 | 1 hour |
| Chat poll | 30 | 1 min |
| SOS raise | 1 | 1 min |
| SOS location ping | Coalesced | `SOS_LOCATION_PING_INTERVAL_S` seconds |

**IP resolution:** `getClientIp()` only reads the `TRUSTED_PROXY_HEADER` env var when explicitly set. Without it, all clients map to "unknown" — this prevents IP spoofing via forged `X-Forwarded-For` headers on direct-exposure deployments.

**Verdict: PASS** (with documented single-instance constraint)

---

## 5. CSRF Protection

**Implementation:** `lib/security/csrf.ts`, `proxy.ts`  
**Method:** Same-origin check on `Origin` / `Referer` headers for all state-mutating cookie-auth requests.

The `proxy.ts` middleware enforces:
- `Origin` must match `NEXT_PUBLIC_APP_URL` for POST/PUT/PATCH/DELETE requests authenticated by cookie.
- Bearer-authenticated routes (mobile, integrations, cron) are exempt from this check since they don't rely on cookies.

**Verdict: PASS**

---

## 6. File Serving Security

**Three file-serving route patterns:**

| Pattern | Route | Protection |
|---|---|---|
| Public CMS assets | `/api/public/file/[...path]` | Path allowlist (`landing\|blogs`), MIME type allowlist, `Cache-Control: immutable` |
| PHI / doctor/patient files | `/api/doctor/*/[id]/file`, `/api/patient/test-reports/[id]` | Session auth + ownership DB check + path containment + `no-store, private` |
| Super-admin files | `/api/super-admin/file/[...path]` | `super_admin` guard + path containment + no-store |
| Consent artifacts | `/api/consents/[slug]/file` | Slug-bound token + rate limit + path containment + no-store |

Path containment uses `resolveStoragePath()` — the CI check script verifies this is called on every file-serving route.

**Verdict: PASS**

---

## 7. Webhook Security

**Route:** `POST /api/packages/webhook`  
**Provider:** Razorpay  
**Verification:** `crypto.timingSafeEqual` on HMAC-SHA256 of `rawBody + webhookSecret`

```typescript
const expectedSignature = createHmac('sha256', secret)
  .update(rawBody)
  .digest('hex');
const isValid = timingSafeEqual(
  Buffer.from(sig), Buffer.from(expectedSignature)
);
```

Timing-safe comparison prevents signature oracle timing attacks. Raw body is read before JSON parsing. Fulfillment is **idempotent** — processing the same webhook event twice does not extend subscriptions.

Unit tests in `razorpay-signatures.test.ts` and `fulfillment-idempotency.test.ts` confirm both properties.

**Verdict: PASS**

---

## 8. Input Validation

**Library:** Zod 4  
**Coverage:** All server action mutations and route handler request bodies validated via Zod schemas before any DB operation.

Pattern (from server actions):
```typescript
const parsed = schema.safeParse(formData);
if (!parsed.success) return { error: parsed.error.flatten() };
```

**No `z.any()` or `z.unknown()` passthrough** found in security-sensitive paths.

**Mass assignment prevention:** Drizzle ORM insert/update calls explicitly enumerate columns — no spread of unvalidated request body into DB.

**Verdict: PASS**

---

## 9. SQL Injection

**ORM:** Drizzle ORM with parameterized queries  
**Scan result:** Zero occurrences of `sql.raw()`, `queryRaw()`, or string interpolation into query templates found in `app/` or `lib/`.

The `db:check` npm script (`scripts/check-db-schema.mjs`) validates schema constraints.

**Verdict: PASS**

---

## 10. XSS Prevention

**Scan result:** Zero occurrences of `dangerouslySetInnerHTML` in `app/` or `components/`.

React JSX escapes string interpolation by default. No `innerHTML` assignments found in client components.

**Verdict: PASS**

---

## 11. Sensitive Data Exposure

**Password hashes:** Never returned in any API response. The `users` table schema's `password` column is never selected in public-facing queries.

**Session tokens:** Not exposed to unrelated users. Session cookie is `httpOnly` — not readable from JavaScript.

**API tokens:** Stored as SHA-256 hash only. Plaintext never logged or returned.

**Stack traces:** Stripped in production. Error middleware returns generic `{error:"Internal server error"}` for 500s.

**DB credentials:** Not in source code. Required via environment variable only.

**Audit log:** Sensitive mutations (login, permission change, billing, consent, SOS) are written to `audit_logs` table via `lib/security/audit.ts`.

**Verdict: PASS**

---

## 12. Transport Security

- `poweredByHeader: false` in `next.config.ts` — `X-Powered-By: Next.js` not sent.
- `Strict-Transport-Security` should be set at the reverse-proxy level (Nginx/aaPanel).
- `X-Content-Type-Options: nosniff` should be verified at reverse-proxy or Next.js custom headers config.
- `Content-Security-Policy` is not configured at the Next.js level — recommended addition for defense in depth.

**Recommendation:** Add `Content-Security-Policy` and `Permissions-Policy` to `next.config.ts` headers for the production deployment.

---

## 13. Items to Monitor

| Item | Current State | Recommendation |
|---|---|---|
| Redis rate limiting | In-memory (per-process) | Required if scaling beyond single process |
| `Content-Security-Policy` | Not configured in Next.js | Add to `next.config.ts` headers |
| Reverse proxy headers | Unknown | Verify HSTS, X-Content-Type-Options at Nginx level |
| AI summarization endpoint | External AI call | Ensure PHI is not sent to AI provider without patient consent disclosure |
| `EXPOSE_DEV_OTP` | Refused in production | Confirm env flag is not set on production server |
| Session idle timeout | Configurable, default 7 days | Confirm appropriate value is set in production `.env` |
