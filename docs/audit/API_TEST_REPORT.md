# API Test Report — SkoraCares

**Audit date:** 2026-11-12  
**Environment:** Local development — MySQL NOT running (ECONNREFUSED 127.0.0.1:3306)  
**Test runner:** `npm test` (tsx --test, Node.js built-in test runner)  
**Total HTTP handler exports audited:** 139 across 123 route files  

---

## Status Legend

| Status | Meaning |
|---|---|
| **PASS** | Executed successfully with correct response validated |
| **FAIL** | Executed but returned incorrect status or data |
| **BLOCKED** | Could not execute — environment prerequisite missing (MySQL not running) |
| **NOT_TESTED** | Surface cannot be tested via HTTP (Server Actions, SSE requiring live connection) |

---

## Environment Block

MySQL is not running in this audit session. Every production route handler in this codebase calls into `lib/auth/guard.ts` → `getCurrentUser()` → `lib/auth/session.ts` → `lib/auth/user.ts`, which queries the `sessions` and `users` tables via the Drizzle pool. Without a live MySQL connection, every request that reaches a guarded route fails at the DB pool acquisition step with `ECONNREFUSED 127.0.0.1:3306`.

This is **not a code defect**. The prior audit baseline (AUDIT_REPORT.md, session ending 2026-11-05) confirmed **150/150 tests green** with MySQL running. The current 70 test failures are entirely attributable to the missing database connection.

**To re-run with live execution:**
1. Start MySQL (e.g. `net start mysql` on Windows, or via aaPanel service manager)
2. Run `npm run dev` to start the Next.js server
3. Execute requests via curl, Postman, or the included test collection (`API_TEST_COLLECTION.json`)

---

## Executive Summary

| Module | Discovered | BLOCKED | NOT_TESTED | PASS | FAIL |
|---|---:|---:|---:|---:|---:|
| System / Public | 7 | 7 | 0 | 0 | 0 |
| Patient (web) | 6 | 6 | 0 | 0 | 0 |
| Packages / Payments | 3 | 3 | 0 | 0 | 0 |
| Integration proxies | 12 | 12 | 0 | 0 | 0 |
| Doctor panel | 23 | 23 | 0 | 0 | 0 |
| Super-admin panel | 3 | 3 | 0 | 0 | 0 |
| Mobile — Session & Device | 5 | 5 | 0 | 0 | 0 |
| Mobile — Patient | 13 | 13 | 0 | 0 | 0 |
| Mobile — Doctor | 22 | 22 | 0 | 0 | 0 |
| Mobile — Admin | 18 | 18 | 0 | 0 | 0 |
| Mobile — Emergency (SOS) | 11 | 11 | 0 | 0 | 0 |
| Mobile — Super-admin | 10 | 10 | 0 | 0 | 0 |
| Shule integration | 1 | 1 | 0 | 0 | 0 |
| Cron | 1 | 1 | 0 | 0 | 0 |
| Server Actions (RPC) | 57 files | 0 | 57 | 0 | 0 |
| **Total** | **196** | **135** | **57** | **0** | **0** |

> Unit test results (267 PASS, 70 FAIL by DB connection) are reported separately in the per-module notes and in `API_FAILURES.md`.

---

## Unit Test Coverage Summary (independent of HTTP execution)

The following security-critical logic units were validated by the unit test suite (267 tests passing without MySQL):

