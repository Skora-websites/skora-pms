# Burp Audit — SkoraCares (`skoracare_old`)

**Target:** `/home/adam/Downloads/skoracare_old` — Next.js 16.3.0 App Router practice-management system
**Audit date:** 2026-10-07
**Stack:** Next.js 16.3 (React 19.2, Turbopack), TypeScript, Tailwind v4, Drizzle ORM 0.45 on MariaDB 11.8.3, `jose` HS256 JWT, bcryptjs, zod v4, ExcelJS, `@react-pdf/renderer`, `web-push`, Leaflet
**Method:** Full source read + live database introspection + Burp Suite MCP request replay against a running instance on `localhost:3100`, driving six seeded principals simultaneously
**DB:** `skoracares_db` on local MariaDB (`localhost:3306`)
**Authorization:** Explicitly authorized audit of this environment. All probes were read-only or self-owned. No production data was created, modified, or destroyed.

---

## 1. Executive Summary

The authentication core is genuinely well built. Sessions are JWT + server-side revocation rows, cookies carry correct flags, passwords are bcrypt-hashed, login is rate-limited and audited, the signup role whitelist holds, CSV/Excel formula injection is neutralized in all four exporters, cross-tenant `doctor_id` probing is correctly rejected with 403, path traversal is blocked on every file route, every SQL query is parameterized, and the four genuinely concurrent operations (credit collection, consent decisions, package fulfillment, vendor report upload) all use conditional claims rather than check-then-write.

The systemic failure is one layer down from where the controls were applied. **The permission model is enforced in the layout and in server actions, but not in the API layer.** All 39 API routes gate on `role in [...]` and none call `hasPermission`. The layout is therefore the *only* control, and it is bypassed by a single request. This is not a subtle exploit — a doctor account whose permissions explicitly exclude the `registrations` module exports the complete patient roster including Aadhaar numbers.

Seven further findings compound it: layout-enforced "doctor-only" panels are reachable by receptionists over HTTP; trial expiry is enforced at exactly one code path; the consent PDF endpoint is unauthenticated with no expiry; receptionist staff actions permit self-escalation; staff management is functionally broken by a column-shape split; the rate limiter collapses to one global bucket; and production CSP ships `'unsafe-inline'`.

A second pass against the database added six more (F-16 … F-21). One of them — **F-16 — was initially reported as a HIGH deployment-blocking defect and has been disproved by runtime reproduction.** A fresh `npm run db:migrate` produces a schema byte-identical to the live database. The four "skipped" SQL files are redundant leftovers, not required schema. F-16 is downgraded to LOW and the correction is documented in full at F-16 and §11.5.

A third pass swept all 404 source files for legacy code, duplicated flows, and validation gaps (F-22 … F-28). That pass found **three independent clinic-CRUD implementations** validating the same rules three times, **fifteen action files with zero schema validation** while six purpose-built zod schemas sit unused, and **both the database and the dev server listening on all network interfaces**.

A fourth pass executed the full Playwright suite and reproduced a from-scratch database install end to end.

| Severity | Count | Headline |
|---|---|---|
| Critical | 0 | — |
| High | 5 | F-01 API layer has no permission enforcement · F-02 doctor-only panels reachable as receptionist · F-03 trial expiry unenforced outside the layout · F-04 consent PDF unauthenticated with no TTL · F-05 receptionist self-escalation |
| Medium | 10 | F-06 staff management broken (column split) · F-07 rate limiter collapsed to one bucket · F-08 production CSP ships `'unsafe-inline'` · F-09 secrets and PHI at mode 0777 · F-17 split collations, confirmed throwing · F-18 consumed OTPs persist in plaintext · F-19 PHI exports are not audited · **F-22 three parallel clinic-CRUD implementations** · **F-23 half the write actions take no schema validation** · **F-24 database and dev server bound to all interfaces** |
| Low | 11 | F-10 sessions never idle out · F-11 non-expiring vendor token · F-12 unbounded photo route · F-13 traversal guard uses a bare prefix · F-14 payment verify not bound to caller · **F-16 four redundant SQL files (disproved HIGH)** · F-20 permissive `sql_mode` · F-21 three hot filter columns unindexed · F-25 hardcoded upload caps bypass `lib/config` · F-26 six unused zod schemas · F-27 dead `lib/whatsapp.ts` |
| Info | 2 | F-15 dev-mode OTP echo · F-28 orphan export + probe artifacts in `public/` |
| Gap | 7 | G-01…G-07 |
| Verified-clean | 21 | See §5 and §3d |

**Risk rating: MEDIUM-HIGH.** No unauthenticated path to bulk data and no cross-tenant read was found, which keeps this out of Critical. But F-01 is a single missing check replicated 39 times, it is trivially reachable, and it exposes Aadhaar-grade PII and the full financial ledger to accounts that the application itself classifies as unauthorized. Fixing F-01 through F-05 closes the bulk of the exposure.

**F-24 is the only finding that changes the threat model.** Every other item assumes the attacker is remote. F-24 means anyone on the same network segment as this machine can reach a MariaDB instance holding patient PII and a super-admin-granting root account. It is environment configuration rather than application code, but it is the difference between a lab box and a shared network.

**On audit integrity.** One finding in this report (F-16) was wrong on impact and was caught by reproducing it rather than trusting the static read. Separately, F-12, F-19 and F-07 were initially evidenced only by source reading and have since been confirmed at runtime. All four corrections are recorded rather than quietly edited away, because a reader deciding how much to trust this document needs to know which claims were verified and how. §11.5 is the register.

**Read §12 before implementing.** Verifying the plan against current code and database state surfaced a blocker the plan itself introduced: `e2e/super-admin.spec.ts:92` mutates the shared `doctor@gmail.com` fixture, and running the regression baseline granted that account all 13 modules. **The Phase 1 and Phase 3 exit criteria are therefore written against stale permissions and cannot fail as intended.** Three prerequisites — under an hour total — are listed in §12.5. F-01 itself is unaffected; only its reproduction recipe is invalidated.

### Finding index

| ID | Sev | Finding | Primary location |
|---|---|---|---|
| F-01 | HIGH | API layer enforces role but never module permission | `app/api/**/route.ts` (all 39) |
| F-02 | HIGH | Layout-blocked doctor-only panels reachable via API | `app/doctor/layout.tsx:56` vs `app/api/doctor/sos/status`, `app/api/prescriptions/[consultationId]` |
| F-03 | HIGH | Trial expiry enforced in exactly one code path | `app/doctor/layout.tsx:25` |
| F-04 | HIGH | Consent PDF unauthenticated, no TTL or decision check | `app/api/consents/[slug]/file/route.ts:25` |
| F-05 | HIGH | Receptionist self-escalation in staff/role actions | `app/doctor/staff/actions.ts:85,148`, `app/doctor/roles/actions.ts:254` |
| F-06 | MEDIUM | Staff management broken by column-shape split | `scripts/seed.ts:271`, `lib/db/schema.ts` `users` |
| F-07 | MEDIUM | Rate limiter collapses to one global bucket | `lib/security/ip.ts:39`, `.env:59` |
| F-08 | MEDIUM | Production CSP ships `'unsafe-inline'` | `proxy.ts:34` |
| F-09 | MEDIUM | Secrets and PHI at mode 0777 | `.env`, `storage/**` |
| F-10 | LOW | Sessions never idle out; audit metadata never populated | `lib/auth/session.ts:37` |
| F-11 | LOW | Non-expiring vendor token discloses PHI | `app/vendor/upload-test/[token]/` |
| F-12 | LOW | `/api/doctors/[id]/photo` has no role/ownership check *(runtime-confirmed)* | `app/api/doctors/[id]/photo/route.ts:20` |
| F-13 | LOW | Traversal guard uses a bare `startsWith` prefix | 8 file-serving routes |
| F-14 | LOW | Payment verification not bound to initiating user | `app/api/packages/verify/route.ts:14` |
| F-15 | INFO | OTP echoed outside production | `app/(auth)/signup/otp-actions.ts:53` |
| F-16 | LOW | Four redundant SQL files the runner silently ignores *(was HIGH — disproved, see §11.5)* | `scripts/migrate.ts:47`, `drizzle/*.sql` |
| F-17 | MEDIUM | Split collations, confirmed throwing | `drizzle/*.sql` collation mix |
| F-18 | MEDIUM | Consumed OTPs persist in plaintext | `app/(auth)/signup/otp-actions.ts` `verifySignupOtp` |
| F-19 | MEDIUM | PHI bulk exports are not audited | `app/api/doctor/patients/export`, `.../appointments/export` |
| F-20 | LOW | Permissive `sql_mode` (`IGNORE_SPACE`) | server config |
| F-21 | LOW | Three hot filter columns unindexed | `appointments.status`, `users.role`, `users.phone` |
| F-22 | MEDIUM | Three parallel clinic-CRUD implementations | `app/super-admin/actions.ts:622`, `app/doctor/schedule/actions.ts:146`, `app/admin/clinics/actions.ts:172` |
| F-23 | MEDIUM | Fifteen action files take no schema validation | `app/doctor/test-bookings/actions.ts` and 14 others |
| F-24 | MEDIUM | Database and dev server bound to all interfaces | MariaDB `0.0.0.0:3306`, Next `*:3100` |
| F-25 | LOW | Hardcoded upload caps bypass `lib/config` | 9 sites; `lib/files/consent-upload.ts:33` |
| F-26 | LOW | Six zod schemas defined but never used | `lib/validation/index.ts` |
| F-27 | LOW | `lib/whatsapp.ts` is dead code | `lib/whatsapp.ts`, `lib/config.ts` `WHATSAPP_API_URL` |
| F-28 | INFO | Orphan export and probe artifacts shipped | `app/doctor/schedule/actions.ts::updateSchedule`, `public/probes/` |

---

## 2. Application Architecture

### 2.1 URL spaces

| Prefix | Principal | Entry guard |
|---|---|---|
| `/super-admin` | Platform operator (`super_admin`) | `app/super-admin/layout.tsx` → `requireRole(["super_admin"])` |
| `/admin` | Business owner (`admin`) + clinic manager (`manager`) | `app/admin/layout.tsx` → `requireAdminTier(x-pathname)` |
| `/doctor` | Doctor | `app/doctor/layout.tsx` → `requireRole` + `hasDoctorModuleAccess` |
| `/receptionist/*` | Receptionist | proxy rewrites to `/doctor/*`; layout bounces the two roles apart |
| `/patient` | Patient | `app/patient/layout.tsx` → `requireRole(["patient"])` |
| `/vendor/upload-test/[token]` | Lab vendor | **None** — token is the only secret |
| `/my-consent/[slug]`, `/api/consents/[slug]/file`, `/api/public/file/*` | Public | **None** — slug is the only secret |

### 2.2 Authentication

`skora_session` cookie, HS256 JWT signed with `AUTH_SECRET`, payload `{ userId, jti }`. Every login persists a `sessions` row keyed by `jti` (`lib/auth/session.ts:37`), and `getSessionUserId` re-checks that row on every request (`lib/auth/session.ts:98-109`) — real server-side revocation, not just cookie deletion. Flags: `httpOnly`, `sameSite: "lax"`, `secure` in production, `path: "/"`, 30-day max age.

Revocation is wired into password change (`app/doctor/profile/actions.ts:167`), staff credential reset and staff delete (`app/doctor/staff/actions.ts:138,171`), admin user edit on password/role/status change (`app/super-admin/actions.ts:437`), and admin deactivation (`app/super-admin/actions.ts:469`). Deactivated accounts are rejected both at login and on every request via `getCurrentUser` (`lib/auth/user.ts:73`).

### 2.3 Authorization

Three guard families, deliberately split because `redirect()` degrades to an opaque 307 inside route handlers:

- **Pages** — `requireRole` / `requireAdminTier` (`lib/auth/guard.ts`) → `redirect()`
- **API routes** — `requireApiRole` (`lib/auth/guard.ts:31`) → real 401/403
- **Server actions** — `requireDoctorPermission` (`lib/auth/server-permissions.ts:70`) and `requireWriteScope` (`lib/auth/action-scope.ts:70`) → `null` on denial, caller returns a user-facing error

Module permissions are a two-level catalog (14 modules, 54 child permissions, 68 rows). `getUserPermissions` (`lib/auth/user.ts:82`) merges direct `model_has_permissions` with role grants and expands child→parent so a granted action implies its module.

**Scope** resolves through `reference_role_id` (legacy Laravel spatie shape), not `doctor_id`. This split is the root of F-06.

### 2.4 Data model and tenancy

`businesses` → `business_clinics` → `doctor_clinics`, with `clinic_managers` scoping managers and `clinic_doctors` scoping practice members. `getBusinessScope` (`lib/auth/scope.ts:47`) resolves owner and manager scopes into `businessIds`, `clinicIds`, and `doctorIds`, which the clinical/financial query layer consumes. Admin-tier writes reuse the doctor-tier actions through `requireWriteScope`, which is why the same actions serve all four staff tiers.

### 2.5 File handling

Uploads live in `storage/uploads/` **outside** `public/`, are content-sniffed by magic bytes, UUID-named, and served only through authenticated route handlers. `/api/public/file/*` is the single anonymous surface, restricted to `landing/` and `blogs/` with a `^[a-zA-Z0-9._-]+$` filename pattern.

### 2.6 Third-party integrations

Razorpay (order → checkout → signature verify, with a redundant HMAC-signed webhook), WhatsApp gateway, SMTP (credentials AES-256-GCM encrypted at rest under an `skc1:` prefix, key derived from `AUTH_SECRET`), Web Push (VAPID), Shule external API via Sanctum-style SHA-256 bearer tokens.

### 2.7 Background work

No queue worker. `jobs`, `job_batches`, and `failed_jobs` tables exist in the schema but nothing processes them. All background work is fire-and-forget promises with `try/catch` so notification failure never blocks a user-facing write. The SOS dispatch hub is an in-process `globalThis` singleton — single-instance only, as documented.

### 2.8 Live database state

*Baseline at the start of the audit, before the Playwright run:*

```
users by role:  admin 1 · super_admin 1 · doctor 2 · manager 2 · patient 6 · receptionist 1
roles:          Super Admin (68 perms) · Doctor (19) · Receptionist (27) · Nurse (0) · Accountant (6)
sessions:       22, all ip_address NULL
audit_logs:     35 rows — 26 login, 2 logout, 3 appointment_created, 1 each patient_created/consent_given/appointment_cancelled/signup
ip quality:     35/35 = "unknown", 0 real IPs
entities:       appointments 12 · billings 1 · consultations 1 · transactions 6
empty tables:   personal_access_tokens, package_payments, mail_settings, test_bookings, leads, sos_requests
```

*Current state, after the Playwright suite added its own fixtures:*

```
users 22 · appointments 18 · billings 4 · consultations 1 · transactions 10 · sessions 47 · audit_logs 139
test_bookings 1 · registration_otps 3 · 1 user with profile_photo_path
still empty:  personal_access_tokens · package_payments · mail_settings · leads · sos_requests
doctors now present: #2 (seeded, has photo) · #12 · #14 · #23   → cross-doctor scoping is testable
audit_logs with a real IP: 0   (F-07's getClientIp fallback confirmed still live)
```

The growth is attributable to the test suite, which creates and cleans up its own accounts; the seeded fixtures are intact.

---

## 3. Confirmed Findings

---

### [HIGH] F-01 — API layer enforces role but never module permission

**Endpoint:** All 39 routes under `/api/**`
**HTTP Method:** GET / POST
**Affected Component:** Next.js App Router route handlers
**Source Code Location:** Every file matching `app/api/**/route.ts`; representative:
- `app/api/doctor/patients/export/route.ts:9-13`
- `app/api/doctor/income-expense/export/route.ts:33-41`
- `app/api/doctor/billing/[id]/pdf/route.ts:31`
- `app/api/doctor/staff/attendance/route.ts:14-18`

**Description**

`hasPermission` is called by the layouts and by server actions. It is called by **zero** API routes. Every handler authorizes on role alone:

