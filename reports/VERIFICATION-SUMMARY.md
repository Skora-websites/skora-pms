# Dashboard & RBAC Verification — Executive Summary

**Codebase:** `skoracare_old` (Next.js 16 App Router, Drizzle ORM, server components + server actions)
**Method:** 4 parallel review agents (doctor dashboard, patient dashboard, admin/vendor dashboards, auth+RBAC). Static source review, read-only. Detailed reports in this folder.

## Overall Verdict

All four dashboard areas (doctor, patient, super-admin, vendor) are **properly created, fully implemented, and consistently designed**. Role-based access control is **correctly implemented end-to-end**: layout role guards → server-action permission/ownership checks → audit logging, with a clean API auth matrix (37/39 routes auth-checked; the 2 exceptions are intentionally public token/slug-gated routes) and **no IDOR findings**. Type-check passes. **Zero critical defects found.**

## Issues by Priority

### Fix first (HIGH)
1. **Admin→super_admin escalation** — an `admin` can create/elevate to `super_admin` via `storeUser`/`updateUser` (`app/super-admin/actions.ts:59, 277–295, 330+`). [rbac + admin reports]
2. **User edit data loss** — editing a user from `/super-admin/users` wipes `qualification`/`registrationNumber` (`components` users-table.tsx:105–112 + actions.ts:426–427). [admin report]
3. **No `loading.tsx` anywhere** — all dashboard trees block on full server render with no skeleton; most painful on `/doctor/schedule` (sequential N+1). [doctor + patient reports]

### Next (MEDIUM)
4. **No middleware session check** — `proxy.ts` sets headers only; route protection is a single layout+action layer with no second net.
5. **Prod CSP allows `unsafe-inline` scripts** (`proxy.ts:26–28`).
6. **30-day sessions, no idle timeout** (`lib/auth/session.ts:17`) for a PHI-bearing system.
7. **Per-email-only login rate limiting + spoofable client-IP resolution** (`lib/security/ip.ts:29–37`).
8. **Practice-awareness gaps** — receptionists/admins in multi-doctor practices see all appointments but not other doctors' consultations/follow-ups/billing/etc. (7 queries need `getPractice*` variants; `lib/queries/doctor.ts`). [doctor report]
9. **Receptionist with `roles-edit` permission can self-edit permissions** (`app/doctor/roles/actions.ts:252–280`).
10. **Vendor upload tokens never expire / can't be revoked** (`app/vendor/upload-test/[token]/actions.ts`).
11. **`admin` can deactivate a `super_admin`** (`updateUser` parity break) and **admin replies never notify ticket owner**. [admin report]
12. **No segment-level `error.tsx`/`loading.tsx`** for any role area — root `app/error.tsx` ejects users from the dashboard shell on any query failure.
13. **No e2e coverage for patient self-service flows** (booking, cancel, prescriptions, test reports, SOS).
14. **Unbounded list queries / N+1 patterns** — no pagination on doctor list pages; sequential N+1 on `/doctor/schedule`; global-table scans on staff/roles; fetch-all-then-slice on dashboard recents.

### Then (LOW / hardening — 30+ items)
- JWT without `jti` skips revocation; OTP plaintext + non-constant-time compare; audit logging fails open; missing `frame-ancestors`; no self-service password reset; no MFA for privileged roles; in-memory rate limiter unsafe for multi-instance prod; API tokens lack scope model; webhook replay window; audit-category mislabeling; minor UX polish (dead "View" links, status-gated CTAs, map precision, slot sorting, a11y in AI-summary modal); inconsistent `dynamic = "force-dynamic"` declarations.

## Per-Area Snapshots

| Area | Routes verified | Verdict | Critical | High | Medium | Low |
|---|---|---|---|---|---|---|
| Doctor (`app/doctor/**`, 27 routes) | all exist, permission-gated, type-clean | Well-built; gaps are operational (loading UX, query scale, multi-doctor correctness) | 0 | 2 | 5 | 4 |
| Patient (`app/patient/**`, 9 pages + APIs) | all exist, ownership-scoped, audited | Fully implemented; polish items only | 0 | 0 | 3 | 12 |
| Super-admin (`app/super-admin/**`, 13 routes) + vendor | all exist, full CRUD, audited | Production-quality; 1 high data-loss bug | 0 | 1 | 4 | 14 |
| Auth + RBAC (`lib/auth/**`, `proxy.ts`, `app/(auth)/**`, 39 API routes) | enforcement chain consistent, no IDOR | Strong core; defense-in-depth + hardening needed | 0 | 1 | 6 | 9 |

## Recommended Fix Order
1. Privilege escalation (admin→super_admin) + user-edit data loss (security/data integrity)
2. Middleware session check + CSP + session timeout + rate-limit keying (defense in depth)
3. Practice-awareness query variants for receptionist/admin correctness
4. Segment `loading.tsx`/`error.tsx` for all four role areas (UX resilience)
5. Query-layer performance (pagination, N+1 fixes, SQL-side limits)
6. Patient e2e coverage + remaining polish/hardening

## Full Reports
- `reports/doctor-dashboard-review.md`
- `reports/patient-dashboard-review.md`
- `reports/admin-dashboard-review.md`
- `reports/rbac-auth-review.md`