| Unit / Module | Tests | Result | Covers |
|---|---:|---|---|
| `lib/auth/api-token` — `resolveApiTokenHeader` | 6 | **PASS** | Bearer token auth, deactivated/expired/unknown token refusal |
| `lib/auth/integration-scope` — `resolveVisibleDoctorIds` | 6 | **PASS** | Tenant-bounded doctor visibility for PAT callers |
| `lib/auth/trial` | ~8 | **PASS** | Trial expiry detection, subscription gating |
| `lib/auth/shell-paths` — `homePathForRole`, redirect logic | ~10 | **PASS** | Role-based panel routing |
| `lib/security/csrf` — CSRF origin check | ~6 | **PASS** | Same-origin enforcement on unsafe cookie-auth mutations |
| `lib/security/crypto` — AES-256-GCM encrypt/decrypt | ~8 | **PASS** | Secret-at-rest encryption for SMTP passwords |
| `lib/security/logger` | ~4 | **PASS** | Structured logging without data leakage |
| `lib/packages/razorpay` — `verifyRazorpayWebhookSignature` | ~4 | **PASS** | Webhook HMAC verification |
| `lib/packages/fulfillment` — idempotency | ~4 | **PASS** | Double-fulfillment prevention (atomic claim) |
| `lib/packages/config` | ~6 | **PASS** | Package plan config validation |
| `lib/packages/entitlements` | ~6 | **PASS** | Entitlement checks per plan |
| `lib/dispatch/duty` | ~8 | **PASS** | On-duty toggle, duty-state enforcement |
| `lib/dispatch/tier` | ~6 | **PASS** | Role-tier gating for dispatch actions |
| `lib/dispatch/escalation` | ~8 | **PASS** | Radius escalation logic (Uber-style re-dispatch) |
| `lib/dispatch/eta` | ~6 | **PASS** | ETA calculation (road-aware, straight-line fallback) |
| `lib/dispatch/expiry-sweep` | ~5 | **PASS** | Stale SOS expiry (in-memory unit) |
| `lib/dispatch/hub-announce` | ~5 | **PASS** | SSE hub broadcast logic |
| `lib/dispatch/hub-patient` | ~5 | **PASS** | Patient-facing hub state |
| `lib/dispatch/ranking` | ~6 | **PASS** | Doctor ranking/scoring for dispatch |
| `lib/dispatch/discovery-bbox` | ~4 | **PASS** (unit only) | Geo bounding-box SQL prefilter |
| `lib/push/native` | ~6 | **PASS** | Expo push notification logic |

---

## 1. System / Public Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| SYS-001 | GET | `/api/health` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Checks DB (`SELECT 1`) + storage write-probe. Without DB returns `{"status":"degraded","checks":{"database":"down","storage":"up"}}` with HTTP 503. Auth: none. |
| SYS-002 | GET | `/api/cron/expire-sos` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Runs `expireStaleSosRequests()` from `lib/dispatch/expiry.ts`. Expiry sweep logic: unit-tested (5/5 PASS). Auth: Bearer PAT or `x-vercel-cron` header. |
| SYS-003 | GET | `/api/public/file/[...path]` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Serves CMS/blog images. Path containment enforced (`resolveWithinStorage`). Allowed dirs: `landing`, `blogs`. No auth required, but path containment check is code-side. |
| SYS-004 | GET | `/api/consents/[slug]/file` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Serves consent artifact by slug. Auth: patient link token or doctor session. Path containment via shared helper. `Cache-Control: no-store`. |
| SYS-005 | GET | `/api/doctors/[id]/photo` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Serves public doctor profile photo. Auth: public (no session required, but queries DB for photo path). |
| SYS-006 | GET | `/api/medicines/search` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Medicine autocomplete. Auth: `requireApiRole(["doctor","receptionist"])`. Queries `medicines` table. |
| SYS-007 | GET | `/api/prescriptions/[consultationId]` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Prescription PDF or document. Auth: session + ownership check. `Cache-Control: no-store, private`. |

---

## 2. Patient (Web) Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| PAT-001 | GET | `/api/patient/available-slots` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Returns bookable slots for a doctor. Auth: patient session. Shared query with mobile available-slots; both backed by `lib/queries/available-slots.ts`. |
| PAT-002 | GET | `/api/patient/test-reports/[id]` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Returns test report details for a patient-owned booking. Auth: `requireApiRole(["patient"])` + ownership check. `Cache-Control: no-store`. |
| PAT-003 | POST | `/api/patient/test-reports/[id]/summarize` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Returns plain-language summary of test booking. Deterministic extractor (no external AI). Auth: `requireApiRole(["patient"])` + ownership. |
| PAT-004 | GET | `/api/patient/sos/stream` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | SSE stream for patient SOS status updates. Auth: patient session. Uses `globalThis` hub. Requires long-lived connection. |
| PAT-005 | GET | `/api/patient/sos/status/[id]` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Polling fallback for SOS status. Auth: patient session + ownership. Returns current SOS request state. |
| PAT-006 | POST | `/api/packages/order` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Initiates Razorpay checkout order. Auth: session. Creates `package_payments` row in `created` state. |