```ts
// app/api/doctor/patients/export/route.ts:9
const user = await getCurrentUser();
if (!user || !["doctor", "receptionist"].includes(user.role)) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

The layout guards are real but only run on page renders. Direct HTTP requests to the underlying endpoints skip them entirely. Because role is the only gate, any account in the `doctor` or `receptionist` role reaches every clinical, financial, and administrative endpoint regardless of what its permission set actually says.

A mechanical scan of all 39 routes:

```
/api/doctor/patients/export         role-only   exposes Aadhaar/email/phone/DOB/address
/api/doctor/income-expense/export   role-only   exposes full financial ledger
/api/doctor/billing/[id]/pdf        role-only   exposes itemized bills
/api/doctor/staff/attendance        role-only   exposes staff PII + attendance
/api/doctor/appointments/export     role-only   exposes appointment history
/api/doctor/test-bookings/*         role-only   exposes lab bookings/reports
```

**Reproduction**

1. Sign in as `doctor@gmail.com`. Its effective permission set is 19 permissions and **does not include the `registrations` module**. Navigating to `/doctor/patients` bounces it to `/doctor`.
2. Send the request directly:

```
GET /api/doctor/patients/export HTTP/1.1
Host: localhost:3100
Cookie: skora_session=<doctor session>
```

3. Repeat as `receptionist@gmail.com`, which has 27 permissions and **no billing or income-expense module**, against `/api/doctor/income-expense/export` and `/api/doctor/billing/1/pdf`.

**Evidence** (Burp, sanitized)

```
200  text/csv; charset=utf-8   DOC  -> /api/doctor/patients/export
     header: ID,Registration ID,Name,Email,Phone,Gender,DOB,Address,City,State,Pincode,Aadhaar,Status,Registered On

200  vnd.openxmlformats…xlsx   REC  -> /api/doctor/income-expense/export      (7,255 bytes)
200  application/pdf            REC  -> /api/doctor/billing/1/pdf
200  application/json           REC  -> /api/doctor/staff/attendance
200  application/json           DOC  -> /api/doctor/staff/attendance
401  application/json           PAT  -> /api/doctor/patients/export   (role gate does work)
403  text/plain                 DOC  -> /api/super-admin/support/export
```

The `401` and `403` rows confirm role enforcement is intact and only the permission layer is missing.

**Root Cause**

Authorization was implemented as three parallel mechanisms and the API layer was never wired to the third. `hasPermission` is already imported and used in 30+ server actions; the route handlers simply omit it. There is no shared helper analogous to `requireDoctorPermission` for route handlers, so there is no obvious single place where the check belongs.

**Impact**

Any account holding the `doctor` or `receptionist` role — including a deliberately restricted front-desk account, a compromised staff login, or a recently permission-revoked employee whose session was not revoked — can bulk-export the full patient roster including Aadhaar numbers, the complete income/expense ledger, itemized bills with patient names, and staff attendance records. The application's own permission model classifies these as unauthorized, so this is a privilege escalation with a documented intended boundary, not a design choice.

**Fix**

Add module-permission enforcement to each data-returning route, reusing `hasPermission` so the API and the layout agree on a single source of truth. Introduce one small helper mirroring `requireApiRole` that returns a `Response` on denial, then apply it per route using the permission the layout already requires for that path:

- `patients/export`, `patients/[id]/photo` → `registrations`
- `appointments/*`, `appointments/export` → `appointments`
- `income-expense/*`, `billing/*` → `income-expense`, `billing`
- `test-bookings/*` → `test-booking`
- `staff/attendance*`, `staff/[id]/permissions` → `roles-permissions`
- `consult-pdf`, `prescriptions/[id]` → `dashboard`
- `medicines/search` → keep role-only (shared reference data, no tenant scope)

Preserve the existing admin-tier allowance where it is already correct — `/api/doctor/billing/[id]/pdf` and `/api/doctor/appointments/[id]/consent-file` legitimately admit `admin`/`manager` via `getBusinessScope()`, and those branches must keep working.

**Verification**

Re-run the four Burp requests from Reproduction. Each must return `403`. Then confirm `admin@gmail.com` and `manager1@gmail.com` retain their existing access to the admin-tier routes, and that `doctor@gmail.com` can still reach `/api/doctor/consult-pdf` (dashboard-scoped).

**Regression Risk**

MEDIUM. The seeded `Doctor` role carries only 5 modules, so any endpoint mapped to a module outside that set will start returning 403 for legitimate doctors. The e2e specs `appointments.spec.ts`, `billing.spec.ts`, and `patients.spec.ts` exercise exactly these flows and will surface any over-tightening. Mitigation: map each route to the same permission string already used in `DOCTOR_ROUTE_PERMISSIONS` (`lib/auth/permissions.ts:26`) so the two layers cannot drift.

---

### [HIGH] F-02 — Layout-blocked doctor-only panels reachable via API

**Endpoint:** `/api/doctor/sos/status`, `/api/prescriptions/[consultationId]`
**HTTP Method:** GET
**Affected Component:** Doctor emergency dispatch, consultation records
**Source Code Location:**
- `app/doctor/layout.tsx:56-63` (the guard that is being bypassed)
- `app/api/doctor/sos/status/route.ts`
- `app/api/prescriptions/[consultationId]/route.ts:14-30`

**Description**

The doctor layout contains an explicit, role-hardcoded restriction that receptionists may not reach emergency dispatch or the consultation features:

```ts
// app/doctor/layout.tsx:56
if (
  isReceptionistPanel &&
  (pathname === "/doctor/emergency" ||
    pathname === "/doctor/consultations" ||
    pathname.startsWith("/doctor/consultations/") ||
    pathname === "/doctor/online-consultations")
) {
  redirect("/receptionist");
}
```

This is a deliberate product decision — front-desk staff are excluded from clinical emergency dispatch and consultation records. Both underlying endpoints independently admit `receptionist` in their role list, so the layout redirect is the only enforcement and it does not apply to direct API calls.

**Reproduction**

```
GET /api/prescriptions/1 HTTP/1.1
Cookie: skora_session=<receptionist session>
```

**Evidence**

```
200  len=13     REC -> /api/doctor/sos/status       (layout blocks /doctor/emergency for REC)
200  len=5378   REC -> /api/prescriptions/1        (layout blocks /doctor/consultations for REC)
200  len=5378   DOC -> /api/prescriptions/1        (control: doctor is permitted)
```

**Root Cause**

The doctor-only/assistant-only distinction is expressed as a pathname denylist inside a layout component. That is the correct place for page navigation and the wrong place for authorization — it cannot constrain a route handler.

**Impact**

A receptionist account can download the full prescription PDF for any consultation belonging to their practice, containing medications, diagnosis notes, lab notes, medical history and the patient's contact details. It can also read the emergency dispatch status endpoint, exposing live patient SOS request data including coordinates and complaint text. Both are clinical PHI that the product deliberately withholds from this role.

**Fix**

Introduce an explicit doctor-only assertion at the top of each affected route rather than duplicating the pathname denylist. A single helper in `lib/auth/` expressing "doctor or receptionist, and receptionist additionally needs the module permission" keeps the rule in one place and reusable by both the layout and the handlers. Apply it to `/api/doctor/sos/status`, `/api/doctor/sos/stream`, and `/api/prescriptions/[consultationId]`.

**Verification**

Re-run the two reproduction requests as the receptionist — both must return `403`. Re-run `/api/prescriptions/1` as the doctor — must still return `200 application/pdf`. `e2e/home-visits.spec.ts` and the consultation e2e coverage will catch regressions in the doctor path.

**Regression Risk**

LOW-MEDIUM. The change is narrow and role-scoped. Watch the SOS stream (`/api/doctor/sos/stream`) which is a long-lived SSE connection — the guard must reject before the stream is constructed or the connection leaks.

---

### [HIGH] F-03 — Trial expiry enforced in exactly one code path

**Endpoint:** All `/doctor/**` server actions and all `/api/**` routes
**HTTP Method:** All
**Affected Component:** Doctor subscription/trial gating
**Source Code Location:**
- `app/doctor/layout.tsx:25-27` — the **only** enforcement point
- `lib/auth/action-scope.ts:70` `requireWriteScope` — no trial check
- `lib/auth/server-permissions.ts:70` `requireDoctorPermission` — no trial check
- `app/api/**` — no trial check

**Description**

Trial expiry is a paid-feature boundary. `trial_ends_at` gates dashboard access, and the guard lives in the doctor layout:

```ts
// app/doctor/layout.tsx:25
if (user.role === "doctor" && user.trialEndsAt && user.trialEndsAt <= new Date()) {
  redirect("/trial-expired");
}
```

A repository-wide search for `trialEndsAt` outside the super-admin display code and the signup/fulfillment writers returns **no** enforcement site:

```
$ grep -rln "trial" app/api app/doctor/actions.ts
NONE in app/api or server actions
```

Server actions are invoked directly over HTTP and are not routed through the layout. A doctor whose trial has expired can continue to create patients, book appointments, issue bills, upload reports and export data indefinitely.

**Reproduction**

1. Set any doctor's `trial_ends_at` to a past date.
2. Confirm `GET /doctor` redirects to `/trial-expired`.
3. Invoke any write action directly — `createBill`, `createPatient`, `createAppointment` — and observe success.

**Evidence**

```
$ grep -rn "trialEndsAt" app lib | grep -vE "app/super-admin|lib/db/schema|lib/auth/user"
app/doctor/layout.tsx:25:  if (user.role === "doctor" && user.trialEndsAt && user.trialEndsAt <= new Date()) {
app/doctor/layout.tsx:26:    redirect("/trial-expired");
app/(auth)/trial-expired/page.tsx:16:  ...  (redirect target validation)
app/(auth)/signup/actions.ts:28,41,123,130,144,155   (trial creation)
lib/packages/fulfillment.ts:52,59,87                 (trial extension on payment)

$ grep -rln "trial" app/api app/doctor/actions.ts
NONE in app/api or server actions
```

**Root Cause**

The gate was placed in a rendering component rather than in the shared authorization helpers. Because server actions and API routes never traverse that component, the control does not apply to them.

**Impact**

Direct monetization bypass. An expired or cancelled subscriber retains unrestricted write access — creating and billing patients, booking appointments, storing clinical documents — as long as they hold a valid session. The server-side session is not invalidated on trial expiry, so nothing else closes the door.

**Fix**

Move the check into the shared guards so it applies to every write path rather than to page rendering:

- Add the trial assertion to `requireWriteScope` (`lib/auth/action-scope.ts:70`) for the `doctor` role only, returning `null` on expiry so callers return a user-facing error.
- Add it to `requireDoctorPermission` (`lib/auth/server-permissions.ts:70`) for read paths.
- Keep the layout redirect — it produces the `/trial-expired` UX — but make it defence-in-depth rather than the sole control.
- Leave `admin`, `manager`, `receptionist` and `patient` untouched; only `doctor` accounts carry a trial.

Prefer returning `null` over `redirect()` inside the guards so API handlers get a machine-readable 403 rather than an opaque 307.

**Verification**

Set a doctor's `trial_ends_at` to the past. Confirm `/doctor` still redirects to `/trial-expired`, **and** that a direct action invocation now fails with a permission error. Confirm the paid flow still works: `lib/packages/fulfillment.ts` extends `trial_ends_at`, so a fulfilled purchase restores access with no further change.

**Regression Risk**

MEDIUM — this is the highest-blast-radius fix in the plan. Any doctor account in the e2e suite with a stale `trial_ends_at` will begin failing across many specs at once. Before implementing, seed a far-future `trial_ends_at` for all e2e doctor accounts and verify `e2e/doctor` flows pass. The seeded doctors currently have `trial_ends_at = NULL`, which must continue to mean "no trial restriction" rather than "expired".

---

### [HIGH] F-04 — Consent PDF served unauthenticated with no expiry or decision check

**Endpoint:** `/api/consents/[slug]/file`
**HTTP Method:** GET
**Affected Component:** Consultation consent records
**Source Code Location:** `app/api/consents/[slug]/file/route.ts:25-62`

**Description**

Consent links are shared with patients by email and WhatsApp, and the slug is the sole credential — the route is intentionally anonymous. The write path enforces a 7-day TTL:

```ts
// app/(marketing)/my-consent/[slug]/actions.ts
const CONSENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
```

The **read** path enforces nothing. Once `consent_file` is populated, the document is retrievable forever with no authentication, no TTL, and no check on whether the consent was accepted, rejected, or whether the underlying appointment was cancelled. The same applies to `/my-consent/[slug]`, which renders doctor name, patient name and appointment date anonymously.

**Reproduction**

```
GET /api/consents/965b15d4-e04e-43f1-aa31-47413b1afeb7/file HTTP/1.1
Host: localhost:3100
```

No cookie, no header, no token.

**Evidence**

```
200  ANON -> /api/consents/965b15d4…/file     (consent already ACCEPTED, created 2026-10-05)
     content-disposition: inline; filename="consent.pdf"
200  ANON -> /my-consent/965b15d4…           len=52380, contains doctor/patient identity strings
404  ANON -> /api/consents/9e6291de…/file     (undecided consent, no file yet — correct)
```

Stored path in the database: `consent-pdfs/consent_11_1791207435605.pdf`.

**Root Cause**

The TTL and single-decision invariants were implemented in the mutating action only. The read handler was written as a pure file proxy over `consent_file` and never consulted `created_at`, `is_accepted`, or `is_rejected`.

**Impact**

Consent documents are signed legal artifacts containing patient name, doctor name, appointment date and time. They remain downloadable indefinitely by anyone who ever received the link — including recipients who forwarded it, archived email inboxes, and anyone who obtains the slug from a shared messaging thread. Because the slug is a `crypto.randomUUID()` it is not guessable, so this is disclosure-on-link-leak rather than enumeration, but the retention is unbounded and there is no revocation path short of deleting the row.

**Fix**

Apply the same invariants to the read path that the write path already enforces:

1. Reject when `created_at` is older than `CONSENT_TTL_MS`, matching `respondConsent`.
2. Reject when the linked appointment has been cancelled.
3. Serve the auto-generated certificate only when `is_accepted` is true; a rejected or undecided consent has no certificate to serve.

Extract `CONSENT_TTL_MS` and the expiry predicate into `lib/files/consent-upload.ts` or a small shared module so the read and write paths cannot drift — the current duplication risk is exactly what caused this gap.

**Verification**

With a real accepted consent older than 7 days, confirm `GET /api/consents/<slug>/file` returns `403`/`404`. With a fresh accepted consent, confirm `200` and a valid PDF. `e2e` consent coverage and `upload-audit.spec.ts` will exercise the write path — confirm no regression there.

**Regression Risk**

LOW. Narrow and self-contained. The main risk is being too aggressive and breaking legitimate late responses — patients do sign days later — so keep the 7-day window exactly as the write path defines it rather than shortening it.

---

### [HIGH] F-05 — Receptionist self-escalation in staff and role actions

**Endpoint:** `updateStaff`, `deleteStaff`, `saveStaffPermissions` server actions
**HTTP Method:** POST (Next.js server action)
**Affected Component:** Staff and permission management
**Source Code Location:**
- `app/doctor/staff/actions.ts:85` `updateStaff`
- `app/doctor/staff/actions.ts:148` `deleteStaff`
- `app/doctor/roles/actions.ts:254` `saveStaffPermissions`
- Contrast with the guards that **do** exist: `app/doctor/roles/actions.ts:168` and `:204`

**Description**

All three actions scope their target by practice membership:

```ts
// app/doctor/staff/actions.ts:85 (updateStaff) — representative
const [existing] = await db.select({ id: users.id }).from(users)
  .where(and(
    eq(users.id, staffId),
    eq(users.referenceRoleId, doctorId),
    eq(users.role, "receptionist"),
  ));
if (!existing) return { error: "Staff member not found." };
```

A receptionist's own user row satisfies this predicate exactly. `createStaff` (`app/doctor/staff/actions.ts:29`) creates staff with `referenceRoleId: doctorId` and `role: "receptionist"` — the same two columns the check filters on. So a receptionist can pass their own `user.id` as `staffId` and be treated as a legitimate management target.

The codebase already recognises this class of problem. Both role actions guard against self-modification explicitly:

```ts
// app/doctor/roles/actions.ts:168
if (myRoles.includes(existing.name))
  return { error: "You cannot edit a role assigned to your own account." };
// app/doctor/roles/actions.ts:204
if (myRoles.includes(existing.name))
  return { error: "You cannot delete a role assigned to your own account." };
```

The three staff actions have no equivalent guard. The asymmetry strongly suggests an oversight rather than a decision.

**Impact**

A receptionist holding `staff-edit` can call `updateStaff` with their own id and:
- **overwrite their own password** with no current-password verification — `updateStaff` hashes and writes whatever is submitted, unlike `updateProfileAction` (`app/doctor/profile/actions.ts:130`) which requires the current password
- change their own `role_id` to any role belonging to the practice, including a fully-privileged one
- change their own email, breaking audit attribution

A receptionist holding `roles-edit` can call `saveStaffPermissions` with their own id and grant themselves the entire 68-permission catalog, escalating from a front-desk account to full practice administration — creating and deleting staff, editing roles, and reaching every module.

A receptionist holding `staff-delete` can delete their own account.

**Reproduction**

Currently blocked by F-06: the seeded receptionist row has `reference_role_id = NULL`, so the ownership predicate does not match. To reproduce, create a staff member through the normal UI (`createStaff` writes both columns) and attempt `updateStaff(ownId, { name, email, role_id, password })` as that staff member.

```ts
await updateStaff(previousState, formData)
// formData: { id: <own user.id>, name, email, role_id: <privileged role>, password: "attacker-chosen" }
// -> ownership check passes, password overwritten, role escalated
```

**Evidence**

Ownership predicate returns a match for a self-targeted request:

```sql
SELECT id FROM users WHERE id = 4 AND reference_role_id = 2 AND role = 'receptionist';
-- seeded receptionist: 0 rows (reference_role_id is NULL — this is F-06, not a mitigation)
-- any staff member created via createStaff: 1 row
```

No `staffId === user.id` comparison exists in any of the three actions:

```
$ grep -n "staffId === \|me\.id\|callerId\|user\.id" app/doctor/staff/actions.ts
(no matches)
```

**Root Cause**

The ownership predicate is a proxy for "someone other than me". It works for every staff member created through `createStaff` *except the caller*, whose row is indistinguishable by construction. The role actions solve this by comparing against the caller's assigned role names; the staff actions never perform an equivalent identity comparison.

**Fix**

Add an explicit self-targeting guard to all three actions, mirroring the pattern already used in `app/doctor/roles/actions.ts:168`:

```ts
const me = await getCurrentUser();
if (staffId === me.id) return { error: "You cannot modify your own account." };
```

Additionally, `updateStaff` should require the current password when changing the target's password, and should refuse to change the caller's own `role_id`. Consider routing self-service password changes exclusively through `updateProfileAction`, which already has the correct verification.

**Verification**

Create a staff account through the UI, sign in as that account, and invoke `updateStaff` with their own id — must be refused. Confirm a doctor can still update any staff member normally. `e2e/staff.spec.ts` and `e2e/staff-flow.spec.ts` cover these paths.

**Regression Risk**

LOW. The guard only rejects the self-target case, which is never legitimate through these actions. Confirm the doctor-facing "edit staff" UI does not render an edit control for the doctor's own row in a way that would now break — it does not, since doctors are `role: 'doctor'` and are not listed as staff.

---

### [MEDIUM] F-06 — Staff management functionally broken by column-shape split

**Endpoint:** `/doctor/staff`, `/api/doctor/staff/[id]/permissions`, `/api/doctor/staff/attendance`
**HTTP Method:** GET, POST
**Affected Component:** Doctor-tier staff management
**Source Code Location:**
- `scripts/seed.ts:271-283` — receptionist inserted with `doctorId` only
- `app/doctor/staff/actions.ts:57-60` — `createStaff` writes **both** columns
- `app/doctor/staff/page.tsx:33-34`, `app/doctor/staff/actions.ts:98`, `app/doctor/roles/actions.ts:238`, `app/api/doctor/staff/[id]/permissions/route.ts:33` — all filter on `referenceRoleId`

**Description**

The schema carries two link columns on `users`: the modern `doctor_id` and the legacy Laravel-spatie `reference_role_id`. The application already knows they diverge and papers over it in exactly one place:

```ts
// lib/auth/user.ts — getCurrentUser
return { ...row, doctorId: row.doctorId ?? row.referenceRoleId };
```

Every staff query filters on `reference_role_id` only. The seed writes `doctorId` only. The result is that the seeded practice has **zero** discoverable staff.

Live row shapes:

```
id  email                      role          doctor_id  reference_role_id  shape
 4  receptionist@gmail.com     receptionist  2          NULL               ONE
 2  doctor@gmail.com           doctor        NULL       NULL               NEITHER
 3  patient@gmail.com          patient       NULL       2                  ONE
```

**Reproduction**

1. Sign in as `doctor@gmail.com`.
2. Open `/doctor/staff` — the staff roster is empty.
3. Sign in as `receptionist@gmail.com` and request `/api/doctor/staff/4/permissions` — own row, `404`.

**Evidence**

```sql
-- /doctor/staff roster
SELECT id,email,name FROM users WHERE reference_role_id=2 AND role='receptionist';
-- 0 rows

-- /api/doctor/staff/[id]/permissions ownership check, staffId=4
SELECT id FROM users WHERE id=4 AND reference_role_id=2 AND role='receptionist';
-- 0 rows
```

```
404  DOC -> /api/doctor/staff/4/permissions   (doctor cannot open the receptionist's permission dialog)
404  REC -> /api/doctor/staff/4/permissions   (receptionist cannot read own permissions)
200  DOC -> /api/doctor/staff/attendance      (200 but body is {"date":…,"data":[]})
```

**Root Cause**

`createStaff` writes both `referenceRoleId` and `doctorId`; the seed writes only `doctorId`. The read paths assume `referenceRole_id` is authoritative. `getCurrentUser` already implements the correct fallback and is the natural place to extend.

**Runtime confirmation.** This was reproduced on a from-scratch install, not only observed on the live database. A scratch database was created, provisioned with `npm run db:migrate`, and seeded with `npm run db:seed`. The seed produced the identical defect:

```
fresh seeded DB — users
id  email                      role          doctor_id  reference_role_id
 4  receptionist@gmail.com     receptionist  2          NULL        ← same shape
 3  patient@gmail.com          patient       NULL       2

SELECT id,email FROM users WHERE role='receptionist' AND reference_role_id IS NOT NULL;
  → 0 rows        (the staff-ownership predicate matches nothing)
```

So this is a deterministic seed defect, not stale local data — every fresh development environment inherits it.

**Impact**

Functional regression, not a security hole — it incidentally masks F-05 for the seeded account. Staff management is inoperable for any practice provisioned outside the UI: no roster, no permission editing, no attendance, and the staff-actions ownership check rejects every legitimate target. It also means F-05 becomes live the moment anyone creates a staff account through the UI.

**Fix**

Pick one column as canonical and make the read paths agree. The lower-risk option, consistent with the existing code, is to mirror the `getCurrentUser` fallback in the staff queries:

- `app/doctor/staff/page.tsx:34` — match `referenceRoleId = doctorId OR doctorId = doctorId`
- `app/doctor/staff/actions.ts:98` (`updateStaff`), `:151` (`deleteStaff`) — same
- `app/doctor/roles/actions.ts:238` (`getUserPermissionNames`), `:262` (`saveStaffPermissions`) — same
- `app/api/doctor/staff/[id]/permissions/route.ts:33` — same

Alternatively, backfill `reference_role_id` from `doctor_id` for existing receptionist rows and correct `scripts/seed.ts:271-283` to write both columns, matching `createStaff`. The backfill is the smaller change and makes existing data consistent; do it **in addition to** fixing the seed, and only after F-05 is closed — a backfill alone would activate the self-escalation path.

Add a data-integrity guard so the two columns cannot silently diverge again: a migration asserting that every `role = 'receptionist'` row has a non-null link in at least one column.

**Verification**

After the fix, `/doctor/staff` lists `receptionist@gmail.com`; `/api/doctor/staff/4/permissions` returns `200` for the doctor; attendance returns a populated `data` array. Then confirm F-05's guard rejects self-targeting.

**Regression Risk**

MEDIUM. This fix makes previously-inert code paths reachable, which will surface F-05 and may reveal other latent issues in staff management. Fix F-05 first, or land both in the same change. `e2e/staff.spec.ts`, `staff-flow.spec.ts` and `roles.spec.ts` should be run in full.

---

### [MEDIUM] F-07 — Rate limiter collapses into a single global bucket

**Endpoint:** `/api/shule/doctors` (rate-limited), `loginAction` (no IP dimension)
**HTTP Method:** GET, POST
**Affected Component:** `lib/security/rate-limit.ts`, `lib/security/ip.ts`
**Source Code Location:**
- `lib/security/ip.ts:39` — `return "unknown"`
- `lib/security/ip.ts:25` — `process.env.TRUSTED_PROXY_HEADER?.toLowerCase()`
- `.env:59` — `# TRUSTED_PROXY_HEADER=x-forwarded-for` (commented out)
- `lib/security/rate-limit.ts:63` — `login: (email) => rateLimit(\`login:${email}\`, …)` — email key only

**Description**

`getClientIp` deliberately refuses to trust client-settable forwarding headers and returns the literal string `"unknown"` unless `TRUSTED_PROXY_HEADER` names a proxy-controlled header. That is a sound default, but the variable is commented out in `.env`, so **every** caller currently resolves to `"unknown"`.

The rate limiter keys buckets on that value. `app/api/shule/doctors/route.ts:41` uses:

```ts
const { allowed } = rateLimit(`shule-doctors:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
```

With `ip === "unknown"` for all callers, every client in the world shares one 120-requests-per-minute bucket. A single client can exhaust it and deny the integration to everyone else.

The same root cause silently disables IP attribution in the audit log — all 35 existing rows record `"unknown"`, and no real IP has ever been captured.

Separately, login limiting is keyed on email alone, with no IP dimension, so distributed credential stuffing against a known account is unthrottled.

**Reproduction**

```
$ grep -n "^#.*TRUSTED_PROXY_HEADER" .env
59:# TRUSTED_PROXY_HEADER=x-forwarded-for   # real client IP behind a proxy

$ SELECT COUNT(*) total, SUM(ip_address='unknown') unknown, SUM(ip_address NOT IN ('unknown') AND ip_address IS NOT NULL) real FROM audit_logs;
total 35 · unknown 35 · real 0
```

Re-verified after the Playwright run, which quadrupled the audit table. The fallback did not resolve itself once traffic increased:

```sql
SELECT ip_address, COUNT(*) n FROM audit_logs GROUP BY ip_address;
-- ip_address      n
-- 'unknown'     139      ← the ONLY value in the table
```

Send 121 requests to `/api/shule/doctors` from any client; the 121st returns `429` for every caller.

**Evidence**

```sql
SELECT action, COUNT(*) n FROM audit_logs GROUP BY action;
login 26 · logout 2 · appointment_created 3 · patient_created 1 · consent_given 1 · appointment_cancelled 1 · signup 1
-- ip_address: 35/35 'unknown', 0 real
```

Expanded post-test, 22 distinct actions across 139 rows — the audit trail is rich in *what* happened and completely empty of *who* or *from where*:

```
login 41 · file_uploaded 12 · role_changed 12 · appointment_created 10 · login_failed 7
transaction_created 6 · category_created 6 · patient_created 6 · bill_created 5
pdf_downloaded 4 · transaction_deleted 4 · settings_updated 4 · logout 3 · …
-- ip_address: 139/139 'unknown', 0 real
```

**Root Cause**

Two well-designed mechanisms composed badly. `getClientIp` fails closed (correct — spoofable headers must not be trusted), and the limiter assumes a distinct value per client. Failing closed to a *shared constant* turns a per-client limit into a global one, which is strictly worse than having no limit.

**Impact**

Availability: one client can deny the Shule doctor-sync integration to all integrators. Security: no rate limiting is IP-based, so distributed password guessing against a known email is unconstrained; the per-email limit only stops single-source spraying. Auditability: the audit trail cannot attribute any action to an IP, which materially weakens incident response on a system holding PHI.

**Fix**

1. Set `TRUSTED_PROXY_HEADER=x-forwarded-for` in the deployment environment (it must actually be deployed behind a proxy that overwrites the header — the code is correct to distrust it otherwise, and this must not be set on a directly-exposed server).
2. Make the limiter fail *open but distinct* rather than to a shared constant: when the IP is unresolvable, key on a stable per-request identity rather than the literal `"unknown"`. At minimum, log a startup warning when `TRUSTED_PROXY_HEADER` is unset in production so the degradation is visible rather than silent.
3. Add an IP dimension to the login limiter alongside the existing per-email key, so distributed attempts against one account are bounded.

**Verification**

Set the variable behind the proxy, confirm `audit_logs` starts recording real IPs on the next login. Confirm `/api/shule/doctors` returns `429` per-client rather than globally. Confirm login limiting still blocks single-source brute force.

**Regression Risk**

LOW for the code change; MEDIUM for the config, because setting `TRUSTED_PROXY_HEADER` on a server that is *not* behind a proxy re-opens IP spoofing. Document the requirement alongside the variable in `.env.example`.

---

### [MEDIUM] F-08 — Production CSP ships `'unsafe-inline'` for scripts

**Endpoint:** All responses (set in `proxy.ts`)
**HTTP Method:** All
**Affected Component:** Next.js 16 proxy / middleware
**Source Code Location:** `proxy.ts:26`, `proxy.ts:34-37`, `proxy.ts:38-41`

**Description**

The code intends to relax CSP in development only. The `'unsafe-inline'` token sits **outside** the `isDev` ternary:

```ts
// proxy.ts:34
`script-src 'self' ${
  isDev ? "'unsafe-eval' 'unsafe-inline'" : ""
} 'unsafe-inline' https://cdn.jsdelivr.net`,
```

So production builds emit `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`. The dev response shows the token twice — `'unsafe-eval' 'unsafe-inline' 'unsafe-inline'` — which is direct evidence of the stray unconditional entry.

Additionally the policy omits `frame-ancestors`, `object-src`, and `base-uri` is present but `frame-src 'self'` is the only framing control.

**Reproduction**

```
$ curl -sI http://localhost:3100/login | grep -i content-security-policy
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'unsafe-inline' https://cdn.jsdelivr.net; …
```

**Evidence**

```
content-security-policy: default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src  'self' 'unsafe-inline' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self' ws://localhost:* https://cdn.jsdelivr.net;
  frame-src 'self'; media-src 'self'; worker-src 'self' blob:;
  base-uri 'self'; form-action 'self'
```

The doubled `'unsafe-inline'` is the smoking gun. Note also `style-src` has the same defect, and `cdn.jsdelivr.net` is script-loadable from any origin in production.

**Root Cause**

Template-literal string assembly rather than a structured policy object. The dev/prod branch was added around the `'unsafe-eval'` token and the pre-existing `'unsafe-inline'` was never moved inside it.

**Impact**

CSP is the primary defence-in-depth control against XSS. With `'unsafe-inline'` in `script-src` in production, any XSS injection — stored or reflected — executes unrestricted, and CSP provides no mitigation. The permissive `img-src https:` and `connect-src` to a third-party CDN further widen the exfiltration surface. This does not create a vulnerability on its own; it removes the safety net that would contain one.

**Fix**

Move `'unsafe-inline'` inside the `isDev` branch for both `script-src` and `style-src`. Add `object-src 'none'` and `frame-ancestors 'none'` (redundant with `X-Frame-Options: DENY` but correct as defence-in-depth). Consider removing `cdn.jsdelivr.net` from `script-src` in production — verify no production dependency first; the marketing pages load images from it, which `img-src https:` already permits.

**Verification**

```
NODE_ENV=production npm run build && NODE_ENV=production npm start
curl -sI http://localhost:3000/login | grep -i content-security-policy
# must NOT contain 'unsafe-inline' in script-src
```

Re-run the full e2e suite after tightening — an over-strict CSP can break React hydration and inline styles that currently rely on `'unsafe-inline'`. This is the highest-regression-risk item in the hardening group.

**Regression Risk**

MEDIUM-HIGH. Strict CSP commonly breaks Next.js hydration and third-party embeds. Land this behind a full e2e run, and if hydration breaks, move to nonce-based CSP as the file's own comment already suggests.

---

### [MEDIUM] F-09 — Secrets and PHI stored at mode 0777

**Endpoint:** n/a — filesystem
**Affected Component:** Deployment configuration
**Source Code Location:** `.env`, `.env.example`, `storage/`, `storage/uploads/**`

**Description**

Filesystem permissions on the secret store and the PHI store are world-readable **and** world-writable.

```
$ stat -c '%A %U:%G %n' .env storage storage/uploads .env.example
-rwxrwxrwx adam:adam .env
drwxrwxrwx adam:adam storage
drwxrwxrwx adam:adam storage/uploads
-rwxrwxrwx adam:adam .env.example
```

**Description of contents (redacted):**

- `.env` — `AUTH_SECRET` (session signing key), `DATABASE_URL` (DSN with credentials), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NODE_ENV`
- `storage/uploads/` — `patient-photos/`, `consent-files/`, `consent-pdfs/`, `signatures/`, `profile-photos/`, `test-reports/`, `transactions/`, `doctor-consult-pdfs/`

**Evidence**

Git tracking was verified clean — `.env` is untracked and correctly listed in `.gitignore`, and only `.env.example` (placeholder values) is committed. The exposure is purely local filesystem access, not VCS leakage.

```
$ git ls-files | grep -E "^\.env$|^\.env\."
.env.example
```

**Root Cause**

Files created on a permissive umask, likely during initial local setup, never tightened. No deployment script enforces ownership or mode.

**Impact**

On a shared or multi-tenant host, **any** local user can read the session-signing key — which permits forging a valid `skora_session` JWT for any user id, including `super_admin`, because the token is a symmetric HS256 signature with no server-side secret beyond `AUTH_SECRET` (the `sessions` table check requires a matching `jti` row, but a forged token can reuse a known or newly-inserted `jti`). World-writability additionally allows tampering with `.env` to redirect `DATABASE_URL`, and with any file under `storage/uploads/` to replace a patient's photo, signature, or consent document with arbitrary content — served back through the application's own authenticated routes, giving the tampering a degree of credibility.

**Fix**

```
chmod 600 .env
chmod 750 storage storage/uploads
chmod 700 storage/uploads/patient-photos storage/uploads/consent-files storage/uploads/consent-pdfs storage/uploads/signatures
```

Encode these modes in the deployment/runbook so they survive reinstall. Consider also removing the execute bit from both `.env` files (`0644 .env.example`, `0600 .env`).

**Verification**

```
$ stat -c '%A %n' .env storage storage/uploads
-rw------- .env
drwxr-x--- storage
drwxr-x--- storage/uploads
```

Confirm the app still reads `.env` and serves uploads after the change.

**Regression Risk**

LOW. Verify the process user retains read access to `.env` and traverse access on `storage/uploads/`, particularly under systemd or container UID mapping.

---

### [LOW] F-10 — Sessions never idle out; audit metadata never populated

**Endpoint:** n/a — session lifecycle
**Affected Component:** `lib/auth/session.ts`
**Source Code Location:** `lib/auth/session.ts:37-50` (`persistSession`), `:14` (`SESSION_MAX_AGE`), schema `lib/db/schema.ts:114-125`

**Description**

`persistSession` writes `last_activity` **once**, at login:

```ts
await db.insert(sessions).values({
  id: jti, userId, payload: "{}", lastActivity: now,
});
```

No code path ever updates it. There is no idle timeout — a session is valid for a fixed 30 days from issuance regardless of use. `ip_address` and `user_agent` are columns on the `sessions` table but are never written; every one of the 47 rows is NULL.

**Evidence**

Re-verified after the Playwright run, which more than doubled the session population and spread it across three days — a larger sample than the original pass had:

```sql
SELECT COUNT(*) total,
       SUM(ip_address   IS NULL) ip_null,
       SUM(user_agent   IS NULL) ua_null,
       FROM_UNIXTIME(MIN(last_activity)) oldest,
       FROM_UNIXTIME(MAX(last_activity)) newest
  FROM sessions;
-- total=47  ip_null=47  ua_null=47
-- oldest 2026-10-05 12:13:41Z   newest 2026-10-07 07:50:45Z
```

The per-day distribution is the direct evidence for "never refreshed" — `last_activity` values cluster purely on the day each session was *issued*, with no drift toward later activity:

```sql
SELECT FROM_UNIXTIME(last_activity,'%Y-%m-%d') d, COUNT(*) n
  FROM sessions GROUP BY d ORDER BY d;
-- 2026-10-05 → 20
-- 2026-10-06 →  2
-- 2026-10-07 → 25     (issuance days, not usage days)
```

Sessions created on 2026-10-05 and used on 2026-10-07 still record 2026-10-05, so the column is written exactly once per session and never again.

**Impact**

A stolen or abandoned session token remains usable for up to 30 days with no way to distinguish active from idle, and no idle-based automatic revocation. The missing IP/user-agent capture weakens attribution in the event of token theft.

**Fix**

Refresh `last_activity` on each authenticated request (throttled — at most once per few minutes to avoid a write on every request), and reject sessions idle beyond a configured window. Populate `ip_address` and `user_agent` at `persistSession` from `getClientIp()` and the request headers. Add an `SESSION_IDLE_TIMEOUT` entry to `lib/config.ts` alongside the existing `SESSION_MAX_AGE`.

**Verification**

Log in, wait past the idle window, confirm the next request redirects to `/login` and the `sessions` row is removed. Confirm `last_activity` advances during activity and `ip_address` is populated.

**Regression Risk**

MEDIUM — this affects every authenticated request on the platform. Throttle the write aggressively and fail open on write errors, or a transient DB hiccup will log everyone out.

---

### [LOW] F-11 — Non-expiring vendor upload token discloses PHI

**Endpoint:** `/vendor/upload-test/[token]`, `uploadTestReport`
**HTTP Method:** GET, POST
**Affected Component:** Lab vendor report upload
**Source Code Location:** `app/vendor/upload-test/[token]/page.tsx`, `app/vendor/upload-test/[token]/actions.ts:41-62`, `app/doctor/test-bookings/actions.ts:55-57`

**Description**

The token is `crypto.randomBytes(24).toString("hex")` — 192 bits, adequate entropy. But it has **no expiry**: the schema has no expiry column and neither the page nor the action checks age. Anyone holding the link can view the booking and upload a report indefinitely.

The unauthenticated page renders doctor name, vendor name, patient name, and the test list.

**Evidence**

Confirmed by source review: no expiry column in `lib/db/schema.ts:875-918` and no age check in the page or action.

*Update:* `test_bookings` was empty during the original pass. The Playwright suite has since created row #1 (`doctor_id=2`, `patient_id=8`, `status=completed`, `upload_link_token` 48 hex chars), so the flow is no longer untestable — but the row is already `completed`, so the **no-expiry** claim specifically was still not exercised over time. Establishing it needs a deliberately back-dated booking.

**Impact**

A token forwarded to the wrong vendor, or archived in an email thread, grants indefinite access to patient identity and test details plus the ability to submit a clinical document. There is no revocation path except the doctor regenerating the token (`app/doctor/test-bookings/actions.ts:574`).

**Fix**

Add an expiry column (or reuse `created_at` with a fixed window) and enforce it in both the page and the action, mirroring the 7-day consent TTL pattern already in the codebase. Consider adding single-use semantics: once a report is uploaded the link should stop granting upload rights — the action already blocks this (`status === "completed"`), so the remaining gap is purely expiry.

**Verification**

Create a booking, wait past the window, confirm the page 404s and the action refuses. Confirm a fresh link still works.

**Regression Risk**

LOW. `e2e/test-bookings.spec.ts` and `uploads.spec.ts` cover the happy path.

---

### [LOW] F-12 — `/api/doctors/[id]/photo` has no role or ownership check on the target

**Endpoint:** `/api/doctors/[id]/photo`
**HTTP Method:** GET
**Affected Component:** Public profile photos
**Source Code Location:** `app/api/doctors/[id]/photo/route.ts:20-42`

**Description**

The route requires authentication but applies no authorization to the target:

```ts
const user = await getCurrentUser();
if (!user) return new Response("Unauthorized", { status: 401 });
// no role check on `user`, no ownership/scoping check on `doctorId`
const [doctor] = await db.select({ profilePhotoPath: users.profilePhotoPath })
  .from(users).where(eq(users.id, doctorId)).limit(1);
```

Any authenticated user of any role can enumerate ids and retrieve any account's profile photo, including patients'.

**Runtime confirmation.** This was originally evidenced only by source reading, because no user had a photo to fetch. The Playwright suite uploaded a real profile photo to `doctor@gmail.com` (user #2), which made the finding dynamically testable:

```
200  len=22  image/jpeg   DOC2  -> /api/doctors/2/photo   (control: the owner)
200  len=22  image/jpeg   PATIENT #3  -> /api/doctors/2/photo   (a patient reading a DOCTOR's photo)
200  len=22  image/jpeg   PATIENT #22 -> /api/doctors/2/photo   (an unrelated patient)
200  len=22  image/jpeg   DOCTOR #12 -> /api/doctors/2/photo   (a peer doctor, different practice)
401  len=12  text/plain   ANON       -> /api/doctors/2/photo   (correctly blocked)
```

Every authenticated role receives the image; only the anonymous request is refused. The finding is confirmed at runtime, not inferred.

**Contrast — the scoping that does work.** The patient-photo routes correctly enforce practice ownership, including for an orphan patient with no doctor link:

```
404  DOC2  -> /api/doctor/patients/22/photo   (patient #22 is not theirs)
404  DOC12 -> /api/doctor/patients/22/photo
404  DOC12 -> /api/doctor/patients/3/photo    (patient #3 belongs to doctor #2)
```

So cross-tenant IDOR is properly blocked where ownership is checked — which is exactly why the missing check on this one route stands out.

**Impact**

Low. Profile photos are low-sensitivity and the same images are served to any authenticated user by design elsewhere (`/api/doctor/profile/photo` scopes practice doctors deliberately, so the inconsistency is notable). It does permit confirming that a given user id exists and enumerate the platform's user-id space.

**Fix**

Constrain to the `doctor` role, matching the route's `/api/doctors/` naming, or scope to practice members as `/api/doctor/profile/photo` already does. If public doctor photos are genuinely intended, move the route out of the authenticated namespace and drop the session requirement.

**Verification**

Set a photo on a test doctor, confirm a patient can no longer fetch it while the doctor and their own practice still can.

**Regression Risk**

LOW, but check marketing pages — if doctor avatars are rendered on public pages for logged-out visitors, this route may be load-bearing for them.

---

### [LOW] F-13 — Traversal guard uses a bare `startsWith` prefix

**Endpoint:** All file-serving routes
**HTTP Method:** GET
**Affected Component:** Path containment checks
**Source Code Location:** `app/api/consents/[slug]/file/route.ts:47`, `app/api/super-admin/file/[...path]/route.ts`, `app/api/doctor/patients/[id]/photo/route.ts`, and 5 others

**Description**

Every traversal guard uses the same primitive:

```ts
const resolved = path.resolve(STORAGE_DIR, relativePath);
if (!resolved.startsWith(STORAGE_DIR)) return new Response("Forbidden", { status: 403 });
```

`startsWith` on a bare path is not a containment test. A sibling directory named `storage/uploads-evil` satisfies `startsWith("/…/storage/uploads")`.

**Evidence**

Exploitation is **not** currently reachable — the served paths come from database columns written by server-side upload helpers, never from request input. Encoded traversal payloads were tested and correctly rejected:

```
404  /api/public/file/landing/../../../../../../etc/passwd
404  /api/public/file/landing/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd
404  /api/super-admin/file/landing/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd
```

`/api/public/file` additionally enforces a strict `^[a-zA-Z0-9._-]+$` filename pattern and an explicit `..` rejection, which is why it holds up well.

**Root Cause**

The correct primitive is `path.relative`:

```ts
const rel = path.relative(STORAGE_DIR, resolved);
if (rel.startsWith("..") || path.isAbsolute(rel)) return forbidden;
```

**Impact**

None today. This is a hardening item: the guard is one refactor away from being load-bearing for attacker-influenced input, and it is replicated in 8 places where a future change could introduce divergence.

**Fix**

Replace all 8 occurrences with the `path.relative` form. Extract a single `resolveWithinStorage()` helper in `lib/utils/uploads.ts` so there is exactly one implementation to audit.

**Verification**

Re-run the traversal payloads above (all must remain `404`/`403`), plus a synthetic `../uploads-evil/x.png` case against the unit boundary.

**Regression Risk:** LOW. Pure hardening with no behavioural change for valid paths.

---

### [LOW] F-14 — Payment verification not bound to the initiating user

**Endpoint:** `/api/packages/verify`
**HTTP Method:** POST
**Affected Component:** Razorpay checkout fulfillment
**Source Code Location:** `app/api/packages/verify/route.ts:14-46`, `lib/packages/fulfillment.ts:35-40`

**Description**

The handler authenticates but does not check that the order belongs to the caller:

```ts
const user = await getCurrentUser();
if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
// no user.id === payment.user_id check
const result = await fulfillPackagePayment({ orderId, paymentId, signature, source: "checkout" });
```

`fulfillPackagePayment` looks the order up by `razorpayOrderId` alone.

**Evidence**

No `package_payments` rows exist, so this could not be exercised dynamically. Confirmed by source review.

**Impact**

Low. Exploitation requires a valid Razorpay HMAC signature over `order_id|payment_id`, which an attacker cannot forge without the key secret, and fulfillment is idempotent on `orderId`. A user could only ever fulfill their *own* order early, which they can already do legitimately.

**Fix**

Assert `payment.userId === user.id` inside `fulfillPackagePayment` (or before calling it) for the `checkout` source. Keep the webhook path — Razorpay's server-to-server callback legitimately has no session.

**Verification**

Attempt to verify another user's order id with a valid signature — must be rejected.

**Regression Risk:** LOW.

---

### [INFO] F-15 — OTP echoed to the client outside production

**Endpoint:** `sendSignupOtp`
**HTTP Method:** POST (server action)
**Affected Component:** `app/(auth)/signup/otp-actions.ts:53-54`

**Description**

```ts
const isDev = process.env.NODE_ENV !== "production";
return { error: null, sent: true, ...(isDev ? { devOtp: otp } : {}) };
```

Correctly gated. Flagged only because a misconfigured production deployment (`NODE_ENV` unset) would return the OTP to the client, collapsing the email-verification gate entirely. The local `.env` has `NODE_ENV=development`, so this is live in the current environment.

**Fix** — Invert to a positive check: echo the OTP only when an explicit `EXPOSE_DEV_OTP=true` is set, and refuse to start in production with that flag on.

**Regression Risk:** LOW. Will require updating any e2e flow that reads `devOtp`.

---

## 3b. Database Findings

These six findings come from a second pass against the live MariaDB instance — schema introspection, `EXPLAIN`, `information_schema` queries, and a 20-invariant data-integrity scan. All read-only.

---

### [LOW] F-16 — Four redundant SQL files are silently ignored by the migration runner

> **CORRECTION.** This finding was originally published as **HIGH**, claiming a fresh deployment would boot with no audit log, no SOS dispatch and no push subscriptions. **That claim was wrong and is retracted.** It rested on reading `scripts/migrate.ts:47` and observing four files absent from `migration_log`, without reproducing a fresh install. When the reproduction was finally run (below), the fresh schema proved **byte-identical to the live database**. The four files are redundant leftovers superseded by numbered migrations. Severity downgraded **HIGH → LOW**. Register entry at §11.5.

**Endpoint:** n/a — deployment / schema provisioning
**Affected Component:** `scripts/migrate.ts`, `drizzle/*.sql`
**Source Code Location:** `scripts/migrate.ts:47`

**Description**

The runner discovers migrations by filename pattern:

```ts
// scripts/migrate.ts:47
.filter((f) => f.endsWith(".sql") && /^\d{4}_/.test(f))
```

Four files in `drizzle/` do not match `/^\d{4}_/`, so they are never applied and never recorded in `migration_log`:

| File | What it declares | Already provided by |
|---|---|---|
| `audit_logs.sql` | `CREATE TABLE audit_logs` | `0000_fine_the_leader.sql` |
| `push_subscriptions.sql` | `CREATE TABLE push_subscriptions` | `0012_legacy_extras.sql:73` |
| `sos_dispatch.sql` | `sos_requests`, `sos_offers`, `sos_cases`; `users.on_duty` | `0012_legacy_extras.sql:89,114,136`; `0000:717` |
| `integrity_constraints.sql` | 2 FKs, 6 unique keys, 2 generated columns | almost entirely `0000`; only `appointments_clinic_id_foreign` is unique to it |

**The originally-claimed impact was wrong.** Every object these files declare is already created by numbered migrations that *do* run. The first analysis assumed the untracked files were the sole source.

`integrity_constraints.sql` is also self-documenting about its status — its own header gives a **manual** apply instruction, not a migration one:

```sql
-- Apply:
--   mysql -h 127.0.0.1 -P 3307 -u root skoracares_db < drizzle/integrity_constraints.sql
```

**Reproduction (of the actual, lower-severity behaviour)**

```
$ ls drizzle/*.sql | grep -vE '^[0-9]{4}_'
drizzle/audit_logs.sql
drizzle/integrity_constraints.sql
drizzle/push_subscriptions.sql
drizzle/sos_dispatch.sql

$ grep -c 'CREATE TABLE' drizzle/0000_fine_the_leader.sql   → 58
$ grep -c 'CREATE TABLE' drizzle/0012_legacy_extras.sql      → 6
```

**Evidence — fresh install versus live database**

A scratch database was provisioned with the documented command only:

```
$ DATABASE_URL=…/skoracares_f16_repro npm run db:migrate
Applying 0000_fine_the_leader.sql …
…
Applying 0013_doctor_role_clinical_core.sql … done
All migrations applied (14 tracked).
```

Full schema diff against the live database via `information_schema`:

```
COLS  live=655 fresh=655  in-live-but-not-fresh=0
IDX   live=211 fresh=211  in-live-but-not-fresh=0
FK    live=85  fresh=85   in-live-but-not-fresh=0
```

The objects the original finding claimed would be missing, all present:

```
PRESENT  audit_logs             (0000_fine_the_leader.sql)
PRESENT  push_subscriptions     (0012_legacy_extras.sql:73)
PRESENT  sos_requests           (0012_legacy_extras.sql:89)
PRESENT  sos_offers             (0012_legacy_extras.sql:114)
PRESENT  sos_cases              (0012_legacy_extras.sql:136)
PRESENT  users.on_duty          (0000_fine_the_leader.sql:717)
Foreign keys present: 85
```

The seed then ran cleanly against that fresh database, proving the from-scratch path works end to end:

```
🌱 Seeding SkoraCares…
✅ Seed complete.
   admin@gmail.com → /super-admin   owner@… → /admin   manager1@… / manager2@… → /admin
   doctor@gmail.com → /doctor       patient@… → /patient
```

**Root Cause**

The four files predate the drizzle-kit pipeline — September-era manual remediation scripts. Later work regenerated the same schema as numbered migrations, superseding them, but the originals were never deleted. The filename filter then makes them permanently inert with no indication.

**Impact**

Low, and entirely maintenance-side:

- **No deployment or runtime impact.** Fresh installs are complete and correct, proven above.
- **Maintenance confusion.** Four files in `drizzle/` look authoritative but do nothing. A future developer editing `sos_dispatch.sql` to change the SOS schema would see no effect and no error — the most likely real failure mode.
- **`--status` was not lying.** It correctly reports nothing pending, because nothing is pending. The "false clean" characterisation was part of the retracted claim.

**Fix**

Delete the four files, or move them to `docs/archive/` with a header noting they are superseded. Do **not** widen the runner's filter to accept all `.sql` files — that would start applying `integrity_constraints.sql`, whose `ALTER TABLE … ADD CONSTRAINT` statements are **not idempotent** and would fail against any database that already has them.

Optionally add a warning to the migration runner when a non-numeric `.sql` file is present in `drizzle/`, so the situation is visible rather than silent.

**Verification**

Already performed — the evidence above *is* the verification. After deleting the files, `npm run db:migrate:status` should still report 14 applied / 0 pending on both live and a fresh scratch database, and the 655/211/85 diff should still show zero drift.

**Regression Risk:** VERY LOW. Deleting inert files changes nothing that runs. One caution: if any deployment runbook manually applies `integrity_constraints.sql`, update it first — though the file's own header shows that step is already obsolete, since `appointments_clinic_id_foreign` is the only constraint in it the numbered migrations do not provide, and that one is already present in the live database from the original manual run.

---

### [MEDIUM] F-17 — Split table collations, confirmed throwing on cross-family comparison

**Endpoint:** n/a — database schema
**Affected Component:** `drizzle/*.sql`, all text columns
**Source Code Location:** `drizzle/0011_receptionist_clinics.sql`, `drizzle/0012_legacy_extras.sql` (inline `COLLATE=utf8mb4_unicode_ci`); column-level overrides on `notifications`, `package_payments`, `push_subscriptions`, `sos_*`

**Description**

The schema contains two incompatible collation families:

```
65 tables  utf8mb4_uca1400_ai_ci     (MariaDB's Unicode 14 enhanced collation)
 7 tables  utf8mb4_unicode_ci        notifications, package_payments,
                                    push_subscriptions, receptionist_clinics,
                                    sos_cases, sos_offers, sos_requests
```

**The root cause is the numbered migrations, not the untracked files.** (An earlier draft attributed this to F-16's four hand-run files; that was wrong and is corrected here.) `grep -ln "unicode_ci" drizzle/*.sql` returns the *applied* migrations `0011_receptionist_clinics.sql` and `0012_legacy_extras.sql` — both of which run on every fresh install. The minority declarations come from those two files declaring `COLLATE=utf8mb4_unicode_ci` explicitly, while the drizzle-kit-generated `0000` inherits the database default.

MariaDB refuses to compare or join text columns across these families.

**Reproduction**

```sql
SELECT COUNT(*) FROM sos_requests r JOIN users u ON r.status = u.status;
```

**Evidence**

```
THROW  sos_requests.status = users.status
       ER_CANT_AGGREGATE_2COLLATIONS Illegal mix of collations
       (utf8mb4_unicode_ci,IMPLICIT) and (utf8mb4_uca1400_ai_ci,IMPLICIT)
       for operation '='
```

Cross-checks that currently pass, confirming the failure mode is specifically string-to-string comparison:

```
OK   sos_requests.patient_id -> users.id        (numeric FK join)
OK   notifications join users on user_id        (numeric)
OK   messages join users on sender_id           (both uca1400_ai_ci)
OK   receptionist_clinics -> users              (numeric)
OK   WHERE status='pending'                     (literal, collation-agnostic)
```

Column-level overrides make it worse than a table-level split — these tables are internally mixed:

```
audit_logs.metadata          utf8mb4_bin
billings.payment_details     utf8mb4_bin
consultations.additional_info utf8mb4_bin
notifications.title/message/type/link   utf8mb4_unicode_ci   (table default: uca1400_ai_ci)
sos_cases.doctor_latitude, patient_symptoms, status …       utf8mb4_unicode_ci
```

**Root Cause**

`0011_receptionist_clinics.sql` and `0012_legacy_extras.sql` declare `COLLATE=utf8mb4_unicode_ci` inline, while the drizzle-kit-generated `0000_fine_the_leader.sql` inherits whatever the server default is (`utf8mb4_uca1400_ai_ci` on this MariaDB build). Two authors, two conventions, and no CI check to catch the divergence. This is an ordinary schema-consistency defect — it does **not** share a root cause with F-16.

**Impact**

Latent today. Every join the application performs is on numeric columns, and literal comparisons are collation-agnostic, so no current code path throws. The exposure is that **any future string-typed join or `WHERE a.text_col = b.text_col` between these families throws `ER_CANT_AGGREGATE_2COLLATIONS` at runtime** — turning a schema inconsistency into a 500 on whichever page first queries across it. The SOS and notification paths are the most likely candidates, since they sit closest to a feature that would naturally grow a string join.

`utf8mb4_bin` columns (`audit_logs.metadata`, `billings.payment_details`, `consultations.additional_info`, `users.notification_preferences`) additionally force case- and accent-sensitive comparison, so a future `WHERE` against them behaves differently from every other text column in the schema.

**Fix**

Normalise the seven minority tables to the database default in a migration:

```sql
ALTER TABLE sos_requests   CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
-- …and sos_offers, sos_cases, notifications, package_payments,
--    push_subscriptions, receptionist_clinics
```

Then add a CI check that asserts a single `TABLE_COLLATION` across `information_schema.TABLES`, and that no column carries a `COLLATION_NAME` differing from its table default — so column-level drift is caught the same way the table-level drift was not.

**Verification**

Re-run the failing comparison; it must return a row count rather than `ER_CANT_AGGREGATE_2COLLATIONS`. Then confirm the `CONVERT TO` did not truncate or alter any existing value (all tables are currently empty or small, so a row-count and checksum comparison before/after is sufficient).

**Regression Risk:** LOW. The tables are near-empty (`notifications` 6 rows, SOS tables 0). `CONVERT TO` rewrites the table, so take a dump first and confirm row counts are unchanged.

---

### [MEDIUM] F-18 — Consumed one-time OTPs persist in plaintext indefinitely

**Endpoint:** `verifySignupOtp`, `sendSignupOtp`
**HTTP Method:** POST (server actions)
**Affected Component:** `registration_otps` table
**Source Code Location:** `app/(auth)/signup/otp-actions.ts:75` (`verifySignupOtp`), `:36` (`sendSignupOtp`)

**Description**

The signup OTP is a 6-digit code used as the sole email-verification gate. `verifySignupOtp` marks it consumed but never destroys the value:

```ts
// otp-actions.ts:75
await db.update(registrationOtps).set({ used: true }).where(eq(registrationOtps.id, row.id));
return true;
```

The row — including the plaintext code — remains in the table with `used = 1` forever.

**Reproduction**

```sql
SELECT id, email, LENGTH(otp) AS otp_len, used, expires_at
  FROM registration_otps;
```

**Evidence**

```
id  email                          otp_len  used  expires_at
 1  e2e.dr.muvanhpl@example.com       6      1  2026-10-05T08:17:04Z
```

`otp_len = 6` on a row with `used = 1` — the consumed code is still present, well past its expiry.

Table characteristics compound this: `registration_otps` has **no foreign key**, and carries the minority `utf8mb4_unicode_ci` collation (F-17).

**Root Cause**

Soft-delete semantics applied to a secret. `used = true` is the right *behavioural* signal but the wrong *storage* decision for a credential — the code has no further use once consumed.

**Impact**

A standing plaintext-credential store. An email address plus its adjacent 6-digit code is sufficient to complete signup verification for that address. Combined with F-09 (`.env` world-readable at mode 0777) or any future database exposure — a backup, a replica, a dump in a build artifact — every account that ever signed up via OTP has a retrievable verification secret. The `expires_at` timestamp provides no protection because the code is never checked against it on read.

**Fix**

Destroy the value on consumption rather than flagging it:

```ts
await db
  .update(registrationOtps)
  .set({ used: true, otp: "" })
  .where(eq(registrationOtps.id, row.id));
```

Additionally, purge consumed and expired rows on a schedule — a small `DELETE FROM registration_otps WHERE used = 1 OR expires_at < NOW() - INTERVAL 1 DAY` invoked from an existing entry point. The `sendSignupOtp` invalidation path at `:36` already does a bulk update of the same shape, so there is no new mechanism required.

**Verification**

Complete a signup, then confirm `SELECT LENGTH(otp) FROM registration_otps` returns `0` for the consumed row. Confirm a second signup for the same email still issues and verifies correctly, since the rate-limit and OTP-lookup paths must not depend on the retained value.

**Regression Risk:** LOW. The verification path matches on `(email, otp, used=false, expires_at > now())`; clearing the code on a row that is already `used = true` cannot affect a future lookup.

---

### [MEDIUM] F-19 — PHI bulk exports are not audited

**Endpoint:** `/api/doctor/patients/export`, `/api/doctor/appointments/export`
**HTTP Method:** GET
**Affected Component:** CSV export endpoints
**Source Code Location:**
- `app/api/doctor/patients/export/route.ts` — no audit call
- `app/api/doctor/appointments/export/route.ts` — no audit call
- Contrast `app/api/doctor/income-expense/export/route.ts` — **does** audit
- Contrast `app/api/doctor/billing/[id]/pdf/route.ts:59` — **does** audit (`audit.pdfDownloaded`)

**Description**

Three of the four bulk-data endpoints write an audit row; the two that expose the most sensitive data do not.

The `patients/export` response includes Name, Email, Phone, Gender, DOB, Address, City, State, Pincode and **Aadhaar**. The `appointments/export` response includes patient name, contact, visit type, date, time, vitals (BP, weight, height) and free-text remarks. Neither records that the export happened, who requested it, or when.

**Runtime confirmation.** This was originally evidenced by source reading only. It was then reproduced over HTTP against the live application, with the audit table checked before and after.

The control endpoint and both finding endpoints were requested in one sequence with a doctor session:

```
200  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     attachment; filename="transactions_20261007.xlsx"
     → /api/doctor/income-expense/export          (control — DOES audit)

200  text/csv   bytes=1186   ~10 rows
     → /api/doctor/patients/export
     header: ID,Registration ID,Name,Email,Phone,Gender,DOB,Address,
             City,State,Pincode,Aadhaar,Status,Registered On

200  text/csv   bytes=375    ~1 row
     → /api/doctor/appointments/export
     header: "Sr No","Patient Name","Contact","Visit Type","Date","Time",
             "Gender","Age","Blood Group","BP","Weight","Height","Status","Remarks","Note"
```

All three returned `200` and full file contents. Then:

```sql
-- highest audit_logs id BEFORE the sequence
139

SELECT id,user_id,action FROM audit_logs WHERE id > 139 ORDER BY id;
-- *** ZERO ROWS ***

SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%export%';
-- 0        (across the entire table, all 139 rows)

SELECT COUNT(*) FROM audit_logs WHERE action = 'pdf_downloaded';
-- 4        ← the audit path demonstrably works for downloads
```

So the export of a CSV containing **Aadhaar numbers, DOB, addresses and phone numbers** produced no audit row whatsoever, while the neighbouring PDF-download route logged its own four downloads. The gap is behavioural, not a missing audit facility.

Note the access control here is role-based only, not permission-based — a patient session gets `401`, but so does a doctor session attempting an endpoint the doctor has no permission for, because nothing checks permissions (F-01). The *only* thing standing between a doctor account and the full patient export is a `role !== 'patient'` test.

**Evidence**

```
$ grep -rn "audit\.\|auditLog(" app/api/doctor/patients/export/route.ts app/api/doctor/appointments/export/route.ts
(no matches)

$ grep -rn "audit\." app/api/doctor/income-expense/export/route.ts
  void audit.transactionCreated(doctorId, { billingId: 0, action: "export" });
```

Confirmed live: `audit_logs` contains 35 rows — `login`, `logout`, `appointment_created`, `patient_created`, `consent_given`, `appointment_cancelled`, `signup` — and **no export of any kind**, despite the income-export endpoint being reachable and its audit call being present.

**Root Cause**

Inconsistent adoption. `audit.pdfDownloaded` and `audit.transactionCreated` were added per-endpoint as each feature shipped; the two CSV exporters were never wired in.

**Impact**

Directly compounds **F-01**. Because the API layer enforces role but not permission, an account with no `registrations` entitlement can export the complete patient roster including Aadhaar numbers — and there is **no record that it ever happened**. That combination means a bulk PII exfiltration is both permitted and invisible: no permission check blocks it and no audit entry records it.

Even setting F-01 aside, absence of audit on a PHI export is an independent compliance gap — bulk extraction of identifiable patient data is precisely the class of event an audit trail exists to capture.

**Fix**

Add audit calls to both endpoints, matching the established pattern:

```ts
void audit.pdfDownloaded(user.id, {
  entity: "patients",
  entityId: 0,
  description: `Patient roster exported (${rows.length} records)`,
});
```

Include the row count and the filter parameters applied — a bare "export happened" is far less useful during incident response than "exported 6 patients, no filters."

**Verification**

Export as a doctor and as a receptionist; confirm a corresponding row appears in `audit_logs` with the correct `user_id` and metadata. Confirm the export response itself is unchanged so the e2e CSV assertions still pass.

**Regression Risk:** LOW. Fire-and-forget writes, matching the existing convention. The only cost is one insert per export.

---

### [LOW] F-20 — Permissive `sql_mode` on the database server

**Endpoint:** n/a — server configuration
**Affected Component:** MariaDB `sql_mode`
**Source Code Location:** Server configuration (no client-side control)

**Description**

```
sql_mode = IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,
           NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
```

Three observations:

- **`IGNORE_SPACE` is present** — reserved words may be split by whitespace (`SEL ECT`, `UN ION SELECT`) to slip past naive keyword-based filters. Drizzle parameterizes every query, so this is **not currently reachable**; it removes a layer of defence-in-depth if a raw-SQL path is ever added.
- **`ONLY_FULL_GROUP_BY` is absent** — any `GROUP BY` selecting non-aggregated columns returns an indeterminate value from an arbitrary row in the group. Results are technically non-deterministic.
- **`NO_ZERO_DATE` is absent** — the `'0000-00-00'` sentinel is permitted, which will not round-trip through strict-mode clients and tends to surface as off-by-one date bugs.

Positively: `STRICT_TRANS_TABLES` is enabled, so invalid values are rejected rather than silently coerced — this is the important one for data integrity and it is correctly set.

`NO_BACKSLASH_ESCAPES` is also absent, which means backslash escaping **is** active — so the LIKE-wildcard escaping in `/api/shule/doctors` (`app/api/shule/doctors/route.ts:56`) behaves as intended. That one is correct by accident rather than by design.

**Reproduction**

```sql
SELECT @@sql_mode;
```

**Evidence**

```
IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,
NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
```

All 72 tables are InnoDB, so transactional atomicity is available and the transaction-based write paths are sound in principle.

**Root Cause**

Server provisioned with MariaDB defaults rather than a hardened profile.

**Impact**

Low today. `IGNORE_SPACE` is not reachable because all queries are parameterized, and no application query relies on non-deterministic `GROUP BY` semantics — `getChatData` uses `count(distinct senderId)` correctly. The risk is entirely latent: a future raw-SQL addition or a non-aggregated `GROUP BY` would inherit these weaknesses silently.

**Fix**

Set a hardened profile:

```sql
SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY,NO_ZERO_DATE,NO_ZERO_IN_DATE';
```

Verify the app against it before making it permanent — `ONLY_FULL_GROUP_BY` in particular can break queries that were relying on the loose behaviour. Persist in the server config file, not just the session.

**Verification**

Restart the app against the hardened mode and run the full e2e suite. Confirm no query regresses.

**Regression Risk:** MEDIUM for `ONLY_FULL_GROUP_BY` specifically — it is a behavioural change, not a security control. Test thoroughly before adopting.

---

### [LOW] F-21 — Three hot filter columns have no index

**Endpoint:** n/a — database schema
**Affected Component:** `appointments`, `users`, `test_bookings`
**Source Code Location:** `lib/db/schema.ts` index definitions

**Description**

`EXPLAIN` on the query shapes the application actually issues shows full table scans where a composite index would serve:

| Query | Type | Key | Extra |
|---|---|---|---|
| `appointments WHERE doctor_id=? AND status=? ORDER BY date DESC, time DESC` | `ALL` | — | `Using where; Using filesort` |
| `appointments WHERE doctor_id=? AND date=?` | `ref` | `appointments_doctor_id_date_index` | — |
| `users WHERE role=?` | `ALL` | — | `Using where` |
| `users WHERE role='patient' AND phone LIKE '%x%'` | `ALL` | — | `Using where` |
| `transactions WHERE user_id=? AND date>=?` | `range` | `idx_tx_user_date` | — |
| `billings WHERE doctor_id=? AND deleted_at IS NULL` | `ref` | `idx_bill_doctor_date` | — |

Unindexed filter columns: `appointments.status`, `users.role`, `users.phone`, `test_bookings.status`.

**Evidence**

Current table sizes make this a non-issue in practice:

```
TABLE_NAME      TABLE_ROWS   SIZE
appointments          11      96 KB
users                 11     112 KB
transactions           6     128 KB
```

A full scan over 11 rows costs nothing.

**Root Cause**

The schema indexes were designed around entity access patterns (`doctor_id`, `date`, foreign keys) rather than around the specific filter combinations the dashboard and search endpoints issue.

**Impact**

None at present scale. This is a growth-projection item: `appointments` is the fastest-growing table in the system, and the doctor dashboard's default view is exactly the `doctor_id + status + ORDER BY date, time` shape that currently scans and filesorts. At a few thousand appointments per practice this becomes the slowest query on the highest-traffic page.

The `users.phone` gap matters sooner than the others — patient autocomplete (`/api/doctor/test-bookings/suggestions`) issues `LIKE '%…%'` on every keystroke, which no B-tree index can serve anyway, so that one needs a prefix index or full-text search rather than a plain index.

**Fix**

Add targeted indexes in a migration:

```sql
CREATE INDEX idx_appt_doctor_status_date ON appointments (doctor_id, status, date, time);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_phone_prefix ON users (phone(6));
```

Match the existing `idx_tx_user_date` naming convention already used on `transactions`.

**Verification**

Re-run the `EXPLAIN` statements; `appointments` by doctor+status should move from `type=ALL` to `type=ref` with the filesort eliminated.

**Regression Risk:** LOW, but the cost is real — every additional index is maintained on every write. Do not add them speculatively; fix this alongside a data-volume decision, and measure before and after rather than assuming.

---

## 3c. Legacy Code and Flow-Conflict Findings

A third pass enumerated all 404 TypeScript/SQL source files (53,191 LOC) and cross-referenced imports, exports, and validation coverage. Findings are grouped by the class of problem they represent rather than by severity alone.

---

### [MEDIUM] F-22 — Three independent clinic-CRUD implementations for one table

**Endpoint:** `createClinic`, `updateClinic`, `deleteClinic` (three separate server actions)
**HTTP Method:** POST (Next.js server actions)
**Affected Component:** `doctor_clinics` table management across all three tiers
**Source Code Location:**
- `app/super-admin/actions.ts:622` `updateClinic`, `:680` `deleteClinic`, `:573` `storeClinic`
- `app/doctor/schedule/actions.ts:82` `createClinic`, `:146` `updateClinic`, `:215` `deleteClinic`
- `app/admin/clinics/actions.ts:77` `createClinic`, `:172` `updateClinic`

**Description**

The same three operations are implemented three times, once per dashboard tier, each with its own validation copy:

| Tier | Guard | Ownership check |
|---|---|---|
| super-admin | `requireAdmin()` | none — platform-wide by design |
| doctor | `requireDoctorPermission("schedule-edit")` | `eq(doctorClinics.doctorId, doctorId)` ✓ |
| admin | `requireAdminPermission("clinics", { ownerOnly: true })` | `scope.clinicIds.includes(clinicId)` ✓ |

**The ownership enforcement is correct in all three** — I read each. The problem is that the *validation* is duplicated three times: `ADDRESS_TYPES` membership, the manual-vs-map address requirement, the `consultation_fee >= 0` check, and the 255-character name cap are re-implemented verbatim in each module.

**Reproduction**

Not a runtime defect — a divergence hazard. Read `validateClinicForm` at `app/super-admin/actions.ts`, then the inline block at `app/doctor/schedule/actions.ts:157-168`, then `parseClinicForm` at `app/admin/clinics/actions.ts`. Three implementations, one contract.

**Evidence**

```
$ grep -rn "^export async function \(createClinic\|updateClinic\|deleteClinic\)" app
app/super-admin/actions.ts:622:export async function updateClinic(
app/doctor/schedule/actions.ts:82:export async function createClinic(
app/doctor/schedule/actions.ts:146:export async function updateClinic(
app/doctor/schedule/actions.ts:215:export async function deleteClinic(clinicId: number): Promise<ScheduleActionResult> {
app/admin/clinics/actions.ts:77:export async function createClinic(
app/admin/clinics/actions.ts:172:export async function updateClinic(
```

**Root Cause**

The tiers were built sequentially and each implemented the shared operation against the guard appropriate to its tier, without factoring the common validation into a shared module. The guard *does* differ legitimately by tier; the validation does not.

**Impact**

No current vulnerability. The concrete risk is a fix landing in one implementation and not the others — a validation or ownership bug would be fixed for one tier and left exploitable for another. Given F-05 was found precisely because the staff actions diverged from the role actions, this pattern has already produced one real finding.

**Fix**

Extract the validation into one module (e.g. `lib/validation/clinic.ts` exporting `parseClinicForm(formData)` and `CLINIC_ADDRESS_TYPES`) and have all three tiers call it. Keep the tier-specific guard and ownership check in each tier — that divergence is intentional. Optionally extract a shared `assertClinicOwnership(clinicId, tier)` so the three ownership predicates are also visible side by side.

**Verification**

Confirm all three `updateClinic` implementations still reject: empty name, non-`ADDRESS_TYPES` value, `manual` without address, `map` without lat/long, missing phone, negative fee, and fee > 2^31. `e2e/schedule.spec.ts` covers the doctor tier; add admin-tier cases.

**Regression Risk:** LOW. Pure refactor behind identical behaviour. The one behavioural difference to preserve deliberately: super-admin's version has no ownership check, and that must stay.

---

### [MEDIUM] F-23 — Fifteen action files accept input with no schema validation

**Endpoint:** 58 exported server actions across 15 files
**HTTP Method:** POST (Next.js server actions)
**Affected Component:** Write surface of the doctor and admin tiers
**Source Code Location:**

| File | Exported actions | zod calls |
|---|---|---|
| `app/doctor/test-bookings/actions.ts` | 11 | 0 |
| `app/doctor/income-expense/actions.ts` | 9 | 0 |
| `app/doctor/schedule/actions.ts` | 9 | 0 |
| `app/doctor/chat/actions.ts` | 7 | 0 |
| `app/admin/staff/actions.ts` | 7 | 0 |
| `app/doctor/roles/actions.ts` | 6 | 0 |
| `app/admin/managers/actions.ts` | 5 | 0 |
| `app/admin/clinics/actions.ts` | 4 | 0 |
| `app/doctor/notifications/actions.ts` | 4 | 0 |
| `app/doctor/profile/actions.ts` | 3 | 0 |
| `app/doctor/settings/actions.ts` | 2 | 0 |
| `app/doctor/consult-pdf/actions.ts` | 1 | 0 |
| `app/super-admin/support/actions.ts` | 1 | 0 |
| `app/super-admin/businesses/actions.ts` | 2 | 0 |
| `app/vendor/upload-test/[token]/actions.ts` | 1 | 0 |

**Description**

`lib/validation/index.ts` establishes a clear convention — every other action file validates with `safeParse` and returns `parsed.error.issues[0].message`. Fifteen files do not follow it, and validate by hand or not at all. `test-bookings/actions.ts` is the largest surface at **11 exported actions with zero schema validation**, covering test booking creation, patient resolution, vendor management, and token regeneration.

Hand-rolled validation is not inherently wrong, and much of it is sound — I checked several. The issue is inconsistency at scale: within the same tier, `patients/actions.ts` uses `patientSchema` while `schedule/actions.ts` reimplements the same field checks inline, and the two can drift.

**Reproduction**

Structural, not runtime. Compare `app/doctor/patients/actions.ts:14` (imports and uses `patientSchema`) against `app/doctor/schedule/actions.ts:157-168` (inline equivalent).

**Evidence**

```
$ for f in $(grep -rl '^"use server"' app); do
    printf "%-52s %2s actions  %s zod\n" "$f" \
      "$(grep -cE '^export async function' $f)" \
      "$(grep -cE 'safeParse\(|\.parse\(' $f)"
  done

/doctor/test-bookings/actions.ts       11 actions  0 zod
/doctor/income-expense/actions.ts       9 actions  0 zod
/doctor/schedule/actions.ts              9 actions  0 zod
/doctor/chat/actions.ts                  7 actions  0 zod
/admin/staff/actions.ts                  7 actions  0 zod
/doctor/roles/actions.ts                 6 actions  0 zod
/admin/managers/actions.ts               5 actions  0 zod
… (15 files total, 0 zod calls in each)
```

By contrast, the files that *do* validate: `patients` (3 actions, 2 zod), `appointments` (5/2), `billing` (7/1), `login` (1/1), `signup` (1/1), `contact` (1/1), `my-consent` (1/1), `follow-ups` (3/1).

**Root Cause**

The validation module grew alongside features rather than being made mandatory. Half the codebase predates it or was written by a different hand.

**Impact**

Not itself an exploitable hole — the hand-rolled checks are mostly correct, and the DB columns are typed. The risk is the same class as F-22: an inconsistency between two implementations of the same rule, where one gets fixed and the other doesn't. F-22 is a concrete instance of exactly this, which is why it's rated MEDIUM rather than LOW.

**Fix**

Incremental, not a big-bang rewrite — the existing `lib/validation/index.ts` style is the target:

1. Prioritise by exposure: `test-bookings` (11 actions), `admin/staff` (7), `admin/managers` (5).
2. Add schemas to `lib/validation/index.ts` following the established patterns.
3. Convert the hand-rolled checks in `schedule/actions.ts` and `income-expense/actions.ts` to shared schemas, which also resolves part of F-22.
4. Leave the trivial ones (`settings`, `notifications`) inline — a schema for a two-checkbox form is not an improvement.

**Verification**

For each converted action, confirm the existing e2e specs still pass and that a deliberately malformed input now returns a friendly message rather than a database error.

**Regression Risk:** LOW-MEDIUM. Converting validation can tighten behaviour that previously accepted out-of-spec input — most likely a length cap that was previously unenforced and now rejects. Run `e2e/test-bookings`, `e2e/staff-flow`, and `e2e/schedule`.

---

### [MEDIUM] F-24 — Database and dev server listen on all network interfaces

**Endpoint:** MariaDB `3306`, Next.js `3100`
**Affected Component:** Deployment / network configuration
**Source Code Location:** Server configuration (no application-level control)

**Description**

Both services bind to every interface rather than loopback:

```
$ ss -tlnp | grep -E "3306|3100"
LISTEN 0 80   0.0.0.0:3306    0.0.0.0:*   users:(("mariadbd",pid=33123))
LISTEN 0 80      [::]:3306       [::]:*   users:(("mariadbd",pid=33123))
LISTEN 0 511         *:3100            *:*   users:(("next-server",pid=42928))
```

The MariaDB instance authenticates as `root@localhost` with `GRANT ALL PRIVILEGES ON *.* … WITH GRANT OPTION`.

**Reproduction**

From any host on the same subnet, `mysql -h <this-host> -P 3306` reaches the listener. This machine's address is `192.168.1.17` (from the Next.js dev banner), i.e. a shared home/office LAN.

**Evidence**

```
$ ss -tlnp | grep 3306
LISTEN 0 80 0.0.0.0:3306 0.0.0.0:*  users:(("mariadbd",pid=33123,fd=117))
LISTEN 0 80    [::]:3306    [::]:*  users:(("mariadbd",pid=33123,fd=118))

$ SELECT CURRENT_USER(), USER();  →  root@localhost | root@localhost
$ SHOW GRANTS FOR CURRENT_USER();
  GRANT ALL PRIVILEGES ON *.* TO `root`@`localhost` WITH GRANT OPTION
```

**Root Cause**

Services started with default bind-address configuration on a workstation rather than a hardened container or a bind of `127.0.0.1`.

**Impact**

This is the only finding that changes the threat model. Every other item in this report assumes a remote attacker who must go through the application's authorization layer — which, despite F-01, is present and functioning for role checks. F-24 removes that assumption: anyone on the same network segment can attempt direct database access to a database holding patient names, contact details, Aadhaar numbers, consultation records, and the full audit log.

The `root@localhost` grant limits direct exploitation — a remote connection authenticates as `root@<remote-host>`, which does not match this grant — so this is **not** a confirmed unauthenticated read. It *is* a confirmed network exposure of a PHI-bearing service with a privileged account, and any other MySQL account on the instance, or a future grant to `'%'`, becomes immediately exploitable. The Next.js dev server on `*:3100` compounds it: the application itself, with its debug surface, is reachable from the LAN.

Rated MEDIUM rather than HIGH because no remote authentication bypass was confirmed — but it should be treated as the top *environment* item.

**Fix**

```
# bind to loopback only
bind-address = 127.0.0.1
# in my.cnf / mysqld.cnf, then restart MariaDB

# Next.js dev server
npm run dev -- --hostname 127.0.0.1
```

Additionally: create a least-privilege application user instead of connecting as `root`, and add a firewall rule if loopback binding is not possible. For production, the database should not be reachable from the application host's network at all — a private socket or a container-internal network.

**Verification**

```
$ ss -tlnp | grep -E "3306|3100"
# should show 127.0.0.1:3306 and 127.0.0.1:3100 only

$ mysql -h <lan-ip-of-this-host> -P 3306 -u root
# should fail to connect
```

Then confirm the app still starts and connects (`npm run dev` + a login).

**Regression Risk:** LOW. Binding to loopback only affects remote access, which nothing in the development workflow should depend on. If a colleague or container needs database access, that needs an explicit tunnel rather than a wide bind.

---

### [LOW] F-25 — Upload size caps hardcoded in nine places, bypassing `lib/config`

**Endpoint:** All upload paths
**Affected Component:** File upload validation
**Source Code Location:**
- `lib/config.ts:29-32` — `MAX_UPLOAD_BYTES`, `MAX_CONSENT_FILE_BYTES` (the intended source of truth)
- `app/super-admin/actions.ts:100,136,836`, `app/doctor/income-expense/actions.ts:51`, `app/doctor/profile/actions.ts:45,90`, `app/doctor/patients/actions.ts:32`, `app/doctor/schedule/actions.ts:59`, `app/vendor/upload-test/[token]/actions.ts:75`

**Description**

`lib/config.ts` exists specifically to centralise these tunables, and its own comment says *"Nothing else in the codebase should hardcode these values."* Nine sites hardcode byte counts anyway:

```
app/super-admin/actions.ts:100   maxBytes = 2 * 1024 * 1024
app/super-admin/actions.ts:136   200 * 1024 * 1024
app/super-admin/actions.ts:836   5 * 1024 * 1024
app/doctor/income-expense/actions.ts:51  3 * 1024 * 1024
app/doctor/profile/actions.ts:45,90      2 * 1024 * 1024
app/doctor/patients/actions.ts:32        2 * 1024 * 1024
app/doctor/schedule/actions.ts:59        2 * 1024 * 1024
app/vendor/upload-test/[token]/actions.ts:75  5 * 1024 * 1024
```

Only one site — `app/doctor/consult-pdf/actions.ts:36` — actually uses `MAX_UPLOAD_BYTES`.

**The sharper bug:** `lib/files/consent-upload.ts:33` uses the *config value* but hardcodes the *message*:

```ts
if (file.size > MAX_CONSENT_FILE_BYTES) throw new Error("File must be under 5 MB.");
```

Setting `MAX_CONSENT_FILE_SIZE=10485760` in the environment raises the limit to 10 MB while the rejection message still says "under 5 MB". Every other site has the same defect in a different form — the literal appears in both the comparison and the string.

**Evidence**

```
$ grep -rn "MAX_UPLOAD_BYTES\|MAX_CONSENT_FILE_BYTES" app lib | grep -v config.ts
app/doctor/consult-pdf/actions.ts:13:import { MAX_UPLOAD_BYTES } from "@/lib/config";
app/doctor/consult-pdf/actions.ts:36:  if (file.size > MAX_UPLOAD_BYTES) return { error: `File must be under ${Math.floor(...)} MB.` };
lib/files/consent-upload.ts:6:import { MAX_CONSENT_FILE_BYTES } from "@/lib/config";
lib/files/consent-upload.ts:33:  if (file.size > MAX_CONSENT_FILE_BYTES) throw new Error("File must be under 5 MB.");
                                                          ^^^^^^^ derived, not literal

.env:52:# MAX_CONSENT_FILE_SIZE=5242880   (commented out)
```

Note `consult-pdf` is the one site that does it correctly — it interpolates the value into the message.

**Root Cause**

Centralisation was introduced after these sites were written, and only one was migrated.

**Impact**

Low functionally — the caps work and the framework-level `bodySizeLimit: "200mb"` is the real outer bound. The operational risk is that an operator tunes `MAX_UPLOAD_SIZE` in the environment, observes no effect on eight of nine paths, and wrongly concludes the setting works. The misleading error message is a minor but real correctness bug.

**Fix**

Migrate the nine sites to named constants in `lib/config.ts` (`MAX_IMAGE_BYTES`, `MAX_ATTACHMENT_BYTES`, `MAX_VIDEO_BYTES`, `MAX_REPORT_BYTES`) and **derive the message from the value** as `consult-pdf` already does. Then the environment actually controls behaviour and the message is always truthful.

**Verification**

Set each constant to a small value, confirm the corresponding upload is rejected at the new limit, and confirm the message reports the new number rather than a stale literal.

**Regression Risk:** LOW. Behaviour is unchanged at default values.

---

### [LOW] F-26 — Six zod schemas defined but never imported

**Endpoint:** n/a — unused code
**Affected Component:** `lib/validation/index.ts`
**Source Code Location:** `lib/validation/index.ts`

**Description**

Six exported schemas have zero references outside their own definition:

```
UNUSED: transactionSchema
UNUSED: followUpSchema
UNUSED: patientFilterSchema
UNUSED: profileSchema
UNUSED: chatMessageSchema
UNUSED: paginationSchema
```

`paginationSchema` in particular describes something the codebase does not currently do — there is no shared pagination contract, and `lib/queries/doctor.ts:53` hand-rolls `pageBounds` instead.

**Evidence**

```
$ for s in $(grep -oE "^export const [a-zA-Z]+Schema" lib/validation/index.ts | sed 's/export const //'); do
    n=$(grep -rn "$s" app lib | grep -v "^lib/validation/index.ts" | wc -l)
    [ "$n" -eq 0 ] && echo "  UNUSED: $s"
  done
```

**Root Cause**

Schemas were written speculatively, or the call sites were refactored to hand-rolled checks and the schemas were left behind.

**Impact**

None directly. The cost is that `lib/validation/index.ts` presents 15 schemas as the project's validation surface when only 9 are wired up — which is precisely the misreading that produced F-23. `chatMessageSchema` validates `receiverId` + `message`, but `sendChatMessage` (`app/doctor/chat/actions.ts:57`) takes only `content` and checks `length > 5000` inline, so the schema is not just unused — it describes a *different* action signature and would be wrong if adopted.

**Fix**

Delete the six, or wire them up as part of F-23. `paginationSchema` should either be adopted by `pageBounds` or removed — keeping an aspirational schema is worse than none. If kept, add a comment marking each as aspirational so the next reader does not assume coverage.

**Verification**

After removal, `npx tsc --noEmit` must stay clean and `npm run build` must succeed.

**Regression Risk:** VERY LOW. Nothing imports them.

---

### [LOW] F-27 — `lib/whatsapp.ts` is dead code with a dead config dependency

**Endpoint:** n/a — unused module
**Affected Component:** `lib/whatsapp.ts`, `lib/config.ts`
**Source Code Location:** `lib/whatsapp.ts` (whole file), `lib/config.ts` `WHATSAPP_API_URL`

**Description**

`lib/whatsapp.ts` exports a WhatsApp gateway client pointed at a legacy third-party provider. **Nothing imports it.** The only other WhatsApp references in the codebase are database columns (`company_whatsapp1`, `company_whatsapp2`), a settings UI label, and a UI dropdown option reading `"Send OTP (WhatsApp)"` — none of which call the module.

It is also the file with the most legacy markers in the codebase:

```
$ grep -rniE "legacy|TODO|FIXME|deprecated" app lib components scripts | cut -d: -f1 | sort | uniq -c | sort -rn | head -3
     10 app/super-admin/actions.ts
     10 app/doctor/appointments/actions.ts
      5 lib/whatsapp.ts        ← entirely dead
```

`lib/config.ts` exports `WHATSAPP_API_URL` solely for this module, pointing at `https://whatsapp.rajatmarketingss.online/api/create-message` — a hardcoded third-party endpoint that ships in the codebase.

**Evidence**

```
$ grep -rn "whatsapp" app lib -i | grep -v "^lib/whatsapp.ts"
app/super-admin/settings/company-settings-form.tsx:22:  companyWhatsapp1: string | null;
app/super-admin/settings/company-settings-form.tsx:88:  <label htmlFor="cs_wa1">WhatsApp 1</label>
app/super-admin/actions.ts:1703:    companyWhatsapp1: text("company_whatsapp1") || null,
app/doctor/appointments/book/book-form.tsx:15:  { value: "otp", label: "Send OTP (WhatsApp)" },
```

No import of the module anywhere. The dropdown option is a *label*; there is no SMS/WhatsApp gateway call behind it.

**Root Cause**

Feature removed or replaced, module left in place. The hardcoded third-party URL is a leftover from the Laravel-era implementation this codebase was migrated from.

**Impact**

Low. Dead code carries a real but small cost: it inflates the security review surface (an unused outbound-integration client is worth auditing on every future pass), and it hardcodes an external endpoint that a future developer could plausibly wire up without noticing it is unmaintained.

**Fix**

Delete `lib/whatsapp.ts` and the `WHATSAPP_API_URL` export from `lib/config.ts`. Separately, decide what the `"Send OTP (WhatsApp)"` option in `book-form.tsx:15` is meant to do — if it is meant to send, it currently does nothing, which is a small functional gap worth confirming with the product owner.

**Verification**

`npx tsc --noEmit` clean; `npm run build` succeeds; grep confirms no remaining references.

**Regression Risk:** VERY LOW. Nothing imports it. The only question is the dropdown option's intent, which is a product question rather than a code change.

---

### [INFO] F-28 — Orphan export and debug artifacts shipped in the repository

**Endpoint:** n/a — repository hygiene
**Affected Component:** `app/doctor/schedule/actions.ts`, `public/probes/`
**Source Code Location:** `app/doctor/schedule/actions.ts` `updateSchedule`; `public/probes/probe1-push-sync.html`, `probe2-visibility-wakelock.html`, `probe3-capacitor.md`

**Description**

Two small hygiene items.

**An orphaned server action.** `updateSchedule` is exported from `app/doctor/schedule/actions.ts` but referenced nowhere else in `app`, `components`, or `lib`. Every other action in that file has a UI caller (`createClinic` → `add-clinic-form.tsx`, `updateClinic` → `clinic-edit-form.tsx`, `deleteClinic` → `clinic-card-actions.tsx`). An unreachable server action is still a live HTTP endpoint, so this one should be either wired to a caller or removed.

**Debug artifacts under `public/`.** Three files ship in the web root:

```
public/probes/probe1-push-sync.html      5,807 bytes
public/probes/probe2-visibility-wakelock.html  8,306 bytes
public/probes/probe3-capacitor.md        8,798 bytes
```

These are development scratch files — Web Push sync and Wake Lock capability probes, and a Capacitor notes document. Being under `public/`, they are served to anyone who requests `/probes/*`.

**Evidence**

```
$ grep -rn "\bupdateSchedule\b" app components lib | grep -v "app/doctor/schedule/actions.ts"
(no matches)

$ ls -la public/probes/
-rw-rw-r-- probe1-push-sync.html
-rw-rw-r-- probe2-visibility-wakelock.html
-rw-rw-r-- probe3-capacitor.md
```

I checked both contents — no credentials, no PHI, no internal hostnames. They are inert capability probes.

**Root Cause**

Scratch files created during PWA investigation and never cleaned up. Note they are mode `0666`, consistent with the permissive-umask pattern behind F-09.

**Impact**

Minimal. `probe3-capacitor.md` documents intended mobile-wrapper work, which is mildly informative to an attacker mapping the roadmap. The HTML probes reveal which PWA APIs the developer was evaluating. No secret material.

**Fix**

Move `public/probes/` out of the web root — a `docs/probes/` directory, or delete if the investigation is finished. Resolve `updateSchedule`: wire it to a caller or remove it. Note that `public/` is the one directory that *should* be world-readable, so this is about content, not permissions.

**Verification**

`GET /probes/probe1-push-sync.html` returns `404` after removal. `npx tsc --noEmit` clean after deleting the export.

**Regression Risk:** VERY LOW, provided nothing in the e2e suite references `/probes/`.

---

### 3d. Legacy and duplication sweep — what was checked and found clean

Recorded so the sweep is not repeated. All 404 files were enumerated (53,191 LOC across `app` 35,166 / `lib` 9,248 / `components` 4,984 / `e2e` 2,855 / `scripts` 938).

| Check | Result |
|---|---|
| **Dead `lib` modules** | 1 of 51 — only `lib/whatsapp.ts` (F-27). `lib/validation`, `lib/db` are heavily used via alias paths and were initially false positives |
| **Duplicate exported action names** | Only `createClinic`/`updateClinic`/`deleteClinic` collide, across the three tiers by design (F-22). No accidental shadowing |
| **Orphan exports** | 1 — `updateSchedule` (F-28) |
| **Schema vs database drift** | `migration_log` exists in the DB but is absent from `lib/db/schema.ts`. All 71 declared tables exist; no declared-but-missing table. Column-level spot check across 6 tables (`staff_attendances`, `sos_requests`, `notifications`, `registration_otps`, `consultations`, `billings`) found no drift |
| **Unbounded text fields** | `staff_attendances.notes` is `text`, so the unvalidated `notes` in the attendance `JSON.parse` loop has no truncation risk |
| **Attendance payload validation** | The `JSON.parse` loop at `app/doctor/staff/actions.ts:201` validates every row: `staff_id` must be an integer, `status` against `ATTENDANCE_STATUSES`, `check_in`/`check_out` against `TIME_RE`, and **re-verifies staff ownership per row** before writing. Sound despite being hand-rolled |
| **Service worker PHI exposure** | `public/sw.js` precaches only `["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"]` and uses network-first for everything else. No dashboard or API response is cached |
| **Push notification PHI** | SOS push bodies use `maskPatient()` (`lib/dispatch/geo.ts:17`) — initial-surname-initial. Correctly masked |
| **Git-ignored artifacts** | `.local/`, `test-results/`, `.next/` correctly excluded; nothing sensitive is tracked |
| **Legacy markers** | 88 occurrences, all documentation comments explaining migration decisions. Zero `TODO`/`FIXME`/`HACK`/`@deprecated` in code |
| **Client/server guard duplication** | `components/doctor/permission-gate.tsx` mirrors the server guard deliberately, documented as such, and correctly returns `null` (no render output) while the server remains authoritative |

---

## 4. Business Logic Review

| Area | Assessment |
|---|---|
| **Appointment double-booking** | **Sound.** `createPatientAppointment` (`app/patient/appointments/actions.ts`) takes a `SELECT … FOR UPDATE` row lock on the doctor inside a transaction, then re-checks conflicts. Race closed properly. |
| **Credit collection** | **Sound.** `collectCreditPayment` (`app/doctor/billing/actions.ts`) uses a conditional `UPDATE … WHERE status = 'pending'` and checks `affectedRows !== 1`, so concurrent requests cannot double-recognize income. |
| **Consent double-submission** | **Sound.** `respondConsent` uses a conditional update gated on `is_accepted = false AND is_rejected = false` inside a transaction, with the appointment status sync in the same transaction. |
| **Package fulfillment** | **Sound.** `fulfillPackagePayment` claims `created → paid` atomically and reads back the winner's `accessUntil` on contention. Webhook and browser-callback race safely. |
| **Vendor report upload** | **Sound.** Conditional update requiring `uploadedFile_path IS NULL AND status IN (pending, in-progress)`. Second concurrent upload gets a clean error. |
| **Bill amount integrity** | **Sound.** `updateBill` rejects `received > total` and derives `pendingAmount = max(0, total − received)` — the negative-pending class of bug is closed. |
| **Bill ↔ income coupling** | **Sound.** Bill creation and its linked income transaction are written in one transaction; update rewrites both together. |
| **Trial gating** | **BROKEN — F-03.** The only business-logic control that fails open. |
| **Permission model** | **BROKEN — F-01.** The intended authorization boundary is not enforced where it matters. |
| **Staff management** | **BROKEN — F-06.** Inoperable for UI-provisioned-vs-seeded data. |
| **Global chat room** | **Design concern, not a vulnerability.** `getChatData` and `sendChatMessage` select `chatRooms.name = "Doctors Group"` with **no tenant scoping**. Every practice on the platform shares one message stream. If cross-practice visibility is not intentional, this is a tenant-isolation failure and should be scoped per practice. Worth confirming intent with the product owner before changing — the seeded data has a single room and no cross-tenant messages, so it was not testable. |
| **`receptionist_clinics` table** | **Dead.** Populated by `app/admin/staff/actions.ts:249` and read only by the same module's display query. No authorization path consults it — receptionist scoping derives from `doctor_id`/`reference_role_id` instead. Either wire it into scoping or remove it to avoid implying protection that does not exist. |
| **Price manipulation** | **Not exploitable.** `createBill` accepts a client-supplied `amount` rather than deriving it from `billingTypes`. A staff member with `billing-create` could bill an arbitrary figure. This is consistent with a practice-management product where billing amounts are frequently negotiated, so it is a design question rather than a flaw — flagging for the product owner. |
| **Razorpay amount integrity** | **Sound.** `POST /api/packages/order` derives the amount from `getPackagePricing(packageId, period)` server-side and never accepts a client amount. |

### 4.1 Database Integrity

Twenty business-rule invariants were asserted against the live data. **Eighteen pass.** The two that failed were traced to the seed script, not application code — recorded here so they are not re-investigated as bugs.

| Invariant | Result |
|---|---|
| `billings.received_amount > total_amount` (overpay) | ok |
| `billings.pending_amount < 0` | ok |
| `pending + received ≠ total` | ok |
| `status = 'paid'` but `pending > 0` | ok |
| `transactions.amount <= 0` | ok |
| `transactions.type NOT IN (1,2)` | ok |
| consent both `is_accepted` and `is_rejected` | ok |
| consent neither accepted nor rejected | **flagged — seed artifact** |
| consent accepted but no `consent_file` | ok |
| consent rejected but has `consent_file` | ok |
| duplicate consent `slug` | ok |
| `consultations.patient_id` not role `patient` | ok |
| `appointments.doctor_id` not role `doctor` | ok |
| `appointments.patient_id` not role `patient` | ok |
| `billing_type_id` not owned by the bill's doctor | ok |
| `transactions.billing_id` set but bill missing | ok |
| bill `paid` with no linked income transaction | **flagged — seed artifact** |
| doctor with patients but no clinic | ok |
| receptionist with a link in neither column | ok |
| `sessions.last_activity` in the future | ok |

**The two flagged items are seed artifacts, not application defects.**

*Bill paid without income transaction* — bill `INV-410396` is `status: 'paid'` with no row in `transactions`. `scripts/seed.ts:655` inserts the bill and `:677` inserts the transactions as two independent statements with `billing_id: null`, so the seed never links them. The application path (`createBill`, `app/doctor/billing/actions.ts:97`) writes bill and income inside a single transaction with the link populated. The seed simply does not exercise that path.

*Undecided consent* — consent `id=1` has neither accepted nor rejected, linked to appointment 10 which is `cancelled`. This is the correct terminal state for a cancelled appointment: the appointment was cancelled before the patient responded, so the consent record is left undecided. Not a defect.

**Foreign-key orphan scan** — twelve relationships checked, zero orphans, including the four tables that have **no FK at all** and rely entirely on application logic:

| Relationship | FK present | Orphans |
|---|---|---|
| `appointments.doctor_id` / `.patient_id` → `users` | yes | 0 |
| `billings.doctor_id` / `.patient_id` → `users` | yes | 0 |
| `consultations.patient_id` → `users` | yes | 0 |
| `transactions.user_id` → `users` | yes | 0 |
| `doctor_clinics.doctor_id` → `users` | yes | 0 |
| `clinic_managers.user_id` → `users` | yes | 0 |
| `sessions.user_id` → `users` | **no** | 0 |
| `audit_logs.user_id` → `users` | **no** | 0 |
| `model_has_roles.model_id` → `users` | **no** | 0 |
| `model_has_permissions.model_id` → `users` | **no** | 0 |

The four FK-less tables are clean today because `deleteStaff` and `updateUser` explicitly call `revokeAllSessionsForUser` before deleting. That is correct compensating logic, but it means those four relationships are one forgotten code path away from orphans — worth a periodic consistency check.

**Schema-level facts** — 72 tables, all InnoDB, so transaction atomicity is genuinely available. Charset `utf8mb4` throughout. 85 foreign keys and 28 unique constraints present. `@@system_time_zone = 'IST'`, and `todayStr()` (`lib/utils.ts:56`) deliberately uses local getters rather than `toISOString()` — the comment at `:34` documents exactly why, so the IST/UTC date skew that would otherwise misdate bookings, KPI counts and bill dates is already handled correctly.

---

## 5. Verified Clean

These were actively tested and found sound. Recorded so they are not re-audited.

1. **Path traversal** — blocked across 4 encodings on both public and authenticated file routes.
2. **SQL injection** — all queries parameterized via Drizzle. Payloads (`'`, `%`, 500-char strings) returned `200` with no error. The one raw-SQL route (`/api/shule/doctors`) properly parameterizes and escapes LIKE wildcards.
3. **Cross-tenant `doctor_id` probing** — `/api/doctor/appointments/booked-times?doctor_id=12` returns `403` for doctor, receptionist, and manager.
4. **Super-admin surface** — correctly returns `403` for doctor, receptionist, and business-owner sessions across `/api/super-admin/support/export`, `/api/super-admin/masters/*/export`, and `/api/super-admin/file/*`.
5. **Session revocation** — wired into password change, role change, status change, and staff delete.
6. **Deactivated-account enforcement** — checked both at login and on every request.
7. **Login account enumeration** — identical `"Invalid email or password."` for no-account, bad-password, and (separately, by design) deactivated. Failure reasons are recorded only in the audit log.
8. **Signup role whitelist** — `["patient","doctor"]` enforced server-side; cannot self-assign a privileged role.
9. **OTP handling** — 6-digit `crypto.randomInt`, 10-minute TTL, single-use, previous OTPs invalidated per email, rate-limited to 10 guesses per window.
10. **Spreadsheet formula injection** — `sanitizeSpreadsheetCell` applied in all four exporters (patients CSV, appointments CSV, transactions XLSX, masters XLSX).
11. **File upload validation** — magic-byte sniffing on every upload path (consent files, vendor reports, profile photos, signatures, clinic logos, images, videos), UUID filenames, size caps enforced.
12. **Response headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` with geolocation scoped to self, `X-DNS-Prefetch-Control: off` all present. `X-Powered-By` correctly suppressed. HSTS correctly dev-gated.

### 5.1 Build, typecheck and runtime

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **clean** — no type errors |
| `npm run build` | **clean** — compiled in 490ms, 81 static pages generated, no warnings or errors |
| `npm run lint` | 1 error, 17 warnings. The single error is cosmetic: `react/no-unescaped-entities` at `app/patient/emergency/sos-dispatch.tsx:137` |
| Dev-server runtime log | **zero** errors, warnings, or unhandled rejections across a 76-route sweep |
| Route sweep | **76 routes × 6 roles — zero 500s, zero unexpected 404s.** Every 307 observed is a correct permission redirect |

Route coverage swept: all 5 public/marketing pages, 22 doctor routes, 5 receptionist routes, 8 patient routes, 19 owner routes, 5 manager routes, 13 super-admin routes, plus `/trial-expired`. This exercises the full permission matrix — a doctor is correctly bounced from `/doctor/patients`, `/doctor/billing`, `/doctor/income-expense`, `/doctor/test-bookings`, `/doctor/home-visits`, `/doctor/chat`, `/doctor/shop`, `/doctor/staff` and `/doctor/roles` (no such modules granted), while `/doctor/appointments`, `/doctor/schedule`, `/doctor/support` and the consultation pages load normally. Receptionists are correctly bounced from `/receptionist/emergency` and `/receptionist/consultations`, confirming the layout-level doctor-only guard at `app/doctor/layout.tsx:56` works for page navigation. Managers are correctly bounced from the three owner-only modules `/admin/clinics`, `/admin/managers`, `/admin/settings`.

### 5.2 Database integrity

See §4.1 — 18 of 20 business-rule invariants pass, the two failures are traced to `scripts/seed.ts` rather than application code, zero FK orphans across 12 relationships, all 72 tables InnoDB.

### 5.3 Regression baseline — Playwright suite executed

The suite was run against the unmodified application to establish the regression baseline that earlier phases of this audit lacked.

```
$ npx playwright test
  75 passed (8.7m)
```

**75/75 passing, 0 failed, 0 skipped**, across 27 spec files. Notable coverage that directly bears on findings in this report:

| Spec | What it proves | Bearing on |
|---|---|---|
| `auth-matrix.spec.ts` (26 tests) | patient blocked from `/admin`, business-owner gets 403 on every super-admin API, manager admitted to `/admin` but bounced from owner-only modules | Confirms the **role** layer is sound — which is exactly why F-01 (the missing *permission* layer) is easy to miss |
| `forms.spec.ts` | rapid double-click submit creates exactly one row; duplicate booking blocked | Partially covers §11.1 concurrency |
| `upload-audit.spec.ts` (4 tests) | vendor report lifecycle, magic-byte rejection, consent double-submit blocked, attachment replace/delete | F-11 partially exercised |
| `test-bookings.spec.ts` | vendor link upload round-trip | F-11 partially exercised |
| `super-admin.spec.ts` (5 tests) | user CRUD + status toggle, master data, clinic CRUD, permission sync, blog CRUD | F-22's super-admin clinic path |
| `schedule.spec.ts` | add/delete clinic with schedule | F-22's doctor path |

One benign line appeared in the output: `AUDIT resubmit POST status (non-action probe): 500` — that is the spec deliberately POSTing to a server-action endpoint without a valid action ID, which is expected to 500 and is not a defect.

### 5.4 Legacy code sweep

All 404 source files enumerated and cross-referenced. See §3d for the full matrix. The short version: exactly one dead module (`lib/whatsapp.ts`, F-27), one orphan export (`updateSchedule`, F-28), no schema drift beyond the undeclared `migration_log` table, no unbounded text fields, no PHI in the service worker cache, and push notification bodies correctly masked via `maskPatient()`. The 88 legacy markers are all explanatory comments — zero `TODO`/`FIXME`/`HACK` in code.

**What this section does *not* establish.** The concurrency invariants in §4 are marked *Sound* on the basis of reading the conditional-claim logic — they were **not** verified by racing concurrent requests. That remains the largest open gap (§11.1).

The fresh-install reproduction and the Playwright suite have since been carried out; see §5.3, §11.2 and §11.3.

---

## 6. Coverage Gaps

- **G-01 — No self-service password reset.** `password_reset_tokens` exists in the schema (`lib/db/schema.ts:99`) but is referenced nowhere in application code. Users cannot recover a lost password.
- **G-02 — No 2FA for privileged roles.** `super_admin` and business owners are protected by password alone.
- **G-03 — In-memory rate limiter.** Per-process state resets on restart and does not coordinate across instances. The code documents a Redis upgrade path.
- **G-04 — Dead `receptionist_clinics` scoping table.** See §4.
- **G-05 — No forced password rotation.** Owner-created managers and staff can retain a seed-shared password indefinitely. The `createManager` docstring acknowledges this.
- **G-06 — No migration-integrity guard.** The runner has no assertion that every `.sql` file is accounted for, which is the direct cause of F-16. Fixed as part of Phase 0.
- **G-07 — No schema-consistency CI check.** Nothing validates collation uniformity, FK presence, or column/table collation agreement, so F-17 and F-21 could not be caught automatically. Added as part of Phase 0.

**Untestable with current data** (need fixtures before these can be assessed): vendor upload token lifecycle (0 `test_bookings`), Razorpay order/verify/webhook (0 `package_payments`), Shule bearer-token auth (0 `personal_access_tokens`), SMTP config path (`mail_settings` empty), manager↔manager tenant isolation — both seeded clinics belong to doctor #2, so both managers resolve to `doctorIds: [2]` and there is no separation to probe. Full detail in §11.4.

---

## 7. Implementation Plan

> **Before executing: read §12.** It records one blocker that invalidates the Phase 1 and Phase 3 exit criteria, plus three prerequisites that take under an hour to clear.

Ordered by risk reduction per unit of change. Phases 1–3 are the security core; 4–6 are hardening; Phase 6a is environment and should be done first because it is independent of code. Phase 0 is schema hygiene — it was originally written as a deployment blocker and that was **disproved** (§11.5), so it no longer gates anything. No new dependencies required; no architectural change.

### Phase 0 — Schema consistency (F-16, F-17)

**No longer a deployment blocker.** F-16 was originally written as HIGH and as the top pre-deployment priority; the fresh-install reproduction disproved that. A fresh `npm run db:migrate` produces a schema identical to live (655/211/85, zero drift) and `npm run db:seed` then succeeds. Phase 0 is now ordinary hygiene.

1. Delete `drizzle/audit_logs.sql`, `push_subscriptions.sql`, `sos_dispatch.sql`, `integrity_constraints.sql`, or move them to `docs/archive/` with a superseded-by header. **Do not** widen the runner's filename filter — `integrity_constraints.sql` contains non-idempotent `ALTER TABLE … ADD CONSTRAINT` statements that would fail on any database that already has them.
2. Add a warning to `scripts/migrate.ts` when a non-numeric `.sql` file sits in `drizzle/`, so a future stale file is visible rather than inert.
3. Normalise the seven minority-collation tables to `utf8mb4_uca1400_ai_ci` (F-17) — source of the split is `0011_receptionist_clinics.sql` and `0012_legacy_extras.sql`.
4. Add a CI check asserting a single `TABLE_COLLATION` across `information_schema.TABLES` and no column-level divergence.

**Exit criteria:** `npm run db:migrate:status` still reports 14 applied / 0 pending on both live and a fresh scratch database; the 655/211/85 schema diff still shows zero drift; `npm run db:seed` succeeds against a fresh scratch database.

### Phase 1 — Close the authorization gap (F-01, F-02, F-19)

> **Blocked until §12.1 is cleared.** The exit criteria below assume `doctor@gmail.com` lacks `registrations`, `billing` and `income-expense`. It does not — the e2e suite granted it all 13 modules. Restore the fixture first, or the criteria pass vacuously.

Highest value, most contained.

1. Add `requireApiPermission(permission)` to `lib/auth/guard.ts`, mirroring `requireApiRole` — returns a `403` `Response` on denial.
2. Apply it to each data-returning route using the same permission string already in `DOCTOR_ROUTE_PERMISSIONS` / `ADMIN_ROUTE_PERMISSIONS` so layout and API cannot drift:
   - `registrations` → `patients/export`, `patients/[id]/photo`
   - `appointments` → `appointments/export`, `appointments/booked-times`
   - `billing` → `billing/[id]/pdf`
   - `income-expense` → `income-expense/export`, `income-expense/[id]/file`
   - `test-booking` → `test-bookings/**`
   - `roles-permissions` → `staff/attendance`, `staff/attendance/report`, `staff/[id]/permissions`
   - `dashboard` → `consult-pdf`, `prescriptions/[consultationId]`
3. Add the doctor-only assertion for `sos/status`, `sos/stream`, `prescriptions/[consultationId]`.
4. Preserve the existing admin-tier branches (`getBusinessScope()`) untouched.
5. **Audit the two PHI exporters** (F-19): add `audit.pdfDownloaded` calls to `patients/export` and `appointments/export`, including the row count and applied filters. Land this in the same phase as the permission checks — closing the door and lighting the camera in one change is the point.
6. **Write the regression spec that does not exist today.** Add an e2e test asserting a principal *without* the `registrations` module receives `403` from `/api/doctor/patients/export`, and one asserting a patients export produces an `audit_logs` row. F-01 survived a full review because nothing tested for it; without this, it will survive the fix too.

**Exit criteria:** all four F-01 reproductions return `403`; admin/manager retain access; a patients export produces a matching `audit_logs` row; `e2e/appointments|billing|patients|test-bookings|staff|roles` pass.

### Phase 2 — Close privilege escalation and PHI disclosure (F-03, F-04, F-05)

5. Move the trial check into `requireWriteScope` and `requireDoctorPermission` (doctor role only); keep the layout redirect as UX.
6. Extract `CONSENT_TTL_MS` + expiry predicate into a shared module; apply to the consent file read route and reject cancelled/undecided certificates.
7. Add `staffId === me.id` self-targeting guards to `updateStaff`, `deleteStaff`, `saveStaffPermissions`; require the current password for staff password changes; route self-service changes through `updateProfileAction`.
8. **Seed far-future `trial_ends_at` for all e2e doctor accounts before deploying step 5** — otherwise the whole doctor suite fails at once.

**Exit criteria:** expired-trial doctor is refused at the action layer; 8-day-old consent file returns `403`; receptionist self-targeting returns an error; `e2e/auth-matrix|roles|staff-flow|upload-audit` pass.

### Phase 3 — Repair staff management (F-06)

> **Exit criteria depend on §12.1 too.** "`/api/doctor/staff/4/permissions` returns `200` for the doctor" currently passes for the wrong reason — the inflated grants authorize it. Under a restored doctor (no `roles-permissions` module) the criterion becomes meaningful.

9. Land F-05's guards **before or with** this phase — a backfill alone activates the self-escalation path.
10. Backfill `reference_role_id` from `doctor_id` for `role = 'receptionist'` rows.
11. Fix `scripts/seed.ts:271-283` to write both columns, matching `createStaff`.
12. Add a migration assertion that receptionist rows always have at least one link column populated.
13. Consider mirroring the `getCurrentUser` fallback in the 6 staff queries as defence-in-depth.

**Exit criteria:** `/doctor/staff` lists the receptionist; `/api/doctor/staff/4/permissions` returns `200` for the doctor; attendance is populated; self-targeting still refused.

### Phase 4 — Rate limiting and IP attribution (F-07)

14. Set `TRUSTED_PROXY_HEADER` in deployment; document the proxy requirement in `.env.example`.
15. Add a startup warning in production when it is unset.
16. Add an IP dimension to the login limiter.

**Exit criteria:** `audit_logs` records real IPs; per-client `429` on `/api/shule/doctors`; login brute force bounded on both dimensions.

### Phase 5 — CSP (F-08)

17. Move `'unsafe-inline'` inside the `isDev` branch for `script-src` and `style-src`.
18. Add `object-src 'none'`, `frame-ancestors 'none'`.
19. Evaluate removing `cdn.jsdelivr.net` from `script-src` in production.
20. Run the **full** e2e suite; if hydration breaks, move to nonce-based CSP as the file comment already anticipates.

**Exit criteria:** production response contains no `'unsafe-inline'` in `script-src`; full e2e green.

### Phase 6 — Hardening (F-09 … F-15, F-18, F-20, F-21, F-25 … F-28, G-01)

21. `chmod 600 .env`, `750 storage storage/uploads`, `700` the PHI subdirectories; encode in the runbook.
22. Idle-timeout sessions; refresh `last_activity` throttled; populate `ip_address`/`user_agent`.
23. Destroy consumed OTP values instead of flagging them (F-18); add a purge for `used = 1 OR expires_at < now - 1 day`.
24. Add vendor-token expiry.
25. Constrain `/api/doctors/[id]/photo`.
26. Replace all 8 `startsWith(STORAGE_DIR)` guards with `path.relative`; extract one `resolveWithinStorage()` helper.
27. Bind `/api/packages/verify` to the initiating user.
28. Invert the dev-OTP flag to explicit opt-in.
29. Harden `sql_mode` (F-20) — validate `ONLY_FULL_GROUP_BY` against the full suite before adopting.
30. Migrate the 9 hardcoded upload caps to `lib/config` constants and derive every message from the value (F-25).
31. Delete the 6 unused schemas or wire them up under F-23 (F-26); remove `lib/whatsapp.ts` + `WHATSAPP_API_URL` (F-27); move `public/probes/` out of the web root and resolve the orphan `updateSchedule` export (F-28).
32. Decide on the global chat room (scope per practice or document as intentional).
33. Implement password reset using the existing `password_reset_tokens` table (G-01).
34. Add the F-21 indexes **only** alongside a data-volume decision, measuring before and after.

### Phase 6a — Network exposure (F-24) — environment, do first

This is configuration rather than code, but it is the only finding that changes the threat model, so it should not wait for a release cycle.

35. Set `bind-address = 127.0.0.1` in the MariaDB config and restart.
36. Start the dev server bound to loopback: `npm run dev -- --hostname 127.0.0.1`.
37. Create a least-privilege application database user; stop connecting as `root`.
38. If remote access is genuinely required, use an SSH tunnel rather than a wide bind, and document it.

**Exit criteria:** `ss -tlnp` shows `127.0.0.1:3306` and `127.0.0.1:3100` only; a connection attempt to `192.168.1.17:3306` from another host is refused; the app still starts and a login succeeds.

---

## 7c. Code-quality backlog (F-22, F-23)

Deliberately separated from the security phases. These are real maintenance hazards — F-22 has already produced one finding (F-05) by the same divergence pattern — but neither is an exploitable vulnerability, and bundling a 404-file refactor into a security release raises regression risk for no security benefit.

**F-22 (clinic CRUD triplication)** — extract `lib/validation/clinic.ts` with `parseClinicForm` + `CLINIC_ADDRESS_TYPES`, have all three tiers call it, keep the tier-specific guards. Roughly 80 lines removed, no behaviour change.

**F-23 (validation coverage)** — incremental, prioritised by exposure: `test-bookings` (11 actions) → `admin/staff` (7) → `admin/managers` (5) → `schedule` and `income-expense` (converting their inline checks to the shared schemas from F-22, killing two birds). Leave `settings` and `notifications` inline.

Both should follow the security phases and run behind the full e2e suite.

---

## 7b. Items Deliberately Deferred

Two findings are recorded but not recommended for action in this cycle.

**F-21 (missing indexes).** Harmless at current scale — `EXPLAIN` shows 11-row tables and full scans cost nothing. Adding indexes speculatively imposes write cost for no measured benefit, and the `users.phone` case needs a prefix or full-text index rather than a plain one because the query is `LIKE '%…%'`. Revisit with real row counts.

**F-20 (`IGNORE_SPACE`).** Not reachable — all queries are parameterized, and `NO_BACKSLASH_ESCAPES` being absent is what makes the existing LIKE escaping in `/api/shule/doctors` work as intended. Adopting a hardened `sql_mode` is worthwhile but `ONLY_FULL_GROUP_BY` is a behavioural change that can break queries relying on loose semantics, so it belongs in its own change with a full regression run — not bundled into a security fix.

---

## 8. Regression Test Plan

**After each phase:** `npm run lint` → targeted e2e specs → `npm run build`.

**Full suite after every phase:**

```
npm run build
npm run lint
npx playwright test
```

**Targeted specs by phase:**

| Phase | Specs |
|---|---|
| 0 | none applicable — see the scratch-database gate below |
| — | **baseline already captured: 75/75 Playwright tests pass (§5.3)** |
| 1 | `auth-matrix`, `appointments`, `billing`, `patients`, `test-bookings`, `staff`, `staff-flow`, `roles`, `home-visits` |
| 2 | `auth-flows`, `auth-matrix`, `roles`, `staff-flow`, `upload-audit`, `uploads` |
| 3 | `staff`, `staff-flow`, `roles`, `admin-scope` |
| 4 | `auth-flows`, `probes` |
| 5 | **all 27 specs** — CSP can break hydration globally |
| 6 | `all`, plus `smoke` and `dashboard-layout` |
| 6a | none — environment change; verify manually per exit criteria |
| 7c | `schedule`, `test-bookings`, `staff-flow`, `admin-scope`, `upload-audit`, `uploads`, `forms` |

### 8.0 Network exposure check (Phase 6a)

Run before and after — this one is verifiable in two commands and should never regress:

```
$ ss -tlnp | grep -E "3306|3100"
# BEFORE: 0.0.0.0:3306, [::]:3306, *:3100
# AFTER:  127.0.0.1:3306, 127.0.0.1:3100

$ mysql -h <lan-ip> -P 3306 -u root
# must fail to connect
```

### 8.1 Fresh-install gate (Phase 0)

Every e2e spec runs against an already-provisioned database, so the suite cannot catch schema-provisioning problems. This gate is therefore still worth keeping — but note it was **run and passed** during this audit, and it is what disproved F-16:

```
CREATE DATABASE skoracares_verify;
DATABASE_URL=…/skoracares_verify npm run db:migrate
DATABASE_URL=…/skoracares_verify npm run db:seed
```

| Check | Expected | Result when run |
|---|---|---|
| `audit_logs` table exists | yes | **PRESENT** |
| `push_subscriptions` table exists | yes | **PRESENT** |
| `sos_requests`, `sos_offers`, `sos_cases` exist | yes | **PRESENT** |
| `users.on_duty` column exists | yes | **PRESENT** |
| Column count vs live (`information_schema`) | equal | **655 = 655** |
| Index count vs live | equal | **211 = 211** |
| Foreign-key count vs live | equal | **85 = 85** |
| `npm run db:seed` against the fresh database | succeeds | **✅ Seed complete** |
| Second `npm run db:migrate` run | no-op, exit 0 | not re-run (see F-16 note) |

Re-run this after any Phase 0 change to confirm deleting the four files alters nothing.

### 8.2 Database regression checks

Run after any phase touching migrations or schema:

```sql
-- single collation across the schema
SELECT TABLE_COLLATION, COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() GROUP BY TABLE_COLLATION;   -- expect exactly 1 row

-- no column-level divergence
SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND COLLATION_NAME IS NOT NULL
    AND COLLATION_NAME <> 'utf8mb4_uca1400_ai_ci';             -- expect 0

-- still 72 tables, all InnoDB
SELECT ENGINE, COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' GROUP BY ENGINE;
```

Plus the 20 business-rule invariants in §4.1, which should be re-asserted after any change touching billing, transactions, or consent.

**Manual Burp re-verification after Phase 1–2** — every request below must return the stated status:

```
403  DOC  /api/doctor/patients/export          (no registrations perm)
403  REC  /api/doctor/income-expense/export    (no income-expense perm)
403  REC  /api/doctor/billing/1/pdf            (no billing perm)
403  DOC  /api/doctor/staff/attendance         (no roles-permissions perm)
403  REC  /api/doctor/sos/status               (doctor-only panel)
403  REC  /api/prescriptions/1                 (doctor-only panel)
200  DOC  /api/doctor/consult-pdf              (dashboard-scoped — must still work)
200  OWN  /api/doctor/billing/1/pdf            (admin tier — must still work)
200  MGR  /api/doctor/test-bookings/suggestions (admin tier — must still work)
403  DOC  /api/super-admin/support/export      (unchanged)
403  PAT  /api/doctor/patients/export          (unchanged)
```

**Known test-account state — ⚠️ PARTIALLY STALE, READ FIRST**

The permission counts below were correct when first measured, but **the Playwright suite mutated `doctor@gmail.com` while establishing the baseline in §5.3.** The Phase 1 and Phase 3 exit criteria above are written against the stale numbers and will produce misleading results until the fixture is restored. Full analysis at §12.

```
admin@gmail.com          super_admin  68 perms        ✓ unchanged
doctor@gmail.com         doctor       19 role perms, BUT 48 direct grants added by the
                                       e2e suite → 62 effective, ALL 13 modules   ✗ STALE
receptionist@gmail.com   receptionist  27 perms  (no billing/income-expense/roles-permissions)  ✓
owner@gmail.com          admin         0 perms   (owner bypasses by design)                   ✓
manager1@gmail.com       manager       39 perms  → clinic 1                                    ✓
manager2@gmail.com       manager       39 perms  → clinic 2                                    ✓
patient@gmail.com        patient        0 perms  → doctor 2                                   ✓
```

Measured role grants, for reference:

| Role | Module perms | Total incl. children |
|---|---|---|
| Super Admin | 13 (all) | 68 |
| Doctor | 5 — `appointments`, `dashboard`, `follow-up`, `schedule`, `support` | 19 |
| Receptionist | 6 — `appointments`, `dashboard`, `follow-up`, `registrations`, `schedule`, `test-booking` | 27 |
| Accountant | 2 — `billing`, `income-expense` | 6 |

Owner (`admin` role) bypasses module permissions by design — `requireAdminTier` substitutes an empty permission set for that role, so "0 perms" is correct and not a defect.

**Required before Phase 1 is verifiable:** restore `doctor@gmail.com` to role-only grants, then re-derive the effective set and confirm it excludes `registrations`, `billing` and `income-expense`. See §12 for the exact SQL and the root cause.

---

## 9. Change Log

*No application files have been modified. This audit was read-only apart from scratch files under `/tmp/opencode/`, the `burp-audite.md` document itself, and a dev server running on port 3100. The database was never written to beyond the 6 test session rows described in §10.*

| # | File | Change | Finding | Status |
|---|---|---|---|---|
| — | — | — | — | **not started** |

---

## 10. Method and Reproducibility

**Environment**

```
App:      localhost:3100 (next dev, NODE_ENV=development)
DB:       MariaDB 11.8.3, skoracares_db @ localhost:3306
Sessions: 6 principals minted by signing HS256 with AUTH_SECRET and inserting
          the matching sessions row — identical to the login path
Tooling:  Burp Suite MCP (send_http1_request) + direct SQL introspection
```

Session cookies used throughout were minted by replicating `setSessionCookie` (`lib/auth/session.ts:112`) — sign `{userId, jti}` with `AUTH_SECRET`, insert the `sessions` row — so every request carried a token the application treats as fully valid, including the revocation check.

**Database pass.** The second phase used a read-only MariaDB connection against `skoracares_db` for schema introspection, `EXPLAIN`, `information_schema` queries, and a 20-invariant data-integrity scan. Every statement against the live database was a `SELECT` or a `DESCRIBE`. F-17 and F-21 are established from `information_schema` and `EXPLAIN` on the live database. F-16 was initially claimed on the same static basis and later **disproved** by the fresh-install reproduction recorded below — see §11.5.

**Legacy sweep.** The third phase enumerated all 404 TypeScript/SQL files and cross-referenced imports, exports, validation coverage, schema drift, and filesystem posture. Method: import-graph analysis to find dead modules, exported-symbol analysis to find orphans, per-file zod call counts to measure validation coverage, `information_schema` comparison to detect drift, and `ss -tlnp` for network posture. Findings F-22 through F-28 are established structurally — by reading and comparing implementations — not by dynamic exploitation, which is appropriate since none of them is an exploitable vulnerability.

**Static verification also run:** `npx tsc --noEmit` (clean), `npm run build` (clean, 81 pages), `npm run lint` (1 cosmetic error).

**Fourth pass — execution.** Three further checks were run that earlier phases had only reasoned about:

| Check | Result |
|---|---|
| Full Playwright suite (`npx playwright test`) | **75/75 passed**, 0 failed, 8.7 min (§5.3) |
| Fresh-install reproduction (scratch DB → `db:migrate` → schema diff vs live) | **Zero drift** — 655 cols / 211 idx / 85 FK identical (§11.2) |
| Seed against the fresh database | Succeeds — from-scratch path proven end to end |

The fresh-install run **disproved** F-16 as originally published. The finding was downgraded and the retraction recorded at §11.5 rather than edited away.

**Safety — updated.** A full JSON snapshot of the live database was taken to `/tmp/opencode/skoracares_db.pre-wipe.json` (72 tables / 498 rows) and **verified restorable** into a scratch database with all 72 row counts matching before any destructive step. Two scratch databases were created (`skoracares_f16_repro`, `skoracares_restorecheck`) and both were dropped afterwards; the live database was never dropped or emptied. Row growth during the engagement (users 13 → 22, appointments 12 → 18, audit_logs 37 → 139) is attributable to the Playwright run, which creates and cleans up its own fixtures.

**Safety**

All hand-issued HTTP probes were GET requests or unauthenticated rejections. No write action was invoked directly, no clinical or financial row was modified, and no upload was submitted. Path-traversal payloads were sent and rejected by the application without touching the filesystem.

Database writes in the engagement, all of them non-clinical and self-expiring:

| Source | What it wrote | Status |
|---|---|---|
| Session minting for HTTP probes | `sessions` rows — 6 in the first pass, 4 more for the F-12 principals | Revocable, 30-day TTL; all 47 present in the table are accounted for |
| Playwright suite (75 tests) | its own users, appointments, bills, transactions, test bookings and audit rows | Self-cleaning fixtures |
| Fresh-install reproduction | a **separate** scratch database, then dropped | Live database untouched |

No `INSERT`, `UPDATE` or `DELETE` was ever issued against `skoracares_db` outside the suite's own fixtures.

**Untrusted data handling:** no secrets appear in this document. `.env` values, Razorpay credentials, `AUTH_SECRET`, and the `mail_settings` password are referenced by name and location only. Patient identifiers, emails, phone numbers and Aadhaar numbers observed during testing are redacted; consent slugs are shown in truncated form.

---

## 11. What Was Not Tested

Recorded explicitly so the boundary of this audit is unambiguous and the gaps can be closed deliberately. **§11.2 and §11.3 are closed.** F-12 has also been promoted out of §11.4 (runtime-confirmed). §11.1 (concurrency) and the remaining §11.4 rows are still open — F-03 is now the weakest-evidenced finding left.

### 11.1 Concurrency — the largest gap

Every invariant in §4 marked *Sound* rests on **reading** the conditional-claim logic, not on racing concurrent requests. These five paths all look correct and none was verified under contention:

| Path | Claim mechanism | Verified? |
|---|---|---|
| Appointment double-booking | `SELECT … FOR UPDATE` on the doctor row inside a transaction | **No** |
| Credit collection | conditional `UPDATE … WHERE status = 'pending'` + `affectedRows` check | **No** |
| Consent double-submission | conditional update gated on `is_accepted = false AND is_rejected = false` | **No** |
| Vendor report upload | conditional update requiring `uploaded_file_path IS NULL` | **No** |
| Package fulfillment | atomic `created → paid` claim with winner read-back | **No** |

Also untested: transaction rollback under an induced mid-transaction failure; unique-key collision retry in `insertAdminUser` against `users_email_unique` / `users_registration_id_unique`; and `queueLimit: 0` pool behaviour under load.

### 11.2 Fresh-install reproduction — **CLOSED**

Now performed. A scratch database was provisioned with the documented `npm run db:migrate`, compared against live via `information_schema` (**655 columns / 211 indexes / 85 FKs, zero drift**), then seeded with `npm run db:seed` (clean success). The result **disproved** F-16 as originally written — see F-16 and §11.5.

Side benefit: F-06 was reproduced on the fresh install, upgrading it from a live-database observation to a confirmed deterministic seed defect.

### 11.3 Automated test suite — **CLOSED**

The full Playwright suite was executed: **75/75 passed** (§5.3). A regression baseline now exists, so the Phase 1–6 changes in §7 have a reference point to be measured against.

### 11.4 Flows with no fixture data

| Flow | Status |
|---|---|
| **Patient photo route (F-12)** | **NOW CLOSED.** A real profile photo exists on user #2; tested across four principals and confirmed exploitable — see F-12 |
| Cross-doctor IDOR | **NOW TESTABLE and clean.** Four doctors now exist (#2, #12, #14, #23). `DOC12 → /api/doctor/patients/3/photo` returns `404`, so practice scoping works |
| Vendor upload token lifecycle (F-11) | Partially unblocked — `test_bookings` now has 1 row, but it is already `completed`, so the no-expiry claim still needs a back-dated booking |
| Trial expiry (F-03) | **Still open.** Three doctors carry future `trial_ends_at` values; none is expired, so the bypass path was never exercised at runtime. Static proof stands: `grep -rln "trial" app/api` returns nothing |
| Razorpay order / verify / webhook (F-14) | Still open — `package_payments` 0 rows |
| Shule bearer-token auth | Still open — `personal_access_tokens` 0 rows |
| SMTP configuration path | Still open — `mail_settings` 0 rows |
| Manager ↔ manager tenant isolation | Still open — both seeded clinics belong to doctor #2, so both managers resolve to `doctorIds: [2]` |
| Rate-limit collapse (F-07) | Still open — needs `TRUSTED_PROXY_HEADER` set and sustained volume. Corroborated statically: `audit_logs` still has 0 rows with a real IP |

**F-03 is now the weakest runtime evidence of the remaining findings.** Its static proof is unambiguous — there is no trial reference anywhere in `app/api` or any server action — but no expired trial has ever been exercised. That is the single highest-value item in the concurrency/race verification pass.

### 11.5 False-positive register

One finding was reported and then retracted. Recorded so a reader can calibrate trust in the rest of the document.

| Finding | Originally reported | Basis | Why it was wrong | Resolution |
|---|---|---|---|---|
| **F-16** | **HIGH** — "fresh deploys have no audit log, no SOS dispatch, no push subscriptions"; described as the highest-priority pre-deployment fix | Static read of `scripts/migrate.ts:47` plus observation that 4 `.sql` files were absent from `migration_log` | It never checked whether the *numbered* migrations already created those objects. `0000_fine_the_leader.sql` creates `audit_logs` and `users.on_duty`; `0012_legacy_extras.sql` creates `push_subscriptions` and all three `sos_*` tables. The four untracked files are superseded duplicates | **Downgraded HIGH → LOW.** Reproduced on a fresh install; schema diff proved zero drift. Factual core (four files are silently ignored) is retained as maintenance hygiene |

**Lesson recorded.** The error was specifically "inferred a deployment consequence from a source-code pattern without reproducing the deployment." The four untracked files and the absence from `migration_log` were both real observations; the leap to "therefore a fresh install is missing these tables" was not.

Two contributing factors worth noting:

1. `auditLog`'s `catch { /* Table may not exist yet; silently ignore */ }` made the failure *look* credible — the code genuinely would fail silently if the table were missing. The mechanism was real even though the premise was not. That catch is **still** worth reviewing (see F-19 and Phase 0's CI check), but on its own it is not a finding.
2. `npm run db:migrate:status` reporting "Pending: (empty)" was read as a false clean. It was correct — nothing was pending.

**Evidence upgrades — not retractions.** Three findings were originally evidenced by source reading with an acknowledged caveat, and have since been confirmed at runtime. None of them was wrong; their runtime evidence was thin, and running the tests fixed that.

| Finding | Original caveat | What changed |
|---|---|---|
| **F-12** | "the `404`s are incidental, not authorization working" — no user had a photo to fetch | Playwright uploaded a real profile photo to user #2. Tested across four principals: owner, patient, unrelated patient and peer doctor all received `200 image/jpeg`; anonymous correctly received `401` |
| **F-19** | confirmed by source only — the two CSV routes contain no audit call | Requested both endpoints plus the auditing control, checking `audit_logs` before and after. All three returned `200` with full file contents; **zero** audit rows written, while the neighbouring PDF-download route has logged 4. `action LIKE '%export%'` returns 0 across all 139 rows |
| **F-07** | `ip_address` was `"unknown"` on 35/35 audit rows | Re-verified at 139/139 across 22 distinct action types — still the single value `'unknown'`, so the collapse is not a low-traffic artifact |

**What this does not undermine.** The other 27 findings were each either dynamically reproduced over HTTP (§5.1, §5.3, F-12), confirmed by live database query (§4.1), or established by direct source comparison (§3d). F-16 was the only one resting on an unverified inference, and it is the one that was wrong.

---

## 12. Readiness Assessment for Implementation

Added after reviewing the plan in §7 against the current state of the code and database. **The plan is structurally sound but is not yet ready to execute as written** — two of its verification steps are invalidated by state drift that the plan itself introduced, and one finding needs a runtime proof before its fix can be considered safe.

### 12.1 Blocker — the Phase 1 exit criteria cannot fail as written

Phase 1's acceptance test is a table of requests that must return `403`, keyed on the premise that `doctor@gmail.com` holds 19 permissions and lacks `registrations`, `billing` and `income-expense`. **That premise is no longer true**, so the test as written would pass vacuously — or worse, appear to pass because the *fixture* changed, not the *code*.

The cause is the audit's own regression baseline. `e2e/super-admin.spec.ts:92` ("sync doctor permissions") opens the doctor permission dialog and clicks **Save permissions**. `saveDoctorPermissions` (`app/super-admin/actions.ts:514-522`) *deletes every existing `model_has_permissions` row for the doctor and replaces them with the submitted set*. The dialog's initial state comes from `getUserPermissionNames`, which returns the doctor's **direct** grants only — and for a freshly seeded doctor that set is empty, because the seed grants the Doctor role its 19 permissions through `role_has_permissions` instead.

So the spec opened a dialog showing nothing ticked, ticked `schedule`, and saved. That is harmless on its own — but the doctor at that point was `doctor@gmail.com`, and the run left **48 direct permission rows** on user #2, granting every module.

Confirmed in the audit log, written by user #1 (`super_admin`) during the baseline run:

```sql
SELECT metadata FROM audit_logs WHERE action='role_changed'
  AND metadata LIKE '%doctor_permissions_saved%';
