# SkoraCare — Complete Implementation Plan

> **Scope:** Next.js 16.3 rewrite (`skoracare_old`)
> **Source of truth:** Legacy Laravel app (`legacy/`) + Security Audit + Feature Parity Report
> **Date:** 2026-08-14
> **Current state:** 38% features implemented, 7% partial, 55% missing. Security fixes from the audit were reverted — this plan re-applies and extends them.

---

## Part A — Security Audit & Improvement Plan

### A.0 Summary of Findings

| Severity | Count | Themes |
|----------|-------|--------|
| CRITICAL | 5 | IDOR, unauthenticated chat polling, PHI in `public/`, weak committed `AUTH_SECRET`, no rate limiting |
| HIGH | 5 | No security headers/middleware, no input validation (zod unused), no error boundaries, plaintext mail password, no audit logging |
| MEDIUM | 5 | DB pool hardening, session cookie gaps, signup bypasses email verification, no enum whitelists, BigInt casts |

---

### A.1 Phase S1 — Authentication & Session Hardening (Priority 1)

#### S1.1 Rotate & secure `AUTH_SECRET`
- [ ] Generate a new strong secret (64+ random bytes) and put it in `.env`
- [ ] Create `.env.example` with placeholder values (no real secrets)
- [ ] Add a startup guard: fail fast in `lib/db/index.ts`/`lib/auth/session.ts` if `AUTH_SECRET` is the known dev default or < 32 chars
- [ ] Verify `.gitignore` covers `.env*` (except `.env.example`)

**Files:** `.env`, `.env.example` (create), `lib/auth/session.ts`, `lib/auth/password.ts`

#### S1.2 Session token hardening
- [ ] Add `jti` (unique token ID) to JWT payload
- [ ] Add `issuedAt`/`notBefore` claims
- [ ] Store session record server-side (`sessions` table already exists) keyed by `jti` for revocation
- [ ] Add `logout` server action that deletes the server-side session (not just the cookie)
- [ ] Session fixation: rotate `jti` on login
- [ ] Cookie flags: confirm `httpOnly`, `sameSite: "lax"`, `secure: true` in prod, add `path: "/"`

**Files:** `lib/auth/session.ts`, `lib/auth/session-store.ts` (new), `app/(auth)/login/actions.ts`, `app/(auth)/logout` (new route/action)

#### S1.3 Rate limiting & lockout (auth endpoints)
- [ ] Implement in-memory sliding-window rate limiter (per IP + per email)
- [ ] Login: max 5 attempts / 15 min → 15 min lockout after 5 failures
- [ ] Signup: max 3 accounts / hour per IP
- [ ] Consent respond: max 10 / hour per slug
- [ ] Book demo: max 5 / hour per IP
- [ ] Chat polling: throttle to 1 req / 2s

**Files:** `lib/security/rate-limit.ts` (re-create), `app/(auth)/login/actions.ts`, `app/(auth)/signup/actions.ts`, `app/(marketing)/contact/actions.ts`, `app/(marketing)/my-consent/[slug]/actions.ts`, `app/doctor/chat/actions.ts`

#### S1.4 Email verification flow
- [ ] Stop setting `emailVerifiedAt: now` in signup
- [ ] Add verification token column usage (or reuse `email_verified_at` pattern with signed token)
- [ ] Create `app/(auth)/verify-email/[token]` route
- [ ] Gate sensitive actions on `emailVerifiedAt` (mirror legacy `verified` middleware)
- [ ] Add "resend verification" action

**Files:** `app/(auth)/signup/actions.ts`, `app/(auth)/verify-email/[token]/page.tsx` (new), `lib/auth/user.ts`, `lib/db/schema.ts`

---

### A.2 Phase S2 — Authorization / IDOR Fixes (Priority 1)

All fixes follow one pattern: **scope every query by the authenticated doctor/patient before reading or writing**.

#### S2.1 Appointment IDOR
- [ ] `getAppointmentById(id)` → `getAppointmentById(doctorId, id)`; add `eq(appointments.doctorId, doctorId)` to the WHERE clause
- [ ] Update call sites: `app/doctor/consultations/[appointmentId]/page.tsx`