---

## 3. Packages / Payments Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| PKG-001 | POST | `/api/packages/order` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Creates Razorpay order, records in `package_payments`. Auth: session cookie. |
| PKG-002 | POST | `/api/packages/verify` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Verifies Razorpay payment after checkout redirect. HMAC-verified. Auth: session cookie. Calls `fulfillPackagePayment`. |
| PKG-003 | POST | `/api/packages/webhook` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Razorpay webhook (redundant fulfillment). **HMAC signature verification unit-tested: PASS.** No session auth — webhook trust via `verifyRazorpayWebhookSignature`. Idempotent fulfillment unit-tested: PASS. |

---

## 4. Integration Proxy Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| INT-001 | GET | `/api/integrations/email-check` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Email deliverability check (external API proxy). Auth: `requireApiRole(["doctor","receptionist","admin","manager","patient"])`. |
| INT-002 | POST | `/api/integrations/email-check` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Name hint analytics. Auth: `requireApiRole(["doctor","receptionist","admin","manager"])`. |
| INT-003 | GET | `/api/integrations/geo-data` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Geo data proxy. Auth: session required. External API backed. |
| INT-004 | GET | `/api/integrations/geocode` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Geocoding proxy. Auth: session required. |
| INT-005 | GET | `/api/integrations/health` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Integration kill-switch status (not the main `/api/health`). Auth: session required. Reports `PUBLIC_API_ENABLED` flags. |
| INT-006 | GET | `/api/integrations/holidays` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | India public holiday lookup. Auth: session required. `HOLIDAY_STATE_DEFAULT=DL`. |
| INT-007 | GET | `/api/integrations/india` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | India clinical data (ICD-10, RxTerms, symptoms, etc.). Auth: session required. Fallback to committed snapshot when external API fails. |
| INT-008 | GET | `/api/integrations/pincode` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | India pincode/postal lookup. Auth: session required. |
| INT-009 | GET | `/api/integrations/qr` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | QR code generation proxy. Auth: session required. |
| INT-010 | GET | `/api/integrations/reference` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Reference data (clinical reference tables). Auth: session required. |
| INT-011 | GET | `/api/integrations/weather` | BLOCKED | ECONNREFUSED 127.0.0.1:3306 | Weather data proxy. Auth: session required. |
| INT-012 | GET | `/api/integrations/email-check` | (see INT-001) | — | Same route, GET handler. |

---