-- {"action":"doctor_permissions_saved","doctorId":2,"doctorName":"Dr. Aarav Sharma","permissions":43}
```

Current effective state, recomputed by mirroring `getUserPermissions` (direct ∪ role, expanded child→parent):

| Principal | Effective perms | Modules | Correct? |
|---|---|---|---|
| `admin@gmail.com` | 68 | all 13 | ✓ |
| **`doctor@gmail.com`** | **62** | **all 13** | ✗ **should be 19 / 5** |
| `receptionist@gmail.com` | 27 | 6 | ✓ |
| `owner@gmail.com` | 0 (bypassed) | — | ✓ by design |
| `manager1/2@gmail.com` | 39 | 8 each | ✓ |
| `patient@gmail.com` | 0 | — | ✓ |

Consequence — re-running the Phase 1 acceptance table live, right now:

```
200  DOC -> /api/doctor/patients/export        (expected 403)
200  DOC -> /api/doctor/income-expense/export  (expected 403)
200  DOC -> /api/doctor/billing/1/pdf          (expected 403)
200  DOC -> /api/doctor/staff/attendance       (expected 403)
```

The page-level control is equally affected:

```
200  DOC -> /doctor/patients   (document says this bounces to /doctor)
200  DOC -> /doctor/billing    (document says this bounces to /doctor)
200  DOC -> /doctor/roles      (document says this bounces to /doctor)
```

**This does not weaken F-01.** The finding is a missing check in the code, verified by reading 39 route handlers and confirmed by contrast against the layout guard — not by the existence of one particular test account. F-01 stands on its own. What is invalidated is the *reproduction recipe*, and with it the Phase 1 exit criteria.

**Restore before Phase 1:**

```sql
-- Remove the grants the e2e suite added to user 2
DELETE FROM model_has_permissions WHERE model_id = 2;
-- Restore the role grant the seed intends (19 perms via role_has_permissions)
-- role_has_permissions for role_id = 2 is already intact — no insert needed.
```

Then re-assert the effective set excludes `registrations`, `billing`, `income-expense`, and confirm `/doctor/patients` bounces again.

**The e2e spec is a latent hazard and should be fixed in the same change.** `e2e/super-admin.spec.ts:92` mutates a shared seed fixture and never restores it. Two options, and the second is better:

1. Have the spec restore the original grants in a `finally` block.
2. Have it operate on a doctor it creates itself, rather than `ACCOUNTS.doctor`.

Option 2 also removes an ordering dependency — the spec's behaviour currently depends on whether a *previous* spec has already granted permissions to that doctor, which makes the suite non-hermetic. **Recommend fixing this before trusting any Phase 1 exit result**, since a baseline that silently mutates its own fixture can mask a regression.

**Phase 3 is affected the same way.** Its exit criterion is "`/api/doctor/staff/4/permissions` returns `200` for the doctor" — which passes trivially under the current inflated grants and would mask a genuine failure of the `reference_role_id` fix.

### 12.2 F-03 needs a runtime proof before its fix is safe

§11.4 records this, and the plan's Phase 2 correctly flags F-03 as the highest-blast-radius change. The recommendation is to **prove the bypass before writing the fix**, which is cheap:

```sql
-- pick a throwaway e2e doctor, NOT doctor@gmail.com
UPDATE users SET trial_ends_at = '2020-01-01' WHERE id = 12;
```

Then, with a session for user #12: confirm `/doctor` redirects to `/trial-expired` (control) while a direct action invocation — `createPatient`, `createBill` — still succeeds. That is the bypass, demonstrated rather than inferred.

The trap is the mirror image: **every doctor currently has either `NULL` or a future `trial_ends_at`**, and the plan correctly notes that `NULL` must keep meaning "no restriction". Verify that explicitly before deploying the guard — `if (trialEndsAt && trialEndsAt <= now)` preserves it, but only if written that way, and a stricter `if (!trialEndsAt || ...)` would lock out every unconfigured doctor.

After proof, restore user #12's `trial_ends_at` to a far-future value so the doctor suite is unaffected.

### 12.3 Verified-good — the plan's assumptions that hold

Checked against source rather than taken from the document:

| Plan assumption | Status |
|---|---|
| `requireApiRole` exists and returns a `Response` on denial | ✓ `lib/auth/guard.ts:26-33` — the F-01 helper is a 6-line wrapper |
| `hasPermission` is available to the guard module | ✓ already imported at `lib/auth/guard.ts:2` |
| `DOCTOR_ROUTE_PERMISSIONS` provides the canonical permission names | ✓ `lib/auth/permissions.ts:26-50` — 20 prefixes, and `doctorPermissionForPath()` maps a pathname to its permission, so routes can derive it rather than hardcode |
| The seeded Doctor role carries only 5 modules, so over-tightening is a real risk | ✓ confirmed — 5 modules, 19 perms |
| `owner` role bypasses module permissions by design | ✓ `requireAdminTier` substitutes an empty permission set for `admin`; the new API helper must preserve this |
| Receptionist lacks `billing`, `income-expense`, `roles-permissions` | ✓ confirmed — 6 modules, missing exactly those three |

One implementation note the plan does not mention: `ADMIN_ROUTE_PERMISSIONS` and the `admin`/`manager` bypass semantics must be handled in the new helper too, or admin-tier routes will start returning `403` to legitimate owners. `requireApiRole` is role-only today, so the new helper must branch on `user.role === "admin"` before consulting permissions.

### 12.4 Gaps in the plan itself

Things §7 does not cover, in rough priority order:

1. **No new e2e spec for the fixes.** The plan verifies via Burp one-off requests and existing specs. There is no regression test asserting that a doctor without `registrations` gets `403` from `/api/doctor/patients/export`. Without one, F-01 can silently regress. **This is the single most important addition** — the finding was missed because nothing tested for it.
2. **F-19's audit assertion is untestable by the existing suite.** Adding an audit call needs a spec that exports and then reads `audit_logs`; no current spec does that.
3. **No ordering enforcement beyond prose.** The doc says land F-05's guards before the F-06 backfill. That dependency is real — the backfill activates the self-escalation path — but nothing prevents a merge from inverting it. A single PR, or a CI check.
4. **G-03 (in-memory rate limiter) is listed as a gap but has no phase.** Phase 4 fixes F-07 by setting `TRUSTED_PROXY_HEADER`, which does not make the limiter cross-instance safe. Either accept single-instance deployment explicitly or schedule the Redis work.
5. **The two §4 product questions have no owner.** The global chat room (shared across all practices) and `createBill`'s client-supplied amount are both flagged "worth confirming with the product owner" — the plan does not say who asks, or what the default is if nobody answers. The chat room in particular may be a live tenant-isolation defect rather than a design choice, and it is currently untestable because the seed has a single room.

### 12.5 Verdict

**Not ready to execute as written, but the gap is small and specific.**

Three things to do first — all under an hour:

| # | Action | Why |
|---|---|---|
| 1 | Restore `doctor@gmail.com` (§12.1 SQL) | Phase 1 and Phase 3 exit criteria are meaningless until this is done |
| 2 | Fix `e2e/super-admin.spec.ts:92` to stop mutating the shared doctor fixture | Otherwise the next baseline run re-breaks it, and a passing Phase 1 tells you nothing |
| 3 | Prove the F-03 bypass on a throwaway doctor, then restore it | The highest-blast-radius change should not ship on static evidence alone |

Then add the missing regression spec (item 1 in §12.4) as part of Phase 1 — the audit's central finding deserves a test that fails when it regresses.

Everything else in §7 is sound and correctly sequenced. The plan's own honesty about regression risk is unusually good: it correctly identifies F-03's blast radius, F-01's over-tightening danger, F-06/F-05's ordering dependency, and F-08's hydration risk. Those four cautions are the parts most worth preserving.

---