**Files:** `lib/queries/doctor.ts`, `app/doctor/consultations/[appointmentId]/page.tsx`

#### S2.2 Consultation write IDOR
- [ ] `saveConsultation`: verify `appointmentId` belongs to doctor before read or insert; validate `patientId` belongs to the doctor's patient list
- [ ] Add doctor scoping on the read path (`getConsultationIdByAppointment` already scoped — verify)

**Files:** `app/doctor/actions.ts`

#### S2.3 Billing IDOR
- [ ] `createBill`: verify `patientId` is one of the doctor's patients and `billingTypeId` belongs to doctor (both currently unchecked)

**Files:** `app/doctor/actions.ts`

#### S2.4 Transaction IDOR
- [ ] `createTransaction`: verify `incomeTypeId`/`expenseTypeId` has `userId === doctorId`

**Files:** `app/doctor/actions.ts`

#### S2.5 Appointment create IDOR
- [ ] `createAppointment`: validate `patientId` (if provided) belongs to doctor; reject NaN from `Number()`

**Files:** `app/doctor/actions.ts`

#### S2.6 Support ticket ownership
- [ ] `replySupportTicket`: verify ticket belongs to current user (currently unchecked)

**Files:** `app/doctor/actions.ts`

#### S2.7 Chat polling auth
- [ ] **CRITICAL:** `pollChatMessages` currently has NO auth check — add `authedUser()` guard

**Files:** `app/doctor/chat/actions.ts`

#### S2.8 Central ownership helpers
- [ ] Create `lib/auth/ownership.ts` (re-create): `ensurePatientOfDoctor(doctorId, patientId)`, `ensureBillingTypeOfDoctor(...)`, `ensureTypeOfUser(...)`, `ensureTicketOwner(...)`

**Files:** `lib/auth/ownership.ts` (new)

---

### A.3 Phase S3 — Data Protection (Priority 1)

#### S3.1 Move PHI PDFs out of `public/`
- [ ] `app/doctor/consult-pdf/actions.ts`: write uploads to a non-public directory (e.g. `storage/uploads/` or a server-only path)
- [ ] Re-create `app/api/doctor/consult-pdf/route.ts` to stream the PDF with auth + doctor scoping (`Cache-Control: private, no-store`)
- [ ] Remove `public/uploads/doctor-consult-pdfs/` from web-accessible paths
- [ ] Add magic-byte validation for PDFs (not just extension + mime)
- [ ] Use random filenames (no `doctorId-Date.now()` predictability)

**Files:** `app/doctor/consult-pdf/actions.ts`, `app/api/doctor/consult-pdf/route.ts` (re-create), `app/doctor/consult-pdf/page.tsx`

#### S3.2 Support attachments (when added — see P2 features)
- [ ] Attachments must go to non-public storage; never `public/uploads/support_attachments`

#### S3.3 Prescription PDF route hardening
- [ ] Validate `consultationId` is numeric; guard against DoS via huge payloads
- [ ] Keep `Cache-Control: no-store`
- [ ] Allow walk-in patients (patientId null) with doctor-authenticated download

**Files:** `app/api/prescriptions/[consultationId]/route.ts`