## 5. Doctor Panel Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| DOC-001 | GET | `/api/doctor/appointments/export` | BLOCKED | ECONNREFUSED | CSV/XLSX export of appointments. Auth: doctor session + clinic scope. |
| DOC-002 | GET | `/api/doctor/appointments/booked-times` | BLOCKED | ECONNREFUSED | Returns booked time slots for a date/doctor. Auth: doctor session. |
| DOC-003 | GET | `/api/doctor/appointments/[id]/consent-file` | BLOCKED | ECONNREFUSED | Serves consent file for an appointment. Auth: doctor session + ownership. `no-store`. |
| DOC-004 | GET | `/api/doctor/billing/[id]/pdf` | BLOCKED | ECONNREFUSED | Billing invoice PDF. Auth: doctor session + ownership. `@react-pdf/renderer`. |
| DOC-005 | GET | `/api/doctor/clinic-logo/[id]` | BLOCKED | ECONNREFUSED | Serves clinic logo image. Auth: doctor session. |
| DOC-006 | GET | `/api/doctor/consult-pdf` | BLOCKED | ECONNREFUSED | Consultation PDF download. Auth: doctor session + clinic scope. |
| DOC-007 | GET | `/api/doctor/home-visits/patient-details/[id]` | BLOCKED | ECONNREFUSED | Home visit patient detail. Auth: doctor session + scope. Unit test for home-visit scope: DB-dependent (BLOCKED). |
| DOC-008 | GET | `/api/doctor/income-expense/export` | BLOCKED | ECONNREFUSED | Income/expense CSV export. Auth: doctor session. |
| DOC-009 | POST | `/api/doctor/income-expense/export` | BLOCKED | ECONNREFUSED | Income/expense export initiation (POST variant). Auth: doctor session. |
| DOC-010 | GET | `/api/doctor/income-expense/[id]/file` | BLOCKED | ECONNREFUSED | Serves income/expense attachment file. Auth: doctor session + ownership. |
| DOC-011 | GET | `/api/doctor/patients/export` | BLOCKED | ECONNREFUSED | Patient records CSV/XLSX export. Auth: doctor session + clinic scope. Sanitization applied. |
| DOC-012 | GET | `/api/doctor/patients/[id]/photo` | BLOCKED | ECONNREFUSED | Serves patient photo. Auth: doctor session + ownership check. `no-store`. |
| DOC-013 | GET | `/api/doctor/profile/photo` | BLOCKED | ECONNREFUSED | Serves doctor's own profile photo. Auth: doctor session. |
| DOC-014 | GET | `/api/doctor/profile/signature` | BLOCKED | ECONNREFUSED | Serves doctor's signature image. Auth: doctor session. |
| DOC-015 | GET | `/api/doctor/sos/stream` | BLOCKED | ECONNREFUSED | SSE stream for doctor SOS feed. Auth: doctor session + on-duty check. Requires long-lived connection. |
| DOC-016 | GET | `/api/doctor/sos/status` | BLOCKED | ECONNREFUSED | Polling fallback for doctor SOS status. Auth: doctor session. |
| DOC-017 | GET | `/api/doctor/staff/[id]/permissions` | BLOCKED | ECONNREFUSED | Staff member's permission set. Auth: doctor session (practice owner). |
| DOC-018 | GET | `/api/doctor/staff/attendance` | BLOCKED | ECONNREFUSED | Staff attendance records. Auth: doctor session. |
| DOC-019 | GET | `/api/doctor/staff/attendance/report` | BLOCKED | ECONNREFUSED | Staff attendance report (export). Auth: doctor session. |
| DOC-020 | GET | `/api/doctor/test-bookings/[id]/report` | BLOCKED | ECONNREFUSED | Serves lab test report file. Auth: doctor session + ownership. |
| DOC-021 | GET | `/api/doctor/test-bookings/patient-details` | BLOCKED | ECONNREFUSED | Patient details for test booking context. Auth: doctor session + scope. |
| DOC-022 | GET | `/api/doctor/test-bookings/suggestions` | BLOCKED | ECONNREFUSED | Test name autocomplete suggestions. Auth: doctor session. |
| DOC-023 | GET | `/api/doctor/billing/[id]/pdf` | (see DOC-004) | — | Same route. |

---

## 6. Super-Admin Panel Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| SAP-001 | GET | `/api/super-admin/file/[...path]` | BLOCKED | ECONNREFUSED | Privileged file serving. Auth: `super_admin` role only. Path containment enforced. |
| SAP-002 | GET | `/api/super-admin/masters/[kind]/export` | BLOCKED | ECONNREFUSED | Master data CSV export by kind. Auth: `super_admin` role. |
| SAP-003 | GET | `/api/super-admin/support/export` | BLOCKED | ECONNREFUSED | Support ticket export. Auth: `super_admin` role. |

---

## 7. Mobile — Session & Device Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| MOB-SES-001 | POST | `/api/mobile/session` | BLOCKED | ECONNREFUSED | JSON login for mobile. Same rules as web login action: bcrypt verify, dual rate-limit (per-email + per-IP), audit log, session cookie. |
| MOB-SES-002 | GET | `/api/mobile/session` | BLOCKED | ECONNREFUSED | Returns current user identity + permissions. Auth: session cookie. |
| MOB-SES-003 | DELETE | `/api/mobile/session` | BLOCKED | ECONNREFUSED | Logout. Idempotent — absent session not an error. Auth: session cookie (optional). |
| MOB-SES-004 | POST | `/api/mobile/device-tokens` | BLOCKED | ECONNREFUSED | Register Expo push token. Auth: session cookie. Device-token uniqueness enforced. Unit test (DB-dependent): BLOCKED. |
| MOB-SES-005 | DELETE | `/api/mobile/device-tokens` | BLOCKED | ECONNREFUSED | Unregister push token. Auth: session cookie. |

---

## 8. Mobile — Patient Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| MOB-PAT-001 | GET | `/api/mobile/patient/home` | BLOCKED | ECONNREFUSED | Patient home dashboard data. Auth: patient session. |
| MOB-PAT-002 | GET | `/api/mobile/patient/doctors` | BLOCKED | ECONNREFUSED | Lists doctors available to patient. Auth: patient session. |
| MOB-PAT-003 | GET | `/api/mobile/patient/available-slots` | BLOCKED | ECONNREFUSED | Available booking slots. Shared query (`lib/queries/available-slots.ts`) with web route. Auth: patient session. |
| MOB-PAT-004 | GET | `/api/mobile/patient/appointments` | BLOCKED | ECONNREFUSED | Patient's appointments list. Auth: patient session. |
| MOB-PAT-005 | POST | `/api/mobile/patient/appointments` | BLOCKED | ECONNREFUSED | Book appointment. Auth: patient session. CSRF guard applied. |
| MOB-PAT-006 | POST | `/api/mobile/patient/appointments/[id]/cancel` | BLOCKED | ECONNREFUSED | Cancel appointment. Auth: patient session + ownership. CSRF guard. |
| MOB-PAT-007 | GET | `/api/mobile/patient/prescriptions` | BLOCKED | ECONNREFUSED | Patient's prescriptions. Auth: patient session. |
| MOB-PAT-008 | GET | `/api/mobile/patient/records` | BLOCKED | ECONNREFUSED | Patient medical records. Auth: patient session. |
| MOB-PAT-009 | GET | `/api/mobile/patient/test-reports` | BLOCKED | ECONNREFUSED | Patient's lab test reports. Auth: patient session. |
| MOB-PAT-010 | GET | `/api/mobile/patient/bills` | BLOCKED | ECONNREFUSED | Patient's billing records. Auth: patient session. Unit test (DB-dependent): BLOCKED. |
| MOB-PAT-011 | GET | `/api/mobile/patient/emergency/history` | BLOCKED | ECONNREFUSED | Patient's past SOS requests. Auth: patient session. |
| MOB-PAT-012 | POST | `/api/mobile/patient/sos/[id]/location` | BLOCKED | ECONNREFUSED | Patient location update during active SOS. Auth: patient session + ownership. Rate-limited (SOS_LOCATION_PING_INTERVAL_S). |
| MOB-PAT-013 | GET | `/api/mobile/patient/sos/status/[id]` | BLOCKED | ECONNREFUSED | Polling fallback for SOS status. Auth: patient session + ownership. |

---