#### S3.4 Mail password encryption
- [ ] Store `mail_settings.password` encrypted (not plaintext)
- [ ] Never expose password in UI (currently email-setup page says it's hidden — verify)

**Files:** `lib/db/schema.ts`, `app/super-admin/email-setup/page.tsx`

---

### A.4 Phase S4 — Defense-in-Depth (Priority 2)

#### S4.1 Middleware & security headers
- [ ] Re-create `proxy.ts` (or `middleware.ts`) with:
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
  - CSP header (allow inline styles used by Tailwind/Next, block `unsafe-eval` in prod)
  - `Permissions-Policy`
  - HSTS in production

**Files:** `proxy.ts` (re-create)

#### S4.2 Input validation with zod
- [ ] zod 4.4.3 is installed but unused — create `lib/validation/index.ts` (re-create) with schemas for: signup, login, appointment create/update, billing, transaction, consultation save, support ticket/reply, consent respond, medicine add, profile update
- [ ] Wire schemas into all server actions + the prescriptions API route

**Files:** `lib/validation/index.ts` (re-create), all server action files

#### S4.3 Error & not-found boundaries
- [ ] Re-create `app/error.tsx` (global error boundary, no stack traces leaked)
- [ ] Re-create `app/not-found.tsx`

**Files:** `app/error.tsx`, `app/not-found.tsx` (re-create)

#### S4.4 Audit logging
- [ ] Create `lib/security/audit-log.ts` (re-create): log auth events (login success/fail, logout, signup), permission-sensitive writes (bill create, transaction create, consult PDF upload, support replies, consent responses)
- [ ] Write to a `audit_logs` table or JSONL file (not console-only)

**Files:** `lib/security/audit-log.ts` (re-create), `lib/db/schema.ts`

#### S4.5 Enum whitelists
- [x] `updateFollowUpStatus`: enum whitelist + transition guard (addressed/no_follow_up/rescheduled/cancelled terminal; rescheduled→pending) — fixed the UI sending "completed" which the server silently rejected
- [x] `createAppointment.caseType`: whitelist `clinical_visit | home_visit | online_visit | on_call_visit`
- [x] `createBill.paymentMethod`: whitelist `upi | cash | card | netbanking`

**Files:** `app/doctor/actions.ts`

#### S4.6 DB pool & type hardening
- [ ] `lib/db/index.ts`: `connectionLimit` tuning, `connectTimeout`, idle timeout
- [ ] Audit all `Number()` casts of BigInt (ids) — wrap in safe helper
- [ ] Replace `as never` casts with zod-validated values where possible

**Files:** `lib/db/index.ts`, `lib/utils.ts`, all actions

#### S4.7 Landing link open-redirect
- [ ] Sanitize external URLs in `landingSections`/`landingItems` metadata before rendering links

**Files:** `lib/queries/landing.ts`, `app/(marketing)/page.tsx`

#### S4.8 Server-side permission enforcement
- [ ] Audit every server action: confirm `requireRole`/permission check exists on the server, not only in UI nav

**Files:** all `app/**/actions.ts`

---

### A.5 Phase S5 — Regression Verification (Security)

- [ ] Manual test matrix: cross-doctor patient view → 403/redirect; unauthenticated chat poll → redirect; direct `/api/prescriptions/1` as other patient → 403; download consult PDF without auth → 403
- [ ] Run `npm run lint`
- [ ] Run `npm run build` — confirm no type errors
- [ ] Re-run security audit checklist → confirm all CRITICAL/HIGH closed

---

## Part B — Feature Parity Implementation Plan

### B.0 Parity Snapshot

| Area | Total | ✅ | ⚠️ | ❌ |
|------|-------|----|----|----|
| Public/Marketing | 10 | 7 | 2 | 1 |
| Authentication | 6 | 3 | 0 | 3 |
| Doctor Dashboard | 4 | 3 | 0 | 1 |
| Appointments | 18 | 5 | 0 | 13 |
| Consultations | 7 | 5 | 0 | 2 |
| Patient Registration | 8 | 2 | 1 | 5 |
| Billing | 7 | 2 | 1 | 4 |
| Income & Expense | 9 | 3 | 1 | 5 |
| Chat | 10 | 7 | 0 | 3 |
| Schedule & Clinics | 8 | 1 | 0 | 7 |
| Home Visits | 2 | 1 | 0 | 1 |
| Test Bookings | 11 | 1 | 0 | 10 |
| Support Tickets | 7 | 4 | 1 | 2 |
| Shop/Medicines | 3 | 2 | 0 | 1 |
| Staff Management | 7 | 1 | 0 | 6 |
| Roles & Permissions | 6 | 1 | 0 | 5 |
| Profile Settings | 6 | 3 | 0 | 3 |
| Consult PDF | 2 | 2 | 0 | 0 |
| Super Admin | 16 | 5 | 5 | 6 |
| Patient Portal | 5 | 5 | 0 | 0 |
| Legacy-only extras | 14 | 0 | 0 | 14 |
| **TOTAL** | **166** | **63** | **11** | **92** |

**Strategy:** Build in vertical slices per module, mirroring legacy routes → controller → view. Every slice ships with: server action + zod validation + ownership scoping + page UI. Implemented-but-partial items get upgraded to full CRUD.

---

### B.1 Phase P1 — Data Layer & Shared Primitives (Foundation)

- [ ] **P1.1** Create shared UI components for CRUD: `DataTable`, `Pagination`, `ConfirmDialog`, `FileUpload`, `ExportButton`
- [ ] **P1.2** Create Excel export utility using `xlsx` (npm) — replaces Maatwebsite Excel
- [ ] **P1.3** Create import utility (Excel → validated rows) for master data
- [ ] **P1.4** Create file upload service (non-public storage + magic-byte validation + random names) — shared by patients, support, test reports, consult PDFs
- [ ] **P1.5** Create `lib/queries/crud.ts` generic helpers: `createRow`, `updateRow`, `deleteRow` with doctor/owner scoping
- [ ] **P1.6** Create audit log + activity trail wiring for all new writes

**Files:** `components/ui/crud/*`, `lib/utils/excel.ts`, `lib/utils/files.ts`, `lib/queries/crud.ts`

---

### B.2 Phase P2 — Doctor: Core Clinical Modules (Priority 1)

#### P2.1 Patient Registration CRUD (5 missing)
- [ ] Create patient form (name, email rfc/dns+unique, gender, phone regex, dob, aadhaar 12-digit, photo)
- [ ] `createPatient` action — generates `PAT+7digit` registration id + random 10-char password (mirror legacy `DoctordashboardController@store`)
- [ ] `updatePatient`, `deletePatient` actions (scoped by `reference_role_id`)
- [ ] **Excel export** of patients (`UsersExport` parity)
- [ ] Date-range filter on patient list

**Files:** `app/doctor/patients/new/page.tsx`, `app/doctor/patients/[id]/edit/page.tsx`, `app/doctor/patients/actions.ts`, `app/doctor/patients/page.tsx`

#### P2.2 Appointments CRUD (13 missing)
- [ ] `getBookedTimes` + conflict detection on booking form (parity: `AppointmentController@getBookedTimes`)
- [ ] Edit appointment (`editappointment` + `updateappointment` parity)
- [ ] Delete appointment
- [ ] Cancel with reason (legacy `cancellation-reason` route)
- [ ] **Generate consent link** — `generateConsentLink()` parity: creates `appointmentConsultConsents` row with slug, emails `AppointmentConsentMail`, returns link
- [ ] `checkConsentBeforeBooking` + `checkConsentStatus` AJAX parity
- [ ] **WhatsApp confirmation** (`sendWhatsapp` parity) — via WhatsApp Cloud API (env: `WHATSAPP_APP_KEY`, `WHATSAPP_AUTH_KEY`)
- [ ] Upload consultation prescription (per-appointment file)
- [ ] **Excel export of appointments** (`AppointmentsExport` parity)
- [ ] Appointment settings page
- [ ] `filter_patients_appointments` parity

**Files:** `app/doctor/appointments/*`, `app/doctor/appointments/actions.ts`, `lib/services/whatsapp.ts` (new), `lib/services/consent.ts` (new), `lib/mail/*` (new)

#### P2.3 Consultation enhancements (2 missing)
- [ ] Vitals (height, weight, BP, blood group) saved to appointment during consultation (parity: `ConsultationController@store` vitals block)
- [ ] Medicine search AJAX endpoint (parity: `medicines/search`)

**Files:** `app/doctor/consultations/[appointmentId]/consultation-form.tsx`, `app/doctor/actions.ts`, `app/api/medicines/search/route.ts` (new)

#### P2.4 Consent flow completion
- [ ] Upgrade `app/(marketing)/my-consent/[slug]/` to parity: file upload (jpg/png/pdf max 5MB), **auto-generate consent PDF** (DomPDF parity → react-pdf template), set appointment status to `confirmed`/`cancelled`
- [ ] Expiry check on consent records

**Files:** `app/(marketing)/my-consent/[slug]/page.tsx`, `actions.ts`, `components/pdf/consult-consent-pdf.tsx` (new)

---

### B.3 Phase P3 — Doctor: Financial & Operations (Priority 1)

#### P3.1 Billing (4 missing)
- [ ] Billing types CRUD (create/edit/deactivate) — server action + UI
- [ ] Edit / delete bill (scoped by doctorId)
- [ ] **Print bill PDF** (`printPDF` parity → react-pdf invoice template)
- [ ] Consultation-page billing (`storeBillingConsultpage` parity) — bill form inside consultation page; marks appointment completed + syncs income transaction

**Files:** `app/doctor/billing/*`, `components/pdf/bill-pdf.tsx` (new)

#### P3.2 Income & Expense (5 missing)
- [ ] Edit / delete transaction
- [ ] Transaction status update
- [ ] Income/Expense category CRUD (currently read-only)
- [ ] **Export selected / export all (Excel)** parity
- [ ] Transaction file attachment (non-public storage)

**Files:** `app/doctor/income-expense/*`, `app/doctor/actions.ts`

#### P3.3 Shop / Medicines (1 missing)
- [ ] Edit / delete medicine (legacy manages via MasterController)

**Files:** `app/doctor/shop/*`

---

### B.4 Phase P4 — Doctor: Scheduling, Test Bookings, Staff, Roles (Priority 2)

#### P4.1 Schedule & Clinics (7 missing)
- [ ] Clinic CRUD (create/update/delete) — `DoctorSchedulingController` parity
- [ ] Schedule CRUD (create/update/delete weekly slots)
- [ ] Working hours view

**Files:** `app/doctor/schedule/*`, `app/doctor/schedule/actions.ts`

#### P4.2 Test Bookings (10 missing)
- [ ] Create / edit / delete booking
- [ ] Status update
- [ ] **Vendor CRUD** (add/update/delete)
- [ ] **Tests CRUD** (add/update/delete)
- [ ] Mobile / registration suggestions AJAX
- [ ] Patient details AJAX
- [ ] **Vendor upload flow** — generate `uploadLinkToken` on booking; public `app/vendor/upload-test/[token]/` page + action to upload report (pdf/jpg/png max 5MB), set `uploadedFilePath`, status `completed`, notify doctor

**Files:** `app/doctor/test-bookings/*`, `app/vendor/upload-test/[token]/page.tsx` (new), `lib/services/test-booking.ts` (new)

#### P4.3 Staff Management (6 missing)
- [ ] Staff CRUD (create/update/delete) — `StaffController` parity
- [ ] **Attendance**: `getAttendanceData` / `saveAttendance` / `getAttendanceReport` parity (table `staffAttendances` exists)

**Files:** `app/doctor/staff/*`, `app/doctor/staff/actions.ts`, `lib/queries/staff.ts` (new)

#### P4.4 Roles & Permissions (5 missing)
- [ ] Role CRUD (create/edit/delete) — `RoleController` parity
- [ ] `allPermissions` listing
- [ ] **Staff permission manager** — `StaffPermissionController` parity: list receptionists, get user permissions, save permissions (spatie `model_has_permissions` format)

**Files:** `app/doctor/roles/*`, `app/doctor/roles/actions.ts`

#### P4.5 Home Visits (1 missing)
- [ ] Patient details sidebar/drawer from home-visit row

**Files:** `app/doctor/home-visits/*`

---

### B.5 Phase P5 — Super Admin Module Completion (Priority 2)

#### P5.1 Super Admin CRUD (from read-only → full)
- [ ] **Doctor permissions sync** — `getDoctorPermissions` / `syncDoctorPermissions` parity
- [ ] **Toggle user status** (activate/deactivate) — `toggleUserStatus` parity
- [ ] Clinic full CRUD (store/update/delete/details)
- [ ] User full CRUD (store/update/getUserDetails) + status toggle
- [ ] **Master data CRUD + Excel import/export** — symptoms, examinations, diagnoses, lab tests, medicines (5 × [list+create+edit+delete+export+import])
- [ ] Category CRUD
- [ ] Blog CRUD (create/edit/delete)
- [ ] Support: close ticket
- [ ] **Support videos CRUD**
- [ ] Landing page section/item CRUD (update section metadata, store/update/delete items, image upload, reorder)
- [ ] Email setup: save SMTP (encrypt password)
- [ ] Company settings: save (not just read)
- [ ] FAQs page
- [ ] Dashboard settings page

**Files:** `app/super-admin/*`, `lib/queries/super-admin.ts`, `lib/queries/landing.ts`, `app/super-admin/actions.ts` (new)

---

### B.6 Phase P6 — Marketing / Public Completion (Priority 3)

- [ ] **P6.1** `bookDemo` → persist lead row + send notification email (currently `console.info` only)
- [ ] **P6.2** Vendor upload public page (part of P4.2)
- [ ] **P6.3** Support chat-bot AJAX routes parity (`/assistant/support/*`) — optional, low priority

**Files:** `app/(marketing)/contact/actions.ts`, `lib/db/schema.ts` (leads table)

---

### B.7 Phase P7 — Auth & Account Features (Priority 3)

- [ ] **P7.1** Doctor signup with role selection + trial period (`trial_ends_at`, from `companySettings.defaultTrialDays`) — parity with `RegistrationController`
- [ ] **P7.2** Trial-expired guard page + redirect (parity: `trialExpired`)
- [ ] **P7.3** Change password + profile photo upload
- [ ] **P7.4** Settings pages (parity: legacy `settings/*`): notification, signature, bank accounts, security, invoice settings, payment methods, tax rates, currencies, custom fields, integration — implement as a settings hub; gate behind doctor role
- [ ] **P7.5** Notifications: in-app notifications list + settings (legacy `notification-setting.php`)

**Files:** `app/(auth)/signup/*`, `app/(auth)/trial-expired/page.tsx` (new), `app/doctor/profile/*`, `app/doctor/settings/*` (new)

---

### B.8 Phase P8 — Legacy-only Extras (Priority 3 / Deferrable)

| Feature | Legacy source | Priority |
|---------|---------------|----------|
| Video call | `views/doctor/video-call.php` | Low (needs WebRTC/third-party) |
| Doctor FAQ page | `views/doctor/faq.php` | Low |
| Wallet | `views/doctor/wallet.php` | Low (needs payments) |
| Standalone prescription page | `views/doctor/prescription.php` | Medium |
| Online consultations page | `views/doctor/online-consultations.php` | Medium |
| Doctor notifications | `notification-setting.php` | Medium |

---

## Part C — Suggested Execution Order & Milestones

```
M0  Foundation (P1) + S1 auth hardening          → ~1 week
M1  CRITICAL security fixes (S2, S3.1–S3.3)      → ~1 week   (do before any feature work)
M2  Doctor clinical (P2): patients, appointments  → ~2 weeks
M3  Financial (P3): billing, income-expense       → ~1.5 weeks
M4  HIGH security (S4) + super-admin CRUD (P5)    → ~2 weeks
M5  Scheduling/test-bookings/staff/roles (P4)     → ~2.5 weeks
M6  Marketing + auth extras (P6, P7)              → ~2 weeks
M7  Legacy extras (P8) + final parity re-check    → ~1.5 weeks
```

**Guiding rule:** Security fixes (Part A) are a hard prerequisite for every feature milestone — every new feature ships with auth checks, zod validation, ownership scoping, and audit logging by default.

---

## Part D — Verification Checklist

- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] Legacy parity walkthrough per module (use this doc as checklist)
- [ ] Security re-audit: 0 CRITICAL, 0 HIGH findings
- [ ] Manual IDOR tests (cross-doctor/patient access denied)
- [ ] Uploads verified non-public for PHI
- [ ] Rate limits trigger correctly
- [ ] `.env` contains rotated secret; `.env.example` committed