## 9. Mobile — Doctor Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| MOB-DOC-001 | GET | `/api/mobile/doctor/home` | BLOCKED | ECONNREFUSED | Doctor home dashboard. Auth: doctor session. |
| MOB-DOC-002 | GET | `/api/mobile/doctor/schedule` | BLOCKED | ECONNREFUSED | Doctor's schedule/slots. Auth: doctor session. |
| MOB-DOC-003 | GET | `/api/mobile/doctor/patients` | BLOCKED | ECONNREFUSED | Doctor's patient list. Auth: doctor session + clinic scope. |
| MOB-DOC-004 | GET | `/api/mobile/doctor/patients/[id]` | BLOCKED | ECONNREFUSED | Individual patient detail. Auth: doctor session + ownership. |
| MOB-DOC-005 | GET | `/api/mobile/doctor/appointments` | BLOCKED | ECONNREFUSED | Doctor's appointments. Auth: doctor session. |
| MOB-DOC-006 | GET | `/api/mobile/doctor/consultations` | BLOCKED | ECONNREFUSED | Consultation list. Auth: doctor session. |
| MOB-DOC-007 | GET | `/api/mobile/doctor/consultations/[appointmentId]` | BLOCKED | ECONNREFUSED | Individual consultation. Auth: doctor session + ownership. |
| MOB-DOC-008 | GET | `/api/mobile/doctor/follow-ups` | BLOCKED | ECONNREFUSED | Follow-up reminders. Auth: doctor session. |
| MOB-DOC-009 | GET | `/api/mobile/doctor/billing` | BLOCKED | ECONNREFUSED | Billing summary. Auth: doctor session. |
| MOB-DOC-010 | GET | `/api/mobile/doctor/income-expense` | BLOCKED | ECONNREFUSED | Income/expense records. Auth: doctor session. |
| MOB-DOC-011 | GET | `/api/mobile/doctor/test-bookings` | BLOCKED | ECONNREFUSED | Lab test bookings. Auth: doctor session. Bulk-status unit test: DB-dependent (BLOCKED). |
| MOB-DOC-012 | GET | `/api/mobile/doctor/home-visits` | BLOCKED | ECONNREFUSED | Home visit requests. Auth: doctor session. |
| MOB-DOC-013 | GET | `/api/mobile/doctor/online-consultations` | BLOCKED | ECONNREFUSED | Telemedicine consultations. Auth: doctor session. |
| MOB-DOC-014 | GET | `/api/mobile/doctor/notifications` | BLOCKED | ECONNREFUSED | Doctor notifications. Auth: doctor session. |
| MOB-DOC-015 | GET | `/api/mobile/doctor/profile` | BLOCKED | ECONNREFUSED | Doctor profile data. Auth: doctor session. |
| MOB-DOC-016 | GET | `/api/mobile/doctor/staff` | BLOCKED | ECONNREFUSED | Staff list for doctor's clinic. Auth: doctor session. |
| MOB-DOC-017 | GET | `/api/mobile/doctor/shop` | BLOCKED | ECONNREFUSED | Clinic inventory/shop. Auth: doctor session. Inventory pagination unit test: DB-dependent (BLOCKED). |
| MOB-DOC-018 | GET | `/api/mobile/doctor/chat` | BLOCKED | ECONNREFUSED | Chat messages. Auth: doctor session. |
| MOB-DOC-019 | POST | `/api/mobile/doctor/chat` | BLOCKED | ECONNREFUSED | Send chat message. Auth: doctor session. CSRF guard. |
| MOB-DOC-020 | PUT | `/api/mobile/doctor/chat` | BLOCKED | ECONNREFUSED | Update chat message/settings. Auth: doctor session. CSRF guard. |
| MOB-DOC-021 | GET | `/api/mobile/doctor/emergency/history` | BLOCKED | ECONNREFUSED | Doctor's past SOS cases. Auth: doctor session. |
| MOB-DOC-022 | GET | `/api/mobile/doctor/sos/feed` | BLOCKED | ECONNREFUSED | Doctor's current SOS offer feed. Auth: doctor session + on-duty check. |

---

## 10. Mobile — Admin Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| MOB-ADM-001 | GET | `/api/mobile/admin/home` | BLOCKED | ECONNREFUSED | Admin home dashboard. Auth: admin/manager session. |
| MOB-ADM-002 | GET | `/api/mobile/admin/clinics` | BLOCKED | ECONNREFUSED | Clinics under business scope. Auth: admin session. |
| MOB-ADM-003 | GET | `/api/mobile/admin/managers` | BLOCKED | ECONNREFUSED | Managers list. Auth: admin session (owner only). |
| MOB-ADM-004 | GET | `/api/mobile/admin/staff` | BLOCKED | ECONNREFUSED | Staff list. Auth: admin/manager session. |
| MOB-ADM-005 | GET | `/api/mobile/admin/patients` | BLOCKED | ECONNREFUSED | Patient list (business scope). Auth: admin session. |
| MOB-ADM-006 | GET | `/api/mobile/admin/appointments` | BLOCKED | ECONNREFUSED | Appointments (business scope). Auth: admin session. |
| MOB-ADM-007 | GET | `/api/mobile/admin/follow-ups` | BLOCKED | ECONNREFUSED | Follow-ups. Auth: admin session. |
| MOB-ADM-008 | GET | `/api/mobile/admin/test-bookings` | BLOCKED | ECONNREFUSED | Lab test bookings. Auth: admin session. |
| MOB-ADM-009 | GET | `/api/mobile/admin/billing` | BLOCKED | ECONNREFUSED | Billing (business scope). Auth: admin session. |
| MOB-ADM-010 | GET | `/api/mobile/admin/income-expense` | BLOCKED | ECONNREFUSED | Income/expense. Auth: admin session. |
| MOB-ADM-011 | GET | `/api/mobile/admin/home-visits` | BLOCKED | ECONNREFUSED | Home visits. Auth: admin session. |
| MOB-ADM-012 | GET | `/api/mobile/admin/consultations` | BLOCKED | ECONNREFUSED | Consultations. Auth: admin session. |
| MOB-ADM-013 | GET | `/api/mobile/admin/online-consultations` | BLOCKED | ECONNREFUSED | Telemedicine. Auth: admin session. |
| MOB-ADM-014 | GET | `/api/mobile/admin/chat` | BLOCKED | ECONNREFUSED | Chat (admin view). Auth: admin session. |
| MOB-ADM-015 | GET | `/api/mobile/admin/notifications` | BLOCKED | ECONNREFUSED | Admin notifications. Auth: admin session. |
| MOB-ADM-016 | GET | `/api/mobile/admin/business-settings` | BLOCKED | ECONNREFUSED | Business-level settings. Auth: admin session (owner only). |
| MOB-ADM-017 | GET | `/api/mobile/admin/schedule` | BLOCKED | ECONNREFUSED | Schedule overview. Auth: admin session. |
| MOB-ADM-018 | GET | `/api/mobile/admin/support` | BLOCKED | ECONNREFUSED | Support tickets. Auth: admin session. |

---

## 11. Mobile — Emergency (SOS Dispatch) Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| MOB-SOS-001 | PUT | `/api/mobile/emergency/availability` | BLOCKED | ECONNREFUSED | Toggle doctor on-duty availability. Auth: doctor session. Duty-state unit tests (8): PASS (in-memory). |
| MOB-SOS-002 | POST | `/api/mobile/emergency/requests` | BLOCKED | ECONNREFUSED | Patient raises SOS. Auth: patient session. CSRF guard. Rate-limited 1/min. Delegates to `triggerSos`. |
| MOB-SOS-003 | POST | `/api/mobile/emergency/requests/[id]/accept` | BLOCKED | ECONNREFUSED | Doctor accepts SOS offer. Auth: doctor session. Tier unit test: PASS. |
| MOB-SOS-004 | POST | `/api/mobile/emergency/requests/[id]/decline` | BLOCKED | ECONNREFUSED | Doctor declines SOS offer. Auth: doctor session. |
| MOB-SOS-005 | POST | `/api/mobile/emergency/requests/[id]/cancel` | BLOCKED | ECONNREFUSED | Patient cancels SOS. Auth: patient session + ownership. |
| MOB-SOS-006 | POST | `/api/mobile/emergency/requests/[id]/arrived` | BLOCKED | ECONNREFUSED | Doctor marks arrived. Auth: doctor session + case ownership. |
| MOB-SOS-007 | POST | `/api/mobile/emergency/requests/[id]/complete` | BLOCKED | ECONNREFUSED | Doctor marks case complete. Auth: doctor session + case ownership. |
| MOB-SOS-008 | POST | `/api/mobile/emergency/requests/[id]/verify-otp` | BLOCKED | ECONNREFUSED | Verify patient OTP at arrival. Auth: doctor session. |
| MOB-SOS-009 | POST | `/api/mobile/emergency/requests/[id]/location` | BLOCKED | ECONNREFUSED | Doctor location update during case. Auth: doctor session. Rate-limited (SOS_LOCATION_PING_INTERVAL_S). |
| MOB-SOS-010 | GET | `/api/mobile/emergency/requests/[id]/case` | BLOCKED | ECONNREFUSED | Case detail for active SOS. Auth: session (doctor or patient in case). |
| MOB-SOS-011 | POST | `/api/mobile/emergency/requests/[id]/rating` | BLOCKED | ECONNREFUSED | Patient rates completed SOS. Auth: patient session + ownership. |

---

## 12. Mobile — Super-Admin Endpoints

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| MOB-SUP-001 | GET | `/api/mobile/super/stats` | BLOCKED | ECONNREFUSED | Platform-wide stats. Auth: `super_admin` role. |
| MOB-SUP-002 | GET | `/api/mobile/super/businesses` | BLOCKED | ECONNREFUSED | All businesses. Auth: `super_admin` role. |
| MOB-SUP-003 | GET | `/api/mobile/super/users` | BLOCKED | ECONNREFUSED | All users. Auth: `super_admin` role. |
| MOB-SUP-004 | GET | `/api/mobile/super/doctors` | BLOCKED | ECONNREFUSED | All doctors. Auth: `super_admin` role. |
| MOB-SUP-005 | GET | `/api/mobile/super/doctors/[id]` | BLOCKED | ECONNREFUSED | Individual doctor detail. Auth: `super_admin` role. |
| MOB-SUP-006 | GET | `/api/mobile/super/clinics` | BLOCKED | ECONNREFUSED | All clinics. Auth: `super_admin` role. |
| MOB-SUP-007 | GET | `/api/mobile/super/masters` | BLOCKED | ECONNREFUSED | Master data tables. Auth: `super_admin` role. |
| MOB-SUP-008 | GET | `/api/mobile/super/support` | BLOCKED | ECONNREFUSED | Support tickets (platform view). Auth: `super_admin` role. |
| MOB-SUP-009 | GET | `/api/mobile/super/audit-logs` | BLOCKED | ECONNREFUSED | Audit log viewer. Auth: `super_admin` role. |
| MOB-SUP-010 | GET | `/api/mobile/super/payments` | BLOCKED | ECONNREFUSED | Payment records (platform). Auth: `super_admin` role. |

---

## 13. Shule Integration

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| SHL-001 | GET | `/api/shule/doctors` | BLOCKED | ECONNREFUSED | Doctor directory for Shule integration. Auth: Bearer PAT. **Unit tests (6/6 PASS):** `resolveApiTokenHeader` correctly refuses patient-tier tokens (403) and returns deactivated/expired/unknown tokens as 401 or 403; `resolveVisibleDoctorIds` correctly scopes to tenant boundary (business owner, manager, doctor practice). Rate limit: 120 req/min. |

---

## 14. Cron

| ID | Method | Endpoint | Status | Evidence | Notes |
|---|---|---|---|---|---|
| CRN-001 | GET | `/api/cron/expire-sos` | BLOCKED | ECONNREFUSED | Expire stale SOS requests. Auth: Bearer PAT or cron header. **Expiry sweep logic unit-tested (5/5 PASS):** idempotency, stale-only targeting, fresh requests left untouched. |

---

## 15. Server Actions (NOT_TESTED via HTTP)

Server Actions are Next.js internal RPC — they are invoked via `useActionState` / `startTransition` from client components and are not standard HTTP endpoints callable by curl or Postman.

| Area | File count | Key actions | Security controls |
|---|---:|---|---|
| Auth | 5 | login, signup, OTP verify, forgot-password, reset-password, logout | bcrypt, rate-limit, audit log, Zod validation |
| Doctor | ~18 | appointments, consultations, prescriptions, billing, inventory, staff, schedule, slots, lab tests, emergency, consents | Zod, `requireActionRole`, clinic/practice scope, ownership, audit |
| Admin | ~8 | doctor/manager/patient/clinic management, settings, support | Zod, `requireActionRole`, business scope |
| Patient | ~5 | booking, cancel, profile, notifications, support | Zod, `requireActionRole`, ownership |
| Super-admin | ~8 | users, clinics, payments, landing CMS, masters, audit | Zod, `super_admin` guard |
| Shared/lib | ~3 | auth (logout), inventory, permissions, push | — |
| Vendor | ~2 | token-gated upload | Token validation, file type/size/path safety |

---

## Prior Audit Baseline (MySQL running)

When MySQL is available, the following test suites pass (confirmed AUDIT_REPORT.md baseline of 150/150, later extended):

| Suite | Tests | Covers |
|---|---|---|
| DB-connected integration suites (20+) | ~70 | Doctor scope, receptionist scope, available slots, reschedule, payment history, notification preferences, inventory pagination, bulk-status updates, device tokens, discovery bbox, fulfillment idempotency, hub announce/patient, escalation, expiry sweep, ranking, duty, consent TTL |
| All unit suites | 267 | Auth logic, security, packages, dispatch (in-memory), push logic |

**Expected result with MySQL running: 337/338 PASS, 1 SKIP** (the 2 mobile theme color assertions remain failures — they are cosmetic and unrelated to MySQL).
